import { describe, it, expect, beforeEach, vi } from 'vitest';
import { WorkspaceManager, STORAGE_KEY } from '../../../src/services/workspace/WorkspaceManager';

class MemoryStorage {
  private store = new Map<string, string>();
  getItem(key: string) { return this.store.get(key) ?? null; }
  setItem(key: string, value: string) { this.store.set(key, String(value)); }
  removeItem(key: string) { this.store.delete(key); }
  clear() { this.store.clear(); }
}

describe('WorkspaceManager', () => {
  let wm: WorkspaceManager;
  let mockStorage: MemoryStorage;

  beforeEach(() => {
    mockStorage = new MemoryStorage();
    (globalThis as any).localStorage = mockStorage;
    (globalThis as any).window = globalThis;
    wm = new WorkspaceManager();
  });

  it('initializes with default diagram tab', () => {
    const active = wm.getActiveDocument();
    expect(active).toBeDefined();
    expect(active?.title).toBe('01_spider_fusion.tikz');
    expect(wm.getOpenDocuments().length).toBe(1);
  });

  it('creates new tabs and switches active document', () => {
    const newDoc = wm.createNewDocument('Teleportation.tikz');
    expect(wm.getOpenDocuments().length).toBe(2);
    expect(wm.getActiveDocument()?.id).toBe(newDoc.id);

    // Switch back
    const defaultDoc = wm.getOpenDocuments()[0];
    wm.setActiveDocument(defaultDoc.id);
    expect(wm.getActiveDocument()?.id).toBe(defaultDoc.id);
  });

  it('closes document tabs and closing last remaining tab opens a fresh draft', () => {
    const newDoc = wm.createNewDocument('Temp.tikz');
    expect(wm.getOpenDocuments().length).toBe(2);

    const closed = wm.closeDocument(newDoc.id);
    expect(closed).toBe(true);
    expect(wm.getOpenDocuments().length).toBe(1);

    // Closing last remaining tab opens a fresh draft (16B-AC-05, D8)
    const initialDocId = wm.getOpenDocuments()[0].id;
    const closeLast = wm.closeDocument(initialDocId);
    expect(closeLast).toBe(true);
    expect(wm.getOpenDocuments().length).toBe(1);
    expect(wm.getOpenDocuments()[0].id).not.toBe(initialDocId);
    expect(wm.getActiveDocument()?.id).toBe(wm.getOpenDocuments()[0].id);
  });

  it('renames document and updates title in open documents', () => {
    const active = wm.getActiveDocument()!;
    wm.renameDocument(active.id, 'Renamed.tikz');
    expect(wm.getActiveDocument()?.title).toBe('Renamed.tikz');
  });

  it('marks a gated commit clean and advances its hash and sequence version', () => {
    const active = wm.getActiveDocument()!;
    wm.updateContent(active.id, 'edited source');
    wm.markCommitted(active.id, 'a'.repeat(64), 4);

    expect(wm.getActiveDocument()?.hash).toBe('a'.repeat(64));
    expect(wm.getActiveDocument()?.version).toBe(5);
    expect(wm.getActiveDocument()?.isDirty).toBe(false);
  });

  it('tracks dirty buffer state on content update', () => {
    const active = wm.getActiveDocument()!;
    expect(active.isDirty).toBe(false);

    wm.updateContent(active.id, 'mutated content');
    expect(wm.getActiveDocument()?.isDirty).toBe(true);

    wm.markClean(active.id);
    expect(wm.getActiveDocument()?.isDirty).toBe(false);
  });

  it('serializes session state to localStorage and restores dirty buffers', () => {
    const doc1 = wm.getActiveDocument()!;
    wm.updateContent(doc1.id, 'dirty content 1');
    wm.flushSessionState();

    const stored = localStorage.getItem(STORAGE_KEY);
    expect(stored).toBeDefined();
    const parsed = JSON.parse(stored!);
    expect(parsed.activeDocId).toBe(doc1.id);
    expect(parsed.openHandles).toContain(doc1.id);
    expect(parsed.dirtyBuffers[doc1.id].content).toBe('dirty content 1');

    // Create a new WorkspaceManager instance and restore
    const wm2 = new WorkspaceManager();
    const recovery = wm2.restoreSessionState({
      resolveHeadContent: (handle) => (handle === doc1.id ? 'clean head content' : null),
    });
    expect(recovery.recoveredCount).toBe(1);
    expect(recovery.dirtyHandles).toContain(doc1.id);
    expect(wm2.getActiveDocument()?.content).toBe('dirty content 1');
    expect(wm2.getActiveDocument()?.isDirty).toBe(true);
  });

  it('silently drops recovered buffer if buffer content matches head content', () => {
    const doc1 = wm.getActiveDocument()!;
    wm.updateContent(doc1.id, 'matching content');
    wm.flushSessionState();

    const wm2 = new WorkspaceManager();
    const recovery = wm2.restoreSessionState({
      resolveHeadContent: (handle) => (handle === doc1.id ? 'matching content' : null),
    });
    expect(recovery.recoveredCount).toBe(0);
    expect(recovery.dirtyHandles).toHaveLength(0);
    expect(wm2.getActiveDocument()?.isDirty).toBe(false);
  });

  it('discards all recovered edits cleanly', () => {
    const doc1 = wm.getActiveDocument()!;
    wm.updateContent(doc1.id, 'unsaved edits');
    expect(wm.getActiveDocument()?.isDirty).toBe(true);

    wm.discardAllRecovered({
      resolveHeadContent: (handle) => (handle === doc1.id ? 'clean original head' : null),
    });
    expect(wm.getActiveDocument()?.content).toBe('clean original head');
    expect(wm.getActiveDocument()?.isDirty).toBe(false);
  });

  it('handles localStorage quota or write errors gracefully without throwing', () => {
    const setItemSpy = vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('QuotaExceededError');
    });

    expect(() => {
      wm.flushSessionState();
    }).not.toThrow();

    setItemSpy.mockRestore();
  });
});
