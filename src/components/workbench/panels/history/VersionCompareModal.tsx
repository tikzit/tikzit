/**
 * src/components/workbench/panels/history/VersionCompareModal.tsx - Sprint 22
 * Side-by-side visual compare modal and source preview panel with Contract B selectors.
 */
import React from 'react';
import type { HistoryRow } from '../../../../services/clm/documentCommitService';
import { computeLineDiff, computeStatDeltas } from './VersionDiffEngine';
import { safeParse } from '../../../../core/parser/parser';

export interface VersionCompareModalProps {
  compareVersion: HistoryRow | null;
  compareContent: string | null;
  currentContent: string;
  onCloseCompare: () => void;
  previewVersion: HistoryRow | null;
  previewContent: string | null;
  onClosePreview: () => void;
}

export const VersionCompareModal: React.FC<VersionCompareModalProps> = ({
  compareVersion,
  compareContent,
  currentContent,
  onCloseCompare,
  previewVersion,
  previewContent,
  onClosePreview,
}) => {
  if (compareVersion && compareContent !== null) {
    const diffItems = computeLineDiff(compareContent, currentContent);
    const oldAst = safeParse(compareContent).ast;
    const newAst = safeParse(currentContent).ast;
    const stats = computeStatDeltas(oldAst ?? null, newAst ?? null);

    return (
      <div
        data-testid="history-compare-panel"
        className="absolute inset-0 bg-neutral-900/95 z-30 flex flex-col p-4 rounded-lg overflow-hidden"
      >
        <div className="flex items-center justify-between pb-3 border-b border-neutral-800">
          <div>
            <h3 className="text-sm font-semibold text-neutral-100">
              Comparing Version #{compareVersion.position} to Current
            </h3>
            <div data-testid="compare-stat-deltas" className="flex gap-3 text-xs mt-1 text-neutral-400">
              <span className={stats.nodeDelta >= 0 ? 'text-emerald-400' : 'text-rose-400'}>
                Nodes: {stats.nodeDelta >= 0 ? `+${stats.nodeDelta}` : stats.nodeDelta} ({stats.newNodeCount})
              </span>
              <span className={stats.edgeDelta >= 0 ? 'text-emerald-400' : 'text-rose-400'}>
                Edges: {stats.edgeDelta >= 0 ? `+${stats.edgeDelta}` : stats.edgeDelta} ({stats.newEdgeCount})
              </span>
            </div>
          </div>
          <button
            data-testid="btn-close-compare"
            onClick={onCloseCompare}
            className="px-2 py-1 text-xs text-neutral-400 hover:text-neutral-100 bg-neutral-800 rounded"
          >
            Close Compare
          </button>
        </div>

        <div
          data-testid="compare-diff-view"
          className="flex-1 overflow-auto mt-3 font-mono text-xs p-2 bg-neutral-950 rounded border border-neutral-800"
        >
          {diffItems.map((item, idx) => (
            <div
              key={idx}
              className={`px-1 py-0.5 whitespace-pre ${
                item.type === 'added'
                  ? 'bg-emerald-950/60 text-emerald-300'
                  : item.type === 'removed'
                  ? 'bg-rose-950/60 text-rose-300'
                  : 'text-neutral-400'
              }`}
            >
              {item.type === 'added' ? '+ ' : item.type === 'removed' ? '- ' : '  '}
              {item.text}
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (previewVersion && previewContent !== null) {
    return (
      <div
        data-testid="history-preview-panel"
        className="absolute inset-0 bg-neutral-900/95 z-30 flex flex-col p-4 rounded-lg overflow-hidden"
      >
        <div className="flex items-center justify-between pb-3 border-b border-neutral-800">
          <div>
            <h3 className="text-sm font-semibold text-neutral-100">
              Previewing Version #{previewVersion.position}
            </h3>
            <p className="text-xs text-neutral-400 mt-0.5">Hash: {previewVersion.hash.slice(0, 12)}...</p>
          </div>
          <button
            data-testid="btn-close-preview"
            onClick={onClosePreview}
            className="px-2 py-1 text-xs text-neutral-400 hover:text-neutral-100 bg-neutral-800 rounded"
          >
            Close Preview
          </button>
        </div>

        <pre
          data-testid="preview-source-code"
          className="flex-1 overflow-auto mt-3 font-mono text-xs p-3 bg-neutral-950 text-neutral-200 rounded border border-neutral-800"
        >
          {previewContent}
        </pre>
      </div>
    );
  }

  return null;
};
