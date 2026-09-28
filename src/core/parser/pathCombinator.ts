/**
 * src/core/parser/pathCombinator.ts - Sprint 24
 * Combinator for TikZ path commands and bounding box specifications.
 * Target: <= 50 LOC.
 */
import type { GraphAST, Point2D } from '../domain/types';
import type { ParserContext } from './parserContext';

export function parsePathCommand(ctx: ParserContext, ast: GraphAST): void {
  ctx.consume('PATH_CMD');

  // Optional path properties: [use as bounding box]
  if (ctx.match('BRACKETS')) {
    ctx.advance();
  }

  // First coordinate: (x0, y0)
  const c1 = ctx.consume('COORD', 'Expected first coordinate of bounding box');
  const p1: Point2D = c1.value;

  // Keyword 'rectangle'
  ctx.consume('RECTANGLE', 'Expected "rectangle" in bounding box path');

  // Second coordinate: (x1, y1)
  const c2 = ctx.consume('COORD', 'Expected second coordinate of bounding box');
  const p2: Point2D = c2.value;

  // Terminating semicolon
  ctx.consume('SEMICOLON', 'Expected ";" at end of \\path statement');

  ast.bbox = {
    min: {
      x: Math.min(p1.x, p2.x),
      y: Math.min(p1.y, p2.y),
    },
    max: {
      x: Math.max(p1.x, p2.x),
      y: Math.max(p1.y, p2.y),
    },
  };
}
