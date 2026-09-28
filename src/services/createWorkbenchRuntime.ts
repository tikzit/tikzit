/**
 * src/services/createWorkbenchRuntime.ts - Sprint 21
 * Pure Cordis Microkernel Orchestrator & Service Assembly (< 350 LOC).
 * Decomposed into DocumentProcess, TabSessionController, SyncChannel, StorageSupervisor.
 */
import { Context } from 'cordis';
import { TriDatabaseManager, MCardFileSystem, MCardCollection, AgentDid } from 'clm-kernel';
import { createWorkbenchStores, type WorkbenchStores } from '../stores/createWorkbenchStores';
import { createKernelContext } from './kernel';
import { initTriDatabase, DEFAULT_AUTHOR_DID } from './clm/triDbAdapter';
import { registerTikzTriad } from './clm/triadDefinition';
import { DocumentCommitService, type DocumentHistoryResult, type RestoreVersionOptions, type RestoreVersionResult } from './clm/documentCommitService';
import { bindCordisToNanostores } from './nanostores-bridge';
import { createKeybindingDispatcher } from './keybindings';
import { CorpusExplorerService, type CorpusCommitResult, type CorpusManifestEntry, type OpenCorpusEntry } from './clm/corpusExplorerService';
import { CorpusPersistence, isDiagramHandle, type CorpusSnapshot } from './clm/corpusPersistence';
import { CorpusExportService, type CorpusSaveEnvironment, type CorpusSaveResult } from './clm/corpusExportService';
import { defaultWorkspaceManager, type DocumentRecord } from './workspace/WorkspaceManager';
import { safeParse } from '../core/parser/parser';
import { emitTikz } from '../core/parser/emitter';
import type { SqlJsTriDatabaseRuntime } from './clm/sqliteRuntime';
import { type SaveArtifactResult } from './export/saveArtifact';
import { DocumentProcess } from './lifecycle/DocumentProcess';
import { TabSessionController } from './lifecycle/TabSessionController';
import { SyncChannel } from './sync/SyncChannel';
import { StorageSupervisor } from './storage/StorageSupervisor';
import { DiagramExportCoordinator, type ExportDiagramOptions } from './export/diagramExportCoordinator';
import { bootstrapWorkbenchRuntime } from './runtimeBootstrap';

export type { ExportDiagramOptions };

export interface RuntimeBootstrap {
  storage: SqlJsTriDatabaseRuntime;
  persistence: CorpusPersistence;
  snapshot: CorpusSnapshot | null;
  manifest: CorpusManifestEntry[];
  fetcher: typeof fetch;
  getHistoryRows(): Array<{ handle: string; previous_hash: string; changed_at: string }>;
  flush(): Promise<void>;
}

export interface WorkbenchRuntimeOptions {
  id?: string;
  authorDid?: string;
  bindKeybindings?: boolean;
}

export interface WorkbenchRuntimeStartupOptions extends WorkbenchRuntimeOptions {
  temporarySession?: boolean;
}

