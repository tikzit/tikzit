/**
 * Standalone SVG Vector Generator for TikZiT Web
 * Synthesizes crisp vector SVG diagrams directly from GraphAST and TikzStylesCatalog.
 * Conforms to TikZ/PGF coordinate conventions, desktop TikZiT visual aesthetics,
 * cubic Bézier splines, layers, self-loops, and styles.
 */

import type { GraphAST, NodeData, EdgeData, TikzStylesCatalog, TikzStyle } from '../../core/domain/types';
import { getProperty } from '../../core/domain/types';
import { parsePGFColor } from '../../core/styles/TikzStyleModel';
import { computeEdgeControls } from '../../canvas/bezier';

export interface SvgGeneratorOptions {
  scale?: number; // Pixels per TikZ unit (default: 50px)
  padding?: number; // Padding in pixels around diagram (default: 40px)
  theme?: 'light' | 'dark';
  transparentBg?: boolean;
}

export function isEdgeCurved(edge: EdgeData): boolean {
  if (edge.sourceId === edge.targetId) return true;
  if (edge.bend !== undefined && edge.bend !== 0) return true;
  if (edge.inAngle !== undefined && edge.outAngle !== undefined) return true;
  if (edge.data) {
    for (const p of edge.data) {
      if (p.key === 'bend left' || p.key === 'bend right' || p.key === 'loop') return true;
      if (p.key === 'in' || p.key === 'out') {
        const hasOther = edge.data.some((o) => (p.key === 'in' ? o.key === 'out' : o.key === 'in'));
        if (hasOther) return true;
      }
    }
  }
  return false;
}

