import { describe, it, expect } from 'vitest';
import { ImageExporter } from '../../../src/services/export/ImageExporter';
import { PdfExporter } from '../../../src/services/export/PdfExporter';
import type { GraphAST } from '../../../src/core/domain/types';

describe('pureExporters', () => {
  const sampleAst: GraphAST = {
    data: [],
    paths: [],
    nodes: [
      {
        id: 'n0',
        name: '0',
        label: '',
        position: { x: 0, y: 0 },
        data: [],
      },
    ],
    edges: [],
  };

  it('generateStandaloneTex preserves raw TikZ comments and formatting verbatim', () => {
    const rawTikzWithComments = `% Custom Header Comment
\\begin{tikzpicture}
  % Node zero comment
  \\node [style=none] (0) at (0, 0) {};
\\end{tikzpicture}
% Trailing Comment`;

    const standaloneTex = ImageExporter.generateStandaloneTex(rawTikzWithComments);

    expect(standaloneTex).toContain('\\documentclass');
    expect(standaloneTex).toContain('\\usepackage{tikz}');
    expect(standaloneTex).toContain('% Custom Header Comment');
    expect(standaloneTex).toContain('% Node zero comment');
    expect(standaloneTex).toContain('% Trailing Comment');
  });

  it('generateSvg returns valid SVG string without calling download', () => {
    const svg = ImageExporter.generateSvg(sampleAst);
    expect(typeof svg).toBe('string');
    expect(svg).toContain('<svg');
    expect(svg).toContain('</svg>');
  });

  it('generateSvgBlob returns image/svg+xml Blob', () => {
    const blob = ImageExporter.generateSvgBlob(sampleAst);
    expect(blob).toBeInstanceOf(Blob);
    expect(blob.type).toBe('image/svg+xml;charset=utf-8');
  });

  it('generatePngBlob returns image/png Blob without calling download', async () => {
    const blob = await ImageExporter.generatePngBlob(sampleAst);
    expect(blob).toBeInstanceOf(Blob);
    expect(blob.type).toBe('image/png');
  });

  it('PdfExporter.generatePdfBuffer produces binary PDF 1.4 output', () => {
    const buffer = PdfExporter.generatePdfBuffer(sampleAst);
    expect(buffer).toBeInstanceOf(Uint8Array);
    const header = new TextDecoder().decode(buffer.slice(0, 8));
    expect(header).toContain('%PDF-1.4');
  });

  it('PdfExporter.generatePdfBlob produces application/pdf Blob without calling download', () => {
    const blob = PdfExporter.generatePdfBlob(sampleAst);
    expect(blob).toBeInstanceOf(Blob);
    expect(blob.type).toBe('application/pdf');
  });
});
