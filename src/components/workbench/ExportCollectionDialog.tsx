/**
 * Export Collection Confirmation Modal Dialog for TikZiT Web (Sprint 19)
 * Renders verified collection export scope, counts, exclusions (Decision D3),
 * destination filename, and progress states (Verifying… → Writing…).
 */

import React, { useState, useEffect, useRef } from 'react';
import { useStore } from '@nanostores/react';
import type { WorkbenchRuntime } from '../../services/createWorkbenchRuntime';

export interface ExportCollectionDialogProps {
  runtime: WorkbenchRuntime;
  onClose: () => void;
}

export const ExportCollectionDialog: React.FC<ExportCollectionDialogProps> = ({ runtime, onClose }) => {
  const dialogState = useStore(runtime.stores.$exportCollectionDialogState);
  const [isExporting, setIsExporting] = useState(false);
  const [customFilename, setCustomFilename] = useState('');
  const confirmBtnRef = useRef<HTMLButtonElement>(null);

  const summary = dialogState.summary;
  const filename = customFilename || dialogState.filename || summary?.defaultFilename || 'tikzit-diagrams.db';

  useEffect(() => {
    if (dialogState.isOpen) {
      setIsExporting(false);
      if (dialogState.filename) {
        setCustomFilename(dialogState.filename);
      }
      setTimeout(() => {
        confirmBtnRef.current?.focus();
      }, 50);
    }
  }, [dialogState.isOpen, dialogState.filename]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        if (!isExporting) {
          onClose();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isExporting, onClose]);

  if (!dialogState.isOpen) return null;

  const handleExport = async () => {
    setIsExporting(true);
    try {
      await runtime.exportCollectionArtifact();
    } finally {
      setIsExporting(false);
    }
  };

  const isDone = dialogState.outcome === 'saved' || dialogState.outcome === 'fallback';

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="collection-export-title"
      data-testid="export-collection-dialog"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 select-none"
      onClick={(e) => {
        if (e.target === e.currentTarget && !isExporting) {
          onClose();
        }
      }}
    >
      <div className="w-full max-w-lg rounded-xl border border-[#3b4256] bg-[#1a1d26] text-slate-200 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#2e3446] px-5 py-3.5 bg-[#141720]">
          <div className="flex items-center gap-2">
            <span className="text-blue-400 font-mono text-sm">📦</span>
            <h2 id="collection-export-title" data-testid="collection-export-title" className="text-sm font-semibold tracking-wide text-white">
              Export Diagram Collection
            </h2>
          </div>
          <button
            type="button"
            aria-label="Close dialog"
            onClick={onClose}
            disabled={isExporting}
            className="rounded p-1 text-slate-400 hover:text-white hover:bg-[#252a38] transition-colors disabled:opacity-50"
          >
            ✕
          </button>
        </div>

        {/* Body */}
        <div className="p-5 space-y-4 overflow-y-auto text-xs">
          {/* Scope statement */}
          <div className="space-y-1.5">
            <span className="text-[11px] font-semibold text-slate-300 uppercase tracking-wider">
              Export Scope
            </span>
            <div
              data-testid="collection-scope-info"
              className="p-3 rounded-lg bg-[#202534] border border-[#2e3446] text-slate-300 leading-relaxed space-y-1"
            >
              <p>
                Every diagram handle, companion metadata handle, and its complete lineage closure will be compiled into a sovereign SQLite 3 database.
              </p>
              <div className="text-[11px] text-blue-300 font-mono">
                Scope: All diagrams ({summary?.diagramsCount ?? 0}), including {summary?.archivedCount ?? 0} archived.
              </div>
            </div>
          </div>

          {/* Counts breakdown */}
          <div className="space-y-1.5">
            <span className="text-[11px] font-semibold text-slate-300 uppercase tracking-wider">
              Included Records
            </span>
            <div className="grid grid-cols-3 gap-2">
              <div
                data-testid="collection-counts-diagrams"
                className="p-3 rounded-lg bg-[#202534] border border-[#2e3446] flex flex-col gap-1 text-center"
              >
                <span className="text-lg font-mono font-bold text-white">
                  {summary?.diagramsCount ?? 0}
                </span>
                <span className="text-[10px] text-slate-400 uppercase tracking-wider">Diagrams</span>
              </div>
              <div
                data-testid="collection-counts-versions"
                className="p-3 rounded-lg bg-[#202534] border border-[#2e3446] flex flex-col gap-1 text-center"
              >
                <span className="text-lg font-mono font-bold text-white">
                  {summary?.versionsCount ?? 0}
                </span>
                <span className="text-[10px] text-slate-400 uppercase tracking-wider">Versions</span>
              </div>
              <div
                data-testid="collection-counts-cards"
                className="p-3 rounded-lg bg-[#202534] border border-[#2e3446] flex flex-col gap-1 text-center"
              >
                <span className="text-lg font-mono font-bold text-white">
                  {summary?.totalCardsCount ?? 0}
                </span>
                <span className="text-[10px] text-slate-400 uppercase tracking-wider">Total Cards</span>
              </div>
            </div>
          </div>

          {/* Excluded records (Decision D3) */}
          <div className="space-y-1.5">
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
              Excluded from Database
            </span>
            <div className="p-2.5 rounded-lg bg-[#141720] border border-[#262c3b] space-y-1 text-[11px] text-slate-400">
              <div data-testid="collection-excluded-orphans" className="flex items-center gap-1.5">
                <span className="text-slate-500 font-mono">•</span>
                <span>{summary?.orphanCardsCount ?? 0} unrelated cards not included</span>
              </div>
              <div data-testid="collection-excluded-receipts" className="flex items-center gap-1.5">
                <span className="text-slate-500 font-mono">•</span>
                <span>{summary?.excludedReceiptsCount ?? 0} execution receipts excluded</span>
              </div>
              <div data-testid="collection-excluded-knowledge" className="flex items-center gap-1.5">
                <span className="text-slate-500 font-mono">•</span>
                <span>{summary?.excludedKnowledgeCount ?? 0} knowledge records excluded</span>
              </div>
            </div>
          </div>

          {/* Destination filename */}
          <div className="space-y-1.5">
            <label htmlFor="collection-filename-input" className="text-[11px] font-semibold text-slate-300 uppercase tracking-wider">
              Destination Filename
            </label>
            <div className="relative">
              <input
                id="collection-filename-input"
                data-testid="collection-destination-filename"
                type="text"
                value={filename}
                disabled={isExporting || isDone}
                onChange={(e) => {
                  setCustomFilename(e.target.value);
                  const curr = runtime.stores.$exportCollectionDialogState.get();
                  runtime.stores.$exportCollectionDialogState.set({ ...curr, filename: e.target.value });
                }}
                className="w-full px-3 py-2 rounded-lg bg-[#0d1117] border border-[#30363d] text-white text-xs font-mono focus:outline-none focus:border-blue-500 disabled:opacity-60"
              />
            </div>
          </div>

          {/* Progress / Status banner */}
          {dialogState.progress === 'verifying' && (
            <div data-testid="collection-progress-state" role="status" className="p-3 rounded-lg bg-blue-950/60 border border-blue-800 text-blue-200 text-xs flex items-center gap-2">
              <div className="w-3.5 h-3.5 border-2 border-blue-400 border-t-transparent rounded-full animate-spin shrink-0" />
              <span>Verifying… (Checking card cryptographic hashes and lineage closure)</span>
            </div>
          )}

          {dialogState.progress === 'writing' && (
            <div data-testid="collection-progress-state" role="status" className="p-3 rounded-lg bg-blue-950/60 border border-blue-800 text-blue-200 text-xs flex items-center gap-2">
              <div className="w-3.5 h-3.5 border-2 border-blue-400 border-t-transparent rounded-full animate-spin shrink-0" />
              <span>Writing… (Compiling SQLite 3 database)</span>
            </div>
          )}

          {/* Error outcomes */}
          {(dialogState.outcome === 'verification-failed' || dialogState.outcome === 'write-failed') && (
            <div data-testid="collection-export-error" role="alert" className="p-3 rounded-lg bg-red-950/70 border border-red-700 text-red-200 text-xs space-y-1">
              <div className="font-semibold flex items-center gap-1.5">
                <span>⚠️</span>
                <span>{dialogState.outcome === 'verification-failed' ? 'Verification Failed' : 'Write Failed'}</span>
              </div>
              <p className="text-red-300 font-mono text-[11px] break-all">
                {dialogState.errorMessage || 'Export failed closed.'}
              </p>
              {dialogState.failingHandle && (
                <div className="text-[11px] text-amber-300 font-mono">
                  Failed on handle: {dialogState.failingHandle}
                </div>
              )}
            </div>
          )}

          {/* Success outcome */}
          {isDone && (
            <div data-testid="collection-export-success" role="status" className="p-3 rounded-lg bg-emerald-950/70 border border-emerald-700 text-emerald-200 text-xs space-y-1">
              <div className="font-semibold flex items-center gap-1.5">
                <span>✓</span>
                <span>
                  {dialogState.outcome === 'saved'
                    ? `Collection saved to ${dialogState.filename ?? filename}.`
                    : `Collection downloaded as ${dialogState.filename ?? filename} via browser fallback.`}
                </span>
              </div>
              {dialogState.receiptPersisted === false && (
                <div className="text-[11px] text-amber-300">
                  Note: Export receipt was not persisted to local execution log.
                </div>
              )}
            </div>
          )}

          {/* Cancelled outcome */}
          {dialogState.outcome === 'cancelled' && (
            <div data-testid="collection-export-cancelled" role="status" className="p-3 rounded-lg bg-slate-800/80 border border-slate-700 text-slate-300 text-xs">
              Export cancelled.
            </div>
          )}
        </div>

        {/* Live announcer */}
        <div data-testid="collection-live-announcer" role="status" aria-live="polite" className="sr-only">
          {dialogState.lastAnnouncement || ''}
        </div>

        {/* Footer actions */}
        <div className="flex items-center justify-end gap-2 px-5 py-3.5 border-t border-[#2e3446] bg-[#141720]">
          <button
            type="button"
            data-testid="btn-cancel-collection-export"
            onClick={onClose}
            disabled={isExporting}
            className="px-3.5 py-1.5 rounded-lg border border-[#3b4256] text-xs font-medium text-slate-300 hover:bg-[#252a38] transition-colors disabled:opacity-50"
          >
            {isDone ? 'Close' : 'Cancel'}
          </button>
          {!isDone && (
            <button
              ref={confirmBtnRef}
              type="button"
              data-testid="btn-confirm-collection-export"
              onClick={handleExport}
              disabled={isExporting || !summary}
              className="px-4 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold shadow-md transition-colors disabled:opacity-50 flex items-center gap-1.5"
            >
              {isExporting ? (
                <>
                  <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Exporting…</span>
                </>
              ) : (
                <span>Export Collection</span>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
