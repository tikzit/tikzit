import type { CanvasTool, ToolContext } from './types';
import type { Point2D, NodeData, EdgeData } from '../../core/domain/types';
import { roundToNearest } from '../bezier';
import { animatePointSnap } from '../animation/Physics';

export class SelectTool implements CanvasTool {
  public id = 'select';

  private ctx: ToolContext;
  private isDraggingNodes = false;
  private isDraggingHandle = false;
  private isMarquee = false;

  private dragStartWorld: Point2D = { x: 0, y: 0 };
  private initialNodePositions: Map<string, Point2D> = new Map();
  private activeEdgeId: string | null = null;

  constructor(ctx: ToolContext) {
    this.ctx = ctx;
  }

  public onPointerDown(e: PointerEvent, world: Point2D): void {
    // Only primary button
    if (e.button !== 0) return;

    const graph = this.ctx.getGraph();
    const sel = this.ctx.getSelectedIds();
    const nodesMap = new Map<string, NodeData>(graph.nodes.map((n) => [n.id, n]));

    // 1. Check if hit curvature handle of selected edge or any edge
    if (sel.edges.length === 1) {
      const edge = graph.edges.find((ed) => ed.id === sel.edges[0]);
      if (edge) {
        const handleHit = this.ctx.raycaster.hitTestCurvatureHandle(world, edge, nodesMap, 0.25);
        if (handleHit.hit) {
          this.isDraggingHandle = true;
          this.activeEdgeId = edge.id;
          this.dragStartWorld = { ...world };
          return;
        }
      }
    } else {
      for (const edge of graph.edges) {
        const handleHit = this.ctx.raycaster.hitTestCurvatureHandle(world, edge, nodesMap, 0.30);
        if (handleHit.hit) {
          this.ctx.setSelectedIds({ nodes: [], edges: [edge.id] });
          this.ctx.gizmos.updateCurvatureHandle(handleHit.midpoint, true);
          this.isDraggingHandle = true;
          this.activeEdgeId = edge.id;
          this.dragStartWorld = { ...world };
          return;
        }
      }
    }

    // 2. Check if hit a node
    const hitNode = this.ctx.raycaster.hitTestNode(world, graph.nodes, 0.30);
    if (hitNode) {
      let newSelectedNodes = [...sel.nodes];
      if (e.shiftKey) {
        // Toggle node selection
        if (newSelectedNodes.includes(hitNode.id)) {
          newSelectedNodes = newSelectedNodes.filter((id) => id !== hitNode.id);
        } else {
          newSelectedNodes.push(hitNode.id);
        }
      } else {
        // If not already selected, select only this node
        if (!newSelectedNodes.includes(hitNode.id)) {
          newSelectedNodes = [hitNode.id];
        }
      }

      this.ctx.setSelectedIds({ nodes: newSelectedNodes, edges: [] });
      this.ctx.gizmos.updateCurvatureHandle({ x: 0, y: 0 }, false);

      // Prepare node dragging
      this.isDraggingNodes = true;
      this.dragStartWorld = { ...world };
      this.initialNodePositions.clear();
      for (const id of newSelectedNodes) {
        const n = nodesMap.get(id);
        if (n) {
          this.initialNodePositions.set(id, { ...n.position });
        }
      }
      return;
    }

    // 3. Check if hit an edge
    const hitEdge = this.ctx.raycaster.hitTestEdge(world, graph.edges, nodesMap, 0.18);
    if (hitEdge) {
      const newSelectedEdges = e.shiftKey
        ? sel.edges.includes(hitEdge.id)
          ? sel.edges.filter((id) => id !== hitEdge.id)
          : [...sel.edges, hitEdge.id]
        : [hitEdge.id];

      this.ctx.setSelectedIds({ nodes: e.shiftKey ? sel.nodes : [], edges: newSelectedEdges });

      // Update curvature handle gizmo
      if (newSelectedEdges.length === 1) {
        const h = this.ctx.raycaster.hitTestCurvatureHandle(world, hitEdge, nodesMap, 100);
        this.ctx.gizmos.updateCurvatureHandle(h.midpoint, true);
      } else {
        this.ctx.gizmos.updateCurvatureHandle({ x: 0, y: 0 }, false);
      }
      return;
    }

    // 4. Void click: clear selection (if not shift) & start marquee
    if (!e.shiftKey) {
      this.ctx.setSelectedIds({ nodes: [], edges: [] });
      this.ctx.gizmos.updateCurvatureHandle({ x: 0, y: 0 }, false);
    }

    this.isMarquee = true;
    this.dragStartWorld = { ...world };
    this.ctx.gizmos.updateMarquee(world, world, true);
  }

