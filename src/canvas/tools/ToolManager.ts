import type { ToolMode } from '../../services/kernel';
import type { GraphAST, NodeData, EdgeData, Point2D } from '../../core/domain/types';
import type { Raycaster } from '../input/Raycaster';
import type { GizmoRenderer } from '../renderers/GizmoRenderer';
import type { Stage } from '../Stage';
import type { CanvasTool, ToolContext, SelectionStateIds } from './types';
import { SelectTool } from './SelectTool';
import { VertexTool } from './VertexTool';
import { EdgeTool } from './EdgeTool';
import { BBoxTool } from './BBoxTool';

export interface ToolManagerOptions {
  stage: Stage;
  raycaster: Raycaster;
  gizmos: GizmoRenderer;
  getGraph: () => GraphAST;
  setGraph: (ast: GraphAST) => void;
  getSelectedIds: () => SelectionStateIds;
  setSelectedIds: (sel: SelectionStateIds) => void;
  onToolChange?: (tool: ToolMode) => void;
  commitGraphChange: (ast: GraphAST) => void;
  getActiveStyle?: () => string;
  canvas?: HTMLCanvasElement;
}

export class ToolManager {
  private ctx: ToolContext;
  private tools: Map<string, CanvasTool> = new Map();
  private activeTool: CanvasTool;
  private canvas: HTMLCanvasElement;
  private onToolChange?: (tool: ToolMode) => void;

  private onPointerDownBound: (e: PointerEvent) => void;
  private onPointerMoveBound: (e: PointerEvent) => void;
  private onPointerUpBound: (e: PointerEvent) => void;
  private onPointerCancelBound: (e: PointerEvent) => void;
  private onKeyDownBound: (e: KeyboardEvent) => void;

  constructor(options: ToolManagerOptions) {
    this.canvas = options.canvas || options.stage.canvas;
    this.onToolChange = options.onToolChange;

    this.ctx = {
      stage: options.stage,
      raycaster: options.raycaster,
      gizmos: options.gizmos,
      getGraph: options.getGraph,
      setGraph: options.setGraph,
      getSelectedIds: options.getSelectedIds,
      setSelectedIds: options.setSelectedIds,
      commitGraphChange: options.commitGraphChange,
      getActiveStyle: options.getActiveStyle,
    };

    const selectTool = new SelectTool(this.ctx);
    const vertexTool = new VertexTool(this.ctx);
    const edgeTool = new EdgeTool(this.ctx);
    const bboxTool = new BBoxTool(this.ctx);

    this.tools.set('select', selectTool);
    this.tools.set('vertex', vertexTool);
    this.tools.set('edge', edgeTool);
    this.tools.set('bbox', bboxTool);
    this.tools.set('crop', bboxTool);

    this.activeTool = selectTool;

    this.onPointerDownBound = this.handlePointerDown.bind(this);
    this.onPointerMoveBound = this.handlePointerMove.bind(this);
    this.onPointerUpBound = this.handlePointerUp.bind(this);
    this.onPointerCancelBound = this.handlePointerCancel.bind(this);
    this.onKeyDownBound = this.handleKeyDown.bind(this);

    this.attach();
    this.updateCursor();
  }

  public attach(): void {
    this.canvas.addEventListener('pointerdown', this.onPointerDownBound);
    this.canvas.addEventListener('pointermove', this.onPointerMoveBound);
    this.canvas.addEventListener('pointerup', this.onPointerUpBound);
    this.canvas.addEventListener('pointercancel', this.onPointerCancelBound);
    if (typeof window !== 'undefined') {
      window.addEventListener('keydown', this.onKeyDownBound);
    }
  }

  public detach(): void {
    this.canvas.removeEventListener('pointerdown', this.onPointerDownBound);
    this.canvas.removeEventListener('pointermove', this.onPointerMoveBound);
    this.canvas.removeEventListener('pointerup', this.onPointerUpBound);
    this.canvas.removeEventListener('pointercancel', this.onPointerCancelBound);
    if (typeof window !== 'undefined') {
      window.removeEventListener('keydown', this.onKeyDownBound);
    }
  }

  public updateCursor(): void {
    if (!this.canvas || !this.canvas.style) return;
    const toolId = this.activeTool ? this.activeTool.id : 'select';
    switch (toolId) {
      case 'vertex':
      case 'edge':
      case 'bbox':
      case 'crop':
        this.canvas.style.cursor = 'crosshair';
        break;
      case 'select':
      default:
        this.canvas.style.cursor = 'default';
        break;
    }
  }

  public setTool(mode: ToolMode): void {
    const next = this.tools.get(mode);
    if (!next || next === this.activeTool) return;

    const cancelEvt = typeof PointerEvent !== 'undefined'
      ? new PointerEvent('pointercancel')
      : ({ type: 'pointercancel' } as unknown as PointerEvent);
    this.activeTool.onPointerCancel(cancelEvt);
    this.activeTool = next;
    this.updateCursor();
    if (this.onToolChange) {
      this.onToolChange(mode);
    }
  }

  public getActiveTool(): ToolMode {
    return this.activeTool.id as ToolMode;
  }

