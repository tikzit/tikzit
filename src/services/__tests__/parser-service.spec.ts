import { describe, it, expect } from 'vitest';
import { Context } from 'cordis';
import { TikzParserService } from '../parser-service';

describe('TikzParserService (Cordis Adapter)', () => {
  it('registers parser service in Cordis context and emits reactive events', () => {
    const ctx = new Context();
    new TikzParserService(ctx);

    expect(ctx.tikzParser).toBeDefined();

    let parsedPayload: any = null;
    ctx.on('tikzit:parsed' as any, (ast) => {
      parsedPayload = ast;
    });

    const input = '\\begin{tikzpicture}\\node (0) at (0,0) {x};\\end{tikzpicture}';
    const ast = ctx.tikzParser.parse(input);

    expect(ast.nodes).toHaveLength(1);
    expect(parsedPayload).toBe(ast);

    const emitted = ctx.tikzParser.emit(ast);
    expect(emitted).toContain('\\node (0) at (0, 0) {x};');
  });
});
