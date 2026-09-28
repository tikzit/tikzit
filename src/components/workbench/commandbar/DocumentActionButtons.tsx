/**
 * src/components/workbench/commandbar/DocumentActionButtons.tsx - Sprint 22
 * Action buttons for document persistence, new diagram tab, and version history popover.
 * Preserves Contract B selectors:
 * - draft-save-success-pill
 * - btn-save-draft
 * - btn-save-diagram
 * - btn-new-diagram
 * - btn-version-history
 */
import React from 'react';
import type { WorkbenchRuntime } from '../../../services/createWorkbenchRuntime';
import { VersionPopover } from '../panels/VersionPopover';

export interface DocumentSaveButtonProps {
  buttonKind?: 'save-draft' | 'save-diagram' | 'none';
  buttonLabel?: string;
  buttonTooltip?: string;
  isSaving?: boolean;
  onSave?: () => void;
  showSuccessPill?: boolean;
}

export const DocumentSaveButton: React.FC<DocumentSaveButtonProps> = ({
  buttonKind = 'none',
  buttonLabel,
  buttonTooltip,
  isSaving = false,
  onSave,
  showSuccessPill = false,
}) => {
  const isMac = typeof navigator !== 'undefined' && /Mac|iPod|iPhone|iPad/.test(navigator.platform);
  const shortcutText = isMac ? '⌘S' : 'Ctrl+S';

  if (showSuccessPill) {
    return (
      <span
        data-testid="draft-save-success-pill"
        className="px-2 py-0.5 text-xs rounded-md bg-emerald-950/80 text-emerald-300 border border-emerald-700 font-medium flex items-center gap-1 shadow-sm shrink-0"
      >
        ✓ Saved to MCard
      </span>
    );
  }

  if (buttonKind === 'save-draft') {
    return (
      <button
        type="button"
        data-testid="btn-save-draft"
        disabled={isSaving}
        aria-busy={isSaving}
        onClick={(e) => {
          e.stopPropagation();
          onSave?.();
        }}
        title={buttonTooltip || 'Save this diagram to MCard history in this browser'}
        className="px-2.5 py-1 text-xs rounded bg-blue-600 hover:bg-blue-500 text-white font-medium shadow-sm transition-colors flex items-center gap-1.5 shrink-0 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <span>{isSaving ? 'Saving…' : (buttonLabel || 'Save to MCard')}</span>
        {!isSaving && (
          <kbd className="hidden sm:inline-block text-[10px] bg-blue-700/60 px-1 py-0.5 rounded border border-blue-400/30 font-mono">
            {shortcutText}
          </kbd>
        )}
      </button>
    );
  }

  if (buttonKind === 'save-diagram') {
    return (
      <button
        type="button"
        data-testid="btn-save-diagram"
        disabled={isSaving}
        aria-busy={isSaving}
        onClick={(e) => {
          e.stopPropagation();
          onSave?.();
        }}
        title={buttonTooltip || 'Save changes to MCard history'}
        className="px-2 py-0.5 text-xs rounded bg-blue-700/80 hover:bg-blue-600 text-white font-medium transition-colors flex items-center gap-1 shrink-0 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <span>{isSaving ? 'Saving…' : (buttonLabel || 'Save')}</span>
        {!isSaving && (
          <kbd className="hidden sm:inline-block text-[10px] bg-blue-800/60 px-1 py-0.5 rounded border border-blue-500/30 font-mono">
            {shortcutText}
          </kbd>
        )}
      </button>
    );
  }

  return null;
};

export interface NewDiagramButtonProps {
  onNewDiagram: () => void;
}

export const NewDiagramButton: React.FC<NewDiagramButtonProps> = ({ onNewDiagram }) => {
  return (
    <button
      type="button"
      onClick={onNewDiagram}
      data-testid="btn-new-diagram"
      className="text-xs px-2 py-1 rounded bg-[#333333] hover:bg-[#444444] text-slate-200 hover:text-white border border-[#444444] transition-colors"
      title="Create new diagram (Cmd+N)"
    >
      +
    </button>
  );
};

export interface VersionHistoryButtonProps {
  showVersionPopover: boolean;
  onToggleVersionPopover: () => void;
  runtime?: WorkbenchRuntime;
  activeDocId?: string;
}

export const VersionHistoryButton: React.FC<VersionHistoryButtonProps> = ({
  showVersionPopover,
  onToggleVersionPopover,
  runtime,
  activeDocId,
}) => {
  return (
    <div className="relative">
      <button
        type="button"
        onClick={onToggleVersionPopover}
        data-testid="btn-version-history"
        className="text-xs text-slate-300 hover:text-white px-2 py-1 rounded bg-[#333333] hover:bg-[#444444] border border-[#444444] transition-colors flex items-center space-x-1"
        title="Version History & MCard Lineage"
      >
        <span>🕒 History</span>
      </button>
      {showVersionPopover && (
        <VersionPopover
          runtime={runtime}
          documentId={activeDocId || ''}
          onClose={onToggleVersionPopover}
        />
      )}
    </div>
  );
};
