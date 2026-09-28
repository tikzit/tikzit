import React, { useState } from 'react';

export interface CloseTabDialogProps {
  documentTitle: string;
  isBulk?: boolean;
  onSave: (applyToAll: boolean) => void;
  onDiscard: (applyToAll: boolean) => void;
  onCancel: () => void;
}

export const CloseTabDialog: React.FC<CloseTabDialogProps> = ({
  documentTitle,
  isBulk = false,
  onSave,
  onDiscard,
  onCancel,
}) => {
  const [applyToAll, setApplyToAll] = useState(false);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="close-dialog-title"
      data-testid="close-dirty-dialog"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
    >
      <div className="bg-[#242836] border border-[#3b4256] rounded-lg shadow-2xl p-5 w-96 max-w-full text-slate-200 space-y-4">
        <h3 id="close-dialog-title" className="text-sm font-semibold text-white">
          Unsaved Changes
        </h3>
        <p className="text-xs text-slate-300">
          Do you want to save the changes you made to <span className="font-semibold text-white font-mono">{documentTitle}</span> before closing? Edits will be lost if discarded.
        </p>

        {isBulk && (
          <div className="flex items-center gap-2 pt-1 text-xs text-slate-300 select-none">
            <input
              type="checkbox"
              id="checkbox-apply-all"
              data-testid="checkbox-apply-all"
              checked={applyToAll}
              onChange={(e) => setApplyToAll(e.target.checked)}
              className="rounded bg-[#161922] border-[#3b4256] text-blue-600 focus:ring-0"
            />
            <label htmlFor="checkbox-apply-all" className="cursor-pointer">
              Apply to all remaining documents
            </label>
          </div>
        )}

        <div className="flex items-center justify-end gap-2 pt-2">
          <button
            type="button"
            data-testid="btn-close-cancel"
            onClick={onCancel}
            className="px-3 py-1.5 rounded text-xs bg-[#1a1d27] hover:bg-[#2e3446] text-slate-300 transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            data-testid="btn-close-discard"
            onClick={() => onDiscard(applyToAll)}
            className="px-3 py-1.5 rounded text-xs bg-red-950/80 hover:bg-red-800/80 text-red-200 border border-red-800 transition-colors"
          >
            Discard
          </button>
          <button
            type="button"
            data-testid="btn-close-save"
            onClick={() => onSave(applyToAll)}
            className="px-3 py-1.5 rounded text-xs bg-blue-600 hover:bg-blue-500 text-white font-medium transition-colors"
          >
            Save
          </button>
        </div>
      </div>
    </div>
  );
};
