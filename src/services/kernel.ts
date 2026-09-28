import { Context, Service } from 'cordis';
import type { GraphAST, TikzStylesCatalog, TikzStyle } from '../core/domain/types';
import { setProperty } from '../core/domain/types';
import { getDefaultStylesCatalog } from '../core/styles/presets';
import { createEmptyAST } from '../core/parser/parser';
import './events';

export type ToolMode = 'select' | 'vertex' | 'edge' | 'bbox';

declare module 'cordis' {
  interface Context {
    tool: ToolService;
    selection: SelectionService;
    command: CommandService;
    graph: GraphService;
    styles: StyleService;
  }
}

/**
 * Service managing active drawing tool (Select, Vertex, Edge, BBox)
 */
export class ToolService extends Service {
  private _currentTool: ToolMode = 'select';

  constructor(ctx: Context) {
    super(ctx, 'tool');
  }

  get current(): ToolMode {
    return this._currentTool;
  }

  setTool(tool: ToolMode): void {
    if (this._currentTool !== tool) {
      this._currentTool = tool;
      this.ctx.emit('tikzit/tool:set', tool);
      this.ctx.emit('tool:set', tool);
    }
  }

  onToolChange(callback: (tool: ToolMode) => void): () => void {
    return this.ctx.on('tikzit/tool:set', callback);
  }
}

/**
 * Service managing selected diagram elements
 */
export class SelectionService extends Service {
  public selectedNodes = new Set<string>();
  public selectedEdges = new Set<string>();

  constructor(ctx: Context) {
    super(ctx, 'selection');
  }

  selectNode(id: string, additive: boolean = false): void {
    if (!additive) {
      this.selectedNodes.clear();
      this.selectedEdges.clear();
    }
    this.selectedNodes.add(id);
    const payload = {
      nodes: Array.from(this.selectedNodes),
      edges: Array.from(this.selectedEdges),
    };
    this.ctx.emit('tikzit/selection:change', payload);
    this.ctx.emit('selection:change', payload);
  }

  selectEdge(id: string, additive: boolean = false): void {
    if (!additive) {
      this.selectedNodes.clear();
      this.selectedEdges.clear();
    }
    this.selectedEdges.add(id);
    const payload = {
      nodes: Array.from(this.selectedNodes),
      edges: Array.from(this.selectedEdges),
    };
    this.ctx.emit('tikzit/selection:change', payload);
    this.ctx.emit('selection:change', payload);
  }

  clearSelection(): void {
    this.selectedNodes.clear();
    this.selectedEdges.clear();
    const payload = { nodes: [], edges: [] };
    this.ctx.emit('tikzit/selection:change', payload);
    this.ctx.emit('selection:change', payload);
  }
}

/**
 * Service managing workbench command registration and execution
 */
export class CommandService extends Service {
  private commands = new Map<string, (...args: any[]) => any>();

  constructor(ctx: Context) {
    super(ctx, 'command');
  }

  register(id: string, handler: (...args: any[]) => any): () => void {
    if (this.commands.has(id)) {
      throw new Error(`Command already registered: ${id}`);
    }
    this.commands.set(id, handler);
    return () => {
      if (this.commands.get(id) === handler) {
        this.commands.delete(id);
      }
    };
  }

  execute(id: string, ...args: any[]): any {
    const handler = this.commands.get(id);
    if (!handler) {
      throw new Error(`Command not registered: ${id}`);
    }
    return handler(...args);
  }

  has(id: string): boolean {
    return this.commands.has(id);
  }

  list(): string[] {
    return Array.from(this.commands.keys());
  }
}

/**
 * Service managing active graph AST and mutations
 */
export class GraphService extends Service {
  private _ast: GraphAST = createEmptyAST();

  constructor(ctx: Context) {
    super(ctx, 'graph');
  }

  get ast(): GraphAST {
    return this._ast;
  }

  setAST(ast: GraphAST): void {
    this._ast = ast;
    this.ctx.emit('tikzit/graph:change', ast);
    this.ctx.emit('graph:change', ast);
  }
}

/**
 * Create and initialize the root Cordis service context
 */

/**
 * Service managing active stylesheet catalog and style mutations
 */
export class StyleService extends Service {
  private _catalog: TikzStylesCatalog = getDefaultStylesCatalog();

  constructor(ctx: Context) {
    super(ctx, 'styles');
  }

  get catalog(): TikzStylesCatalog {
    return this._catalog;
  }

  getCatalog(): TikzStylesCatalog {
    return this._catalog;
  }

  get styles(): TikzStyle[] {
    return this._catalog.styles;
  }

  getStyle(name: string): TikzStyle | undefined {
    return this._catalog.styles.find((s) => s.name === name);
  }

  setCatalog(catalog: TikzStylesCatalog): void {
    this._catalog = catalog;
    this.ctx.emit('tikzit/styles:change', catalog);
  }

  addStyle(style: TikzStyle): void {
    const existingIndex = this._catalog.styles.findIndex((s) => s.name === style.name);
    const newStyles = [...this._catalog.styles];
    if (existingIndex >= 0) {
      newStyles[existingIndex] = style;
    } else {
      newStyles.push(style);
    }
    this._catalog = { styles: newStyles };
    this.ctx.emit('tikzit/styles:change', this._catalog);
  }

  removeStyle(name: string): void {
    this._catalog = {
      styles: this._catalog.styles.filter((s) => s.name !== name),
    };
    this.ctx.emit('tikzit/styles:change', this._catalog);
  }

  applyStyleToNodes(nodeIds: string[], styleName: string): void {
    const graph = this.ctx.graph.ast;
    const nodeSet = new Set(nodeIds);
    let changed = false;
    for (const node of graph.nodes) {
      if (nodeSet.has(node.id) || nodeSet.has(node.name)) {
        node.data = setProperty(node.data, 'style', styleName);
        (node as any).style = styleName;
        changed = true;
      }
    }
    if (changed) {
      this.ctx.graph.setAST({ ...graph });
    }
  }

  applyStyleToEdges(edgeIds: string[], styleName: string): void {
    const graph = this.ctx.graph.ast;
    const edgeSet = new Set(edgeIds);
    let changed = false;
    for (const edge of graph.edges) {
      if (edgeSet.has(edge.id)) {
        edge.data = setProperty(edge.data, 'style', styleName);
        changed = true;
      }
    }
    if (changed) {
      this.ctx.graph.setAST({ ...graph });
    }
  }
}

export function createKernelContext(): Context {
  const ctx = new Context();
  new ToolService(ctx);
  new SelectionService(ctx);
  new CommandService(ctx);
  new GraphService(ctx);
  new StyleService(ctx);
  return ctx;
}
