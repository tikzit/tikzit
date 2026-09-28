/**
 * tests/unit/components/preview/PreviewComponents.test.tsx - Sprint 22
 * Unit tests T22-18 and T22-19 for decomposed preview stage and toolbar components.
 */
import { describe, it, expect } from 'vitest';
import React from 'react';
import { renderToString } from 'react-dom/server';
import { PreviewToolbar } from '../../../../src/components/workbench/panels/preview/PreviewToolbar';
import { PreviewStage } from '../../../../src/components/workbench/panels/preview/PreviewStage';

describe('PreviewComponents (T22-18, T22-19)', () => {
  it('T22-18: PreviewToolbar renders zoom controls, status badges, and export dropdown', () => {
    const html = renderToString(
      <PreviewToolbar
        autoCompile={true}
        onToggleAutoCompile={() => {}}
        compiling={false}
        zoom={1.25}
        onZoomIn={() => {}}
        onZoomOut={() => {}}
        onZoomReset={() => {}}
        onZoomFit={() => {}}
        onCopyTikz={() => {}}
        showExportMenu={true}
        onToggleExportMenu={() => {}}
        onExport={() => {}}
        onToggleLogs={() => {}}
        onTogglePreamble={() => {}}
      />
    );

    expect(html).toContain('data-testid="toggle-auto-compile"');
    expect(html).toContain('data-testid="preview-status-badge"');
    expect(html).toContain('data-testid="btn-preview-zoom-in"');
    expect(html).toContain('data-testid="preview-zoom-text"');
    expect(html).toContain('125');
    expect(html).toContain('data-testid="btn-preview-zoom-out"');
    expect(html).toContain('data-testid="btn-preview-zoom-reset"');
    expect(html).toContain('data-testid="btn-preview-zoom-fit"');
    expect(html).toContain('data-testid="btn-copy-tikz"');
    expect(html).toContain('data-testid="btn-export-dropdown"');
    expect(html).toContain('data-testid="preview-export-menu"');
    expect(html).toContain('data-testid="btn-export-svg"');
    expect(html).toContain('data-testid="btn-export-tikz"');
    expect(html).toContain('data-testid="btn-preview-logs"');
    expect(html).toContain('data-testid="btn-preview-preamble"');
  });

  it('T22-19: PreviewStage renders SVG viewport and empty message when graph is blank', () => {
    const emptyHtml = renderToString(
      <PreviewStage
        svgContent=""
        zoom={1.0}
        pan={{ x: 0, y: 0 }}
        onPanChange={() => {}}
        onZoomChange={() => {}}
      />
    );

    expect(emptyHtml).toContain('data-testid="preview-viewport"');
    expect(emptyHtml).toContain('data-testid="preview-svg-container"');
    expect(emptyHtml).toContain('data-testid="preview-empty-message"');

    const populatedHtml = renderToString(
      <PreviewStage
        svgContent="<svg><circle cx='10' cy='10' r='5' /></svg>"
        zoom={1.0}
        pan={{ x: 0, y: 0 }}
        onPanChange={() => {}}
        onZoomChange={() => {}}
      />
    );

    expect(populatedHtml).toContain('data-testid="preview-svg-content"');
    expect(populatedHtml).not.toContain('data-testid="preview-empty-message"');
  });
});
