/**
 * tests/unit/components/history/VersionComponents.test.tsx - Sprint 22
 * Unit tests T22-11 to T22-17 for decomposed history panel components.
 */
import { describe, it, expect, vi } from 'vitest';
import React from 'react';
import { renderToString } from 'react-dom/server';
import { VersionHistoryList } from '../../../../src/components/workbench/panels/history/VersionHistoryList';
import { VersionRestoreDialog } from '../../../../src/components/workbench/panels/history/VersionRestoreDialog';
import { VersionCompareModal } from '../../../../src/components/workbench/panels/history/VersionCompareModal';
import type { HistoryRow } from '../../../../src/services/clm/documentCommitService';

describe('VersionComponents (T22-11 - T22-17)', () => {
  const sampleRow: HistoryRow = {
    position: 1,
    hash: 'abc1234567890def',
    changedAt: new Date(1700000000000).toISOString(),
    label: 'Initial savepoint',
    isHead: true,
  };

  it('T22-11: VersionHistoryList renders revisions-list and head hash with copy trigger', () => {
    const html = renderToString(
      <VersionHistoryList
        headHash="abc1234567890def"
        rows={[sampleRow]}
        activeHash="abc1234567890def"
        message=""
        onMessageChange={() => {}}
        onSavepointCreate={() => {}}
        isSaving={false}
        onCopyHash={() => {}}
        onPreview={() => {}}
        onCompare={() => {}}
        onRestore={() => {}}
      />
    );

    expect(html).toContain('data-testid="revisions-list"');
    expect(html).toContain('data-testid="history-head-hash"');
    expect(html).toContain('data-testid="btn-copy-head-hash"');
    expect(html).toContain('data-testid="version-row-1"');
    expect(html).toContain('data-testid="badge-current-version"');
    expect(html).toContain('data-testid="version-position"');
  });

  it('T22-12: VersionHistoryList renders empty state when rows is empty', () => {
    const html = renderToString(
      <VersionHistoryList
        headHash=""
        rows={[]}
        activeHash=""
        message=""
        onMessageChange={() => {}}
        onSavepointCreate={() => {}}
        isSaving={false}
        onCopyHash={() => {}}
        onPreview={() => {}}
        onCompare={() => {}}
        onRestore={() => {}}
      />
    );

    expect(html).toContain('data-testid="history-empty"');
  });

  it('T22-13: VersionRestoreDialog renders clean confirmation dialog for clean document', () => {
    const html = renderToString(
      <VersionRestoreDialog
        mode="clean"
        target={sampleRow}
        isRestoring={false}
        onConfirmClean={() => {}}
        onSaveFirst={() => {}}
        onDiscardAndRestore={() => {}}
        onCancel={() => {}}
      />
    );

    expect(html).toContain('data-testid="restore-confirm-dialog"');
    expect(html).toContain('data-testid="btn-confirm-restore"');
    expect(html).toContain('data-testid="btn-cancel-restore"');
  });

  it('T22-14: VersionRestoreDialog renders 3-way dirty dialog when uncommitted changes exist', () => {
    const html = renderToString(
      <VersionRestoreDialog
        mode="dirty"
        target={sampleRow}
        isRestoring={false}
        onConfirmClean={() => {}}
        onSaveFirst={() => {}}
        onDiscardAndRestore={() => {}}
        onCancel={() => {}}
      />
    );

    expect(html).toContain('data-testid="restore-dirty-dialog"');
    expect(html).toContain('data-testid="btn-restore-save-first"');
    expect(html).toContain('data-testid="btn-restore-discard"');
    expect(html).toContain('data-testid="btn-restore-cancel"');
  });

  it('T22-15: VersionCompareModal renders diff panel when compareVersion is provided', () => {
    const html = renderToString(
      <VersionCompareModal
        compareVersion={sampleRow}
        compareContent="\\begin{tikzpicture}\n\\node (a) at (0,0) {};\n\\end{tikzpicture}"
        currentContent="\\begin{tikzpicture}\n\\node (b) at (1,1) {};\n\\end{tikzpicture}"
        onCloseCompare={() => {}}
        previewVersion={null}
        previewContent={null}
        onClosePreview={() => {}}
      />
    );

    expect(html).toContain('data-testid="history-compare-panel"');
    expect(html).toContain('data-testid="btn-close-compare"');
    expect(html).toContain('data-testid="compare-stat-deltas"');
    expect(html).toContain('data-testid="compare-diff-view"');
  });

  it('T22-16: VersionCompareModal renders preview panel when previewVersion is provided', () => {
    const html = renderToString(
      <VersionCompareModal
        compareVersion={null}
        compareContent={null}
        currentContent=""
        onCloseCompare={() => {}}
        previewVersion={sampleRow}
        previewContent="\\begin{tikzpicture}\\end{tikzpicture}"
        onClosePreview={() => {}}
      />
    );

    expect(html).toContain('data-testid="history-preview-panel"');
    expect(html).toContain('data-testid="btn-close-preview"');
    expect(html).toContain('data-testid="preview-source-code"');
  });

  it('T22-17: VersionCompareModal renders nothing when neither preview nor compare is active', () => {
    const html = renderToString(
      <VersionCompareModal
        compareVersion={null}
        compareContent={null}
        currentContent=""
        onCloseCompare={() => {}}
        previewVersion={null}
        previewContent={null}
        onClosePreview={() => {}}
      />
    );

    expect(html).toBe('');
  });
});
