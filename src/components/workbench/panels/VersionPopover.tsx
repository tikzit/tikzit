/**
 * src/components/workbench/panels/VersionPopover.tsx - Sprint 22
 * Decomposed VersionPopover container (< 150 LOC) composing:
 * - VersionHistoryList
 * - VersionCompareModal
 * - VersionRestoreDialog
 */
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { defaultDocumentStore, type DocumentRevision } from '../../../services/storage/DocumentStore';
import { defaultWorkspaceManager } from '../../../services/workspace/WorkspaceManager';
import { isDiagramHandle } from '../../../services/clm/corpusPersistence';
import type { WorkbenchRuntime } from '../../../services/createWorkbenchRuntime';
import { useWorkbenchRuntime } from '../WorkbenchRuntimeContext';
import type { HistoryRow, DocumentHistoryResult } from '../../../services/clm/documentCommitService';
import { VersionHistoryList } from './history/VersionHistoryList';
import { VersionCompareModal } from './history/VersionCompareModal';
import { VersionRestoreDialog } from './history/VersionRestoreDialog';

export interface VersionPopoverProps {
  documentId: string;
  onClose: () => void;
  onRestored?: (content: string) => void;
  runtime?: WorkbenchRuntime;
}

export const VersionPopover: React.FC<VersionPopoverProps> = ({
  documentId,
  onClose,
  onRestored,
  runtime: propRuntime,
}) => {
  let contextRuntime: WorkbenchRuntime | null = null;
  try { contextRuntime = useWorkbenchRuntime(); } catch {}
  const runtime = propRuntime ?? contextRuntime ?? ((globalThis as any).defaultWorkbenchRuntime as WorkbenchRuntime | undefined);

  const isMCard = useMemo(() => isDiagramHandle(documentId), [documentId]);
  const [legacyRevisions, setLegacyRevisions] = useState<DocumentRevision[]>([]);
  const [history, setHistory] = useState<DocumentHistoryResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [liveAnnouncement, setLiveAnnouncement] = useState('');

  const [previewVersion, setPreviewVersion] = useState<HistoryRow | null>(null);
  const [previewContent, setPreviewContent] = useState<string | null>(null);
  const [compareVersion, setCompareVersion] = useState<HistoryRow | null>(null);
  const [compareContent, setCompareContent] = useState<string | null>(null);
  const [restoreTarget, setRestoreTarget] = useState<HistoryRow | null>(null);
  const [restoreMode, setRestoreMode] = useState<'clean' | 'dirty' | null>(null);
  const [isRestoring, setIsRestoring] = useState(false);

  const activeDoc = defaultWorkspaceManager.getActiveDocument();

  const loadHistory = useCallback(async () => {
    setLoading(true);
    if (isMCard && runtime) {
      try { setHistory(runtime.documentHistory(documentId)); } catch { setHistory(null); }
    } else {
      setLegacyRevisions(await defaultDocumentStore.getRevisions(documentId));
    }
    setLoading(false);
  }, [documentId, isMCard, runtime]);

  useEffect(() => { loadHistory(); }, [loadHistory]);

  const resolveContent = useCallback((hash: string): string => {
    try {
      const card = runtime?.mcardCollection.get(hash as any);
      return card && card.payload.kind === 'text' ? card.payload.value : '';
    } catch { return ''; }
  }, [runtime]);

  const handleCopyHash = (hash: string) => {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(hash).then(() => setLiveAnnouncement(`Copied hash ${hash.slice(0, 8)} to clipboard.`));
    }
  };

  const handleSavepointCreate = async () => {
    if (!runtime) return;
    await runtime.saveDiagram(documentId, { message });
    setMessage('');
    loadHistory();
  };

  const handleRestoreInitiate = (row: HistoryRow) => {
    setRestoreTarget(row);
    setRestoreMode(activeDoc?.isDirty ? 'dirty' : 'clean');
  };

  const executeRestore = async (saveFirst: boolean) => {
    if (!restoreTarget || !runtime) return;
    setIsRestoring(true);
    try {
      if (saveFirst && activeDoc) await runtime.saveDiagram(documentId, { message: 'Pre-restore savepoint' });
      const res = await runtime.restoreVersion({ handle: documentId, targetHash: restoreTarget.hash });
      if (res.status === 'success') {
        if (onRestored && res.content) onRestored(res.content);
        setLiveAnnouncement(`Restored version #${restoreTarget.position}.`);
        setRestoreMode(null);
        setRestoreTarget(null);
        loadHistory();
      }
    } finally { setIsRestoring(false); }
  };

  const rows: HistoryRow[] = useMemo(() => {
    if (isMCard) return history?.rows ?? [];
    return legacyRevisions.map((rev, idx) => ({
      position: idx + 1,
      hash: rev.hash,
      changedAt: new Date(rev.timestamp).toISOString(),
      label: rev.message,
    }));
  }, [isMCard, history, legacyRevisions]);

  const currentContent = activeDoc?.content ?? '';

  return (
    <div
      data-testid="version-popover"
      className="absolute right-0 top-full mt-2 w-96 max-w-[calc(100vw-2rem)] bg-neutral-900 border border-neutral-700/80 rounded-lg shadow-2xl z-50 p-3 flex flex-col text-neutral-200 max-h-[85vh]"
    >
      <div data-testid="history-live-announcer" aria-live="polite" className="sr-only">
        {liveAnnouncement}
      </div>

      <div className="flex items-center justify-between pb-2 mb-2 border-b border-neutral-800">
        <div className="flex items-center gap-2">
          {!isMCard ? (
            <h2 data-testid="heading-legacy-revisions" className="text-xs font-semibold text-neutral-100 uppercase tracking-wider">
              Legacy Revisions
            </h2>
          ) : (
            <h2 className="text-xs font-semibold text-neutral-100 uppercase tracking-wider">
              Version History
            </h2>
          )}
          <span
            data-testid="history-version-count"
            className="px-1.5 py-0.2 bg-neutral-800 text-neutral-400 rounded text-[10px] font-mono"
          >
            {rows.length}
          </span>
        </div>
        <button data-testid="btn-close-history" onClick={onClose} className="text-neutral-400 hover:text-neutral-200 text-xs px-1">✕</button>
      </div>

      {loading ? (
        <div data-testid="history-loading" className="py-8 text-center text-xs text-neutral-500">Loading history...</div>
      ) : (
        <VersionHistoryList
          headHash={history?.head ?? (rows[rows.length - 1]?.hash || '')}
          rows={rows}
          activeHash={history?.head ?? ''}
          message={message}
          onMessageChange={setMessage}
          onSavepointCreate={handleSavepointCreate}
          isSaving={false}
          onCopyHash={handleCopyHash}
          onPreview={(r) => { setPreviewVersion(r); setPreviewContent(resolveContent(r.hash)); }}
          onCompare={(r) => { setCompareVersion(r); setCompareContent(resolveContent(r.hash)); }}
          onRestore={handleRestoreInitiate}
        />
      )}

      {restoreMode && restoreTarget && (
        <VersionRestoreDialog
          mode={restoreMode}
          target={restoreTarget}
          isRestoring={isRestoring}
          onConfirmClean={() => executeRestore(false)}
          onSaveFirst={() => executeRestore(true)}
          onDiscardAndRestore={() => executeRestore(false)}
          onCancel={() => { setRestoreMode(null); setRestoreTarget(null); }}
        />
      )}

      <VersionCompareModal
        compareVersion={compareVersion}
        compareContent={compareContent}
        currentContent={currentContent}
        onCloseCompare={() => { setCompareVersion(null); setCompareContent(null); }}
        previewVersion={previewVersion}
        previewContent={previewContent}
        onClosePreview={() => { setPreviewVersion(null); setPreviewContent(null); }}
      />
    </div>
  );
};
