import { describe, it, expect, vi } from 'vitest';
import { createWorkbenchRuntime } from '../../../src/services/createWorkbenchRuntime';
import { createEmptyAST } from '../../../src/core/parser/parser';

describe('Workbench Runtime & Unidirectional State Isolation (Sprint 02B)', () => {
  it('creates hermetic, isolated runtimes with independent stores and contexts', () => {
    const runtimeA = createWorkbenchRuntime({ id: 'runtime_A' });
    const runtimeB = createWorkbenchRuntime({ id: 'runtime_B' });

    expect(runtimeA.id).toBe('runtime_A');
    expect(runtimeB.id).toBe('runtime_B');
    expect(runtimeA.ctx).not.toBe(runtimeB.ctx);
    expect(runtimeA.stores).not.toBe(runtimeB.stores);
    expect(runtimeA.triDb).not.toBe(runtimeB.triDb);

    // Initial baseline
    expect(runtimeA.stores.$toolMode.get()).toBe('select');
    expect(runtimeB.stores.$toolMode.get()).toBe('select');

    // Mutate runtime A tool
    runtimeA.ctx.tool.setTool('vertex');
    expect(runtimeA.stores.$toolMode.get()).toBe('vertex');
    expect(runtimeB.stores.$toolMode.get()).toBe('select'); // Runtime B untouched

    // Mutate runtime B tool
    runtimeB.ctx.tool.setTool('edge');
    expect(runtimeA.stores.$toolMode.get()).toBe('vertex');
    expect(runtimeB.stores.$toolMode.get()).toBe('edge');

    // Cleanup
    runtimeA.dispose();
    runtimeB.dispose();
  });

  it('provides idempotent teardown without throwing or breaking surviving instances', () => {
    const runtime1 = createWorkbenchRuntime({ id: 'rt_1' });
    const runtime2 = createWorkbenchRuntime({ id: 'rt_2' });

    expect(runtime1.isDisposed).toBe(false);
    expect(runtime2.isDisposed).toBe(false);

    // First dispose
    runtime1.dispose();
    expect(runtime1.isDisposed).toBe(true);
    expect(runtime2.isDisposed).toBe(false);

    // Second dispose on same instance should be idempotent and no-op
    expect(() => runtime1.dispose()).not.toThrow();
    expect(runtime1.isDisposed).toBe(true);

    // Runtime 2 remains fully functional
    runtime2.ctx.tool.setTool('bbox');
    expect(runtime2.stores.$toolMode.get()).toBe('bbox');

    runtime2.dispose();
    expect(runtime2.isDisposed).toBe(true);
  });

  it('enforces unidirectional state projection from Cordis events to Nanostores', () => {
    const runtime = createWorkbenchRuntime();

    // 1. Tool mode projection
    const toolHistory: string[] = [];
    const unsubTool = runtime.stores.$toolMode.subscribe((t) => toolHistory.push(t));

    runtime.ctx.tool.setTool('vertex');
    runtime.ctx.tool.setTool('edge');

    expect(toolHistory).toEqual(['select', 'vertex', 'edge']);
    expect(runtime.stores.$toolMode.get()).toBe('edge');
    unsubTool();

    // 2. Selection projection
    runtime.ctx.selection.selectNode('node_alpha');
    expect(runtime.stores.$selectedElements.get().nodes).toEqual(['node_alpha']);

    runtime.ctx.selection.selectEdge('edge_beta', true);
    expect(runtime.stores.$selectedElements.get().nodes).toEqual(['node_alpha']);
    expect(runtime.stores.$selectedElements.get().edges).toEqual(['edge_beta']);

    runtime.ctx.selection.clearSelection();
    expect(runtime.stores.$selectedElements.get()).toEqual({ nodes: [], edges: [] });

    // 3. Graph AST projection
    const ast = createEmptyAST();
    ast.nodes.push({
      id: '0',
      name: '0',
      label: '$\psi$',
      position: { x: 1, y: 2 },
      data: [],
    });

    runtime.ctx.graph.setAST(ast);
    expect(runtime.stores.$graphAST.get().nodes.length).toBe(1);
    expect(runtime.stores.$graphAST.get().nodes[0].name).toBe('0');

    // 4. Command execution invokes layout projections
    runtime.ctx.command.execute('cmd:view:sidebar');
    expect(runtime.stores.$workbenchLayout.get().isDrawerCollapsed).toBe(true);

    runtime.ctx.command.execute('cmd:dock:depress');
    expect(runtime.stores.$workbenchLayout.get().isWorkbenchDepressed).toBe(true);

    runtime.ctx.command.execute('cmd:dock:restore');
    expect(runtime.stores.$workbenchLayout.get().isWorkbenchDepressed).toBe(false);

    runtime.dispose();
  });

  it('CommandService rejects duplicate command registrations and is identity-safe', () => {
    const runtime = createWorkbenchRuntime();
    const handler1 = vi.fn().mockReturnValue('first');
    const handler2 = vi.fn().mockReturnValue('second');

    const unregister1 = runtime.ctx.command.register('test:cmd', handler1);
    expect(runtime.ctx.command.has('test:cmd')).toBe(true);

    // Duplicate registration throws
    expect(() => runtime.ctx.command.register('test:cmd', handler2)).toThrow(
      'Command already registered: test:cmd'
    );

    // Execute runs first handler
    expect(runtime.ctx.command.execute('test:cmd')).toBe('first');
    expect(handler1).toHaveBeenCalledTimes(1);

    // Identity-safe unregister
    unregister1();
    expect(runtime.ctx.command.has('test:cmd')).toBe(false);

    // Calling unregister again does not throw or corrupt state
    expect(() => unregister1()).not.toThrow();

    runtime.dispose();
  });
});
