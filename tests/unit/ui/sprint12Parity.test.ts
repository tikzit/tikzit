import { describe, it, expect, vi } from 'vitest';
import { parseTikz } from '../../../src/core/parser';
import { emitTikz } from '../../../src/core/parser/emitter';
import { computeEdgeControls } from '../../../src/canvas/bezier';
import { createKeybindingDispatcher } from '../../../src/services/keybindings';

describe('Sprint 12: Visual Regression & Final Desktop Parity Unit Suite', () => {
  it('verifies canonical desktop reference scenario AST structure and TikZ emission', () => {
    const input = String.raw`\begin{tikzpicture}
\begin{pgfonlayer}{nodelayer}
\node [style=none] (0) at (-1, 0) {};
\node [style=none] (1) at (1, 0) {};
\end{pgfonlayer}
\begin{pgfonlayer}{edgelayer}
\draw (0) to (1);
\draw [in=135, out=45, loop] (0) to ();
\draw [in=135, out=45, loop] (1) to ();
\end{pgfonlayer}
\end{tikzpicture}`;

    const ast = parseTikz(input);
    expect(ast.nodes).toHaveLength(2);
    expect(ast.edges).toHaveLength(3);

    // Verify coordinates
    const n0 = ast.nodes.find(n => n.id === '0')!;
    const n1 = ast.nodes.find(n => n.id === '1')!;
    expect(n0.position).toEqual({ x: -1, y: 0 });
    expect(n1.position).toEqual({ x: 1, y: 0 });

    // Verify self loops
    const selfLoops = ast.edges.filter(e => e.sourceId === e.targetId);
    expect(selfLoops).toHaveLength(2);
    for (const loop of selfLoops) {
      expect(loop.data.some(p => p.key === 'loop')).toBe(true);
      expect(loop.data.find(p => p.key === 'in')?.value).toBe('135');
      expect(loop.data.find(p => p.key === 'out')?.value).toBe('45');
    }

    // Verify round-trip emitted string preserves canonical syntax
    const emitted = emitTikz(ast);
    expect(emitted).toContain('(0) to (1);');
    expect(emitted).toContain('[in=135, out=45, loop] (0) to ();');
    expect(emitted).toContain('[in=135, out=45, loop] (1) to ();');
  });

  it('computes upward teardrop self-loop control points matching C++ TikZiT math', () => {
    const nodePos = { x: 0, y: 0 };
    const controls = computeEdgeControls({
      src: nodePos,
      target: nodePos,
      sourceId: '0',
      targetId: '0',
      inAngle: 135,
      outAngle: 45,
      weight: 1.0,
    });

    expect(controls.isSelfLoop).toBe(true);
    // Control points should form an upward lobe
    // in=135° (top-left: x < 0, y > 0) and out=45° (top-right: x > 0, y > 0)
    expect(controls.cp1.y).toBeGreaterThan(0);
    expect(controls.cp2.y).toBeGreaterThan(0);
    expect(controls.cp1.x).toBeGreaterThan(0); // out=45° is start cp1
    expect(controls.cp2.x).toBeLessThan(0);    // in=135° is end cp2
  });

  it('keybinding dispatcher calls preventDefault on Backspace and Delete to safeguard Safari history', () => {
    const mockCtx: any = {
      command: {
        has: vi.fn().mockReturnValue(true),
        execute: vi.fn(),
      },
      tool: {
        setTool: vi.fn(),
      },
    };

    let listener: any;
    const mockWindow = {
      addEventListener: vi.fn((event, fn) => {
        if (event === 'keydown') listener = fn;
      }),
      removeEventListener: vi.fn(),
    };

    const cleanup = createKeybindingDispatcher(mockCtx, mockWindow as any);
    expect(mockWindow.addEventListener).toHaveBeenCalledWith('keydown', expect.any(Function));

    // Test Backspace
    const preventDefaultBs = vi.fn();
    listener({ key: 'Backspace', preventDefault: preventDefaultBs });
    expect(preventDefaultBs).toHaveBeenCalled();
    expect(mockCtx.command.execute).toHaveBeenCalledWith('cmd:edit:delete');

    // Test Delete
    const preventDefaultDel = vi.fn();
    listener({ key: 'Delete', preventDefault: preventDefaultDel });
    expect(preventDefaultDel).toHaveBeenCalled();
    expect(mockCtx.command.execute).toHaveBeenCalledWith('cmd:edit:delete');

    cleanup();
    expect(mockWindow.removeEventListener).toHaveBeenCalledWith('keydown', listener);
  });
});
