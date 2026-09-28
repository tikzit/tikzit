import React, { useState, useEffect, useRef } from 'react';
import type { IDockviewPanelProps } from 'dockview-react';
import { useStore } from '@nanostores/react';
import { useWorkbenchRuntime } from '../WorkbenchRuntimeContext';
import { $graphAST as defaultGraphAST, graphActions } from '../../../stores/workbench';
import { parseTikz, emitTikz } from '../../../core/parser';
import { defaultSyncController } from '../../../services/sync/SyncController';
import type { SyncDiagnostic } from '../../../services/sync/SyncController';
import { defaultWorkspaceManager } from '../../../services/workspace/WorkspaceManager';

export const SourcePanel: React.FC<IDockviewPanelProps> = () => {
  let runtime: ReturnType<typeof useWorkbenchRuntime> | null = null;
  try {
    runtime = useWorkbenchRuntime();
  } catch {
    // outside provider fallback
  }

  const graphStore = runtime ? runtime.stores.$graphAST : defaultGraphAST;
  const graph = useStore(graphStore);
  const [code, setCode] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const isEditingRef = useRef(false);
  const codeRef = useRef('');
  const [diagnostics, setDiagnostics] = useState<SyncDiagnostic[]>([]);
  const isUpdatingFromExternal = useRef(false);
  const activeDocIdRef = useRef<string | null>(null);
  const suppressGraphEchoRef = useRef(false);

  // Active document from workspace
  const [activeDocTitle, setActiveDocTitle] = useState('01_spider_fusion.tikz');
  const [isDocDirty, setIsDocDirty] = useState(false);

  useEffect(() => {
    const unsubWs = defaultWorkspaceManager.subscribe((ws) => {
      const active = defaultWorkspaceManager.getActiveDocument();
      if (active) {
        setActiveDocTitle(active.title);
        setIsDocDirty(active.isDirty ?? false);
        if (activeDocIdRef.current !== ws.activeDocId) {
          activeDocIdRef.current = ws.activeDocId;
          suppressGraphEchoRef.current = true;
          setCode(active.content);
          codeRef.current = active.content;
          setIsEditing(active.isDirty ?? false);
          isEditingRef.current = active.isDirty ?? false;
        } else if (!active.isDirty) {
          suppressGraphEchoRef.current = true;
          setCode(active.content);
          codeRef.current = active.content;
          setIsEditing(false);
          isEditingRef.current = false;
        } else if (!isEditingRef.current && active.content !== codeRef.current) {
          suppressGraphEchoRef.current = true;
          setCode(active.content);
          codeRef.current = active.content;
        }
      }
    });

    const unsubSync = defaultSyncController.subscribe((event) => {
      setDiagnostics(event.diagnostics);
    });

    return () => {
      unsubWs();
      unsubSync();
    };
  }, []);

  // Sync AST -> Code editor when graph changes externally
  useEffect(() => {
    if (suppressGraphEchoRef.current) {
      suppressGraphEchoRef.current = false;
      return;
    }
    const active = defaultWorkspaceManager.getActiveDocument();
    // The active document's stored AST is the same object pushed into the graph
    // by activation/commit — that echo must not normalize the exact stored source.
    if (active?.ast === graph) return;
    if (!isEditing && graph) {
      isUpdatingFromExternal.current = true;
      const emitted = emitTikz(graph);
      setCode(emitted);
      codeRef.current = emitted;
      defaultSyncController.commitFromCanvas(graph);
      setDiagnostics([]);
      isUpdatingFromExternal.current = false;
    }
  }, [graph, isEditing]);

  const handleChange = (newCode: string) => {
    setCode(newCode);
    codeRef.current = newCode;
    setIsEditing(true);
    isEditingRef.current = true;

    // Update workspace dirty state
    const active = defaultWorkspaceManager.getActiveDocument();
    if (active) {
      defaultWorkspaceManager.updateContent(active.id, newCode);
    }

    const editedDocId = active?.id;
    defaultSyncController.updateFromEditor(newCode, (ast) => {
      if (editedDocId) defaultWorkspaceManager.updateAst(editedDocId, ast);
      // A debounced edit must never apply its AST to a different active document.
      if (defaultWorkspaceManager.getActiveDocument()?.id !== editedDocId) return;
      if (runtime) {
        runtime.ctx.graph.setAST(ast);
      } else {
        graphActions.setAST(ast);
      }
    });

    setDiagnostics(defaultSyncController.getDiagnostics());
  };

  const handleBlur = () => {
    setIsEditing(false);
    isEditingRef.current = false;
  };

  return (
    <div
      className="w-full h-full bg-[#141720] flex flex-col font-mono text-xs select-text"
      data-testid="panel-source"
      data-panel="source"
    >
      <div className="h-7 bg-[#1a1d26] border-b border-[#2e3446] px-3 flex items-center justify-between text-[#94a3b8]">
        <div className="flex items-center space-x-2">
          <span className="font-semibold text-slate-200" data-testid="source-doc-title">
            {activeDocTitle}
            {isDocDirty && <span className="text-amber-400 font-bold ml-1">*</span>}
          </span>
          <span className="text-[10px] bg-blue-900/60 text-blue-400 px-1.5 py-0.5 rounded">TikZ / PGF</span>
        </div>
        <button
          onClick={() => navigator.clipboard.writeText(code)}
          className="hover:text-white px-2 py-0.5 bg-[#222634] rounded border border-[#2e3446] transition-colors"
          title="Copy TikZ source to clipboard"
        >
          Copy TikZ
        </button>
      </div>

      {/* Diagnostics Banner if any syntax issues */}
      {diagnostics.length > 0 && (
        <div
          data-testid="sync-diagnostics-banner"
          className="px-3 py-1 bg-amber-950/70 border-b border-amber-700/50 text-[11px] text-amber-300 flex items-center justify-between"
        >
          <span>⚠ {diagnostics[0].message}</span>
          <span className="text-[10px] text-amber-400/80 italic">Canvas retains last valid state</span>
        </div>
      )}

      <textarea
        data-testid="tikz-source-editor"
        value={code}
        onChange={(e) => handleChange(e.target.value)}
        onBlur={handleBlur}
        className="w-full flex-1 bg-transparent p-3 text-emerald-400 focus:outline-none resize-none leading-relaxed"
        spellCheck={false}
      />
    </div>
  );
};
