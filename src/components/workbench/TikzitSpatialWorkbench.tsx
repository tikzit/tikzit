import { FileDropZone } from '../workspace/FileDropZone';
import React, { useRef, useEffect, useState, useCallback } from 'react';
import { useStore } from '@nanostores/react';
import { type DockviewReadyEvent, type DockviewApi } from 'dockview-react';
import 'dockview-react/dist/styles/dockview.css';

import { WorkbenchCommandBar } from './WorkbenchCommandBar';
import { WorkbenchSurface } from './WorkbenchSurface';
import { WorkbenchStatusBar } from './WorkbenchStatusBar';

import { createWorkbenchRuntimeAsync, type WorkbenchRuntime } from '../../services/createWorkbenchRuntime';
import { formatContentId } from '../../services/clm/corpusExplorerService';
import { defaultWorkspaceManager } from '../../services/workspace/WorkspaceManager';
import { WorkbenchRuntimeProvider } from './WorkbenchRuntimeContext';
import { selectDiagramSaveState } from '../../services/clm/saveAffordanceState';

export interface TikzitSpatialWorkbenchProps {
  runtime?: WorkbenchRuntime;
}

const TikzitSpatialWorkbenchReady: React.FC<{ runtime: WorkbenchRuntime; ownsRuntime: boolean }> = ({ runtime, ownsRuntime }) => {

  // Nanostores Reactive Flux Subscriptions
  const activeTool = useStore(runtime.stores.$toolMode);
  const theme = useStore(runtime.stores.$theme);
  const layout = useStore(runtime.stores.$workbenchLayout);
  const activeDiagram = useStore(runtime.stores.$activeDiagram);
  const documentHead = useStore(runtime.stores.$documentHead);
  const corpusView = useStore(runtime.stores.$corpusView);
  const saveStates = useStore(runtime.stores.$diagramSaveState);
  const [workspaceState, setWorkspaceState] = useState(defaultWorkspaceManager.getState());

  useEffect(() => {
    return defaultWorkspaceManager.subscribe(setWorkspaceState);
  }, []);

  const activeDoc = workspaceState.openDocs.find((d) => d.id === workspaceState.activeDocId);
  const affordance = activeDoc
    ? selectDiagramSaveState({
        handle: activeDoc.id,
        workspaceDoc: activeDoc,
        documentHead,
        corpusView,
        saveState: activeDoc.id ? saveStates[activeDoc.id] : undefined,
      })
    : null;

  const isSessionOnly = affordance?.isSessionOnly ?? false;
  const saveStatusText = affordance?.statusText ?? '';

  const handleRetryFlush = useCallback(() => {
    void runtime.retryFlush();
  }, [runtime]);

  const contentId = (() => {
    try {
      return formatContentId(documentHead.hash);
    } catch {
      return '';
    }
  })();

  const {
    isDrawerCollapsed,
    drawerWidth,
    isWorkbenchDepressed,
    panelCount,
  } = layout;

  const dockviewApiRef = useRef<DockviewApi | null>(null);
  const setPanelCount = (count: number) => {
    runtime.stores.$workbenchLayout.setKey('panelCount', count);
  };
  const toggleDrawer = () => {
    runtime.stores.$workbenchLayout.setKey('isDrawerCollapsed', !layout.isDrawerCollapsed);
  };
  const setDrawerWidth = (w: number) => {
    const clamped = Math.max(160, Math.min(600, w));
    runtime.stores.$workbenchLayout.setKey('drawerWidth', clamped);
  };
  const depressWorkbench = () => {
    runtime.stores.$workbenchLayout.setKey('isWorkbenchDepressed', true);
  };
  const restoreWorkbench = () => {
    runtime.stores.$workbenchLayout.setKey('isWorkbenchDepressed', false);
  };
  // Setup default 4-panel spatial layout
  const loadDefaultLayout = (api: DockviewApi) => {
    api.clear();

    const canvas = api.addPanel({
      id: 'canvas',
      component: 'canvas',
      title: 'Vector Canvas (Three.js)',
    });

    const preview = api.addPanel({
      id: 'preview',
      component: 'preview',
      title: 'TeX Preview',
      position: { referencePanel: canvas, direction: 'right' },
    });

    const source = api.addPanel({
      id: 'source',
      component: 'source',
      title: 'TikZ Source',
      position: { referencePanel: canvas, direction: 'below' },
    });

    const inspector = api.addPanel({
      id: 'inspector',
      component: 'inspector',
      title: 'Inspector & Styles',
      position: { referencePanel: preview, direction: 'right' },
    });

    api.addPanel({
      id: 'console',
      component: 'console',
      title: 'Diagnostics Console',
      position: { referencePanel: source, direction: 'right' },
    });
  };

  const onReady = (event: DockviewReadyEvent) => {
    const api = event.api;
    dockviewApiRef.current = api;

    // Resilient Layout Restoration (with 0-panel guard from Knowledge Item)
    let restored = false;
    try {
      const saved = localStorage.getItem('tikzit:workbench:layout');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && parsed.grid && parsed.panels && Object.keys(parsed.panels).length > 0) {
          api.fromJSON(parsed);
          restored = true;
        }
      }
    } catch (e) {
      console.warn('Failed to parse saved layout, using default', e);
    }

    if (!restored) {
      loadDefaultLayout(api);
    }

    setPanelCount(api.panels.length);

    // Layout Change Listener with 0-Panel Guard
    api.onDidLayoutChange(() => {
      setPanelCount(api.panels.length);
      if (api.panels.length === 0) {
        // Guard against persisting 0-panel layouts
        return;
      }
      try {
        const serialized = api.toJSON();
        localStorage.setItem('tikzit:workbench:layout', JSON.stringify(serialized));
      } catch (err) {
        console.error('Failed to save layout', err);
      }
    });
  };

  // Dispose local runtime on unmount
  useEffect(() => {
    return () => {
      if (ownsRuntime) void runtime.disposeAsync().catch(() => undefined);
    };
  }, [ownsRuntime, runtime]);

  const handleResetLayout = () => {
    if (dockviewApiRef.current) {
      localStorage.removeItem('tikzit:workbench:layout');
      loadDefaultLayout(dockviewApiRef.current);
      setPanelCount(dockviewApiRef.current.panels.length);
    }
  };

  const handleCloseOthers = () => {
    const api = dockviewApiRef.current;
    if (api && api.panels.length > 1) {
      const active = api.activePanel || api.panels[0];
      const others = api.panels.filter((p) => p.id !== active.id);
      others.forEach((p) => p.api.close());
      setPanelCount(api.panels.length);
    }
  };

  const handleCloseAll = () => {
    const api = dockviewApiRef.current;
    if (api) {
      api.clear();
      setPanelCount(0);
    }
  };

  return (
    <WorkbenchRuntimeProvider runtime={runtime}>
      <FileDropZone>
      <div
        id="tikzit-workbench"
      className={`workbench-root h-screen flex flex-col ${theme === 'dark' ? 'dockview-theme-dark' : 'dockview-theme-light'}`}
      data-testid="workbench-root"
    >
      {/* Top Header / Command Bar */}
      {/* macOS Window Chrome & Tool Palette */}
      <WorkbenchCommandBar
        runtime={runtime}
        onResetLayout={handleResetLayout}
        onCloseOthers={handleCloseOthers}
        onCloseAll={handleCloseAll}
      />

      {/* Main Workspace with Left Activity Bar, Collapsible Drawer, & Center Dockview */}
      <WorkbenchSurface
        runtime={runtime}
        activeHandle={activeDiagram.handle}
        isDrawerCollapsed={isDrawerCollapsed}
        drawerWidth={drawerWidth}
        isWorkbenchDepressed={isWorkbenchDepressed}
        panelCount={panelCount}
        theme={theme}
        onReady={onReady}
        onToggleDrawer={toggleDrawer}
        onResetDrawerWidth={() => setDrawerWidth(260)}
        onRestore={restoreWorkbench}
      />

      {/* Bottom Status Bar */}
      <WorkbenchStatusBar
        activeTool={activeTool}
        isWorkbenchDepressed={isWorkbenchDepressed}
        panelCount={panelCount}
        contentId={contentId}
        saveStatusText={saveStatusText}
        isSessionOnly={isSessionOnly}
        onRetryFlush={handleRetryFlush}
        onToggleFocal={() => (isWorkbenchDepressed ? restoreWorkbench() : depressWorkbench())}
      />
      </div>
      </FileDropZone>
    </WorkbenchRuntimeProvider>
  );
};

