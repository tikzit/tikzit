/**
 * src/components/workbench/explorer/ExplorerEntryRow.tsx - Sprint 22
 * Single diagram entry row with status badges, inline renaming, and overflow menu.
 */
import React from 'react';

export interface ExplorerItem {
  handle: string;
  title: string;
  type: 'draft' | 'diagram' | 'example';
  badge: 'Draft' | 'Diagram' | 'Example';
  nodeCount: number;
  edgeCount: number;
  updatedAt: number;
  createdAt: number;
  archived: boolean;
  isImported: boolean;
  version: number;
}

export interface ExplorerEntryRowProps {
  item: ExplorerItem;
  isActive: boolean;
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

export const ExplorerEntryRow: React.FC<ExplorerEntryRowProps> = ({
  item,
  isActive,
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
  const isMenuOpen = openMenuHandle === item.handle;
  const isEditing = editingHandle === item.handle;

  return (
    <div
      data-testid={`corpus-entry-${item.handle}`}
      onClick={() => onSelect(item.handle)}
      className={`px-2 py-1.5 rounded text-xs flex items-center justify-between cursor-pointer group select-none ${
        isActive
          ? 'bg-sky-950/60 text-sky-200 border border-sky-700/50'
          : 'hover:bg-neutral-800/60 text-neutral-300'
      }`}
    >
      <div className="flex items-center gap-1.5 min-w-0 flex-1">
        <span
          data-testid={`badge-${item.type}`}
          className={`px-1.5 py-0.2 rounded text-[10px] font-mono shrink-0 ${
            item.type === 'draft'
              ? 'bg-amber-950/60 text-amber-300 border border-amber-700/40'
              : item.type === 'example'
              ? 'bg-purple-950/60 text-purple-300 border border-purple-700/40'
              : 'bg-neutral-800 text-neutral-400'
          }`}
        >
          {item.badge}
        </span>

        {item.isImported && (
          <span data-testid="badge-imported" className="px-1 py-0.2 bg-neutral-800 text-neutral-400 rounded text-[9px]">
            Legacy
          </span>
        )}

        {item.archived && (
          <span data-testid="badge-archived" className="px-1 py-0.2 bg-neutral-800 text-neutral-400 rounded text-[9px]">
            Archived
          </span>
        )}

        {isEditing ? (
          <input
            data-testid="input-rename-diagram"
            type="text"
            value={editTitle}
            onChange={(e) => onEditTitleChange(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') onRenameCommit(item.handle);
              if (e.key === 'Escape') onRenameCancel();
            }}
            onClick={(e) => e.stopPropagation()}
            autoFocus
            className="flex-1 bg-neutral-950 border border-sky-500 px-1 py-0.5 text-xs text-neutral-100 rounded focus:outline-none"
          />
        ) : (
          <span className="truncate font-medium flex-1">{item.title}</span>
        )}
      </div>

      <div className="flex items-center gap-1.5 ml-2 relative" onClick={(e) => e.stopPropagation()}>
        <span data-testid="entry-version" className="text-[10px] text-neutral-500 font-mono">
          v{item.version}
        </span>

        {item.type !== 'draft' && (
          <button
            data-testid={`entry-actions-${item.handle}`}
            onClick={(e) => onToggleMenu(item.handle, e)}
            className="p-1 hover:bg-neutral-700/50 rounded text-neutral-400 hover:text-neutral-200"
          >
            ⋮
          </button>
        )}

        {isMenuOpen && (
          <div className="absolute right-0 top-full mt-1 w-32 bg-neutral-900 border border-neutral-700 rounded shadow-xl py-1 z-30 flex flex-col text-xs text-neutral-200">
            <button data-testid="action-rename" onClick={() => onStartRename(item)} className="px-3 py-1 text-left hover:bg-neutral-800">Rename</button>
            <button data-testid="action-duplicate" onClick={() => onDuplicate(item.handle)} className="px-3 py-1 text-left hover:bg-neutral-800">Duplicate</button>
            <button data-testid="row-export-diagram" onClick={() => onExport(item.handle)} className="px-3 py-1 text-left hover:bg-neutral-800">Export...</button>
            {item.archived ? (
              <button
                data-testid="action-unarchive"
                onClick={() => onToggleArchive(item.handle, false)}
                className="px-3 py-1 text-left hover:bg-neutral-800 text-rose-400"
              >
                Unarchive
              </button>
            ) : (
              <button
                data-testid="action-archive"
                onClick={() => onToggleArchive(item.handle, true)}
                className="px-3 py-1 text-left hover:bg-neutral-800 text-rose-400"
              >
                Archive
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
