export const CORPUS_DATABASE_NAME = 'tikzit_corpus_db';
export const CORPUS_INDEXEDDB_SCHEMA_VERSION = 1;
export const CORPUS_SNAPSHOT_VERSION = 2;
const SNAPSHOT_STORE = 'snapshots';
const SNAPSHOT_KEY = 'current';

export function isDiagramHandle(handle: string): boolean {
  return typeof handle === 'string' && (handle.startsWith('zx:examples:') || handle.startsWith('zx:diagrams:'));
}

export interface CorpusIndexRecord {
  handle: string;
  hash: string;
  committedAt: number;
  title?: string;
  archived?: boolean;
}

export interface CorpusSnapshotInput {
  generation: number;
  pillars: {
    knowledge: Uint8Array;
    executionLog: Uint8Array;
    mcard: Uint8Array;
  };
  corpusIndex: CorpusIndexRecord[];
}

export interface CorpusSnapshot extends CorpusSnapshotInput {
  version: number;
  savedAt: number;
}

export type CorpusPersistenceState = 'closed' | 'persistent' | 'non-persistent' | 'recovery-required' | 'stale';

export interface CorpusPersistenceOptions {
  databaseName?: string;
  indexedDB?: IDBFactory | null;
}

export function validateSnapshot(value: unknown): CorpusSnapshot {
  if (!value || typeof value !== 'object') throw new Error('Corrupt corpus snapshot');
  const snapshot = value as CorpusSnapshot;
  if (snapshot.version !== 1 && snapshot.version !== CORPUS_SNAPSHOT_VERSION) {
    throw new Error(`Unsupported corpus snapshot version: ${String(snapshot.version)}`);
  }
  if (!Number.isInteger(snapshot.generation) || snapshot.generation < 0) throw new Error('Invalid snapshot generation');
  for (const pillar of ['knowledge', 'executionLog', 'mcard'] as const) {
    if (!(snapshot.pillars?.[pillar] instanceof Uint8Array)) throw new Error(`Corrupt ${pillar} snapshot bytes`);
  }
  if (!Array.isArray(snapshot.corpusIndex)) throw new Error('Corrupt corpus handle index');
  for (const row of snapshot.corpusIndex) {
    if (
      typeof row?.handle !== 'string' ||
      !isDiagramHandle(row.handle) ||
      !/^[0-9a-f]{64}$/i.test(row.hash) ||
      !Number.isFinite(row.committedAt) ||
      (row.title !== undefined && typeof row.title !== 'string') ||
      (row.archived !== undefined && typeof row.archived !== 'boolean')
    ) throw new Error('Malformed corpus handle index row');
  }
  return { ...snapshot, version: CORPUS_SNAPSHOT_VERSION };
}


function requestResult<T>(request: IDBRequest<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error ?? new Error('IndexedDB request failed'));
  });
}

export class CorpusPersistence {
  private readonly databaseName: string;
  private readonly indexedDBFactory: IDBFactory | null;
  private database?: IDBDatabase;
  private generation = 0;
  private snapshot: CorpusSnapshot | null = null;
  private writeQueue: Promise<unknown> = Promise.resolve();
  state: CorpusPersistenceState = 'closed';
  error?: string;

  constructor(options: CorpusPersistenceOptions = {}) {
    this.databaseName = options.databaseName ?? CORPUS_DATABASE_NAME;
    this.indexedDBFactory = options.indexedDB === undefined
      ? (typeof indexedDB === 'undefined' ? null : indexedDB)
      : options.indexedDB;
  }

