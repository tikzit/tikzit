/**
 * src/core/parser/styleCombinator.ts - Sprint 24
 * Combinator for TikZ style declarations (.tikzstyles files).
 * Target: <= 60 LOC.
 */
import type { GraphElementData, TikzStylesCatalog } from '../domain/types';
import type { ParserContext } from './parserContext';

export function parseStylesCatalog(ctx: ParserContext): TikzStylesCatalog {
  const catalog: TikzStylesCatalog = { styles: [] };

  while (!ctx.match('EOF')) {
    if (ctx.match('TIKZSTYLE')) {
      ctx.consume('TIKZSTYLE');

      const nameToken = ctx.consume(
        'BRACED_STRING',
        'Expected style name in braces {name}'
      );
      const name = nameToken.value;

      ctx.consume('EQUALS', 'Expected "=" after style name');

      const propsToken = ctx.consume(
        'BRACKETS',
        'Expected style properties in brackets [...]'
      );
      const properties: GraphElementData = propsToken.value;

      // Optional semicolon
      if (ctx.match('SEMICOLON')) {
        ctx.advance();
      }

      catalog.styles.push({ name, data: properties, properties });
    } else {
      // Skip any unexpected token at style top level
      ctx.advance();
    }
  }

  return catalog;
}
