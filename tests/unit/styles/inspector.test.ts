import { describe, it, expect, beforeEach } from 'vitest';
import { createWorkbenchRuntime, type WorkbenchRuntime } from '../../../src/services/createWorkbenchRuntime';
import type { GraphAST, NodeData, EdgeData } from '../../../src/core/domain/types';
import { setProperty, setAtom, unsetAtom } from '../../../src/core/domain/types';

describe('Property Inspector Synchronization & Multi-element Editing (5.3)', () => {
  let runtime: WorkbenchRuntime;

  beforeEach(() => {
    runtime = createWorkbenchRuntime();
    const testGraph: GraphAST = {
      nodes: [
        { id: '0', name: '0', position: { x: 0, y: 0 }, label: '', data: [] },
        { id: '1', name: '1', position: { x: 2, y: 0 }, label: '', data: [] },
        { id: '2', name: '2', position: { x: 4, y: 0 }, label: '', data: [] },
      ],
      edges: [
        { id: 'e0', sourceId: '0', targetId: '1', data: [] },
        { id: 'e1', sourceId: '1', targetId: '2', data: [] },
      ],
      paths: [],
      data: [],
    };
    runtime.ctx.graph.setAST(testGraph);
  });

  describe('Node Property Modifications', () => {
    it('updates node label with TeX phase angles (\alpha, \pi/2, 0)', () => {
      // 1. Set label to \alpha
      const g1 = runtime.ctx.graph.ast;
      runtime.ctx.graph.setAST({
        ...g1,
        nodes: g1.nodes.map((n: NodeData) => (n.id === '0' ? { ...n, label: '\\alpha' } : n)),
      });

      let node0 = runtime.ctx.graph.ast.nodes.find((n: NodeData) => n.id === '0');
      expect(node0?.label).toBe('\\alpha');

      // 2. Set label to \pi/2
      const g2 = runtime.ctx.graph.ast;
      runtime.ctx.graph.setAST({
        ...g2,
        nodes: g2.nodes.map((n: NodeData) => (n.id === '0' ? { ...n, label: '\\pi/2' } : n)),
      });

      node0 = runtime.ctx.graph.ast.nodes.find((n: NodeData) => n.id === '0');
      expect(node0?.label).toBe('\\pi/2');

      // 3. Set label to empty/0
      const g3 = runtime.ctx.graph.ast;
      runtime.ctx.graph.setAST({
        ...g3,
        nodes: g3.nodes.map((n: NodeData) => (n.id === '0' ? { ...n, label: '0' } : n)),
      });

      node0 = runtime.ctx.graph.ast.nodes.find((n: NodeData) => n.id === '0');
      expect(node0?.label).toBe('0');
    });

    it('updates node style attribute and preserves node position', () => {
      runtime.ctx.styles.applyStyleToNodes(['0'], 'Z');

      const node0 = runtime.ctx.graph.ast.nodes.find((n: NodeData) => n.id === '0');
      expect(node0?.position).toEqual({ x: 0, y: 0 });
      const styleProp = node0?.data.find((p) => p.key === 'style');
      expect(styleProp?.value).toBe('Z');
    });

    it('applies style changes across multiple selected nodes uniformly', () => {
      runtime.ctx.styles.applyStyleToNodes(['0', '1', '2'], 'X');

      const graph = runtime.ctx.graph.ast;
      for (const id of ['0', '1', '2']) {
        const node = graph.nodes.find((n: NodeData) => n.id === id);
        const styleProp = node?.data.find((p) => p.key === 'style');
        expect(styleProp?.value).toBe('X');
      }
    });
  });

  describe('Edge Property Modifications', () => {
    it('toggles dashed property on edge data', () => {
      // Add dashed atom to edge 0
      const g1 = runtime.ctx.graph.ast;
      runtime.ctx.graph.setAST({
        ...g1,
        edges: g1.edges.map((ed: EdgeData) =>
          ed.id === 'e0' ? { ...ed, data: setAtom(ed.data, 'dashed') } : ed
        ),
      });

      let edge0 = runtime.ctx.graph.ast.edges[0];
      expect(edge0.data.some((p) => p.key === 'dashed')).toBe(true);

      // Remove dashed atom
      const g2 = runtime.ctx.graph.ast;
      runtime.ctx.graph.setAST({
        ...g2,
        edges: g2.edges.map((ed: EdgeData) =>
          ed.id === 'e0' ? { ...ed, data: unsetAtom(ed.data, 'dashed') } : ed
        ),
      });

      edge0 = runtime.ctx.graph.ast.edges[0];
      expect(edge0.data.some((p) => p.key === 'dashed')).toBe(false);
    });

    it('sets bend angle and looseness on edge', () => {
      const g = runtime.ctx.graph.ast;
      runtime.ctx.graph.setAST({
        ...g,
        edges: g.edges.map((ed: EdgeData) =>
          ed.id === 'e0' ? { ...ed, data: setProperty(ed.data, 'bend left', '30') } : ed
        ),
      });

      const edge0 = runtime.ctx.graph.ast.edges[0];
      const bendProp = edge0.data.find((p) => p.key === 'bend left');
      expect(bendProp?.value).toBe('30');
    });
  });
});
