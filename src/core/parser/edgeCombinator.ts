/**
 * src/core/parser/edgeCombinator.ts - Sprint 24
 * Combinator for TikZ draw commands, edge segments, and path chains.
 * Target: <= 120 LOC.
 */
import type { GraphAST, EdgeData, GraphElementData } from '../domain/types';
import { mergeData } from '../domain/types';
import { type ParserContext, ParseError } from './parserContext';
import { extractCurvatureProperties } from './propertyCombinator';

export function parseDrawCommand(ctx: ParserContext, ast: GraphAST): void {
  const cmdToken = ctx.consume('DRAW_CMD');
  let drawProperties: GraphElementData = [];

  // Optional draw-level properties: \draw [props]
  if (ctx.match('BRACKETS')) {
    drawProperties = ctx.advance().value as GraphElementData;
  }

  // Source node ref: (src) or (src.anchor)
  const srcToken = ctx.consume('REF', 'Expected edge source node (name)');
  let currentSource = srcToken.value.name;
  let currentSourceAnchor = srcToken.value.anchor;
  const pathFirstSource = currentSource;

  const segmentEdges: EdgeData[] = [];
  let isPathCycle = false;

  // Must have at least one 'to' segment
  if (!ctx.match('TO')) {
    throw new ParseError(
      'Expected "to" in \\draw statement',
      ctx.peek().loc.line,
      ctx.peek().loc.column
    );
  }

  while (ctx.match('TO')) {
    ctx.consume('TO');

    // Optional per-segment properties: to [props]
    let toProperties: GraphElementData = [];
    if (ctx.match('BRACKETS')) {
      toProperties = ctx.advance().value as GraphElementData;
    }

    // Optional inline edge node: node [props] {label}
    let edgeNode: { label: string; data: GraphElementData } | undefined = undefined;
    if (ctx.match('NODE_KEYWORD')) {
      ctx.consume('NODE_KEYWORD');
      let edgeNodeProps: GraphElementData = [];
      if (ctx.match('BRACKETS')) {
        edgeNodeProps = ctx.advance().value as GraphElementData;
      }
      const edgeNodeLabelToken = ctx.consume('BRACED_STRING', 'Expected edge node label in braces {...}');
      edgeNode = {
        label: edgeNodeLabelToken.value,
        data: edgeNodeProps,
      };
    }

    // Target specification: (), cycle, or (tgt.anchor)
    let targetId: string;
    let targetAnchor: string | undefined;

    if (ctx.match('EMPTY_PARENS')) {
      ctx.consume('EMPTY_PARENS');
      targetId = currentSource;
      targetAnchor = currentSourceAnchor;
    } else if (ctx.match('CYCLE')) {
      ctx.consume('CYCLE');
      targetId = pathFirstSource;
      targetAnchor = undefined;
      isPathCycle = true;
    } else if (ctx.match('REF')) {
      const tgtToken = ctx.consume('REF');
      targetId = tgtToken.value.name;
      targetAnchor = tgtToken.value.anchor;
    } else {
      throw new ParseError(
        `Expected target node, '()', or 'cycle' after 'to', found '${ctx.peek().raw}'`,
        ctx.peek().loc.line,
        ctx.peek().loc.column
      );
    }

    const mergedData = mergeData(toProperties, drawProperties);
    const { bend, inAngle, outAngle, weight } = extractCurvatureProperties(mergedData);

    const edgeId = `e_${ast.edges.length}`;
    const edge: EdgeData = {
      id: edgeId,
      sourceId: currentSource,
      targetId,
      sourceAnchor: currentSourceAnchor,
      targetAnchor,
      data: mergedData,
      edgeNode,
      bend,
      inAngle,
      outAngle,
      weight,
      line: cmdToken.loc.line,
    };

    segmentEdges.push(edge);
    ast.edges.push(edge);

    // Advance source for chained edges
    currentSource = targetId;
    currentSourceAnchor = targetAnchor;
  }

  // Terminating semicolon
  ctx.consume('SEMICOLON', 'Expected ";" at end of \\draw statement');

  // If part of an edge chain (>1 segment) or cycle, record PathData
  if (segmentEdges.length > 1 || isPathCycle) {
    if (!ast.paths) ast.paths = [];
    ast.paths.push({
      id: `path_${ast.paths.length}`,
      edgeIds: segmentEdges.map((e) => e.id),
      edges: segmentEdges.map((e) => e.id),
      isCycle: isPathCycle,
    });
  }
}
