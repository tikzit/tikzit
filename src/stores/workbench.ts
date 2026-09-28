import type { Context } from 'cordis';
import type { ToolMode } from '../services/kernel';
import type { GraphAST } from '../core/domain/types';
import {
  createWorkbenchStores,
  type SelectionState,
  type WorkbenchLayoutState,
  type ActiveDiagramState,
  type DocumentHeadState,
  type WorkbenchStores,
} from './createWorkbenchStores';

export {
  createWorkbenchStores,
  type SelectionState,
  type WorkbenchLayoutState,
  type ActiveDiagramState,
  type DocumentHeadState,
  type WorkbenchStores,
};

// ==========================================
// 1. DEFAULT FLUX STATE ATOMS & MAPS (Nanostores)
// ==========================================

const defaultStores = createWorkbenchStores();

export const $toolMode = defaultStores.$toolMode;
export const $theme = defaultStores.$theme;
export const $selectedElements = defaultStores.$selectedElements;
export const $workbenchLayout = defaultStores.$workbenchLayout;
export const $activeDiagram = defaultStores.$activeDiagram;
export const $graphAST = defaultStores.$graphAST;
export const $documentHead = defaultStores.$documentHead;
export const $stylesCatalog = defaultStores.$stylesCatalog;
export const $activeStyle = defaultStores.$activeStyle;
export const $styleFileName = defaultStores.$styleFileName;
export const $styleFileBuffer = defaultStores.$styleFileBuffer;

// ==========================================
// 2. FLUX ACTIONS (Unidirectional Dispatchers)
// ==========================================

export const toolActions = {
  setTool(tool: ToolMode) {
    $toolMode.set(tool);
  },
};

export const selectionActions = {
  selectNode(id: string, additive: boolean = false) {
    const current = $selectedElements.get();
    const newNodes = additive ? [...current.nodes.filter((n) => n !== id), id] : [id];
    const newEdges = additive ? current.edges : [];
    $selectedElements.set({ nodes: newNodes, edges: newEdges });
  },

  selectEdge(id: string, additive: boolean = false) {
    const current = $selectedElements.get();
    const newEdges = additive ? [...current.edges.filter((e) => e !== id), id] : [id];
    const newNodes = additive ? current.nodes : [];
    $selectedElements.set({ nodes: newNodes, edges: newEdges });
  },

  clearSelection() {
    $selectedElements.set({ nodes: [], edges: [] });
  },
};

export const workbenchActions = {
  toggleDrawer() {
    const current = $workbenchLayout.get().isDrawerCollapsed;
    $workbenchLayout.setKey('isDrawerCollapsed', !current);
  },

  setDrawerCollapsed(collapsed: boolean) {
    $workbenchLayout.setKey('isDrawerCollapsed', collapsed);
  },

  setDrawerWidth(width: number) {
    const clamped = Math.max(160, Math.min(600, width));
    $workbenchLayout.setKey('drawerWidth', clamped);
  },

  depressWorkbench() {
    $workbenchLayout.setKey('isWorkbenchDepressed', true);
  },

  restoreWorkbench() {
    $workbenchLayout.setKey('isWorkbenchDepressed', false);
  },

  setPanelCount(count: number) {
    $workbenchLayout.setKey('panelCount', count);
  },

  setTabsMenuOpen(open: boolean) {
    $workbenchLayout.setKey('tabsMenuOpen', open);
  },

  setThemeMenuOpen(open: boolean) {
    $workbenchLayout.setKey('themeMenuOpen', open);
  },

  toggleTabsMenu() {
    const current = $workbenchLayout.get().tabsMenuOpen;
    $workbenchLayout.setKey('tabsMenuOpen', !current);
  },

  toggleThemeMenu() {
    const current = $workbenchLayout.get().themeMenuOpen;
    $workbenchLayout.setKey('themeMenuOpen', !current);
  },
};

