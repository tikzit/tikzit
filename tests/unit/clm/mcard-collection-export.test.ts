import { describe, expect, it, vi } from 'vitest';
import { createHash } from 'node:crypto';
import {
  ContentHash,
  MCard,
  parsePortableSqlite,
  textPayload,
} from 'clm-kernel';
import {
  CorpusExportService,
  getDiagramsDbFilename,
} from '../../../src/services/clm/corpusExportService';
import { createWorkbenchRuntime } from '../../../src/services/createWorkbenchRuntime';
import { defaultWorkspaceManager } from '../../../src/services/workspace/WorkspaceManager';
import type { CorpusManifestEntry } from '../../../src/services/clm/corpusExplorerService';

const sampleSourceA = '\\begin{tikzpicture}\n\\node [style=none] (a) at (0, 0) {A};\n\\end{tikzpicture}\n';
const sampleSourceB = '\\begin{tikzpicture}\n\\node [style=none] (b) at (1, 1) {B};\n\\end{tikzpicture}\n';
const emptySource = '\\begin{tikzpicture}\n\\end{tikzpicture}\n';

const sourceHashA = createHash('sha256').update(sampleSourceA).digest('hex');
const manifest: CorpusManifestEntry[] = [{
  id: 'fixture_sample',
  title: 'Fixture Sample',
  tikz_file: 'zx-calculus/fixture_sample.tikz',
  tikz_bytes: Buffer.byteLength(sampleSourceA),
  tikz_sha256: sourceHashA,
}];

/**
 * Pinned mcard-studio import validator specification.
 * Corresponds to pinned revision 126cb34948e184748a21a472367b1878011b4980 in mcard-studio:
 * src/services/databaseSyncService.ts (INV-287, INV-288, INV-467).
 */
async function validateMCardStudioImport(bytes: Uint8Array): Promise<{
  tables: string[];
  cards: any[];
  handles: any[];
  history: any[];
  meta: any[];
  recomputedCardMap: Map<string, MCard>;
}> {
  // 1. Assert canonical SQLite 3 binary header (INV-288-01)
  expect(bytes.length).toBeGreaterThanOrEqual(16);
  const magic = new TextDecoder('utf-8').decode(bytes.subarray(0, 16));
  expect(magic.startsWith('SQLite format 3\0') || magic.startsWith('SQLite format 3')).toBe(true);

  // 2. Parse portable SQLite tables
  const dbData = await parsePortableSqlite(bytes);
  expect(dbData.tables).toContain('card');
  expect(dbData.tables).toContain('handle_registry');
  expect(dbData.tables).toContain('handle_history');

  // 3. Zero-Trust Cryptographic Hash Verification
  const recomputedCardMap = new Map<string, MCard>();
  for (const cardRow of dbData.cards) {
    expect(cardRow.hash).toMatch(/^[0-9a-fA-F]{64}$/);
    const contentStr = typeof cardRow.content === 'string'
      ? cardRow.content
      : new TextDecoder('utf-8').decode(cardRow.content);

    const serialized = JSON.parse(contentStr);
    expect(serialized).toBeDefined();
    expect(serialized.uri).toBeDefined();
    expect(serialized.payload).toBeDefined();

    const original = MCard.fromJSON(serialized);
    const rowHash = ContentHash.parse(cardRow.hash);
    expect(original.hash.equals(rowHash)).toBe(true);

    const recomputed = MCard.create(original.uri, original.payload, original.author, original.sequence);
    expect(recomputed.hash.equals(rowHash)).toBe(true);
    recomputedCardMap.set(cardRow.hash, original);
  }

  // 4. Handle resolution and history continuity
  for (const handleRow of dbData.handles) {
    expect(handleRow.handle).toBeDefined();
    expect(handleRow.hash).toBeDefined();
    // Head card must exist in the card table
    expect(recomputedCardMap.has(handleRow.hash)).toBe(true);
  }

  return { ...dbData, recomputedCardMap };
}

