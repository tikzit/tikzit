/**
 * src/components/workbench/commandbar/useTabCloseWorkflow.ts - Sprint 22
 * Headless hook managing dirty checks, prompt orchestration, and batch saves/discards on tab close.
 */
import { useState, useCallback } from 'react';
import { defaultWorkspaceManager, type DocumentRecord } from '../../../services/workspace/WorkspaceManager';
import { defaultDocumentStore } from '../../../services/storage/DocumentStore';
import { isDiagramHandle } from '../../../services/clm/corpusPersistence';
import { safeParse } from '../../../core/parser/parser';
import type { WorkbenchRuntime } from '../../../services/createWorkbenchRuntime';

export interface PendingCloseState {
  docsToClose: DocumentRecord[];
  currentIndex: number;
  mode: 'single' | 'others' | 'all';
}

export interface UseTabCloseWorkflowParams {
  runtime: WorkbenchRuntime;
  corpusPersistence: string;
  hasPersistenceError: boolean;
  onCloseOthers(): void;
  onCloseAll(): void;
}

export function useTabCloseWorkflow({
  runtime,
  corpusPersistence,
  hasPersistenceError,
  onCloseOthers,
  onCloseAll,
}: UseTabCloseWorkflowParams) {
  const [pendingClose, setPendingClose] = useState<PendingCloseState | null>(null);

  const executeCloseMode = useCallback((mode: 'single' | 'others' | 'all') => {
    if (mode === 'single') {
      const active = defaultWorkspaceManager.getActiveDocument();
      if (active) {
        defaultWorkspaceManager.closeDocument(active.id, () => runtime.createDiagram().document);
      }
    } else if (mode === 'others') {
      const active = defaultWorkspaceManager.getActiveDocument();
      const others = defaultWorkspaceManager.getOpenDocuments().filter((d: DocumentRecord) => d.id !== active?.id);
      for (const d of others) {
        defaultWorkspaceManager.closeDocument(d.id, () => runtime.createDiagram().document);
      }
      onCloseOthers();
    } else if (mode === 'all') {
      const all = defaultWorkspaceManager.getOpenDocuments();
      for (const d of all) {
        defaultWorkspaceManager.closeDocument(d.id, () => runtime.createDiagram().document);
      }
      onCloseAll();
    }
    const next = defaultWorkspaceManager.getActiveDocument();
    if (next) {
      runtime.stores.$activeDiagram.set({ name: next.title, handle: next.id });
      const parsed = safeParse(next.content);
      if (parsed.success && parsed.ast) runtime.ctx.graph.setAST(parsed.ast);
    }
    setPendingClose(null);
  }, [onCloseOthers, onCloseAll, runtime]);

  const handleCloseActiveTab = useCallback(() => {
    const active = defaultWorkspaceManager.getActiveDocument();
    if (!active) return;
    const isDocSessionOnly = isDiagramHandle(active.id) && (corpusPersistence === 'non-persistent' || hasPersistenceError);
    if (active.isDirty || isDocSessionOnly) {
      setPendingClose({
        docsToClose: [active],
        currentIndex: 0,
        mode: 'single',
      });
    } else {
      defaultWorkspaceManager.closeDocument(active.id, () => runtime.createDiagram().document);
      const next = defaultWorkspaceManager.getActiveDocument();
      if (next) {
        runtime.stores.$activeDiagram.set({ name: next.title, handle: next.id });
        const parsed = safeParse(next.content);
        if (parsed.success && parsed.ast) runtime.ctx.graph.setAST(parsed.ast);
      }
    }
  }, [runtime, corpusPersistence, hasPersistenceError]);

  const handleCloseOthersWithPrompt = useCallback(() => {
    const active = defaultWorkspaceManager.getActiveDocument();
    const all = defaultWorkspaceManager.getOpenDocuments();
    const others = all.filter((d: DocumentRecord) => d.id !== active?.id);
    const isGlobalSessionOnly = corpusPersistence === 'non-persistent' || hasPersistenceError;
    const promptOthers = others.filter((d: DocumentRecord) => d.isDirty || (isDiagramHandle(d.id) && isGlobalSessionOnly));
    if (promptOthers.length > 0) {
      setPendingClose({
        docsToClose: promptOthers,
        currentIndex: 0,
        mode: 'others',
      });
    } else {
      for (const d of others) {
        defaultWorkspaceManager.closeDocument(d.id, () => runtime.createDiagram().document);
      }
      onCloseOthers();
    }
  }, [onCloseOthers, runtime, corpusPersistence, hasPersistenceError]);

  const handleCloseAllWithPrompt = useCallback(() => {
    const all = defaultWorkspaceManager.getOpenDocuments();
    const isGlobalSessionOnly = corpusPersistence === 'non-persistent' || hasPersistenceError;
    const promptAll = all.filter((d: DocumentRecord) => d.isDirty || (isDiagramHandle(d.id) && isGlobalSessionOnly));
    if (promptAll.length > 0) {
      setPendingClose({
        docsToClose: promptAll,
        currentIndex: 0,
        mode: 'all',
      });
    } else {
      for (const d of all) {
        defaultWorkspaceManager.closeDocument(d.id, () => runtime.createDiagram().document);
      }
      onCloseAll();
      const next = defaultWorkspaceManager.getActiveDocument();
      if (next) {
        runtime.stores.$activeDiagram.set({ name: next.title, handle: next.id });
        const parsed = safeParse(next.content);
        if (parsed.success && parsed.ast) runtime.ctx.graph.setAST(parsed.ast);
      }
    }
  }, [onCloseAll, runtime, corpusPersistence, hasPersistenceError]);

  const handleDialogSave = useCallback(async (applyToAll: boolean) => {
    if (!pendingClose) return;
    const currentDoc = pendingClose.docsToClose[pendingClose.currentIndex];
    if (currentDoc) {
      if (isDiagramHandle(currentDoc.id)) {
        const res = await runtime.saveDiagram(currentDoc.id);
        if (!res.success) return;
      } else {
        await defaultDocumentStore.saveDocument({
          id: currentDoc.id,
          title: currentDoc.title,
          content: currentDoc.content,
        });
        defaultWorkspaceManager.markClean(currentDoc.id);
      }
    }

    if (applyToAll) {
      for (let i = pendingClose.currentIndex + 1; i < pendingClose.docsToClose.length; i++) {
        const doc = pendingClose.docsToClose[i];
        if (isDiagramHandle(doc.id)) {
          const res = await runtime.saveDiagram(doc.id);
          if (!res.success) {
            setPendingClose({ ...pendingClose, currentIndex: i });
            return;
          }
        } else {
          await defaultDocumentStore.saveDocument({
            id: doc.id,
            title: doc.title,
            content: doc.content,
          });
          defaultWorkspaceManager.markClean(doc.id);
        }
      }
      executeCloseMode(pendingClose.mode);
    } else if (pendingClose.currentIndex + 1 < pendingClose.docsToClose.length) {
      setPendingClose({
        ...pendingClose,
        currentIndex: pendingClose.currentIndex + 1,
      });
    } else {
      executeCloseMode(pendingClose.mode);
    }
  }, [pendingClose, runtime, executeCloseMode]);

  const handleDialogDiscard = useCallback((applyToAll: boolean) => {
    if (!pendingClose) return;
    const currentDoc = pendingClose.docsToClose[pendingClose.currentIndex];
    if (currentDoc) {
      defaultWorkspaceManager.markClean(currentDoc.id);
    }

    if (applyToAll) {
      for (let i = pendingClose.currentIndex + 1; i < pendingClose.docsToClose.length; i++) {
        defaultWorkspaceManager.markClean(pendingClose.docsToClose[i].id);
      }
      executeCloseMode(pendingClose.mode);
    } else if (pendingClose.currentIndex + 1 < pendingClose.docsToClose.length) {
      setPendingClose({
        ...pendingClose,
        currentIndex: pendingClose.currentIndex + 1,
      });
    } else {
      executeCloseMode(pendingClose.mode);
    }
  }, [pendingClose, executeCloseMode]);

  const handleDialogCancel = useCallback(() => {
    setPendingClose(null);
  }, []);

  return {
    pendingClose,
    handleCloseActiveTab,
    handleCloseOthersWithPrompt,
    handleCloseAllWithPrompt,
    handleDialogSave,
    handleDialogDiscard,
    handleDialogCancel,
  };
}
