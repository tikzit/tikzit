import { beforeEach, describe, expect, it } from 'vitest';
import { IDBFactory } from 'fake-indexeddb';
import { CorpusPersistence, type CorpusSnapshotInput } from '../../../src/services/clm/corpusPersistence';

const index = [{
  handle: 'zx:examples:sample',
  hash: 'a'.repeat(64),
  committedAt: 123,
}];

function snapshot(generation = 0): CorpusSnapshotInput {
  return {
    generation,
    pillars: {
      knowledge: new Uint8Array([1, 2]),
      executionLog: new Uint8Array([3]),
      mcard: new Uint8Array([4, 5, 6]),
    },
    corpusIndex: index,
  };
}

describe('CorpusPersistence', () => {
  let factory: IDBFactory;
  let name: string;

  beforeEach(() => {
    factory = new IDBFactory();
    name = `tikzit-corpus-${Math.random().toString(36).slice(2)}`;
  });

  it('opens empty storage and atomically round-trips all three pillars and the corpus index', async () => {
    const persistence = new CorpusPersistence({ indexedDB: factory, databaseName: name });
    await persistence.open();

    expect(persistence.state).toBe('persistent');
    expect(await persistence.readSnapshot()).toBeNull();

    const written = await persistence.writeSnapshot(snapshot());
    expect(written.generation).toBe(1);
    expect(written.pillars).toEqual(snapshot().pillars);
    expect(written.corpusIndex).toEqual(index);

    const reopened = new CorpusPersistence({ indexedDB: factory, databaseName: name });
    await reopened.open();
    expect(await reopened.readSnapshot()).toEqual(written);
    await persistence.close();
    await reopened.close();
  });

  it('serializes overlapping writes and advances the generation without losing the last snapshot', async () => {
    const persistence = new CorpusPersistence({ indexedDB: factory, databaseName: name });
    await persistence.open();
    const first = snapshot();
    const second = snapshot();
    second.pillars.mcard = new Uint8Array([9, 8, 7]);

    const [writtenFirst, writtenSecond] = await Promise.all([
      persistence.writeSnapshot(first),
      persistence.writeSnapshot(second),
    ]);

    expect([writtenFirst.generation, writtenSecond.generation]).toEqual([1, 2]);
    expect((await persistence.readSnapshot())?.pillars.mcard).toEqual(second.pillars.mcard);
    await persistence.close();
  });

  it('marks aborted IndexedDB writes non-persistent and never reports success', async () => {
    const persistence = new CorpusPersistence({ indexedDB: factory, databaseName: name });
    await persistence.open();
    const db = (persistence as unknown as { database: IDBDatabase }).database;
    const transaction = db.transaction.bind(db);
    db.transaction = ((...args: Parameters<IDBDatabase['transaction']>) => {
      const active = transaction(...args);
      queueMicrotask(() => {
        try { active.abort(); } catch {}
      });
      return active;
    }) as IDBDatabase['transaction'];

    await expect(persistence.writeSnapshot(snapshot())).rejects.toThrow(/abort/i);
    expect(persistence.state).toBe('non-persistent');
    await persistence.close();
  });

  it('rejects a stale second-tab writer instead of overwriting a newer snapshot', async () => {
    const first = new CorpusPersistence({ indexedDB: factory, databaseName: name });
    const second = new CorpusPersistence({ indexedDB: factory, databaseName: name });
    await Promise.all([first.open(), second.open()]);

    await first.writeSnapshot(snapshot());
    await expect(second.writeSnapshot(snapshot())).rejects.toThrow(/stale/i);
    expect((await first.readSnapshot())?.generation).toBe(1);
    await first.close();
    await second.close();
  });

  it('marks IndexedDB absence as non-persistent and never reports a successful write', async () => {
    const persistence = new CorpusPersistence({ indexedDB: null, databaseName: name });
    await persistence.open();

    expect(persistence.state).toBe('non-persistent');
    await expect(persistence.writeSnapshot(snapshot())).rejects.toThrow(/unavailable/i);
  });

  it('preserves and reports a future-version snapshot instead of replacing it', async () => {
    const persistence = new CorpusPersistence({ indexedDB: factory, databaseName: name });
    await persistence.open();
    await persistence.close();
    const db = await new Promise<IDBDatabase>((resolve, reject) => {
      const request = factory.open(name, 1);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction('snapshots', 'readwrite');
      tx.objectStore('snapshots').put({ ...snapshot(), version: 999 }, 'current');
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
    db.close();

    const reopened = new CorpusPersistence({ indexedDB: factory, databaseName: name });
    await expect(reopened.open()).rejects.toThrow(/version/i);
    expect(reopened.state).toBe('recovery-required');
    await expect(reopened.readSnapshot()).rejects.toThrow(/recovery/i);
    await persistence.close();
    await reopened.close();
  });
});
