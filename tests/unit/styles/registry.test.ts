import { describe, it, expect, beforeEach } from 'vitest';
import { ZX_PRESETS } from '../../../src/core/styles/presets/zxPresets';
import {
  getStyleCategory,
  setStyleCategory,
  createStyle,
  cloneStyle,
  isEdgeStyle,
} from '../../../src/core/styles/TikzStyleModel';
import { createWorkbenchRuntime, type WorkbenchRuntime } from '../../../src/services/createWorkbenchRuntime';
import type { TikzStyle, GraphAST } from '../../../src/core/domain/types';

describe('Style Registry, Presets & Cordis StyleService (5.2)', () => {
  it('bundles ZX-calculus presets with correct desktop semantics', () => {
    expect(ZX_PRESETS.length).toBeGreaterThanOrEqual(6);

    const z = ZX_PRESETS.find((s: TikzStyle) => s.name === 'Z');
    expect(z).toBeDefined();
    expect(getStyleCategory(z!)).toBe('Spiders');
    expect(isEdgeStyle(z!)).toBe(false);

    const x = ZX_PRESETS.find((s: TikzStyle) => s.name === 'X');
    expect(x).toBeDefined();
    expect(getStyleCategory(x!)).toBe('Spiders');
    expect(isEdgeStyle(x!)).toBe(false);

    const wire = ZX_PRESETS.find((s: TikzStyle) => s.name === 'wire');
    expect(wire).toBeDefined();
    expect(getStyleCategory(wire!)).toBe('Wires');
    expect(isEdgeStyle(wire!)).toBe(true);

    const dashedWire = ZX_PRESETS.find((s: TikzStyle) => s.name === 'dashed wire');
    expect(dashedWire).toBeDefined();
    expect(getStyleCategory(dashedWire!)).toBe('Wires');
    expect(isEdgeStyle(dashedWire!)).toBe(true);
  });

  it('supports style cloning and renaming without mutating original', () => {
    const original = createStyle(
      'CustomNode',
      [{ key: 'fill', value: 'red' }, { key: 'shape', value: 'rectangle' }],
      'MyCategory'
    );

    const cloned = cloneStyle(original, 'CustomNodeCopy');
    expect(cloned.name).toBe('CustomNodeCopy');
    expect(getStyleCategory(cloned)).toBe('MyCategory');

    // Mutate copy
    setStyleCategory(cloned, 'NewCategory');
    expect(getStyleCategory(cloned)).toBe('NewCategory');
    expect(getStyleCategory(original)).toBe('MyCategory');
  });

  describe('Cordis StyleService Lifecycle & Nanostores Integration', () => {
    let runtime: WorkbenchRuntime;

    beforeEach(() => {
      runtime = createWorkbenchRuntime();
    });

    it('initializes with catalog and exposes styleService methods', () => {
      expect(runtime.ctx.styles).toBeDefined();
      const catalog = runtime.ctx.styles.getCatalog();
      expect(catalog.styles.length).toBeGreaterThan(0);
      expect(runtime.stores.$stylesCatalog.get().styles.length).toBe(catalog.styles.length);
    });

    it('adds new custom style and notifies nanostores bridge', () => {
      const newStyle = createStyle(
        'Custom Blue',
        [{ key: 'fill', value: '#3b82f6' }],
        'Custom'
      );

      runtime.ctx.styles.addStyle(newStyle);

      const catalog = runtime.ctx.styles.getCatalog();
      const found = catalog.styles.find((s: TikzStyle) => s.name === 'Custom Blue');
      expect(found).toBeDefined();
      expect(runtime.stores.$stylesCatalog.get().styles.find((s: TikzStyle) => s.name === 'Custom Blue')).toBeDefined();
    });

    it('removes style from catalog', () => {
      const tempStyle = createStyle('TempStyle', [], 'Temp');
      runtime.ctx.styles.addStyle(tempStyle);
      expect(runtime.ctx.styles.getCatalog().styles.find((s: TikzStyle) => s.name === 'TempStyle')).toBeDefined();

      runtime.ctx.styles.removeStyle('TempStyle');
      expect(runtime.ctx.styles.getCatalog().styles.find((s: TikzStyle) => s.name === 'TempStyle')).toBeUndefined();
    });

    it('applies style to nodes in AST via ApplyStyleToNodesCommand', () => {
      const initialAst: GraphAST = {
        nodes: [
          { id: '0', name: '0', label: '', position: { x: 0, y: 0 }, data: [] },
          { id: '1', name: '1', label: '', position: { x: 1, y: 0 }, data: [] },
        ],
        edges: [],
        paths: [],
        data: [],
      };

      runtime.ctx.graph.setAST(initialAst);

      // Apply Z style to node 0
      runtime.ctx.styles.applyStyleToNodes(['0'], 'Z');

      const updated = runtime.ctx.graph.ast;
      const node0 = updated.nodes.find((n) => n.id === '0');
      const styleProp = node0?.data.find((p) => p.key === 'style');
      expect(styleProp?.value).toBe('Z');
    });

    it('applies style to edges in AST via ApplyStyleToEdgesCommand', () => {
      const initialAst: GraphAST = {
        nodes: [
          { id: '0', name: '0', label: '', position: { x: 0, y: 0 }, data: [] },
          { id: '1', name: '1', label: '', position: { x: 1, y: 0 }, data: [] },
        ],
        edges: [
          { id: 'e0', sourceId: '0', targetId: '1', data: [] },
        ],
        paths: [],
        data: [],
      };

      runtime.ctx.graph.setAST(initialAst);

      runtime.ctx.styles.applyStyleToEdges(['e0'], 'dashed wire');

      const updated = runtime.ctx.graph.ast;
      const edge0 = updated.edges[0];
      const styleProp = edge0?.data.find((p) => p.key === 'style');
      expect(styleProp?.value).toBe('dashed wire');
    });
  });
});