  public onPointerMove(e: PointerEvent, world: Point2D): void {
    if (this.isDraggingNodes) {
      const dx = world.x - this.dragStartWorld.x;
      const dy = world.y - this.dragStartWorld.y;
      const graph = this.ctx.getGraph();

      // Update preview positions
      for (const node of graph.nodes) {
        const initial = this.initialNodePositions.get(node.id);
        if (initial) {
          node.position = { x: initial.x + dx, y: initial.y + dy };
        }
      }
      this.ctx.setGraph({ ...graph });
      return;
    }

    if (this.isDraggingHandle && this.activeEdgeId) {
      const graph = this.ctx.getGraph();
      const edge = graph.edges.find((ed) => ed.id === this.activeEdgeId);
      if (!edge) return;

      const nodesMap = new Map<string, NodeData>(graph.nodes.map((n) => [n.id, n]));
      const srcNode = nodesMap.get(edge.sourceId);
      const targetNode = nodesMap.get(edge.targetId);
      if (!srcNode || !targetNode) return;

      const S = srcNode.position;
      const T = targetNode.position;
      const dx = T.x - S.x;
      const dy = T.y - S.y;
      const chordLen = Math.sqrt(dx * dx + dy * dy);

      if (chordLen > 1e-4) {
        // Normal vector pointing to the left of chord
        const nx = -dy / chordLen;
        const ny = dx / chordLen;

        const midX = (S.x + T.x) / 2;
        const midY = (S.y + T.y) / 2;
        const perpDist = (world.x - midX) * nx + (world.y - midY) * ny;

        // Calculate bend angle: positive perpDist => bend left, negative => bend right
        const bendAngleRaw = Math.atan2(perpDist, chordLen * 0.4) * (180 / Math.PI);
        const snappedBend = roundToNearest(5, bendAngleRaw);

        // Update edge properties and synchronize typed edge.bend
        edge.data = edge.data.filter(
          (p) => p.key !== 'bend left' && p.key !== 'bend right'
        );

        if (Math.abs(snappedBend) >= 3) {
          if (snappedBend > 0) {
            edge.data.push({ key: 'bend left', value: String(Math.round(snappedBend)) });
            edge.bend = -Math.round(snappedBend);
          } else {
            edge.data.push({ key: 'bend right', value: String(Math.round(-snappedBend)) });
            edge.bend = Math.round(-snappedBend);
          }
        } else {
          edge.bend = undefined;
        }

        this.ctx.setGraph({ ...graph });
        const h = this.ctx.raycaster.hitTestCurvatureHandle(world, edge, nodesMap, 100);
        this.ctx.gizmos.updateCurvatureHandle(h.midpoint, true);
      }
      return;
    }

    if (this.isMarquee) {
      // 60 FPS visual marquee update without Nanostores / React re-render thrashing
      this.ctx.gizmos.updateMarquee(this.dragStartWorld, world, true);
    }
  }

