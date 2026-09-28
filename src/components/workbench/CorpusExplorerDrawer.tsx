/**
 * src/components/workbench/CorpusExplorerDrawer.tsx - Sprint 22
 * Decomposed CorpusExplorerDrawer container (< 180 LOC) composing:
 * - ExplorerSearchBar
 * - ExplorerSectionList
 * - ExplorerEntryRow
 */
import React, { useEffect, useState, useMemo } from 'react';
import { useStore } from '@nanostores/react';
import type { WorkbenchRuntime } from '../../services/createWorkbenchRuntime';
import { isDiagramHandle } from '../../services/clm/corpusPersistence';
import { defaultWorkspaceManager } from '../../services/workspace/WorkspaceManager';
import { ExplorerSearchBar } from './explorer/ExplorerSearchBar';
import { ExplorerSectionList } from './explorer/ExplorerSectionList';
import type { ExplorerItem } from './explorer/ExplorerEntryRow';

interface CorpusExplorerDrawerProps {
  runtime: WorkbenchRuntime;
  activeHandle: string;
  isCollapsed: boolean;
  width: number;
}

export const CorpusExplorerDrawer: React.FC<CorpusExplorerDrawerProps> = ({
  runtime,
  activeHandle,
  isCollapsed,
  width,
}) => {
  const corpusQuery = useStore(runtime.stores.$corpusQuery);
  const corpusEntries = useStore(runtime.stores.$corpusEntries);
  const corpusView = useStore(runtime.stores.$corpusView);
  const sessionRecovery = useStore(runtime.stores.$sessionRecovery);

  const [openDocs, setOpenDocs] = useState(defaultWorkspaceManager.getOpenDocuments());
  const [debouncedQuery, setDebouncedQuery] = useState(corpusQuery);
  const [openMenuHandle, setOpenMenuHandle] = useState<string | null>(null);
  const [editingHandle, setEditingHandle] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [liveAnnouncement, setLiveAnnouncement] = useState('');

  useEffect(() => {
    return defaultWorkspaceManager.subscribe((state) => {
      setOpenDocs([...state.openDocs]);
    });
  }, []);

  useEffect(() => {
    const timeout = window.setTimeout(() => setDebouncedQuery(corpusQuery), 100);
    return () => window.clearTimeout(timeout);
  }, [corpusQuery]);

  useEffect(() => {
    const handleClickOutside = () => setOpenMenuHandle(null);
    window.addEventListener('click', handleClickOutside);
    return () => window.removeEventListener('click', handleClickOutside);
  }, []);

  const showArchived = sessionRecovery.showArchived;
  const listing = runtime.corpusExplorer.listCorpusEntries({ includeArchived: showArchived });
  const allCorpusHandles = new Set(
    runtime.corpusExplorer.listCorpusEntries({ includeArchived: true }).entries.map((e) => e.handle)
  );

  const drafts: ExplorerItem[] = useMemo(() => {
    return openDocs
      .filter((doc) => !allCorpusHandles.has(doc.id) && isDiagramHandle(doc.id) && doc.id.startsWith('zx:diagrams:'))
      .map((doc) => ({
        handle: doc.id,
        title: doc.title,
        type: 'draft' as const,
        badge: 'Draft' as const,
        nodeCount: doc.ast?.nodes?.length ?? 0,
        edgeCount: doc.ast?.edges?.length ?? 0,
        updatedAt: doc.updatedAt,
        createdAt: doc.createdAt,
        archived: false,
        isImported: false,
        version: 0,
      }));
  }, [openDocs, allCorpusHandles]);

  const committedItems: ExplorerItem[] = useMemo(() => {
    return listing.entries.map((entry) => {
      const isExample = entry.handle.startsWith('zx:examples:');
      let version = 1;
      try {
        const history = runtime.mcardCollection.history(entry.handle);
        if (history.length > 0) version = history.length;
      } catch {
        version = 1;
      }
      return {
        handle: entry.handle,
        title: entry.title,
        type: isExample ? ('example' as const) : ('diagram' as const),
        badge: isExample ? ('Example' as const) : ('Diagram' as const),
        nodeCount: entry.nodeCount,
        edgeCount: entry.edgeCount,
        updatedAt: entry.updatedAt,
        createdAt: entry.createdAt ?? entry.updatedAt,
        archived: Boolean(entry.archived),
        isImported: Boolean(entry.isImported),
        version,
      };
    });
  }, [listing, runtime]);

  const allItems = useMemo(() => [...drafts, ...committedItems], [drafts, committedItems]);
  const userDiagramsCount = committedItems.filter((i) => i.type === 'diagram').length + drafts.length;

  const handleSelect = (handle: string) => {
    runtime.openCorpusEntry(handle);
  };

  const handleRenameCommit = async (handle: string) => {
    if (!editTitle.trim()) { setEditingHandle(null); return; }
    await runtime.renameDiagram(handle, editTitle.trim());
    setLiveAnnouncement(`Renamed diagram to ${editTitle.trim()}`);
    setEditingHandle(null);
  };

  if (isCollapsed) return null;

  return (
    <aside style={{ width }} className="h-full bg-neutral-900 border-r border-neutral-800 flex flex-col select-none relative">
      <div data-testid="live-announcer" aria-live="polite" className="sr-only">{liveAnnouncement}</div>

      {sessionRecovery.recoveredCount > 0 && (
        <div data-testid="recovery-banner" className="bg-amber-950/80 border-b border-amber-700/60 p-2 text-xs text-amber-200 flex flex-col gap-1">
          <span>Unsaved edits recovered from previous session.</span>
          <div className="flex gap-2 mt-1">
            <button data-testid="btn-recovery-review" onClick={() => setLiveAnnouncement('Reviewing recovered drafts')} className="text-[11px] underline">Review</button>
            <button data-testid="btn-recovery-discard" onClick={() => runtime.discardAllRecovered()} className="text-[11px] underline text-rose-300">Discard all</button>
          </div>
        </div>
      )}

      {corpusView.persistence === 'stale' && (
        <div data-testid="stale-reload-banner" className="bg-rose-950/80 border-b border-rose-700/60 p-2 text-xs text-rose-200 flex items-center justify-between">
          <span>Storage updated in another window.</span>
          <button data-testid="btn-reload-window" onClick={() => window.location.reload()} className="px-2 py-0.5 bg-rose-800 rounded text-[10px]">Reload</button>
        </div>
      )}

      <ExplorerSearchBar
        query={corpusQuery}
        onQueryChange={(q) => runtime.stores.$corpusQuery.set(q)}
        showArchived={showArchived}
        onToggleShowArchived={() => runtime.stores.$sessionRecovery.set({ ...sessionRecovery, showArchived: !showArchived })}
        onNewDiagram={() => runtime.createDiagram()}
        onExportCollection={() => runtime.openExportCollectionDialog()}
      />

      {userDiagramsCount === 0 && !debouncedQuery ? (
        <div data-testid="empty-diagrams-card" className="p-4 m-2 bg-neutral-950/60 rounded border border-neutral-800 text-center text-xs text-neutral-400">
          <p className="mb-2">No user diagrams created yet.</p>
          <button data-testid="btn-empty-state-new-diagram" onClick={() => runtime.createDiagram()} className="px-3 py-1 bg-sky-600 hover:bg-sky-500 text-white rounded font-medium text-xs">
            Create First Diagram
          </button>
        </div>
      ) : null}

      <ExplorerSectionList
        items={allItems}
        query={debouncedQuery}
        activeHandle={activeHandle}
        onSelect={handleSelect}
        openMenuHandle={openMenuHandle}
        onToggleMenu={(h, e) => { e.stopPropagation(); setOpenMenuHandle(openMenuHandle === h ? null : h); }}
        editingHandle={editingHandle}
        editTitle={editTitle}
        onEditTitleChange={setEditTitle}
        onRenameCommit={handleRenameCommit}
        onRenameCancel={() => setEditingHandle(null)}
        onStartRename={(item) => { setEditingHandle(item.handle); setEditTitle(item.title); setOpenMenuHandle(null); }}
        onDuplicate={(h) => { runtime.duplicateDiagram(h); setOpenMenuHandle(null); }}
        onToggleArchive={(h, arch) => { runtime.archiveDiagram(h, arch); setOpenMenuHandle(null); }}
        onExport={(h) => { runtime.openExportDialog(h); setOpenMenuHandle(null); }}
      />

      <div data-testid="corpus-persistence-state" className="p-2 border-t border-neutral-800 text-[10px] text-neutral-500 font-mono flex items-center justify-between">
        <span>Storage: {corpusView.persistence}</span>
        {corpusView.persistenceError && <span className="text-rose-400 truncate max-w-[120px]">{corpusView.persistenceError}</span>}
      </div>
    </aside>
  );
};
