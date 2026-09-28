import { describe, it, expect } from 'vitest';
import { PdfExporter } from '../../../src/services/export/PdfExporter';
import type { GraphAST } from '../../../src/core/domain/types';

describe('PdfExporter', () => {
  const sampleAST: GraphAST = {
    data: [],
    paths: [],
    nodes: [
      { id: '0', name: '0', label: 'A', position: { x: -1, y: 0 }, data: [] },
      { id: '1', name: '1', label: 'B', position: { x: 1, y: 0 }, data: [] },
    ],
    edges: [{ id: 'e1', sourceId: '0', targetId: '1', data: [] }],
  };

  it('generates compliant PDF-1.4 header and trailer', () => {
    const buffer = PdfExporter.generatePdfBuffer(sampleAST);
    expect(buffer).toBeInstanceOf(Uint8Array);

    const decoder = new TextDecoder();
    const pdfText = decoder.decode(buffer);

    expect(pdfText).toContain('%PDF-1.4');
    expect(pdfText).toContain('/Type /Catalog');
    expect(pdfText).toContain('/Type /Pages');
    expect(pdfText).toContain('/Type /Page');
    expect(pdfText).toContain('xref');
    expect(pdfText).toContain('trailer');
    expect(pdfText).toContain('%%EOF');
  });

  it('contains PDF drawing stream operators', () => {
    const buffer = PdfExporter.generatePdfBuffer(sampleAST);
    const pdfText = new TextDecoder().decode(buffer);

    // Stream contains drawing operators: m (moveto), l (lineto) or c (curveto), S (stroke)
    expect(pdfText).toMatch(/m.*(l|c).*S/);
  });
});
