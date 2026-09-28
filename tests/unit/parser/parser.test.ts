import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';
import { parseTikz, parseTikzStyles, parseSafe, emitTikz, normalize } from '../../../src/core/parser';

describe('TikZ Parser & Emitter Conformance Suite', () => {
  it('parses empty graph', () => {
    const input = `\\begin{tikzpicture}\n\\end{tikzpicture}`;
    const ast = parseTikz(input);
    expect(ast.nodes).toHaveLength(0);
    expect(ast.edges).toHaveLength(0);
  });

  it('parses node with style, coordinate, and LaTeX label', () => {
    const input = `\\begin{tikzpicture}
\\begin{pgfonlayer}{nodelayer}
\\node [style=Z spider] (0) at (-1.5, 2.0) {$\\alpha$};
\\end{pgfonlayer}
\\end{tikzpicture}`;
    const ast = parseTikz(input);
    expect(ast.nodes).toHaveLength(1);
    expect(ast.nodes[0].name).toBe('0');
    expect(ast.nodes[0].position).toEqual({ x: -1.5, y: 2.0 });
    expect(ast.nodes[0].label).toBe('$\\alpha$');
    expect(ast.nodes[0].data).toEqual([{ key: 'style', value: 'Z spider' }]);
  });

  it('parses multiple nodes with empty and non-empty labels (parseNodeGraph)', () => {
    const input = `\\begin{tikzpicture}
  \\node (node0) at (1.1, -2.2) {};
  \\node (node1) at (3, 4) {test};
\\end{tikzpicture}`;
    const ast = parseTikz(input);
    expect(ast.nodes).toHaveLength(2);
    expect(ast.edges).toHaveLength(0);
    expect(ast.nodes[0].name).toBe('node0');
    expect(ast.nodes[0].label).toBe('');
    expect(ast.nodes[0].position).toEqual({ x: 1.1, y: -2.2 });
    expect(ast.nodes[1].name).toBe('node1');
    expect(ast.nodes[1].label).toBe('test');
    expect(ast.nodes[1].position).toEqual({ x: 3, y: 4 });
  });

  it('parses edge graph with atoms and anchors (parseEdgeGraph)', () => {
    const input = `\\begin{tikzpicture}
  \\begin{pgfonlayer}{nodelayer}
    \\node [style=x, {foo++}] (0) at (-1, -1) {};
    \\node [style=y] (1) at (0, 1) {};
    \\node [style=z] (2) at (1, -1) {};
  \\end{pgfonlayer}
  \\begin{pgfonlayer}{edgelayer}
    \\draw [style=a] (1.center) to (2);
    \\draw [style=b, foo] (2) to (0.west);
    \\draw [style=c] (0) to (1);
  \\end{pgfonlayer}
\\end{tikzpicture}`;
    const ast = parseTikz(input);
    expect(ast.nodes).toHaveLength(3);
    expect(ast.edges).toHaveLength(3);
    expect(ast.nodes[0].data.some(p => p.key === 'foo++')).toBe(true);
    expect(ast.edges[0].data.find(p => p.key === 'style')?.value).toBe('a');
    expect(ast.edges[0].data.some(p => p.key === 'foo')).toBe(false);
    expect(ast.edges[1].data.find(p => p.key === 'style')?.value).toBe('b');
    expect(ast.edges[1].data.some(p => p.key === 'foo')).toBe(true);
    expect(ast.edges[1].targetAnchor).toBe('west');
    expect(ast.edges[2].data.find(p => p.key === 'style')?.value).toBe('c');
  });

  it('parses inline edge node label (parseEdgeNode)', () => {
    const input = `\\begin{tikzpicture}
  \\begin{pgfonlayer}{nodelayer}
    \\node [style=none] (0) at (-1, 0) {};
    \\node [style=none] (1) at (1, 0) {};
  \\end{pgfonlayer}
  \\begin{pgfonlayer}{edgelayer}
    \\draw [style=diredge] (0.center) to node[foo, bar=baz baz]{test} (1.center);
  \\end{pgfonlayer}
\\end{tikzpicture}`;
    const ast = parseTikz(input);
    expect(ast.nodes).toHaveLength(2);
    expect(ast.edges).toHaveLength(1);
    const edge = ast.edges[0];
    expect(edge.edgeNode).toBeDefined();
    expect(edge.edgeNode?.label).toBe('test');
    expect(edge.edgeNode?.data.some(p => p.key === 'foo')).toBe(true);
    expect(edge.edgeNode?.data.find(p => p.key === 'bar')?.value).toBe('baz baz');
  });

  it('parses curved edge with basic bend angle and advanced in/out (parseEdgeBends)', () => {
    const input = `\\begin{tikzpicture}
  \\begin{pgfonlayer}{nodelayer}
    \\node [style=white] (0) at (-1, 0) {};
    \\node [style=black] (1) at (1, 0) {};
  \\end{pgfonlayer}
  \\begin{pgfonlayer}{edgelayer}
    \\draw [style=diredge,bend left] (0) to (1);
    \\draw [style=diredge,bend right] (0) to (1);
    \\draw [style=diredge,bend left=20] (0) to (1);
    \\draw [style=diredge,bend right=80] (0) to (1);
    \\draw [style=diredge,in=10,out=150,looseness=2] (0) to (1);
  \\end{pgfonlayer}
\\end{tikzpicture}`;
    const ast = parseTikz(input);
    expect(ast.nodes).toHaveLength(2);
    expect(ast.edges).toHaveLength(5);
    expect(ast.edges[0].data.some(p => p.key === 'bend left')).toBe(true);
    expect(ast.edges[1].data.some(p => p.key === 'bend right')).toBe(true);
    expect(ast.edges[2].data.find(p => p.key === 'bend left')?.value).toBe('20');
    expect(ast.edges[3].data.find(p => p.key === 'bend right')?.value).toBe('80');
    expect(ast.edges[4].data.find(p => p.key === 'in')?.value).toBe('10');
    expect(ast.edges[4].data.find(p => p.key === 'out')?.value).toBe('150');
    expect(ast.edges[4].data.find(p => p.key === 'looseness')?.value).toBe('2');
  });

  it('parses self-loop edge notation (0) to ()', () => {
    const input = `\\begin{tikzpicture}
\\begin{pgfonlayer}{edgelayer}
\\draw [style=wire, in=45, out=135, looseness=2.5] (0) to ();
\\end{pgfonlayer}
\\end{tikzpicture}`;
    const ast = parseTikz(input);
    expect(ast.edges).toHaveLength(1);
    expect(ast.edges[0].sourceId).toBe('0');
    expect(ast.edges[0].targetId).toBe('0');
  });

  it('extracts bounding box rectangle accurately (parseBbox)', () => {
    const input = `\\begin{tikzpicture}
  \\path [use as bounding box] (-1.5,-1.5) rectangle (1.5,1.5);
  \\begin{pgfonlayer}{nodelayer}
    \\node [style=white dot] (0) at (-1, -1) {};
  \\end{pgfonlayer}
\\end{tikzpicture}`;
    const ast = parseTikz(input);
    expect(ast.bbox).toEqual({
      min: { x: -1.5, y: -1.5 },
      max: { x: 1.5, y: 1.5 },
    });
  });

  it('parses chained edges: (0) to (1) to (2) to cycle', () => {
    const input = `\\begin{tikzpicture}
\\begin{pgfonlayer}{edgelayer}
\\draw [style=wire] (0) to (1) to (2) to cycle;
\\end{pgfonlayer}
\\end{tikzpicture}`;
    const ast = parseTikz(input);
    expect(ast.edges).toHaveLength(3);
    expect(ast.edges[0].sourceId).toBe('0');
    expect(ast.edges[0].targetId).toBe('1');
    expect(ast.edges[1].sourceId).toBe('1');
    expect(ast.edges[1].targetId).toBe('2');
    expect(ast.edges[2].sourceId).toBe('2');
    expect(ast.edges[2].targetId).toBe('0');
    expect(ast.paths).toHaveLength(1);
    expect(ast.paths?.[0].isCycle).toBe(true);
  });

  it('parses all 12 canonical PQP ZX-calculus corpus diagrams (parseCorpusDiagrams)', () => {
    const expectedCounts: Record<string, { nodes: number; edges: number }> = {
      '01_spider_fusion.tikz': { nodes: 6, edges: 6 },
      '02_identity_spiders.tikz': { nodes: 6, edges: 3 },
      '03_yanking_cup_cap.tikz': { nodes: 6, edges: 4 },
      '04_cup_cap_duality.tikz': { nodes: 6, edges: 2 },
      '05_bialgebra_law.tikz': { nodes: 6, edges: 5 },
      '06_hadamard_color_change.tikz': { nodes: 5, edges: 4 },
      '07_cnot_gate.tikz': { nodes: 6, edges: 5 },
      '08_cz_gate.tikz': { nodes: 7, edges: 6 },
      '09_swap_gate.tikz': { nodes: 4, edges: 2 },
      '10_teleportation.tikz': { nodes: 8, edges: 9 },
      '11_ghz_state.tikz': { nodes: 4, edges: 3 },
      '12_entanglement_swapping.tikz': { nodes: 6, edges: 5 },
    };

    const corpusDir = path.resolve('docs/examples/zx-calculus');

    for (const [filename, counts] of Object.entries(expectedCounts)) {
      const filePath = path.join(corpusDir, filename);
      const content = fs.readFileSync(filePath, 'utf8');
      const ast = parseTikz(content);
      expect(ast.nodes).toHaveLength(counts.nodes);
      expect(ast.edges).toHaveLength(counts.edges);
    }
  });

  it('gracefully handles malformed syntax with parseSafe', () => {
    const malformed = `\\begin{tikzpicture} \\node [style=none] (a) at (0, 0) {Missing semicolon} \\end{tikzpicture}`;
    const res = parseSafe(malformed);
    expect(res.success).toBe(false);
    expect(res.errors.length).toBeGreaterThan(0);
    expect(res.errors[0].line).toBeGreaterThan(0);
    expect(res.partialAST).not.toBeNull();
  });

  it('round-trips canonically: emit(parse(src)) matches input AST', () => {
    const input = `\\begin{tikzpicture}
\\begin{pgfonlayer}{nodelayer}
\\node [style=none] (0) at (0, 0) {};
\\end{pgfonlayer}
\\end{tikzpicture}`;
    const ast1 = parseTikz(input);
    const emitted = emitTikz(ast1);
    const ast2 = parseTikz(emitted);
    expect(ast2.nodes).toHaveLength(ast1.nodes.length);
    expect(ast2.edges).toHaveLength(ast1.edges.length);
    expect(normalize(ast2)).toEqual(normalize(ast1));
  });
});