  async open(): Promise<void> {
    if (!this.indexedDBFactory) {
      this.state = 'non-persistent';
      this.error = 'IndexedDB is unavailable';
      return;
    }
    try {
      this.database = await new Promise<IDBDatabase>((resolve, reject) => {
        const request = this.indexedDBFactory!.open(this.databaseName, CORPUS_INDEXEDDB_SCHEMA_VERSION);
        request.onupgradeneeded = () => {
          if (!request.result.objectStoreNames.contains(SNAPSHOT_STORE)) request.result.createObjectStore(SNAPSHOT_STORE);
        };
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error ?? new Error('Could not open IndexedDB'));
        request.onblocked = () => reject(new Error('IndexedDB upgrade is blocked by another tab'));
      });
      this.database.onversionchange = () => this.database?.close();
      this.snapshot = await this.readFromDatabase();
      this.generation = this.snapshot?.generation ?? 0;
      this.state = 'persistent';
      this.error = undefined;
    } catch (error) {
      this.state = 'recovery-required';
      this.error = error instanceof Error ? error.message : String(error);
      throw error;
    }
  }

  markStale(reason?: string): void {
    this.state = 'stale';
    this.error = reason ?? 'Corpus persistence is stale; another session wrote changes';
  }

  async readSnapshot(): Promise<CorpusSnapshot | null> {
    if (this.state === 'stale') throw new Error(this.error ?? 'Corpus persistence is stale');
    if (this.state === 'recovery-required') throw new Error('Corpus snapshot requires recovery');
    if (this.state === 'non-persistent') return null;
    if (!this.database) throw new Error('Corpus persistence is not open');
    this.snapshot = await this.readFromDatabase();
    if (this.snapshot) this.generation = this.snapshot.generation;
    return this.snapshot;
  }

  writeSnapshot(input: CorpusSnapshotInput): Promise<CorpusSnapshot> {
    const write = this.writeQueue.then(() => this.writeSnapshotNow(input));
    this.writeQueue = write.catch(() => undefined);
    return write;
  }

  private async writeSnapshotNow(input: CorpusSnapshotInput): Promise<CorpusSnapshot> {
    if (this.state === 'stale') throw new Error(this.error ?? 'Persistent storage is stale; reload required');
    if (this.state === 'non-persistent' || !this.database) throw new Error('Persistent storage is unavailable');
    if (this.state !== 'persistent') throw new Error('Corpus snapshot requires recovery');
    const next = validateSnapshot({ ...input, version: CORPUS_SNAPSHOT_VERSION, savedAt: Date.now() });
    return new Promise<CorpusSnapshot>((resolve, reject) => {
      const tx = this.database!.transaction(SNAPSHOT_STORE, 'readwrite');
      const store = tx.objectStore(SNAPSHOT_STORE);
      const requests: IDBRequest[] = [];
      const currentRequest = store.get(SNAPSHOT_KEY);
      requests.push(currentRequest);
      let stale = false;
      currentRequest.onsuccess = () => {
        try {
          const current = currentRequest.result === undefined ? null : validateSnapshot(currentRequest.result);
          const actualGeneration = current?.generation ?? 0;
          if (actualGeneration !== this.generation) {
            stale = true;
            tx.abort();
            return;
          }
          const value = { ...next, generation: actualGeneration + 1 };
          requests.push(store.put(value, SNAPSHOT_KEY));
          tx.oncomplete = () => {
            this.snapshot = value;
            this.generation = value.generation;
            resolve(value);
          };
        } catch (error) {
          stale = true;
          tx.abort();
          reject(error);
        }
      };
      tx.onabort = () => {
        if (stale) {
          this.markStale('Stale corpus snapshot writer rejected');
          reject(new Error('Stale corpus snapshot writer rejected'));
        } else {
          this.state = 'non-persistent';
          this.error = tx.error?.message ?? 'IndexedDB snapshot transaction aborted';
          reject(new Error(this.error));
        }
      };
      tx.onerror = () => {
        if (stale) {
          this.markStale('Stale corpus snapshot writer rejected');
          reject(new Error('Stale corpus snapshot writer rejected'));
          return;
        }
        this.state = 'non-persistent';
        const cause = tx.error ?? requests.map((request) => request.error).find(Boolean);
        this.error = cause?.name === 'AbortError'
          ? 'IndexedDB snapshot transaction aborted'
          : cause?.message ?? 'IndexedDB snapshot transaction failed';
        reject(new Error(this.error));
      };

    });
  }

  private async readFromDatabase(): Promise<CorpusSnapshot | null> {
    const tx = this.database!.transaction(SNAPSHOT_STORE, 'readonly');
    const value = await requestResult(tx.objectStore(SNAPSHOT_STORE).get(SNAPSHOT_KEY));
    return value === undefined ? null : validateSnapshot(value);
  }

  async close(): Promise<void> {
    await this.writeQueue;
    this.database?.close();
    this.database = undefined;
    if (this.state !== 'recovery-required') this.state = 'closed';
  }
}
