/**
 * Export Diagram Modal Dialog for TikZiT Web (Sprint 18)
 * Allows exporting individual diagrams in TikZ (.tikz), Standalone TeX (.tex),
 * SVG (.svg), PNG (1x/2x/4x), and PDF (.pdf) formats.
 * Truthfully respects source choice (Current edits vs Saved version) and named style catalog.
 */

import React, { useState, useEffect, useRef } from 'react';
import { useStore } from '@nanostores/react';
import type { WorkbenchRuntime } from '../../services/createWorkbenchRuntime';
import { safeParse } from '../../core/parser/parser';

export interface ExportDiagramDialogProps {
  runtime: WorkbenchRuntime;
  onClose: () => void;
}

export type ExportFormat = 'tikz' | 'tex' | 'svg' | 'png' | 'pdf';
export type ExportSourceKind = 'current' | 'saved';

export const ExportDiagramDialog: React.FC<ExportDiagramDialogProps> = ({ runtime, onClose }) => {
  const dialogState = useStore(runtime.stores.$exportDialogState);
  const stylesCatalog = useStore(runtime.stores.$stylesCatalog);
  const styleFileName = useStore(runtime.stores.$styleFileName);

  const [format, setFormat] = useState<ExportFormat>('tikz');
  const [pngScale, setPngScale] = useState<1 | 2 | 4>(2);
  const [sourceKind, setSourceKind] = useState<ExportSourceKind>('current');
  const [isExporting, setIsExporting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [announcement, setAnnouncement] = useState('');

  const confirmBtnRef = useRef<HTMLButtonElement>(null);

  const targetTitle = dialogState.targetTitle || 'Untitled';
  const targetHandle = dialogState.targetHandle || '';
  const currentSource = dialogState.currentSource || '';
  const savedSource = dialogState.savedSource;
  const isDirty = dialogState.isDirty ?? false;
  const version = dialogState.version ?? 0;
  const isDraft = dialogState.isDraft ?? (version === 0);

  // Check if current source parses cleanly
  const parseResult = safeParse(currentSource);
  const isCurrentUnparseable = !parseResult.success;
  const parseError = parseResult.errors[0]?.message || 'Syntax error in TikZ source';

  // If dirty and current source cannot parse, auto-switch to saved if available and rendered format chosen
  const isRenderedFormat = format === 'svg' || format === 'png' || format === 'pdf';
  const isCurrentDisabled = isCurrentUnparseable && !isDraft;

  useEffect(() => {
    if (isDirty) {
      if (isCurrentDisabled && savedSource) {
        setSourceKind('saved');
      } else {
        setSourceKind('current');
      }
    } else {
      setSourceKind(savedSource ? 'saved' : 'current');
    }
  }, [isDirty, isCurrentDisabled, savedSource]);

  useEffect(() => {
    // Focus confirm button when dialog opens
    confirmBtnRef.current?.focus();

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  const catalogDisplayName =
    styleFileName && styleFileName !== '[no styles]' ? styleFileName : 'Default styles';

  const updateAnnouncement = (msg: string) => {
    setAnnouncement(msg);
    const curr = runtime.stores.$exportDialogState.get();
    runtime.stores.$exportDialogState.set({ ...curr, lastAnnouncement: msg });
  };

  const handleExport = async () => {
    setIsExporting(true);
    setErrorMessage(null);
    updateAnnouncement('Exporting diagram…');

    try {
      const result = await runtime.exportDiagramArtifact({
        handle: targetHandle,
        format,
        sourceKind,
        pngScale,
      });

      if (result.status === 'success') {
        const msg =
          result.method === 'picker'
            ? `Exported ${result.filename}`
            : `Exported ${result.filename} via browser download`;
        updateAnnouncement(msg);
        setIsExporting(false);
        onClose();
      } else if (result.status === 'cancelled') {
        updateAnnouncement('Export cancelled');
        setIsExporting(false);
      } else {
        const err = result.error || 'Failed to write exported file';
        setErrorMessage(err);
        updateAnnouncement(`Failed to export: ${err}`);
        setIsExporting(false);
      }
    } catch (err: any) {
      const msg = err instanceof Error ? err.message : String(err);
      setErrorMessage(msg);
      updateAnnouncement(`Failed to export: ${msg}`);
      setIsExporting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget && !isExporting) {
          onClose();
        }
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="export-dialog-title"
        data-testid="export-diagram-dialog"
        className="w-full max-w-md bg-[#1e2330] border border-[#3b455e] rounded-lg shadow-2xl overflow-hidden flex flex-col text-slate-200 text-sm font-sans"
      >
        {/* Header */}
        <div className="px-5 py-3.5 border-b border-[#2d3548] flex items-center justify-between bg-[#171b26]">
          <h2 id="export-dialog-title" data-testid="export-dialog-title" className="font-semibold text-white truncate">
            Export Diagram: <span className="text-blue-400">{targetTitle}</span>
          </h2>
          <button
            type="button"
            onClick={onClose}
            disabled={isExporting}
            className="text-slate-400 hover:text-white px-1.5 py-0.5 rounded text-sm transition-colors"
            title="Close dialog"
          >
            ✕
          </button>
        </div>

        {/* Content */}
        <div className="p-5 space-y-4">
          {/* Style Catalog Info */}
          <div className="text-xs text-slate-400 flex items-center justify-between bg-[#151922] px-3 py-2 rounded border border-[#2b3348]">
            <span>Active Styles:</span>
            <span data-testid="export-styles-name" className="font-medium text-slate-200">
              {catalogDisplayName}
            </span>
          </div>

          {/* Source Selection (when dirty or alternatives exist) */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
              Source Version
            </label>
            {isDirty && savedSource ? (
              <div className="grid grid-cols-2 gap-2" data-testid="export-source-select">
                <label
                  className={`flex flex-col p-2.5 rounded border cursor-pointer transition-colors ${
                    sourceKind === 'current'
                      ? 'bg-blue-900/30 border-blue-500 text-white'
                      : 'bg-[#181c27] border-[#2d3548] text-slate-300 hover:border-slate-500'
                  } ${isCurrentDisabled ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  <div className="flex items-center gap-2">
                    <input
                      type="radio"
                      name="export-source"
                      data-testid="source-current-edits"
                      value="current"
                      checked={sourceKind === 'current'}
                      disabled={isCurrentDisabled}
                      onChange={() => setSourceKind('current')}
                      className="accent-blue-500"
                    />
                    <span className="font-medium text-xs">Current edits</span>
                  </div>
                  <span className="text-[10px] text-amber-400/90 ml-5 font-mono">Unsaved edits</span>
                </label>

                <label
                  className={`flex flex-col p-2.5 rounded border cursor-pointer transition-colors ${
                    sourceKind === 'saved'
                      ? 'bg-blue-900/30 border-blue-500 text-white'
                      : 'bg-[#181c27] border-[#2d3548] text-slate-300 hover:border-slate-500'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <input
                      type="radio"
                      name="export-source"
                      data-testid="source-saved-version"
                      value="saved"
                      checked={sourceKind === 'saved'}
                      onChange={() => setSourceKind('saved')}
                      className="accent-blue-500"
                    />
                    <span className="font-medium text-xs">Saved version (v{version})</span>
                  </div>
                  <span className="text-[10px] text-slate-400 ml-5 font-mono">Committed head</span>
                </label>
              </div>
            ) : isDraft ? (
              <div className="text-xs text-slate-400 bg-[#181c27] px-3 py-2 rounded border border-[#2d3548] flex items-center justify-between">
                <span>Source:</span>
                <span className="text-amber-300 font-mono text-[11px]">Current edits (Draft diagram)</span>
              </div>
            ) : (
              <div className="text-xs text-slate-400 bg-[#181c27] px-3 py-2 rounded border border-[#2d3548] flex items-center justify-between">
                <span>Source:</span>
                <span className="text-emerald-300 font-mono text-[11px]">Saved version (v{version})</span>
              </div>
            )}

            {/* Parse error warning if current edits are unparseable */}
            {isCurrentUnparseable && (
              <div
                data-testid="export-parse-error"
                className="text-[11px] text-red-300 bg-red-950/40 border border-red-800/60 p-2 rounded"
              >
                ⚠️ Current edits contain syntax errors: {parseError}
                {savedSource && <span> (Using saved version is recommended)</span>}
              </div>
            )}
          </div>

          {/* Format Selection */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
              Export Format
            </label>
            <div className="grid grid-cols-2 gap-2" data-testid="export-format-select">
              <label
                className={`flex items-center gap-2 p-2.5 rounded border cursor-pointer transition-colors ${
                  format === 'tikz'
                    ? 'bg-blue-900/30 border-blue-500 text-white'
                    : 'bg-[#181c27] border-[#2d3548] text-slate-300 hover:border-slate-500'
                }`}
              >
                <input
                  type="radio"
                  name="export-format"
                  data-testid="format-tikz"
                  value="tikz"
                  checked={format === 'tikz'}
                  onChange={() => setFormat('tikz')}
                  className="accent-blue-500"
                />
                <div className="flex flex-col">
                  <span className="font-medium text-xs">TikZ (.tikz)</span>
                  <span className="text-[10px] text-slate-400">Verbatim snippet</span>
                </div>
              </label>

              <label
                className={`flex items-center gap-2 p-2.5 rounded border cursor-pointer transition-colors ${
                  format === 'tex'
                    ? 'bg-blue-900/30 border-blue-500 text-white'
                    : 'bg-[#181c27] border-[#2d3548] text-slate-300 hover:border-slate-500'
                }`}
              >
                <input
                  type="radio"
                  name="export-format"
                  data-testid="format-tex"
                  value="tex"
                  checked={format === 'tex'}
                  onChange={() => setFormat('tex')}
                  className="accent-blue-500"
                />
                <div className="flex flex-col">
                  <span className="font-medium text-xs">LaTeX (.tex)</span>
                  <span className="text-[10px] text-slate-400">Standalone document</span>
                </div>
              </label>

              <label
                className={`flex items-center gap-2 p-2.5 rounded border cursor-pointer transition-colors ${
                  format === 'svg'
                    ? 'bg-blue-900/30 border-blue-500 text-white'
                    : 'bg-[#181c27] border-[#2d3548] text-slate-300 hover:border-slate-500'
                }`}
              >
                <input
                  type="radio"
                  name="export-format"
                  data-testid="format-svg"
                  value="svg"
                  checked={format === 'svg'}
                  onChange={() => setFormat('svg')}
                  className="accent-blue-500"
                />
                <div className="flex flex-col">
                  <span className="font-medium text-xs">SVG (.svg)</span>
                  <span className="text-[10px] text-slate-400">Vector graphic</span>
                </div>
              </label>

              <label
                className={`flex items-center gap-2 p-2.5 rounded border cursor-pointer transition-colors ${
                  format === 'png'
                    ? 'bg-blue-900/30 border-blue-500 text-white'
                    : 'bg-[#181c27] border-[#2d3548] text-slate-300 hover:border-slate-500'
                }`}
              >
                <input
                  type="radio"
                  name="export-format"
                  data-testid="format-png"
                  value="png"
                  checked={format === 'png'}
                  onChange={() => setFormat('png')}
                  className="accent-blue-500"
                />
                <div className="flex flex-col">
                  <span className="font-medium text-xs">PNG (.png)</span>
                  <span className="text-[10px] text-slate-400">Raster image</span>
                </div>
              </label>

              <label
                className={`flex items-center gap-2 p-2.5 rounded border cursor-pointer transition-colors col-span-2 ${
                  format === 'pdf'
                    ? 'bg-blue-900/30 border-blue-500 text-white'
                    : 'bg-[#181c27] border-[#2d3548] text-slate-300 hover:border-slate-500'
                }`}
              >
                <input
                  type="radio"
                  name="export-format"
                  data-testid="format-pdf"
                  value="pdf"
                  checked={format === 'pdf'}
                  onChange={() => setFormat('pdf')}
                  className="accent-blue-500"
                />
                <div className="flex flex-col">
                  <span className="font-medium text-xs">PDF (.pdf)</span>
                  <span className="text-[10px] text-slate-400">Vector document (PDF 1.4)</span>
                </div>
              </label>
            </div>

            {/* PNG Scale Option */}
            {format === 'png' && (
              <div className="flex items-center justify-between bg-[#151922] px-3 py-2 rounded border border-[#2b3348] mt-2">
                <span className="text-xs text-slate-300">Resolution Scale:</span>
                <select
                  data-testid="export-png-scale"
                  value={pngScale}
                  onChange={(e) => setPngScale(Number(e.target.value) as 1 | 2 | 4)}
                  className="bg-[#202534] border border-[#3b455e] rounded px-2 py-1 text-xs text-white focus:outline-none focus:border-blue-500"
                >
                  <option value={1}>1× (Standard Web)</option>
                  <option value={2}>2× (Retina High-DPI)</option>
                  <option value={4}>4× (Print 300+ DPI)</option>
                </select>
              </div>
            )}
          </div>

          {/* Error Message */}
          {errorMessage && (
            <div
              data-testid="export-error"
              className="text-xs text-red-300 bg-red-950/60 border border-red-700/80 p-2.5 rounded flex items-center justify-between"
            >
              <span>{errorMessage}</span>
              <button
                type="button"
                data-testid="btn-retry-export"
                onClick={handleExport}
                className="underline text-red-200 hover:text-white ml-2 text-xs"
              >
                Retry
              </button>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-[#2d3548] flex items-center justify-end gap-2.5 bg-[#171b26]">
          <button
            type="button"
            data-testid="btn-cancel-export"
            onClick={onClose}
            disabled={isExporting}
            className="px-3.5 py-1.5 rounded text-xs text-slate-300 hover:text-white bg-[#252a3a] hover:bg-[#31374c] transition-colors"
          >
            Cancel
          </button>
          <button
            ref={confirmBtnRef}
            type="button"
            data-testid="btn-confirm-export"
            onClick={handleExport}
            disabled={isExporting || (isRenderedFormat && sourceKind === 'current' && isCurrentUnparseable)}
            aria-busy={isExporting}
            className="px-4 py-1.5 rounded text-xs bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium shadow-sm transition-colors flex items-center gap-1.5"
          >
            {isExporting ? 'Exporting…' : 'Export'}
          </button>
        </div>

      </div>
    </div>
  );
};
