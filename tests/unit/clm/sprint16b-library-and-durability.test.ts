import { describe, it, expect, beforeEach } from 'vitest';
import { createWorkbenchRuntime } from '../../../src/services/createWorkbenchRuntime';
import { defaultWorkspaceManager, STORAGE_KEY } from '../../../src/services/workspace/WorkspaceManager';
import { runLegacyImport, LEGACY_INDEX_KEY, LEGACY_DOC_PREFIX } from '../../../src/services/clm/legacyImportService';

class MockLocalStorage {
  private store = new Map<string, string>();
  getItem(key: string) { return this.store.get(key) ?? null; }
  setItem(key: string, value: string) { this.store.set(key, String(value)); }
  removeItem(key: string) { this.store.delete(key); }
  clear() { this.store.clear(); }
}

describe('Sprint 16B: Diagram Library Management & Session Durability', () => {
  let mockStorage: MockLocalStorage;

  beforeEach(() => {
    mockStorage = new MockLocalStorage();
    (globalThis as any).localStorage = mockStorage;
    (globalThis as any).window = globalThis;
    defaultWorkspaceManager.reset();
  });

  describe('16B-AC-01: Rename Diagram', () => {
    it('commits a new version of metadata card with updated title, leaves diagram cards untouched', async () => {
      const runtime = createWorkbenchRuntime({ bindKeybindings: false });
      const { handle } = runtime.createDiagram('Original Title');
      const source = '\\begin{tikzpicture}\n\\node (a) at (0, 0) {A};\n\\end{tikzpicture}\n';
      defaultWorkspaceManager.updateContent(handle, source);
      await runtime.saveActiveCorpusEntry();

      const uuid = handle.slice('zx:diagrams:'.length);
      const metaHandle = `zx:meta:diagrams:${uuid}`;

      // Get initial diagram head and metadata head
      const initialDiagHash = runtime.mcardCollection.resolveHandle(handle)?.asHex();
      const initialMetaHash = runtime.mcardCollection.resolveHandle(metaHandle)?.asHex();
      expect(initialDiagHash).toBeDefined();
      expect(initialMetaHash).toBeDefined();

      // Perform rename
      const renameRes = await runtime.renameDiagram(handle, 'Updated Title');
      expect(renameRes.success).toBe(true);

      // Verify metadata handle advanced
      const newMetaHash = runtime.mcardCollection.resolveHandle(metaHandle)?.asHex();
      expect(newMetaHash).toBeDefined();
      expect(newMetaHash).not.toBe(initialMetaHash);

      // Verify metadata card content
      const meta = runtime.corpusExplorer.getDiagramMetadata(handle);
      expect(meta?.title).toBe('Updated Title');
      expect(meta?.archived).toBe(false);

      // Verify diagram card and handle are UNTOUCHED (0 diagram card changes)
      const afterDiagHash = runtime.mcardCollection.resolveHandle(handle)?.asHex();
      expect(afterDiagHash).toBe(initialDiagHash);

      // Verify Explorer listing reflects new title
      const entries = runtime.corpusExplorer.listCorpusEntries().entries;
      const found = entries.find((e) => e.handle === handle);
      expect(found?.title).toBe('Updated Title');

      // Verify WorkspaceManager active document title updated
      expect(defaultWorkspaceManager.getActiveDocument()?.title).toBe('Updated Title');

      runtime.dispose();
    });

    it('rejects renaming with empty title or renaming seeded examples', async () => {
      const runtime = createWorkbenchRuntime({ bindKeybindings: false });
      const { handle } = runtime.createDiagram('Valid Title');

      const resEmpty = await runtime.renameDiagram(handle, '   ');
      expect(resEmpty.success).toBe(false);
      expect(resEmpty.error).toMatch(/cannot be empty/i);

      const resExample = await runtime.renameDiagram('zx:examples:01_spider_fusion', 'New Name');
      expect(resExample.success).toBe(false);
      expect(resExample.error).toMatch(/only user diagrams/i);

      runtime.dispose();
    });
  });

  describe('16B-AC-02: Archive & Un-archive', () => {
    it('soft-deletes via metadata card, excludes from default listing/search, restores via un-archive', async () => {
      const runtime = createWorkbenchRuntime({ bindKeybindings: false });
      const { handle } = runtime.createDiagram('Archive Candidate');
      const source = '\\begin{tikzpicture}\n\\node (b) at (1, 1) {B};\n\\end{tikzpicture}\n';
      defaultWorkspaceManager.updateContent(handle, source);
      await runtime.saveActiveCorpusEntry();

      const initialDiagHash = runtime.mcardCollection.resolveHandle(handle)?.asHex();

      // Check initially in listing and search
      expect(runtime.corpusExplorer.listCorpusEntries().entries.some((e) => e.handle === handle)).toBe(true);
      expect(runtime.corpusExplorer.searchCorpus('Archive Candidate').some((e) => e.handle === handle)).toBe(true);

      // Archive diagram
      const archiveRes = await runtime.archiveDiagram(handle, true);
      expect(archiveRes.success).toBe(true);

      // Excluded from default listing and search
      expect(runtime.corpusExplorer.listCorpusEntries().entries.some((e) => e.handle === handle)).toBe(false);
      expect(runtime.corpusExplorer.searchCorpus('Archive Candidate').some((e) => e.handle === handle)).toBe(false);

      // Included when includeArchived: true
      const archivedListing = runtime.corpusExplorer.listCorpusEntries({ includeArchived: true }).entries;
      const archivedEntry = archivedListing.find((e) => e.handle === handle);
      expect(archivedEntry).toBeDefined();
      expect(archivedEntry?.archived).toBe(true);

      // Diagram can still be opened directly (resolvable)
      const opened = runtime.corpusExplorer.openEntry(handle);
      expect(opened.source).toBe(source);

      // Diagram card lineage is UNCHANGED
      expect(runtime.mcardCollection.resolveHandle(handle)?.asHex()).toBe(initialDiagHash);

      // Un-archive diagram
      const unarchiveRes = await runtime.archiveDiagram(handle, false);
      expect(unarchiveRes.success).toBe(true);

      // Restored to default listing and search
      expect(runtime.corpusExplorer.listCorpusEntries().entries.some((e) => e.handle === handle)).toBe(true);
      expect(runtime.corpusExplorer.searchCorpus('Archive Candidate').some((e) => e.handle === handle)).toBe(true);

      runtime.dispose();
    });
  });

  describe('16B-AC-03: Duplicate Diagram', () => {
    it('creates an independent handle with provenance forkedFrom, and independent subsequent edits', async () => {
      const runtime = createWorkbenchRuntime({ bindKeybindings: false });
      const { handle: sourceHandle } = runtime.createDiagram('Source Diagram');
      const sourceCode = '\\begin{tikzpicture}\n\\node (x) at (0, 0) {X};\n\\end{tikzpicture}\n';
      defaultWorkspaceManager.updateContent(sourceHandle, sourceCode);
      await runtime.saveActiveCorpusEntry();

      const sourceHash = runtime.mcardCollection.resolveHandle(sourceHandle)!.asHex();

      // Duplicate
      const dupRes = await runtime.duplicateDiagram(sourceHandle, 'Cloned Diagram');
      expect(dupRes.success).toBe(true);
      expect(dupRes.newHandle).toBeDefined();
      expect(dupRes.newHandle).toMatch(/^zx:diagrams:/);
      expect(dupRes.newHandle).not.toBe(sourceHandle);

      const newHandle = dupRes.newHandle!;

      // Check provenance in metadata
      const newMeta = runtime.corpusExplorer.getDiagramMetadata(newHandle);
      expect(newMeta).toBeDefined();
      expect(newMeta?.title).toBe('Cloned Diagram');
      expect(newMeta?.source).toBe('duplicate');
      expect(newMeta?.forkedFrom).toBe(`${sourceHandle}@${sourceHash}`);

      // Verify content is identical
      const sourceOpen = runtime.corpusExplorer.openEntry(sourceHandle);
      const dupOpen = runtime.corpusExplorer.openEntry(newHandle);
      expect(dupOpen.source).toBe(sourceOpen.source);

      // Mutate duplicate: does NOT affect source
      const mutatedCode = '\\begin{tikzpicture}\n\\node (y) at (2, 2) {Y};\n\\end{tikzpicture}\n';
      defaultWorkspaceManager.openDocument({
        id: newHandle,
        title: 'Cloned Diagram',
        content: mutatedCode,
        hash: '',
        createdAt: Date.now(),
        updatedAt: Date.now(),
        version: 1,
        isDirty: true,
      });
      defaultWorkspaceManager.setActiveDocument(newHandle);
      await runtime.saveActiveCorpusEntry();

      // Source still has original content
      expect(runtime.corpusExplorer.openEntry(sourceHandle).source).toBe(sourceCode);
      expect(runtime.corpusExplorer.openEntry(newHandle).source).toBe(mutatedCode);

      runtime.dispose();
    });
  });

  describe('16B-AC-04 & 16B-AC-05: Session Durability & Dirty Buffer Recovery', () => {
    it('serializes workspace state, recovers dirty buffers on restore, and drops buffer if it equals head', async () => {
      const runtime = createWorkbenchRuntime({ bindKeybindings: false });
      const { handle } = runtime.createDiagram('Durability Doc');
      const headCode = '\\begin{tikzpicture}\n\\node (head) at (0, 0) {HEAD};\n\\end{tikzpicture}\n';
      defaultWorkspaceManager.updateContent(handle, headCode);
      await runtime.saveActiveCorpusEntry();

      // User makes unsaved edits
      const unsavedCode = '\\begin{tikzpicture}\n\\node (head) at (0, 0) {HEAD};\n\\node (edit) at (1, 1) {DIRTY};\n\\end{tikzpicture}\n';
      defaultWorkspaceManager.updateContent(handle, unsavedCode);
      expect(defaultWorkspaceManager.getActiveDocument()?.isDirty).toBe(true);

      // Flush session state to mock storage
      defaultWorkspaceManager.flushSessionState();

      const raw = mockStorage.getItem(STORAGE_KEY);
      expect(raw).toBeDefined();
      const parsed = JSON.parse(raw!);
      expect(parsed.activeDocId).toBe(handle);
      expect(parsed.dirtyBuffers[handle].content).toBe(unsavedCode);

      // Simulate reload with a fresh WorkspaceManager instance
      const wmReload = new (await import('../../../src/services/workspace/WorkspaceManager')).WorkspaceManager();
      const recovery = wmReload.restoreSessionState({
        resolveHeadContent: (h) => (h === handle ? headCode : null),
      });

      expect(recovery.recoveredCount).toBe(1);
      expect(recovery.dirtyHandles).toContain(handle);
      const restoredDoc = wmReload.getActiveDocument();
      expect(restoredDoc?.id).toBe(handle);
      expect(restoredDoc?.content).toBe(unsavedCode);
      expect(restoredDoc?.isDirty).toBe(true);

      // Test discarding all recovered buffers
      wmReload.discardAllRecovered({
        resolveHeadContent: (h) => (h === handle ? headCode : null),
      });
      expect(wmReload.getActiveDocument()?.content).toBe(headCode);
      expect(wmReload.getActiveDocument()?.isDirty).toBe(false);

      runtime.dispose();
    });

    it('closing the last remaining tab opens a fresh draft (16B-AC-05, D8)', () => {
      const wm = defaultWorkspaceManager;
      const initialDocId = wm.getActiveDocument()!.id;

      // Close only remaining tab
      const result = wm.closeDocument(initialDocId);
      expect(result).toBe(true);
      expect(wm.getOpenDocuments().length).toBe(1);
      expect(wm.getActiveDocument()?.id).not.toBe(initialDocId);
      expect(wm.getActiveDocument()?.title).toBe('Untitled diagram 1');
    });
  });

  describe('16B-AC-06: Idempotent Legacy Import', () => {
    it('imports legacy documents into zx:diagrams: without modifying localStorage', async () => {
      const runtime = createWorkbenchRuntime({ bindKeybindings: false });

      // Seed localStorage with legacy document fixture
      const legacyId1 = 'legacy-doc-1';
      const legacyDoc1 = {
        id: legacyId1,
        title: 'Legacy Graph 1',
        content: '\\begin{tikzpicture}\n\\node (l1) at (0, 0) {L1};\n\\end{tikzpicture}\n',
        createdAt: 1600000000000,
        updatedAt: 1600000050000,
      };

      const legacyId2 = 'legacy-doc-invalid';
      const legacyDoc2 = {
        id: legacyId2,
        title: 'Corrupt Legacy',
        content: 'Not a valid TikZ environment',
        createdAt: 1600000010000,
        updatedAt: 1600000060000,
      };

      mockStorage.setItem(LEGACY_INDEX_KEY, JSON.stringify([legacyId1, legacyId2]));
      mockStorage.setItem(LEGACY_DOC_PREFIX + legacyId1, JSON.stringify(legacyDoc1));
      mockStorage.setItem(LEGACY_DOC_PREFIX + legacyId2, JSON.stringify(legacyDoc2));

      // Run import
      const result1 = await runLegacyImport({
        corpusExplorer: runtime.corpusExplorer,
        authorDid: runtime.authorDid,
        workspaceManager: defaultWorkspaceManager,
        localStorage: mockStorage as any,
      });

      expect(result1.importedCount).toBe(1); // legacyDoc1 committed
      expect(result1.failedDraftsCount).toBe(1); // legacyDoc2 opened as recoverable draft
      expect(result1.importedHandles).toHaveLength(2);

      // Verify localStorage was NEVER modified or deleted (D5)
      expect(mockStorage.getItem(LEGACY_INDEX_KEY)).toBe(JSON.stringify([legacyId1, legacyId2]));
      expect(mockStorage.getItem(LEGACY_DOC_PREFIX + legacyId1)).toBe(JSON.stringify(legacyDoc1));
      expect(mockStorage.getItem(LEGACY_DOC_PREFIX + legacyId2)).toBe(JSON.stringify(legacyDoc2));

      // Verify imported diagram metadata
      const committedHandle = result1.importedHandles[0];
      const meta = runtime.corpusExplorer.getDiagramMetadata(committedHandle);
      expect(meta?.source).toBe('legacy-import');
      expect(meta?.legacyId).toBe(legacyId1);
      expect(meta?.isImported).toBe(true);

      // Idempotency: run import again
      const result2 = await runLegacyImport({
        corpusExplorer: runtime.corpusExplorer,
        authorDid: runtime.authorDid,
        workspaceManager: defaultWorkspaceManager,
        localStorage: mockStorage as any,
      });

      expect(result2.importedCount).toBe(0);
      expect(result2.failedDraftsCount).toBe(0);
      expect(result2.importedHandles).toHaveLength(0);

      runtime.dispose();
    });
  });
});