  /**
   * Section 2.1: Reflection operators across bounding box center
   */
  public reflectSelectedNodes(direction: 'horizontal' | 'vertical'): void {
    const graph = this.ctx.getGraph();
    const sel = this.ctx.getSelectedIds();
    if (sel.nodes.length === 0) return;

    const selNodes = graph.nodes.filter((n) => sel.nodes.includes(n.id));
    if (selNodes.length === 0) return;

    let minX = Infinity, maxX = -Infinity;
    let minY = Infinity, maxY = -Infinity;
    for (const n of selNodes) {
      if (n.position.x < minX) minX = n.position.x;
      if (n.position.x > maxX) maxX = n.position.x;
      if (n.position.y < minY) minY = n.position.y;
      if (n.position.y > maxY) maxY = n.position.y;
    }

    const cx = (minX + maxX) / 2;
    const cy = (minY + maxY) / 2;
    const selSet = new Set(sel.nodes);

    for (const n of graph.nodes) {
      if (selSet.has(n.id)) {
        if (direction === 'horizontal') {
          n.position.x = 2 * cx - n.position.x;
        } else {
          n.position.y = 2 * cy - n.position.y;
        }
      }
    }

    // Induced edges: flip bend sign
    for (const ed of graph.edges) {
      if (selSet.has(ed.sourceId) && selSet.has(ed.targetId)) {
        const bLeft = ed.data.find((p) => p.key === 'bend left');
        const bRight = ed.data.find((p) => p.key === 'bend right');
        if (bLeft) {
          bLeft.key = 'bend right';
        } else if (bRight) {
          bRight.key = 'bend left';
        }
      }
    }

    this.ctx.commitGraphChange({ ...graph });
  }

  /**
   * Section 2.1: Rotate selected nodes 90 deg clockwise or counter-clockwise about origin
   */
  public rotateSelectedNodes(clockwise = true): void {
    const graph = this.ctx.getGraph();
    const sel = this.ctx.getSelectedIds();
    if (sel.nodes.length === 0) return;

    const selSet = new Set(sel.nodes);
    for (const n of graph.nodes) {
      if (selSet.has(n.id)) {
        const { x, y } = n.position;
        if (clockwise) {
          n.position.x = y;
          n.position.y = -x;
        } else {
          n.position.x = -y;
          n.position.y = x;
        }
      }
    }

    this.ctx.commitGraphChange({ ...graph });
  }

  private handlePointerDown(e: PointerEvent): void {
    // If middle click or space held, panning takes priority
    if (e.button === 1 || e.button === 2) return;

    const rect = this.canvas.getBoundingClientRect();
    const screenX = e.clientX - rect.left;
    const screenY = e.clientY - rect.top;
    const world = this.ctx.raycaster.screenToWorld(screenX, screenY);

    try {
      this.canvas.setPointerCapture(e.pointerId);
    } catch {
      // Ignore if not supported
    }

    this.activeTool.onPointerDown(e, world);
    this.ctx.stage.render();
  }

  private handlePointerMove(e: PointerEvent): void {
    const rect = this.canvas.getBoundingClientRect();
    const screenX = e.clientX - rect.left;
    const screenY = e.clientY - rect.top;
    const world = this.ctx.raycaster.screenToWorld(screenX, screenY);

    this.activeTool.onPointerMove(e, world);
    this.ctx.stage.render();
  }

  private handlePointerUp(e: PointerEvent): void {
    const rect = this.canvas.getBoundingClientRect();
    const screenX = e.clientX - rect.left;
    const screenY = e.clientY - rect.top;
    const world = this.ctx.raycaster.screenToWorld(screenX, screenY);

    this.activeTool.onPointerUp(e, world);

    try {
      if (this.canvas.hasPointerCapture(e.pointerId)) {
        this.canvas.releasePointerCapture(e.pointerId);
      }
    } catch {
      // Ignore
    }
    this.ctx.stage.render();
  }

  private handlePointerCancel(e: PointerEvent): void {
    this.activeTool.onPointerCancel(e);
    this.ctx.stage.render();
  }

  private handleKeyDown(e: KeyboardEvent): void {
    // Input suppression
    const target = e.target as HTMLElement;
    const tag = target?.tagName?.toLowerCase();
    if (tag === 'input' || tag === 'textarea' || target?.isContentEditable) {
      return;
    }

    // Tool switching keys without modifiers
    if (!e.ctrlKey && !e.metaKey && !e.altKey) {
      const key = e.key.toUpperCase();
      if (key === 'S') {
        this.setTool('select');
        e.preventDefault();
        return;
      } else if (key === 'V' || key === 'N') {
        this.setTool('vertex');
        e.preventDefault();
        return;
      } else if (key === 'E') {
        this.setTool('edge');
        e.preventDefault();
        return;
      } else if (key === 'B') {
        this.setTool('bbox');
        e.preventDefault();
        return;
      }
    }

    // Pass arrows / delete to active tool
    this.activeTool.onKeyDown(e);
  }

  public dispose(): void {
    this.detach();
    for (const tool of this.tools.values()) {
      if (typeof (tool as any).dispose === 'function') {
        (tool as any).dispose();
      }
    }
    this.tools.clear();
  }
}
