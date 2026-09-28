/**
 * src/services/clm/DiagramCommitCoordinator.ts - Sprint 23
 * Coordinates document commits, corpus seeding, and version restoration.
 * Target: <= 160 LOC.
 */
import { AgentDid, MCard, type MCardCollection, structuredPayload } from 'clm-kernel';
import type {
  DocumentCommitService,
  CommitDocumentResult,
  RestoreVersionOptions,
  RestoreVersionResult,
} from './documentCommitService';
import { defaultWorkspaceManager } from '../workspace/WorkspaceManager';
import { isDiagramHandle } from './corpusPersistence';
import { safeParse } from '../../core/parser/parser';
import type { DiagramIndexService, CorpusManifestEntry, CorpusIndexIssue } from './DiagramIndexService';
import { type DiagramLifecycleManager, type DiagramMetadata, cleanPayload } from './DiagramLifecycleManager';

export interface CorpusSeedResult {
  committed: number;
  failed: number;
  complete: boolean;
  failures: CorpusIndexIssue[];
  persistenceError?: string;
}

export interface CorpusCommitResult extends CommitDocumentResult {
  unchanged?: boolean;
  persisted: boolean;
  persistenceError?: string;
}

export type CorpusFetcher = (url: string) => Promise<Response>;

export interface DiagramCommitCoordinatorOptions {
  collection: MCardCollection;
  commitService: DocumentCommitService;
  indexService: DiagramIndexService;
  lifecycleManager: DiagramLifecycleManager;
  getPersistence: () => { flush(): Promise<void> };
  authorDid: AgentDid;
  getManifest: () => CorpusManifestEntry[];
  getFetcher: () => CorpusFetcher;
  getBaseUrl: () => string;
  onPersisted?: (payload: { handle: string; hash: string }) => void;
}

export class DiagramCommitCoordinator {
  private readonly collection: MCardCollection;
  private readonly commitService: DocumentCommitService;
  private readonly indexService: DiagramIndexService;
  private readonly lifecycleManager: DiagramLifecycleManager;
  private readonly getPersistence: () => { flush(): Promise<void> };
  private readonly authorDid: AgentDid;
  private readonly getManifest: () => CorpusManifestEntry[];
  private readonly getFetcher: () => CorpusFetcher;
  private readonly getBaseUrl: () => string;
  private readonly onPersisted?: (payload: { handle: string; hash: string }) => void;

  constructor(options: DiagramCommitCoordinatorOptions) {
    this.collection = options.collection;
    this.commitService = options.commitService;
    this.indexService = options.indexService;
    this.lifecycleManager = options.lifecycleManager;
    this.getPersistence = options.getPersistence;
    this.authorDid = options.authorDid;
    this.getManifest = options.getManifest;
    this.getFetcher = options.getFetcher;
    this.getBaseUrl = options.getBaseUrl;
    this.onPersisted = options.onPersisted;
  }

  async seedZxCorpus(): Promise<CorpusSeedResult> {
    const failures: CorpusIndexIssue[] = [];
    const manifest = this.getManifest();
    const initialIndexSize = this.indexService.getIndex().length;
    const prepared: Array<{ manifest: CorpusManifestEntry; handle: string; source: string }> = [];
    const encoder = new TextDecoder('utf-8', { fatal: true });

    for (const entry of manifest) {
      const handle = `zx:examples:${entry.id}`;
      try {
        const existingHash = this.collection.resolveHandle(handle);
        if (existingHash) {
          const card = this.collection.get(existingHash);
          if (!card || card.payload.kind !== 'text' || !safeParse(card.payload.value).success) {
            throw new Error('Existing corpus head is not a valid TikZ card');
          }
          const updated = this.indexService.updateRow(handle, (r) => { r.hash = existingHash.asHex(); });
          if (!updated) {
            this.indexService.upsertRow({ handle, hash: existingHash.asHex(), committedAt: Date.now() });
          }
          continue;
        }
        const response = await this.getFetcher()(`${this.getBaseUrl()}${entry.tikz_file}`);
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const bytes = new Uint8Array(await response.arrayBuffer());
        if (bytes.byteLength !== entry.tikz_bytes) throw new Error(`Byte count mismatch: ${bytes.byteLength}`);
        if (!globalThis.crypto?.subtle) throw new Error('Web Crypto SHA-256 is unavailable');
        const digest = new Uint8Array(await globalThis.crypto.subtle.digest('SHA-256', bytes));
        const actualHash = Array.from(digest, (byte) => byte.toString(16).padStart(2, '0')).join('');
        if (actualHash.toLowerCase() !== entry.tikz_sha256.toLowerCase()) throw new Error('SHA-256 mismatch');
        const source = encoder.decode(bytes);
        const parsed = safeParse(source);
        if (!parsed.success || !parsed.ast) throw new Error('TikZ parse failed');
        prepared.push({ manifest: entry, handle, source });
      } catch (error) {
        failures.push({ handle, reason: error instanceof Error ? error.message : String(error) });
      }
    }

    let committed = 0;
    let persistenceError: string | undefined;
    for (const item of prepared) {
      const result = await this.commitCorpusDocument({ handle: item.handle, sourceText: item.source, uri: `tikzit://diagram/${item.manifest.id}`, activate: false });
      if (result.success) committed++;
      else failures.push({ handle: item.handle, reason: result.reason ?? 'Commit gate bailed' });
      if (!result.persisted) persistenceError = result.persistenceError ?? 'storage unavailable';
    }
    if (prepared.length === 0 && this.indexService.getIndex().length !== initialIndexSize) {
      try { await this.getPersistence().flush(); } catch (error) {
        persistenceError = error instanceof Error ? error.message : String(error);
      }
    }
    return {
      committed,
      failed: failures.length,
      complete: failures.length === 0 && manifest.every((entry) => Boolean(this.collection.resolveHandle(`zx:examples:${entry.id}`))),
      failures,
      persistenceError,
    };
  }

