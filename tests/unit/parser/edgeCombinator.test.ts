/**
 * tests/unit/parser/edgeCombinator.test.ts - Sprint 24
 * Tests T24-07 to T24-12: edgeCombinator parsing of TikZ draw and edge statements.
 */
import { describe, it, expect } from 'vitest';
import { TikzLexer } from '../../../src/core/parser/lexer';
import { ParserContext, createEmptyAST, ParseError } from '../../../src/core/parser/parserContext';
import { parseDrawCommand } from '../../../src/core/parser/edgeCombinator';

describe('edgeCombinator (Sprint 24: T24-07 to T24-12)', () => {
  function parseDrawSnippet(snippet: string) {
    const lexer = new TikzLexer(snippet);
    const tokens = lexer.tokenize();
    const ctx = new ParserContext(tokens);
    const ast = createEmptyAST();
    parseDrawCommand(ctx, ast);
    return ast;
  }

  it('T24-07: parses single to edge segment with source and target', () => {
    const ast = parseDrawSnippet('\\draw (a) to (b);');
    expect(ast.edges).toHaveLength(1);
    const edge = ast.edges[0];
    expect(edge.sourceId).toBe('a');
    expect(edge.targetId).toBe('b');
    expect(edge.id).toBe('e_0');
    expect(ast.paths).toEqual([]);
  });

  it('T24-08: parses chained edges (a) to (b) to (c); and records PathData', () => {
    const ast = parseDrawSnippet('\\draw (a) to (b) to (c);');
    expect(ast.edges).toHaveLength(2);
    expect(ast.edges[0].sourceId).toBe('a');
    expect(ast.edges[0].targetId).toBe('b');
    expect(ast.edges[1].sourceId).toBe('b');
    expect(ast.edges[1].targetId).toBe('c');

    expect(ast.paths).toHaveLength(1);
    expect(ast.paths![0].edges).toEqual(['e_0', 'e_1']);
    expect(ast.paths![0].isCycle).toBe(false);
  });

  it('T24-09: parses cycle paths (a) to (b) to cycle; with isCycle flag', () => {
    const ast = parseDrawSnippet('\\draw (a) to (b) to cycle;');
    expect(ast.edges).toHaveLength(2);
    expect(ast.edges[1].targetId).toBe('a');
    expect(ast.paths).toHaveLength(1);
    expect(ast.paths![0].isCycle).toBe(true);
  });

  it('T24-10: parses self-loops and empty parens ()', () => {
    const ast = parseDrawSnippet('\\draw (x) to ();');
    expect(ast.edges).toHaveLength(1);
    expect(ast.edges[0].sourceId).toBe('x');
    expect(ast.edges[0].targetId).toBe('x');
  });

  it('T24-11: extracts bend, in/out angles, and looseness curvature properties', () => {
    const astBendLeft = parseDrawSnippet('\\draw (a) to [bend left=45] (b);');
    expect(astBendLeft.edges[0].bend).toBe(-45);

    const astBendRight = parseDrawSnippet('\\draw (a) to [bend right=30] (b);');
    expect(astBendRight.edges[0].bend).toBe(30);

    const astInOut = parseDrawSnippet('\\draw (a) to [in=90, out=-90, looseness=2.5] (b);');
    expect(astInOut.edges[0].inAngle).toBe(90);
    expect(astInOut.edges[0].outAngle).toBe(-90);
    expect(astInOut.edges[0].weight).toBe(1.0);
  });

  it('T24-12: merges draw-level properties with per-segment properties', () => {
    const ast = parseDrawSnippet('\\draw [style=wire, color=blue] (a) to [color=red] (b);');
    const edge = ast.edges[0];
    expect(edge.data).toEqual([
      { key: 'color', value: 'red' },
      { key: 'style', value: 'wire' },
    ]);
  });
});