  public onPointerUp(e: PointerEvent, world: Point2D): void {
    if (this.isDraggingNodes) {
      this.isDraggingNodes = false;
      const graph = this.ctx.getGraph();

      // Snap all moved nodes to 0.25 grid
      for (const node of graph.nodes) {
        if (this.initialNodePositions.has(node.id)) {
          const snapped = this.ctx.raycaster.snapToGrid(node.position, 0.25);
          node.position = snapped;
        }
      }

      this.ctx.commitGraphChange({ ...graph });
      return;
    }

    if (this.isDraggingHandle) {
      this.isDraggingHandle = false;
      this.activeEdgeId = null;
      this.ctx.commitGraphChange(this.ctx.getGraph());
      return;
    }

    if (this.isMarquee) {
      this.isMarquee = false;
      this.ctx.gizmos.updateMarquee(this.dragStartWorld, world, false);

      const graph = this.ctx.getGraph();
      const inBoxNodeIds = this.ctx.raycaster.findNodesInRect(
        { min: this.dragStartWorld, max: world },
        graph.nodes
      );

      const currentSel = this.ctx.getSelectedIds();
      let finalNodes: string[] = [];
      let finalEdges: string[] = [];

      if (e.shiftKey) {
        const nodeSet = new Set(currentSel.nodes);
        inBoxNodeIds.forEach((id) => nodeSet.add(id));
        finalNodes = Array.from(nodeSet);
        finalEdges = [...currentSel.edges];
      } else {
        finalNodes = inBoxNodeIds;
        finalEdges = [];
      }

      this.ctx.setSelectedIds({ nodes: finalNodes, edges: finalEdges });
      return;
    }
  }

  public onPointerCancel(e: PointerEvent): void {
    if (this.isDraggingNodes) {
      this.isDraggingNodes = false;
      const graph = this.ctx.getGraph();
      for (const node of graph.nodes) {
        const initial = this.initialNodePositions.get(node.id);
        if (initial) node.position = { ...initial };
      }
      this.ctx.setGraph({ ...graph });
    }
    if (this.isDraggingHandle) {
      this.isDraggingHandle = false;
      this.activeEdgeId = null;
    }
    if (this.isMarquee) {
      this.isMarquee = false;
      this.ctx.gizmos.updateMarquee({ x: 0, y: 0 }, { x: 0, y: 0 }, false);
    }
  }

  public onKeyDown(e: KeyboardEvent): void {
    const sel = this.ctx.getSelectedIds();

    // 1. Delete / Backspace
    if (e.key === 'Delete' || e.key === 'Backspace') {
      if (sel.nodes.length > 0 || sel.edges.length > 0) {
        const graph = this.ctx.getGraph();
        const nodeSet = new Set(sel.nodes);
        const edgeSet = new Set(sel.edges);

        const newNodes = graph.nodes.filter((n) => !nodeSet.has(n.id));
        const newEdges = graph.edges.filter(
          (ed) => !edgeSet.has(ed.id) && !nodeSet.has(ed.sourceId) && !nodeSet.has(ed.targetId)
        );

        this.ctx.setSelectedIds({ nodes: [], edges: [] });
        this.ctx.gizmos.updateCurvatureHandle({ x: 0, y: 0 }, false);
        this.ctx.commitGraphChange({ ...graph, nodes: newNodes, edges: newEdges });
        e.preventDefault();
        return;
      }
    }

    // 2. Arrow Key Nudge (with or without Ctrl/Meta)
    if (e.key.startsWith('Arrow')) {
      let dx = 0;
      let dy = 0;
      const step = e.shiftKey ? 0.025 : 0.25;

      if (e.key === 'ArrowUp') dy = step;
      else if (e.key === 'ArrowDown') dy = -step;
      else if (e.key === 'ArrowLeft') dx = -step;
      else if (e.key === 'ArrowRight') dx = step;

      if (dx !== 0 || dy !== 0) {
        const graph = this.ctx.getGraph();
        const selNodes = new Set(sel.nodes);

        for (const node of graph.nodes) {
          if (selNodes.has(node.id)) {
            node.position = {
              x: Math.round((node.position.x + dx) * 1000) / 1000,
              y: Math.round((node.position.y + dy) * 1000) / 1000,
            };
          }
        }
        this.ctx.commitGraphChange({ ...graph });
        e.preventDefault();
      }
    }
  }

  public dispose(): void {
    this.isDraggingNodes = false;
    this.isDraggingHandle = false;
    this.isMarquee = false;
    this.initialNodePositions.clear();
  }
}
