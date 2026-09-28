/**
 * src/components/workbench/panels/history/VersionHistoryList.tsx - Sprint 22
 * Version timeline list, savepoint creation input, and row actions with Contract B selectors.
 */
import React from 'react';
import type { HistoryRow } from '../../../../services/clm/documentCommitService';

export interface VersionHistoryListProps {
  headHash: string;
  rows: HistoryRow[];
  activeHash: string;
  message: string;
  onMessageChange: (val: string) => void;
  onSavepointCreate: () => void;
  isSaving: boolean;
  onCopyHash: (hash: string) => void;
  onPreview: (row: HistoryRow) => void;
  onCompare: (row: HistoryRow) => void;
  onRestore: (row: HistoryRow) => void;
}

export const VersionHistoryList: React.FC<VersionHistoryListProps> = ({
  headHash,
  rows,
  activeHash,
  message,
  onMessageChange,
  onSavepointCreate,
  isSaving,
  onCopyHash,
  onPreview,
  onCompare,
  onRestore,
}) => {
  return (
    <div className="flex flex-col gap-3">
      {/* Head Hash & Savepoint input */}
      <div className="bg-neutral-900/60 p-2.5 rounded border border-neutral-800 text-xs">
        <div className="flex items-center justify-between text-neutral-400 mb-2">
          <span>Head Hash:</span>
          <div className="flex items-center gap-1.5 font-mono">
            <span data-testid="history-head-hash" className="text-neutral-200">
              {headHash ? `${headHash.slice(0, 10)}...` : 'None'}
            </span>
            {headHash && (
              <button
                data-testid="btn-copy-head-hash"
                onClick={() => onCopyHash(headHash)}
                className="text-neutral-400 hover:text-neutral-200 p-0.5 rounded"
                title="Copy full hash"
              >
                📋
              </button>
            )}
          </div>
        </div>

        <div className="flex gap-1.5">
          <input
            data-testid="savepoint-input"
            type="text"
            placeholder="Savepoint label (optional)..."
            value={message}
            onChange={(e) => onMessageChange(e.target.value)}
            className="flex-1 bg-neutral-950 border border-neutral-700 px-2 py-1 text-xs text-neutral-200 rounded focus:outline-none focus:border-sky-500"
          />
          <button
            data-testid="btn-create-savepoint"
            onClick={onSavepointCreate}
            disabled={isSaving}
            className="px-2.5 py-1 text-xs bg-neutral-800 hover:bg-neutral-700 text-neutral-200 rounded border border-neutral-700 disabled:opacity-50"
          >
            Save
          </button>
        </div>
      </div>

      {/* Rows */}
      <div data-testid="revisions-list" className="flex flex-col gap-1.5 max-h-72 overflow-y-auto">
        {rows.length === 0 ? (
          <div data-testid="history-empty" className="p-4 text-center text-neutral-500 italic text-xs">
            No history yet (uncommitted draft).
          </div>
        ) : (
          rows.map((row) => {
            const isCurrent = row.hash === activeHash;
            return (
              <div
                key={row.hash || row.position}
                data-testid={`version-row-${row.position}`}
                className={`p-2 rounded border text-xs flex flex-col gap-1.5 transition-colors ${
                  isCurrent
                    ? 'bg-neutral-800/80 border-sky-500/50'
                    : 'bg-neutral-900/40 border-neutral-800/80 hover:bg-neutral-800/40'
                }`}
              >
                <div data-testid="revision-item" className="contents">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <span data-testid="version-position" className="font-semibold text-neutral-300">#{row.position}</span>
                      {isCurrent && (
                        <span
                          data-testid="badge-current-version"
                          className="px-1.5 py-0.2 bg-sky-900/60 text-sky-300 rounded text-[10px] border border-sky-700/50"
                        >
                          Current
                        </span>
                      )}
                      {row.unavailable && (
                        <span data-testid="version-unavailable" className="text-[9px] text-rose-400 bg-rose-950/60 border border-rose-800/50 px-1 rounded">
                          Unavailable
                        </span>
                      )}
                      <span data-testid="version-label" className="text-neutral-200 font-medium truncate max-w-[140px]">
                        {row.label || 'Revision'}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      {row.authorDid && (
                        <span data-testid="version-author" className="text-[9px] text-neutral-500 font-mono truncate max-w-[100px]">
                          {row.authorDid}
                        </span>
                      )}
                      <span data-testid="version-timestamp" className="text-[10px] text-neutral-500">
                        {new Date(row.changedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-1 border-t border-neutral-800/50 text-[11px]">
                    <div className="flex items-center gap-1">
                      <span data-testid="version-hash" className="font-mono text-neutral-500">
                        {row.hash ? row.hash.slice(0, 8) : '...'}
                      </span>
                      {row.hash && (
                        <button
                          type="button"
                          data-testid="btn-copy-version-hash"
                          onClick={() => onCopyHash(row.hash)}
                          className="text-neutral-500 hover:text-neutral-300 p-0.5 rounded"
                          title="Copy version hash"
                        >
                          📋
                        </button>
                      )}
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        data-testid="btn-preview-version"
                        onClick={() => onPreview(row)}
                        className="px-1.5 py-0.5 text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800 rounded"
                      >
                        View
                      </button>
                      <button
                        data-testid="btn-compare-version"
                        onClick={() => onCompare(row)}
                        className="px-1.5 py-0.5 text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800 rounded"
                      >
                        Diff
                      </button>
                      <button
                        data-testid="btn-restore-version"
                        onClick={() => onRestore(row)}
                        className="px-1.5 py-0.5 text-sky-400 hover:text-sky-300 hover:bg-sky-950/40 rounded font-medium"
                      >
                        Restore
                      </button>
                      <button
                        data-testid="btn-restore-revision"
                        onClick={() => onRestore(row)}
                        className="hidden"
                        aria-hidden="true"
                      >
                        Restore Revision
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
