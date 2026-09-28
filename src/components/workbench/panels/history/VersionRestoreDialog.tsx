/**
 * src/components/workbench/panels/history/VersionRestoreDialog.tsx - Sprint 22
 * Confirmation and Save-First dialogs for version restoration with Contract B selectors.
 */
import React from 'react';
import type { HistoryRow } from '../../../../services/clm/documentCommitService';

export interface VersionRestoreDialogProps {
  mode: 'clean' | 'dirty';
  target: HistoryRow;
  isRestoring: boolean;
  onConfirmClean: () => void;
  onSaveFirst: () => void;
  onDiscardAndRestore: () => void;
  onCancel: () => void;
}

export const VersionRestoreDialog: React.FC<VersionRestoreDialogProps> = ({
  mode,
  target,
  isRestoring,
  onConfirmClean,
  onSaveFirst,
  onDiscardAndRestore,
  onCancel,
}) => {
  if (mode === 'clean') {
    return (
      <div
        data-testid="restore-confirm-dialog"
        className="absolute inset-0 bg-neutral-900/90 z-20 flex flex-col items-center justify-center p-4 text-center rounded-lg"
      >
        <p className="text-sm font-medium text-neutral-100 mb-2">
          Restore to position #{target.position}?
        </p>
        <p className="text-xs text-neutral-400 mb-4 max-w-xs">
          This will append a new commit restoring the content from this revision.
        </p>
        <div className="flex gap-2">
          <button
            data-testid="btn-cancel-restore"
            onClick={onCancel}
            disabled={isRestoring}
            className="px-3 py-1.5 text-xs bg-neutral-800 hover:bg-neutral-700 text-neutral-300 rounded border border-neutral-700"
          >
            Cancel
          </button>
          <button
            data-testid="btn-confirm-restore"
            onClick={onConfirmClean}
            disabled={isRestoring}
            className="px-3 py-1.5 text-xs bg-sky-600 hover:bg-sky-500 text-white rounded font-medium disabled:opacity-50"
          >
            {isRestoring ? 'Restoring...' : 'Restore'}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div
      data-testid="restore-dirty-dialog"
      className="absolute inset-0 bg-neutral-900/90 z-20 flex flex-col items-center justify-center p-4 text-center rounded-lg"
    >
      <p className="text-sm font-medium text-amber-300 mb-2">Unsaved Edits in Buffer</p>
      <p className="text-xs text-neutral-400 mb-4 max-w-xs">
        You have unsaved changes in the active diagram. Choose how to handle your current edits before restoring:
      </p>
      <div className="flex flex-col gap-2 w-full max-w-xs">
        <button
          data-testid="btn-restore-save-first"
          onClick={onSaveFirst}
          disabled={isRestoring}
          className="px-3 py-1.5 text-xs bg-sky-600 hover:bg-sky-500 text-white rounded font-medium disabled:opacity-50"
        >
          {isRestoring ? 'Saving & Restoring...' : 'Save Current First, Then Restore'}
        </button>
        <button
          data-testid="btn-restore-discard"
          onClick={onDiscardAndRestore}
          disabled={isRestoring}
          className="px-3 py-1.5 text-xs bg-rose-700 hover:bg-rose-600 text-white rounded font-medium disabled:opacity-50"
        >
          Discard Edits & Restore
        </button>
        <button
          data-testid="btn-restore-cancel"
          onClick={onCancel}
          disabled={isRestoring}
          className="px-3 py-1 text-xs text-neutral-400 hover:text-neutral-200"
        >
          Cancel
        </button>
      </div>
    </div>
  );
};
