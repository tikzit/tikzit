/**
 * src/components/workbench/commandbar/DocumentTitleBar.tsx - Sprint 22
 * Active document title bar, dirty indicator, doc badge, save status, and tab close button.
 * Preserves Contract B selectors:
 * - mac-window-title
 * - doc-tab-title
 * - doc-type-badge
 * - doc-save-status
 * - doc-retry-flush-btn
 * - diagram-save-error
 * - btn-close-tab
 */
import React from 'react';
import {
  DocumentSaveButton,
  NewDiagramButton,
  type DocumentSaveButtonProps,
} from './DocumentActionButtons';

export interface DocumentTitleBarProps extends DocumentSaveButtonProps {
  documentTitle: string;
  isDirty?: boolean;
  docBadge?: 'Draft' | 'Diagram' | 'Example';
  saveStatusText?: string;
  saveError?: string;
  isSessionOnly?: boolean;
  onRetryFlush?: () => void;
  onCloseActiveTab?: () => void;
  onNewDiagram: () => void;
}

export const DocumentTitleBar: React.FC<DocumentTitleBarProps> = ({
  documentTitle,
  isDirty = false,
  docBadge,
  saveStatusText,
  saveError,
  isSessionOnly = false,
  onRetryFlush,
  buttonKind = 'none',
  buttonLabel,
  buttonTooltip,
  isSaving = false,
  onSave,
  showSuccessPill = false,
  onCloseActiveTab,
  onNewDiagram,
}) => {
  const baseTitle = documentTitle.replace(/\*$/, '').replace(/ - TikZiT$/, '');
  const formattedTitle = `${baseTitle}${isDirty ? '*' : ''} - TikZiT`;

  return (
    <div className="flex items-center space-x-2 z-10 min-w-0">
      <div data-testid="mac-window-title" className="flex items-center min-w-0">
        <span
          data-testid="doc-tab-title"
          className="text-xs px-3 py-1 rounded bg-[#1e1e1e] text-slate-200 border border-[#383838] font-medium tracking-wide flex items-center shadow-inner gap-2 max-w-full"
        >
          <span className="truncate max-w-[120px] sm:max-w-[200px] md:max-w-[280px]" title={formattedTitle}>
            {formattedTitle}
          </span>

          {docBadge && (
            <span
              data-testid="doc-type-badge"
              className={`px-1 text-[9px] rounded font-mono shrink-0 ${
                docBadge === 'Draft'
                  ? 'bg-amber-950/70 text-amber-300 border border-amber-800'
                  : docBadge === 'Diagram'
                  ? 'bg-blue-950/70 text-blue-300 border border-blue-800'
                  : 'bg-purple-950/70 text-purple-300 border border-purple-800'
              }`}
            >
              {docBadge}
            </span>
          )}

          {saveStatusText && (
            <span data-testid="doc-save-status" className="text-[10px] text-slate-400 font-normal flex items-center gap-1 shrink-0">
              <span>{saveStatusText}</span>
              {isSessionOnly && onRetryFlush && (
                <button
                  type="button"
                  data-testid="doc-retry-flush-btn"
                  onClick={(e) => {
                    e.stopPropagation();
                    onRetryFlush();
                  }}
                  className="text-amber-400 underline hover:text-amber-300 ml-1 text-[9px]"
                >
                  Retry
                </button>
              )}
            </span>
          )}

          {saveError && (
            <span
              data-testid="diagram-save-error"
              className="text-[10px] text-red-400 font-normal truncate max-w-[140px] shrink-0"
              title={saveError}
            >
              {saveError}
            </span>
          )}

          <DocumentSaveButton
            buttonKind={buttonKind}
            buttonLabel={buttonLabel}
            buttonTooltip={buttonTooltip}
            isSaving={isSaving}
            onSave={onSave}
            showSuccessPill={showSuccessPill}
          />

          {onCloseActiveTab && (
            <button
              type="button"
              data-testid="btn-close-tab"
              aria-label={`Close ${baseTitle}`}
              onClick={(e) => {
                e.stopPropagation();
                onCloseActiveTab();
              }}
              className="ml-1 text-slate-400 hover:text-red-400 px-1 rounded hover:bg-white/10 transition-colors text-xs font-semibold shrink-0"
              title="Close tab"
            >
              ✕
            </button>
          )}
        </span>
      </div>

      <NewDiagramButton onNewDiagram={onNewDiagram} />
    </div>
  );
};
