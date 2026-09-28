import { defaultTransactionManager, ASTSnapshotCommand } from '../../../core/history/TransactionManager';
import React, { useRef, useEffect, useState } from 'react';
import type { IDockviewPanelProps } from 'dockview-react';
import { useStore } from '@nanostores/react';
import { atom, map } from 'nanostores';
import { useWorkbenchRuntime } from '../WorkbenchRuntimeContext';
import {
  $theme as defaultTheme,
  $graphAST as defaultGraphAST,
  $selectedElements as defaultSelected,
  $toolMode as defaultToolMode,
  $stylesCatalog as defaultStylesCatalog,
  $activeStyle as defaultActiveStyle,
  toolActions,
  selectionActions,
  styleActions,
} from '../../../stores/workbench';
import { Stage } from '../../../canvas/Stage';
import { ToolManager } from '../../../canvas/tools/ToolManager';
import type { CameraState } from '../../../canvas/CameraController';
import type { ToolMode } from '../../../services/kernel';
import type { GraphAST } from '../../../core/domain/types';
import { parseTikz, emitTikz } from '../../../core/parser';
import { defaultWorkspaceManager } from '../../../services/workspace/WorkspaceManager';
import { selectDiagramSaveState } from '../../../services/clm/saveAffordanceState';
import type { CorpusViewState, DocumentHeadState, DiagramSaveState } from '../../../stores/createWorkbenchStores';

declare global {
  interface Window {
    TikzitApp?: any;
  }
}

const fallbackDismissed = atom<string[]>([]);
const fallbackSaveState = map<Record<string, DiagramSaveState>>({});
const fallbackCorpusView = atom<CorpusViewState>({ status: 'ready', persistence: 'persistent', seedFailures: [] });
const fallbackDocumentHead = atom<DocumentHeadState>({ handle: '', hash: '', sequence: 0, isValid: true });

