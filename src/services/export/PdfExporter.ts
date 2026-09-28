/**
 * Standalone Vector PDF Exporter for TikZiT Web
 * Synthesizes compliant PDF-1.4 vector documents directly from GraphAST,
 * accurately translating cubic Bézier curves, line widths, colors, and nodes to PDF stream operators.
 */

import type { GraphAST, TikzStylesCatalog, NodeData } from '../../core/domain/types';
import { getProperty } from '../../core/domain/types';
import { parsePGFColor } from '../../core/styles/TikzStyleModel';
import { computeEdgeControls } from '../../canvas/bezier';
import { downloadBlob } from './ImageExporter';

export interface PdfExportOptions {
  scale?: number; // points per TikZ unit (default: 40)
  padding?: number; // page margin in points (default: 30)
  filename?: string;
}

function hexToRgb(hex: string): [number, number, number] {
  const clean = hex.replace('#', '');
  if (clean.length === 3) {
    const r = parseInt(clean[0] + clean[0], 16) / 255;
    const g = parseInt(clean[1] + clean[1], 16) / 255;
    const b = parseInt(clean[2] + clean[2], 16) / 255;
    return [r, g, b];
  }
  const r = parseInt(clean.substring(0, 2), 16) / 255;
  const g = parseInt(clean.substring(2, 4), 16) / 255;
  const b = parseInt(clean.substring(4, 6), 16) / 255;
  return [isNaN(r) ? 0 : r, isNaN(g) ? 0 : g, isNaN(b) ? 0 : b];
}

