import { describe, it, expect } from 'vitest';
import {
  emitTikz,
  emitTikzStyles,
  floatToString,
  tikzEscape,
  formatProperty,
  formatElementData,
} from '../../../src/core/parser/emitter';
import { parseTikz } from '../../../src/core/parser/parser';
import {
  setAtom,
  unsetAtom,
  setProperty,
  unsetProperty,
  type GraphAST,
  type GraphElementData,
} from '../../../src/core/domain/types';

describe('TikZ Canonical Emitter Suite', () => {
  it('escapes properties accurately according to desktop rules (escape)', () => {
    expect(tikzEscape('foo')).toBe('foo');
    expect(tikzEscape("foo'")).toBe("foo'");
    expect(tikzEscape('foo bar')).toBe('foo bar');
    expect(tikzEscape('foo.bar')).toBe('foo.bar');
    expect(tikzEscape('foo-bar')).toBe('foo-bar');
    expect(tikzEscape('foo >')).toBe('foo >');
    expect(tikzEscape('foo <')).toBe('foo <');
    expect(tikzEscape('foo+')).toBe('{foo+}');
    expect(tikzEscape('foo{bar}')).toBe('{foo{bar}}');
  });

  it('formats GraphElementData incrementally (data)', () => {
    let d: GraphElementData = [];
    expect(formatElementData(d)).toBe('');

    d = setAtom(d, 'foo');
    expect(formatElementData(d)).toBe('[foo]');

    d = setAtom(d, 'bar');
    expect(formatElementData(d)).toBe('[foo, bar]');

    d = setProperty(d, 'foo', 'bar');
    expect(formatElementData(d)).toBe('[foo, bar, foo=bar]');

    d = setAtom(d, 'foo+');
    expect(formatElementData(d)).toBe('[foo, bar, foo=bar, {foo+}]');

    d = unsetAtom(d, 'foo');
    expect(formatElementData(d)).toBe('[bar, foo=bar, {foo+}]');

    d = unsetProperty(d, 'foo');
    expect(formatElementData(d)).toBe('[bar, {foo+}]');

    d = unsetAtom(d, 'foo+');
    expect(formatElementData(d)).toBe('[bar]');

    d = unsetAtom(d, 'bar');
    expect(formatElementData(d)).toBe('');
  });

  it('emits empty graph (graphEmpty)', () => {
    const ast: GraphAST = {
      nodes: [],
      edges: [],
      paths: [],
      data: [],
    };
    const expected = '\\begin{tikzpicture}\n\\end{tikzpicture}\n';
    expect(emitTikz(ast)).toBe(expected);
  });

  it('emits graph with bounding box (graphBbox)', () => {
    const ast: GraphAST = {
      nodes: [],
      edges: [],
      paths: [],
      bbox: {
        min: { x: -0.75, y: -0.5 },
        max: { x: 0.25, y: 1 },
      },
      data: [],
    };

    const expected =
      '\\begin{tikzpicture}\n' +
      '\t\\path [use as bounding box] (-0.75,-0.5) rectangle (0.25,1);\n' +
      '\\end{tikzpicture}\n';

    expect(emitTikz(ast)).toBe(expected);
  });

  it('reproduces desktop reference golden output (graphFromTikz)', () => {
    const tikz =
      '\\begin{tikzpicture}\n' +
      '\t\\path [use as bounding box] (-1.5,-1.5) rectangle (1.5,1.5);\n' +
      '\t\\begin{pgfonlayer}{nodelayer}\n' +
      '\t\t\\node [style=white dot] (0) at (-1, -1) {};\n' +
      '\t\t\\node [style=white dot] (1) at (0, 1) {};\n' +
      '\t\t\\node [style=white dot] (2) at (1, -1) {};\n' +
      '\t\\end{pgfonlayer}\n' +
      '\t\\begin{pgfonlayer}{edgelayer}\n' +
      '\t\t\\draw [style=diredge] (1) to (2);\n' +
      '\t\t\\draw [style=diredge] (2) to (0);\n' +
      '\t\t\\draw [style=diredge, loop] (0) to ();\n' +
      '\t\\end{pgfonlayer}\n' +
      '\\end{tikzpicture}\n';

    const ast = parseTikz(tikz);
    const emitted = emitTikz(ast);
    expect(emitted).toBe(tikz);
  });

  it('formats float numbers cleanly with floatToString', () => {
    expect(floatToString(0)).toBe('0');
    expect(floatToString(0.0000000001)).toBe('0');
    expect(floatToString(1)).toBe('1');
    expect(floatToString(1.0)).toBe('1');
    expect(floatToString(-2.5)).toBe('-2.5');
    expect(floatToString(3.14159)).toBe('3.14159');
  });

  it('emits tikzstyles file catalog (emitTikzStyles)', () => {
    const catalog = {
      styles: [
        { name: 'wire', data: [{ key: '-' }, { key: 'draw', value: 'black' }], properties: [{ key: '-' }, { key: 'draw', value: 'black' }] },
        { name: 'Z', data: [{ key: 'shape', value: 'circle' }, { key: 'fill', value: 'green' }], properties: [{ key: 'shape', value: 'circle' }, { key: 'fill', value: 'green' }] },
      ],
    };
    const emitted = emitTikzStyles(catalog);
    expect(emitted).toBe(
      '\\tikzstyle{wire}=[-, draw=black]\n' +
      '\\tikzstyle{Z}=[shape=circle, fill=green]\n'
    );
  });
});
