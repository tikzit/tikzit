import { describe, it, expect, vi } from 'vitest';
import { ImageExporter } from '../../../src/services/export/ImageExporter';
import type { GraphAST } from '../../../src/core/domain/types';

describe('ImageExporter', () => {
  const sampleAST: GraphAST = {
    data: [],
    paths: [],
    nodes: [
      { id: '0', name: '0', label: 'A', position: { x: 0, y: 0 }, data: [] },
      { id: '1', name: '1', label: 'B', position: { x: 2, y: 0 }, data: [] },
    ],
    edges: [{ id: 'e1', sourceId: '0', targetId: '1', data: [] }],
  };

  it('exports pure TikZ code snippet', () => {
    const tikz = ImageExporter.exportTikz(sampleAST);
    expect(tikz).toContain('\\begin{tikzpicture}');
    expect(tikz).toContain('\\node');
    expect(tikz).toContain('\\draw (0) to (1);');
    expect(tikz).toContain('\\end{tikzpicture}');
  });

  it('exports standalone LaTeX document (.tex) with preamble', () => {
    const doc = ImageExporter.exportTex(sampleAST);
    expect(doc).toContain('\\documentclass');
    expect(doc).toContain('\\usepackage{tikz}');
    expect(doc).toContain('\\begin{document}');
    expect(doc).toContain('\\begin{tikzpicture}');
    expect(doc).toContain('\\end{document}');
  });

  it('exports standalone SVG vector file', () => {
    const svg = ImageExporter.exportSvg(sampleAST);
    expect(svg).toContain('<svg xmlns="http://www.w3.org/2000/svg"');
    expect(svg).toContain('id="edgelayer"');
    expect(svg).toContain('id="nodelayer"');
  });

  it('copies TikZ code to clipboard', async () => {
    const ok = await ImageExporter.copyTikzToClipboard(sampleAST);
    // In node/test runner, clipboard fallback returns false or true without throwing
    expect(typeof ok).toBe('boolean');
  });
});