export class PdfExporter {
  /**
   * Generates a binary PDF 1.4 buffer containing vector drawings of the diagram.
   */
  public static generatePdfBuffer(
    ast: GraphAST,
    stylesCatalog?: TikzStylesCatalog,
    options: PdfExportOptions = {}
  ): Uint8Array {
    const scale = options.scale ?? 40;
    const padding = options.padding ?? 30;

    // Node map
    const nodeMap = new Map<string, NodeData>();
    for (const node of ast.nodes) {
      nodeMap.set(node.name, node);
      nodeMap.set(node.id, node);
    }

    // Bounding box
    let minX = Infinity;
    let maxX = -Infinity;
    let minY = Infinity;
    let maxY = -Infinity;

    if (ast.nodes.length === 0) {
      minX = -1;
      maxX = 1;
      minY = -1;
      maxY = 1;
    } else {
      for (const n of ast.nodes) {
        if (n.position.x < minX) minX = n.position.x;
        if (n.position.x > maxX) maxX = n.position.x;
        if (n.position.y < minY) minY = n.position.y;
        if (n.position.y > maxY) maxY = n.position.y;
      }
    }

    if (ast.bbox) {
      minX = Math.min(minX, ast.bbox.min.x);
      maxX = Math.max(maxX, ast.bbox.max.x);
      minY = Math.min(minY, ast.bbox.min.y);
      maxY = Math.max(maxY, ast.bbox.max.y);
    }

    minX -= 0.5;
    maxX += 0.5;
    minY -= 0.5;
    maxY += 0.5;

    const tikzW = Math.max(1, maxX - minX);
    const tikzH = Math.max(1, maxY - minY);

    const pageW = Math.round(tikzW * scale + padding * 2);
    const pageH = Math.round(tikzH * scale + padding * 2);

    // Coordinate mapping: TikZ (y up) -> PDF (y up from bottom-left)
    const toPdfX = (x: number) => padding + (x - minX) * scale;
    const toPdfY = (y: number) => padding + (y - minY) * scale;

    const streamCommands: string[] = [];

    // Helper: format floating point
    const f = (n: number) => n.toFixed(2);

    // 1. Draw Edges (edgelayer)
    for (const edge of ast.edges) {
      const srcNode = nodeMap.get(edge.sourceId);
      const tgtNode = nodeMap.get(edge.targetId);
      if (!srcNode || !tgtNode) continue;

      const p0 = srcNode.position;
      const p1 = tgtNode.position;
      const x0 = toPdfX(p0.x);
      const y0 = toPdfY(p0.y);
      const x1 = toPdfX(p1.x);
      const y1 = toPdfY(p1.y);

      const isSelfLoop = edge.sourceId === edge.targetId;
      const isCurved = isSelfLoop || edge.bend !== undefined || (edge.inAngle !== undefined && edge.outAngle !== undefined);

      // Color & Stroke style
      let strokeColorHex = '#0f172a';
      const colorProp = getProperty(edge.data, 'draw') || getProperty(edge.data, 'color');
      if (colorProp) strokeColorHex = parsePGFColor(colorProp);
      const [r, g, b] = hexToRgb(strokeColorHex);

      streamCommands.push('q'); // push graphics state
      streamCommands.push(`${f(r)} ${f(g)} ${f(b)} RG`); // stroke color
      streamCommands.push('1.5 w'); // line width
      streamCommands.push('1 J'); // round cap

      if (edge.data.some(d => d.key === 'dashed')) {
        streamCommands.push('[4 3] 0 d');
      } else if (edge.data.some(d => d.key === 'dotted')) {
        streamCommands.push('[1.5 2.5] 0 d');
      }

      if (!isCurved) {
        streamCommands.push(`${f(x0)} ${f(y0)} m ${f(x1)} ${f(y1)} l S`);
      } else {
        const controls = computeEdgeControls({
          src: p0,
          target: p1,
          bend: edge.bend,
          inAngle: edge.inAngle,
          outAngle: edge.outAngle,
          weight: edge.weight,
        });
        const cp0 = controls.cp1;
        const cp1 = controls.cp2;
        const c1x = toPdfX(cp0.x);
        const c1y = toPdfY(cp0.y);
        const c2x = toPdfX(cp1.x);
        const c2y = toPdfY(cp1.y);

        streamCommands.push(`${f(x0)} ${f(y0)} m ${f(c1x)} ${f(c1y)} ${f(c2x)} ${f(c2y)} ${f(x1)} ${f(y1)} c S`);
      }
      streamCommands.push('Q'); // pop graphics state
    }

    // 2. Draw Nodes (nodelayer)
    const resolveStyle = (node: NodeData) => {
      if (!stylesCatalog) return undefined;
      const styleProp = getProperty(node.data, 'style') || (node.data[0]?.value === undefined ? node.data[0]?.key : undefined);
      if (!styleProp) return undefined;
      return stylesCatalog.styles.find(s => s.name === styleProp);
    };

    for (const node of ast.nodes) {
      const cx = toPdfX(node.position.x);
      const cy = toPdfY(node.position.y);
      const style = resolveStyle(node);
      const styleName = getProperty(node.data, 'style') || (node.data[0]?.value === undefined ? node.data[0]?.key : undefined);
      const shapeProp = style ? getProperty(style.data, 'shape') : undefined;
      const isJunction = !styleName || styleName === 'none' || shapeProp === 'none';

      if (isJunction) {
        // Desktop parity: dashed circle + solid dot
        streamCommands.push('q');
        streamCommands.push('0.7 0.7 0.86 RG');
        streamCommands.push('[2 2] 0 d');
        streamCommands.push('1 w');
        // Approximate circle with 4 beziers
        const r = 8;
        const k = 0.5522847498 * r;
        streamCommands.push(`${f(cx)} ${f(cy + r)} m ${f(cx + k)} ${f(cy + r)} ${f(cx + r)} ${f(cy + k)} ${f(cx + r)} ${f(cy)} c ${f(cx + r)} ${f(cy - k)} ${f(cx + k)} ${f(cy - r)} ${f(cx)} ${f(cy - r)} c ${f(cx - k)} ${f(cy - r)} ${f(cx - r)} ${f(cy - k)} ${f(cx - r)} ${f(cy)} c ${f(cx - r)} ${f(cy + k)} ${f(cx - k)} ${f(cy + r)} ${f(cx)} ${f(cy + r)} c S`);
        streamCommands.push('Q');

        // Center dot
        streamCommands.push('q');
        streamCommands.push('0.7 0.7 0.78 rg');
        const dr = 2;
        const dk = 0.5522847498 * dr;
        streamCommands.push(`${f(cx)} ${f(cy + dr)} m ${f(cx + dk)} ${f(cy + dr)} ${f(cx + dr)} ${f(cy + dk)} ${f(cx + dr)} ${f(cy)} c ${f(cx + dr)} ${f(cy - dk)} ${f(cx + dk)} ${f(cy - dr)} ${f(cx)} ${f(cy - dr)} c ${f(cx - dk)} ${f(cy - dr)} ${f(cx - dr)} ${f(cy - dk)} ${f(cx - dr)} ${f(cy)} c ${f(cx - dr)} ${f(cy + dk)} ${f(cx - dk)} ${f(cy + dr)} ${f(cx)} ${f(cy + dr)} c f`);
        streamCommands.push('Q');
        continue;
      }

      // Styled node
      const shape = style ? (getProperty(style.data, 'shape') || 'circle') : 'circle';
      const fillProp = style ? (getProperty(style.data, 'fill') || getProperty(style.data, 'fillColor')) : undefined;
      const drawProp = style ? (getProperty(style.data, 'draw') || getProperty(style.data, 'drawColor')) : undefined;
      const fillHex = fillProp ? parsePGFColor(fillProp) : '#e2e8f0';
      const strokeHex = drawProp ? parsePGFColor(drawProp) : '#0f172a';
      const [fr, fg, fb] = hexToRgb(fillHex);
      const [sr, sg, sb] = hexToRgb(strokeHex);

      const r = 11;
      streamCommands.push('q');
      streamCommands.push(`${f(fr)} ${f(fg)} ${f(fb)} rg`);
      streamCommands.push(`${f(sr)} ${f(sg)} ${f(sb)} RG`);
      streamCommands.push('1.5 w');

      if (shape === 'rectangle' || shape === 'box') {
        streamCommands.push(`${f(cx - r)} ${f(cy - r)} ${f(r * 2)} ${f(r * 2)} re B`);
      } else if (shape === 'diamond') {
        const d = r * 1.2;
        streamCommands.push(`${f(cx)} ${f(cy + d)} m ${f(cx + d)} ${f(cy)} l ${f(cx)} ${f(cy - d)} l ${f(cx - d)} ${f(cy)} l h B`);
      } else {
        // Circle
        const k = 0.5522847498 * r;
        streamCommands.push(`${f(cx)} ${f(cy + r)} m ${f(cx + k)} ${f(cy + r)} ${f(cx + r)} ${f(cy + k)} ${f(cx + r)} ${f(cy)} c ${f(cx + r)} ${f(cy - k)} ${f(cx + k)} ${f(cy - r)} ${f(cx)} ${f(cy - r)} c ${f(cx - k)} ${f(cy - r)} ${f(cx - r)} ${f(cy - k)} ${f(cx - r)} ${f(cy)} c ${f(cx - r)} ${f(cy + k)} ${f(cx - k)} ${f(cy + r)} ${f(cx)} ${f(cy + r)} c B`);
      }
      streamCommands.push('Q');

      // Label
      if (node.label && node.label.trim().length > 0) {
        const cleanLabel = node.label.replace(/^\$|\$$/g, '');
        streamCommands.push('BT');
        streamCommands.push('/F1 9 Tf');
        streamCommands.push('0 0 0 rg');
        streamCommands.push(`${f(cx - cleanLabel.length * 2.5)} ${f(cy - 3)} Td`);
        streamCommands.push(`(${cleanLabel}) Tj`);
        streamCommands.push('ET');
      }
    }

    const contentStream = streamCommands.join('\n');

    // Build PDF objects
    const objects: string[] = [];
    const offsets: number[] = [];

    let currentPos = 0;
    const header = '%PDF-1.4\n%\\xE2\\xE3\\xCF\\xD3\n';
    currentPos += header.length;

    const addObj = (str: string) => {
      offsets.push(currentPos);
      objects.push(str);
      currentPos += str.length + 1; // + newline
    };

    // Obj 1: Catalog
    addObj('1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj');
    // Obj 2: Pages
    addObj('2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj');
    // Obj 3: Page
    addObj(`3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${pageW} ${pageH}] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >>\nendobj`);
    // Obj 4: Content Stream
    addObj(`4 0 obj\n<< /Length ${contentStream.length} >>\nstream\n${contentStream}\nendstream\nendobj`);
    // Obj 5: Font
    addObj('5 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>\nendobj');

    // Cross reference table
    const startXref = currentPos;
    let xref = `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
    for (const offset of offsets) {
      xref += offset.toString().padStart(10, '0') + ' 00000 n \n';
    }

    const trailer = `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${startXref}\n%%EOF\n`;

    const fullPdf = header + objects.join('\n') + '\n' + xref + trailer;
    const encoder = new TextEncoder();
    return encoder.encode(fullPdf);
  }

  /**
   * Generates pure PDF Blob without triggering browser download
   */
  public static generatePdfBlob(
    ast: GraphAST,
    stylesCatalog?: TikzStylesCatalog,
    options: PdfExportOptions = {}
  ): Blob {
    const buffer = this.generatePdfBuffer(ast, stylesCatalog, options);
    return new Blob([buffer.buffer as ArrayBuffer], { type: 'application/pdf' });
  }

  /**
   * Generates and triggers browser download of the standalone vector PDF.
   */
  public static exportPdf(
    ast: GraphAST,
    stylesCatalog?: TikzStylesCatalog,
    options: PdfExportOptions = {},
    filename: string = 'diagram.pdf'
  ): Blob {
    const blob = this.generatePdfBlob(ast, stylesCatalog, options);
    downloadBlob(blob, filename);
    return blob;
  }
}