export const TikzitSpatialWorkbench: React.FC<TikzitSpatialWorkbenchProps> = ({ runtime: propRuntime }) => {
  const [localRuntime, setLocalRuntime] = useState<WorkbenchRuntime | null>(propRuntime ?? null);
  const [startupError, setStartupError] = useState('');
  const [retryCount, setRetryCount] = useState(0);
  const [temporarySession, setTemporarySession] = useState(false);

  useEffect(() => {
    if (propRuntime) {
      setLocalRuntime(propRuntime);
      setStartupError('');
      return;
    }
    let cancelled = false;
    setLocalRuntime(null);
    setStartupError('');
    void createWorkbenchRuntimeAsync({ temporarySession }).then((created) => {
      if (cancelled) void created.disposeAsync().catch(() => undefined);
      else setLocalRuntime(created);
    }).catch((error) => {
      if (!cancelled) setStartupError(error instanceof Error ? error.message : String(error));
    });
    return () => {
      cancelled = true;
    };
  }, [propRuntime, retryCount, temporarySession]);

  if (propRuntime) return <TikzitSpatialWorkbenchReady runtime={propRuntime} ownsRuntime={false} />;
  if (startupError) {
    return (
      <div className="w-full h-full flex flex-col items-center justify-center gap-3 bg-[#0d1117] text-slate-200" role="alert">
        <p>Workbench startup failed: {startupError}</p>
        <button type="button" onClick={() => setRetryCount((count) => count + 1)} className="px-3 py-1 rounded bg-blue-600">
          Retry startup
        </button>
        {!temporarySession && /snapshot|sqlite|indexeddb|storage|quota|blocked|mcard|schema|database/i.test(startupError) && (
          <button
            type="button"
            data-testid="temporary-session-btn"
            onClick={() => setTemporarySession(true)}
            className="px-3 py-1 rounded border border-slate-600"
          >
            Continue in a temporary session without changing stored data
          </button>
        )}
      </div>
    );
  }
  if (!localRuntime) return <div data-testid="runtime-loading" role="status" className="w-full h-full bg-[#0d1117] text-slate-300 p-4">Starting workbench and loading corpus…</div>;
  return <TikzitSpatialWorkbenchReady runtime={localRuntime} ownsRuntime />;
};

export default TikzitSpatialWorkbench;
