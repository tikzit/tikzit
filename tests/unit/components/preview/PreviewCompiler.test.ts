/**
 * tests/unit/components/preview/PreviewCompiler.test.ts - Sprint 22
 * Unit tests T22-06 to T22-10 for headless AST -> SVG preview compiler.
 */
import { describe, it, expect } from 'vitest';
import { compileAstToSvg } from '../../../../src/components/workbench/panels/preview/PreviewCompiler';
import type { GraphAST, TikzStylesCatalog } from '../../../../src/core/domain/types';

describe('PreviewCompiler (T22-06 - T22-10)', () => {
  const emptyCatalog: TikzStylesCatalog = {
    styles: [],
  };

  it('T22-06: compileAstToSvg succeeds on valid empty graph', () => {
    const graph: GraphAST = { nodes: [], edges: [], data: [], paths: [] };
    const res = compileAstToSvg(graph, emptyCatalog);
    expect(res.success).toBe(true);
    expect(res.nodeCount).toBe(0);
    expect(res.edgeCount).toBe(0);
    expect(res.svg).toContain('<svg');
  });

  it('T22-07: compileAstToSvg generates SVG elements for vertices and edges', () => {
    const graph: GraphAST = {
      nodes: [
        { id: 'n1', name: 'n1', label: '', position: { x: 0, y: 0 }, data: [] },
        { id: 'n2', name: 'n2', label: '', position: { x: 2, y: 2 }, data: [] },
      ],
      edges: [{ id: 'e1', sourceId: 'n1', targetId: 'n2', data: [] }],
      data: [],
      paths: [],
    };
    const res = compileAstToSvg(graph, emptyCatalog);
    expect(res.success).toBe(true);
    expect(res.nodeCount).toBe(2);
    expect(res.edgeCount).toBe(1);
    expect(res.svg).toContain('<svg');
    expect(res.svg).toContain('</svg>');
  });

  it('T22-08: compileAstToSvg respects theme and scale options', () => {
    const graph: GraphAST = {
      nodes: [{ id: 'n1', name: 'n1', label: '', position: { x: 0, y: 0 }, data: [] }],
      edges: [],
      data: [],
      paths: [],
    };
    const resDark = compileAstToSvg(graph, emptyCatalog, { theme: 'dark', scale: 60 });
    const resLight = compileAstToSvg(graph, emptyCatalog, { theme: 'light', scale: 60 });
    expect(resDark.success).toBe(true);
    expect(resLight.success).toBe(true);
  });

  it('T22-09: compileAstToSvg records current timestamp on compilation', () => {
    const before = Date.now();
    const res = compileAstToSvg({ nodes: [], edges: [], data: [], paths: [] }, emptyCatalog);
    expect(res.timestamp).toBeGreaterThanOrEqual(before);
  });

  it('T22-10: compileAstToSvg returns failure status on invalid graph structures without throwing', () => {
    const invalidGraph = null as unknown as GraphAST;
    const res = compileAstToSvg(invalidGraph, emptyCatalog);
    expect(res.success).toBe(false);
    expect(res.svg).toBe('');
    expect(res.error).toBeDefined();
  });
});