export const themeActions = {
  setTheme(theme: 'dark' | 'light') {
    $theme.set(theme);
    if (typeof document !== 'undefined') {
      if (theme === 'dark') {
        document.documentElement.classList.add('dark');
        document.documentElement.classList.remove('light');
      } else {
        document.documentElement.classList.add('light');
        document.documentElement.classList.remove('dark');
      }
      try {
        localStorage.setItem('tikzit:theme', theme);
      } catch (e) {
        // Ignore localStorage quota or access error in hermetic test env
      }
    }
  },

  toggleTheme() {
    const current = $theme.get();
    themeActions.setTheme(current === 'dark' ? 'light' : 'dark');
  },
};


export const styleActions = {
  setActiveStyle(styleName: string) {
    $activeStyle.set(styleName);
  },
  addStyle(style: any) {
    const current = $stylesCatalog.get();
    const existingIndex = current.styles.findIndex((s) => s.name === style.name);
    const newStyles = [...current.styles];
    if (existingIndex >= 0) {
      newStyles[existingIndex] = style;
    } else {
      newStyles.push(style);
    }
    $stylesCatalog.set({ styles: newStyles });
  },
  removeStyle(name: string) {
    const current = $stylesCatalog.get();
    $stylesCatalog.set({
      styles: current.styles.filter((s) => s.name !== name),
    });
  },
  applyStyleToSelected(styleName: string) {
    const sel = $selectedElements.get();
    const graph = $graphAST.get();
    let modified = false;

    if (sel.nodes.length > 0) {
      const nodeSet = new Set(sel.nodes);
      for (const node of graph.nodes) {
        if (nodeSet.has(node.id)) {
          const filtered = node.data.filter((p) => p.key !== 'style');
          filtered.push({ key: 'style', value: styleName });
          node.data = filtered;
          (node as any).style = styleName;
          modified = true;
        }
      }
    }
    if (sel.edges.length > 0) {
      const edgeSet = new Set(sel.edges);
      for (const edge of graph.edges) {
        if (edgeSet.has(edge.id)) {
          const filtered = edge.data.filter((p) => p.key !== 'style');
          filtered.push({ key: 'style', value: styleName });
          edge.data = filtered;
          modified = true;
        }
      }
    }
    if (modified) {
      $graphAST.set({ ...graph });
    }
  },
};

export const graphActions = {
  setAST(ast: GraphAST) {
    $graphAST.set(ast);
  },
};

// ==========================================
// 3. CORDIS <-> NANOSTORES BRIDGING
// ==========================================

export function bindStoresToKernel(ctx: Context): () => void {
  const disposers: Array<() => void> = [];

  // 1. Tool synchronization (Cordis -> Nanostores)
  disposers.push(
    ctx.on('tool:set' as any, (tool: ToolMode) => {
      if ($toolMode.get() !== tool) {
        $toolMode.set(tool);
      }
    })
  );

  // Nanostores -> Cordis (legacy synchronization for existing tests)
  disposers.push(
    $toolMode.listen((tool) => {
      if (ctx.tool.current !== tool) {
        ctx.tool.setTool(tool);
      }
    })
  );

  // 2. Selection synchronization (Cordis -> Nanostores)
  disposers.push(
    ctx.on('selection:change' as any, (payload: SelectionState) => {
      $selectedElements.set(payload);
    })
  );

  // 3. Graph AST synchronization (Cordis -> Nanostores)
  disposers.push(
    ctx.on('graph:change' as any, (ast: GraphAST) => {
      $graphAST.set(ast);
    })
  );

  // 4. Workbench Commands registered on Cordis command service
  disposers.push(ctx.command.register('cmd:view:sidebar', () => workbenchActions.toggleDrawer()));
  disposers.push(ctx.command.register('cmd:dock:depress', () => workbenchActions.depressWorkbench()));
  disposers.push(ctx.command.register('cmd:dock:restore', () => workbenchActions.restoreWorkbench()));
  disposers.push(ctx.command.register('cmd:view:toggle-theme', () => themeActions.toggleTheme()));

  return () => {
    disposers.forEach((unsub) => unsub());
  };
}
