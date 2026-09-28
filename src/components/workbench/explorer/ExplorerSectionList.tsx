/**
 * src/components/workbench/explorer/ExplorerSectionList.tsx - Sprint 22
 * Grouped sections for Drafts, User Diagrams, and Seeded Examples.
 */
import React from 'react';
import { ExplorerEntryRow, type ExplorerItem } from './ExplorerEntryRow';

export interface ExplorerSectionListProps {
  items: ExplorerItem[];
  query: string;
  activeHandle: string;
  onSelect: (handle: string) => void;
  openMenuHandle: string | null;
  onToggleMenu: (handle: string, e: React.MouseEvent) => void;
  editingHandle: string | null;
  editTitle: string;
  onEditTitleChange: (val: string) => void;
  onRenameCommit: (handle: string) => void;
  onRenameCancel: () => void;
  onStartRename: (item: ExplorerItem) => void;
  onDuplicate: (handle: string) => void;
  onToggleArchive: (handle: string, archived: boolean) => void;
  onExport: (handle: string) => void;
}

export const ExplorerSectionList: React.FC<ExplorerSectionListProps> = ({
  items,
  query,
  activeHandle,
  onSelect,
  openMenuHandle,
  onToggleMenu,
  editingHandle,
  editTitle,
  onEditTitleChange,
  onRenameCommit,
  onRenameCancel,
  onStartRename,
  onDuplicate,
  onToggleArchive,
  onExport,
}) => {
  const filtered = items.filter((item) =>
    !query || item.title.toLowerCase().includes(query.toLowerCase())
  );

  const drafts = filtered.filter((i) => i.type === 'draft');
  const diagrams = filtered.filter((i) => i.type === 'diagram');
  const examples = filtered.filter((i) => i.type === 'example');

  const renderSection = (title: string, sectionItems: ExplorerItem[], emptyText: string) => {
    if (sectionItems.length === 0 && query) return null;
    return (
      <div className="flex flex-col gap-1 mb-3">
        <div className="flex items-center justify-between px-2 text-[10px] font-semibold text-neutral-500 uppercase tracking-wider">
          <span>{title}</span>
          <span className="font-mono">{sectionItems.length}</span>
        </div>
        {sectionItems.length === 0 ? (
          <div className="px-2 py-1 text-xs text-neutral-600 italic">{emptyText}</div>
        ) : (
          sectionItems.map((item) => (
            <ExplorerEntryRow
              key={item.handle}
              item={item}
              isActive={item.handle === activeHandle}
              onSelect={onSelect}
              openMenuHandle={openMenuHandle}
              onToggleMenu={onToggleMenu}
              editingHandle={editingHandle}
              editTitle={editTitle}
              onEditTitleChange={onEditTitleChange}
              onRenameCommit={onRenameCommit}
              onRenameCancel={onRenameCancel}
              onStartRename={onStartRename}
              onDuplicate={onDuplicate}
              onToggleArchive={onToggleArchive}
              onExport={onExport}
            />
          ))
        )}
      </div>
    );
  };

  return (
    <div className="flex-1 overflow-y-auto p-2">
      {drafts.length > 0 && renderSection('Unsaved Drafts', drafts, '')}
      {renderSection('User Diagrams', diagrams, 'No diagrams found.')}
      {renderSection('Seeded Examples', examples, 'No examples found.')}
    </div>
  );
};
