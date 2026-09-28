/**
 * src/core/parser/parserContext.ts - Sprint 24
 * Token stream navigation and parse error management for recursive descent parser.
 * Target: <= 80 LOC.
 */
import type { GraphAST } from '../domain/types';
import type { Token, TokenType } from './lexer';

export class ParseError extends Error {
  public line: number;
  public column: number;

  constructor(message: string, line: number, column: number) {
    super(`[Parse error at line ${line}, col ${column}]: ${message}`);
    this.name = 'ParseError';
    this.line = line;
    this.column = column;
  }
}

export function createEmptyAST(): GraphAST {
  return {
    nodes: [],
    edges: [],
    paths: [],
    data: [],
  };
}

export class ParserContext {
  private pos = 0;

  constructor(public readonly tokens: Token[]) {}

  peek(): Token {
    if (this.pos < this.tokens.length) {
      return this.tokens[this.pos];
    }
    const last = this.tokens[this.tokens.length - 1];
    return {
      type: 'EOF',
      value: null,
      raw: '',
      loc: last ? { ...last.loc } : { line: 1, column: 1 },
    };
  }

  advance(): Token {
    const t = this.peek();
    if (this.pos < this.tokens.length) {
      this.pos++;
    }
    return t;
  }

  match(type: TokenType): boolean {
    return this.peek().type === type;
  }

  consume(type: TokenType, errMsg?: string): Token {
    const t = this.peek();
    if (t.type === type) {
      return this.advance();
    }
    throw new ParseError(
      errMsg || `Expected token '${type}', found '${t.type}' (${t.raw})`,
      t.loc.line,
      t.loc.column
    );
  }
}
