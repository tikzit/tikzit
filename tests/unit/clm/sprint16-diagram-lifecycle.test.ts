import { describe, it, expect, vi } from 'vitest';
import { createWorkbenchRuntime } from '../../../src/services/createWorkbenchRuntime';
import { defaultWorkspaceManager } from '../../../src/services/workspace/WorkspaceManager';
import { isDiagramHandle, validateSnapshot, CORPUS_SNAPSHOT_VERSION } from '../../../src/services/clm/corpusPersistence';

describe('Sprint 16 Phase B: Diagram Creation & MCard Lifecycle', () => {
  it('16-AC-01 & 16-AC-03: creates a new diagram with unique zx:diagrams: handle and draft status', () => {
    const runtime = createWorkbenchRuntime({ bindKeybindings: false });
    const { handle, document } = runtime.createDiagram();

    expect(handle).toMatch(/^zx:diagrams:/);
    expect(isDiagramHandle(handle)).toBe(true);
    expect(document.id).toBe(handle);
    expect(document.title).toBe('Untitled diagram 1');
    expect(document.isDirty).toBe(true);
    expect(document.hash).toBe('');

    const active = defaultWorkspaceManager.getActiveDocument();
    expect(active?.id).toBe(handle);

    runtime.dispose();
  });

  it('16-AC-02: repeated calls create separate diagrams with unique handles and sequential titles', () => {
    const runtime = createWorkbenchRuntime({ bindKeybindings: false });
    const d1 = runtime.createDiagram();
    const d2 = runtime.createDiagram();
    const d3 = runtime.createDiagram();

    expect(d1.handle).not.toBe(d2.handle);
    expect(d2.handle).not.toBe(d3.handle);
    expect(d1.document.title).toBe('Untitled diagram 1');
    expect(d2.document.title).toBe('Untitled diagram 2');
    expect(d3.document.title).toBe('Untitled diagram 3');

    runtime.dispose();
  });

  it('16-AC-04: first commit of a new diagram writes metadata card and advances handle', async () => {
    const runtime = createWorkbenchRuntime({ bindKeybindings: false });
    const persistedSpy = vi.fn();
    runtime.ctx.on('tikzit/document:persisted', persistedSpy);

    const { handle } = runtime.createDiagram('My First Diagram');
    const source = '\\begin{tikzpicture}\n\\node (a) at (0, 0) {A};\n\\end{tikzpicture}\n';
    defaultWorkspaceManager.updateContent(handle, source);

    const result = await runtime.saveActiveCorpusEntry();
    expect(result).not.toBeNull();
    expect(result?.success).toBe(true);
    expect(result?.persisted).toBe(true);
    expect(result?.hash).toMatch(/^[0-9a-f]{64}$/);

    // Verify metadata card
    const uuid = handle.slice('zx:diagrams:'.length);
    const metaHandle = `zx:meta:diagrams:${uuid}`;
    const metaHash = runtime.mcardCollection.resolveHandle(metaHandle);
    expect(metaHash).toBeDefined();

    const metaCard = runtime.mcardCollection.get(metaHash!);
    expect(metaCard).toBeDefined();
    expect(metaCard?.payload.kind).toBe('structured');
    if (metaCard?.payload.kind === 'structured') {
      const data = metaCard.payload.value as any;
      expect(data.title).toBe('My First Diagram');
      expect(data.source).toBe('user');
      expect(data.archived).toBe(false);
    }

    // Verify corpus index entry contains cached title
    const index = runtime.corpusExplorer.getCorpusIndex();
    const row = index.find((r) => r.handle === handle);
    expect(row).toBeDefined();
    expect(row?.title).toBe('My First Diagram');

    // Verify persisted signal
    expect(persistedSpy).toHaveBeenCalledWith(expect.objectContaining({ handle, hash: result?.hash }));

    runtime.dispose();
  });

  it('16-AC-04: saving an empty diagram succeeds and advances handle (D1)', async () => {
    const runtime = createWorkbenchRuntime({ bindKeybindings: false });
    const { handle } = runtime.createDiagram('Empty Diagram');

    // Default source is already empty tikzpicture
    const result = await runtime.saveActiveCorpusEntry();
    expect(result?.success).toBe(true);
    expect(result?.hash).toBeDefined();

    const resolved = runtime.mcardCollection.resolveHandle(handle);
    expect(resolved).toBeDefined();
    runtime.dispose();
  });

  it('16-AC-04: second commit advances handle and records prior head in history', async () => {
    const runtime = createWorkbenchRuntime({ bindKeybindings: false });
    const { handle } = runtime.createDiagram('Versioned Diagram');
    const v1Source = '\\begin{tikzpicture}\n\\node (a) at (0, 0) {V1};\n\\end{tikzpicture}\n';
    defaultWorkspaceManager.updateContent(handle, v1Source);

    const r1 = await runtime.saveActiveCorpusEntry();
    expect(r1?.success).toBe(true);
    const hash1 = r1!.hash;

    const v2Source = '\\begin{tikzpicture}\n\\node (a) at (0, 0) {V2};\n\\end{tikzpicture}\n';
    defaultWorkspaceManager.updateContent(handle, v2Source);

    const r2 = await runtime.saveActiveCorpusEntry();
    expect(r2?.success).toBe(true);
    const hash2 = r2!.hash;
    expect(hash2).not.toBe(hash1);

    const history = runtime.mcardCollection.history(handle);
    expect(history.length).toBeGreaterThanOrEqual(1);

    runtime.dispose();
  });

  it('16-AC-09: v1 snapshot loads as v2 snapshot without error and accepts user diagram handles', () => {
    const dummyPillar = new Uint8Array([0, 1, 2]);
    const v1Snapshot = {
      version: 1,
      generation: 1,
      savedAt: Date.now(),
      pillars: {
        knowledge: dummyPillar,
        executionLog: dummyPillar,
        mcard: dummyPillar,
      },
      corpusIndex: [
        { handle: 'zx:examples:01_spider_fusion', hash: 'a'.repeat(64), committedAt: 1000 },
        { handle: 'zx:diagrams:user-test-1234', hash: 'b'.repeat(64), committedAt: 2000, title: 'My User Diagram' },
      ],
    };

    const parsed = validateSnapshot(v1Snapshot);
    expect(parsed.version).toBe(CORPUS_SNAPSHOT_VERSION);
    expect(parsed.corpusIndex).toHaveLength(2);
    expect(parsed.corpusIndex[1].handle).toBe('zx:diagrams:user-test-1234');
    expect(parsed.corpusIndex[1].title).toBe('My User Diagram');
  });

  it('tikzit.diagram.create command executes and creates a diagram tab', async () => {
    const runtime = createWorkbenchRuntime({ bindKeybindings: false });
    const created = await runtime.ctx.command.execute('tikzit.diagram.create');

    expect(created).toBeDefined();
    expect((created as any).handle).toMatch(/^zx:diagrams:/);

    runtime.dispose();
  });
});