  async commitCorpusDocument(options: {
    handle: string;
    sourceText: string;
    uri?: string;
    activate?: boolean;
    title?: string;
    message?: string;
    metadata?: Partial<DiagramMetadata>;
  }): Promise<CorpusCommitResult> {
    if (!isDiagramHandle(options.handle)) {
      return { success: false, reason: `Not a corpus handle: ${options.handle}`, persisted: false, receiptHash: '' };
    }
    const currentHash = this.collection.resolveHandle(options.handle);
    const currentCard = currentHash ? this.collection.get(currentHash) : undefined;
    if (currentHash && currentCard?.payload.kind === 'text' && currentCard.payload.value === options.sourceText) {
      try {
        await this.getPersistence().flush();
        return { success: true, unchanged: true, persisted: true, hash: currentHash.asHex(), sequence: currentCard.sequence, receiptHash: '' };
      } catch (error) {
        return { success: true, unchanged: true, persisted: false, persistenceError: error instanceof Error ? error.message : String(error), hash: currentHash.asHex(), sequence: currentCard.sequence, receiptHash: '' };
      }
    }
    const result = this.commitService.saveDocumentWithGate({
      ...options,
      authorDid: this.authorDid,
      message: options.message,
    });
    if (result.success && result.hash) {
      const existing = this.indexService.getIndex().find((row) => row.handle === options.handle);
      const title = options.title ?? existing?.title ?? (options.handle.startsWith('zx:diagrams:') ? `Diagram ${options.handle.slice('zx:diagrams:'.length).slice(0, 8)}` : undefined);
      const isArchived = options.metadata?.archived ?? existing?.archived ?? false;

      if (options.handle.startsWith('zx:diagrams:')) {
        const uuid = options.handle.slice('zx:diagrams:'.length);
        const metaHandle = `zx:meta:diagrams:${uuid}`;
        const existingMeta = this.lifecycleManager.getDiagramMetadata(options.handle);
        const hist = this.commitService.documentHistory(options.handle);
        const labels = { ...(existingMeta?.labels ?? {}) };
        if (options.message) labels[String(hist.rows.length)] = options.message;

        const metaCard = MCard.create(
          `tikzit://meta/diagrams/${uuid}`,
          structuredPayload(cleanPayload({
            title: title ?? existingMeta?.title ?? `Diagram ${uuid.slice(0, 8)}`,
            archived: isArchived,
            createdAt: existingMeta?.createdAt ?? options.metadata?.createdAt ?? Date.now(),
            source: existingMeta?.source ?? options.metadata?.source ?? 'user',
            legacyId: existingMeta?.legacyId ?? options.metadata?.legacyId,
            legacySavedAt: existingMeta?.legacySavedAt ?? options.metadata?.legacySavedAt,
            isImported: existingMeta?.isImported ?? options.metadata?.isImported,
            forkedFrom: existingMeta?.forkedFrom ?? options.metadata?.forkedFrom,
            updatedAt: Date.now(),
            labels: Object.keys(labels).length > 0 ? labels : undefined,
          })),
          this.authorDid,
          0
        );
        const currentMetaHash = this.collection.resolveHandle(metaHandle);
        if (!currentMetaHash || !currentMetaHash.equals(metaCard.hash)) {
          this.collection.putWithHandle(metaCard, metaHandle);
        }
      }

      this.indexService.upsertRow({ handle: options.handle, hash: result.hash, committedAt: Date.now(), title, archived: isArchived });
    }
    try {
      await this.getPersistence().flush();
      return { ...result, persisted: true };
    } catch (error) {
      return { ...result, persisted: false, persistenceError: error instanceof Error ? error.message : String(error) };
    }
  }

  async restoreVersion(options: RestoreVersionOptions): Promise<RestoreVersionResult> {
    const result = await this.commitService.restoreVersion(options);
    if (result.status === 'success') {
      this.indexService.updateRow(options.handle, (r) => {
        r.hash = result.hash;
        r.committedAt = Date.now();
      });
      defaultWorkspaceManager.applyRestoredHead(options.handle, result.content, result.ast, result.hash);
      try {
        await this.getPersistence().flush();
        this.onPersisted?.({ handle: options.handle, hash: result.hash });
      } catch (err) {
        console.warn('Failed to flush after restore:', err);
      }
    }
    return result;
  }
}
