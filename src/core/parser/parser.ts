/**
 * src/core/parser/parser.ts - Sprint 24
 * Pure TypeScript TikZ Recursive Descent Parser facade.
 * Coordinates combinators matching grammar rules from src/data/tikzparser.y.
 * Target: <= 120 LOC.
 */
import type {
  GraphAST,
  NodeData,
  GraphElementData,
  TikzStylesCatalog,
  ParseDiagnostic,
  SafeParseResult,
} from '../domain/types';
import { TikzLexer, type Token } from './lexer';
import { ParseError, createEmptyAST, ParserContext } from './parserContext';
import { parseNodeCommand } from './nodeCombinator';
import { parseDrawCommand } from './edgeCombinator';
import { parsePathCommand } from './pathCombinator';
import { parseStylesCatalog } from './styleCombinator';

export { ParseError, createEmptyAST, ParserContext };

export class TikzParser {
  private readonly ctx: ParserContext;
  private readonly ast: GraphAST;
  private readonly nodeMap: Map<string, NodeData> = new Map();

  constructor(tokens: Token[]) {
    this.ctx = new ParserContext(tokens);
    this.ast = createEmptyAST();
  }

  public getPartialAST(): GraphAST {
    return this.ast;
  }

  public parsePicture(): GraphAST {
    // 1. Optional leading tokens before \begin{tikzpicture}
    while (!this.ctx.match('BEGIN_TIKZPICTURE') && !this.ctx.match('EOF')) {
      this.ctx.advance();
    }

    if (this.ctx.match('EOF')) {
      throw new ParseError('Missing \\begin{tikzpicture}', 1, 1);
    }

    this.ctx.consume('BEGIN_TIKZPICTURE');

    // 2. Optional graph-level properties: \begin{tikzpicture}[...]
    if (this.ctx.match('BRACKETS')) {
      this.ast.data = this.ctx.advance().value as GraphElementData;
    }

    // 3. Command loop until \end{tikzpicture}
    while (!this.ctx.match('END_TIKZPICTURE') && !this.ctx.match('EOF')) {
      const token = this.ctx.peek();

      if (token.type === 'BEGIN_PGFONLAYER') {
        this.ctx.advance();
        if (this.ctx.match('BRACED_STRING')) {
          this.ctx.advance(); // consume layer name
        }
      } else if (token.type === 'END_PGFONLAYER') {
        this.ctx.advance();
      } else if (token.type === 'NODE_CMD') {
        parseNodeCommand(this.ctx, this.ast, this.nodeMap);
      } else if (token.type === 'DRAW_CMD') {
        parseDrawCommand(this.ctx, this.ast);
      } else if (token.type === 'PATH_CMD') {
        parsePathCommand(this.ctx, this.ast);
      } else if (token.type === 'SEMICOLON') {
        this.ctx.advance(); // stray semicolon
      } else {
        throw new ParseError(
          `Unexpected token '${token.type}' (${token.raw})`,
          token.loc.line,
          token.loc.column
        );
      }
    }

    this.ctx.consume('END_TIKZPICTURE', 'Expected \\end{tikzpicture}');
    return this.ast;
  }

  public parseStyles(): TikzStylesCatalog {
    return parseStylesCatalog(this.ctx);
  }
}

/**
 * Main parse entry point for TikZ diagram sources.
 */
export function parseTikz(source: string): GraphAST {
  const lexer = new TikzLexer(source);
  const tokens = lexer.tokenize();
  const parser = new TikzParser(tokens);
  return parser.parsePicture();
}

/**
 * Main parse entry point for .tikzstyles files.
 */
export function parseTikzStyles(source: string): TikzStylesCatalog {
  const lexer = new TikzLexer(source);
  const tokens = lexer.tokenize();
  const parser = new TikzParser(tokens);
  return parser.parseStyles();
}

/**
 * Safe parser for editor integration and browser test harness.
 */
export function parseSafe(source: string): SafeParseResult {
  const errors: ParseDiagnostic[] = [];
  let ast: GraphAST | null = null;
  let partialAST: GraphAST | null = null;

  try {
    const lexer = new TikzLexer(source);
    const tokens = lexer.tokenize();
    const parser = new TikzParser(tokens);

    try {
      ast = parser.parsePicture();
      partialAST = ast;
      return { success: true, ast, partialAST, errors: [] };
    } catch (err: any) {
      partialAST = parser.getPartialAST();
      errors.push({
        line: err.line || 1,
        column: err.column || 1,
        message: err.message || String(err),
        severity: 'error',
      });
      return { success: false, ast: null, partialAST: partialAST || createEmptyAST(), errors };
    }
  } catch (err: any) {
    errors.push({
      line: err.line || 1,
      column: err.column || 1,
      message: err.message || String(err),
      severity: 'error',
    });
    return { success: false, ast: null, partialAST: createEmptyAST(), errors };
  }
}

export const safeParse = parseSafe;