async function setupFixtureCorpus() {
  const runtime = createWorkbenchRuntime({ bindKeybindings: false });
  runtime.corpusExplorer.configure({
    manifest,
    fetcher: async () => new Response(sampleSourceA),
    persistence: { flush: vi.fn(async () => undefined) },
    initialIndex: [],
  });
  await runtime.corpusExplorer.seedZxCorpus();
  const historyRows: Array<{ handle: string; previous_hash: string; changed_at: string }> = [];

  const getCombinedHistoryRows = () => {
    const recorded = [...historyRows];
    const allHandles = [
      ...runtime.corpusExplorer.getCorpusIndex().map((r) => r.handle),
      ...runtime.corpusExplorer.getCorpusIndex()
        .filter((r) => r.handle.startsWith('zx:diagrams:'))
        .map((r) => `zx:meta:diagrams:${r.handle.slice('zx:diagrams:'.length)}`),
    ];
    for (const h of allHandles) {
      const rawChain = runtime.mcardCollection.history(h);
      const chain = rawChain.filter((x, idx) => idx === 0 || !x.equals(rawChain[idx - 1]));
      if (chain.length > 1) {
        const existingForH = recorded.filter((r) => r.handle === h);
        if (existingForH.length === 0) {
          for (let i = 0; i < chain.length - 1; i++) {
            recorded.push({
              handle: h,
              previous_hash: chain[i].asHex(),
              changed_at: new Date(Date.now() - (chain.length - 1 - i) * 1000).toISOString(),
            });
          }
        }
      }
    }
    return recorded;
  };

  const exporter = new CorpusExportService({
    triDb: runtime.triDb,
    collection: runtime.mcardCollection,
    authorDid: runtime.authorDid,
    getIndex: () => runtime.corpusExplorer.getCorpusIndex(),
    getHistoryRows: getCombinedHistoryRows,
    flush: () => runtime.corpusExplorer.flush(),
  });

  return { runtime, exporter, historyRows };
}

