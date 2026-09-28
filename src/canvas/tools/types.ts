import type { GraphAST, NodeData, EdgeData, Point2D } from '../../core/domain/types';
import type { Raycaster } from '../input/Raycaster';
import type { GizmoRenderer } from '../renderers/GizmoRenderer';
import type { Stage } from '../Stage';

export interface SelectionStateIds {
  nodes: string[];
  edges: string[];
}

export interface ToolContext {
  stage: Stage;
  raycaster: Raycaster;
  gizmos: GizmoRenderer;
  getGraph: () => GraphAST;
  setGraph: (ast: GraphAST) => void;
  getSelectedIds: () => SelectionStateIds;
  setSelectedIds: (sel: SelectionStateIds) => void;
  commitGraphChange: (ast: GraphAST) => void;
  getActiveStyle?: () => string;
}

export interface CanvasTool {
  id: string;
  onPointerDown(e: PointerEvent, world: Point2D): void;
  onPointerMove(e: PointerEvent, world: Point2D): void;
  onPointerUp(e: PointerEvent, world: Point2D): void;
  onPointerCancel(e: PointerEvent): void;
  onKeyDown(e: KeyboardEvent): void;
  dispose(): void;
}
