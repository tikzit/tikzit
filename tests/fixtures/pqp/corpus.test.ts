import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';
import { parseTikz, parseTikzStyles, emitTikz } from '../../../src/core/parser';
import { generateSvg } from '../../../src/services/preview/SvgGenerator';

describe('PQP Canonical Reference Corpus Conformance Suite', () => {
  const fixturesDir = path.resolve(__dirname, '../../../tests/fixtures/pqp');
  const stylesPath = path.join(fixturesDir, 'pqp-zx.tikzstyles');
  const stylesContent = fs.readFileSync(stylesPath, 'utf8');
  const stylesCatalog = parseTikzStyles(stylesContent);

  it('successfully parses pqp-zx.tikzstyles with expected ZX styles', () => {
    expect(stylesCatalog).toBeDefined();
    expect(stylesCatalog.styles.length).toBeGreaterThan(0);
    expect(stylesCatalog.styles.some((s: any) => s.name === 'Z' || s.name.toLowerCase().includes('spider'))).toBe(true);
  });

  const fixtureFiles = fs.readdirSync(fixturesDir)
    .filter(f => f.endsWith('.tikz'))
    .sort();

  for (const filename of fixtureFiles) {
    const isStress = filename.includes('stress');
    it(`parses, round-trips, and renders SVG for ${filename} ${isStress ? '(Stress Fixture)' : ''}`, () => {
      const filePath = path.join(fixturesDir, filename);
      const tikzCode = fs.readFileSync(filePath, 'utf8');

      // 1. Parse into AST
      const ast = parseTikz(tikzCode);
      expect(ast).toBeDefined();
      expect(ast.nodes.length).toBeGreaterThan(0);

      if (isStress) {
        expect(ast.nodes.length).toBe(100);
        expect(ast.edges.length).toBe(180);
      }

      // 2. Emit back to TikZ code
      const emitted = emitTikz(ast);
      expect(emitted).toContain('\\begin{tikzpicture}');
      expect(emitted).toContain('\\end{tikzpicture}');

      // 3. Re-parse emitted TikZ code (ast round-trip invariance)
      const reParsed = parseTikz(emitted);
      expect(reParsed.nodes.length).toBe(ast.nodes.length);
      expect(reParsed.edges.length).toBe(ast.edges.length);

      // 4. Generate pure vector SVG
      const svg = generateSvg(ast, stylesCatalog);
      expect(svg).toContain('<svg');
      expect(svg).toContain('</svg>');
      expect(svg).toContain('xmlns="http://www.w3.org/2000/svg"');
    });
  }
});
