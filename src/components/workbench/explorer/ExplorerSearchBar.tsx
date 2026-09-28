/**
 * src/components/workbench/explorer/ExplorerSearchBar.tsx - Sprint 22
 * Search input, archived toggle, and drawer action buttons with Contract B selectors.
 */
import React from 'react';

export interface ExplorerSearchBarProps {
  query: string;
  onQueryChange: (q: string) => void;
  showArchived: boolean;
  onToggleShowArchived: () => void;
  onNewDiagram: () => void;
  onExportCollection: () => void;
}

export const ExplorerSearchBar: React.FC<ExplorerSearchBarProps> = ({
  query,
  onQueryChange,
  showArchived,
  onToggleShowArchived,
  onNewDiagram,
  onExportCollection,
}) => {
  return (
    <div className="p-2 border-b border-neutral-800 flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <span className="text-[11px] font-semibold uppercase tracking-wider text-neutral-400">Diagrams</span>
        <div className="flex items-center gap-1">
          <button
            data-testid="btn-explorer-new-diagram"
            onClick={onNewDiagram}
            className="px-2 py-0.5 text-xs bg-sky-600 hover:bg-sky-500 text-white rounded font-medium"
            title="Create new diagram"
          >
            + New
          </button>
          <button
            data-testid="btn-export-collection"
            onClick={onExportCollection}
            className="px-1.5 py-0.5 text-xs text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800 rounded"
            title="Export full collection"
          >
            💾
          </button>
        </div>
      </div>

      <input
        data-testid="corpus-search-input"
        type="text"
        placeholder="Filter diagrams..."
        value={query}
        onChange={(e) => onQueryChange(e.target.value)}
        className="w-full bg-neutral-950 border border-neutral-800 px-2.5 py-1 text-xs text-neutral-200 rounded focus:outline-none focus:border-sky-500"
      />

      <label className="flex items-center gap-1.5 text-[11px] text-neutral-400 cursor-pointer select-none">
        <input
          data-testid="toggle-show-archived"
          type="checkbox"
          checked={showArchived}
          onChange={onToggleShowArchived}
          className="rounded border-neutral-700 bg-neutral-950 text-sky-600 focus:ring-0"
        />
        <span>Show archived</span>
      </label>
    </div>
  );
};
