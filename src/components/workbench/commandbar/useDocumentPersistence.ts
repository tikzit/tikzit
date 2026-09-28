/**
 * src/components/workbench/commandbar/useDocumentPersistence.ts - Sprint 22
 * Hook managing diagram save lifecycle, draft tracking, and success pill triggers.
 */
import { useState, useRef, useEffect, useCallback } from 'react';
import { defaultWorkspaceManager } from '../../../services/workspace/WorkspaceManager';
import { isDiagramHandle } from '../../../services/clm/corpusPersistence';
import type { WorkbenchRuntime } from '../../../services/createWorkbenchRuntime';

export interface UseDocumentPersistenceParams {
  runtime: WorkbenchRuntime;
  openDocs: Array<{ id: string; hash?: string }>;
  activeDoc: { id: string; title: string; hash?: string } | undefined;
  isDirty: boolean;
}

export function useDocumentPersistence({
  runtime,
  openDocs,
  activeDoc,
  isDirty,
}: UseDocumentPersistenceParams) {
  const [liveAnnouncement, setLiveAnnouncement] = useState('');
  const [successPillHandle, setSuccessPillHandle] = useState<string | null>(null);
  const successPillTimerRef = useRef<NodeJS.Timeout | null>(null);
  const wasDraftMapRef = useRef<Map<string, boolean>>(new Map());
  const draftPendingPersistenceRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    for (const doc of openDocs) {
      if (isDiagramHandle(doc.id) && !doc.hash && !wasDraftMapRef.current.has(doc.id)) {
        wasDraftMapRef.current.set(doc.id, true);
      }
    }
  }, [openDocs]);

  const triggerSuccessPill = useCallback((handle: string) => {
    if (successPillTimerRef.current) clearTimeout(successPillTimerRef.current);
    setSuccessPillHandle(handle);
    successPillTimerRef.current = setTimeout(() => {
      setSuccessPillHandle(null);
      successPillTimerRef.current = null;
    }, 1800);
  }, []);

  useEffect(() => {
    const unsub = runtime.ctx.on('tikzit/document:persisted', (ev: { handle: string; hash: string }) => {
      const active = defaultWorkspaceManager.getActiveDocument();
      if (active?.id === ev.handle && (draftPendingPersistenceRef.current.has(ev.handle) || wasDraftMapRef.current.get(ev.handle))) {
        draftPendingPersistenceRef.current.delete(ev.handle);
        wasDraftMapRef.current.delete(ev.handle);
        triggerSuccessPill(ev.handle);
        setLiveAnnouncement(`${active.title} saved to MCard.`);
      }
    });
    return () => { if (typeof unsub === 'function') unsub(); };
  }, [runtime, triggerSuccessPill]);

  useEffect(() => {
    if (successPillHandle && (!activeDoc || activeDoc.id !== successPillHandle || isDirty)) {
      if (successPillTimerRef.current) {
        clearTimeout(successPillTimerRef.current);
        successPillTimerRef.current = null;
      }
      setSuccessPillHandle(null);
    }
  }, [activeDoc, isDirty, successPillHandle]);

  useEffect(() => () => { if (successPillTimerRef.current) clearTimeout(successPillTimerRef.current); }, []);

  const handleSave = useCallback(async () => {
    const active = defaultWorkspaceManager.getActiveDocument();
    if (!active) return;
    if (isDiagramHandle(active.id)) {
      const wasDraft = !active.hash;
      if (wasDraft) draftPendingPersistenceRef.current.add(active.id);
      const result = await runtime.saveDiagram(active.id);
      if (result.success) {
        if (result.persisted && wasDraft) {
          draftPendingPersistenceRef.current.delete(active.id);
          wasDraftMapRef.current.delete(active.id);
          triggerSuccessPill(active.id);
        }
        setLiveAnnouncement(`${active.title} saved${result.sequence ? ` as version ${result.sequence}` : ''}.`);
      } else {
        draftPendingPersistenceRef.current.delete(active.id);
        setLiveAnnouncement(`Save failed for ${active.title}: ${result.reason || 'Error'}`);
      }
    } else {
      await defaultWorkspaceManager.saveActive();
    }
  }, [runtime, triggerSuccessPill]);

  const handleRetryFlush = useCallback(() => {
    void runtime.retryFlush().then((ok: boolean) => {
      const active = defaultWorkspaceManager.getActiveDocument();
      if (ok && active && (draftPendingPersistenceRef.current.has(active.id) || wasDraftMapRef.current.get(active.id)) && !active.isDirty) {
        draftPendingPersistenceRef.current.delete(active.id);
        wasDraftMapRef.current.delete(active.id);
        triggerSuccessPill(active.id);
      }
    });
  }, [runtime, triggerSuccessPill]);

  return {
    liveAnnouncement,
    successPillHandle,
    handleSave,
    handleRetryFlush,
  };
}
