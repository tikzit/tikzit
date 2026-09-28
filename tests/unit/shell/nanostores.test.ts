import { describe, it, expect, beforeEach } from 'vitest';
import {
  $toolMode,
  $theme,
  $selectedElements,
  $workbenchLayout,
  $graphAST,
  toolActions,
  selectionActions,
  workbenchActions,
  themeActions,
  graphActions,
  bindStoresToKernel,
} from '../../../src/stores/workbench';
import { createKernelContext } from '../../../src/services/kernel';

describe('Nanostores Flux Architecture', () => {
  beforeEach(() => {
    // Reset stores to default baseline
    toolActions.setTool('select');
    themeActions.setTheme('dark');
    selectionActions.clearSelection();
    workbenchActions.setDrawerCollapsed(false);
    workbenchActions.setDrawerWidth(260);
    workbenchActions.restoreWorkbench();
    workbenchActions.setPanelCount(0);
    workbenchActions.setTabsMenuOpen(false);
    workbenchActions.setThemeMenuOpen(false);
  });

  it('maintains expected initial Flux store baseline', () => {
    expect($toolMode.get()).toBe('select');
    expect($theme.get()).toBe('dark');
    expect($selectedElements.get()).toEqual({ nodes: [], edges: [] });
    expect($workbenchLayout.get().isDrawerCollapsed).toBe(false);
    expect($workbenchLayout.get().drawerWidth).toBe(260);
    expect($workbenchLayout.get().isWorkbenchDepressed).toBe(false);
    expect($graphAST.get().nodes).toBeDefined();
  });

  it('dispatches toolActions and notifies store subscribers', () => {
    const received: string[] = [];
    const unbind = $toolMode.subscribe((val) => received.push(val));

    toolActions.setTool('vertex');
    toolActions.setTool('edge');
    toolActions.setTool('bbox');
    toolActions.setTool('select');

    unbind();
    expect(received).toEqual(['select', 'vertex', 'edge', 'bbox', 'select']);
    expect($toolMode.get()).toBe('select');
  });

  it('dispatches selectionActions with single, additive, and clear semantics', () => {
    selectionActions.selectNode('v0');
    expect($selectedElements.get()).toEqual({ nodes: ['v0'], edges: [] });

    // Additive node selection
    selectionActions.selectNode('v1', true);
    expect($selectedElements.get().nodes).toEqual(['v0', 'v1']);

    // Non-additive edge selection clears previous nodes
    selectionActions.selectEdge('e0', false);
    expect($selectedElements.get()).toEqual({ nodes: [], edges: ['e0'] });

    selectionActions.clearSelection();
    expect($selectedElements.get()).toEqual({ nodes: [], edges: [] });
  });

  it('dispatches workbenchActions for drawer, sashes, and kenotic depress/restore', () => {
    // Drawer toggle
    workbenchActions.toggleDrawer();
    expect($workbenchLayout.get().isDrawerCollapsed).toBe(true);
    workbenchActions.toggleDrawer();
    expect($workbenchLayout.get().isDrawerCollapsed).toBe(false);

    // Sash clamp bounds
    workbenchActions.setDrawerWidth(100); // clamped to min 160
    expect($workbenchLayout.get().drawerWidth).toBe(160);
    workbenchActions.setDrawerWidth(800); // clamped to max 600
    expect($workbenchLayout.get().drawerWidth).toBe(600);
    workbenchActions.setDrawerWidth(320);
    expect($workbenchLayout.get().drawerWidth).toBe(320);

    // Kenotic depress / restore
    workbenchActions.depressWorkbench();
    expect($workbenchLayout.get().isWorkbenchDepressed).toBe(true);
    workbenchActions.restoreWorkbench();
    expect($workbenchLayout.get().isWorkbenchDepressed).toBe(false);
  });

  it('dispatches themeActions and toggles between dark and light themes', () => {
    themeActions.toggleTheme();
    expect($theme.get()).toBe('light');

    themeActions.toggleTheme();
    expect($theme.get()).toBe('dark');

    themeActions.setTheme('light');
    expect($theme.get()).toBe('light');
  });

  it('synchronizes bidirectionally with Cordis service mesh via bindStoresToKernel', () => {
    const ctx = createKernelContext();
    const cleanup = bindStoresToKernel(ctx);

    // 1. Nanostores action -> Cordis ToolService
    toolActions.setTool('edge');
    expect(ctx.tool.current).toBe('edge');

    // 2. Cordis ToolService mutation -> Nanostores
    ctx.tool.setTool('bbox');
    expect($toolMode.get()).toBe('bbox');

    // 3. Cordis Selection event -> Nanostores
    ctx.selection.selectNode('node_alpha');
    expect($selectedElements.get().nodes).toContain('node_alpha');

    // 4. Cordis Commands invoke Nanostores Flux actions
    ctx.command.execute('cmd:view:sidebar');
    expect($workbenchLayout.get().isDrawerCollapsed).toBe(true);

    ctx.command.execute('cmd:dock:depress');
    expect($workbenchLayout.get().isWorkbenchDepressed).toBe(true);

    ctx.command.execute('cmd:dock:restore');
    expect($workbenchLayout.get().isWorkbenchDepressed).toBe(false);

    cleanup();

    // After cleanup, mutations should not synchronize
    ctx.tool.setTool('select');
    expect($toolMode.get()).toBe('bbox');
  });
});
