import { describe, it, expect } from 'vitest';
import { NodeRenderer } from '../../../src/canvas/renderers/NodeRenderer';
import { EdgeRenderer } from '../../../src/canvas/renderers/EdgeRenderer';
import type { NodeData, EdgeData } from '../../../src/core/domain/types';

describe('Geometry & Memory Lifecycle', () => {
  it('adds and cleans up 500 nodes without memory retention', () => {
    const nodeRenderer = new NodeRenderer();

    // Add 500 nodes
    for (let i = 0; i < 500; i++) {
      const node: NodeData = {
        id: `node_${i}`,
        name: `n_${i}`,
        position: { x: i * 0.1, y: i * 0.1 },
        data: [{ key: 'style', value: i % 2 === 0 ? 'Z' : 'X' }],
        label: i % 5 === 0 ? `\$\\alpha_{${i}}\$` : '',
      };
      nodeRenderer.renderNode(node);
    }

    expect(nodeRenderer.nodeGroup.children.length).toBe(500);

    // Clear all
    nodeRenderer.clear();
    expect(nodeRenderer.nodeGroup.children.length).toBe(0);
    expect(nodeRenderer.labelGroup.children.length).toBe(0);

    nodeRenderer.dispose();
  });

  it('adds and cleans up 500 curved edges cleanly', () => {
    const edgeRenderer = new EdgeRenderer();
    const nodesMap = new Map<string, NodeData>();

    for (let i = 0; i < 501; i++) {
      nodesMap.set(`n_${i}`, {
        id: `n_${i}`,
        name: `n_${i}`,
        position: { x: i, y: i },
        data: [{ key: 'style', value: 'Z' }],
        label: '',
      });
    }

    // Add 500 edges
    for (let i = 0; i < 500; i++) {
      const edge: EdgeData = {
        id: `e_${i}`,
        sourceId: `n_${i}`,
        targetId: `n_${i + 1}`,
        data: i % 3 === 0
          ? [{ key: 'style', value: 'wire' }, { key: 'bend left', value: '30' }]
          : [{ key: 'style', value: 'wire' }],
      };
      edgeRenderer.renderEdge(edge, nodesMap);
    }

    expect(edgeRenderer.edgeGroup.children.length).toBe(500);

    edgeRenderer.clear();
    expect(edgeRenderer.edgeGroup.children.length).toBe(0);

    edgeRenderer.dispose();
  });
});
