import type { CanvasTool, ToolContext } from './types';
import type { Point2D, NodeData, EdgeData, GraphElementProperty } from '../../core/domain/types';

export class EdgeTool implements CanvasTool {
  public id = 'edge';

  private ctx: ToolContext;
  private isDragging = false;
  private hasMoved = false;
  private sourceNode: NodeData | null = null;
  private pointerDownPos: Point2D | null = null;

  constructor(ctx: ToolContext) {
    this.ctx = ctx;
  }

  public onPointerDown(e: PointerEvent, world: Point2D): void {
    if (e.button !== 0) {
      this.cancel();
      return;
    }

    const graph = this.ctx.getGraph();
    // Snap radius 0.45 units (desktop TikZiT parity)
    const hitNode = this.ctx.raycaster.hitTestNode(world, graph.nodes, 0.45);

    // Two-click connection: if we already have a source node and click a node (including same node for self-loop)
    if (this.sourceNode && hitNode && !this.isDragging) {
      this.createEdge(this.sourceNode, hitNode);
      this.cancel();
      return;
    }

    if (hitNode) {
      this.isDragging = true;
      this.hasMoved = false;
      this.sourceNode = hitNode;
      this.pointerDownPos = { ...world };
      this.ctx.gizmos.updateRubberband(hitNode.position, world, true);
    } else {
      // Clicked on empty space: cancel any pending source node
      this.cancel();
    }
  }

  public onPointerMove(e: PointerEvent, world: Point2D): void {
    if (this.sourceNode) {
      if (
        this.pointerDownPos &&
        Math.hypot(world.x - this.pointerDownPos.x, world.y - this.pointerDownPos.y) > 0.05
      ) {
        this.hasMoved = true;
      }

      const graph = this.ctx.getGraph();
      // Magnetic candidate snapping: snap preview wire to candidate node center within 0.45 units
      const hitNode = this.ctx.raycaster.hitTestNode(world, graph.nodes, 0.45);
      const targetPos = hitNode ? hitNode.position : world;

      this.ctx.gizmos.updateRubberband(this.sourceNode.position, targetPos, true);
    }
  }

  public onPointerUp(e: PointerEvent, world: Point2D): void {
    if (!this.sourceNode) {
      this.cancel();
      return;
    }

    const graph = this.ctx.getGraph();
    const hitNode = this.ctx.raycaster.hitTestNode(world, graph.nodes, 0.45);

    if (this.hasMoved && hitNode) {
      // Completed drag to target node (including self loop back to source)
      this.createEdge(this.sourceNode, hitNode);
      this.cancel();
    } else if (this.hasMoved && !hitNode) {
      // Dragged onto empty space: cancel
      this.cancel();
    } else {
      // Click without drag: keep sourceNode active for two-click workflow
      this.isDragging = false;
    }
  }

  private createEdge(source: NodeData, target: NodeData): void {
    const graph = this.ctx.getGraph();
    const srcId = source.id;
    const targetId = target.id;
    const isSelfLoop = srcId === targetId;

    const activeStyle = this.ctx.getActiveStyle ? this.ctx.getActiveStyle() : 'none';
    const edgeStyle = activeStyle && activeStyle !== 'none' ? activeStyle : 'none';

    // Generate unique edge ID
    const existingIds = new Set(graph.edges.map((ed) => ed.id));
    let edgeIndex = graph.edges.length;
    while (existingIds.has(`e_${edgeIndex}`)) {
      edgeIndex++;
    }
    const edgeId = `e_${edgeIndex}`;

    // Desktop TikZiT Parity (edge.cpp:34-47, 289; graph.cpp:304-333):
    // Canonical property ordering: [style=<name>?, in=135, out=45, loop], style=none omitted!
    const edgeDataProps: GraphElementProperty[] = [];
    if (edgeStyle && edgeStyle !== 'none') {
      edgeDataProps.push({ key: 'style', value: edgeStyle });
    }
    if (isSelfLoop) {
      edgeDataProps.push({ key: 'in', value: '135' });
      edgeDataProps.push({ key: 'out', value: '45' });
      edgeDataProps.push({ key: 'loop' });
    } else {
      if (edgeDataProps.length === 0) {
        edgeDataProps.push({ key: 'style', value: edgeStyle });
      }
    }

    if (edgeStyle === 'dashed wire') {
      edgeDataProps.push({ key: 'dashed' });
    }

    const newEdge: EdgeData = {
      id: edgeId,
      sourceId: srcId,
      targetId: targetId,
      data: edgeDataProps,
      inAngle: isSelfLoop ? 135 : undefined,
      outAngle: isSelfLoop ? 45 : undefined,
      weight: isSelfLoop ? 1.0 : undefined,
    };

    const newGraph = {
      ...graph,
      edges: [...graph.edges, newEdge],
    };

    this.ctx.setSelectedIds({ nodes: [], edges: [edgeId] });
    this.ctx.commitGraphChange(newGraph);
  }

  private cancel(): void {
    this.isDragging = false;
    this.sourceNode = null;
    this.pointerDownPos = null;
    this.ctx.gizmos.updateRubberband({ x: 0, y: 0 }, { x: 0, y: 0 }, false);
  }

  public onPointerCancel(_e: PointerEvent): void {
    this.cancel();
  }

  public onKeyDown(e: KeyboardEvent): void {
    if (e.key === 'Escape') {
      this.cancel();
    }
  }

  dispose(): void {
    this.cancel();
  }
}
