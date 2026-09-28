import { describe, it, expect } from 'vitest';
import { parseTikzStyles } from '../../../src/core/parser/parser';
import { emitTikzStyles } from '../../../src/core/parser/emitter';
import {
  parsePGFColor,
  toPGFColor,
  getStyleCategory,
  setStyleCategory,
  isEdgeStyle,
  getStyleShape,
  getStyleFillColor,
  getStyleStrokeColor,
  isStyleDashed,
  isStyleDotted,
  createStyle,
  cloneStyle,
  EDGE_ARROW_ATOMS,
} from '../../../src/core/styles/TikzStyleModel';
import type { TikzStyle } from '../../../src/core/domain/types';

describe('TikZ Stylesheet Parser & PGF Color Model (5.1)', () => {
  it('parses basic \\tikzstyle statements matching desktop TikZiT grammar', () => {
    const source = `
      \\tikzstyle{Z}=[fill={rgb,255: red,90; green,210; blue,90}, shape=circle, draw=black, tikzit category=Spiders]
      \\tikzstyle{wire}=[-]
      \\tikzstyle{dashed wire}=[-, dashed]
    `;

    const catalog = parseTikzStyles(source);
    expect(catalog.styles).toHaveLength(3);

    const z = catalog.styles[0];
    expect(z.name).toBe('Z');
    expect(getStyleCategory(z)).toBe('Spiders');
    expect(getStyleShape(z)).toBe('circle');
    expect(getStyleStrokeColor(z)).toBe('#000000');
    expect(getStyleFillColor(z)).toBe('#5ad25a');
    expect(isEdgeStyle(z)).toBe(false);

    const wire = catalog.styles[1];
    expect(wire.name).toBe('wire');
    expect(isEdgeStyle(wire)).toBe(true);
    expect(isStyleDashed(wire)).toBe(false);

    const dashedWire = catalog.styles[2];
    expect(dashedWire.name).toBe('dashed wire');
    expect(isEdgeStyle(dashedWire)).toBe(true);
    expect(isStyleDashed(dashedWire)).toBe(true);
  });

  describe('PGF RGB Color Serialization Mathematics', () => {
    it('converts PGF extended RGB syntax {rgb,255: red,R; green,G; blue,B} to standard hex', () => {
      // PQP green: red,90; green,210; blue,90 -> #5ad25a
      expect(parsePGFColor('{rgb,255: red,90; green,210; blue,90}')).toBe('#5ad25a');
      // PQP red: red,235; green,75; blue,75 -> #eb4b4b
      expect(parsePGFColor('{rgb,255: red,235; green,75; blue,75}')).toBe('#eb4b4b');
      // Pure white & black
      expect(parsePGFColor('{rgb,255: red,255; green,255; blue,255}')).toBe('#ffffff');
      expect(parsePGFColor('{rgb,255: red,0; green,0; blue,0}')).toBe('#000000');
      // Format without braces
      expect(parsePGFColor('rgb,255: red,10; green,20; blue,30')).toBe('#0a141e');
    });

    it('converts hex to PGF extended RGB string format', () => {
      expect(toPGFColor('#5ad25a')).toBe('{rgb,255: red,90; green,210; blue,90}');
      expect(toPGFColor('#eb4b4b')).toBe('{rgb,255: red,235; green,75; blue,75}');
      expect(toPGFColor('#ffffff')).toBe('{rgb,255: red,255; green,255; blue,255}');
      expect(toPGFColor('#000000')).toBe('{rgb,255: red,0; green,0; blue,0}');
      expect(toPGFColor('none')).toBe('none');
      expect(toPGFColor('transparent')).toBe('none');
    });

    it('maps named LaTeX colors to standard values', () => {
      expect(parsePGFColor('red')).toBe('#eb4b4b');
      expect(parsePGFColor('green')).toBe('#5ad25a');
      expect(parsePGFColor('blue')).toBe('#3b82f6');
      expect(parsePGFColor('black')).toBe('#000000');
      expect(parsePGFColor('white')).toBe('#ffffff');
      expect(parsePGFColor('teal')).toBe('#0d9488');
      expect(parsePGFColor('none')).toBe('transparent');
      expect(parsePGFColor('transparent')).toBe('transparent');
    });
  });

  describe('Category Extraction & Desktop Semantics', () => {
    it('extracts category from "tikzit category" property and defaults to "Uncategorized"', () => {
      const s1: TikzStyle = {
        name: 'test1',
        data: [{ key: 'tikzit category', value: 'Quantum Gates' }],
      };
      expect(getStyleCategory(s1)).toBe('Quantum Gates');

      const s2: TikzStyle = {
        name: 'test2',
        data: [{ key: 'fill', value: 'red' }],
      };
      expect(getStyleCategory(s2)).toBe('Uncategorized');

      // Modifying category
      setStyleCategory(s2, 'Circuits');
      expect(getStyleCategory(s2)).toBe('Circuits');
    });

    it('comments are not treated as category metadata', () => {
      const source = `
        % Category: Quantum
        \\tikzstyle{Z}=[fill=green]
      `;
      const catalog = parseTikzStyles(source);
      expect(catalog.styles).toHaveLength(1);
      expect(getStyleCategory(catalog.styles[0])).toBe('Uncategorized');
    });
  });

  describe('Edge Style Classification Parity with Desktop Style::isEdgeStyle()', () => {
    it('recognizes styles containing any valid arrow atom as edge styles', () => {
      for (const atom of EDGE_ARROW_ATOMS) {
        const style: TikzStyle = {
          name: `edge-atom-${atom}`,
          data: [{ key: atom }],
        };
        expect(isEdgeStyle(style)).toBe(true);
      }
    });

    it('dashed alone does NOT make a style an edge style (crucial desktop parity rule)', () => {
      const style: TikzStyle = {
        name: 'dashed box',
        data: [{ key: 'dashed' }, { key: 'draw', value: 'black' }],
      };
      expect(isEdgeStyle(style)).toBe(false);
      expect(isStyleDashed(style)).toBe(true);
    });

    it('edge style with arrow and dashed is recognized correctly', () => {
      const style: TikzStyle = {
        name: 'dashed arrow',
        data: [{ key: '->' }, { key: 'dashed' }],
      };
      expect(isEdgeStyle(style)).toBe(true);
      expect(isStyleDashed(style)).toBe(true);
    });
  });

  describe('Round-trip Serialization', () => {
    it('serializes catalog to TikZ stylesheet string and parses back identically', () => {
      const original = {
        styles: [
          createStyle('Z', [{ key: 'fill', value: 'green' }, { key: 'shape', value: 'circle' }], 'Spiders'),
          createStyle('wire', [{ key: '-' }], 'Wires'),
        ],
      };

      const emitted = emitTikzStyles(original);
      const parsed = parseTikzStyles(emitted);

      expect(parsed.styles).toHaveLength(2);
      expect(parsed.styles[0].name).toBe('Z');
      expect(getStyleCategory(parsed.styles[0])).toBe('Spiders');
      expect(parsed.styles[1].name).toBe('wire');
      expect(isEdgeStyle(parsed.styles[1])).toBe(true);
    });
  });
});
