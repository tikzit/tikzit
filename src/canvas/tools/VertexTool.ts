import type { CanvasTool, ToolContext } from './types';
import type { Point2D, NodeData } from '../../core/domain/types';

export class VertexTool implements CanvasTool {
  public id = 'vertex';

  private ctx: ToolContext;

  constructor(ctx: ToolContext) {
    this.ctx = ctx;
  }

  public onPointerDown(e: PointerEvent, world: Point2D): void {
    if (e.button !== 0) return;

    const graph = this.ctx.getGraph();
    const snapped = this.ctx.raycaster.snapToGrid(world, 0.25);

    // Find smallest available non-negative integer ID/name
    const existingNames = new Set(graph.nodes.map((n) => n.name));
    let index = 0;
    while (existingNames.has(String(index))) {
      index++;
    }
    const id = String(index);

    const activeStyle = this.ctx.getActiveStyle ? this.ctx.getActiveStyle() : 'none';
    const styleVal = activeStyle || 'none';

    const newNode: NodeData = {
      id,
      name: id,
      label: '',
      position: snapped,
      data: [{ key: 'style', value: styleVal }],
    };

    const newGraph = {
      ...graph,
      nodes: [...graph.nodes, newNode],
    };

    this.ctx.setSelectedIds({ nodes: [id], edges: [] });
    this.ctx.commitGraphChange(newGraph);
  }

  public onPointerMove(_e: PointerEvent, world: Point2D): void {
    const snapped = this.ctx.raycaster.snapToGrid(world, 0.25);
    this.ctx.gizmos.updateReticle?.(snapped, true);
  }

  public onPointerUp(_e: PointerEvent, _world: Point2D): void {}

  public onPointerCancel(_e: PointerEvent): void {
    this.ctx.gizmos.updateReticle?.({ x: 0, y: 0 }, false);
  }

  public onKeyDown(_e: KeyboardEvent): void {}

  public dispose(): void {
    this.ctx.gizmos.updateReticle?.({ x: 0, y: 0 }, false);
  }
}
