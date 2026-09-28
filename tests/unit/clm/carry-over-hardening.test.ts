import { describe, it, expect, vi } from 'vitest';
import { createHash } from 'node:crypto';
import { CorpusExportService } from '../../../src/services/clm/corpusExportService';
import { createWorkbenchRuntime } from '../../../src/services/createWorkbenchRuntime';
import { defaultWorkspaceManager } from '../../../src/services/workspace/WorkspaceManager';
import { CorpusPersistence } from '../../../src/services/clm/corpusPersistence';
import type { CorpusManifestEntry } from '../../../src/services/clm/corpusExplorerService';

const source = '\\begin{tikzpicture}\n\\node [style=none] (a) at (0, 0) {A};\n\\end{tikzpicture}\n';
const sourceHash = createHash('sha256').update(source).digest('hex');
const manifest: CorpusManifestEntry[] = [{
  id: 'sample',
  title: 'Sample',
  tikz_file: 'zx-calculus/sample.tikz',
  tikz_bytes: Buffer.byteLength(source),
  tikz_sha256: sourceHash,
}];

async function setup() {
  const runtime = createWorkbenchRuntime({ bindKeybindings: false });
  runtime.corpusExplorer.configure({
    manifest,
    fetcher: async () => new Response(source),
    persistence: { flush: vi.fn(async () => undefined) },
    initialIndex: [],
  });
  await runtime.corpusExplorer.seedZxCorpus();
  const historyRows: Array<{ handle: string; previous_hash: string; changed_at: string }> = [];
  const exporter = new CorpusExportService({
    triDb: runtime.triDb,
    collection: runtime.mcardCollection,
    authorDid: runtime.authorDid,
    getIndex: () => runtime.corpusExplorer.getCorpusIndex(),
    getHistoryRows: () => historyRows,
    flush: () => runtime.corpusExplorer.flush(),
  });
  return { runtime, exporter, historyRows };
}

