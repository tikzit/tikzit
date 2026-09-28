import { describe, expect, it, vi } from 'vitest';
import { AgentDid, MCard, MCardCollection, textPayload, type SqlJsBackend } from 'clm-kernel';
import { createMemoryTriDatabase, createSqlJsTriDatabase } from '../../../src/services/clm/sqliteRuntime';
import { registerTikzTriad } from '../../../src/services/clm/triadDefinition';

describe('SQLite runtime backend construction', () => {
  it('creates isolated MemoryBackend instances for hermetic runtimes', () => {
    const runtime = createMemoryTriDatabase();
    expect(new Set(runtime.backends).size).toBe(3);
    runtime.close();
  });

  it('keeps pillar writes isolated and rolls back all three pillars to a savepoint', () => {
    const runtime = createMemoryTriDatabase();
    const author = AgentDid.create('did:clm:test');
    const baseline = MCard.create('tikzit://baseline', textPayload('baseline'), author, 0);
    runtime.triDb.knowledge.putCard(baseline);
    const savepoint = runtime.triDb.savepoint('sprint15');
    const knowledgeCard = MCard.create('tikzit://knowledge', textPayload('knowledge'), author, 1);
    const receiptCard = MCard.create('tikzit://receipt', textPayload('receipt'), author, 1);
    const documentCard = MCard.create('tikzit://document', textPayload('document'), author, 1);
    runtime.triDb.knowledge.putCard(knowledgeCard);
    runtime.triDb.executionLog.putCard(receiptCard);
    runtime.triDb.mcard.putCard(documentCard);

    expect(runtime.triDb.knowledge.get(receiptCard.hash)).toBeUndefined();
    expect(runtime.triDb.executionLog.get(documentCard.hash)).toBeUndefined();
    runtime.triDb.rollback(savepoint);
    expect(runtime.triDb.knowledge.get(baseline.hash)).toBeDefined();
    expect(runtime.triDb.knowledge.get(knowledgeCard.hash)).toBeUndefined();
    expect(runtime.triDb.executionLog.get(receiptCard.hash)).toBeUndefined();
    expect(runtime.triDb.mcard.get(documentCard.hash)).toBeUndefined();
    runtime.close();
  });

  it('rejects corrupt pillar bytes instead of silently creating empty databases', async () => {
    const runtime = await createSqlJsTriDatabase();
    const bytes = runtime.backends.map((backend: SqlJsBackend) => backend.exportBinary()!);
    runtime.close();

    await expect(createSqlJsTriDatabase({
      pillars: { knowledge: bytes[0], executionLog: bytes[1], mcard: new Uint8Array([1, 2, 3]) },
    })).rejects.toThrow();
  });

  it('rehydrates triad structured cards without changing their hashes', async () => {
    const runtime = await createSqlJsTriDatabase();
    registerTikzTriad(runtime.triDb, AgentDid.create('did:clm:test'));
    const bytes = runtime.backends.map((backend: SqlJsBackend) => backend.exportBinary()!);
    runtime.close();

    const restored = await createSqlJsTriDatabase({
      pillars: { knowledge: bytes[0], executionLog: bytes[1], mcard: bytes[2] },
    });
    expect(restored.backends[0].list()).toHaveLength(4);
    restored.close();
  });

  it('initializes three separate sql.js databases and restores card handles from bytes', async () => {
    const first = await createSqlJsTriDatabase();
    const collection = MCardCollection.fromFileSystem(first.triDb.mcard);
    const card = MCard.create(
      'tikzit://diagram/persisted',
      textPayload('source'),
      AgentDid.create('did:clm:test'),
      0,
    );
    collection.putWithHandle(card, 'zx:examples:persisted');
    const bytes = first.backends.map((backend: SqlJsBackend) => backend.exportBinary()!);
    expect(new Set(first.backends).size).toBe(3);
    expect(new Set(first.databases).size).toBe(3);
    first.close();

    const restored = await createSqlJsTriDatabase({
      pillars: { knowledge: bytes[0], executionLog: bytes[1], mcard: bytes[2] },
    });
    const restoredCollection = MCardCollection.fromFileSystem(restored.triDb.mcard);
    expect(restoredCollection.resolveHandle('zx:examples:persisted')?.asHex()).toBe(card.hash.asHex());
    expect(restoredCollection.get(card.hash)?.payload).toEqual(card.payload);
    restored.close();
  });

  it('closes each sql.js database exactly once across repeated dispose calls', async () => {
    const runtime = await createSqlJsTriDatabase();
    const spies = runtime.backends.map((backend: SqlJsBackend) => vi.spyOn(backend, 'close'));

    runtime.close();
    runtime.close();

    for (const spy of spies) {
      expect(spy).toHaveBeenCalledTimes(1);
    }
  });
});
