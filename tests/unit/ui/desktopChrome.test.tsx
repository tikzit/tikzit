import { describe, it, expect, vi } from 'vitest';
import React from 'react';
import { renderToString } from 'react-dom/server';
import fs from 'fs';
import path from 'path';

import {
  SelectToolIcon,
  VertexToolIcon,
  EdgeToolIcon,
  CropToolIcon,
  NewDocumentIcon,
  OpenDocumentIcon,
  EditDocumentIcon,
  RefreshIcon,
  TikzitLogoIcon,
} from '../../../src/components/common/TikzitIcons';
import { DesktopToolPalette } from '../../../src/components/workbench/DesktopToolPalette';
import { MacWindowChrome } from '../../../src/components/workbench/MacWindowChrome';

describe('Sprint 09: Desktop Assets & macOS Chrome Harmonization', () => {
  describe('Step 09.1 & AC-09-01: Asset Extraction & Sync', () => {
    const requiredIcons = [
      'tikzit-tool-select.svg',
      'tikzit-tool-node.svg',
      'tikzit-tool-edge.svg',
      'crop.svg',
      'document-new.svg',
      'document-open.svg',
      'text-x-generic_with_pencil.svg',
      'refresh.svg',
      'tikzit.svg',
      'tikzit.png',
    ];

    requiredIcons.forEach((iconName) => {
      it(`synchronizes canonical asset ${iconName} into public/icons/`, () => {
        const iconPath = path.resolve(process.cwd(), 'public/icons', iconName);
        expect(fs.existsSync(iconPath)).toBe(true);
        const stat = fs.statSync(iconPath);
        expect(stat.size).toBeGreaterThan(100);
      });
    });
  });

  describe('Step 09.2 & AC-09-02: Type-Safe Icon Registry', () => {
    it('renders SelectToolIcon with correct viewBox and dimensions', () => {
      const html = renderToString(<SelectToolIcon size={32} className="custom-select" />);
      expect(html).toContain('viewBox="0 0 60 60"');
      expect(html).toContain('width="32"');
      expect(html).toContain('height="32"');
      expect(html).toContain('class="custom-select"');
      expect(html).toContain('polygon');
    });

    it('renders VertexToolIcon with correct viewBox and paths', () => {
      const html = renderToString(<VertexToolIcon size={24} />);
      expect(html).toContain('viewBox="0 0 60 60"');
      expect(html).toContain('circle');
      expect(html).toContain('path');
    });

    it('renders EdgeToolIcon with handles and curves', () => {
      const html = renderToString(<EdgeToolIcon size={24} />);
      expect(html).toContain('viewBox="0 0 60 60"');
      expect(html).toContain('#009245'); // Green handles
      expect(html).toContain('#39B54A');
    });

    it('renders CropToolIcon with viewBox 0 0 48 48', () => {
      const html = renderToString(<CropToolIcon size={20} />);
      expect(html).toContain('viewBox="0 0 48 48"');
      expect(html).toContain('width="20"');
    });

    it('renders Action icons with /icons/ source paths', () => {
      const newHtml = renderToString(<NewDocumentIcon />);
      const openHtml = renderToString(<OpenDocumentIcon />);
      const editHtml = renderToString(<EditDocumentIcon />);
      const refreshHtml = renderToString(<RefreshIcon />);
      const logoHtml = renderToString(<TikzitLogoIcon />);

      expect(newHtml).toContain('src="/icons/document-new.svg"');
      expect(openHtml).toContain('src="/icons/document-open.svg"');
      expect(editHtml).toContain('src="/icons/text-x-generic_with_pencil.svg"');
      expect(refreshHtml).toContain('src="/icons/refresh.svg"');
      expect(logoHtml).toContain('src="/icons/tikzit.png"');
    });
  });

  describe('Step 09.4 & AC-09-04: Desktop Tool Palette', () => {
    it('renders 4 tool buttons with 32x32px square layout and active green border', () => {
      const html = renderToString(<DesktopToolPalette activeTool="edge" onSelectTool={vi.fn()} />);

      expect(html).toContain('role="toolbar"');
      expect(html).toContain('aria-label="Tool Palette"');
      expect(html).toContain('data-testid="tool-select"');
      expect(html).toContain('data-testid="tool-vertex"');
      expect(html).toContain('data-testid="tool-edge"');
      expect(html).toContain('data-testid="tool-bbox"');

      // Check active state on edge tool: green border #00c853 and data-active="true"
      expect(html).toContain('data-tool="edge" data-active="true"');
      expect(html).toContain('border-[#00c853]');
      expect(html).toContain('data-tool="select" data-active="false"');
    });
  });

  describe('Step 09.3 & Sprint 13 Refinement: Window Chrome & Canvas-Centric Tools', () => {
    it('renders clean chrome without non-functional traffic lights, centered tools, and left title', () => {
      const html = renderToString(
        <MacWindowChrome
          documentTitle="01_spider_fusion.tikz"
          isDirty={true}
          activeTool="edge"
          onSelectTool={vi.fn()}
          canUndo={true}
          canRedo={false}
          onUndo={vi.fn()}
          onRedo={vi.fn()}
          showVersionPopover={false}
          onToggleVersionPopover={vi.fn()}
          tabsMenuOpen={false}
          onToggleTabsMenu={vi.fn()}
          onCloseOthers={vi.fn()}
          onCloseAll={vi.fn()}
          onResetLayout={vi.fn()}
          theme="dark"
          themeMenuOpen={false}
          onToggleThemeMenu={vi.fn()}
          onSetTheme={vi.fn()}
          onNewDiagram={vi.fn()}
        />
      );

      // Non-functional traffic lights removed per Sprint 13 intentional design
      expect(html).not.toContain('data-testid="mac-traffic-lights"');
      expect(html).not.toContain('traffic-light-close');
      expect(html).not.toContain('bg-[#ff5f56]');

      // Centered tool palette zone
      expect(html).toContain('data-testid="center-toolbar-zone"');
      expect(html).toContain('data-testid="desktop-tool-palette"');

      // Document title with dirty asterisk and - TikZiT suffix on left
      expect(html).toContain('data-testid="doc-tab-title"');
      expect(html).toContain('01_spider_fusion.tikz* - TikZiT');

      // Undo / Redo buttons
      expect(html).toContain('data-testid="btn-toolbar-undo"');
      expect(html).toContain('data-testid="btn-toolbar-redo"');

      // New diagram + button
      expect(html).toContain('data-testid="btn-new-diagram"');

      // Version history, reset layout, theme toggle
      expect(html).toContain('data-testid="btn-version-history"');
      expect(html).toContain('data-testid="btn-reset-layout"');
      expect(html).toContain('data-testid="btn-theme-toggle"');
      expect(html).toContain('id="theme-selector-btn"');
    });
  });
});
