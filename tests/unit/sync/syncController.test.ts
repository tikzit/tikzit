import { describe, it, expect, vi } from 'vitest';
import { SyncController } from '../../../src/services/sync/SyncController';
import type { GraphAST } from '../../../src/core/domain/types';

describe('SyncController', () => {
  const initialAST: GraphAST = {
    data: [],
    paths: [],
    nodes: [{ id: '0', name: '0', label: 'A', position: { x: 0, y: 0 }, data: [] }],
    edges: [],
  };

  it('syncs canvas changes to editor text and suppresses echo', () => {
    const sync = new SyncController(initialAST, 50);
    const listener = vi.fn();
    sync.subscribe(listener);

    const updatedAST: GraphAST = {
      ...initialAST,
      nodes: [
        ...initialAST.nodes,
        { id: '1', name: '1', label: 'B', position: { x: 2, y: 0 }, data: [] },
      ],
    };

    sync.commitFromCanvas(updatedAST);

    expect(listener).toHaveBeenCalled();
    const event = listener.mock.calls[0][0];
    expect(event.origin).toBe('canvas');
    expect(event.sourceCode).toContain('\\node (0)');
    expect(event.sourceCode).toContain('\\node (1)');
    expect(event.diagnostics.length).toBe(0);
  });

  it('parses valid editor updates with debounce', async () => {
    const sync = new SyncController(initialAST, 30);
    const validTikz = `\\begin{tikzpicture}
\\node (a) at (1, 1) {X};
\\end{tikzpicture}`;

    const onValidAST = vi.fn();
    sync.updateFromEditor(validTikz, onValidAST);

    await new Promise((resolve) => setTimeout(resolve, 60));

    expect(onValidAST).toHaveBeenCalled();
    const ast = onValidAST.mock.calls[0][0];
    expect(ast.nodes.length).toBe(1);
    expect(ast.nodes[0].name).toBe('a');
  });

  it('records diagnostic on invalid editor text without crashing canvas AST', async () => {
    const sync = new SyncController(initialAST, 30);
    const invalidTikz = '\\begin{tikzpicture}\n\\node unfinished (';

    sync.updateFromEditor(invalidTikz);
    await new Promise((resolve) => setTimeout(resolve, 60));

    const diags = sync.getDiagnostics();
    expect(diags.length).toBeGreaterThan(0);
    expect(diags[0].severity).toBe('error');
    // Retains initial valid AST
    expect(sync.getAST()?.nodes[0].name).toBe('0');
  });
});
