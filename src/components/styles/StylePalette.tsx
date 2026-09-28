import React, { useState } from 'react';
import { useStore } from '@nanostores/react';
import type { TikzStyle } from '../../core/domain/types';
import {
  getStyleCategory,
  isEdgeStyle,
} from '../../core/styles/TikzStyleModel';
import { parseTikzStyles } from '../../core/parser/parser';
import { DesktopStyleActionBar } from './DesktopStyleActionBar';
import { CategorySelect } from './CategorySelect';
import { DesktopSwatchGrid } from './DesktopSwatchGrid';
import { $styleFileName, $styleFileBuffer } from '../../stores/workbench';

export interface StylePaletteProps {
  stylesCatalogStore: any;
  activeStyleStore: any;
  selectedElementsStore: any;
  styleFileNameStore?: any;
  styleFileBufferStore?: any;
  onApplyStyle: (styleName: string) => void;
  onOpenStyleEditor: () => void;
}

export const StylePalette: React.FC<StylePaletteProps> = ({
  stylesCatalogStore,
  activeStyleStore,
  selectedElementsStore,
  styleFileNameStore,
  styleFileBufferStore,
  onApplyStyle,
  onOpenStyleEditor,
}) => {
  const catalog = useStore(stylesCatalogStore);
  const activeStyle = useStore(activeStyleStore);
  const selected = useStore(selectedElementsStore);

  const fileNameStore = styleFileNameStore ?? $styleFileName;
  const bufferStore = styleFileBufferStore ?? $styleFileBuffer;
  const styleFileName = useStore(fileNameStore);
  const styleFileBuffer = useStore(bufferStore);

  const allStyles: TikzStyle[] = catalog?.styles || [];

  // Desktop TikZiT Parity: Split into Node styles and Edge styles
  const nodeStyles = allStyles.filter((s) => !isEdgeStyle(s));
  const edgeStyles = allStyles.filter((s) => isEdgeStyle(s));

  // Desktop TikZiT Parity (tikzstyles.cpp:141-152):
  // Categories are extracted from node styles only and sorted alphabetically
  const nodeCategories = Array.from(
    new Set(nodeStyles.map((s) => getStyleCategory(s)).filter((c) => Boolean(c) && c !== 'Uncategorized'))
  ).sort();

  const [selectedCategory, setSelectedCategory] = useState<string>('');

  // Filter node styles only (stylepalette.cpp:233-238)
  const filteredNodeStyles =
    selectedCategory === ''
      ? nodeStyles
      : nodeStyles.filter((s) => getStyleCategory(s) === selectedCategory);

  // Single-click selects active style (and applies if canvas element is selected for Contract B)
  const handleSelect = (styleName: string) => {
    activeStyleStore.set(styleName);
    const hasSelection = (selected?.nodes?.length || 0) > 0 || (selected?.edges?.length || 0) > 0;
    if (hasSelection) {
      onApplyStyle(styleName);
    }
  };

  // Double-click unconditionally applies active style to canvas selection
  const handleApply = (styleName: string) => {
    activeStyleStore.set(styleName);
    onApplyStyle(styleName);
  };

  const handleNew = () => {
    stylesCatalogStore.set({ styles: [] });
    fileNameStore.set('[no styles]');
    bufferStore.set('');
  };

  const handleOpen = (fileName: string, content: string) => {
    try {
      const parsedCatalog = parseTikzStyles(content);
      stylesCatalogStore.set(parsedCatalog);
      fileNameStore.set(fileName);
      bufferStore.set(content);
    } catch (err: any) {
      alert('Failed to parse .tikzstyles: ' + err.message);
    }
  };

  const handleRefresh = () => {
    const buf = bufferStore.get();
    if (buf && buf.trim().length > 0) {
      try {
        const parsedCatalog = parseTikzStyles(buf);
        stylesCatalogStore.set(parsedCatalog);
      } catch (err: any) {
        alert('Failed to refresh .tikzstyles: ' + err.message);
      }
    } else {
      alert('No loaded stylesheet to refresh.');
    }
  };

  return (
    <div id="style-palette-island" className="flex flex-col h-full bg-[#181818] text-xs text-slate-300 overflow-hidden">
      {/* 4-Icon Action Bar with File Label */}
      <DesktopStyleActionBar
        styleFileName={styleFileName}
        hasStyles={allStyles.length > 0}
        onNew={handleNew}
        onOpen={handleOpen}
        onEdit={onOpenStyleEditor}
        onRefresh={handleRefresh}
      />

      {/* Full-width Category Dropdown (Node Styles only) */}
      <CategorySelect
        categories={nodeCategories}
        selectedCategory={selectedCategory}
        onSelectCategory={setSelectedCategory}
      />

      {/* Category Tabs for Quick Filtering & Contract B Compatibility */}
      <div className="flex items-center space-x-1 px-2 py-1 overflow-x-auto border-b border-[#2e2e2e] scrollbar-thin">
        <button
          type="button"
          onClick={() => setSelectedCategory('')}
          className={`style-category-tab px-2 py-0.5 rounded text-[10px] font-medium whitespace-nowrap transition-colors ${
            selectedCategory === ''
              ? 'bg-blue-600 text-white'
              : 'bg-[#252525] hover:bg-[#303030] text-slate-400'
          }`}
        >
          All
        </button>
        {nodeCategories.map((cat) => (
          <button
            key={cat}
            type="button"
            onClick={() => setSelectedCategory(cat)}
            className={`style-category-tab px-2 py-0.5 rounded text-[10px] font-medium whitespace-nowrap transition-colors ${
              selectedCategory === cat
                ? 'bg-blue-600 text-white'
                : 'bg-[#252525] hover:bg-[#303030] text-slate-400'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Split Icon-Mode Swatch Grids (Node Styles top, Edge Styles bottom) */}
      <div className="flex-1 overflow-y-auto divide-y divide-[#2a2a2a]">
        <DesktopSwatchGrid
          title="Node Styles"
          styles={filteredNodeStyles}
          activeStyle={activeStyle}
          isEdgeSection={false}
          onSelectStyle={handleSelect}
          onApplyStyle={handleApply}
        />

        <DesktopSwatchGrid
          title="Edge Styles"
          styles={edgeStyles}
          activeStyle={activeStyle}
          isEdgeSection={true}
          onSelectStyle={handleSelect}
          onApplyStyle={handleApply}
        />
      </div>
    </div>
  );
};
