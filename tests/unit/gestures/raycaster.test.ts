import { describe, it, expect, beforeEach } from 'vitest';
import { Raycaster } from '../../../src/canvas/input/Raycaster';
import { CameraController } from '../../../src/canvas/CameraController';
import type { NodeData, EdgeData } from '../../../src/core/domain/types';

describe('Raycaster & Hit Testing (Sprint 04)', () => {
  let cameraController: CameraController;
  let raycaster: Raycaster;

  beforeEach(() => {
    cameraController = new CameraController({ baseScale: 50 });
    cameraController.resize(800, 600);
    raycaster = new Raycaster(cameraController);
  });

  it('snaps world coordinates to 0.25-unit grid increments', () => {
    expect(raycaster.snapToGrid({ x: 0.12, y: 0.26 })).toEqual({ x: 0, y: 0.25 });
    expect(raycaster.snapToGrid({ x: 0.38, y: -0.74 })).toEqual({ x: 0.5, y: -0.75 });
    expect(raycaster.snapToGrid({ x: 1.0, y: 2.0 })).toEqual({ x: 1.0, y: 2.0 });
  });

  it('performs hit testing on nodes within 0.30 radius', () => {
    const nodes: NodeData[] = [
      { id: '0', name: '0', label: '', position: { x: 0, y: 0 }, data: [] },
      { id: '1', name: '1', label: '', position: { x: 2, y: 0 }, data: [] },
    ];

    // Inside radius (0.2 units away from node 0)
    const hit1 = raycaster.hitTestNode({ x: 0.2, y: 0 }, nodes, 0.30);
    expect(hit1?.id).toBe('0');

    // Outside radius (0.35 units away from both)
    const hitMiss = raycaster.hitTestNode({ x: 0.35, y: 0 }, nodes, 0.30);
    expect(hitMiss).toBeNull();

    // Closer to node 1
    const hit2 = raycaster.hitTestNode({ x: 1.9, y: 0.1 }, nodes, 0.30);
    expect(hit2?.id).toBe('1');
  });

  it('performs hit testing along Bézier edges within 0.18 threshold', () => {
    const nodesMap = new Map<string, NodeData>([
      ['0', { id: '0', name: '0', label: '', position: { x: -2, y: 0 }, data: [] }],
      ['1', { id: '1', name: '1', label: '', position: { x: 2, y: 0 }, data: [] }],
    ]);

    const edges: EdgeData[] = [
      {
        id: 'e1',
        sourceId: '0',
        targetId: '1',
        data: [],
      },
    ];

    // On straight edge line: (0, 0) is halfway between (-2, 0) and (2, 0)
    const hitOnLine = raycaster.hitTestEdge({ x: 0, y: 0.05 }, edges, nodesMap, 0.18);
    expect(hitOnLine?.id).toBe('e1');

    // Far from edge line
    const hitMiss = raycaster.hitTestEdge({ x: 0, y: 1.5 }, edges, nodesMap, 0.18);
    expect(hitMiss).toBeNull();
  });

  it('identifies curvature handle hit test on bent edge', () => {
    const nodesMap = new Map<string, NodeData>([
      ['0', { id: '0', name: '0', label: '', position: { x: -2, y: 0 }, data: [] }],
      ['1', { id: '1', name: '1', label: '', position: { x: 2, y: 0 }, data: [] }],
    ]);

    const edge: EdgeData = {
      id: 'e1',
      sourceId: '0',
      targetId: '1',
      data: [{ key: 'bend left', value: '30' }],
    };

    // Retrieve handle midpoint
    const testCenter = raycaster.hitTestCurvatureHandle({ x: 0, y: 0 }, edge, nodesMap, 100);
    expect(testCenter.midpoint).toBeDefined();

    // Hit test with small threshold near that midpoint
    const hitNear = raycaster.hitTestCurvatureHandle(
      { x: testCenter.midpoint.x + 0.05, y: testCenter.midpoint.y + 0.05 },
      edge,
      nodesMap,
      0.25
    );
    expect(hitNear.hit).toBe(true);

    // Miss far away
    const hitFar = raycaster.hitTestCurvatureHandle(
      { x: testCenter.midpoint.x + 1.0, y: testCenter.midpoint.y + 1.0 },
      edge,
      nodesMap,
      0.25
    );
    expect(hitFar.hit).toBe(false);
  });

  it('queries nodes inside a marquee rectangular bounding box', () => {
    const nodes: NodeData[] = [
      { id: '0', name: '0', label: '', position: { x: -1, y: -1 }, data: [] },
      { id: '1', name: '1', label: '', position: { x: 1, y: 1 }, data: [] },
      { id: '2', name: '2', label: '', position: { x: 5, y: 5 }, data: [] },
    ];

    const inRect = raycaster.findNodesInRect(
      { min: { x: -2, y: -2 }, max: { x: 2, y: 2 } },
      nodes
    );
    expect(inRect.sort()).toEqual(['0', '1']);
  });
});
