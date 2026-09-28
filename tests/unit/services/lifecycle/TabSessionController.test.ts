import { describe, it, expect, vi } from 'vitest';
import { Context } from 'cordis';
import { TabSessionController } from '../../../../src/services/lifecycle/TabSessionController';
import { createWorkbenchStores } from '../../../../src/stores/createWorkbenchStores';
import { defaultWorkspaceManager } from '../../../../src/services/workspace/WorkspaceManager';

describe('Sprint 21: TabSessionController Multi-Document Management', () => {
  const createMockContext = () => {
    const ctx = new Context();
    (ctx as any).graph = { setAST: vi.fn() };
    return ctx;
  };

  const createMockExplorer = () => ({
    openEntry: vi.fn().mockReturnValue({
      entry: { title: 'Opened Diagram', hash: 'hash_123', updatedAt: 1000 },
      source: '\\begin{tikzpicture}\n\\end{tikzpicture}\n',
      ast: { nodes: [], edges: [], paths: [], data: [] },
      sequence: 2,
    }),
    listCorpusEntries: vi.fn().mockReturnValue({ entries: [] }),
  });

  it('T21-09: opens corpus entry and updates workspace and projections', () => {
    const ctx = createMockContext();
    const stores = createWorkbenchStores();
    const explorer = createMockExplorer() as any;
    const controller = new TabSessionController(ctx, stores, explorer);

    const handle = 'zx:diagrams:entry-1';
    const opened = controller.openCorpusEntry(handle);

    expect(opened.entry.title).toBe('Opened Diagram');
    expect(stores.$activeDiagram.get().name).toBe('Opened Diagram');
    expect(stores.$documentHead.get().hash).toBe('hash_123');
    expect(ctx.graph.setAST).toHaveBeenCalled();
  });

  it('T21-10: preserves dirty buffer content when reopening already open document', () => {
    const ctx = createMockContext();
    const stores = createWorkbenchStores();
    const explorer = createMockExplorer() as any;
    const controller = new TabSessionController(ctx, stores, explorer);

    const handle = 'zx:diagrams:dirty-reopen';
    defaultWorkspaceManager.openDocument({
      id: handle,
      title: 'Dirty Doc',
      content: '\\begin{tikzpicture}\n% custom dirty edit\n\\end{tikzpicture}\n',
      ast: { nodes: [], edges: [], paths: [], data: [] },
      hash: '',
      createdAt: 100,
      updatedAt: 100,
      version: 1,
      isDirty: true,
    });

    controller.openCorpusEntry(handle);
    const active = defaultWorkspaceManager.getActiveDocument();
    expect(active?.isDirty).toBe(true);
    expect(active?.content).toContain('% custom dirty edit');
  });

  it('T21-11: activates document and updates active diagram store', () => {
    const ctx = createMockContext();
    const stores = createWorkbenchStores();
    const explorer = createMockExplorer() as any;
    const controller = new TabSessionController(ctx, stores, explorer);

    const handle = 'zx:diagrams:active-test';
    defaultWorkspaceManager.openDocument({
      id: handle,
      title: 'Active Test Doc',
      content: '\\begin{tikzpicture}\n\\end{tikzpicture}\n',
      ast: { nodes: [], edges: [], paths: [], data: [] },
      hash: 'h',
      createdAt: 100,
      updatedAt: 100,
      version: 1,
      isDirty: false,
    });

    controller.activateDocument(handle);
    expect(stores.$activeDiagram.get().handle).toBe(handle);
    expect(stores.$activeDiagram.get().name).toBe('Active Test Doc');
  });

  it('T21-12: closes document cleanly', () => {
    const ctx = createMockContext();
    const stores = createWorkbenchStores();
    const explorer = createMockExplorer() as any;
    const controller = new TabSessionController(ctx, stores, explorer);

    const handle1 = 'zx:diagrams:close-1';
    defaultWorkspaceManager.openDocument({
      id: handle1,
      title: 'Doc 1',
      content: '',
      ast: { nodes: [], edges: [], paths: [], data: [] },
      hash: 'h1',
      createdAt: 100,
      updatedAt: 100,
      version: 1,
      isDirty: false,
    });

    controller.closeDocument(handle1);
    expect(defaultWorkspaceManager.getOpenDocuments().find(d => d.id === handle1)).toBeUndefined();
  });
});
