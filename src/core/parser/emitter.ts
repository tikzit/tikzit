/**
 * Pure TypeScript Canonical TikZ Emitter
 * Matches Graph::tikz() formatting in src/data/graph.cpp from the C++ desktop reference.
 */

import type {
  GraphAST,
  NodeData,
  EdgeData,
  PathData,
  BoundingBox,
  Point2D,
  GraphElementProperty,
  GraphElementData,
  TikzStylesCatalog,
} from '../domain/types';
import { isPathProperty } from '../domain/types';

/**
 * Format float to string matching src/util.cpp:
 * Shortest representation without trailing decimal zeros.
 */
export function floatToString(f: number): string {
  if (Math.abs(f) < 1e-9) return '0';
  // Round to avoid IEEE-754 precision artifacts
  const rounded = parseFloat(f.toFixed(8));
  return String(rounded);
}

/**
 * Escape property key or value according to TikZ rules:
 * Wraps in braces if it contains special characters not in [0-9a-zA-Z<> \-'.]
 */
export function tikzEscape(str: string): string {
  if (/^[0-9a-zA-Z<> \-'.]*$/.test(str)) {
    return str;
  }
  return '{' + str + '}';
}

/**
 * Format a single property: atom "foo" or key-value "foo=bar"
 */
export function formatProperty(p: GraphElementProperty): string {
  if (p.value === undefined) {
    return tikzEscape(p.key);
  }
  return `${tikzEscape(p.key)}=${tikzEscape(p.value)}`;
}

/**
 * Format GraphElementData as [prop1, prop2, ...]
 */
export function formatElementData(data: GraphElementData): string {
  if (!data || data.length === 0) return '';
  const inner = data.map(formatProperty).join(', ');
  return `[${inner}]`;
}

/**
 * Emit canonical TikZ markup from an AST.
 */
export function emitTikz(ast: GraphAST): string {
  let out = '\\begin{tikzpicture}';
  if (ast.data && ast.data.length > 0) {
    out += formatElementData(ast.data);
  }
  out += '\n';

  // 1. Bounding box
  if (ast.bbox) {
    const minX = floatToString(ast.bbox.min.x);
    const minY = floatToString(ast.bbox.min.y);
    const maxX = floatToString(ast.bbox.max.x);
    const maxY = floatToString(ast.bbox.max.y);
    out += `\t\\path [use as bounding box] (${minX},${minY}) rectangle (${maxX},${maxY});\n`;
  }

  // 2. Nodes layer
  if (ast.nodes.length > 0) {
    out += '\t\\begin{pgfonlayer}{nodelayer}\n';
    for (const n of ast.nodes) {
      out += '\t\t\\node ';
      if (n.data && n.data.length > 0) {
        out += formatElementData(n.data) + ' ';
      }
      const posX = floatToString(n.position.x);
      const posY = floatToString(n.position.y);
      out += `(${n.name}) at (${posX}, ${posY}) {${n.label}};\n`;
    }
    out += '\t\\end{pgfonlayer}\n';
  }

  // 3. Edges layer
  if (ast.edges.length > 0) {
    out += '\t\\begin{pgfonlayer}{edgelayer}\n';

    const emittedEdgeIds = new Set<string>();

    // Emit grouped paths first
    if (ast.paths && ast.paths.length > 0) {
      for (const path of ast.paths) {
        const edgeIds = path.edgeIds || path.edges || [];
        const pathEdges = edgeIds
          .map((id: string) => ast.edges.find((e: EdgeData) => e.id === id))
          .filter((e): e is EdgeData => e !== undefined);

        if (pathEdges.length === 0) continue;

        const firstEdge = pathEdges[0];
        pathEdges.forEach((e: EdgeData) => emittedEdgeIds.add(e.id));

        out += '\t\t\\draw ';

        // Non-path data hoisted to \\draw
        const nonPathData = firstEdge.data.filter((p: GraphElementProperty) => !isPathProperty(p.key));
        if (nonPathData.length > 0) {
          out += formatElementData(nonPathData) + ' ';
        }

        // First source
        out += `(${firstEdge.sourceId}`;
        if (firstEdge.sourceAnchor) {
          out += `.${firstEdge.sourceAnchor}`;
        } else if (path.isCycle) {
          out += '.center';
        }
        out += ')';

        // Chain to targets
        for (let i = 0; i < pathEdges.length; i++) {
          const e = pathEdges[i];
          out += '\n\t\t\t to ';

          const pathData = e.data.filter((p: GraphElementProperty) => isPathProperty(p.key));
          if (pathData.length > 0) {
            out += formatElementData(pathData) + ' ';
          }

          if (e.edgeNode) {
            out += 'node ';
            if (e.edgeNode.data && e.edgeNode.data.length > 0) {
              out += formatElementData(e.edgeNode.data) + ' ';
            }
            out += `{${e.edgeNode.label}} `;
          }

          if (path.isCycle && e.targetId === firstEdge.sourceId && i === pathEdges.length - 1) {
            out += 'cycle';
          } else {
            out += `(${e.targetId}`;
            if (e.targetAnchor) {
              out += `.${e.targetAnchor}`;
            } else if (i < pathEdges.length - 1) {
              out += '.center';
            }
            out += ')';
          }
        }
        out += ';\n';
      }
    }

    // Standalone edges
    for (const e of ast.edges) {
      if (emittedEdgeIds.has(e.id)) continue;

      out += '\t\t\\draw ';
      let edgeData = e.data || [];
      if (e.sourceId === e.targetId) {
        // Desktop TikZiT Parity (edge.cpp:255-297, graph.cpp:304-333):
        // Omit style=none, order [style?, in=..., out=..., loop]
        edgeData = edgeData.filter(p => !(p.key === 'style' && (p.value === 'none' || !p.value)));
        edgeData = [...edgeData].sort((a, b) => {
          const order = (key: string) => {
            if (key === 'style') return 1;
            if (key === 'in') return 2;
            if (key === 'out') return 3;
            if (key === 'loop') return 4;
            return 5;
          };
          return order(a.key) - order(b.key);
        });
      }
      if (edgeData.length > 0) {
        out += formatElementData(edgeData) + ' ';
      }

      out += `(${e.sourceId}`;
      if (e.sourceAnchor) {
        out += `.${e.sourceAnchor}`;
      }
      out += ') to ';

      if (e.edgeNode) {
        out += 'node ';
        if (e.edgeNode.data && e.edgeNode.data.length > 0) {
          out += formatElementData(e.edgeNode.data) + ' ';
        }
        out += `{${e.edgeNode.label}} `;
      }

      if (e.sourceId === e.targetId) {
        out += '()';
      } else {
        out += `(${e.targetId}`;
        if (e.targetAnchor) {
          out += `.${e.targetAnchor}`;
        }
        out += ')';
      }
      out += ';\n';
    }

    out += '\t\\end{pgfonlayer}\n';
  }

  out += '\\end{tikzpicture}\n';
  return out;
}

/**
 * Emit canonical .tikzstyles format.
 */
export function emitTikzStyles(catalog: TikzStylesCatalog): string {
  let out = '';
  for (const s of catalog.styles) {
    const data = s.data || s.properties || [];
    out += `\\tikzstyle{${s.name}}=${formatElementData(data)}\n`;
  }
  return out;
}

/**
 * Semantic normalization of GraphAST for differential and round-trip invariance tests.
 */
export function normalize(ast: GraphAST): any {
  const normProps = (props: GraphElementData = []) => {
    return [...props].sort((a, b) => {
      const ka = a.key.toLowerCase();
      const kb = b.key.toLowerCase();
      if (ka !== kb) return ka.localeCompare(kb);
      return String(a.value || '').localeCompare(String(b.value || ''));
    });
  };

  const normNodes = [...ast.nodes]
    .map((n) => ({
      name: n.name,
      label: n.label,
      position: {
        x: parseFloat(n.position.x.toFixed(6)),
        y: parseFloat(n.position.y.toFixed(6)),
      },
      data: normProps(n.data),
    }))
    .sort((a, b) => a.name.localeCompare(b.name));

  const normEdges = [...ast.edges]
    .map((e) => ({
      sourceId: e.sourceId,
      targetId: e.targetId,
      sourceAnchor: e.sourceAnchor || undefined,
      targetAnchor: e.targetAnchor || undefined,
      data: normProps(e.data),
      edgeNode: e.edgeNode
        ? {
            label: e.edgeNode.label,
            data: normProps(e.edgeNode.data),
          }
        : undefined,
    }))
    .sort((a, b) => {
      const cmpSrc = a.sourceId.localeCompare(b.sourceId);
      if (cmpSrc !== 0) return cmpSrc;
      const cmpTgt = a.targetId.localeCompare(b.targetId);
      if (cmpTgt !== 0) return cmpTgt;
      return JSON.stringify(a.data).localeCompare(JSON.stringify(b.data));
    });

  const normBbox = ast.bbox
    ? {
        min: {
          x: parseFloat(ast.bbox.min.x.toFixed(6)),
          y: parseFloat(ast.bbox.min.y.toFixed(6)),
        },
        max: {
          x: parseFloat(ast.bbox.max.x.toFixed(6)),
          y: parseFloat(ast.bbox.max.y.toFixed(6)),
        },
      }
    : undefined;

  return {
    data: normProps(ast.data),
    bbox: normBbox,
    nodes: normNodes,
    edges: normEdges,
  };
}
