/**
 * tests/unit/parser/combinatorArchitecture.test.ts - Sprint 24
 * Tests T24-13 to T24-22: combinators, parserContext, safeParse, and AST isomorphism.
 */
import { describe, it, expect } from 'vitest';
import { TikzLexer } from '../../../src/core/parser/lexer';
import { ParserContext, createEmptyAST, ParseError } from '../../../src/core/parser/parserContext';
import { parsePathCommand } from '../../../src/core/parser/pathCombinator';
import { parseStylesCatalog } from '../../../src/core/parser/styleCombinator';
import { extractCurvatureProperties } from '../../../src/core/parser/propertyCombinator';
import { TikzParser, parseSafe, safeParse, parseTikz, parseTikzStyles } from '../../../src/core/parser/parser';
import { emitTikz } from '../../../src/core/parser/emitter';

describe('combinatorArchitecture (Sprint 24: T24-13 to T24-22)', () => {
  it('T24-13: pathCombinator extracts bounding box min and max Point2D coordinates', () => {
    const lexer = new TikzLexer('\\path [use as bounding box] (-2, -3) rectangle (4, 5);');
    const ctx = new ParserContext(lexer.tokenize());
    const ast = createEmptyAST();
    parsePathCommand(ctx, ast);

    expect(ast.bbox).toEqual({
      min: { x: -2, y: -3 },
      max: { x: 4, y: 5 },
    });
  });

  it('T24-14: styleCombinator parses .tikzstyles entries with equals and bracketed data', () => {
    const stylesSnippet = '\\tikzstyle{Z}=[fill=green, circle];\n\\tikzstyle{X}=[fill=red, circle];';
    const lexer = new TikzLexer(stylesSnippet);
    const ctx = new ParserContext(lexer.tokenize());
    const catalog = parseStylesCatalog(ctx);

    expect(catalog.styles).toHaveLength(2);
    expect(catalog.styles[0].name).toBe('Z');
    expect(catalog.styles[0].data).toEqual([
      { key: 'fill', value: 'green' },
      { key: 'circle' },
    ]);
    expect(catalog.styles[1].name).toBe('X');
  });

  it('T24-15: parserContext peek, advance, match, and consume behaviors', () => {
    const lexer = new TikzLexer('; ;');
    const ctx = new ParserContext(lexer.tokenize());

    expect(ctx.match('SEMICOLON')).toBe(true);
    const token1 = ctx.consume('SEMICOLON');
    expect(token1.type).toBe('SEMICOLON');

    expect(ctx.match('SEMICOLON')).toBe(true);
    const token2 = ctx.advance();
    expect(token2.type).toBe('SEMICOLON');

    expect(ctx.peek().type).toBe('EOF');
  });

  it('T24-16: parserContext throws ParseError with line and column numbers', () => {
    const lexer = new TikzLexer('\n  ;');
    const ctx = new ParserContext(lexer.tokenize());

    expect(() => ctx.consume('BEGIN_TIKZPICTURE')).toThrowError(ParseError);
    try {
      ctx.consume('BEGIN_TIKZPICTURE');
    } catch (err: any) {
      expect(err.line).toBe(2);
      expect(err.column).toBe(3);
      expect(err.message).toContain('Expected token');
    }
  });

  it('T24-17: TikzParser parses full picture with pgfonlayer layers', () => {
    const fullTikz = `\\begin{tikzpicture}
\\begin{pgfonlayer}{nodelayer}
\\node (a) at (0, 0) {A};
\\end{pgfonlayer}
\\begin{pgfonlayer}{edgelayer}
\\draw (a) to (a);
\\end{pgfonlayer}
\\end{tikzpicture}`;

    const ast = parseTikz(fullTikz);
    expect(ast.nodes).toHaveLength(1);
    expect(ast.edges).toHaveLength(1);
    expect(ast.nodes[0].name).toBe('a');
  });

  it('T24-18: parseSafe captures syntax errors and returns partial AST without throwing', () => {
    const brokenTikz = `\\begin{tikzpicture}
\\node (valid) at (0, 0) {OK};
\\node (invalid) ;
\\end{tikzpicture}`;

    const res = parseSafe(brokenTikz);
    expect(res.success).toBe(false);
    expect(res.ast).toBeNull();
    expect(res.errors.length).toBeGreaterThan(0);
    expect(res.partialAST?.nodes).toHaveLength(1);
    expect(res.partialAST?.nodes[0]?.name).toBe('valid');
  });

  it('T24-19: safeParse aliases parseSafe', () => {
    expect(safeParse).toBe(parseSafe);
    const res = safeParse('\\begin{tikzpicture}\\end{tikzpicture}');
    expect(res.success).toBe(true);
    expect(res.ast?.nodes).toEqual([]);
  });

  it('T24-20: propertyCombinator computes signed bend left (-30) and bend right (+30)', () => {
    const bendLeftDefault = extractCurvatureProperties([{ key: 'bend left' }]);
    expect(bendLeftDefault.bend).toBe(-30);

    const bendLeftCustom = extractCurvatureProperties([{ key: 'bend left', value: '50' }]);
    expect(bendLeftCustom.bend).toBe(-50);

    const bendRightDefault = extractCurvatureProperties([{ key: 'bend right' }]);
    expect(bendRightDefault.bend).toBe(30);

    const bendRightCustom = extractCurvatureProperties([{ key: 'bend right', value: '45' }]);
    expect(bendRightCustom.bend).toBe(45);
  });

  it('T24-21: propertyCombinator computes weight from looseness', () => {
    const looseness = extractCurvatureProperties([{ key: 'looseness', value: '5.0' }]);
    expect(looseness.weight).toBe(2.0);

    const invalid = extractCurvatureProperties([{ key: 'looseness', value: 'not-a-number' }]);
    expect(invalid.weight).toBeUndefined();
  });

  it('T24-22: AST round-trip preserves all graph data, nodes, and edges', () => {
    const source = `\\begin{tikzpicture}[baseline=0]
\\begin{pgfonlayer}{nodelayer}
\\node [style=none] (a) at (-1, 0) {IN};
\\node [style=none] (b) at (1, 0) {OUT};
\\end{pgfonlayer}
\\begin{pgfonlayer}{edgelayer}
\\draw [style=wire] (a) to [bend left=30] (b);
\\end{pgfonlayer}
\\end{tikzpicture}\n`;

    const ast1 = parseTikz(source);
    const emitted = emitTikz(ast1);
    const ast2 = parseTikz(emitted);

    expect(ast2.nodes.length).toBe(ast1.nodes.length);
    expect(ast2.edges.length).toBe(ast1.edges.length);
    expect(ast2.edges[0].bend).toBe(ast1.edges[0].bend);
    expect(ast2.nodes.map((n) => n.id)).toEqual(ast1.nodes.map((n) => n.id));
  });
});
