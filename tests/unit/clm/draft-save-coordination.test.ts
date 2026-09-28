import { describe, it, expect, beforeEach, vi } from 'vitest';
import { createWorkbenchRuntime } from '../../../src/services/createWorkbenchRuntime';
import { defaultWorkspaceManager } from '../../../src/services/workspace/WorkspaceManager';

class MockLocalStorage {
  private store = new Map<string, string>();
  getItem(key: string) { return this.store.get(key) ?? null; }
  setItem(key: string, value: string) { this.store.set(key, String(value)); }
  removeItem(key: string) { this.store.delete(key); }
  clear() { this.store.clear(); }
}

describe('Sprint 17B: Draft-to-MCard Save Coordination & State Invariants', () => {
  let mockStorage: MockLocalStorage;

  beforeEach(() => {
    mockStorage = new MockLocalStorage();
    (globalThis as any).localStorage = mockStorage;
    (globalThis as any).window = globalThis;
    defaultWorkspaceManager.reset();
  });

  const validEmptySource = '\\begin{tikzpicture}\n\\end{tikzpicture}\n';
  const validSourceA = '\\begin{tikzpicture}\n\\node (a) at (0, 0) {A};\n\\end{tikzpicture}\n';
  const validSourceB = '\\begin{tikzpicture}\n\\node (b) at (1, 1) {B};\n\\end{tikzpicture}\n';
  const invalidSource = '\\begin{tikzpicture}\n\\node [invalid syntax\n';

  it('T01 [17B-AC-01, 17B-AC-03]: saves valid empty draft, transitions to diagram, exposes history v1 with 0 prior rows', async () => {
    const runtime = createWorkbenchRuntime({ bindKeybindings: false });
    const { handle, document } = runtime.createDiagram('Empty Draft');

    expect(document.isDraft).toBe(true);
    expect(document.hash).toBe('');
    expect(document.isDirty).toBe(true);

    const result = await runtime.saveDiagram(handle);

    expect(result.success).toBe(true);
    expect(result.hash).toBeDefined();
    expect(result.persisted).toBe(true);

    const docAfter = defaultWorkspaceManager.getOpenDocuments().find((d) => d.id === handle);
    expect(docAfter?.isDraft).toBe(false);
    expect(docAfter?.hash).toBe(result.hash);
    expect(docAfter?.isDirty).toBe(false);

    const history = runtime.documentHistory(handle);
    expect(history.rows.length).toBe(1);
    expect(history.rows[0].position).toBe(1);
    expect(history.rows[0].isHead).toBe(true);
    expect(history.rows[0].hash).toBe(result.hash);

    runtime.dispose();
  });

  it('T05 [17B-AC-09]: rejects invalid parser fixture; preserves buffer, AST, and draft dirty state without persisted event', async () => {
    const runtime = createWorkbenchRuntime({ bindKeybindings: false });
    const { handle } = runtime.createDiagram('Syntax Error Draft');

    defaultWorkspaceManager.updateContent(handle, invalidSource);

    let persistedEmitted = false;
    runtime.ctx.on('tikzit/document:persisted', () => {
      persistedEmitted = true;
    });

    const result = await runtime.saveDiagram(handle);

    expect(result.success).toBe(false);
    expect(result.reason).toMatch(/parse|syntax|error|invalid/i);
    expect(persistedEmitted).toBe(false);

    const docAfter = defaultWorkspaceManager.getOpenDocuments().find((d) => d.id === handle);
    expect(docAfter?.isDraft).toBe(true);
    expect(docAfter?.hash).toBe('');
    expect(docAfter?.isDirty).toBe(true);
    expect(docAfter?.content).toBe(invalidSource);

    runtime.dispose();
  });

  it('T06 [17B-AC-05, 17B-AC-11]: save of byte-identical buffer returns unchanged without appending duplicate history', async () => {
    const runtime = createWorkbenchRuntime({ bindKeybindings: false });
    const { handle } = runtime.createDiagram('Unchanged Test');
    defaultWorkspaceManager.updateContent(handle, validSourceA);

    const res1 = await runtime.saveDiagram(handle);
    expect(res1.success).toBe(true);
    expect(res1.unchanged).toBeFalsy();

    // Mark dirty in workspace but keep content byte-identical
    defaultWorkspaceManager.updateContent(handle, validSourceA);
    const docBefore = defaultWorkspaceManager.getOpenDocuments().find((d) => d.id === handle);
    expect(docBefore?.isDirty).toBe(true);

    const res2 = await runtime.saveDiagram(handle);
    expect(res2.success).toBe(true);
    expect(res2.unchanged).toBe(true);

    const docAfter = defaultWorkspaceManager.getOpenDocuments().find((d) => d.id === handle);
    expect(docAfter?.isDirty).toBe(false);

    const history = runtime.documentHistory(handle);
    expect(history.rows.length).toBe(1);

    runtime.dispose();
  });

  it('T08 [17B-AC-01, 17B-AC-07, 17B-AC-11]: blocks mutations when persistence is stale or recovery-required', async () => {
    const runtime = createWorkbenchRuntime({ bindKeybindings: false });
    const { handle } = runtime.createDiagram('Blocked Test');

    runtime.stores.$corpusView.set({
      status: 'ready',
      persistence: 'stale',
      seedFailures: [],
    });

    const result = await runtime.saveDiagram(handle);
    expect(result.success).toBe(false);
    expect(result.reason).toContain('Persistence is stale');

    runtime.stores.$corpusView.set({
      status: 'ready',
      persistence: 'recovery-required',
      seedFailures: [],
    });

    const result2 = await runtime.saveDiagram(handle);
    expect(result2.success).toBe(false);
    expect(result2.reason).toContain('Persistence is recovery-required');

    runtime.dispose();
  });

  it('T09 [17B-AC-07]: single-flight deduplication coalesces identical-intent concurrent save calls', async () => {
    const runtime = createWorkbenchRuntime({ bindKeybindings: false });
    const { handle } = runtime.createDiagram('Dedup Test');
    defaultWorkspaceManager.updateContent(handle, validSourceA);

    const spyCommit = vi.spyOn(runtime.corpusExplorer, 'commitCorpusDocument');

    const [p1, p2, p3] = [
      runtime.saveDiagram(handle),
      runtime.saveDiagram(handle),
      runtime.saveDiagram(handle),
    ];

    const [res1, res2, res3] = await Promise.all([p1, p2, p3]);

    expect(res1.success).toBe(true);
    expect(res2).toBe(res1);
    expect(res3).toBe(res1);
    expect(spyCommit).toHaveBeenCalledTimes(1);

    runtime.dispose();
  });

  it('T10 [17B-AC-07, 17B-AC-12]: rejects concurrent save call with differing content or label while save is in flight', async () => {
    const runtime = createWorkbenchRuntime({ bindKeybindings: false });
    const { handle } = runtime.createDiagram('Conflict Test');
    defaultWorkspaceManager.updateContent(handle, validSourceA);

    let resolveBarrier: () => void = () => {};
    const barrierPromise = new Promise<void>((r) => { resolveBarrier = r; });

    const originalCommit = runtime.corpusExplorer.commitCorpusDocument.bind(runtime.corpusExplorer);
    vi.spyOn(runtime.corpusExplorer, 'commitCorpusDocument').mockImplementation(async (opts) => {
      await barrierPromise;
      return originalCommit(opts);
    });

    const savePromise1 = runtime.saveDiagram(handle, { sourceText: validSourceA });
    const savePromise2 = runtime.saveDiagram(handle, { sourceText: validSourceB });

    const res2 = await savePromise2;
    expect(res2.success).toBe(false);
    expect(res2.reason).toContain('Save operation already in progress');

    resolveBarrier();
    const res1 = await savePromise1;
    expect(res1.success).toBe(true);

    runtime.dispose();
  });

  it('T11 [17B-AC-04, 17B-AC-10]: updates head hash but retains dirty flag when newer edits arrive during save', async () => {
    const runtime = createWorkbenchRuntime({ bindKeybindings: false });
    const { handle } = runtime.createDiagram('Mid-flight Edits Test');
    defaultWorkspaceManager.updateContent(handle, validSourceA);

    let resolveCommit: () => void = () => {};
    const commitWait = new Promise<void>((r) => { resolveCommit = r; });

    const origCommit = runtime.corpusExplorer.commitCorpusDocument.bind(runtime.corpusExplorer);
    vi.spyOn(runtime.corpusExplorer, 'commitCorpusDocument').mockImplementation(async (opts) => {
      await commitWait;
      return origCommit(opts);
    });

    const savePromise = runtime.saveDiagram(handle);

    // Edit arrives while save of validSourceA is pending
    defaultWorkspaceManager.updateContent(handle, validSourceB);

    resolveCommit();
    const result = await savePromise;

    expect(result.success).toBe(true);

    const docAfter = defaultWorkspaceManager.getOpenDocuments().find((d) => d.id === handle);
    expect(docAfter?.hash).toBe(result.hash);
    expect(docAfter?.content).toBe(validSourceB);
    expect(docAfter?.isDirty).toBe(true);

    runtime.dispose();
  });

  it('T12 [17B-AC-10]: background save of document A does not mutate active document B', async () => {
    const runtime = createWorkbenchRuntime({ bindKeybindings: false });
    const docA = runtime.createDiagram('Doc A');
    const docB = runtime.createDiagram('Doc B');

    defaultWorkspaceManager.updateContent(docA.handle, validSourceA);
    defaultWorkspaceManager.updateContent(docB.handle, validSourceB);
    defaultWorkspaceManager.setActiveDocument(docB.handle);

    const resA = await runtime.saveDiagram(docA.handle);
    expect(resA.success).toBe(true);

    const docBAfter = defaultWorkspaceManager.getOpenDocuments().find((d) => d.id === docB.handle);
    expect(docBAfter?.content).toBe(validSourceB);
    expect(docBAfter?.isDirty).toBe(true);
    expect(docBAfter?.hash).toBe('');

    runtime.dispose();
  });

  it('T13 [17B-AC-05, 17B-AC-10, 17B-AC-11]: emits tikzit/document:persisted correlated to committed handle and hash', async () => {
    const runtime = createWorkbenchRuntime({ bindKeybindings: false });
    const { handle } = runtime.createDiagram('Persisted Event Test');
    defaultWorkspaceManager.updateContent(handle, validSourceA);

    const events: Array<{ handle: string; hash: string }> = [];
    runtime.ctx.on('tikzit/document:persisted', (ev: any) => {
      events.push(ev);
    });

    const result = await runtime.saveDiagram(handle);
    expect(result.success).toBe(true);
    expect(events.length).toBe(1);
    expect(events[0].handle).toBe(handle);
    expect(events[0].hash).toBe(result.hash);

    runtime.dispose();
  });

  it('T16 [17B-AC-06]: dismissDraftCallout suppresses notice for targeted handle and updates shared store', () => {
    const runtime = createWorkbenchRuntime({ bindKeybindings: false });
    const docA = runtime.createDiagram('Notice A');
    const docB = runtime.createDiagram('Notice B');

    expect(runtime.isDraftCalloutDismissed(docA.handle)).toBe(false);
    expect(runtime.isDraftCalloutDismissed(docB.handle)).toBe(false);

    runtime.dismissDraftCallout(docA.handle);

    expect(runtime.isDraftCalloutDismissed(docA.handle)).toBe(true);
    expect(runtime.isDraftCalloutDismissed(docB.handle)).toBe(false);
    expect(runtime.stores.$dismissedDraftCallouts.get()).toContain(docA.handle);

    runtime.dispose();
  });

  it('T19 [17B-AC-04, 17B-AC-11]: retryFlush flushes explorer, clears persistenceError and sets persistent state', async () => {
    const runtime = createWorkbenchRuntime({ bindKeybindings: false });
    runtime.stores.$corpusView.set({
      status: 'ready',
      persistence: 'non-persistent',
      persistenceError: 'Disk quota exceeded',
      seedFailures: [],
    });

    const spyFlush = vi.spyOn(runtime.corpusExplorer, 'flush').mockResolvedValue(undefined);

    const ok = await runtime.retryFlush();
    expect(ok).toBe(true);
    expect(spyFlush).toHaveBeenCalledTimes(1);

    const view = runtime.stores.$corpusView.get();
    expect(view.persistence).toBe('persistent');
    expect(view.persistenceError).toBeUndefined();

    runtime.dispose();
  });
});
