/**
 * tests/unit/clm/CollectionSnapshotWriter.test.ts - Sprint 23
 * Tests T23-19 to T23-24: SQLite database initialization, table population, schema validation, and snapshot writing.
 */
import { describe, it, expect } from 'vitest';
import { AgentDid, MCard, textPayload } from 'clm-kernel';
import {
  CollectionSnapshotWriter,
  isSqlite3Binary,
  assertRequiredTables,
} from '../../../src/services/clm/CollectionSnapshotWriter';
import type { VerifiedLineage } from '../../../src/services/clm/LineageTraversalEngine';

describe('CollectionSnapshotWriter (Sprint 23: T23-19 to T23-24)', () => {
  const authorDid = AgentDid.create('did:key:z6MkhaXgBZDvotDkL5257faiz4zMrAZshGWDSPEd81AwtRnU');

  function makeSampleLineage(): VerifiedLineage {
    const card1 = MCard.create('tikzit://diagram/1', textPayload('\\begin{tikzpicture}\\end{tikzpicture}'), authorDid, 0);
    const cards = new Map<string, MCard>([[card1.hash.asHex(), card1]]);
    const handleHeads = new Map<string, string>([['zx:diagrams:sample', card1.hash.asHex()]]);
    const histories = [
      {
        handle: 'zx:diagrams:sample',
        previousHash: card1.hash.asHex(),
        changedAt: new Date().toISOString(),
      },
    ];
    return { cards, handleHeads, histories };
  }

  it('T23-19: initializes sqlite database and validates sqlite3 binary header', async () => {
    const writer = new CollectionSnapshotWriter();
    const lineage = makeSampleLineage();
    const artifact = await writer.writeSnapshot(lineage, 'test.db');

    expect(artifact.bytes).toBeInstanceOf(Uint8Array);
    expect(isSqlite3Binary(artifact.bytes)).toBe(true);
    expect(isSqlite3Binary(new Uint8Array([1, 2, 3]))).toBe(false);
  });

  it('T23-20: populates card, handle_registry, and handle_history tables', async () => {
    const writer = new CollectionSnapshotWriter();
    const lineage = makeSampleLineage();
    const artifact = await writer.writeSnapshot(lineage, 'test.db');

    const { initializeSqlJs } = await import('../../../src/services/clm/sqliteRuntime');
    const SQL = await initializeSqlJs();
    const db = new SQL.Database(artifact.bytes);

    const cardRes = db.exec('SELECT count(*) FROM card');
    expect(cardRes[0]?.values[0]?.[0]).toBe(1);

    const handleRes = db.exec('SELECT count(*) FROM handle_registry');
    expect(handleRes[0]?.values[0]?.[0]).toBe(1);

    const histRes = db.exec('SELECT count(*) FROM handle_history');
    expect(histRes[0]?.values[0]?.[0]).toBe(1);

    db.close();
  });

  it('T23-21: asserts required tables exist in database schema', () => {
    const mockDbMissing: any = {
      exec: () => [{ values: [['card'], ['handle_registry']] }],
    };
    expect(() => assertRequiredTables(mockDbMissing)).toThrow(/SQLite schema is missing handle_history/);

    const mockDbComplete: any = {
      exec: () => [{ values: [['card'], ['handle_registry'], ['handle_history']] }],
    };
    expect(() => assertRequiredTables(mockDbComplete)).not.toThrow();
  });

  it('T23-22: verifies exported card count matches input collection', async () => {
    const writer = new CollectionSnapshotWriter();
    const lineage = makeSampleLineage();
    const artifact = await writer.writeSnapshot(lineage, 'test.db');

    expect(artifact.cardCount).toBe(1);
  });

  it('T23-23: produces deterministic manifestDigest for identical snapshots', async () => {
    const writer = new CollectionSnapshotWriter();
    const lineage1 = makeSampleLineage();
    const lineage2 = {
      ...lineage1,
      histories: [{ ...lineage1.histories[0] }],
    };

    const artifact1 = await writer.writeSnapshot(lineage1, 'test.db');
    const artifact2 = await writer.writeSnapshot(lineage2, 'test.db');

    expect(artifact1.manifestDigest).toBe(artifact2.manifestDigest);
    expect(artifact1.manifestDigest).toHaveLength(64);
  });

  it('T23-24: respects custom filename or defaults to provided filename', async () => {
    const writer = new CollectionSnapshotWriter();
    const lineage = makeSampleLineage();
    const artifact = await writer.writeSnapshot(lineage, 'custom-export-2026.db');

    expect(artifact.filename).toBe('custom-export-2026.db');
  });
});
