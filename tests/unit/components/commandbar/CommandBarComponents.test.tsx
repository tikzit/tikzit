/**
 * tests/unit/components/commandbar/CommandBarComponents.test.tsx - Sprint 22
 * Unit tests T22-25 to T22-28 for decomposed title bar and action button components.
 */
import { describe, it, expect } from 'vitest';
import React from 'react';
import { renderToString } from 'react-dom/server';
import { DocumentTitleBar } from '../../../../src/components/workbench/commandbar/DocumentTitleBar';
import {
  DocumentSaveButton,
  NewDiagramButton,
  VersionHistoryButton,
} from '../../../../src/components/workbench/commandbar/DocumentActionButtons';

describe('CommandBarComponents (T22-25 - T22-28)', () => {
  it('T22-25: DocumentTitleBar renders title with dirty star and badge', () => {
    const html = renderToString(
      <DocumentTitleBar
        documentTitle="01_spider_fusion.tikz"
        isDirty={true}
        docBadge="Draft"
        saveStatusText="Unsaved changes"
        saveError={undefined}
        isSessionOnly={false}
        buttonKind="save-draft"
        buttonLabel="Save to MCard"
        isSaving={false}
        showSuccessPill={false}
        onNewDiagram={() => {}}
        onCloseActiveTab={() => {}}
      />
    );

    expect(html).toContain('data-testid="mac-window-title"');
    expect(html).toContain('data-testid="doc-tab-title"');
    expect(html).toContain('01_spider_fusion.tikz* - TikZiT');
    expect(html).toContain('data-testid="doc-type-badge"');
    expect(html).toContain('Draft');
    expect(html).toContain('data-testid="doc-save-status"');
    expect(html).toContain('Unsaved changes');
    expect(html).toContain('data-testid="btn-save-draft"');
    expect(html).toContain('data-testid="btn-close-tab"');
    expect(html).toContain('data-testid="btn-new-diagram"');
  });

  it('T22-26: DocumentTitleBar displays save error and retry button when session only', () => {
    const html = renderToString(
      <DocumentTitleBar
        documentTitle="test.tikz"
        isDirty={true}
        docBadge="Diagram"
        saveStatusText="Persistence unavailable"
        saveError="IndexedDB quota exceeded"
        isSessionOnly={true}
        onRetryFlush={() => {}}
        onNewDiagram={() => {}}
      />
    );

    expect(html).toContain('data-testid="diagram-save-error"');
    expect(html).toContain('IndexedDB quota exceeded');
    expect(html).toContain('data-testid="doc-retry-flush-btn"');
    expect(html).toContain('Retry');
  });

  it('T22-27: DocumentSaveButton renders success pill when showSuccessPill is true', () => {
    const html = renderToString(
      <DocumentSaveButton
        showSuccessPill={true}
        buttonKind="save-draft"
      />
    );

    expect(html).toContain('data-testid="draft-save-success-pill"');
    expect(html).toContain('✓ Saved to MCard');
    expect(html).not.toContain('data-testid="btn-save-draft"');
  });

  it('T22-28: VersionHistoryButton and NewDiagramButton render Contract B selectors', () => {
    const htmlHistory = renderToString(
      <VersionHistoryButton
        showVersionPopover={false}
        onToggleVersionPopover={() => {}}
      />
    );
    expect(htmlHistory).toContain('data-testid="btn-version-history"');

    const htmlNew = renderToString(
      <NewDiagramButton onNewDiagram={() => {}} />
    );
    expect(htmlNew).toContain('data-testid="btn-new-diagram"');
  });
});
