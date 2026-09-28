/**
 * src/core/parser/nodeCombinator.ts - Sprint 24
 * Combinator for TikZ node command definitions.
 * Target: <= 60 LOC.
 */
import type { GraphAST, NodeData, GraphElementData, Point2D } from '../domain/types';
import type { ParserContext } from './parserContext';

export function parseNodeCommand(ctx: ParserContext, ast: GraphAST, nodeMap: Map<string, NodeData>): void {
  const cmdToken = ctx.consume('NODE_CMD');
  let properties: GraphElementData = [];

  // Optional properties [style=..., fill=...]
  if (ctx.match('BRACKETS')) {
    properties = ctx.advance().value as GraphElementData;
  }

  // Node name in parentheses: (nodename)
  const nameToken = ctx.consume('REF', 'Expected node name in parentheses (name)');
  const name = nameToken.value.name;

  // Keyword 'at'
  ctx.consume('AT', 'Expected "at" after node name');

  // Coordinate (x, y)
  const coordToken = ctx.consume('COORD', 'Expected coordinate (x, y)');
  const position: Point2D = coordToken.value;

  // Label in braces {label}
  const labelToken = ctx.consume('BRACED_STRING', 'Expected label in braces {...}');
  const label = labelToken.value;

  // Terminating semicolon
  ctx.consume('SEMICOLON', 'Expected ";" after node definition');

  const node: NodeData = {
    id: name,
    name,
    label,
    position,
    data: properties,
    line: cmdToken.loc.line,
  };

  ast.nodes.push(node);
  nodeMap.set(name, node);
}
