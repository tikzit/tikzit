/**
 * tests/unit/parser/nodeCombinator.test.ts - Sprint 24
 * Tests T24-01 to T24-06: nodeCombinator parsing of TikZ node definitions.
 */
import { describe, it, expect } from 'vitest';
import { TikzLexer } from '../../../src/core/parser/lexer';
import { ParserContext, createEmptyAST, ParseError } from '../../../src/core/parser/parserContext';
import { parseNodeCommand } from '../../../src/core/parser/nodeCombinator';
import type { NodeData } from '../../../src/core/domain/types';

describe('nodeCombinator (Sprint 24: T24-01 to T24-06)', () => {
  function parseNodeSnippet(snippet: string) {
    const lexer = new TikzLexer(snippet);
    const tokens = lexer.tokenize();
    const ctx = new ParserContext(tokens);
    const ast = createEmptyAST();
    const nodeMap = new Map<string, NodeData>();
    parseNodeCommand(ctx, ast, nodeMap);
    return { ast, nodeMap };
  }

  it('T24-01: parses simple node definition without properties', () => {
    const { ast, nodeMap } = parseNodeSnippet('\\node (n0) at (0, 0) {A};');
    expect(ast.nodes).toHaveLength(1);
    const node = ast.nodes[0];
    expect(node.id).toBe('n0');
    expect(node.name).toBe('n0');
    expect(node.label).toBe('A');
    expect(node.position).toEqual({ x: 0, y: 0 });
    expect(node.data).toEqual([]);
    expect(nodeMap.get('n0')).toBe(node);
  });

  it('T24-02: parses node with bracketed properties (style, fill, none)', () => {
    const { ast } = parseNodeSnippet('\\node [style=none, fill=red] (n1) at (1.5, 2.5) {};');
    expect(ast.nodes).toHaveLength(1);
    const node = ast.nodes[0];
    expect(node.id).toBe('n1');
    expect(node.label).toBe('');
    expect(node.position).toEqual({ x: 1.5, y: 2.5 });
    expect(node.data).toEqual([
      { key: 'style', value: 'none' },
      { key: 'fill', value: 'red' },
    ]);
  });

  it('T24-03: parses negative coordinates and decimal coordinates', () => {
    const { ast } = parseNodeSnippet('\\node (neg) at (-3.75, -4.2) {$-1$};');
    const node = ast.nodes[0];
    expect(node.position).toEqual({ x: -3.75, y: -4.2 });
    expect(node.label).toBe('$-1$');
  });

  it('T24-04: parses text labels with spaces, math mode, and empty braces', () => {
    const { ast } = parseNodeSnippet('\\node (lbl) at (0, 1) {Hello World $\\alpha + \\beta$};');
    expect(ast.nodes[0].label).toBe('Hello World $\\alpha + \\beta$');
  });

  it('T24-05: registers node in nodeMap and populates ast.nodes with line numbers', () => {
    const { ast, nodeMap } = parseNodeSnippet('\n\n\\node (line3) at (0, 0) {X};');
    expect(ast.nodes[0].line).toBe(3);
    expect(nodeMap.has('line3')).toBe(true);
  });

  it('T24-06: throws ParseError when missing semicolon, at, or coordinates', () => {
    expect(() => parseNodeSnippet('\\node (n) (0,0) {};')).toThrow(ParseError);
    expect(() => parseNodeSnippet('\\node (n) at (0,0) {}')).toThrow(ParseError);
    expect(() => parseNodeSnippet('\\node at (0,0) {};')).toThrow(ParseError);
  });
});
