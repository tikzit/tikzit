import { describe, it, expect, beforeEach, vi } from 'vitest';
import * as THREE from 'three';
import { CameraController } from '../../../src/canvas/CameraController';
import { Raycaster } from '../../../src/canvas/input/Raycaster';
import { VertexTool } from '../../../src/canvas/tools/VertexTool';
import { EdgeTool } from '../../../src/canvas/tools/EdgeTool';
import { SelectTool } from '../../../src/canvas/tools/SelectTool';
import { ToolManager } from '../../../src/canvas/tools/ToolManager';
import { NodeRenderer } from '../../../src/canvas/renderers/NodeRenderer';

import type { ToolContext, SelectionStateIds } from '../../../src/canvas/tools/types';
import type { GraphAST, NodeData, EdgeData } from '../../../src/core/domain/types';

describe('Sprint 05B: Editable Canvas Interaction & Tool Integration', () => {
  let camera: CameraController;
  let raycaster: Raycaster;
  let mockGizmos: any;
  let graphAST: GraphAST;
  let selectedIds: SelectionStateIds;
  let committedGraphs: GraphAST[];
  let activeStyle = 'none';
  let ctx: ToolContext;
  let renderCallCount = 0;

  beforeEach(() => {
    camera = new CameraController({ baseScale: 50 });
    camera.setSize(800, 600);
    raycaster = new Raycaster(camera);
    renderCallCount = 0;

    graphAST = {
      data: [],
      paths: [],
      nodes: [
        { id: '0', name: '0', label: '', position: { x: -2, y: 0 }, data: [{ key: 'style', value: 'none' }] },
        { id: '1', name: '1', label: '', position: { x: 2, y: 0 }, data: [{ key: 'style', value: 'Z' }] },
        { id: '2', name: '2', label: '', position: { x: 0, y: 3 }, data: [{ key: 'style', value: 'none' }] },
      ],
      edges: [],
    };

    selectedIds = { nodes: [], edges: [] };
    committedGraphs = [];
    activeStyle = 'none';

    mockGizmos = {
      updateMarquee: vi.fn(),
      updateRubberband: vi.fn(),
      updateCurvatureHandle: vi.fn(),
      updateBBox: vi.fn(),
      updateReticle: vi.fn(),
      clear: vi.fn(),
      dispose: vi.fn(),
    };

    ctx = {
      stage: {
        canvas: {
          style: { cursor: 'default' },
          getBoundingClientRect: () => ({ left: 0, top: 0, width: 800, height: 600 }),
          setPointerCapture: () => {},
          releasePointerCapture: () => {},
          hasPointerCapture: () => false,
          addEventListener: () => {},
          removeEventListener: () => {},
        } as any,
        render: () => {
          renderCallCount++;
        },
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
        committedGraphs.push(ast);
      },
      getActiveStyle: () => activeStyle,
    };
  });

  describe('Deliverable 5B.3: Desktop C++ Parity Marquee Selection', () => {
    it('updates marquee gizmo during pointer move without committing Nanostores selection', () => {
      const tool = new SelectTool(ctx);
      const fakeEvt = { button: 0, shiftKey: false } as PointerEvent;

      // Start drag in empty space
      tool.onPointerDown(fakeEvt, { x: -5, y: -5 });
      expect(mockGizmos.updateMarquee).toHaveBeenCalledWith({ x: -5, y: -5 }, { x: -5, y: -5 }, true);

      // Drag across node 0
      tool.onPointerMove(fakeEvt, { x: 0, y: 2 });
      expect(mockGizmos.updateMarquee).toHaveBeenCalledWith({ x: -5, y: -5 }, { x: 0, y: 2 }, true);
      // Selection should NOT be committed mid-drag to prevent React thrashing
      expect(selectedIds.nodes).toEqual([]);
    });

    it('finalizes marquee selection and commits enclosed node IDs on pointer up', () => {
      const tool = new SelectTool(ctx);
      const fakeEvt = { button: 0, shiftKey: false } as PointerEvent;

      tool.onPointerDown(fakeEvt, { x: -3, y: -2 });
      tool.onPointerMove(fakeEvt, { x: -1, y: 2 });
      tool.onPointerUp(fakeEvt, { x: -1, y: 2 });

      // Node '0' is at (-2, 0), which is enclosed within [-3, -1] x [-2, 2]
      expect(selectedIds.nodes).toEqual(['0']);
      // Marquee gizmo should be hidden
      expect(mockGizmos.updateMarquee).toHaveBeenLastCalledWith({ x: -3, y: -2 }, { x: -1, y: 2 }, false);
    });

    it('supports Shift-additive selection union during marquee drag', () => {
      const tool = new SelectTool(ctx);
      selectedIds = { nodes: ['1'], edges: [] };

      // Drag over node '0' with Shift held
      const shiftEvt = { button: 0, shiftKey: true } as PointerEvent;
      tool.onPointerDown(shiftEvt, { x: -3, y: -2 });
      tool.onPointerMove(shiftEvt, { x: -1, y: 2 });
      tool.onPointerUp(shiftEvt, { x: -1, y: 2 });

      // Result should union '1' and '0'
      expect(selectedIds.nodes).toContain('0');
      expect(selectedIds.nodes).toContain('1');
    });

    it('clears selection when clicking empty space without Shift', () => {
      const tool = new SelectTool(ctx);
      selectedIds = { nodes: ['0', '1'], edges: [] };

      const clickEvt = { button: 0, shiftKey: false } as PointerEvent;
      tool.onPointerDown(clickEvt, { x: 10, y: 10 });
      tool.onPointerUp(clickEvt, { x: 10, y: 10 });

      expect(selectedIds.nodes).toEqual([]);
      expect(selectedIds.edges).toEqual([]);
    });
  });

  describe('Deliverable 5B.5: Self-Loop Creation & Magnetic Edge Drawing', () => {
    it('creates an upward teardrop self-loop when clicking the same node twice', () => {
      const tool = new EdgeTool(ctx);
      const fakeEvt = { button: 0 } as PointerEvent;

      // First click on node 0
      tool.onPointerDown(fakeEvt, { x: -2.0, y: 0 });
      tool.onPointerUp(fakeEvt, { x: -2.0, y: 0 });

      expect(committedGraphs.length).toBe(0);

      // Second click on node 0 -> creates self-loop
      tool.onPointerDown(fakeEvt, { x: -2.0, y: 0 });

      expect(committedGraphs.length).toBe(1);
      const loop = committedGraphs[0].edges[0];
      expect(loop.sourceId).toBe('0');
      expect(loop.targetId).toBe('0');
      expect(loop.inAngle).toBe(135);
      expect(loop.outAngle).toBe(45);
      expect(loop.weight).toBe(1.0);
      expect(loop.data.some((p) => p.key === 'loop')).toBe(true);
    });

    it('creates an upward teardrop self-loop when dragging and dropping onto the same node', () => {
      const tool = new EdgeTool(ctx);
      const fakeEvt = { button: 0 } as PointerEvent;

      tool.onPointerDown(fakeEvt, { x: -2.0, y: 0 });
      tool.onPointerMove(fakeEvt, { x: -1.0, y: 1.0 }); // moved away
      tool.onPointerUp(fakeEvt, { x: -2.0, y: 0 });     // released back on source

      expect(committedGraphs.length).toBe(1);
      const loop = committedGraphs[0].edges[0];
      expect(loop.sourceId).toBe('0');
      expect(loop.targetId).toBe('0');
      expect(loop.inAngle).toBe(135);
      expect(loop.outAngle).toBe(45);
      expect(loop.weight).toBe(1.0);
      expect(loop.data.some((p) => p.key === 'loop')).toBe(true);
    });

    it('magnetically snaps preview wire to candidate node within 0.45 units', () => {
      const tool = new EdgeTool(ctx);
      const fakeEvt = { button: 0 } as PointerEvent;

      // Start drag at node 0 (-2, 0)
      tool.onPointerDown(fakeEvt, { x: -2.0, y: 0 });

      // Move cursor near node 1 (2, 0) at (1.8, 0.2), distance = ~0.28 < 0.45
      tool.onPointerMove(fakeEvt, { x: 1.8, y: 0.2 });

      // Rubberband preview should snap magnetically to exact node position (2, 0)
      expect(mockGizmos.updateRubberband).toHaveBeenLastCalledWith(
        { x: -2, y: 0 },
        { x: 2, y: 0 },
        true
      );
    });
  });

  describe('Deliverable 5B.7: NodeRenderer Parity for style=none and Selection Halos', () => {
    it('renders dashed boundary ring with radius 0.20 and color #b4b4dc for style=none', () => {
      const renderer = new NodeRenderer();
      const node: NodeData = {
        id: 'n_none',
        name: 'n_none',
        label: '',
        position: { x: 0, y: 0 },
        data: [{ key: 'style', value: 'none' }],
      };

      renderer.renderNode(node, undefined, false);
      const container = renderer.getNodeMesh('n_none') as THREE.Group;
      expect(container).toBeDefined();

      // Find dashed ring (THREE.LineLoop)
      const ring = container.children.find((c) => c instanceof THREE.LineLoop) as THREE.LineLoop;
      expect(ring).toBeDefined();
      expect(ring.scale.x).toBeCloseTo(0.20, 2);
      expect(ring.scale.y).toBeCloseTo(0.20, 2);

      const mat = ring.material as THREE.LineDashedMaterial;
      expect(mat.color.getHexString()).toBe('b4b4dc');
    });

    it('renders expanded shape-conforming selection halos with depthTest: false', () => {
      const renderer = new NodeRenderer();
      const rectNode: NodeData = {
        id: 'n_rect',
        name: 'n_rect',
        label: '',
        position: { x: 0, y: 0 },
        data: [{ key: 'style', value: 'box' }],
      };

      const styles = {
        box: {
          name: 'box',
          category: 'node' as const,
          data: [{ key: 'shape', value: 'rectangle' }],
        },
      };

      renderer.renderNode(rectNode, styles, true);
      const container = renderer.getNodeMesh('n_rect') as THREE.Group;
      expect(container).toBeDefined();

      const selRing = container.children.find(
        (c) => c instanceof THREE.LineLoop && c.position.z === 1
      ) as THREE.LineLoop;
      expect(selRing).toBeDefined();
      const mat = selRing.material as THREE.LineBasicMaterial;
      expect(mat.depthTest).toBe(false);
      expect(mat.color.getHexString()).toBe('388bfd');
    });
  });

  describe('Deliverable 5B.2: Real-Time Interactive WebGL Render Loop', () => {
    it('triggers stage.render() on pointer down, move, and up', () => {
      const listeners: Record<string, Function[]> = {};
      const mockCanvas = {
        style: { cursor: 'default' },
        getBoundingClientRect: () => ({ left: 0, top: 0, width: 800, height: 600 }),
        setPointerCapture: () => {},
        releasePointerCapture: () => {},
        hasPointerCapture: () => false,
        addEventListener: (event: string, fn: Function) => {
          listeners[event] = listeners[event] || [];
          listeners[event].push(fn);
        },
        removeEventListener: (event: string, fn: Function) => {
          if (listeners[event]) {
            listeners[event] = listeners[event].filter((f) => f !== fn);
          }
        },
        dispatchEvent: (evt: any) => {
          (listeners[evt.type] || []).forEach((fn) => fn(evt));
        },
      } as any;

      const toolManager = new ToolManager({
        canvas: mockCanvas,
        stage: ctx.stage,
        raycaster,
        gizmos: mockGizmos,
        getGraph: ctx.getGraph,
        setGraph: ctx.setGraph,
        getSelectedIds: ctx.getSelectedIds,
        setSelectedIds: ctx.setSelectedIds,
        commitGraphChange: ctx.commitGraphChange,
        getActiveStyle: ctx.getActiveStyle,
      });

      renderCallCount = 0;
      mockCanvas.dispatchEvent({ type: 'pointerdown', clientX: 100, clientY: 100, button: 0, pointerId: 1 });
      expect(renderCallCount).toBeGreaterThan(0);

      const movesBefore = renderCallCount;
      mockCanvas.dispatchEvent({ type: 'pointermove', clientX: 120, clientY: 120, pointerId: 1 });
      expect(renderCallCount).toBeGreaterThan(movesBefore);

      const upsBefore = renderCallCount;
      mockCanvas.dispatchEvent({ type: 'pointerup', clientX: 120, clientY: 120, button: 0, pointerId: 1 });
      expect(renderCallCount).toBeGreaterThan(upsBefore);

      toolManager.dispose();
    });
  });
});
