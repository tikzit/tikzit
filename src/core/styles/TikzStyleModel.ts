/**
 * Pure TypeScript TikZ Style Data Model & Helper Functions
 * Matches desktop TikZiT (C++/Qt) Style semantics:
 * - src/data/style.h / src/data/style.cpp
 * - src/data/tikzstyles.h / src/data/tikzstyles.cpp
 */

import type { TikzStyle, GraphElementData, GraphElementProperty } from '../domain/types';
import { getProperty, setProperty } from '../domain/types';

export const NAMED_LATEX_COLORS: Record<string, string> = {
  black: '#000000',
  white: '#ffffff',
  red: '#eb4b4b',
  green: '#5ad25a',
  blue: '#3b82f6',
  cyan: '#06b6d4',
  magenta: '#d946ef',
  yellow: '#ffdc46',
  gray: '#808080',
  grey: '#808080',
  darkgray: '#404040',
  darkgrey: '#404040',
  lightgray: '#bfbfbf',
  lightgrey: '#bfbfbf',
  teal: '#0d9488',
  orange: '#f97316',
  purple: '#a855f7',
  pink: '#ec4899',
};

/**
 * Parses a PGF color string, named LaTeX color, or hex string into a standard 6-digit hex color (#RRGGBB).
 * Supports:
 * - {rgb,255: red,R; green,G; blue,B} / rgb,255: red,R; green,G; blue,B
 * - Standard LaTeX color names
 * - Raw hex strings (#RGB, #RRGGBB)
 */
export function parsePGFColor(colorStr?: string): string {
  if (!colorStr || colorStr === 'none' || colorStr === 'transparent') {
    return 'transparent';
  }

  const trimmed = colorStr.trim();

  // 1. PGF Extended RGB format: {rgb,255: red,R; green,G; blue,B} or rgb,255: ...
  const rgbMatch = trimmed.match(/rgb\s*,\s*255\s*:\s*red\s*,\s*(\d+)\s*;\s*green\s*,\s*(\d+)\s*;\s*blue\s*,\s*(\d+)/i);
  if (rgbMatch) {
    const r = Math.min(255, Math.max(0, parseInt(rgbMatch[1], 10)));
    const g = Math.min(255, Math.max(0, parseInt(rgbMatch[2], 10)));
    const b = Math.min(255, Math.max(0, parseInt(rgbMatch[3], 10)));
    return (
      '#' +
      r.toString(16).padStart(2, '0') +
      g.toString(16).padStart(2, '0') +
      b.toString(16).padStart(2, '0')
    ).toLowerCase();
  }

  // 2. Standard named color
  const lowerName = trimmed.toLowerCase();
  if (NAMED_LATEX_COLORS[lowerName]) {
    return NAMED_LATEX_COLORS[lowerName];
  }

  // 3. Hex code
  if (trimmed.startsWith('#')) {
    if (trimmed.length === 4) {
      return (
        '#' +
        trimmed[1] +
        trimmed[1] +
        trimmed[2] +
        trimmed[2] +
        trimmed[3] +
        trimmed[3]
      ).toLowerCase();
    }
    return trimmed.toLowerCase();
  }

  return '#000000';
}

/**
 * Converts a standard 6-digit hex color into PGF extended RGB syntax:
 * {rgb,255: red,R; green,G; blue,B}
 */
export function toPGFColor(hex: string): string {
  if (!hex || hex === 'none' || hex === 'transparent') {
    return 'none';
  }
  const cleanHex = hex.replace('#', '');
  if (cleanHex.length === 6) {
    const r = parseInt(cleanHex.slice(0, 2), 16);
    const g = parseInt(cleanHex.slice(2, 4), 16);
    const b = parseInt(cleanHex.slice(4, 6), 16);
    return `{rgb,255: red,${r}; green,${g}; blue,${b}}`;
  }
  return hex;
}

/**
 * Extracts category from style properties matching desktop TikZiT:
 * Style::category() { return propertyWithDefault("tikzit category", "", false); }
 */
export function getStyleCategory(style: TikzStyle): string {
  const cat = getProperty(style.data, 'tikzit category') || getProperty(style.data, 'category');
  if (cat && cat.trim().length > 0) {
    return cat.trim();
  }
  return 'Uncategorized';
}

/**
 * Sets category on style properties.
 */
export function setStyleCategory(style: TikzStyle, category: string): void {
  style.data = setProperty(style.data, 'tikzit category', category);
  style.category = category;
}

/**
 * Determines whether a style is an edge style matching desktop C++ Style::isEdgeStyle():
 * Checks for arrow-tip atoms: "-", "->", "-|", "<-", "<->", "<-|", "|-", "|->", "|-|".
 */
export const EDGE_ARROW_ATOMS = new Set([
  '-',
  '->',
  '-|',
  '<-',
  '<->',
  '<-|',
  '|-',
  '|->',
  '|-|',
]);

export function isEdgeStyle(style: TikzStyle): boolean {
  for (const prop of style.data) {
    if (prop.value === undefined && EDGE_ARROW_ATOMS.has(prop.key)) {
      return true;
    }
  }
  return false;
}

/**
 * Gets shape for a style ('circle' | 'rectangle' | 'triangle' | 'diamond' | 'none')
 */
export function getStyleShape(style: TikzStyle): string {
  const shape = getProperty(style.data, 'tikzit shape') || getProperty(style.data, 'shape');
  if (shape) return shape;
  if (style.name.toLowerCase() === 'none') return 'none';
  return 'circle';
}

/**
 * Gets fill color for a style (hex string or 'transparent')
 */
export function getStyleFillColor(style: TikzStyle): string {
  const raw = getProperty(style.data, 'tikzit fill') || getProperty(style.data, 'fill');
  return parsePGFColor(raw || 'transparent');
}

/**
 * Gets stroke/draw color for a style (hex string or 'transparent')
 */
export function getStyleStrokeColor(style: TikzStyle): string {
  const raw = getProperty(style.data, 'tikzit draw') || getProperty(style.data, 'draw');
  return parsePGFColor(raw || '#000000');
}

/**
 * Checks if a style has the dashed property/atom.
 */
export function isStyleDashed(style: TikzStyle): boolean {
  return style.data.some((p) => p.key === 'dashed');
}

/**
 * Checks if a style has the dotted property/atom.
 */
export function isStyleDotted(style: TikzStyle): boolean {
  return style.data.some((p) => p.key === 'dotted');
}

/**
 * Creates a new TikzStyle object.
 */
export function createStyle(
  name: string,
  properties: GraphElementData = [],
  category?: string
): TikzStyle {
  const data: GraphElementData = [...properties];
  if (category) {
    data.push({ key: 'tikzit category', value: category });
  }
  return {
    name,
    data,
    category: category || getStyleCategory({ name, data }),
  };
}

/**
 * Clones an existing style under a new name.
 */
export function cloneStyle(source: TikzStyle, newName: string): TikzStyle {
  return {
    name: newName,
    data: JSON.parse(JSON.stringify(source.data)),
    category: source.category || getStyleCategory(source),
  };
}
