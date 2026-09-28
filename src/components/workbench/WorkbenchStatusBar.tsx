import React from 'react';

interface WorkbenchStatusBarProps {
  activeTool: string;
  isWorkbenchDepressed: boolean;
  panelCount: number;
  contentId: string;
  saveStatusText?: string;
  isSessionOnly?: boolean;
  onRetryFlush?: () => void;
  onToggleFocal(): void;
}

export const WorkbenchStatusBar: React.FC<WorkbenchStatusBarProps> = ({
  activeTool,
  isWorkbenchDepressed,
  panelCount,
  contentId,
  saveStatusText,
  isSessionOnly,
  onRetryFlush,
  onToggleFocal,
}) => (
  <footer
    id="status-bar"
    className="h-6 bg-[#0f1117] border-t border-[#2e3446] px-3 flex items-center justify-between text-[11px] text-slate-400 select-none z-10"
    data-testid="status-bar"
  >
    <div className="flex items-center space-x-3">
      <span className="flex items-center font-medium text-slate-200">
        <span className="w-2 h-2 rounded-full bg-blue-500 mr-1.5"></span>
        Tool: <span className="ml-1 uppercase text-blue-400 font-bold">{activeTool.toUpperCase()}</span>
      </span>
      <span className="text-slate-500">|</span>
      <span>Cursor: X: 0.00, Y: 0.00</span>
      <span className="text-slate-500">|</span>
      <span>Nodes: 2 · Edges: 2</span>
      {saveStatusText && (
        <>
          <span className="text-slate-500">|</span>
          <span data-testid="status-save-state" className="flex items-center gap-1 text-slate-300">
            <span>{saveStatusText}</span>
            {isSessionOnly && onRetryFlush && (
              <button
                type="button"
                data-testid="status-retry-flush-btn"
                onClick={onRetryFlush}
                className="text-amber-400 underline hover:text-amber-300 ml-1 text-[10px]"
              >
                Retry
              </button>
            )}
          </span>
        </>
      )}
    </div>
    <div className="flex items-center space-x-3">
      <button
        data-testid="status-dockview-focal"
        onClick={onToggleFocal}
        className="hover:text-white transition-colors flex items-center space-x-1 px-1.5 py-0.5 rounded hover:bg-[#1a1d26]"
        title="Toggle Focal View (Depress/Restore Workbench)"
      >
        <span>⤢ Focal</span>
      </button>
      <span className="text-slate-500">|</span>
      <span
        data-testid="status-cid"
        className="font-mono text-emerald-400"
        title={contentId || 'No committed content ID'}
        aria-label={contentId ? `Content ID ${contentId}` : 'No committed content ID'}
      >
        CID: {contentId ? `${contentId.slice(0, 18)}…` : '—'}
      </span>
      <span className="text-slate-500">|</span>
      <span data-testid="panel-count-indicator">Dockview: {panelCount} panels</span>
      <span className="text-slate-500">|</span>
      <span className="text-slate-400">GPL-3.0</span>
    </div>
  </footer>
);
