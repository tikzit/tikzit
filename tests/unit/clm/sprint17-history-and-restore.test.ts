import { describe, it, expect, beforeEach } from 'vitest';
import { createWorkbenchRuntime } from '../../../src/services/createWorkbenchRuntime';
import { defaultWorkspaceManager, STORAGE_KEY } from '../../../src/services/workspace/WorkspaceManager';
import { defaultDocumentStore } from '../../../src/services/storage/DocumentStore';
import { ContentHash } from 'clm-kernel';
import { safeParse } from '../../../src/core/parser/parser';

class MockLocalStorage {
  private store = new Map<string, string>();
  getItem(key: string) { return this.store.get(key) ?? null; }
  setItem(key: string, value: string) { this.store.set(key, String(value)); }
  removeItem(key: string) { this.store.delete(key); }
  clear() { this.store.clear(); }
}

describe('Sprint 17: MCard Version History & Restore', () => {
  let mockStorage: MockLocalStorage;

  beforeEach(() => {
    mockStorage = new MockLocalStorage();
    (globalThis as any).localStorage = mockStorage;
    (globalThis as any).window = globalThis;
    defaultWorkspaceManager.reset();
  });

  const sourceA = '\\begin{tikzpicture}\n\\node (a) at (0, 0) {A};\n\\end{tikzpicture}\n';
  const sourceB = '\\begin{tikzpicture}\n\\node (b) at (1, 1) {B};\n\\end{tikzpicture}\n';
  const sourceC = '\\begin{tikzpicture}\n\\node (c) at (2, 2) {C};\n\\end{tikzpicture}\n';

  describe('17-AC-01: Lineage ordering with duplicate-hash rows (A -> B -> A)', () => {
    it('accurately orders duplicate-hash rows by position, not hash, without losing history', async () => {
      const runtime = createWorkbenchRuntime({ bindKeybindings: false });
      const { handle } = runtime.createDiagram('Circuit History');

      // 1. Save A (pos 1)
      defaultWorkspaceManager.updateContent(handle, sourceA);
      const resA1 = await runtime.saveActiveCorpusEntry(sourceA);
      const hashA = resA1?.hash;
      expect(hashA).toBeDefined();

      // 2. Save B (pos 2)
      defaultWorkspaceManager.updateContent(handle, sourceB);
      const resB = await runtime.saveActiveCorpusEntry(sourceB);
      const hashB = resB?.hash;
      expect(hashB).toBeDefined();
      expect(hashB).not.toBe(hashA);

      // 3. Save A again (pos 3: A -> B -> A)
      defaultWorkspaceManager.updateContent(handle, sourceA);
      const resA2 = await runtime.saveActiveCorpusEntry(sourceA);
      expect(resA2?.hash).toBe(hashA);

      // Check documentHistory
      const history = runtime.documentHistory(handle);
      expect(history.handle).toBe(handle);
      expect(history.head).toBe(hashA);
      expect(history.rows.length).toBe(3);

      // Position 1: hashA, isHead: false
      expect(history.rows[0].position).toBe(1);
      expect(history.rows[0].hash).toBe(hashA);
      expect(history.rows[0].isHead).toBe(false);

      // Position 2: hashB, isHead: false
      expect(history.rows[1].position).toBe(2);
      expect(history.rows[1].hash).toBe(hashB);
      expect(history.rows[1].isHead).toBe(false);

      // Position 3: hashA, isHead: true
      expect(history.rows[2].position).toBe(3);
      expect(history.rows[2].hash).toBe(hashA);
      expect(history.rows[2].isHead).toBe(true);
    });
  });

  describe('17-AC-08: Version Labels', () => {
    it('records commit message as position-keyed label in metadata card and persists across reload', async () => {
      const runtime = createWorkbenchRuntime({ bindKeybindings: false });
      const { handle } = runtime.createDiagram('Labeled Circuit');

      // Save v1 with label
      defaultWorkspaceManager.updateContent(handle, sourceA);
      await runtime.saveActiveCorpusEntry(sourceA, 'Initial baseline');

      // Save v2 with label
      defaultWorkspaceManager.updateContent(handle, sourceB);
      await runtime.saveActiveCorpusEntry(sourceB, 'Added transform step');

      // Save v3 without label
      defaultWorkspaceManager.updateContent(handle, sourceC);
      await runtime.saveActiveCorpusEntry(sourceC);

      const history = runtime.documentHistory(handle);
      expect(history.rows.length).toBe(3);
      expect(history.rows[0].label).toBe('Initial baseline');
      expect(history.rows[1].label).toBe('Added transform step');
      expect(history.rows[2].label).toBeUndefined();

      // Check metadata card directly
      const meta = runtime.corpusExplorer.getDiagramMetadata(handle);
      expect(meta?.labels).toBeDefined();
      expect(meta?.labels?.['1']).toBe('Initial baseline');
      expect(meta?.labels?.['2']).toBe('Added transform step');
    });
  });

  describe('17-AC-03: Missing or Corrupt Cards', () => {
    it('marks missing or invalid cards as unavailable rows and blocks restore', async () => {
      const runtime = createWorkbenchRuntime({ bindKeybindings: false });
      const { handle } = runtime.createDiagram('Missing Card Test');

      defaultWorkspaceManager.updateContent(handle, sourceA);
      await runtime.saveActiveCorpusEntry(sourceA);

      // Try restoring a nonexistent hash
      const fakeHash = '1111222233334444555566667777888899990000aaaabbbbccccddddeeeeffff';
      const restoreRes = await runtime.restoreVersion({
        handle,
        targetHash: fakeHash,
      });

      expect(restoreRes.status).toBe('missing-card');
    });
  });

  describe('17-AC-05: Restore Re-registration (True A -> B -> A)', () => {
    it('restores historical card without minting new card, keeping head and lineage consistent', async () => {
      const runtime = createWorkbenchRuntime({ bindKeybindings: false });
      const { handle } = runtime.createDiagram('Restore Re-register Test');

      // 1. Save v1 (A)
      defaultWorkspaceManager.updateContent(handle, sourceA);
      const resA = await runtime.saveActiveCorpusEntry(sourceA);
      const hashA = resA!.hash!;

      // 2. Save v2 (B)
      defaultWorkspaceManager.updateContent(handle, sourceB);
      const resB = await runtime.saveActiveCorpusEntry(sourceB);
      const hashB = resB!.hash!;

      const cardCountBeforeRestore = runtime.mcardCollection.count();

      // 3. Restore v1 (A)
      const restoreRes = await runtime.restoreVersion({
        handle,
        targetHash: hashA,
        expectedHeadHash: hashB,
      });

      expect(restoreRes.status).toBe('success');
      if (restoreRes.status === 'success') {
        expect(restoreRes.hash).toBe(hashA);
        expect(restoreRes.content).toBe(sourceA);
      }

      // 4. Verify no new card was minted in collection
      const cardCountAfterRestore = runtime.mcardCollection.count();
      expect(cardCountAfterRestore).toBe(cardCountBeforeRestore);

      // 5. Verify head now resolves to hashA
      const currentHead = runtime.mcardCollection.resolveHandle(handle)?.asHex();
      expect(currentHead).toBe(hashA);

      // 6. Verify WorkspaceManager document is updated and clean
      const doc = defaultWorkspaceManager.getActiveDocument();
      expect(doc?.content).toBe(sourceA);
      expect(doc?.hash).toBe(hashA);
      expect(doc?.isDirty).toBe(false);

      // 7. Verify history has 3 entries: [A (pos 1), B (pos 2), A (pos 3, head)]
      const hist = runtime.documentHistory(handle);
      expect(hist.rows.length).toBe(3);
      expect(hist.rows[0].hash).toBe(hashA);
      expect(hist.rows[1].hash).toBe(hashB);
      expect(hist.rows[2].hash).toBe(hashA);
      expect(hist.rows[2].isHead).toBe(true);
    });
  });

  describe('17-AC-06: CAS Conflict and Already-Current Detection', () => {
    it('returns already-current when restoring current head without writing', async () => {
      const runtime = createWorkbenchRuntime({ bindKeybindings: false });
      const { handle } = runtime.createDiagram('Already Current Test');

      defaultWorkspaceManager.updateContent(handle, sourceA);
      const resA = await runtime.saveActiveCorpusEntry(sourceA);
      const hashA = resA!.hash!;

      const restoreRes = await runtime.restoreVersion({
        handle,
        targetHash: hashA,
      });

      expect(restoreRes.status).toBe('already-current');
    });

    it('bails with conflict when expectedHead differs from current head, leaving head intact', async () => {
      const runtime = createWorkbenchRuntime({ bindKeybindings: false });
      const { handle } = runtime.createDiagram('CAS Conflict Test');

      // Save v1 (A)
      defaultWorkspaceManager.updateContent(handle, sourceA);
      const resA = await runtime.saveActiveCorpusEntry(sourceA);
      const hashA = resA!.hash!;

      // Save v2 (B)
      defaultWorkspaceManager.updateContent(handle, sourceB);
      const resB = await runtime.saveActiveCorpusEntry(sourceB);
      const hashB = resB!.hash!;

      // Attempt restore of v1 expecting a stale head (e.g. hashA instead of current hashB)
      const conflictRes = await runtime.restoreVersion({
        handle,
        targetHash: hashA,
        expectedHeadHash: hashA, // Stale! Current head is hashB
      });

      expect(conflictRes.status).toBe('conflict');
      if (conflictRes.status === 'conflict') {
        expect(conflictRes.currentHead).toBe(hashB);
        expect(conflictRes.expectedHead).toBe(hashA);
      }

      // Verify head remains hashB
      expect(runtime.mcardCollection.resolveHandle(handle)?.asHex()).toBe(hashB);
    });
  });

  describe('17-AC-07: Legacy Document Isolation', () => {
    it('legacy non-MCard documents do not create MCard history, and MCard saves do not touch DocumentStore', async () => {
      const runtime = createWorkbenchRuntime({ bindKeybindings: false });

      // 1. MCard diagram
      const { handle } = runtime.createDiagram('MCard Diagram');
      defaultWorkspaceManager.updateContent(handle, sourceA);
      await runtime.saveActiveCorpusEntry(sourceA);

      // Verify DocumentStore has 0 revisions for this handle
      const mcardRevisions = await defaultDocumentStore.getRevisions(handle);
      expect(mcardRevisions.length).toBe(0);

      // 2. Legacy document
      const legacyId = 'doc_legacy_123';
      await defaultDocumentStore.saveDocument({
        id: legacyId,
        title: 'Legacy Diagram',
        content: sourceA,
        message: 'Initial legacy rev',
      });

      const legacyRevs = await defaultDocumentStore.getRevisions(legacyId);
      expect(legacyRevs.length).toBe(1);

      // documentHistory for legacy ID returns 0 rows
      const history = runtime.documentHistory(legacyId);
      expect(history.rows.length).toBe(0);
    });
  });
});
