import type { CanvasTool, ToolContext } from './types';
import type { Point2D } from '../../core/domain/types';

export class BBoxTool implements CanvasTool {
  public id = 'bbox';

  private ctx: ToolContext;
  private isDragging = false;
  private startPoint: Point2D = { x: 0, y: 0 };

  constructor(ctx: ToolContext) {
    this.ctx = ctx;
  }

  public onPointerDown(e: PointerEvent, world: Point2D): void {
    if (e.button !== 0) return;
    this.startPoint = this.ctx.raycaster.snapToGrid(world, 0.25);
    this.isDragging = true;
    this.ctx.gizmos.updateBBox(this.startPoint, this.startPoint, true);
  }

  public onPointerMove(e: PointerEvent, world: Point2D): void {
    if (this.isDragging) {
      this.ctx.gizmos.updateBBox(this.startPoint, world, true);
    }
  }

  public onPointerUp(e: PointerEvent, world: Point2D): void {
    if (!this.isDragging) return;

    const endPoint = this.ctx.raycaster.snapToGrid(world, 0.25);
    const minX = Math.min(this.startPoint.x, endPoint.x);
    const maxX = Math.max(this.startPoint.x, endPoint.x);
    const minY = Math.min(this.startPoint.y, endPoint.y);
    const maxY = Math.max(this.startPoint.y, endPoint.y);

    const graph = this.ctx.getGraph();
    const newGraph = {
      ...graph,
      bbox: {
        min: { x: minX, y: minY },
        max: { x: maxX, y: maxY },
      },
    };

    this.ctx.commitGraphChange(newGraph);
    this.isDragging = false;
  }

  public onPointerCancel(_e: PointerEvent): void {
    this.isDragging = false;
    this.ctx.gizmos.updateBBox({ x: 0, y: 0 }, { x: 0, y: 0 }, false);
  }

  public onKeyDown(_e: KeyboardEvent): void {}

  public dispose(): void {
    this.isDragging = false;
    this.ctx.gizmos.updateBBox({ x: 0, y: 0 }, { x: 0, y: 0 }, false);
  }
}