export interface WorkbenchRuntime {
  readonly id: string;
  readonly ctx: Context;
  readonly stores: WorkbenchStores;
  readonly triDb: TriDatabaseManager;
  readonly mcardFs: MCardFileSystem;
  readonly mcardCollection: MCardCollection;
  readonly corpusExplorer: CorpusExplorerService;
  readonly authorDid: AgentDid;
  readonly isDisposed: boolean;
  createDiagram(title?: string): { handle: string; document: DocumentRecord };
  openCorpusEntry(handle: string): OpenCorpusEntry;
  saveActiveCorpusEntry(sourceText?: string, message?: string): Promise<CorpusCommitResult | null>;
  saveDiagram(handle: string, options?: { message?: string; sourceText?: string }): Promise<CorpusCommitResult>;
  dismissDraftCallout(handle: string): void;
  isDraftCalloutDismissed(handle: string): boolean;
  retryFlush(): Promise<boolean>;
  saveCorpusDb(environment?: CorpusSaveEnvironment): Promise<CorpusSaveResult>;
  renameDiagram(handle: string, newTitle: string): Promise<{ success: boolean; error?: string }>;
  archiveDiagram(handle: string, archived?: boolean): Promise<{ success: boolean; error?: string }>;
  duplicateDiagram(handle: string, newTitle?: string): Promise<{ success: boolean; newHandle?: string; error?: string }>;
  documentHistory(handle: string): DocumentHistoryResult;
  restoreVersion(options: RestoreVersionOptions): Promise<RestoreVersionResult>;
  discardAllRecovered(): void;
  openExportDialog(handle?: string): void;
  closeExportDialog(): void;
  exportDiagramArtifact(options: ExportDiagramOptions): Promise<SaveArtifactResult>;
  openExportCollectionDialog(): Promise<void>;
  closeExportCollectionDialog(): void;
  exportCollectionArtifact(environment?: CorpusSaveEnvironment): Promise<CorpusSaveResult>;
  dispose(): void;
  disposeAsync(): Promise<void>;
}

export function createWorkbenchRuntime(options: WorkbenchRuntimeOptions = {}): WorkbenchRuntime {
  return buildWorkbenchRuntime(options);
}

export async function createWorkbenchRuntimeAsync(options: WorkbenchRuntimeStartupOptions = {}): Promise<WorkbenchRuntime> {
  return bootstrapWorkbenchRuntime(options, buildWorkbenchRuntime);
}

