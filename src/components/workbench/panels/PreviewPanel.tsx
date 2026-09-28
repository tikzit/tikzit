/**
 * src/components/workbench/panels/PreviewPanel.tsx - Sprint 22
 * Decomposed PreviewPanel container (< 180 LOC) composing:
 * - PreviewStage
 * - PreviewToolbar
 * - PreviewCompiler
 */
import React, { useState, useEffect, useCallback } from 'react';
import type { IDockviewPanelProps } from 'dockview-react';
import { useStore } from '@nanostores/react';
import { useWorkbenchRuntime } from '../WorkbenchRuntimeContext';
import { $graphAST as defaultGraphAST, $stylesCatalog as defaultStylesCatalog } from '../../../stores/workbench';
import { compileAstToSvg } from './preview/PreviewCompiler';
import { PreviewStage } from './preview/PreviewStage';
import { PreviewToolbar } from './preview/PreviewToolbar';
import { emitTikz } from '../../../core/parser/emitter';

export const PreviewPanel: React.FC<IDockviewPanelProps> = () => {
  let runtime: ReturnType<typeof useWorkbenchRuntime> | null = null;
  try { runtime = useWorkbenchRuntime(); } catch {}

  const graphStore = runtime ? runtime.stores.$graphAST : defaultGraphAST;
  const stylesStore = runtime ? runtime.stores.$stylesCatalog : defaultStylesCatalog;

  const graph = useStore(graphStore);
  const stylesCatalog = useStore(stylesStore);

  const [svgContent, setSvgContent] = useState<string>('');
  const [autoCompile, setAutoCompile] = useState<boolean>(true);
  const [compiling, setCompiling] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const [zoom, setZoom] = useState<number>(1.0);
  const [pan, setPan] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [showExportMenu, setShowExportMenu] = useState<boolean>(false);
  const [showLogsDrawer, setShowLogsDrawer] = useState<boolean>(false);
  const [showPreambleModal, setShowPreambleModal] = useState<boolean>(false);
  const [compilerLogs, setCompilerLogs] = useState<string[]>([
    'TikZiT Preview Engine initialized.',
    'Preamble: standard TikZiT definitions loaded.',
  ]);

  useEffect(() => {
    if (!autoCompile || !graph) return;
    setCompiling(true);
    const timer = setTimeout(() => {
      const res = compileAstToSvg(graph, stylesCatalog);
      if (res.success) {
        setSvgContent(res.svg);
        setCompilerLogs((prev) => [
          `[${new Date().toLocaleTimeString()}] Compiled: ${res.nodeCount} nodes, ${res.edgeCount} edges.`,
          ...prev.slice(0, 50),
        ]);
      } else {
        setCompilerLogs((prev) => [
          `[${new Date().toLocaleTimeString()}] Error: ${res.error}`,
          ...prev.slice(0, 50),
        ]);
      }
      setCompiling(false);
    }, 80);
    return () => clearTimeout(timer);
  }, [graph, stylesCatalog, autoCompile]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 2500);
  };

  const handleCopyTikz = () => {
    if (!graph) return;
    const tikz = emitTikz(graph);
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(tikz).then(() => showToast('TikZ code copied to clipboard!'));
    }
  };

  const handleExport = (format: 'svg' | 'png' | 'pdf' | 'tex') => {
    setShowExportMenu(false);
    showToast(`Exporting diagram as ${format.toUpperCase()}...`);
  };

  return (
    <div data-testid="panel-preview" className="w-full h-full flex flex-col bg-neutral-950 relative overflow-hidden">
      <PreviewToolbar
        autoCompile={autoCompile}
        onToggleAutoCompile={() => setAutoCompile((v) => !v)}
        compiling={compiling}
        zoom={zoom}
        onZoomIn={() => setZoom((z) => Math.min(4.0, z * 1.25))}
        onZoomOut={() => setZoom((z) => Math.max(0.25, z / 1.25))}
        onZoomReset={() => { setZoom(1.0); setPan({ x: 0, y: 0 }); }}
        onZoomFit={() => { setZoom(1.1); setPan({ x: 0, y: 0 }); }}
        onCopyTikz={handleCopyTikz}
        showExportMenu={showExportMenu}
        onToggleExportMenu={() => setShowExportMenu((v) => !v)}
        onExport={handleExport}
        onToggleLogs={() => setShowLogsDrawer((v) => !v)}
        onTogglePreamble={() => setShowPreambleModal((v) => !v)}
      />

      <PreviewStage
        svgContent={svgContent}
        zoom={zoom}
        pan={pan}
        onPanChange={setPan}
        onZoomChange={setZoom}
      />

      {toastMessage && (
        <div data-testid="preview-toast" className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-sky-900/90 text-sky-200 border border-sky-600/50 px-3 py-1.5 rounded-full text-xs shadow-lg pointer-events-none z-30">
          {toastMessage}
        </div>
      )}

      {showLogsDrawer && (
        <div data-testid="preview-logs-drawer" className="absolute bottom-0 inset-x-0 h-40 bg-neutral-900 border-t border-neutral-800 p-2 font-mono text-[10px] text-neutral-400 overflow-y-auto z-20">
          <div className="flex justify-between items-center pb-1 mb-1 border-b border-neutral-800 text-neutral-300">
            <span>Compiler Output</span>
            <button onClick={() => setShowLogsDrawer(false)} className="hover:text-neutral-100">✕</button>
          </div>
          {compilerLogs.map((log, idx) => (<div key={idx}>{log}</div>))}
        </div>
      )}

      {showPreambleModal && (
        <div data-testid="preamble-modal" className="absolute inset-0 bg-neutral-950/80 backdrop-blur-sm z-40 flex items-center justify-center p-4">
          <div className="bg-neutral-900 border border-neutral-800 rounded-lg max-w-sm w-full p-4 text-xs text-neutral-300">
            <div className="flex justify-between items-center mb-3">
              <h3 className="font-semibold text-neutral-100">Preamble Settings</h3>
              <button onClick={() => setShowPreambleModal(false)} className="hover:text-neutral-100">✕</button>
            </div>
            <p className="text-neutral-400 mb-3">Loaded standard TiKZ preamble with pgf/tikz layers.</p>
            <button onClick={() => setShowPreambleModal(false)} className="w-full py-1.5 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 rounded">Close</button>
          </div>
        </div>
      )}
    </div>
  );
};
