/**
 * tests/unit/components/explorer/ExplorerComponents.test.tsx - Sprint 22
 * Unit tests T22-20 to T22-24 for decomposed corpus explorer components.
 */
import { describe, it, expect } from 'vitest';
import React from 'react';
import { renderToString } from 'react-dom/server';
import { ExplorerSearchBar } from '../../../../src/components/workbench/explorer/ExplorerSearchBar';
import { ExplorerEntryRow, type ExplorerItem } from '../../../../src/components/workbench/explorer/ExplorerEntryRow';
import { ExplorerSectionList } from '../../../../src/components/workbench/explorer/ExplorerSectionList';

describe('ExplorerComponents (T22-20 - T22-24)', () => {
  const sampleDiagramItem: ExplorerItem = {
    handle: 'zx:diagrams:spider1',
    title: 'Spider Fusion',
    type: 'diagram',
    badge: 'Diagram',
    nodeCount: 3,
    edgeCount: 2,
    updatedAt: 1700000000000,
    createdAt: 1700000000000,
    archived: false,
    isImported: false,
    version: 2,
  };

  const sampleArchivedItem: ExplorerItem = {
    ...sampleDiagramItem,
    handle: 'zx:diagrams:spider_archived',
    archived: true,
  };

  const sampleDraftItem: ExplorerItem = {
    handle: 'draft:123',
    title: 'Untitled Draft',
    type: 'draft',
    badge: 'Draft',
    nodeCount: 1,
    edgeCount: 0,
    updatedAt: 1700000000000,
    createdAt: 1700000000000,
    archived: false,
    isImported: false,
    version: 0,
  };

  it('T22-20: ExplorerSearchBar renders search input, count, and filter toggle', () => {
    const html = renderToString(
      <ExplorerSearchBar
        query="spider"
        onQueryChange={() => {}}
        showArchived={false}
        onToggleShowArchived={() => {}}
        onNewDiagram={() => {}}
        onExportCollection={() => {}}
      />
    );

    expect(html).toContain('data-testid="corpus-search-input"');
    expect(html).toContain('value="spider"');
    expect(html).toContain('data-testid="btn-explorer-new-diagram"');
    expect(html).toContain('data-testid="btn-export-collection"');
    expect(html).toContain('data-testid="toggle-show-archived"');
  });

  it('T22-21: ExplorerEntryRow renders diagram badges, version, and entry handle', () => {
    const html = renderToString(
      <ExplorerEntryRow
        item={sampleDiagramItem}
        isActive={true}
        onSelect={() => {}}
        openMenuHandle={null}
        onToggleMenu={() => {}}
        editingHandle={null}
        editTitle=""
        onEditTitleChange={() => {}}
        onRenameCommit={() => {}}
        onRenameCancel={() => {}}
        onStartRename={() => {}}
        onDuplicate={() => {}}
        onToggleArchive={() => {}}
        onExport={() => {}}
      />
    );

    expect(html).toContain('data-testid="corpus-entry-zx:diagrams:spider1"');
    expect(html).toContain('data-testid="badge-diagram"');
    expect(html).toContain('data-testid="entry-version"');
    expect(html).toContain('entry-actions-zx:diagrams:spider1');
  });

  it('T22-22: ExplorerEntryRow renders action-archive when open for unarchived item', () => {
    const html = renderToString(
      <ExplorerEntryRow
        item={sampleDiagramItem}
        isActive={false}
        onSelect={() => {}}
        openMenuHandle="zx:diagrams:spider1"
        onToggleMenu={() => {}}
        editingHandle={null}
        editTitle=""
        onEditTitleChange={() => {}}
        onRenameCommit={() => {}}
        onRenameCancel={() => {}}
        onStartRename={() => {}}
        onDuplicate={() => {}}
        onToggleArchive={() => {}}
        onExport={() => {}}
      />
    );

    expect(html).toContain('data-testid="action-rename"');
    expect(html).toContain('data-testid="action-duplicate"');
    expect(html).toContain('data-testid="row-export-diagram"');
    expect(html).toContain('data-testid="action-archive"');
    expect(html).not.toContain('data-testid="action-unarchive"');
  });

  it('T22-23: ExplorerEntryRow renders action-unarchive when open for archived item', () => {
    const html = renderToString(
      <ExplorerEntryRow
        item={sampleArchivedItem}
        isActive={false}
        onSelect={() => {}}
        openMenuHandle="zx:diagrams:spider_archived"
        onToggleMenu={() => {}}
        editingHandle={null}
        editTitle=""
        onEditTitleChange={() => {}}
        onRenameCommit={() => {}}
        onRenameCancel={() => {}}
        onStartRename={() => {}}
        onDuplicate={() => {}}
        onToggleArchive={() => {}}
        onExport={() => {}}
      />
    );

    expect(html).toContain('data-testid="action-unarchive"');
    expect(html).toContain('data-testid="badge-archived"');
  });

  it('T22-24: ExplorerSectionList partitions items into drafts and diagrams sections', () => {
    const html = renderToString(
      <ExplorerSectionList
        items={[sampleDraftItem, sampleDiagramItem]}
        query=""
        activeHandle=""
        onSelect={() => {}}
        openMenuHandle={null}
        onToggleMenu={() => {}}
        editingHandle={null}
        editTitle=""
        onEditTitleChange={() => {}}
        onRenameCommit={() => {}}
        onRenameCancel={() => {}}
        onStartRename={() => {}}
        onDuplicate={() => {}}
        onToggleArchive={() => {}}
        onExport={() => {}}
      />
    );

    expect(html).toContain('Drafts');
    expect(html).toContain('Diagrams');
    expect(html).toContain('data-testid="corpus-entry-draft:123"');
    expect(html).toContain('data-testid="corpus-entry-zx:diagrams:spider1"');
  });
});
