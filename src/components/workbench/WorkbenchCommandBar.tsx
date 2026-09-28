/**
 * src/components/workbench/WorkbenchCommandBar.tsx - Sprint 22
 * Decomposed WorkbenchCommandBar coordinating window chrome, dialogs, and persistence lifecycle.
 * Target: <= 170 LOC.
 */
import React, { useCallback, useEffect, useState } from 'react';
import { useStore } from '@nanostores/react';
import { MacWindowChrome } from './MacWindowChrome';
import { CloseTabDialog } from './CloseTabDialog';
import { ExportDiagramDialog } from './ExportDiagramDialog';
import { ExportCollectionDialog } from './ExportCollectionDialog';
import { defaultTransactionManager } from '../../core/history/TransactionManager';
import { defaultWorkspaceManager } from '../../services/workspace/WorkspaceManager';
import { selectDiagramSaveState } from '../../services/clm/saveAffordanceState';
import { useTabCloseWorkflow } from './commandbar/useTabCloseWorkflow';
import { useDocumentPersistence } from './commandbar/useDocumentPersistence';
import type { ToolMode } from '../../services/kernel';
import type { WorkbenchRuntime } from '../../services/createWorkbenchRuntime';

interface WorkbenchCommandBarProps {
  runtime: WorkbenchRuntime;
  onResetLayout(): void;
  onCloseOthers(): void;
  onCloseAll(): void;
}

