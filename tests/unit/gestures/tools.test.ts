import { describe, it, expect, beforeEach } from 'vitest';
import { CameraController } from '../../../src/canvas/CameraController';
import { Raycaster } from '../../../src/canvas/input/Raycaster';
import { SelectTool } from '../../../src/canvas/tools/SelectTool';
import { VertexTool } from '../../../src/canvas/tools/VertexTool';
import { EdgeTool } from '../../../src/canvas/tools/EdgeTool';
import { BBoxTool } from '../../../src/canvas/tools/BBoxTool';
import { ToolManager } from '../../../src/canvas/tools/ToolManager';
import type { ToolContext, SelectionStateIds } from '../../../src/canvas/tools/types';
import type { GraphAST, NodeData, EdgeData } from '../../../src/core/domain/types';

describe('Tool State Machine & Gestures (Sprint 04)', () => {
  let camera: CameraController;
  let raycaster: Raycaster;
  let mockGizmos: any;
  let graphAST: GraphAST;
  let selectedIds: SelectionStateIds;
  let committedGraphs: GraphAST[];
  let ctx: ToolContext;

  beforeEach(() => {
    camera = new CameraController({ baseScale: 50 });
    camera.setSize(800, 600);
    raycaster = new Raycaster(camera);

    graphAST = {
      nodes: [
        { id: '0', name: '0', label: '', position: { x: -2, y: 0 }, data: [] },
        { id: '1', name: '1', label: '', position: { x: 2, y: 0 }, data: [] },
      ],
      edges: [
        { id: 'e0', sourceId: '0', targetId: '1', data: [] },
      ],
      paths: [],
      data: [],
    };

    selectedIds = { nodes: [], edges: [] };
    committedGraphs = [];

    mockGizmos = {
      updateMarquee: () => {},
      updateRubberband: () => {},
      updateCurvatureHandle: () => {},
      updateBBox: () => {},
      updateReticle: () => {},
      clear: () => {},
      dispose: () => {},
    };

    ctx = {
      stage: {
        canvas: {
          getBoundingClientRect: () => ({ left: 0, top: 0, width: 800, height: 600 }),
          setPointerCapture: () => {},
          releasePointerCapture: () => {},
          hasPointerCapture: () => false,
          addEventListener: () => {},
          removeEventListener: () => {},
        } as any,
        render: () => {},
      } as any,
      raycaster,
      gizmos: mockGizmos,
      getGraph: () => graphAST,
      setGraph: (ast) => {
        graphAST = ast;
      },
      getSelectedIds: () => selectedIds,
      setSelectedIds: (sel) => {
        selectedIds = sel;
      },
      commitGraphChange: (ast) => {
        graphAST = ast;
        committedGraphs.push(JSON.parse(JSON.stringify(ast)));
      },
    };
  });

  describe('VertexTool', () => {
    it('creates a new node on pointer click snapped to 0.25 grid', () => {
      const tool = new VertexTool(ctx);
      const fakeEvent = { button: 0 } as PointerEvent;

      // Click at (0.95, 1.05) -> should snap to (1.0, 1.0)
      tool.onPointerDown(fakeEvent, { x: 0.95, y: 1.05 });
      tool.onPointerUp(fakeEvent, { x: 0.95, y: 1.05 });

      expect(graphAST.nodes.length).toBe(3);
      const newNode = graphAST.nodes[2];
      expect(newNode.name).toBe('2');
      expect(newNode.position).toEqual({ x: 1.0, y: 1.0 });
      expect(committedGraphs.length).toBe(1);
    });

    it('auto-increments node names avoiding collisions', () => {
      const tool = new VertexTool(ctx);
      const fakeEvent = { button: 0 } as PointerEvent;

      tool.onPointerDown(fakeEvent, { x: 0, y: 2 });
      tool.onPointerUp(fakeEvent, { x: 0, y: 2 });
      expect(graphAST.nodes[2].name).toBe('2');

      tool.onPointerDown(fakeEvent, { x: 0, y: 3 });
      tool.onPointerUp(fakeEvent, { x: 0, y: 3 });
      expect(graphAST.nodes[3].name).toBe('3');
    });
  });

  describe('EdgeTool', () => {
    it('creates a directed edge by dragging between two nodes', () => {
      const tool = new EdgeTool(ctx);
      const fakeEvent = { button: 0 } as PointerEvent;

      // Down on node 0
      tool.onPointerDown(fakeEvent, { x: -2.05, y: 0.05 });
      // Move to node 1
      tool.onPointerMove(fakeEvent, { x: 1.95, y: 0 });
      // Up on node 1
      tool.onPointerUp(fakeEvent, { x: 2.0, y: 0 });

      expect(graphAST.edges.length).toBe(2);
      const newEdge = graphAST.edges[1];
      expect(newEdge.sourceId).toBe('0');
      expect(newEdge.targetId).toBe('1');
      expect(committedGraphs.length).toBe(1);
    });

    it('creates a self-loop when dropping back onto source node', () => {
      const tool = new EdgeTool(ctx);
      const fakeEvent = { button: 0 } as PointerEvent;

      tool.onPointerDown(fakeEvent, { x: -2.0, y: 0 });
      tool.onPointerMove(fakeEvent, { x: -1.0, y: 1.0 });
      tool.onPointerUp(fakeEvent, { x: -2.0, y: 0 });

      expect(graphAST.edges.length).toBe(2);
      const loop = graphAST.edges[1];
      expect(loop.sourceId).toBe('0');
      expect(loop.targetId).toBe('0');
      expect(loop.inAngle).toBe(135);
      expect(loop.outAngle).toBe(45);
    });

    it('does not create an edge if dropped on empty canvas', () => {
      const tool = new EdgeTool(ctx);
      const fakeEvent = { button: 0 } as PointerEvent;

      tool.onPointerDown(fakeEvent, { x: -2.0, y: 0 });
      tool.onPointerMove(fakeEvent, { x: 0, y: 5 });
      tool.onPointerUp(fakeEvent, { x: 0, y: 5 });

      expect(graphAST.edges.length).toBe(1);
    });
  });

  describe('BBoxTool', () => {
    it('sets the diagram bounding box on drag release', () => {
      const tool = new BBoxTool(ctx);
      const fakeEvent = { button: 0 } as PointerEvent;

      tool.onPointerDown(fakeEvent, { x: -2.9, y: -1.9 });
      tool.onPointerMove(fakeEvent, { x: 3.1, y: 2.1 });
      tool.onPointerUp(fakeEvent, { x: 3.1, y: 2.1 });

      expect(graphAST.bbox).toBeDefined();
      expect(graphAST.bbox?.min).toEqual({ x: -3.0, y: -2.0 });
      expect(graphAST.bbox?.max).toEqual({ x: 3.0, y: 2.0 });
      expect(committedGraphs.length).toBe(1);
    });
  });

  describe('SelectTool', () => {
    it('drags a single node and snaps to 0.25 grid on release', () => {
      const tool = new SelectTool(ctx);
      const fakeDown = { button: 0, shiftKey: false } as PointerEvent;
      const fakeUp = { button: 0 } as PointerEvent;

      // Down on node 0 at (-2, 0)
      tool.onPointerDown(fakeDown, { x: -2.0, y: 0 });
      // Move by (+1.1, +0.6) -> (-0.9, 0.6)
      tool.onPointerMove(fakeDown, { x: -0.9, y: 0.6 });
      // Up -> snaps to (-1.0, 0.5)
      tool.onPointerUp(fakeUp, { x: -0.9, y: 0.6 });

      const node0 = graphAST.nodes.find((n) => n.id === '0');
      expect(node0?.position).toEqual({ x: -1.0, y: 0.5 });
      expect(committedGraphs.length).toBe(1);
    });

    it('drags multiple selected nodes preserving relative offsets', () => {
      const tool = new SelectTool(ctx);
      // Select both nodes
      selectedIds = { nodes: ['0', '1'], edges: [] };

      const fakeDown = { button: 0, shiftKey: false } as PointerEvent;
      const fakeUp = { button: 0 } as PointerEvent;

      // Click on node 0
      tool.onPointerDown(fakeDown, { x: -2.0, y: 0 });
      // Drag by (+1.0, +1.0)
      tool.onPointerMove(fakeDown, { x: -1.0, y: 1.0 });
      tool.onPointerUp(fakeUp, { x: -1.0, y: 1.0 });

      const n0 = graphAST.nodes.find((n) => n.id === '0');
      const n1 = graphAST.nodes.find((n) => n.id === '1');
      expect(n0?.position).toEqual({ x: -1.0, y: 1.0 });
      expect(n1?.position).toEqual({ x: 3.0, y: 1.0 });
    });

    it('bends edge curvature when dragging curvature midpoint handle', () => {
      const tool = new SelectTool(ctx);
      const fakeDown = { button: 0, shiftKey: false } as PointerEvent;
      const fakeUp = { button: 0 } as PointerEvent;

      // Edge connects (-2, 0) to (2, 0). Midpoint is (0, 0).
      // Click at midpoint handle
      tool.onPointerDown(fakeDown, { x: 0, y: 0 });
      // Drag upwards perpendicularly (+Y)
      tool.onPointerMove(fakeDown, { x: 0, y: 1.5 });
      tool.onPointerUp(fakeUp, { x: 0, y: 1.5 });

      const edge = graphAST.edges[0];
      const bendLeft = edge.data.find((p) => p.key === 'bend left');
      expect(bendLeft).toBeDefined();
      expect(Number(bendLeft?.value) % 5).toBe(0);
    });

    it('nudges selected nodes by 0.25 with Ctrl+Arrow, and 0.025 with Ctrl+Shift+Arrow', () => {
      const tool = new SelectTool(ctx);
      selectedIds = { nodes: ['0'], edges: [] };

      // Normal nudge by 0.25
      tool.onKeyDown({ key: 'ArrowRight', ctrlKey: true, shiftKey: false, preventDefault: () => {} } as any);
      expect(graphAST.nodes[0].position.x).toBe(-1.75);

      // Micro-nudge by 0.025
      tool.onKeyDown({ key: 'ArrowUp', ctrlKey: true, shiftKey: true, preventDefault: () => {} } as any);
      expect(graphAST.nodes[0].position.y).toBe(0.025);
    });

    it('deletes selected nodes and their connected edges on Delete key', () => {
      const tool = new SelectTool(ctx);
      selectedIds = { nodes: ['0'], edges: [] };

      tool.onKeyDown({ key: 'Delete', preventDefault: () => {} } as any);

      expect(graphAST.nodes.length).toBe(1);
      expect(graphAST.nodes[0].id).toBe('1');
      // Edge connected to node 0 should be pruned
      expect(graphAST.edges.length).toBe(0);
    });
  });

  describe('Reflections and Rotations (Desktop C++ Parity)', () => {
    it('reflects selected nodes horizontally across bounding box center', () => {
      const manager = new ToolManager({
        stage: ctx.stage,
        raycaster,
        gizmos: mockGizmos,
        getGraph: () => graphAST,
        setGraph: (ast) => {
          graphAST = ast;
        },
        getSelectedIds: () => ({ nodes: ['0', '1'], edges: [] }),
        setSelectedIds: () => {},
        commitGraphChange: (ast) => {
          graphAST = ast;
        },
      });

      // Nodes are at x = -2 and x = 2. Bounds center is (0, 0).
      // Reflection: x' = 2 * 0 - x = -x.
      manager.reflectSelectedNodes('horizontal');

      expect(graphAST.nodes.find((n) => n.id === '0')?.position.x).toBe(2);
      expect(graphAST.nodes.find((n) => n.id === '1')?.position.x).toBe(-2);
      manager.dispose();
    });

    it('reflects selected nodes vertically across bounding box center', () => {
      graphAST.nodes[0].position = { x: 0, y: -1 };
      graphAST.nodes[1].position = { x: 0, y: 3 };

      const manager = new ToolManager({
        stage: ctx.stage,
        raycaster,
        gizmos: mockGizmos,
        getGraph: () => graphAST,
        setGraph: (ast) => {
          graphAST = ast;
        },
        getSelectedIds: () => ({ nodes: ['0', '1'], edges: [] }),
        setSelectedIds: () => {},
        commitGraphChange: (ast) => {
          graphAST = ast;
        },
      });

      // min y = -1, max y = 3 -> center = 1.0.
      // node 0: y' = 2(1) - (-1) = 3
      // node 1: y' = 2(1) - 3 = -1
      manager.reflectSelectedNodes('vertical');

      expect(graphAST.nodes.find((n) => n.id === '0')?.position.y).toBe(3);
      expect(graphAST.nodes.find((n) => n.id === '1')?.position.y).toBe(-1);
      manager.dispose();
    });

    it('rotates selected nodes 90 degrees about origin', () => {
      graphAST.nodes[0].position = { x: 1, y: 0 };

      const manager = new ToolManager({
        stage: ctx.stage,
        raycaster,
        gizmos: mockGizmos,
        getGraph: () => graphAST,
        setGraph: (ast) => {
          graphAST = ast;
        },
        getSelectedIds: () => ({ nodes: ['0'], edges: [] }),
        setSelectedIds: () => {},
        commitGraphChange: (ast) => {
          graphAST = ast;
        },
      });

      // Clockwise rotation (x, y) -> (y, -x)
      manager.rotateSelectedNodes(true);
      expect(graphAST.nodes.find((n) => n.id === '0')?.position).toEqual({ x: 0, y: -1 });

      // Counter-clockwise rotation (x, y) -> (-y, x)
      manager.rotateSelectedNodes(false);
      expect(graphAST.nodes.find((n) => n.id === '0')?.position).toEqual({ x: 1, y: 0 });
      manager.dispose();
    });
  });
});
