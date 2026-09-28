import { describe, it, expect } from 'vitest';
import { TikzLexer, tokenizeTikz, LexerError } from '../../../src/core/parser/lexer';

describe('TikZ Lexer Suite', () => {
  it('tokenizes commands and keywords', () => {
    const input = `\\begin{tikzpicture}
\\begin{pgfonlayer}{nodelayer}
\\node (0) at (0, 0) {};
\\end{pgfonlayer}
\\begin{pgfonlayer}{edgelayer}
\\draw (0) to (1);
\\path [use as bounding box] (-1, -1) rectangle (1, 1);
\\end{pgfonlayer}
\\end{tikzpicture}`;
    const tokens = tokenizeTikz(input);
    const types = tokens.map(t => t.type);

    expect(types).toContain('BEGIN_TIKZPICTURE');
    expect(types).toContain('BEGIN_PGFONLAYER');
    expect(types).toContain('NODE_CMD');
    expect(types).toContain('AT');
    expect(types).toContain('DRAW_CMD');
    expect(types).toContain('TO');
    expect(types).toContain('PATH_CMD');
    expect(types).toContain('RECTANGLE');
    expect(types).toContain('END_PGFONLAYER');
    expect(types).toContain('END_TIKZPICTURE');
  });

  it('tokenizes balanced nested braces accurately', () => {
    const input = `\\node (0) at (0, 0) {test {with {nested}} braces};`;
    const tokens = tokenizeTikz(input);
    const labelToken = tokens.find(t => t.type === 'BRACED_STRING');
    expect(labelToken).toBeDefined();
    expect(labelToken?.value).toBe('test {with {nested}} braces');
  });

  it('tokenizes empty braces', () => {
    const input = `\\node (0) at (0, 0) {};`;
    const tokens = tokenizeTikz(input);
    const labelToken = tokens.find(t => t.type === 'BRACED_STRING');
    expect(labelToken).toBeDefined();
    expect(labelToken?.value).toBe('');
  });

  it('throws LexerError on unclosed braces', () => {
    const input = `\\node (0) at (0, 0) {unclosed;`;
    expect(() => tokenizeTikz(input)).toThrow(LexerError);
  });

  it('tokenizes positive, negative, and decimal coordinates', () => {
    const input = `(-1.5, 2.75) (0, 0) (3.14159, -0.001)`;
    const tokens = tokenizeTikz(input);
    const coords = tokens.filter(t => t.type === 'COORD');
    expect(coords).toHaveLength(3);
    expect(coords[0].value).toEqual({ x: -1.5, y: 2.75 });
    expect(coords[1].value).toEqual({ x: 0, y: 0 });
    expect(coords[2].value).toEqual({ x: 3.14159, y: -0.001 });
  });

  it('tokenizes node references with and without anchors', () => {
    const input = `(0) (v1.center) (out2.north east)`;
    const tokens = tokenizeTikz(input);
    const refs = tokens.filter(t => t.type === 'REF');
    expect(refs).toHaveLength(3);
    expect(refs[0].value).toEqual({ name: '0', anchor: undefined });
    expect(refs[1].value).toEqual({ name: 'v1', anchor: 'center' });
    expect(refs[2].value).toEqual({ name: 'out2', anchor: 'north east' });
  });

  it('tokenizes self-loop empty parens () and cycle', () => {
    const input = `() cycle`;
    const tokens = tokenizeTikz(input);
    expect(tokens[0].type).toBe('EMPTY_PARENS');
    expect(tokens[1].type).toBe('CYCLE');
  });

  it('tokenizes property brackets with atoms, key-values, and braces', () => {
    const input = `[style=Z spider, fill={rgb,255: red,90; green,210; blue,90}, bend left=30, looseness=1.2, foo, {bar++}]`;
    const tokens = tokenizeTikz(input);
    expect(tokens[0].type).toBe('BRACKETS');
    const props = tokens[0].value;
    expect(props).toEqual([
      { key: 'style', value: 'Z spider' },
      { key: 'fill', value: 'rgb,255: red,90; green,210; blue,90' },
      { key: 'bend left', value: '30' },
      { key: 'looseness', value: '1.2' },
      { key: 'foo' },
      { key: 'bar++' },
    ]);
  });

  it('ignores LaTeX comments single-line and multiline', () => {
    const input = `% Top comment
\\begin{tikzpicture} % Inline comment
% Full line comment
\\node [style=none % comment inside bracket
] (0) at (0, 0) {};
\\end{tikzpicture}`;
    const tokens = tokenizeTikz(input);
    expect(tokens.map(t => t.type)).toEqual([
      'BEGIN_TIKZPICTURE',
      'NODE_CMD',
      'BRACKETS',
      'REF',
      'AT',
      'COORD',
      'BRACED_STRING',
      'SEMICOLON',
      'END_TIKZPICTURE',
      'EOF',
    ]);
  });

  it('tokenizes \\tikzstyle declarations', () => {
    const input = `\\tikzstyle{wire}=[-, draw=black, line width=0.85pt]`;
    const tokens = tokenizeTikz(input);
    expect(tokens[0].type).toBe('TIKZSTYLE');
    expect(tokens[1].type).toBe('BRACED_STRING');
    expect(tokens[1].value).toBe('wire');
    expect(tokens[2].type).toBe('EQUALS');
    expect(tokens[3].type).toBe('BRACKETS');
  });
});