export const WorkbenchCommandBar: React.FC<WorkbenchCommandBarProps> = ({
  runtime,
  onResetLayout,
  onCloseOthers,
  onCloseAll,
}) => {
  const [historyState, setHistoryState] = useState<{ canUndo: boolean; canRedo: boolean; isDirty: boolean; lastCommand?: string }>(defaultTransactionManager.getState());
  const [workspaceState, setWorkspaceState] = useState(defaultWorkspaceManager.getState());
  const [showVersionPopover, setShowVersionPopover] = useState(false);

  const activeTool = useStore(runtime.stores.$toolMode);
  const theme = useStore(runtime.stores.$theme);
  const layout = useStore(runtime.stores.$workbenchLayout);
  const corpusView = useStore(runtime.stores.$corpusView);
  const documentHead = useStore(runtime.stores.$documentHead);
  const saveStates = useStore(runtime.stores.$diagramSaveState);
  const exportDialogState = useStore(runtime.stores.$exportDialogState);
  const exportCollectionDialogState = useStore(runtime.stores.$exportCollectionDialogState);

  const activeDoc = workspaceState.openDocs.find((document) => document.id === workspaceState.activeDocId);

  const affordance = activeDoc
    ? selectDiagramSaveState({
        handle: activeDoc.id,
        workspaceDoc: activeDoc,
        documentHead,
        corpusView,
        saveState: activeDoc.id ? saveStates[activeDoc.id] : undefined,
        historyStateIsDirty: historyState.isDirty,
      })
    : null;

  const isDirty = affordance?.isDirty ?? (historyState.isDirty || !!activeDoc?.isDirty);
  const isSessionOnly = affordance?.isSessionOnly ?? false;

  let docBadge: 'Draft' | 'Diagram' | 'Example' | undefined;
  if (activeDoc?.id.startsWith('zx:examples:')) docBadge = 'Example';
  else if (activeDoc?.id.startsWith('zx:diagrams:')) docBadge = activeDoc.hash ? 'Diagram' : 'Draft';

  const { liveAnnouncement, successPillHandle, handleSave, handleRetryFlush } = useDocumentPersistence({
    runtime,
    openDocs: workspaceState.openDocs,
    activeDoc,
    isDirty,
  });

  useEffect(() => {
    const unsubHistory = defaultTransactionManager.subscribe(setHistoryState);
    const unsubWorkspace = defaultWorkspaceManager.subscribe(setWorkspaceState);
    const handleKeyDown = (event: KeyboardEvent) => {
      if (!(event.metaKey || event.ctrlKey)) return;
      const key = event.key.toLowerCase();
      if (key === 'z') {
        event.preventDefault();
        if (event.shiftKey) defaultTransactionManager.redo();
        else defaultTransactionManager.undo();
      } else if (key === 'y') {
        event.preventDefault();
        defaultTransactionManager.redo();
      } else if (key === 's') {
        event.preventDefault();
        void handleSave();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      unsubHistory();
      unsubWorkspace();
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [handleSave]);

  const setTheme = useCallback((nextTheme: 'dark' | 'light') => {
    runtime.stores.$theme.set(nextTheme);
    if (typeof document !== 'undefined') {
      document.documentElement.classList.toggle('dark', nextTheme === 'dark');
      document.documentElement.classList.toggle('light', nextTheme === 'light');
      try { localStorage.setItem('tikzit:theme', nextTheme); } catch {}
    }
  }, [runtime]);

  useEffect(() => {
    const savedTheme = (localStorage.getItem('tikzit:theme') as 'dark' | 'light') || 'dark';
    setTheme(savedTheme);
  }, [setTheme]);

  const {
    pendingClose,
    handleCloseActiveTab,
    handleCloseOthersWithPrompt,
    handleCloseAllWithPrompt,
    handleDialogSave,
    handleDialogDiscard,
    handleDialogCancel,
  } = useTabCloseWorkflow({
    runtime,
    corpusPersistence: corpusView.persistence,
    hasPersistenceError: !!corpusView.persistenceError,
    onCloseOthers,
    onCloseAll,
  });

  return (
    <>
      <MacWindowChrome
        runtime={runtime}
        documentTitle={activeDoc?.title || '01_spider_fusion.tikz'}
        isDirty={isDirty}
        docBadge={docBadge}
        saveStatusText={affordance?.statusText ?? ''}
        saveError={affordance?.error}
        isSessionOnly={isSessionOnly}
        onRetryFlush={handleRetryFlush}
        onSave={handleSave}
        isSaving={affordance?.isSaving ?? false}
        buttonKind={affordance?.buttonKind ?? 'none'}
        buttonLabel={affordance?.buttonLabel}
        buttonTooltip={affordance?.buttonTooltip}
        showSuccessPill={successPillHandle === activeDoc?.id && !isDirty}
        activeTool={activeTool}
        onSelectTool={(tool: ToolMode) => {
          runtime.ctx.tool.setTool(tool);
          runtime.stores.$toolMode.set(tool);
        }}
        canUndo={historyState.canUndo}
        canRedo={historyState.canRedo}
        onUndo={() => defaultTransactionManager.undo()}
        onRedo={() => defaultTransactionManager.redo()}
        showVersionPopover={showVersionPopover}
        onToggleVersionPopover={() => setShowVersionPopover((shown) => !shown)}
        activeDocId={workspaceState.activeDocId}
        tabsMenuOpen={layout.tabsMenuOpen}
        onToggleTabsMenu={() => runtime.stores.$workbenchLayout.setKey('tabsMenuOpen', !layout.tabsMenuOpen)}
        onCloseActiveTab={handleCloseActiveTab}
        onCloseOthers={() => {
          handleCloseOthersWithPrompt();
          runtime.stores.$workbenchLayout.setKey('tabsMenuOpen', false);
        }}
        onCloseAll={() => {
          handleCloseAllWithPrompt();
          runtime.stores.$workbenchLayout.setKey('tabsMenuOpen', false);
        }}
        onResetLayout={onResetLayout}
        theme={theme}
        themeMenuOpen={layout.themeMenuOpen}
        onToggleThemeMenu={() => {
          runtime.stores.$workbenchLayout.setKey('themeMenuOpen', !layout.themeMenuOpen);
          setTheme(theme === 'dark' ? 'light' : 'dark');
        }}
        onSetTheme={(nextTheme) => {
          setTheme(nextTheme);
          runtime.stores.$workbenchLayout.setKey('themeMenuOpen', false);
        }}
        onNewDiagram={() => runtime.createDiagram()}
        onExport={() => runtime.openExportDialog()}
      />
      <div data-testid="save-live-announcer" role="status" aria-live="polite" className="sr-only">
        {liveAnnouncement}
      </div>
      {pendingClose && pendingClose.docsToClose[pendingClose.currentIndex] && (
        <CloseTabDialog
          documentTitle={pendingClose.docsToClose[pendingClose.currentIndex].title || 'Untitled'}
          isBulk={pendingClose.docsToClose.length > 1}
          onSave={handleDialogSave}
          onDiscard={handleDialogDiscard}
          onCancel={handleDialogCancel}
        />
      )}
      {exportDialogState.isOpen && (
        <ExportDiagramDialog runtime={runtime} onClose={() => runtime.closeExportDialog()} />
      )}
      {exportCollectionDialogState.isOpen && (
        <ExportCollectionDialog runtime={runtime} onClose={() => runtime.closeExportCollectionDialog()} />
      )}
      <div role="status" aria-live="polite" data-testid="export-live-announcer" className="sr-only">
        {exportDialogState.lastAnnouncement || ''}
      </div>
    </>
  );
};
