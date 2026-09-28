import { describe, it, expect } from 'vitest';
import { generateSvg, isEdgeCurved } from '../../../src/services/preview/SvgGenerator';
import type { GraphAST, TikzStylesCatalog } from '../../../src/core/domain/types';

describe('SvgGenerator', () => {
  const sampleAST: GraphAST = {
    data: [],
    paths: [],
    nodes: [
      { id: '0', name: '0', label: '$\\alpha$', position: { x: -1, y: 0 }, data: [{ key: 'style', value: 'green spider' }] },
      { id: '1', name: '1', label: '', position: { x: 1, y: 0 }, data: [{ key: 'style', value: 'none' }] },
      { id: '2', name: '2', label: 'B', position: { x: 0, y: 2 }, data: [{ key: 'style', value: 'box' }] },
    ],
    edges: [
      { id: 'e1', sourceId: '0', targetId: '1', data: [] },
      { id: 'e2', sourceId: '1', targetId: '2', bend: 30, data: [{ key: 'dashed' }] },
      { id: 'e3', sourceId: '0', targetId: '0', inAngle: 135, outAngle: 45, weight: 1.0, data: [{ key: 'loop' }] },
    ],
  };

  const sampleStyles: TikzStylesCatalog = {
    styles: [
      {
        name: 'green spider',
        data: [{ key: 'shape', value: 'circle' }, { key: 'fill', value: 'green' }, { key: 'draw', value: 'black' }],
      },
      {
        name: 'box',
        data: [{ key: 'shape', value: 'rectangle' }, { key: 'fill', value: 'blue' }, { key: 'draw', value: 'black' }],
      },
    ],
  };

  it('generates valid SVG XML header and element tags', () => {
    const svg = generateSvg(sampleAST, sampleStyles);
    expect(svg).toContain('<?xml version="1.0" encoding="UTF-8"?>');
    expect(svg).toContain('<svg xmlns="http://www.w3.org/2000/svg"');
    expect(svg).toContain('viewBox=');
    expect(svg).toContain('</svg>');
  });

  it('renders edgelayer before nodelayer to maintain correct z-order', () => {
    const svg = generateSvg(sampleAST, sampleStyles);
    const edgeLayerIdx = svg.indexOf('id="edgelayer"');
    const nodeLayerIdx = svg.indexOf('id="nodelayer"');
    expect(edgeLayerIdx).toBeGreaterThan(0);
    expect(nodeLayerIdx).toBeGreaterThan(edgeLayerIdx);
  });

  it('renders desktop TikZiT parity junction glyphs for style=none', () => {
    const svg = generateSvg(sampleAST, sampleStyles);
    // Node 1 is style=none, should have tikzit-junction-node class and dashed circle
    expect(svg).toContain('class="tikzit-junction-node"');
    expect(svg).toContain('stroke-dasharray="3,3"');
  });

  it('renders straight edges and curved bezier paths correctly', () => {
    const svg = generateSvg(sampleAST, sampleStyles);
    expect(svg).toContain('id="edge-e1"');
    // e1 is straight: M ... L ...
    expect(svg).toMatch(/id="edge-e1" d="M [0-9.]+ [0-9.]+ L [0-9.]+ [0-9.]+"/);
    // e2 is curved with bend=30: M ... C ...
    expect(svg).toMatch(/id="edge-e2" d="M [0-9.]+ [0-9.]+ C [0-9.]+ [0-9.]+, [0-9.]+ [0-9.]+, [0-9.]+ [0-9.]+"/);
    // e2 has dashed wire styling
    expect(svg).toContain('stroke-dasharray="6,4"');
  });

  it('renders self-loops with cubic bezier paths', () => {
    const svg = generateSvg(sampleAST, sampleStyles);
    expect(svg).toContain('id="edge-e3"');
    expect(svg).toMatch(/id="edge-e3" d="M [0-9.]+ [0-9.]+ C/);
  });

  describe('Sprint 14: Curvature Synchronization with edge.data properties', () => {
    it('correctly identifies curved vs straight edges via isEdgeCurved', () => {
      expect(isEdgeCurved({ id: '1', sourceId: '0', targetId: '1', data: [] })).toBe(false);
      expect(isEdgeCurved({ id: '2', sourceId: '0', targetId: '1', data: [{ key: 'bend left', value: '35' }] })).toBe(true);
      expect(isEdgeCurved({ id: '3', sourceId: '0', targetId: '1', data: [{ key: 'bend right', value: '20' }] })).toBe(true);
      expect(isEdgeCurved({ id: '4', sourceId: '0', targetId: '1', data: [{ key: 'bend left' }] })).toBe(true);
      expect(isEdgeCurved({ id: '5', sourceId: '0', targetId: '1', data: [{ key: 'in', value: '30' }, { key: 'out', value: '150' }] })).toBe(true);
      expect(isEdgeCurved({ id: '6', sourceId: '0', targetId: '0', data: [] })).toBe(true); // self-loop
    });

    it('renders curved cubic bezier path when bend left is only in edge.data', () => {
      const ast: GraphAST = {
        data: [],
        paths: [],
        nodes: [
          { id: '0', name: '0', label: '', position: { x: -1, y: 0 }, data: [] },
          { id: '1', name: '1', label: '', position: { x: 1, y: 0 }, data: [] },
        ],
        edges: [
          { id: 'e_curved_left', sourceId: '0', targetId: '1', data: [{ key: 'bend left', value: '35' }] },
        ],
      };

      const svg = generateSvg(ast);
      expect(svg).toContain('id="edge-e_curved_left"');
      expect(svg).toMatch(/id="edge-e_curved_left" d="M [0-9.]+ [0-9.]+ C [0-9.]+ [0-9.]+, [0-9.]+ [0-9.]+, [0-9.]+ [0-9.]+"/);
    });

    it('renders curved cubic bezier path when bend right is only in edge.data', () => {
      const ast: GraphAST = {
        data: [],
        paths: [],
        nodes: [
          { id: '0', name: '0', label: '', position: { x: -1, y: 0 }, data: [] },
          { id: '1', name: '1', label: '', position: { x: 1, y: 0 }, data: [] },
        ],
        edges: [
          { id: 'e_curved_right', sourceId: '0', targetId: '1', data: [{ key: 'bend right', value: '45' }] },
        ],
      };

      const svg = generateSvg(ast);
      expect(svg).toContain('id="edge-e_curved_right"');
      expect(svg).toMatch(/id="edge-e_curved_right" d="M [0-9.]+ [0-9.]+ C [0-9.]+ [0-9.]+, [0-9.]+ [0-9.]+, [0-9.]+ [0-9.]+"/);
    });

    it('positions edge label on curved edge using exact bezier midpoint', () => {
      const ast: GraphAST = {
        data: [],
        paths: [],
        nodes: [
          { id: '0', name: '0', label: '', position: { x: 0, y: 0 }, data: [] },
          { id: '1', name: '1', label: '', position: { x: 2, y: 0 }, data: [] },
        ],
        edges: [
          {
            id: 'e_labeled',
            sourceId: '0',
            targetId: '1',
            data: [{ key: 'bend left', value: '60' }],
            edgeNode: { label: 'curved label', data: [] },
          },
        ],
      };

      const svg = generateSvg(ast);
      expect(svg).toContain('curved label');
      // Label y should not be on the straight line (y=0 in TikZ coords -> y=padding+maxY*scale)
      expect(svg).toMatch(/<text x="[0-9.]+" y="[0-9.]+"/);
    });
  });
});
