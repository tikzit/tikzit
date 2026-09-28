/**
 * src/services/clm/CollectionSnapshotWriter.ts - Sprint 23
 * SQLite database initialization, table population, schema validation, and binary export.
 * Target: <= 150 LOC.
 */
import { ContentHash, Handle, SqlJsBackend } from 'clm-kernel';
import type { SqlJsDatabaseLike } from 'clm-kernel/layer0';
import type { VerifiedLineage } from './LineageTraversalEngine';

export interface CorpusExportArtifact {
  bytes: Uint8Array;
  cardCount: number;
  manifestDigest: string;
  filename: string;
}

export function isSqlite3Binary(bytes: Uint8Array): boolean {
  return bytes.length >= 16 && new TextDecoder().decode(bytes.subarray(0, 16)) === 'SQLite format 3\0';
}

export function assertRequiredTables(database: SqlJsDatabaseLike): void {
  const tables = new Set(database.exec("SELECT name FROM sqlite_master WHERE type='table'")[0]?.values.map(([name]) => String(name)) ?? []);
  for (const table of ['card', 'handle_registry', 'handle_history']) {
    if (!tables.has(table)) throw new Error(`SQLite schema is missing ${table}`);
  }
}

export class CollectionSnapshotWriter {
  async writeSnapshot(lineage: VerifiedLineage, filename: string): Promise<CorpusExportArtifact> {
    const { initializeSqlJs } = await import('./sqliteRuntime');
    const SQL = await initializeSqlJs();
    const database = new SQL.Database();
    const backend = new SqlJsBackend(database as unknown as SqlJsDatabaseLike);

    try {
      for (const card of lineage.cards.values()) {
        backend.put(card.hash, card);
      }
      for (const [handle, hash] of lineage.handleHeads) {
        backend.registerHandle(Handle.parse(handle), ContentHash.parse(hash));
      }
      for (const history of lineage.histories) {
        database.run(
          'INSERT INTO handle_history (handle, previous_hash, changed_at) VALUES (?, ?, ?)',
          [history.handle, history.previousHash, history.changedAt],
        );
      }

      assertRequiredTables(database as unknown as SqlJsDatabaseLike);

      if (backend.count() !== lineage.cards.size) {
        throw new Error('Exported card count does not match verified corpus');
      }
      for (const [handle, hash] of lineage.handleHeads) {
        if (backend.resolveHandle(Handle.parse(handle))?.asHex() !== hash) {
          throw new Error(`Exported handle mismatch for handle ${handle}`);
        }
      }

      const bytes = backend.exportBinary();
      if (!bytes || !isSqlite3Binary(bytes)) {
        throw new Error('Export did not produce a SQLite 3 database');
      }

      const sortedHandles = Array.from(lineage.handleHeads.entries()).sort(([a], [b]) => a.localeCompare(b));
      const manifestDigest = ContentHash.computeString(
        JSON.stringify({
          handles: sortedHandles,
          cardCount: lineage.cards.size,
          historyCount: lineage.histories.length,
        })
      ).asHex();

      return {
        bytes: new Uint8Array(bytes),
        cardCount: lineage.cards.size,
        manifestDigest,
        filename,
      };
    } finally {
      backend.close();
    }
  }
}
