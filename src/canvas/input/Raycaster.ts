import type { Point2D, NodeData, EdgeData } from '../../core/domain/types';
import { CameraController } from '../CameraController';
import { computeEdgeControls, evaluateCubicBezier } from '../bezier';

export interface BoundingBox2D {
  min: Point2D;
  max: Point2D;
}

export class Raycaster {
  private cameraController: CameraController;

  constructor(cameraController: CameraController) {
    this.cameraController = cameraController;
  }

  public screenToWorld(screenX: number, screenY: number): Point2D {
    return this.cameraController.screenToWorld(screenX, screenY);
  }

  public worldToScreen(worldX: number, worldY: number): Point2D {
    return this.cameraController.worldToScreen(worldX, worldY);
  }

  /**
   * Snaps a world point to the nearest grid increment (default 0.25 units).
   */
  public snapToGrid(point: Point2D, snapSize = 0.25): Point2D {
    return {
      x: Math.round(point.x / snapSize) * snapSize,
      y: Math.round(point.y / snapSize) * snapSize,
    };
  }

  /**
   * Finds the closest node within hit radius threshold (default 0.30 TikZ units).
   */
  public hitTestNode(
    worldPoint: Point2D,
    nodes: NodeData[],
    threshold = 0.30
  ): NodeData | null {
    let closestNode: NodeData | null = null;
    let minDistanceSq = threshold * threshold;

    for (const node of nodes) {
      const dx = worldPoint.x - node.position.x;
      const dy = worldPoint.y - node.position.y;
      const distSq = dx * dx + dy * dy;

      if (distSq < minDistanceSq) {
        minDistanceSq = distSq;
        closestNode = node;
      }
    }

    return closestNode;
  }

  /**
   * Finds the closest edge within hit distance threshold (default 0.15 TikZ units).
   */
  public hitTestEdge(
    worldPoint: Point2D,
    edges: EdgeData[],
    nodesMap: Map<string, NodeData>,
    threshold = 0.15
  ): EdgeData | null {
    let closestEdge: EdgeData | null = null;
    let minDistanceSq = threshold * threshold;

    for (const edge of edges) {
      const srcNode = nodesMap.get(edge.sourceId);
      const targetNode = nodesMap.get(edge.targetId);
      if (!srcNode || !targetNode) continue;

      const controls = computeEdgeControls({
        src: srcNode.position,
        target: targetNode.position,
        srcStyle: srcNode.data.find((d) => d.key === 'style')?.value,
        targetStyle: targetNode.data.find((d) => d.key === 'style')?.value,
        bend: edge.bend,
        inAngle: edge.inAngle,
        outAngle: edge.outAngle,
        weight: edge.weight,
        data: edge.data,
      });

      // Sample 16 segments and calculate distance to piecewise linear segments
      const segments = 16;
      let prev = evaluateCubicBezier(0, controls.tail, controls.cp1, controls.cp2, controls.head);

      for (let i = 1; i <= segments; i++) {
        const t = i / segments;
        const curr = evaluateCubicBezier(t, controls.tail, controls.cp1, controls.cp2, controls.head);

        const distSq = this.pointToSegmentDistanceSq(worldPoint, prev, curr);
        if (distSq < minDistanceSq) {
          minDistanceSq = distSq;
          closestEdge = edge;
        }

        prev = curr;
      }
    }

    return closestEdge;
  }

  /**
   * Hit tests the midpoint curvature handle of a selected edge (threshold 0.20 units).
   */
  public hitTestCurvatureHandle(
    worldPoint: Point2D,
    edge: EdgeData,
    nodesMap: Map<string, NodeData>,
    threshold = 0.20
  ): { hit: boolean; midpoint: Point2D } {
    const srcNode = nodesMap.get(edge.sourceId);
    const targetNode = nodesMap.get(edge.targetId);
    if (!srcNode || !targetNode) {
      return { hit: false, midpoint: { x: 0, y: 0 } };
    }

    const controls = computeEdgeControls({
      src: srcNode.position,
      target: targetNode.position,
      srcStyle: srcNode.data.find((d) => d.key === 'style')?.value,
      targetStyle: targetNode.data.find((d) => d.key === 'style')?.value,
      bend: edge.bend,
      inAngle: edge.inAngle,
      outAngle: edge.outAngle,
      weight: edge.weight,
      data: edge.data,
    });

    const mid = controls.mid;
    const dx = worldPoint.x - mid.x;
    const dy = worldPoint.y - mid.y;
    const distSq = dx * dx + dy * dy;

    return {
      hit: distSq < threshold * threshold,
      midpoint: mid,
    };
  }

  /**
   * Returns all node IDs located inside an axis-aligned bounding box.
   */
  public findNodesInRect(box: BoundingBox2D, nodes: NodeData[]): string[] {
    const minX = Math.min(box.min.x, box.max.x);
    const maxX = Math.max(box.min.x, box.max.x);
    const minY = Math.min(box.min.y, box.max.y);
    const maxY = Math.max(box.min.y, box.max.y);

    const result: string[] = [];
    for (const node of nodes) {
      if (
        node.position.x >= minX &&
        node.position.x <= maxX &&
        node.position.y >= minY &&
        node.position.y <= maxY
      ) {
        result.push(node.id);
      }
    }
    return result;
  }

  private pointToSegmentDistanceSq(p: Point2D, a: Point2D, b: Point2D): number {
    const l2 = (b.x - a.x) * (b.x - a.x) + (b.y - a.y) * (b.y - a.y);
    if (l2 < 1e-9) {
      const dx = p.x - a.x;
      const dy = p.y - a.y;
      return dx * dx + dy * dy;
    }

    let t = ((p.x - a.x) * (b.x - a.x) + (p.y - a.y) * (b.y - a.y)) / l2;
    t = Math.max(0, Math.min(1, t));

    const projX = a.x + t * (b.x - a.x);
    const projY = a.y + t * (b.y - a.y);

    const dx = p.x - projX;
    const dy = p.y - projY;
    return dx * dx + dy * dy;
  }
}
