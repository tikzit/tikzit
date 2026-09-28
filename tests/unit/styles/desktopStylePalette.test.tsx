import { describe, it, expect, vi } from 'vitest';
import React from 'react';
import { renderToString } from 'react-dom/server';
import { atom, map } from 'nanostores';
import { DesktopStyleActionBar } from '../../../src/components/styles/DesktopStyleActionBar';
import { CategorySelect } from '../../../src/components/styles/CategorySelect';
import { DesktopSwatchGrid } from '../../../src/components/styles/DesktopSwatchGrid';
import { StylePalette } from '../../../src/components/styles/StylePalette';
import type { TikzStylesCatalog, TikzStyle } from '../../../src/core/domain/types';

describe('Sprint 11: Desktop Style Palette & Action Bar', () => {
  const sampleStyles: TikzStyle[] = [
    { name: 'Z', category: 'ZX-Calculus', data: [{ key: 'fill', value: 'green' }] } as any,
    { name: 'X', category: 'ZX-Calculus', data: [{ key: 'fill', value: 'red' }] } as any,
    { name: 'H', category: 'Operators', data: [{ key: 'shape', value: 'rectangle' }] } as any,
    { name: 'diredge', category: 'Wires', data: [{ key: '->' }] } as any,
    { name: 'dashed wire', category: 'Wires', data: [{ key: 'dashed' }] } as any,
  ];

  describe('11.1: Desktop Style Action Bar', () => {
    it('renders 4 toolbar action buttons and stylesheet file label', () => {
      const html = renderToString(
        <DesktopStyleActionBar
          styleFileName="pqp-zx.tikzstyles"
          hasStyles={true}
          onNew={() => {}}
          onOpen={() => {}}
          onEdit={() => {}}
          onRefresh={() => {}}
        />
      );

      expect(html).toContain('data-testid="desktop-style-action-bar"');
      expect(html).toContain('pqp-zx.tikzstyles');
      expect(html).toContain('data-testid="style-action-new"');
      expect(html).toContain('data-testid="style-action-open"');
      expect(html).toContain('data-testid="style-action-edit"');
      expect(html).toContain('data-testid="style-action-refresh"');
      expect(html).toContain('id="open-style-editor-btn"');
    });

    it('displays [no styles] label when stylesheet is not loaded', () => {
      const html = renderToString(
        <DesktopStyleActionBar
          styleFileName="[no styles]"
          hasStyles={false}
          onNew={() => {}}
          onOpen={() => {}}
          onEdit={() => {}}
          onRefresh={() => {}}
        />
      );

      expect(html).toContain('[no styles]');
    });
  });

  describe('11.2: Category Select Combobox', () => {
    it('populates with (all) as first entry followed by categories', () => {
      const categories = ['Operators', 'ZX-Calculus'];
      const html = renderToString(
        <CategorySelect
          categories={categories}
          selectedCategory=""
          onSelectCategory={() => {}}
        />
      );

      expect(html).toContain('data-testid="category-select"');
      expect(html).toContain('(all)</option>');
      expect(html).toContain('<option value="Operators">Operators</option>');
      expect(html).toContain('<option value="ZX-Calculus">ZX-Calculus</option>');
    });
  });

  describe('11.3: Desktop Swatch Grid (48x48)', () => {
    it('pins synthetic none style at index 0 for node swatches', () => {
      const html = renderToString(
        <DesktopSwatchGrid
          title="Node Styles"
          styles={sampleStyles.filter((s) => s.category !== 'Wires')}
          activeStyle="none"
          isEdgeSection={false}
          onSelectStyle={() => {}}
          onApplyStyle={() => {}}
        />
      );

      expect(html).toContain('Node Styles');
      expect(html).toContain('data-style-name="none"');
      expect(html).toContain('data-style-name="Z"');
      expect(html).toContain('data-style-name="X"');
      expect(html).toContain('data-style-name="H"');
    });

    it('pins synthetic none style at index 0 for edge swatches', () => {
      const html = renderToString(
        <DesktopSwatchGrid
          title="Edge Styles"
          styles={sampleStyles.filter((s) => s.category === 'Wires')}
          activeStyle="diredge"
          isEdgeSection={true}
          onSelectStyle={() => {}}
          onApplyStyle={() => {}}
        />
      );

      expect(html).toContain('Edge Styles');
      expect(html).toContain('data-style-name="none"');
      expect(html).toContain('data-style-name="diredge"');
      expect(html).toContain('data-style-name="dashed wire"');
    });
  });

  describe('11.4: Full StylePalette Integration', () => {
    it('renders complete desktop structure with split Node and Edge grids', () => {
      const catalogStore = atom<TikzStylesCatalog>({ styles: sampleStyles });
      const activeStyleStore = atom<string>('Z');
      const selectedStore = map<{ nodes: string[]; edges: string[] }>({ nodes: [], edges: [] });
      const fileStore = atom<string>('test.tikzstyles');
      const bufStore = atom<string>('');

      const html = renderToString(
        <StylePalette
          stylesCatalogStore={catalogStore}
          activeStyleStore={activeStyleStore}
          selectedElementsStore={selectedStore}
          styleFileNameStore={fileStore}
          styleFileBufferStore={bufStore}
          onApplyStyle={() => {}}
          onOpenStyleEditor={() => {}}
        />
      );

      // Header, action bar, combobox, and both split grids
      expect(html).toContain('id="style-palette-island"');
      expect(html).toContain('data-testid="desktop-style-action-bar"');
      expect(html).toContain('test.tikzstyles');
      expect(html).toContain('data-testid="category-select"');
      expect(html).toContain('Node Styles');
      expect(html).toContain('Edge Styles');

      // Contract B selector compatibility
      expect(html).toContain('data-style-name="Z"');
      expect(html).toContain('data-style-name="diredge"');
      expect(html).toContain('style-category-tab');
    });
  });
});