export const CanvasPanel: React.FC<IDockviewPanelProps> = () => {
  let runtime: ReturnType<typeof useWorkbenchRuntime> | null = null;
  try {
    runtime = useWorkbenchRuntime();
  } catch {
    // outside provider fallback
  }

  const theme = useStore(runtime ? runtime.stores.$theme : defaultTheme);
  const graphAST = useStore(runtime ? runtime.stores.$graphAST : defaultGraphAST);
  const selectedElements = useStore(runtime ? runtime.stores.$selectedElements : defaultSelected);
  const toolMode = useStore(runtime ? runtime.stores.$toolMode : defaultToolMode);
  const stylesCatalog = useStore(runtime ? runtime.stores.$stylesCatalog : defaultStylesCatalog);

  const [activeDoc, setActiveDoc] = useState(() => defaultWorkspaceManager.getActiveDocument());
  useEffect(() => {
    return defaultWorkspaceManager.subscribe((state) => {
      const doc = state.openDocs.find((d) => d.id === state.activeDocId);
      setActiveDoc(doc);
    });
  }, []);

  const dismissedList = useStore(runtime ? runtime.stores.$dismissedDraftCallouts : fallbackDismissed);
  const saveStates = useStore(runtime ? runtime.stores.$diagramSaveState : fallbackSaveState);
  const corpusView = useStore(runtime ? runtime.stores.$corpusView : fallbackCorpusView);
  const documentHead = useStore(runtime ? runtime.stores.$documentHead : fallbackDocumentHead);

  const isDismissed = activeDoc ? (runtime?.isDraftCalloutDismissed(activeDoc.id) || dismissedList.includes(activeDoc.id)) : false;

  const affordance = activeDoc ? selectDiagramSaveState({
    handle: activeDoc.id,
    workspaceDoc: activeDoc,
    documentHead,
    corpusView,
    saveState: saveStates[activeDoc.id],
    isDismissed,
  }) : null;

  const containerRef = useRef<HTMLDivElement | null>(null);
  const stageRef = useRef<Stage | null>(null);
  const toolManagerRef = useRef<ToolManager | null>(null);
  const [cameraHUD, setCameraHUD] = useState<CameraState>({
    position: { x: 0, y: 0 },
    zoom: 1.0,
    pixelsPerUnit: 50,
  });

  useEffect(() => {
    if (!containerRef.current) return;

    const stage = new Stage({
      container: containerRef.current,
      theme: theme === 'light' ? 'light' : 'dark',
      onCameraChange: (state) => {
        setCameraHUD(state);
      },
    });
    stageRef.current = stage;

    const toolManager = new ToolManager({
      stage,
      raycaster: stage.raycaster,
      gizmos: stage.gizmoRenderer,
      getGraph: () => (runtime ? runtime.stores.$graphAST.get() : defaultGraphAST.get()),
      setGraph: (ast) => {
        if (runtime) {
          runtime.stores.$graphAST.set(ast);
        } else {
          defaultGraphAST.set(ast);
        }
      },
      commitGraphChange: (ast) => {
        const prev = runtime ? runtime.stores.$graphAST.get() : defaultGraphAST.get();
        defaultTransactionManager.execute(
          new ASTSnapshotCommand('Canvas edit', prev, ast, (targetAST) => {
            const active = defaultWorkspaceManager.getActiveDocument();
            if (active) {
              defaultWorkspaceManager.updateContent(active.id, emitTikz(targetAST), targetAST);
            }
            if (runtime) {
              runtime.ctx.graph.setAST(targetAST);
            } else {
              defaultGraphAST.set(targetAST);
            }
          })
        );
        const active = defaultWorkspaceManager.getActiveDocument();
        if (active) {
          defaultWorkspaceManager.updateContent(active.id, emitTikz(ast), ast);
        }
        if (runtime) {
          runtime.ctx.graph.setAST(ast);
        } else {
          defaultGraphAST.set(ast);
        }
      },
      getSelectedIds: () => {
        const sel = runtime ? runtime.stores.$selectedElements.get() : defaultSelected.get();
        return {
          nodes: sel?.nodes ? [...sel.nodes] : [],
          edges: sel?.edges ? [...sel.edges] : [],
        };
      },
      setSelectedIds: (sel) => {
        if (runtime) {
          runtime.ctx.selection.selectedNodes = new Set(sel.nodes);
          runtime.ctx.selection.selectedEdges = new Set(sel.edges);
          runtime.ctx.emit('tikzit/selection:change', sel);
          runtime.ctx.emit('selection:change', sel);
        } else {
          defaultSelected.set(sel);
        }
      },
      onToolChange: (tool: ToolMode) => {
        if (runtime) {
          runtime.ctx.tool.setTool(tool);
          runtime.stores.$toolMode.set(tool);
        } else {
          toolActions.setTool(tool);
        }
      },
      getActiveStyle: () => (runtime ? runtime.stores.$activeStyle.get() : defaultActiveStyle.get()),
    });
    toolManagerRef.current = toolManager;

    // Render initial diagram if available
    const initialAST = runtime ? runtime.stores.$graphAST.get() : defaultGraphAST.get();
    if (initialAST && initialAST.nodes.length > 0) {
      const sel = runtime ? runtime.stores.$selectedElements.get() : defaultSelected.get();
      const selectedIds = [...(sel?.nodes || []), ...(sel?.edges || [])];
      stage.renderGraph(initialAST, undefined, selectedIds);
      stage.fitToGraph();
    }

    // Expose window.TikzitApp for E2E testing and automation
    if (typeof window !== 'undefined') {
      window.TikzitApp = {
        stage,
        toolManager,
        getGraph: () => {
          const ast = runtime ? runtime.stores.$graphAST.get() : defaultGraphAST.get();
          const nodes = (ast?.nodes || []).map((n) => {
            const style = (n as any).style || n.data?.find((p) => p.key === 'style')?.value || 'none';
            return {
              ...n,
              style,
            };
          });
          const edges = (ast?.edges || []).map((ed) => {
            const props: Record<string, string | true> = {};
            for (const p of ed.data || []) {
              props[p.key] = p.value !== undefined ? p.value : true;
            }
            return {
              ...ed,
              properties: props,
            };
          });
          return {
            ...ast,
            nodes,
            edges,
          };
        },
        getStyles: () => (runtime ? runtime.stores.$stylesCatalog.get() : defaultStylesCatalog.get()),
        setActiveStyle: (style: string) => {
          if (runtime) {
            runtime.stores.$activeStyle.set(style);
          } else {
            defaultActiveStyle.set(style);
          }
        },
        applyStyle: (elementId: string, styleName: string) => {
          if (runtime) {
            const ast = runtime.stores.$graphAST.get();
            const isNode = ast.nodes.some((n) => n.id === elementId);
            if (isNode) {
              runtime.ctx.styles.applyStyleToNodes([elementId], styleName);
            } else {
              runtime.ctx.styles.applyStyleToEdges([elementId], styleName);
            }
            const active = defaultWorkspaceManager.getActiveDocument();
            if (active) {
              const updatedAst = runtime.ctx.graph.ast;
              defaultWorkspaceManager.updateContent(active.id, emitTikz(updatedAst), updatedAst);
            }
          } else {
            styleActions.applyStyleToSelected(styleName);
          }
        },
        setGraph: (ast: any) => {
          if (runtime) {
            runtime.ctx.graph.setAST(ast);
          } else {
            defaultGraphAST.set(ast);
          }
          stage.renderGraph(ast);
          stage.fitToGraph();
        },
        setSourceCode: (code: string) => window.TikzitApp.loadTikz(code),
        getTikzCode: () => emitTikz(runtime ? runtime.stores.$graphAST.get() : defaultGraphAST.get()),
        loadTikz: (tikzCode: string) => {
          try {
            const ast = parseTikz(tikzCode);
            if (ast) {
              if (runtime) {
                runtime.ctx.graph.setAST(ast);
              } else {
                defaultGraphAST.set(ast);
              }
              stage.renderGraph(ast);
              stage.fitToGraph();
            }
          } catch (err) {
            console.error('loadTikz parse error:', err);
          }
        },
        getNodeScreenPos: (nodeId: string) => stage.getNodeScreenPos(nodeId),
        getEdgeHandleScreenPos: (edgeIndexOrId: number | string) => stage.getEdgeHandleScreenPos(edgeIndexOrId),
        getSelectedNodeIds: () => {
          const sel = runtime ? runtime.stores.$selectedElements.get() : defaultSelected.get();
          return [...(sel?.nodes || [])];
        },
        setTool: (mode: ToolMode) => {
          toolManager.setTool(mode);
          if (runtime) {
            runtime.ctx.tool.setTool(mode);
          } else {
            toolActions.setTool(mode);
          }
        },
        selectNode: (id: string, additive: boolean = false) => {
          if (runtime) {
            runtime.ctx.selection.selectNode(id, additive);
          } else {
            selectionActions.selectNode(id, additive);
          }
        },
        selectEdge: (id: string | number, additive: boolean = false) => {
          const edgeIdStr = String(id);
          if (runtime) {
            runtime.ctx.selection.selectEdge(edgeIdStr, additive);
          } else {
            selectionActions.selectEdge(edgeIdStr, additive);
          }
        },
        getEditorValue: () => {
          const ast = runtime ? runtime.stores.$graphAST.get() : defaultGraphAST.get();
          return emitTikz(ast);
        },
        // Sprint 15 E2E surface: commit-gate receipts from the executionLog pillar.
        getReceipts: () =>
          runtime
            ? runtime.triDb.executionLog.list().map((card: any) => card.payload?.value ?? card.payload)
            : [],
      };
    }

    return () => {
      toolManager.dispose();
      stage.dispose();
      stageRef.current = null;
      toolManagerRef.current = null;
    };
  }, []);

  useEffect(() => {
    if (stageRef.current) {
      stageRef.current.setTheme(theme === 'light' ? 'light' : 'dark');
    }
  }, [theme]);

  // Synchronize external toolMode changes (e.g. from toolbar buttons) to toolManager
  useEffect(() => {
    if (toolManagerRef.current && toolMode) {
      toolManagerRef.current.setTool(toolMode);
    }
  }, [toolMode]);

  useEffect(() => {
    if (stageRef.current && graphAST) {
      const selectedIds = [...(selectedElements?.nodes || []), ...(selectedElements?.edges || [])];
      const stylesRecord: Record<string, any> = {};
      for (const s of stylesCatalog?.styles || []) {
        stylesRecord[s.name] = s;
      }
      stageRef.current.renderGraph(graphAST, stylesRecord, selectedIds);
    }
  }, [graphAST, selectedElements, stylesCatalog]);

  const nodeCount = graphAST?.nodes?.length ?? 0;
  const edgeCount = graphAST?.edges?.length ?? 0;

  return (
    <div
      ref={containerRef}
      className="relative w-full h-full bg-[#0d0f14] overflow-hidden select-none"
      data-testid="panel-canvas"
      data-panel="canvas"
    >
      {/* Draft Save Callout Notice */}
      {affordance?.showCallout && activeDoc && (
        <div
          data-testid="draft-canvas-callout"
          className="absolute top-3 inset-x-0 mx-auto max-w-sm flex justify-center pointer-events-none z-30 px-3"
        >
          <div
            className="pointer-events-auto bg-[#1e2330]/90 backdrop-blur-md border border-[#3b455e] text-xs text-slate-200 rounded-full px-3 py-1 flex items-center gap-2.5 shadow-lg max-w-full"
            onPointerDown={(e) => e.stopPropagation()}
            onMouseDown={(e) => e.stopPropagation()}
            onMouseUp={(e) => e.stopPropagation()}
            onClick={(e) => e.stopPropagation()}
            onWheel={(e) => e.stopPropagation()}
          >
            <span className="font-normal text-slate-300 truncate">
              Draft diagram · Not yet saved to MCard history
            </span>
            <button
              type="button"
              data-testid="btn-canvas-save-draft"
              disabled={affordance.isSaving}
              aria-busy={affordance.isSaving}
              onClick={(e) => {
                e.stopPropagation();
                if (runtime && activeDoc) {
                  void runtime.saveDiagram(activeDoc.id);
                }
              }}
              className="px-2 py-0.5 rounded text-xs bg-blue-600 hover:bg-blue-500 text-white font-medium transition-colors shrink-0 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {affordance.isSaving ? 'Saving…' : 'Save'}
            </button>
            <button
              type="button"
              data-testid="btn-dismiss-draft-callout"
              title="Dismiss notice"
              aria-label="Dismiss notice"
              onClick={(e) => {
                e.stopPropagation();
                if (runtime && activeDoc) {
                  runtime.dismissDraftCallout(activeDoc.id);
                }
              }}
              className="text-slate-400 hover:text-slate-200 text-xs px-1.5 py-0.5 rounded transition-colors shrink-0"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      {/* Floating Canvas HUD */}
      <div className="absolute bottom-3 left-3 bg-[#1a1d26]/80 backdrop-blur-md px-2.5 py-1.5 rounded border border-[#2e3446] text-xs text-[#94a3b8] flex items-center space-x-3 pointer-events-none z-30">
        <span className="flex items-center">
          <span className="w-2 h-2 rounded-full bg-emerald-500 mr-1.5 animate-pulse"></span>
          WebGL 2D Ready
        </span>
        <span>Grid: {cameraHUD.pixelsPerUnit.toFixed(0)}px ({(cameraHUD.zoom * 100).toFixed(0)}%)</span>
        <span>Nodes: {nodeCount} | Edges: {edgeCount}</span>
      </div>
    </div>
  );
};