export function generateSvg(
  ast: GraphAST,
  stylesCatalog?: TikzStylesCatalog,
  options: SvgGeneratorOptions = {}
): string {
  const scale = options.scale ?? 60;
  const padding = options.padding ?? 40;
  const isDark = options.theme === 'dark';
  const defaultStroke = isDark ? '#f1f5f9' : '#0f172a';
  const defaultBg = isDark ? '#141720' : '#ffffff';

  // Build node lookup map
  const nodeMap = new Map<string, NodeData>();
  for (const node of ast.nodes) {
    nodeMap.set(node.name, node);
    nodeMap.set(node.id, node);
  }

  // Calculate bounding box in TikZ coordinates
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

  // Account for custom BoundingBox if provided
  if (ast.bbox) {
    minX = Math.min(minX, ast.bbox.min.x);
    maxX = Math.max(maxX, ast.bbox.max.x);
    minY = Math.min(minY, ast.bbox.min.y);
    maxY = Math.max(maxY, ast.bbox.max.y);
  }

  // Add margin around nodes in TikZ units (at least 0.5 unit)
  minX -= 0.5;
  maxX += 0.5;
  minY -= 0.5;
  maxY += 0.5;

  const tikzWidth = Math.max(1, maxX - minX);
  const tikzHeight = Math.max(1, maxY - minY);

  const svgWidth = Math.round(tikzWidth * scale + padding * 2);
  const svgHeight = Math.round(tikzHeight * scale + padding * 2);

  // Coordinate transform: TikZ Cartesian (y up) -> SVG canvas (y down)
  const toSvgX = (x: number) => padding + (x - minX) * scale;
  const toSvgY = (y: number) => padding + (maxY - y) * scale;

  // Resolve node style
  const resolveStyle = (node: NodeData): TikzStyle | undefined => {
    if (!stylesCatalog) return undefined;
    const styleProp = getProperty(node.data, 'style') || (node.data[0]?.value === undefined ? node.data[0]?.key : undefined);
    if (!styleProp) return undefined;
    return stylesCatalog.styles.find(s => s.name === styleProp);
  };

  // 1. Generate Edges (edgelayer)
  const edgeElements: string[] = [];
  for (const edge of ast.edges) {
    const srcNode = nodeMap.get(edge.sourceId);
    const tgtNode = nodeMap.get(edge.targetId);
    if (!srcNode || !tgtNode) continue;

    const p0 = srcNode.position;
    const p1 = tgtNode.position;

    const sx = toSvgX(p0.x);
    const sy = toSvgY(p0.y);
    const tx = toSvgX(p1.x);
    const ty = toSvgY(p1.y);

    const isCurved = isEdgeCurved(edge);

    const srcStyleName = getProperty(srcNode.data, 'style') || (srcNode.data[0]?.value === undefined ? srcNode.data[0]?.key : undefined);
    const tgtStyleName = getProperty(tgtNode.data, 'style') || (tgtNode.data[0]?.value === undefined ? tgtNode.data[0]?.key : undefined);

    const controls = computeEdgeControls({
      src: p0,
      target: p1,
      sourceId: edge.sourceId,
      targetId: edge.targetId,
      srcStyle: srcStyleName,
      targetStyle: tgtStyleName,
      bend: edge.bend,
      inAngle: edge.inAngle,
      outAngle: edge.outAngle,
      weight: edge.weight,
      data: edge.data,
    });

    let pathD = '';
    let midX = (sx + tx) / 2;
    let midY = (sy + ty) / 2;

    if (!isCurved) {
      pathD = `M ${sx.toFixed(2)} ${sy.toFixed(2)} L ${tx.toFixed(2)} ${ty.toFixed(2)}`;
    } else {
      const cp0 = controls.cp1;
      const cp1 = controls.cp2;

      const c1x = toSvgX(cp0.x);
      const c1y = toSvgY(cp0.y);
      const c2x = toSvgX(cp1.x);
      const c2y = toSvgY(cp1.y);

      pathD = `M ${sx.toFixed(2)} ${sy.toFixed(2)} C ${c1x.toFixed(2)} ${c1y.toFixed(2)}, ${c2x.toFixed(2)} ${c2y.toFixed(2)}, ${tx.toFixed(2)} ${ty.toFixed(2)}`;

      // Exact Bézier midpoint from evaluateCubicBezier(0.5, tail, cp1, cp2, head)
      midX = toSvgX(controls.mid.x);
      midY = toSvgY(controls.mid.y);
    }

    // Edge styling
    let strokeColor = defaultStroke;
    let strokeWidth = 2.0;
    let strokeDash = '';

    const hasDashed = edge.data.some(d => d.key === 'dashed');
    const hasDotted = edge.data.some(d => d.key === 'dotted');
    if (hasDashed) strokeDash = 'stroke-dasharray="6,4"';
    if (hasDotted) strokeDash = 'stroke-dasharray="2,3"';

    const colorProp = getProperty(edge.data, 'draw') || getProperty(edge.data, 'color');
    if (colorProp) strokeColor = parsePGFColor(colorProp);

    edgeElements.push(
      `    <path id="edge-${edge.id}" d="${pathD}" fill="none" stroke="${strokeColor}" stroke-width="${strokeWidth}" stroke-linecap="round" ${strokeDash} />`
    );

    // Edge label if present
    if (edge.edgeNode?.label) {
      edgeElements.push(
        `    <text x="${midX.toFixed(2)}" y="${(midY - 8).toFixed(2)}" font-family="system-ui, sans-serif" font-size="11" fill="${strokeColor}" text-anchor="middle">${edge.edgeNode.label}</text>`
      );
    }
  }

  // 2. Generate Nodes (nodelayer)
  const nodeElements: string[] = [];
  for (const node of ast.nodes) {
    const cx = toSvgX(node.position.x);
    const cy = toSvgY(node.position.y);
    const style = resolveStyle(node);
    const styleName = getProperty(node.data, 'style') || (node.data[0]?.value === undefined ? node.data[0]?.key : undefined);

    const shapeProp = style ? getProperty(style.data, 'shape') : undefined;
    const isJunction = !styleName || styleName === 'none' || shapeProp === 'none';

    if (isJunction) {
      // Desktop TikZiT parity for junction nodes (style=none)
      // Dashed boundary ring + solid center dot
      nodeElements.push(
        `    <g id="node-${node.id}" class="tikzit-junction-node">` +
        `\n      <circle cx="${cx.toFixed(2)}" cy="${cy.toFixed(2)}" r="10" fill="none" stroke="#b4b4dc" stroke-width="1.5" stroke-dasharray="3,3" />` +
        `\n      <circle cx="${cx.toFixed(2)}" cy="${cy.toFixed(2)}" r="2.5" fill="#b4b4c8" />` +
        `\n    </g>`
      );
      continue;
    }

    // Styled node
    const shape = style ? (getProperty(style.data, 'shape') || 'circle') : 'circle';
    const fillProp = style ? (getProperty(style.data, 'fill') || getProperty(style.data, 'fillColor')) : undefined;
    const drawProp = style ? (getProperty(style.data, 'draw') || getProperty(style.data, 'drawColor')) : undefined;
    const fillHex = fillProp ? parsePGFColor(fillProp) : '#e2e8f0';
    const strokeHex = drawProp ? parsePGFColor(drawProp) : defaultStroke;
    const nodeRadius = 14;

    let shapeSvg = '';
    if (shape === 'rectangle' || shape === 'box') {
      const size = nodeRadius * 2;
      shapeSvg = `<rect x="${(cx - nodeRadius).toFixed(2)}" y="${(cy - nodeRadius).toFixed(2)}" width="${size}" height="${size}" rx="3" fill="${fillHex}" stroke="${strokeHex}" stroke-width="2" />`;
    } else if (shape === 'diamond') {
      const r = nodeRadius * 1.2;
      const pts = `${cx},${cy - r} ${cx + r},${cy} ${cx},${cy + r} ${cx - r},${cy}`;
      shapeSvg = `<polygon points="${pts}" fill="${fillHex}" stroke="${strokeHex}" stroke-width="2" />`;
    } else {
      // Circle default
      shapeSvg = `<circle cx="${cx.toFixed(2)}" cy="${cy.toFixed(2)}" r="${nodeRadius}" fill="${fillHex}" stroke="${strokeHex}" stroke-width="2" />`;
    }

    let labelSvg = '';
    if (node.label && node.label.trim().length > 0) {
      // Clean TeX label string for SVG text
      const cleanLabel = node.label.replace(/^\$|\$$/g, '').replace(/\\alpha/g, 'α').replace(/\\beta/g, 'β').replace(/\\pi/g, 'π');
      const textProp = style ? (getProperty(style.data, 'text') || getProperty(style.data, 'textColor')) : undefined;
      const textColor = textProp ? parsePGFColor(textProp) : (fillHex === '#ffffff' || fillHex === '#e2e8f0' ? '#0f172a' : '#ffffff');
      labelSvg = `\n      <text x="${cx.toFixed(2)}" y="${cy.toFixed(2)}" font-family="system-ui, sans-serif" font-size="11" font-weight="500" fill="${textColor}" text-anchor="middle" dominant-baseline="central">${cleanLabel}</text>`;
    }

    nodeElements.push(
      `    <g id="node-${node.id}" class="tikzit-node">` +
      `\n      ${shapeSvg}` +
      labelSvg +
      `\n    </g>`
    );
  }

  const bgRect = options.transparentBg
    ? ''
    : `  <rect width="100%" height="100%" fill="${defaultBg}" />\n`;

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${svgWidth} ${svgHeight}" width="${svgWidth}" height="${svgHeight}">
  <defs>
    <style>
      .tikzit-junction-node { opacity: 0.85; }
      .tikzit-node { cursor: pointer; }
      text { user-select: none; }
    </style>
  </defs>
${bgRect}  <!-- edgelayer -->
  <g id="edgelayer" class="edgelayer">
${edgeElements.join('\n')}
  </g>
  <!-- nodelayer -->
  <g id="nodelayer" class="nodelayer">
${nodeElements.join('\n')}
  </g>
</svg>`;
}