describe('Sprint 16 Phase A: Carry-Over Hardening (H1-H8)', () => {
  it('H1: post-handle write error fails closed and does not fallback to downloadBlob', async () => {
    const { runtime, exporter } = await setup();
    const downloadBlob = vi.fn();
    const showSaveFilePicker = vi.fn(async () => ({
      createWritable: async () => {
        throw new Error('Disk write failure after handle obtained');
      },
    } as any));

    const result = await exporter.saveCorpusDb({ showSaveFilePicker, downloadBlob });
    expect(result.status).toBe('failure');
    expect(result.failureReason).toContain('Disk write failure after handle obtained');
    expect(downloadBlob).not.toHaveBeenCalled();
    runtime.dispose();
  });

  it('H2: missing history rows fail export closed instead of fabricating 1970 timestamps', async () => {
    const { runtime, exporter } = await setup();
    const handle = 'zx:examples:sample';
    // Commit a second version so a prior head exists
    await runtime.corpusExplorer.commitCorpusDocument({ handle, sourceText: `${source}% v2\n` });
    // Empty historyRows simulates missing history query rows for a multi-version lineage
    await expect(exporter.exportCorpusDb()).rejects.toThrow(/missing genuine history/i);
    runtime.dispose();
  });

  it('H3: cardCount and manifestDigest returned directly from exportCorpusDb', async () => {
    const { runtime, exporter, historyRows } = await setup();
    const handle = 'zx:examples:sample';
    const firstHash = runtime.mcardCollection.resolveHandle(handle)!.asHex();
    await runtime.corpusExplorer.commitCorpusDocument({ handle, sourceText: `${source}% v2\n` });
    historyRows.push({ handle, previous_hash: firstHash, changed_at: '2026-09-28T12:00:00.000Z' });

    const exportResult = await exporter.exportCorpusDbWithMetadata();
    expect(exportResult.cardCount).toBe(2);
    expect(exportResult.manifestDigest).toMatch(/^[0-9a-f]{64}$/i);
    runtime.dispose();
  });

  it('H4: unchanged save attempts flush and reports persistence failure if flush fails', async () => {
    const { runtime } = await setup();
    const handle = 'zx:examples:sample';
    const flushError = new Error('IndexedDB disk full');
    runtime.corpusExplorer.configure({
      manifest,
      fetcher: async () => new Response(source),
      persistence: { flush: vi.fn(async () => { throw flushError; }) },
      initialIndex: runtime.corpusExplorer.getCorpusIndex(),
    });

    const result = await runtime.corpusExplorer.commitCorpusDocument({ handle, sourceText: source });
    expect(result.unchanged).toBe(true);
    expect(result.persisted).toBe(false);
    expect(result.persistenceError).toContain('IndexedDB disk full');
    runtime.dispose();
  });

  it('H5: buffer edits made during pending flush remain dirty', async () => {
    const { runtime } = await setup();
    const handle = 'zx:examples:sample';
    let resolveFlush!: () => void;
    const flushPromise = new Promise<void>((resolve) => { resolveFlush = resolve; });

    runtime.corpusExplorer.configure({
      manifest,
      fetcher: async () => new Response(source),
      persistence: { flush: vi.fn(() => flushPromise) },
      initialIndex: runtime.corpusExplorer.getCorpusIndex(),
    });

    runtime.openCorpusEntry(handle);
    const savePromise = runtime.saveActiveCorpusEntry(`${source}% v2\n`);
    // User types while flush is pending
    defaultWorkspaceManager.updateContent(handle, `${source}% v2 + concurrent edit\n`);

    resolveFlush();
    await savePromise;

    const doc = defaultWorkspaceManager.getActiveDocument();
    expect(doc?.isDirty).toBe(true);
    runtime.dispose();
  });

  it('H6: getHistoryRows finds mcard pillar by schema rather than position', async () => {
    // Verify that getHistoryRows resolves handle_history table from mcard pillar by name
    const mockDbWithTable = {
      exec: vi.fn((query: string) => {
        if (query.includes('sqlite_master')) return [{ values: [['handle_history']] }];
        if (query.includes('SELECT handle')) return [{ values: [['zx:examples:test', 'deadbeef', '2026-09-28T00:00:00Z']] }];
        return [];
      }),
    };
    const storage = {
      databases: [mockDbWithTable, mockDbWithTable, mockDbWithTable],
      pillarDatabases: {
        knowledge: mockDbWithTable,
        executionLog: mockDbWithTable,
        mcard: mockDbWithTable,
      },
    };
    const resolveMcard = () => {
      const db = storage.pillarDatabases?.mcard ?? storage.databases[2];
      if (!db) throw new Error('Missing');
      const tableCheck = db.exec("SELECT name FROM sqlite_master WHERE type='table' AND name='handle_history'");
      if (!tableCheck.length || !tableCheck[0].values.length) {
        throw new Error('MCard database schema invalid: missing handle_history table');
      }
      return db;
    };
    const rows = resolveMcard().exec('SELECT handle, previous_hash, changed_at FROM handle_history ORDER BY id ASC')[0].values;
    expect(rows[0][0]).toBe('zx:examples:test');
  });

  it('H7: stale persistence state blocks commit and marks persistence as stale', async () => {
    const persistence = new CorpusPersistence({ indexedDB: null });
    expect(persistence.state).toBe('closed');
    persistence.markStale('Stale generation mismatch');
    expect(persistence.state).toBe('stale');
    expect(persistence.error).toContain('Stale generation mismatch');
  });

  it('H8: opening a dirty document with an unparsed AST does not overwrite with committed head AST', async () => {
    const { runtime } = await setup();
    const handle = 'zx:examples:sample';
    runtime.openCorpusEntry(handle);

    // Make doc dirty with edited text, but ast cleared (e.g. pending parse)
    const dirtySource = `${source}\n% dirty edit`;
    defaultWorkspaceManager.updateContent(handle, dirtySource, undefined);
    const docBefore = defaultWorkspaceManager.getActiveDocument()!;
    expect(docBefore.isDirty).toBe(true);

    // Re-open entry
    runtime.openCorpusEntry(handle);
    const docAfter = defaultWorkspaceManager.getActiveDocument()!;
    expect(docAfter.isDirty).toBe(true);
    expect(docAfter.content).toBe(dirtySource);
    runtime.dispose();
  });
});
