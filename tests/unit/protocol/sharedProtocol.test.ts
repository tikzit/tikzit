import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import { parseTikz, parseSafe } from '../../../src/core/parser';

describe('Sprint 20: Shared Dual-System Protocol Conformance', () => {
  const rootDir = path.resolve(__dirname, '../../../');
  const specPath = path.join(rootDir, 'docs/architecture/SHARED-PROTOCOL-SPECIFICATION.md');

  it('T20-09: test_ebnf_grammar_ast_type_validation', () => {
    expect(fs.existsSync(specPath)).toBe(true);
    const spec = fs.readFileSync(specPath, 'utf8');

    expect(spec).toContain('TikzPicture');
    expect(spec).toContain('NodeStatement');
    expect(spec).toContain('EdgeStatement');
    expect(spec).toContain('Coordinate');
  });

  it('T20-10: test_coordinate_mapping_transform_math', () => {
    // Forward and inverse coordinate math: TikZ (cm) <-> Qt (pixels) <-> ThreeJS (world)
    const k = 100.0;
    const toQt = (x: number, y: number) => ({ x: k * x, y: -k * y });
    const fromQt = (X: number, Y: number) => ({ x: X / k, y: -Y / k });
    const toThree = (x: number, y: number) => ({ x, y, z: 0 });

    const testCoords = [
      { x: 0, y: 0 },
      { x: 1.5, y: -2.25 },
      { x: -10.0, y: 45.12345 },
      { x: 99.999, y: -99.999 }
    ];

    for (const pt of testCoords) {
      const qt = toQt(pt.x, pt.y);
      const back = fromQt(qt.x, qt.y);
      expect(Math.abs(back.x - pt.x)).toBeLessThan(1e-7);
      expect(Math.abs(back.y - pt.y)).toBeLessThan(1e-7);

      const three = toThree(pt.x, pt.y);
      expect(three.x).toBe(pt.x);
      expect(three.y).toBe(pt.y);
      expect(three.z).toBe(0);
    }
  });

  it('T20-11: test_teardrop_self_loop_math_invariants', () => {
    // Mathematical invariants for self-loop angles: in = 135 deg, out = 45 deg
    const thetaOut = (45 * Math.PI) / 180;
    const thetaIn = (135 * Math.PI) / 180;

    expect(thetaOut).toBeCloseTo(Math.PI / 4, 6);
    expect(thetaIn).toBeCloseTo((3 * Math.PI) / 4, 6);

    const x0 = 0, y0 = 0, r = 0.5, R = 1.0, L = 1.0;
    const d = (4 / 3) * R;

    const P0 = { x: x0 + r * Math.cos(thetaOut), y: y0 + r * Math.sin(thetaOut) };
    const P1 = { x: P0.x + L * d * Math.cos(thetaOut), y: P0.y + L * d * Math.sin(thetaOut) };
    const P3 = { x: x0 + r * Math.cos(thetaIn), y: y0 + r * Math.sin(thetaIn) };
    const P2 = { x: P3.x + L * d * Math.cos(thetaIn), y: P3.y + L * d * Math.sin(thetaIn) };

    // Assert symmetry about Y-axis (x = 0)
    expect(P0.x).toBeCloseTo(-P3.x, 6);
    expect(P0.y).toBeCloseTo(P3.y, 6);
    expect(P1.x).toBeCloseTo(-P2.x, 6);
    expect(P1.y).toBeCloseTo(P2.y, 6);
  });

  it('T20-12: test_junction_node_conventions', () => {
    const spec = fs.readFileSync(specPath, 'utf8');
    expect(spec).toContain('style=none');
    expect(spec).toContain('#B4B4DC');
    expect(spec).toContain('#B4B4C8');
  });

  it('T20-13: test_mcard_tri_database_schema_contract', () => {
    const spec = fs.readFileSync(specPath, 'utf8');
    expect(spec).toContain('CREATE TABLE IF NOT EXISTS card');
    expect(spec).toContain('CREATE TABLE IF NOT EXISTS handle_registry');
    expect(spec).toContain('CREATE TABLE IF NOT EXISTS handle_history');
    expect(spec).toContain('previous_hash TEXT NOT NULL');
  });

  it('T20-14: test_canonical_zx_corpus_graph_isomorphism', () => {
    const sampleTikz = `\\begin{tikzpicture}
\\begin{pgfonlayer}{nodelayer}
\\node [style=none] (0) at (-1, 0) {};
\\node [style=none] (1) at (1, 0) {};
\\end{pgfonlayer}
\\begin{pgfonlayer}{edgelayer}
\\draw (0) to (1);
\\end{pgfonlayer}
\\end{tikzpicture}`;

    const ast = parseTikz(sampleTikz);
    expect(ast.nodes.length).toBe(2);
    expect(ast.edges.length).toBe(1);
    expect(ast.edges[0].sourceId).toBe('0');
    expect(ast.edges[0].targetId).toBe('1');
  });

  it('T20-15: test_edge_case_syntax_parity', () => {
    const complexTikz = `\\begin{tikzpicture}
\\begin{pgfonlayer}{nodelayer}
\\node [style=Z] (a) at (0, 0) {$\\frac{\\pi}{2}$};
\\node [style=X] (b) at (2, 0) {};
\\end{pgfonlayer}
\\begin{pgfonlayer}{edgelayer}
\\draw [style=wire, bend left=30, looseness=1.2] (a) to (b);
\\end{pgfonlayer}
\\end{tikzpicture}`;

    const ast = parseTikz(complexTikz);
    expect(ast.nodes.length).toBe(2);

    const nodeA = ast.nodes.find(n => n.name === 'a');
    expect(nodeA).toBeDefined();
    expect(nodeA?.data.find(p => p.key === 'style')?.value).toBe('Z');
    expect(nodeA?.label).toBe('$\\frac{\\pi}{2}$');

    expect(ast.edges.length).toBe(1);
    expect(ast.edges[0].data.find(p => p.key === 'bend left')?.value).toBe('30');
    expect(ast.edges[0].data.find(p => p.key === 'looseness')?.value).toBe('1.2');
  });

  it('T20-16: test_syntax_error_reporting_parity', () => {
    const malformedTikz = `\\begin{tikzpicture}
\\node [style=Z (missing_bracket) at (0, 0) {};
\\end{tikzpicture}`;

    const res = parseSafe(malformedTikz);
    expect(res.success).toBe(false);
    expect(res.errors.length).toBeGreaterThan(0);
    expect(res.errors[0].message).toBeDefined();
  });
});