function buildWorkbenchRuntime(options: WorkbenchRuntimeOptions = {}, bootstrap?: RuntimeBootstrap): WorkbenchRuntime {
  const id = options.id ?? `runtime_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
  const authorDidStr = options.authorDid ?? DEFAULT_AUTHOR_DID;
  const stores = createWorkbenchStores();
  const ctx = createKernelContext();
  const clmBridge = initTriDatabase(ctx, authorDidStr, bootstrap?.storage.triDb);
  const { triDb, mcardFs, mcardCollection, authorDid } = clmBridge;
  registerTikzTriad(triDb, authorDid);

  const historyDb = bootstrap?.storage && 'pillarDatabases' in bootstrap.storage
    ? bootstrap.storage.pillarDatabases?.mcard : (bootstrap?.storage?.databases ? bootstrap.storage.databases[2] : undefined);
  new DocumentCommitService(ctx, triDb, mcardCollection, authorDid, { historyDb });
  const flush = bootstrap?.flush ?? (async () => undefined);
  const corpusExplorer = new CorpusExplorerService(ctx, {
    collection: mcardCollection, commitService: ctx.documentCommit, persistence: { flush },
    authorDid, manifest: bootstrap?.manifest, initialIndex: bootstrap?.snapshot?.corpusIndex, fetcher: bootstrap?.fetcher,
  });
  const corpusExport = new CorpusExportService({
    triDb, collection: mcardCollection, authorDid, getIndex: () => corpusExplorer.getCorpusIndex(),
    getHistoryRows: bootstrap?.getHistoryRows, flush,
  });
  if (!bootstrap) stores.$corpusView.set({ status: 'ready', persistence: 'non-persistent', seedFailures: [] });

  const docProcess = new DocumentProcess(stores, corpusExplorer, (e, d) => ctx.emit(e as any, d as any));
  const tabController = new TabSessionController(ctx, stores, corpusExplorer);
  const syncChannel = new SyncChannel();
  const storageSupervisor = new StorageSupervisor({ flush, corpusExplorer, stores });
  const exportCoordinator = new DiagramExportCoordinator(stores, corpusExplorer, mcardCollection);

  const disposers: Array<() => void> = [];
  if (bootstrap && typeof window !== 'undefined') {
    const onPageHide = () => void storageSupervisor.flush().catch(() => undefined);
    window.addEventListener('pagehide', onPageHide);
    disposers.push(() => window.removeEventListener('pagehide', onPageHide));
  }
  disposers.push(bindCordisToNanostores(ctx, stores));
  disposers.push(defaultWorkspaceManager.subscribe(() => {
    const active = defaultWorkspaceManager.getActiveDocument();
    if (!active || isDiagramHandle(active.id)) return;
    const head = stores.$documentHead.get();
    if (head.hash || head.handle) stores.$documentHead.set({ handle: '', hash: '', sequence: 0, isValid: true });
    const diagram = stores.$activeDiagram.get();
    if (diagram.handle !== active.id || diagram.name !== active.title) stores.$activeDiagram.set({ name: active.title, handle: active.id });
  }));

  disposers.push(ctx.command.register('cmd:view:sidebar', () => stores.$workbenchLayout.setKey('isDrawerCollapsed', !stores.$workbenchLayout.get().isDrawerCollapsed)));
  disposers.push(ctx.command.register('cmd:dock:depress', () => stores.$workbenchLayout.setKey('isWorkbenchDepressed', true)));
  disposers.push(ctx.command.register('cmd:dock:restore', () => stores.$workbenchLayout.setKey('isWorkbenchDepressed', false)));
  disposers.push(ctx.command.register('cmd:edit:delete', () => {
    const sel = stores.$selectedElements.get();
    if (sel.nodes.length > 0 || sel.edges.length > 0) {
      const graph = stores.$graphAST.get();
      const nodeSet = new Set(sel.nodes);
      const edgeSet = new Set(sel.edges);
      const newNodes = graph.nodes.filter((n) => !nodeSet.has(n.id));
      const newEdges = graph.edges.filter((ed) => !edgeSet.has(ed.id) && !nodeSet.has(ed.sourceId) && !nodeSet.has(ed.targetId));
      ctx.selection.clearSelection();
      const nextAst = { ...graph, nodes: newNodes, edges: newEdges };
      const active = defaultWorkspaceManager.getActiveDocument();
      if (active) defaultWorkspaceManager.updateContent(active.id, emitTikz(nextAst), nextAst);
      ctx.graph.setAST(nextAst);
    }
  }));
  disposers.push(ctx.command.register('cmd:view:toggle-theme', () => {
    const nextTheme = stores.$theme.get() === 'dark' ? 'light' : 'dark';
    stores.$theme.set(nextTheme);
    if (typeof document !== 'undefined') {
      document.documentElement.classList.toggle('dark', nextTheme === 'dark');
      document.documentElement.classList.toggle('light', nextTheme === 'light');
      try { localStorage.setItem('tikzit:theme', nextTheme); } catch {}
    }
  }));

  let untitledCount = 0;
  if (options.bindKeybindings !== false && typeof window !== 'undefined') {
    disposers.push(createKeybindingDispatcher(ctx, window));
  }

  let isDisposed = false;
  let disposePromise: Promise<void> | undefined;
  const disposeBindings = () => {
    if (isDisposed) return;
    isDisposed = true;
    docProcess.clear();
    syncChannel.clear();
    disposers.forEach((d) => { try { d(); } catch (err) { console.warn('Error during disposal:', err); } });
    disposers.length = 0;
  };

  const runtime: WorkbenchRuntime = {
    id, ctx, stores, triDb, mcardFs, mcardCollection, corpusExplorer, authorDid,
    get isDisposed() { return isDisposed; },
    createDiagram: (title) => { untitledCount++; return docProcess.createDiagram(title, untitledCount); },
    openCorpusEntry: (handle) => tabController.openCorpusEntry(handle),
    saveActiveCorpusEntry: async (sourceText, message) => {
      const active = defaultWorkspaceManager.getActiveDocument();
      return active && isDiagramHandle(active.id) ? docProcess.saveDiagram(active.id, { sourceText, message }) : null;
    },
    saveDiagram: (handle, opts) => docProcess.saveDiagram(handle, opts),
    dismissDraftCallout: (handle) => docProcess.dismissDraftCallout(handle),
    isDraftCalloutDismissed: (handle) => docProcess.isDraftCalloutDismissed(handle),
    retryFlush: () => storageSupervisor.retryFlush(),
    saveCorpusDb: async (env) => {
      const res = await corpusExport.saveCorpusDb(env);
      if (!res.persisted) {
        const view = stores.$corpusView.get();
        stores.$corpusView.set({ ...view, persistence: 'non-persistent', persistenceError: res.persistenceError ?? 'Export receipt was not persisted' });
      }
      return res;
    },
    renameDiagram: async (handle, newTitle) => {
      const res = await corpusExplorer.renameDiagram(handle, newTitle);
      if (res.success) {
        defaultWorkspaceManager.renameDocument(handle, newTitle);
        const active = stores.$activeDiagram.get();
        if (active.handle === handle) stores.$activeDiagram.set({ ...active, name: newTitle });
        stores.$corpusEntries.set(corpusExplorer.listCorpusEntries({ includeArchived: stores.$sessionRecovery.get().showArchived }).entries);
      }
      return res;
    },
    archiveDiagram: async (handle, archived = true) => {
      const res = await corpusExplorer.archiveDiagram(handle, archived);
      if (res.success) stores.$corpusEntries.set(corpusExplorer.listCorpusEntries({ includeArchived: stores.$sessionRecovery.get().showArchived }).entries);
      return res;
    },
    duplicateDiagram: async (handle, newTitle) => {
      const res = await corpusExplorer.duplicateDiagram(handle, newTitle);
      if (res.success && res.newHandle) stores.$corpusEntries.set(corpusExplorer.listCorpusEntries({ includeArchived: stores.$sessionRecovery.get().showArchived }).entries);
      return res;
    },
    documentHistory: (handle) => corpusExplorer.documentHistory(handle),
    restoreVersion: async (opts) => {
      const res = await corpusExplorer.restoreVersion(opts);
      if (res.status === 'success') {
        const active = defaultWorkspaceManager.getActiveDocument();
        if (active && active.id === opts.handle) {
          ctx.graph.setAST(res.ast);
          stores.$activeDiagram.set({ name: active.title, handle: active.id });
          stores.$documentHead.set({ handle: active.id, hash: res.hash, sequence: 0, isValid: true, lastCommittedAt: Date.now() });
        }
        stores.$corpusEntries.set(corpusExplorer.listCorpusEntries({ includeArchived: stores.$sessionRecovery.get().showArchived }).entries);
      }
      return res;
    },
    discardAllRecovered: () => {
      defaultWorkspaceManager.discardAllRecovered({
        resolveHeadContent: (h) => {
          try {
            const hash = mcardCollection.resolveHandle(h);
            if (!hash) return null;
            const card = mcardCollection.get(hash);
            return card && card.payload.kind === 'text' ? card.payload.value : null;
          } catch { return null; }
        },
      });
      const activeDoc = defaultWorkspaceManager.getActiveDocument();
      if (activeDoc) {
        stores.$activeDiagram.set({ name: activeDoc.title, handle: activeDoc.id });
        const parsed = safeParse(activeDoc.content);
        if (parsed.success && parsed.ast) ctx.graph.setAST(parsed.ast);
      }
      stores.$sessionRecovery.set({ ...stores.$sessionRecovery.get(), recoveredCount: 0, dirtyHandles: [] });
    },
    openExportDialog: (handle) => exportCoordinator.openExportDialog(handle),
    closeExportDialog: () => exportCoordinator.closeExportDialog(),
    exportDiagramArtifact: (opts) => exportCoordinator.exportDiagramArtifact(opts),
    openExportCollectionDialog: async () => {
      const summary = await corpusExport.getCollectionExportSummary();
      stores.$exportCollectionDialogState.set({ isOpen: true, summary, progress: 'idle', outcome: 'idle', filename: summary.defaultFilename });
    },
    closeExportCollectionDialog: () => stores.$exportCollectionDialogState.set({ ...stores.$exportCollectionDialogState.get(), isOpen: false, progress: 'idle' }),
    exportCollectionArtifact: async (env) => {
      const cur = stores.$exportCollectionDialogState.get();
      const filename = cur.filename || cur.summary?.defaultFilename;
      stores.$exportCollectionDialogState.set({ ...cur, progress: 'verifying', outcome: 'idle', errorMessage: undefined, failingHandle: undefined });
      const res = await corpusExport.saveCorpusDb(env, {
        filename,
        onProgress: (step) => stores.$exportCollectionDialogState.set({ ...stores.$exportCollectionDialogState.get(), progress: step }),
      });
      const upd = stores.$exportCollectionDialogState.get();
      if (res.status === 'success') {
        const outcome = res.method === 'picker' ? 'saved' : 'fallback';
        stores.$exportCollectionDialogState.set({ ...upd, progress: 'done', outcome, receiptPersisted: res.persisted, lastAnnouncement: res.method === 'picker' ? `Collection saved to ${res.filename}.` : `Collection downloaded as ${res.filename} via browser fallback.` });
      } else if (res.status === 'cancelled') {
        stores.$exportCollectionDialogState.set({ ...upd, progress: 'done', outcome: 'cancelled', lastAnnouncement: 'Export cancelled.' });
      } else {
        stores.$exportCollectionDialogState.set({ ...upd, progress: 'done', outcome: res.failureCode === 'VerificationError' ? 'verification-failed' : 'write-failed', errorMessage: res.failureReason, failingHandle: res.failingHandle, lastAnnouncement: `Export failed: ${res.failureReason || 'Unknown error'}` });
      }
      return res;
    },
    dispose: () => {
      if (bootstrap) void runtime.disposeAsync().catch(() => undefined);
      else disposeBindings();
    },
    disposeAsync: () => {
      if (!disposePromise) {
        disposePromise = (async () => {
          try { await storageSupervisor.flush(); }
          finally {
            disposeBindings();
            bootstrap?.storage.close();
            await bootstrap?.persistence.close();
          }
        })();
      }
      return disposePromise;
    },
  };

  const registerCmd = (name: string, handler: (...args: any[]) => any) => disposers.push(ctx.command.register(name as any, handler));
  registerCmd('tikzit.diagram.create', () => runtime.createDiagram());
  registerCmd('cmd:diagram:create', () => runtime.createDiagram());
  registerCmd('tikzit.diagram.rename', (h: string, t: string) => runtime.renameDiagram(h, t));
  registerCmd('cmd:diagram:rename', (h: string, t: string) => runtime.renameDiagram(h, t));
  registerCmd('tikzit.diagram.archive', (h: string) => runtime.archiveDiagram(h, true));
  registerCmd('cmd:diagram:archive', (h: string) => runtime.archiveDiagram(h, true));
  registerCmd('tikzit.diagram.unarchive', (h: string) => runtime.archiveDiagram(h, false));
  registerCmd('cmd:diagram:unarchive', (h: string) => runtime.archiveDiagram(h, false));
  registerCmd('tikzit.diagram.duplicate', (h: string, t?: string) => runtime.duplicateDiagram(h, t));
  registerCmd('cmd:diagram:duplicate', (h: string, t?: string) => runtime.duplicateDiagram(h, t));
  registerCmd('tikzit.diagram.export', (h?: string) => runtime.openExportDialog(h));
  registerCmd('cmd:diagram:export', (h?: string) => runtime.openExportDialog(h));
  registerCmd('tikzit.collection.export', () => runtime.openExportCollectionDialog());
  registerCmd('cmd:collection:export', () => runtime.openExportCollectionDialog());

  return runtime;
}
