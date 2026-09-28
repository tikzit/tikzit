import initSqlJs from 'sql.js';
import wasmUrl from 'sql.js/dist/sql-wasm.wasm?url';
import {
  MCard,
  MemoryBackend,
  SqlJsBackend,
  TriDatabaseManager,
} from 'clm-kernel';
import type { SqlJsDatabaseLike } from 'clm-kernel/layer0';
import type { CorpusSnapshot } from './corpusPersistence';

type SqlJsDatabase = InstanceType<Awaited<ReturnType<typeof initSqlJs>>['Database']>;

interface TriDatabaseRuntimeBase {
  triDb: TriDatabaseManager;
  databases: SqlJsDatabase[];
  close(): void;
}

export interface SqlJsTriDatabaseRuntime extends TriDatabaseRuntimeBase {
  backends: [SqlJsBackend, SqlJsBackend, SqlJsBackend];
  pillarDatabases: Record<'knowledge' | 'executionLog' | 'mcard', SqlJsDatabase>;
}

export interface MemoryTriDatabaseRuntime extends TriDatabaseRuntimeBase {
  backends: [MemoryBackend, MemoryBackend, MemoryBackend];
}

export type TriDatabaseRuntime = SqlJsTriDatabaseRuntime | MemoryTriDatabaseRuntime;

let sqlJsPromise: ReturnType<typeof initSqlJs> | undefined;

export function initializeSqlJs() {
  if (!sqlJsPromise) {
    const wasmPath = typeof window === 'undefined'
      ? new URL('../../../node_modules/sql.js/dist/sql-wasm.wasm', import.meta.url).pathname
      : wasmUrl;
    const pending = initSqlJs({ locateFile: () => wasmPath });
    sqlJsPromise = pending;
    pending.catch(() => {
      if (sqlJsPromise === pending) sqlJsPromise = undefined;
    });
  }
  return sqlJsPromise;
}

function verifyDatabase(db: SqlJsDatabase, backend: SqlJsBackend): void {
  const tables = new Set(db.exec("SELECT name FROM sqlite_master WHERE type='table'")[0]?.values.map(([name]) => String(name)) ?? []);
  for (const table of ['card', 'handle_registry', 'handle_history']) {
    if (!tables.has(table)) throw new Error(`Invalid CLM database schema: missing ${table}`);
  }
  for (const card of backend.list()) {
    if (!MCard.create(card.uri, card.payload, card.author, card.sequence).hash.equals(card.hash)) {
      throw new Error(`Invalid MCard content hash: ${card.hash.asHex()}`);
    }
  }
}

export async function createSqlJsTriDatabase(
  snapshot?: Pick<CorpusSnapshot, 'pillars'> | null,
): Promise<SqlJsTriDatabaseRuntime> {
  const SQL = await initializeSqlJs();
  const pillarNames = ['knowledge', 'executionLog', 'mcard'] as const;
  const databases: SqlJsDatabase[] = [];
  const pillarDatabases = {} as Record<'knowledge' | 'executionLog' | 'mcard', SqlJsDatabase>;
  try {
    for (const name of pillarNames) {
      const bytes = snapshot?.pillars[name];
      const db = new SQL.Database(bytes ? new Uint8Array(bytes) : undefined);
      databases.push(db);
      pillarDatabases[name] = db;
    }
  } catch (error) {
    databases.forEach((database) => database.close());
    throw error;
  }
  let backends: SqlJsTriDatabaseRuntime['backends'];
  try {
    backends = [
      new SqlJsBackend(databases[0] as unknown as SqlJsDatabaseLike),
      new SqlJsBackend(databases[1] as unknown as SqlJsDatabaseLike),
      new SqlJsBackend(databases[2] as unknown as SqlJsDatabaseLike),
    ];
  } catch (error) {
    databases.forEach((database) => database.close());
    throw error;
  }
  try {
    databases.forEach((database, index) => verifyDatabase(database, backends[index] as SqlJsBackend));
  } catch (error) {
    backends.forEach((backend) => backend.close());
    throw error;
  }
  let closed = false;
  return {
    triDb: TriDatabaseManager.withBackends({
      knowledge: backends[0],
      executionLog: backends[1],
      mcard: backends[2],
    }),
    backends,
    databases,
    pillarDatabases,
    close() {
      if (closed) return;
      closed = true;
      backends.forEach((backend) => backend.close());
    },
  };
}

export function createMemoryTriDatabase(): MemoryTriDatabaseRuntime {
  const backends: [MemoryBackend, MemoryBackend, MemoryBackend] = [
    new MemoryBackend(),
    new MemoryBackend(),
    new MemoryBackend(),
  ];
  return {
    triDb: TriDatabaseManager.withBackends({
      knowledge: backends[0],
      executionLog: backends[1],
      mcard: backends[2],
    }),
    backends,
    databases: [],
    close() {},
  };
}
