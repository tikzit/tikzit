import { describe, it, expect, vi } from 'vitest';
import { DocumentProcess } from '../../../../src/services/lifecycle/DocumentProcess';
import { createWorkbenchStores } from '../../../../src/stores/createWorkbenchStores';
import { defaultWorkspaceManager } from '../../../../src/services/workspace/WorkspaceManager';

describe('Sprint 21: DocumentProcess Petri Net Lifecycle & Token Conservation', () => {
  const createMockExplorer = () => ({
    commitCorpusDocument: vi.fn().mockResolvedValue({
      success: true,
      hash: 'hash_abc123',
      persisted: true,
      sequence: 1,
      receiptHash: 'rcpt_xyz',
    }),
    listCorpusEntries: vi.fn().mockReturnValue({ entries: [] }),
  });

  it('T21-01: initializes with clean/draft places', () => {
    const stores = createWorkbenchStores();
    const explorer = createMockExplorer() as any;
    const proc = new DocumentProcess(stores, explorer, vi.fn());

    const { handle, document } = proc.createDiagram('Test Diagram');
    expect(proc.getPlace(handle)).toBe('Draft');
    expect(proc.isDirty(handle)).toBe(true);
    expect(document.title).toBe('Test Diagram');
    expect(stores.$activeDiagram.get().handle).toBe(handle);
  });

  it('T21-02: transitions places through clean and dirty tokens', () => {
    const stores = createWorkbenchStores();
    const explorer = createMockExplorer() as any;
    const proc = new DocumentProcess(stores, explorer, vi.fn());
    const handle = 'zx:diagrams:test-token';

    proc.setPlace(handle, 'Clean');
    expect(proc.getPlace(handle)).toBe('Clean');

    proc.markDirty(handle);
    expect(proc.getPlace(handle)).toBe('Dirty');
    expect(proc.isDirty(handle)).toBe(true);
  });

  it('T21-03: manages draft callout dismissal', () => {
    const stores = createWorkbenchStores();
    const explorer = createMockExplorer() as any;
    const proc = new DocumentProcess(stores, explorer, vi.fn());
    const handle = 'zx:diagrams:draft-callout';

    expect(proc.isDraftCalloutDismissed(handle)).toBe(false);
    proc.dismissDraftCallout(handle);
    expect(proc.isDraftCalloutDismissed(handle)).toBe(true);
  });

  it('T21-04: deduplicates concurrent save operations (single-flight)', async () => {
    const stores = createWorkbenchStores();
    let resolveCommit: (val: any) => void;
    const commitPromise = new Promise((resolve) => { resolveCommit = resolve; });
    const explorer = {
      commitCorpusDocument: vi.fn().mockReturnValue(commitPromise),
      listCorpusEntries: vi.fn().mockReturnValue({ entries: [] }),
    } as any;

    const proc = new DocumentProcess(stores, explorer, vi.fn());
    const { handle } = proc.createDiagram('Concurrent Save Test');

    const save1 = proc.saveDiagram(handle, { sourceText: 'content 1' });
    const save2 = proc.saveDiagram(handle, { sourceText: 'content 1' });

    // Second identical save returns the same in-flight promise
    expect(save1).toBe(save2);

    resolveCommit!({ success: true, hash: 'h1', persisted: true });
    const res = await save1;
    expect(res.success).toBe(true);
  });

  it('T21-05: halts save when persistence is stale', async () => {
    const stores = createWorkbenchStores();
    stores.$corpusView.set({ ...stores.$corpusView.get(), persistence: 'stale' });
    const explorer = createMockExplorer() as any;
    const proc = new DocumentProcess(stores, explorer, vi.fn());
    const { handle } = proc.createDiagram('Stale Test');

    const res = await proc.saveDiagram(handle);
    expect(res.success).toBe(false);
    expect(res.reason).toContain('Persistence is stale');
    expect(proc.getPlace(handle)).toBe('Stale');
  });

  it('T21-06: maintains dirty token if buffer changes during flush (H5 Token Conservation)', async () => {
    const stores = createWorkbenchStores();
    let resolveCommit: (val: any) => void;
    const explorer = {
      commitCorpusDocument: vi.fn().mockImplementation(() => new Promise((resolve) => { resolveCommit = resolve; })),
      listCorpusEntries: vi.fn().mockReturnValue({ entries: [] }),
    } as any;

    const proc = new DocumentProcess(stores, explorer, vi.fn());
    const { handle, document } = proc.createDiagram('Token Conservation Test');

    const initialText = document.content;
    const savePromise = proc.saveDiagram(handle, { sourceText: initialText });

    // Simulate user editing buffer while flush is pending
    defaultWorkspaceManager.updateContent(handle, initialText + '\n% new user edit while saving');

    resolveCommit!({ success: true, hash: 'committed_head', persisted: true });
    await savePromise;

    // Buffer has newer edits than flushed content: must maintain dirty state
    expect(proc.isDirty(handle)).toBe(true);
    expect(proc.getPlace(handle)).toBe('Dirty');
  });

  it('T21-07: clears dirty token if buffer matches flushed snapshot', async () => {
    const stores = createWorkbenchStores();
    const explorer = createMockExplorer() as any;
    const proc = new DocumentProcess(stores, explorer, vi.fn());
    const { handle, document } = proc.createDiagram('Clean Save Test');

    const res = await proc.saveDiagram(handle, { sourceText: document.content });
    expect(res.success).toBe(true);
    expect(proc.isDirty(handle)).toBe(false);
    expect(proc.getPlace(handle)).toBe('Persisted');
  });

  it('T21-08: clear() cleanly resets all internal state and tracking maps', () => {
    const stores = createWorkbenchStores();
    const explorer = createMockExplorer() as any;
    const proc = new DocumentProcess(stores, explorer, vi.fn());
    const { handle } = proc.createDiagram('Clear Test');

    proc.dismissDraftCallout(handle);
    expect(proc.isDraftCalloutDismissed(handle)).toBe(true);

    proc.clear();
    expect(proc.getPlace(handle)).toBe('Clean');
  });
});
