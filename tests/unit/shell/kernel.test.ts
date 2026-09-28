import { describe, it, expect, vi } from 'vitest';
import { createKernelContext } from '../../../src/services/kernel';

describe('Cordis Kernel Service Mesh (Sprint 02)', () => {
  it('initializes root context and core services', () => {
    const ctx = createKernelContext();
    expect(ctx.tool).toBeDefined();
    expect(ctx.selection).toBeDefined();
    expect(ctx.command).toBeDefined();
    expect(ctx.graph).toBeDefined();
  });

  it('ToolService tracks active tool and dispatches reactive tool:set events', () => {
    const ctx = createKernelContext();
    expect(ctx.tool.current).toBe('select');

    let emittedTool = '';
    ctx.on('tool:set' as any, (tool: string) => {
      emittedTool = tool;
    });

    ctx.tool.setTool('vertex');
    expect(ctx.tool.current).toBe('vertex');
    expect(emittedTool).toBe('vertex');

    ctx.tool.setTool('edge');
    expect(ctx.tool.current).toBe('edge');
    expect(emittedTool).toBe('edge');

    ctx.tool.setTool('bbox');
    expect(ctx.tool.current).toBe('bbox');
    expect(emittedTool).toBe('bbox');
  });

  it('SelectionService manages selected nodes and edges', () => {
    const ctx = createKernelContext();
    let selectionEvent: any = null;
    ctx.on('selection:change' as any, (payload) => {
      selectionEvent = payload;
    });

    ctx.selection.selectNode('node_0');
    expect(ctx.selection.selectedNodes.has('node_0')).toBe(true);
    expect(selectionEvent.nodes).toEqual(['node_0']);

    ctx.selection.selectEdge('edge_1', true);
    expect(ctx.selection.selectedEdges.has('edge_1')).toBe(true);
    expect(selectionEvent.nodes).toEqual(['node_0']);
    expect(selectionEvent.edges).toEqual(['edge_1']);

    ctx.selection.clearSelection();
    expect(ctx.selection.selectedNodes.size).toBe(0);
    expect(ctx.selection.selectedEdges.size).toBe(0);
    expect(selectionEvent.nodes).toEqual([]);
    expect(selectionEvent.edges).toEqual([]);
  });

  it('CommandService registers, executes, and unregisters workbench commands', () => {
    const ctx = createKernelContext();
    const action = vi.fn().mockReturnValue(42);

    const unregister = ctx.command.register('cmd:test:action', action);
    expect(ctx.command.has('cmd:test:action')).toBe(true);
    expect(ctx.command.list()).toContain('cmd:test:action');

    const result = ctx.command.execute('cmd:test:action', 'arg1');
    expect(result).toBe(42);
    expect(action).toHaveBeenCalledWith('arg1');

    unregister();
    expect(ctx.command.has('cmd:test:action')).toBe(false);
    expect(() => ctx.command.execute('cmd:test:action')).toThrow();
  });
});
