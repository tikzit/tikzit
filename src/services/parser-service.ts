import { Context, Service } from 'cordis';
import { parseTikz, emitTikz, normalize, parseSafe } from '../core/parser';
import type { GraphAST, SafeParseResult } from '../core/domain/types';

declare module 'cordis' {
  interface Context {
    tikzParser: TikzParserService;
  }
}

/**
 * Cordis Service adapter providing reactive parse & emit capabilities.
 */
export class TikzParserService extends Service {
  constructor(ctx: Context) {
    super(ctx, 'tikzParser');
  }

  public parse(source: string): GraphAST {
    const ast = parseTikz(source);
    this.ctx.emit('tikzit:parsed' as any, ast);
    return ast;
  }

  public emit(ast: GraphAST): string {
    const tikz = emitTikz(ast);
    this.ctx.emit('tikzit:emitted' as any, tikz);
    return tikz;
  }

  public parseSafe(source: string): SafeParseResult {
    return parseSafe(source);
  }

  public normalize(ast: GraphAST): any {
    return normalize(ast);
  }
}
