import { createHash } from 'node:crypto';
import { ContentHash, MCard, parsePortableSqlite } from 'clm-kernel';
import { describe, expect, it, vi } from 'vitest';
import { createWorkbenchRuntime } from '../../../src/services/createWorkbenchRuntime';
import { CorpusExportService } from '../../../src/services/clm/corpusExportService';
import type { CorpusManifestEntry } from '../../../src/services/clm/corpusExplorerService';

const source = '\\begin{tikzpicture}\n\\node [style=none] (a) at (0, 0) {A};\n\\end{tikzpicture}\n';
const sourceHash = createHash('sha256').update(source).digest('hex');
const manifest: CorpusManifestEntry[] = [{
  id: 'portable_sample',
  title: 'Portable Sample',
  tikz_file: 'zx-calculus/portable_sample.tikz',
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

describe('CorpusExportService', () => {
  it('exports verified heads and historical cards with only genuine prior history rows', async () => {
    const { runtime, exporter, historyRows } = await setup();
    const handle = 'zx:examples:portable_sample';
    const firstHash = runtime.mcardCollection.resolveHandle(handle)!.asHex();
    await runtime.corpusExplorer.commitCorpusDocument({ handle, sourceText: `${source}% next\n` });
    historyRows.push({ handle, previous_hash: firstHash, changed_at: '2026-09-28T00:00:00.000Z' });

    const parsed = await parsePortableSqlite(await exporter.exportCorpusDb());
    expect(parsed.handles).toHaveLength(1);
    expect(parsed.handles[0].handle).toBe(handle);
    expect(parsed.cards).toHaveLength(2);
    expect(parsed.cards.map((card: any) => card.hash)).toContain(firstHash);
    expect(parsed.history).toHaveLength(1);
    expect(parsed.history[0].previous_hash ?? parsed.history[0].hash).toBe(firstHash);
    expect(parsed.history[0].previous_hash ?? parsed.history[0].hash).not.toBe(parsed.handles[0].hash);
    runtime.dispose();
  });

  it('exports a reverted lineage head without fabricating self-history rows', async () => {
    const { runtime } = await setup();
    const handle = 'zx:examples:portable_sample';
    const hashA = runtime.mcardCollection.resolveHandle(handle)!;
    const cardA = runtime.mcardCollection.get(hashA)!;
    await runtime.corpusExplorer.commitCorpusDocument({ handle, sourceText: `${source}% revision B\n` });
    const hashB = runtime.mcardCollection.resolveHandle(handle)!;
    expect(hashB.asHex()).not.toBe(hashA.asHex());

    // Revert the handle to the earlier revision card (A -> B -> A).
    runtime.mcardCollection.putWithHandle(cardA, handle);
    runtime.corpusExplorer.restoreIndex([{ handle, hash: hashA.asHex(), committedAt: Date.now() }]);
    expect(runtime.mcardCollection.resolveHandle(handle)!.asHex()).toBe(hashA.asHex());

    // Genuine history rows for A -> B -> A lineage
    const historyRows = [
      { handle, previous_hash: hashA.asHex(), changed_at: '2026-09-28T00:00:00.000Z' },
      { handle, previous_hash: hashB.asHex(), changed_at: '2026-09-28T00:01:00.000Z' },
    ];
    const exporter = new CorpusExportService({
      triDb: runtime.triDb,
      collection: runtime.mcardCollection,
      authorDid: runtime.authorDid,
      getIndex: () => runtime.corpusExplorer.getCorpusIndex(),
      getHistoryRows: () => historyRows,
      flush: () => runtime.corpusExplorer.flush(),
    });
    const parsed = await parsePortableSqlite(await exporter.exportCorpusDb());
    expect(parsed.handles[0].hash).toBe(hashA.asHex());
    expect(parsed.cards).toHaveLength(2);
    const cardHashes = new Set(parsed.cards.map((card: any) => card.hash));
    expect(cardHashes.has(hashA.asHex())).toBe(true);
    expect(cardHashes.has(hashB.asHex())).toBe(true);
    // Genuine history for A -> B -> A: rows record superseded heads [A, B].
    // The head may appear in earlier rows, but the transition INTO the current
    // head (the last row) must not list the head as its own predecessor.
    expect(parsed.history).toHaveLength(2);
    const historyHashes = parsed.history.map((row: any) => row.previous_hash ?? row.hash);
    expect(historyHashes).toEqual([hashA.asHex(), hashB.asHex()]);
    expect(historyHashes.at(-1)).not.toBe(hashA.asHex());
    runtime.dispose();
  });

  it('rejects stale index records before returning SQLite bytes', async () => {
    const { runtime, exporter } = await setup();
    runtime.corpusExplorer.restoreIndex([{ handle: 'zx:examples:portable_sample', hash: '0'.repeat(64), committedAt: 1 }]);

    await expect(exporter.exportCorpusDb()).rejects.toThrow(/stale/i);
    runtime.dispose();
  });

  it('rejects missing or hash-mismatched cards before producing bytes', async () => {
    const missing = await setup();
    vi.spyOn(missing.runtime.mcardCollection, 'get').mockReturnValue(undefined);
    await expect(missing.exporter.exportCorpusDb()).rejects.toThrow(/missing historical MCard/i);
    missing.runtime.dispose();

    const mismatched = await setup();
    const hash = mismatched.runtime.mcardCollection.resolveHandle('zx:examples:portable_sample')!;
    const original = mismatched.runtime.mcardCollection.get(hash)!;
    const badCard = MCard.fromStorage(
      original.uri,
      ContentHash.computeString('different payload hash'),
      original.payload,
      original.metadata,
      original.author,
      original.sequence,
    );
    vi.spyOn(mismatched.runtime.mcardCollection, 'get').mockReturnValue(badCard);
    await expect(mismatched.exporter.exportCorpusDb()).rejects.toThrow(/payload does not match hash/i);
    mismatched.runtime.dispose();
  });

  it('treats picker AbortError as cancellation and does not invoke Blob fallback', async () => {
    const { runtime, exporter } = await setup();
    const downloadBlob = vi.fn();
    const showSaveFilePicker = vi.fn(async () => {
      throw Object.assign(new Error('cancelled'), { name: 'AbortError' });
    });

    const result = await exporter.saveCorpusDb({ showSaveFilePicker, downloadBlob });
    expect(result.status).toBe('cancelled');
    expect(downloadBlob).not.toHaveBeenCalled();
    const receipt = runtime.triDb.executionLog.list().at(-1)!;
    expect(receipt.payload).toMatchObject({ kind: 'structured' });
    const restoredReceipt = MCard.fromJSON(JSON.parse(JSON.stringify(receipt.toJSON())));
    expect(MCard.create(restoredReceipt.uri, restoredReceipt.payload, restoredReceipt.author, restoredReceipt.sequence).hash)
      .toEqual(restoredReceipt.hash);
    runtime.dispose();
  });

  it('falls back to Blob download only when the picker is unavailable or fails for a non-cancel reason', async () => {
    const { runtime, exporter } = await setup();
    const downloadBlob = vi.fn();
    const result = await exporter.saveCorpusDb({ downloadBlob });

    expect(result.status).toBe('success');
    expect(downloadBlob).toHaveBeenCalledOnce();
    runtime.dispose();
  });
});
