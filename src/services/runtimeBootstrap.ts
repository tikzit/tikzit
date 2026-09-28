/**
 * src/services/runtimeBootstrap.ts - Sprint 21
 * Browser asynchronous bootstrap loader for WorkbenchRuntime.
 * Initializes IndexedDB persistence, SqlJsTriDatabase, manifest, and session recovery.
 */
import { CorpusPersistence, type CorpusSnapshot } from './clm/corpusPersistence';
import type { CorpusManifestEntry } from './clm/corpusExplorerService';
import type { SqlJsTriDatabaseRuntime } from './clm/sqliteRuntime';
import { runLegacyImport } from './clm/legacyImportService';
import { defaultWorkspaceManager } from './workspace/WorkspaceManager';
import { safeParse } from '../core/parser/parser';
import type { WorkbenchRuntime, WorkbenchRuntimeStartupOptions } from './createWorkbenchRuntime';

export async function bootstrapWorkbenchRuntime(
  options: WorkbenchRuntimeStartupOptions,
  buildRuntime: (opts: any, bootstrap: any) => WorkbenchRuntime
): Promise<WorkbenchRuntime> {
  if (typeof window === 'undefined') throw new Error('Workbench runtime can only start in a browser');
  const temporarySession = options.temporarySession === true;
  const persistence = new CorpusPersistence({ indexedDB: temporarySession ? null : window.indexedDB });
  let snapshot: CorpusSnapshot | null = null;
  try {
    await persistence.open();
    if (!temporarySession) snapshot = await persistence.readSnapshot();
  } catch (error) {
    await persistence.close();
    throw error;
  }

  const { createSqlJsTriDatabase } = await import('./clm/sqliteRuntime');
  let storage: SqlJsTriDatabaseRuntime;
  try {
    storage = await createSqlJsTriDatabase(snapshot);
  } catch (error) {
    await persistence.close();
    throw error;
  }

  let runtime: WorkbenchRuntime | undefined;
  try {
    const baseUrl = (import.meta.env?.BASE_URL as string | undefined) ?? '/';
    const response = await fetch(`${baseUrl}docs/examples/manifest.json`);
    if (!response.ok) throw new Error(`Corpus manifest request failed: HTTP ${response.status}`);
    const manifest = await response.json() as CorpusManifestEntry[];

    const flush = async () => {
      if (persistence.state !== 'persistent') throw new Error(persistence.error ?? 'Persistent storage is unavailable');
      const [k, e, m] = storage.backends as [{ exportBinary(): Uint8Array | undefined }, { exportBinary(): Uint8Array | undefined }, { exportBinary(): Uint8Array | undefined }];
      const pillars = { knowledge: k.exportBinary(), executionLog: e.exportBinary(), mcard: m.exportBinary() };
      if (!pillars.knowledge || !pillars.executionLog || !pillars.mcard) throw new Error('Could not serialize all CLM pillars');
      await persistence.writeSnapshot({
        generation: snapshot?.generation ?? 0,
        pillars: { knowledge: new Uint8Array(pillars.knowledge), executionLog: new Uint8Array(pillars.executionLog), mcard: new Uint8Array(pillars.mcard) },
        corpusIndex: runtime?.corpusExplorer.getCorpusIndex() ?? snapshot?.corpusIndex ?? [],
      });
      if (runtime) {
        const view = runtime.stores.$corpusView.get();
        runtime.stores.$corpusView.set({ ...view, persistence: 'persistent', persistenceError: undefined });
      }
    };

    const getHistoryRows = () => {
      const mcardDb = storage.pillarDatabases?.mcard ?? storage.databases[2];
      if (!mcardDb) throw new Error('MCard database schema invalid: missing mcard pillar');
      return (mcardDb.exec('SELECT handle, previous_hash, changed_at FROM handle_history ORDER BY id ASC')[0]?.values as Array<[unknown, unknown, unknown]> | undefined)?.map(([h, p, c]) => ({
        handle: String(h), previous_hash: String(p), changed_at: String(c),
      })) ?? [];
    };

    runtime = buildRuntime(options, { storage, persistence, snapshot, manifest, fetcher: (url: string) => fetch(url), getHistoryRows, flush });
    const seeded = await runtime.corpusExplorer.seedZxCorpus();
    const legacyResult = await runLegacyImport({ corpusExplorer: runtime.corpusExplorer, authorDid: runtime.authorDid, workspaceManager: defaultWorkspaceManager });

    const sessionRecovery = defaultWorkspaceManager.restoreSessionState({
      resolveHeadContent: (h) => {
        try {
          const hash = runtime!.mcardCollection.resolveHandle(h);
          if (!hash) return null;
          const card = runtime!.mcardCollection.get(hash);
          return card && card.payload.kind === 'text' ? card.payload.value : null;
        } catch { return null; }
      },
    });

    let announcement = '';
    if (sessionRecovery.recoveredCount > 0) announcement += `Recovered unsaved edits in ${sessionRecovery.recoveredCount} diagram${sessionRecovery.recoveredCount > 1 ? 's' : ''}.`;
    if (legacyResult.importedCount > 0) announcement += (announcement ? ' ' : '') + `Imported ${legacyResult.importedCount} legacy diagram${legacyResult.importedCount > 1 ? 's' : ''}.`;
    runtime.stores.$sessionRecovery.set({ recoveredCount: sessionRecovery.recoveredCount, dirtyHandles: sessionRecovery.dirtyHandles, announcement, showArchived: false });
    runtime.stores.$corpusEntries.set(runtime.corpusExplorer.listCorpusEntries().entries);

    const activeDoc = defaultWorkspaceManager.getActiveDocument();
    if (activeDoc) {
      runtime.stores.$activeDiagram.set({ name: activeDoc.title, handle: activeDoc.id });
      const parsed = safeParse(activeDoc.content);
      if (parsed.success && parsed.ast) runtime.ctx.graph.setAST(parsed.ast);
    }

    let pErr = persistence.error;
    try { await runtime.corpusExplorer.flush(); } catch (err) { pErr = err instanceof Error ? err.message : String(err); }
    runtime.stores.$corpusView.set({ status: 'ready', persistence: persistence.state === 'persistent' && !pErr ? 'persistent' : 'non-persistent', persistenceError: pErr, seedFailures: seeded.failures });
    return runtime;
  } catch (error) {
    if (runtime) {
      try { await runtime.disposeAsync(); } catch { await persistence.close(); }
    } else { storage.close(); await persistence.close(); }
    throw error;
  }
}
