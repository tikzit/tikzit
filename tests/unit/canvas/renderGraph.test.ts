import { describe, it, expect, vi } from 'vitest';
import * as THREE from 'three';
import { Stage } from '../../../src/canvas/Stage';
import { NodeRenderer } from '../../../src/canvas/renderers/NodeRenderer';
import { EdgeRenderer } from '../../../src/canvas/renderers/EdgeRenderer';
import { GizmoRenderer } from '../../../src/canvas/renderers/GizmoRenderer';
import type { GraphAST, NodeData, EdgeData } from '../../../src/core/domain/types';

/**
 * Builds a Stage instance without the WebGL-dependent constructor.
 * renderGraph() only touches scene-graph objects and renderer.render(),
 * so a stub renderer is sufficient to exercise the node/edge lifecycle.
 */
function makeHeadlessStage(): Stage {
  const stage = Object.create(Stage.prototype) as Stage;
  (stage as unknown as { isDisposed: boolean }).isDisposed = false;
  (stage as unknown as { isContextLost: boolean }).isContextLost = false;
  (stage as unknown as { currentTheme: 'dark' | 'light' }).currentTheme = 'dark';
  stage.currentAST = null;
  stage.currentStyles = undefined;
  stage.selectedNodeIds = new Set();
  stage.selectedEdgeIds = new Set();
  stage.scene = new THREE.Scene();
  stage.nodeRenderer = new NodeRenderer();
  stage.edgeRenderer = new EdgeRenderer();
  stage.gizmoRenderer = new GizmoRenderer();
  stage.renderer = { render: vi.fn() } as unknown as THREE.WebGLRenderer;
  stage.cameraController = { camera: new THREE.Camera() } as unknown as Stage['cameraController'];
  return stage;
}

function makeNode(id: string, x: number, style = 'Z', label = ''): NodeData {
  return {
    id,
    name: id,
    position: { x, y: 0 },
    data: [{ key: 'style', value: style }],
    label,
  };
}

function makeEdge(id: string, sourceId: string, targetId: string): EdgeData {
  return {
    id,
    sourceId,
    targetId,
    data: [{ key: 'style', value: 'wire' }],
  };
}

describe('Stage.renderGraph node lifecycle', () => {
  it('removes node meshes absent from the newly rendered AST', () => {
    const stage = makeHeadlessStage();

    const first: GraphAST = {
      data: [],
      paths: [],
      nodes: [
        makeNode('a1', 0, 'Z', '$\\alpha$'),
        makeNode('a2', 1, 'X'),
        makeNode('a3', 2, 'H'),
        makeNode('a4', 3, 'Z'),
        makeNode('a5', 4, 'X'),
      ],
      edges: [makeEdge('e1', 'a1', 'a2'), makeEdge('e2', 'a2', 'a3')],
    };
    stage.renderGraph(first);
    expect(stage.nodeRenderer.nodeGroup.children.length).toBe(5);
    expect(stage.nodeRenderer.labelGroup.children.length).toBe(1);

    const second: GraphAST = {
      data: [],
      paths: [],
      nodes: [makeNode('b1', 0, 'Z'), makeNode('b2', 1, 'none')],
      edges: [makeEdge('e9', 'b1', 'b2')],
    };
    stage.renderGraph(second);

    expect(stage.nodeRenderer.nodeGroup.children.length).toBe(2);
    for (const node of second.nodes) {
      expect(stage.nodeRenderer.getNodeMesh(node.id)).toBeDefined();
    }
    for (const node of first.nodes) {
      expect(stage.nodeRenderer.getNodeMesh(node.id)).toBeUndefined();
    }
    expect(stage.nodeRenderer.labelGroup.children.length).toBe(0);
    expect(stage.edgeRenderer.edgeGroup.children.length).toBe(1);
  });

  it('replaces same-id nodes instead of duplicating them across renders', () => {
    const stage = makeHeadlessStage();

    stage.renderGraph({
      data: [],
      paths: [],
      nodes: [makeNode('n1', 0, 'Z'), makeNode('n2', 1, 'X')],
      edges: [],
    });
    stage.renderGraph({
      data: [],
      paths: [],
      nodes: [makeNode('n1', 0, 'X'), makeNode('n2', 1, 'H')],
      edges: [],
    });

    expect(stage.nodeRenderer.nodeGroup.children.length).toBe(2);
  });
});
