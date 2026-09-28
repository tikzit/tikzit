/**
 * Pure TypeScript Domain Types for TikZiT Graph AST & Stylesheets
 * 
 * Modeled after desktop TikZiT (C++/Qt) data structures:
 * - GraphElementData / GraphElementProperty (src/data/graphelementdata.h)
 * - Node (src/data/node.h)
 * - Edge (src/data/edge.h)
 * - Path (src/data/path.h)
 * - Graph (src/data/graph.h)
 * - TikzStyles (src/data/tikzstyles.h)
 * 
 * Invariants:
 * 1. Properties are an ordered list, not a map. Order is load-bearing.
 * 2. Lookup matches desktop semantics (first matching key via indexOfKey).
 * 3. All types are plain JSON-serializable objects (POJOs), 100% compatible with MCard CAS.
 */

export interface Point2D {
  x: number;
  y: number;
}

/** Ordered property: atom (e.g. `bend left`) or key=value (e.g. `bend left=35`). */
export interface GraphElementProperty {
  key: string;
  value?: string; // undefined => atom
}

/** Ordered property list. Order is load-bearing: preserved on emit. */
export type GraphElementData = GraphElementProperty[];

export interface NodeData {
  id: string; // Internal unique ID (generated or mapped)
  name: string; // TikZ node name, e.g. "0", "z1"
  label: string; // TeX label formula or text, e.g. "$\\alpha$"
  position: Point2D;
  data: GraphElementData; // Style & presentation properties
  line?: number;
}

export interface EdgeNodeData {
  label: string; // TeX label on the edge midpoint
  data: GraphElementData; // e.g. [{ key: 'above' }]
}

export interface EdgeData {
  id: string;
  sourceId: string; // Source node name/id
  targetId: string; // Target node name/id
  sourceAnchor?: string; // e.g. "north", "center"
  targetAnchor?: string; // e.g. "south", "center"
  data: GraphElementData; // Style + path properties
  edgeNode?: EdgeNodeData; // Mid-edge label node
  bend?: number; // Signed bend degrees (-30 for bend left atom, +30 for bend right)
  inAngle?: number; // Absolute degrees (when both in and out present)
  outAngle?: number;
  weight?: number; // Control point factor (default 0.4; 1.0 for self-loop)
  line?: number;
}

export interface PathData {
  id: string;
  edgeIds: string[]; // Edges in this chained \draw path
  edges?: string[]; // Alias for backward compatibility
  isCycle: boolean; // Closed with 'cycle'
}

export interface BoundingBox {
  min: Point2D;
  max: Point2D;
}

export interface GraphAST {
  data: GraphElementData; // \begin{tikzpicture}[...] options
  bbox?: BoundingBox; // \path [use as bounding box] (min) rectangle (max);
  nodes: NodeData[];
  edges: EdgeData[];
  paths: PathData[];
}

export interface TikzStyle {
  name: string;
  category?: string;
  data: GraphElementData;
  properties?: GraphElementData;
}

export interface TikzStylesCatalog {
  styles: TikzStyle[];
}

export interface ParseDiagnostic {
  message: string;
  line: number;
  column: number;
  severity: 'error' | 'warning';
}

export interface ParseResult {
  success: boolean;
  ast?: GraphAST;
  styles?: TikzStylesCatalog;
  diagnostics: ParseDiagnostic[];
}

export interface SafeParseResult {
  success: boolean;
  ast?: GraphAST | null;
  partialAST?: GraphAST;
  errors: ParseDiagnostic[];
}

// ============================================================================
// GraphElementData Helper Utilities (matching desktop C++ GraphElementData)
// ============================================================================

export function isPathProperty(key: string): boolean {
  return (
    key === 'bend left' ||
    key === 'bend right' ||
    key === 'in' ||
    key === 'out' ||
    key === 'looseness'
  );
}

export function getProperty(data: GraphElementData, key: string): string | undefined {
  for (const p of data) {
    if (p.key === key && p.value !== undefined) {
      return p.value;
    }
  }
  return undefined;
}

export function hasProperty(data: GraphElementData, key: string): boolean {
  for (const p of data) {
    if (p.key === key) {
      return true;
    }
  }
  return false;
}

export function hasAtom(data: GraphElementData, atom: string): boolean {
  for (const p of data) {
    if (p.key === atom && p.value === undefined) {
      return true;
    }
  }
  return false;
}

export function setProperty(data: GraphElementData, key: string, value: string): GraphElementData {
  for (let i = 0; i < data.length; i++) {
    if (data[i].key === key && data[i].value !== undefined) {
      data[i].value = value;
      return data;
    }
  }
  data.push({ key, value });
  return data;
}

export function setAtom(data: GraphElementData, atom: string): GraphElementData {
  for (let i = 0; i < data.length; i++) {
    if (data[i].key === atom && data[i].value === undefined) {
      return data;
    }
  }
  data.push({ key: atom });
  return data;
}

export function unsetProperty(data: GraphElementData, key: string): GraphElementData {
  for (let i = data.length - 1; i >= 0; i--) {
    if (data[i].key === key && data[i].value !== undefined) {
      data.splice(i, 1);
    }
  }
  return data;
}

export function unsetAtom(data: GraphElementData, atom: string): GraphElementData {
  for (let i = data.length - 1; i >= 0; i--) {
    if (data[i].key === atom && data[i].value === undefined) {
      data.splice(i, 1);
    }
  }
  return data;
}

export function mergeData(target: GraphElementData, source: GraphElementData): GraphElementData {
  for (const prop of source) {
    if (!hasProperty(target, prop.key)) {
      target.push({ ...prop });
    }
  }
  return target;
}

export function partitionPathData(data: GraphElementData): {
  pathData: GraphElementData;
  nonPathData: GraphElementData;
} {
  const pathData: GraphElementData = [];
  const nonPathData: GraphElementData = [];

  for (const prop of data) {
    if (isPathProperty(prop.key)) {
      pathData.push({ ...prop });
    } else {
      nonPathData.push({ ...prop });
    }
  }

  return { pathData, nonPathData };
}

export function formatProperties(data: GraphElementData): string {
  if (!data || data.length === 0) return '';
  const entries = data.map((p) => (p.value !== undefined ? `${p.key}=${p.value}` : p.key));
  return `[${entries.join(', ')}]`;
}