describe('Sprint 19: Complete MCard Diagram Collection Export', () => {
  it('19-AC-01: exports all seeded, user, and archived diagrams and their metadata handles', async () => {
    const { runtime, exporter } = await setupFixtureCorpus();

    // 1. User diagram
    const { handle: userHandle } = runtime.createDiagram('Active User Diagram');
    await runtime.saveDiagram(userHandle, { sourceText: sampleSourceA });
    const userMetaHandle = `zx:meta:diagrams:${userHandle.slice('zx:diagrams:'.length)}`;

    // 2. Archived diagram
    const { handle: archivedHandle } = runtime.createDiagram('Archived Diagram');
    await runtime.saveDiagram(archivedHandle, { sourceText: sampleSourceB });
    const archivedMetaHandle = `zx:meta:diagrams:${archivedHandle.slice('zx:diagrams:'.length)}`;
    await runtime.archiveDiagram(archivedHandle, true);

    const summary = await exporter.getCollectionExportSummary();
    expect(summary.diagramsCount).toBe(3); // 1 seeded + 1 user + 1 archived
    expect(summary.archivedCount).toBe(1);
    expect(summary.defaultFilename).toMatch(/^tikzit-diagrams-\d{8}\.db$/);

    const artifact = await exporter.exportCorpusDbWithMetadata();
    const imported = await validateMCardStudioImport(artifact.bytes);

    const importedHandles = new Set(imported.handles.map((h) => h.handle));
    expect(importedHandles.has('zx:examples:fixture_sample')).toBe(true);
    expect(importedHandles.has(userHandle)).toBe(true);
    expect(importedHandles.has(userMetaHandle)).toBe(true);
    expect(importedHandles.has(archivedHandle)).toBe(true);
    expect(importedHandles.has(archivedMetaHandle)).toBe(true);

    // Verify archived metadata payload
    const archivedMetaHeadHash = imported.handles.find((h) => h.handle === archivedMetaHandle)!.hash;
    const archivedMetaCard = imported.recomputedCardMap.get(archivedMetaHeadHash)!;
    expect(archivedMetaCard.payload).toMatchObject({
      kind: 'structured',
      value: expect.objectContaining({ archived: true, title: 'Archived Diagram' }),
    });

    runtime.dispose();
  });

  it('19-AC-02: every card in lineage closure appears exactly once and recomputes to its hash', async () => {
    const { runtime, exporter, historyRows } = await setupFixtureCorpus();
    const { handle } = runtime.createDiagram('Versioned Diagram');
    await runtime.saveDiagram(handle, { sourceText: sampleSourceA });
    const hash1 = runtime.mcardCollection.resolveHandle(handle)!.asHex();

    // Version 2
    await runtime.saveDiagram(handle, { sourceText: sampleSourceB });
    const hash2 = runtime.mcardCollection.resolveHandle(handle)!.asHex();
    historyRows.push({ handle, previous_hash: hash1, changed_at: '2026-09-28T00:00:00.000Z' });

    // Version 3
    await runtime.saveDiagram(handle, { sourceText: `${sampleSourceB}% edit 3\n` });
    const hash3 = runtime.mcardCollection.resolveHandle(handle)!.asHex();
    historyRows.push({ handle, previous_hash: hash2, changed_at: '2026-09-28T00:01:00.000Z' });

    const artifact = await exporter.exportCorpusDbWithMetadata();
    const imported = await validateMCardStudioImport(artifact.bytes);

    // Every card in the card table has unique hash
    const cardHashes = imported.cards.map((c) => c.hash);
    expect(new Set(cardHashes).size).toBe(cardHashes.length);
    expect(cardHashes).toContain(hash1);
    expect(cardHashes).toContain(hash2);
    expect(cardHashes).toContain(hash3);

    runtime.dispose();
  });

  it('19-AC-03: preserves registry heads, ordered history, and A->B->A restore lineage', async () => {
    const { runtime, exporter, historyRows } = await setupFixtureCorpus();
    const { handle } = runtime.createDiagram('Restore Diagram');
    await runtime.saveDiagram(handle, { sourceText: sampleSourceA });

    const hashA = runtime.mcardCollection.resolveHandle(handle)!;
    const cardA = runtime.mcardCollection.get(hashA)!;

    // Commit revision B
    await runtime.saveDiagram(handle, { sourceText: sampleSourceB });
    const hashB = runtime.mcardCollection.resolveHandle(handle)!;
    expect(hashB.asHex()).not.toBe(hashA.asHex());

    // Restore to card A (A -> B -> A)
    runtime.mcardCollection.putWithHandle(cardA, handle);
    runtime.corpusExplorer.restoreIndex([
      ...runtime.corpusExplorer.getCorpusIndex().filter((r) => r.handle !== handle),
      { handle, hash: hashA.asHex(), committedAt: Date.now() },
    ]);
    expect(runtime.mcardCollection.resolveHandle(handle)!.asHex()).toBe(hashA.asHex());

    // Genuine history rows for A -> B -> A
    historyRows.push(
      { handle, previous_hash: hashA.asHex(), changed_at: '2026-09-28T00:00:00.000Z' },
      { handle, previous_hash: hashB.asHex(), changed_at: '2026-09-28T00:01:00.000Z' },
    );

    const artifact = await exporter.exportCorpusDbWithMetadata();
    const imported = await validateMCardStudioImport(artifact.bytes);

    // Head is card A
    const handleEntry = imported.handles.find((h) => h.handle === handle)!;
    expect(handleEntry.hash).toBe(hashA.asHex());

    // Both transitions exist in history
    const historyForHandle = imported.history.filter((h) => h.handle === handle);
    expect(historyForHandle).toHaveLength(2);
    expect(historyForHandle[0].previous_hash ?? historyForHandle[0].hash).toBe(hashA.asHex());
    expect(historyForHandle[1].previous_hash ?? historyForHandle[1].hash).toBe(hashB.asHex());

    // Final history row points to hashB, never to head hashA
    expect(historyForHandle[1].previous_hash ?? historyForHandle[1].hash).not.toBe(hashA.asHex());

    // Cards table contains card A exactly once, card B exactly once
    const handleCards = imported.cards.filter((c) => c.hash === hashA.asHex() || c.hash === hashB.asHex());
    expect(handleCards).toHaveLength(2);

    runtime.dispose();
  });

  it('19-AC-04: round-trips fixture corpus (A->B->A, empty diagram, archived, renamed) through pinned mcard-studio validator', async () => {
    const { runtime, exporter, historyRows } = await setupFixtureCorpus();

    // 1. Seeded example
    const seededHandle = 'zx:examples:fixture_sample';

    // 2. Empty diagram
    const { handle: emptyHandle } = runtime.createDiagram('Empty Diagram');
    await runtime.saveDiagram(emptyHandle, { sourceText: emptySource });

    // 3. Archived diagram
    const { handle: archivedHandle } = runtime.createDiagram('Archived Item');
    await runtime.saveDiagram(archivedHandle, { sourceText: sampleSourceB });
    await runtime.archiveDiagram(archivedHandle, true);

    // 4. Renamed diagram (creates versioned metadata)
    const { handle: renamedHandle } = runtime.createDiagram('Initial Title');
    await runtime.saveDiagram(renamedHandle, { sourceText: sampleSourceA });
    const renamedMetaHandle = `zx:meta:diagrams:${renamedHandle.slice('zx:diagrams:'.length)}`;
    const metaHash1 = runtime.mcardCollection.resolveHandle(renamedMetaHandle)!.asHex();
    await runtime.renameDiagram(renamedHandle, 'Updated Title');
    const metaHash2 = runtime.mcardCollection.resolveHandle(renamedMetaHandle)!.asHex();
    historyRows.push({
      handle: renamedMetaHandle,
      previous_hash: metaHash1,
      changed_at: '2026-09-28T00:00:30.000Z',
    });

    // 5. A -> B -> A handle
    const { handle: abaHandle } = runtime.createDiagram('ABA Diagram');
    await runtime.saveDiagram(abaHandle, { sourceText: sampleSourceA });
    const abaHashA = runtime.mcardCollection.resolveHandle(abaHandle)!;
    const abaCardA = runtime.mcardCollection.get(abaHashA)!;
    await runtime.saveDiagram(abaHandle, { sourceText: sampleSourceB });
    const abaHashB = runtime.mcardCollection.resolveHandle(abaHandle)!;
    runtime.mcardCollection.putWithHandle(abaCardA, abaHandle);
    runtime.corpusExplorer.restoreIndex([
      ...runtime.corpusExplorer.getCorpusIndex().filter((r) => r.handle !== abaHandle),
      { handle: abaHandle, hash: abaHashA.asHex(), committedAt: Date.now() },
    ]);
    historyRows.push(
      { handle: abaHandle, previous_hash: abaHashA.asHex(), changed_at: '2026-09-28T00:00:00.000Z' },
      { handle: abaHandle, previous_hash: abaHashB.asHex(), changed_at: '2026-09-28T00:01:00.000Z' },
    );

    // Export and validate via pinned mcard-studio validator
    const artifact = await exporter.exportCorpusDbWithMetadata();
    const imported = await validateMCardStudioImport(artifact.bytes);

    // Check all handles exist
    const handleSet = new Set(imported.handles.map((h) => h.handle));
    expect(handleSet.has(seededHandle)).toBe(true);
    expect(handleSet.has(emptyHandle)).toBe(true);
    expect(handleSet.has(archivedHandle)).toBe(true);
    expect(handleSet.has(renamedHandle)).toBe(true);
    expect(handleSet.has(renamedMetaHandle)).toBe(true);
    expect(handleSet.has(abaHandle)).toBe(true);

    // Check renamed metadata title
    const metaCard = imported.recomputedCardMap.get(metaHash2)!;
    expect((metaCard.payload as any).value.title).toBe('Updated Title');

    // Check empty diagram content
    const emptyHeadHash = imported.handles.find((h) => h.handle === emptyHandle)!.hash;
    const emptyCard = imported.recomputedCardMap.get(emptyHeadHash)!;
    expect(emptyCard.content).toBe(emptySource);

    runtime.dispose();
  });

  it('19-AC-05: fails closed with specific failing handle named on corruption, missing card, stale index, duplicate handle', async () => {
    // A. Missing card fails closed naming handle
    const missing = await setupFixtureCorpus();
    const mHandle = 'zx:examples:fixture_sample';
    vi.spyOn(missing.runtime.mcardCollection, 'get').mockReturnValue(undefined);
    await expect(missing.exporter.exportCorpusDb()).rejects.toThrow(new RegExp(`Missing historical MCard .* for handle ${mHandle}`));
    missing.runtime.dispose();

    // B. Stale index fails closed naming handle
    const stale = await setupFixtureCorpus();
    const sHandle = 'zx:examples:fixture_sample';
    stale.runtime.corpusExplorer.restoreIndex([{ handle: sHandle, hash: '0'.repeat(64), committedAt: Date.now() }]);
    await expect(stale.exporter.exportCorpusDb()).rejects.toThrow(new RegExp(`Stale corpus index for handle ${sHandle}`));
    stale.runtime.dispose();

    // C. Duplicate handles fails closed naming handle
    const dup = await setupFixtureCorpus();
    const dHandle = 'zx:examples:fixture_sample';
    const valid = dup.runtime.corpusExplorer.getCorpusIndex()[0];
    dup.runtime.corpusExplorer.restoreIndex([valid, { ...valid }]);
    await expect(dup.exporter.exportCorpusDb()).rejects.toThrow(new RegExp(`Duplicate corpus handle index row for handle ${dHandle}`));
    dup.runtime.dispose();

    // D. Hash mismatch / corrupt card fails closed naming handle
    const corrupt = await setupFixtureCorpus();
    const cHandle = 'zx:examples:fixture_sample';
    const originalHash = corrupt.runtime.mcardCollection.resolveHandle(cHandle)!;
    const originalCard = corrupt.runtime.mcardCollection.get(originalHash)!;
    const tampered = MCard.fromStorage(
      originalCard.uri,
      ContentHash.computeString('tampered'),
      originalCard.payload,
      originalCard.metadata,
      originalCard.author,
      originalCard.sequence,
    );
    vi.spyOn(corrupt.runtime.mcardCollection, 'get').mockReturnValue(tampered);
    await expect(corrupt.exporter.exportCorpusDb()).rejects.toThrow(new RegExp(`Card payload does not match hash .* for handle ${cHandle}`));
    corrupt.runtime.dispose();

    // E. HEAD as its own history fails closed naming handle
    const selfHist = await setupFixtureCorpus();
    const shHandle = 'zx:examples:fixture_sample';
    const headHash = selfHist.runtime.mcardCollection.resolveHandle(shHandle)!.asHex();
    selfHist.historyRows.push({ handle: shHandle, previous_hash: headHash, changed_at: '2026-09-28T00:00:00.000Z' });
    await expect(selfHist.exporter.exportCorpusDb()).rejects.toThrow(new RegExp(`HEAD appears as its own history for handle ${shHandle}`));
    selfHist.runtime.dispose();

    // F. saveCorpusDb surfaces VerificationError and failingHandle cleanly
    const verifFail = await setupFixtureCorpus();
    verifFail.runtime.corpusExplorer.restoreIndex([{ handle: 'zx:examples:fixture_sample', hash: '0'.repeat(64), committedAt: Date.now() }]);
    const saveResult = await verifFail.exporter.saveCorpusDb();
    expect(saveResult.status).toBe('failure');
    expect(saveResult.failureCode).toBe('VerificationError');
    expect(saveResult.failingHandle).toBe('zx:examples:fixture_sample');
    expect(saveResult.failureReason).toContain('for handle zx:examples:fixture_sample');
    verifFail.runtime.dispose();
  });

  it('19-AC-06: reports distinct visible outcomes: saved, cancelled, fallback, write-failed, receipt-not-persisted', async () => {
    const { runtime, exporter } = await setupFixtureCorpus();

    // 1. Cancelled
    const cancelRes = await exporter.saveCorpusDb({
      showSaveFilePicker: async () => {
        throw Object.assign(new Error('cancelled'), { name: 'AbortError' });
      },
    });
    expect(cancelRes.status).toBe('cancelled');

    // 2. Saved via picker
    let writtenBlob: Blob | undefined;
    const saveRes = await exporter.saveCorpusDb({
      showSaveFilePicker: async () => ({
        createWritable: async () => ({
          write: async (b: any) => { writtenBlob = b; },
          close: async () => undefined,
        }),
      }),
    });
    expect(saveRes.status).toBe('success');
    expect(saveRes.method).toBe('picker');
    expect(saveRes.persisted).toBe(true);
    expect(writtenBlob).toBeDefined();

    // 3. Fallback download
    const downloadBlob = vi.fn();
    const fallbackRes = await exporter.saveCorpusDb({ downloadBlob });
    expect(fallbackRes.status).toBe('success');
    expect(fallbackRes.method).toBe('fallback');
    expect(downloadBlob).toHaveBeenCalledOnce();

    // 4. Write failed after picker handle obtained
    const writeFailRes = await exporter.saveCorpusDb({
      showSaveFilePicker: async () => ({
        createWritable: async () => {
          throw new Error('EACCES: permission denied');
        },
      }),
    });
    expect(writeFailRes.status).toBe('failure');
    expect(writeFailRes.failureCode).toBe('WriteError');
    expect(writeFailRes.failureReason).toContain('EACCES');

    // 5. Receipt not persisted (flush throws)
    const brokenFlushExporter = new CorpusExportService({
      triDb: runtime.triDb,
      collection: runtime.mcardCollection,
      authorDid: runtime.authorDid,
      getIndex: () => runtime.corpusExplorer.getCorpusIndex(),
      getHistoryRows: () => [],
      flush: async () => { throw new Error('IndexedDB disk full'); },
    });
    const receiptFailRes = await brokenFlushExporter.saveCorpusDb({ downloadBlob: vi.fn() });
    expect(receiptFailRes.status).toBe('success');
    expect(receiptFailRes.persisted).toBe(false);
    expect(receiptFailRes.persistenceError).toContain('IndexedDB disk full');

    runtime.dispose();
  });

  it('19-AC-07: export does not alter cards, handles, history, active document, or dirty buffers', async () => {
    const { runtime, exporter } = await setupFixtureCorpus();
    const doc = defaultWorkspaceManager.openDocument({
      id: 'doc_test',
      title: 'Doc Test',
      content: sampleSourceA,
      hash: '',
      createdAt: Date.now(),
      updatedAt: Date.now(),
      version: 1,
      isDirty: false,
    });
    defaultWorkspaceManager.updateContent('doc_test', `${sampleSourceA}% unsaved edit\n`);
    expect(defaultWorkspaceManager.getActiveDocument()?.isDirty).toBe(true);

    const cardsBefore = runtime.mcardCollection.count();
    const handlesBefore = runtime.corpusExplorer.getCorpusIndex().map((r) => r.handle);

    await exporter.exportCorpusDb();

    // Invariants preserved
    expect(runtime.mcardCollection.count()).toBe(cardsBefore);
    expect(runtime.corpusExplorer.getCorpusIndex().map((r) => r.handle)).toEqual(handlesBefore);
    expect(defaultWorkspaceManager.getActiveDocument()?.id).toBe('doc_test');
    expect(defaultWorkspaceManager.getActiveDocument()?.isDirty).toBe(true);
    expect(defaultWorkspaceManager.getActiveDocument()?.content).toContain('unsaved edit');

    runtime.dispose();
  });

  it('19-AC-08: single coherent snapshot: commit landing mid-export cannot desync counts', async () => {
    const { runtime, exporter } = await setupFixtureCorpus();
    const summaryBefore = await exporter.getCollectionExportSummary();
    expect(summaryBefore.diagramsCount).toBe(1);

    // Capture snapshot at export initiation
    const artifactPromise = exporter.exportCorpusDbWithMetadata();

    // Concurrent commit lands while export promise is executing
    const { handle: concurrentHandle } = runtime.createDiagram('Concurrent Diagram');
    await runtime.saveDiagram(concurrentHandle, { sourceText: sampleSourceA });
    expect(runtime.corpusExplorer.getCorpusIndex()).toHaveLength(2);

    const artifact = await artifactPromise;
    // Export artifact matches the snapshot taken at export initiation
    const imported = await validateMCardStudioImport(artifact.bytes);
    const diagramHandles = imported.handles.filter((h) => !h.handle.startsWith('zx:meta:'));
    expect(diagramHandles).toHaveLength(1);
    expect(diagramHandles[0].handle).toBe('zx:examples:fixture_sample');

    runtime.dispose();
  });

  it('Decision D3: orphan cards are excluded from export and disclosed in summary', async () => {
    const { runtime, exporter } = await setupFixtureCorpus();

    // Create an orphan card in mcardCollection that is NOT referenced by any diagram handle
    const orphanCard = MCard.create(
      'tikzit://orphans/standalone_scratch',
      textPayload('orphan content'),
      runtime.authorDid,
      0,
    );
    runtime.mcardCollection.put(orphanCard);
    expect(runtime.mcardCollection.count()).toBe(2); // 1 fixture diagram card + 1 orphan card

    const summary = await exporter.getCollectionExportSummary();
    expect(summary.totalCardsCount).toBe(1); // Only the diagram card is included
    expect(summary.orphanCardsCount).toBe(1); // 1 orphan disclosed per Decision D3

    const artifact = await exporter.exportCorpusDbWithMetadata();
    const imported = await validateMCardStudioImport(artifact.bytes);

    // The orphan card is NOT present in the exported database
    expect(imported.cards).toHaveLength(1);
    expect(imported.cards.map((c) => c.hash)).not.toContain(orphanCard.hash.asHex());

    runtime.dispose();
  });
});
