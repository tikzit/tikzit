import { Service, type Context } from 'cordis';
import type { AgentDid, MCardCollection } from 'clm-kernel';
import type {
  DocumentCommitService,
  DocumentHistoryResult,
  RestoreVersionOptions,
  RestoreVersionResult,
} from './documentCommitService';
import type { CorpusIndexRecord } from './corpusPersistence';
import type { GraphAST } from '../../core/domain/types';
import {
  DiagramIndexService,
  type CorpusManifestEntry,
  type CorpusEntry,
  type CorpusIndexIssue,
  type CorpusListing,
  formatContentId,
} from './DiagramIndexService';
import {
  DiagramLifecycleManager,
  type DiagramMetadata,
  cleanPayload,
} from './DiagramLifecycleManager';
import {
  DiagramCommitCoordinator,
  type CorpusSeedResult,
  type CorpusCommitResult,
  type CorpusFetcher,
} from './DiagramCommitCoordinator';

export type {
  CorpusManifestEntry,
  CorpusEntry,
  CorpusIndexIssue,
  CorpusListing,
  DiagramMetadata,
  CorpusSeedResult,
  CorpusCommitResult,
  CorpusFetcher,
};
export { cleanPayload, formatContentId };

declare module 'cordis' {
  interface Context {
    corpusExplorer: CorpusExplorerService;
  }
}

export interface CorpusExplorerOptions {
  collection: MCardCollection;
  commitService: DocumentCommitService;
  persistence: { flush(): Promise<void> };
  authorDid: AgentDid;
  manifest?: CorpusManifestEntry[];
  initialIndex?: CorpusIndexRecord[];
  fetcher?: CorpusFetcher;
  baseUrl?: string;
}

export interface OpenCorpusEntry {
  entry: CorpusEntry;
  source: string;
  ast: GraphAST;
  sequence: number;
}

export class CorpusExplorerService extends Service {
  private readonly collection: MCardCollection;
  private readonly commitService: DocumentCommitService;
  private persistence: CorpusExplorerOptions['persistence'];
  private manifest: CorpusManifestEntry[];
  private fetcher: CorpusFetcher;
  private readonly baseUrl: string;
  private issues: CorpusIndexIssue[] = [];

  private readonly indexService: DiagramIndexService;
  private readonly lifecycleManager: DiagramLifecycleManager;
  private readonly commitCoordinator: DiagramCommitCoordinator;

  constructor(ctx: Context, options: CorpusExplorerOptions) {
    super(ctx, 'corpusExplorer');
    this.collection = options.collection;
    this.commitService = options.commitService;
    this.persistence = options.persistence;
    this.manifest = options.manifest ?? [];
    this.fetcher = options.fetcher ?? fetch;
    this.baseUrl = options.baseUrl ?? '/docs/examples/';

    this.indexService = new DiagramIndexService(options.initialIndex ?? []);
    this.lifecycleManager = new DiagramLifecycleManager({
      collection: this.collection,
      authorDid: options.authorDid,
      indexService: this.indexService,
      getPersistence: () => this.persistence,
      getManifest: () => this.manifest,
    });
    this.commitCoordinator = new DiagramCommitCoordinator({
      collection: this.collection,
      commitService: this.commitService,
      indexService: this.indexService,
      lifecycleManager: this.lifecycleManager,
      getPersistence: () => this.persistence,
      authorDid: options.authorDid,
      getManifest: () => this.manifest,
      getFetcher: () => this.fetcher,
      getBaseUrl: () => this.baseUrl,
      onPersisted: (payload) => {
        this.ctx.emit('tikzit/document:persisted', payload);
      },
    });
  }

  configure(options: Pick<CorpusExplorerOptions, 'manifest' | 'fetcher' | 'initialIndex' | 'persistence'>): void {
    if (options.manifest) this.manifest = options.manifest;
    if (options.fetcher) this.fetcher = options.fetcher;
    if (options.persistence) this.persistence = options.persistence;
    if (options.initialIndex) this.restoreIndex(options.initialIndex);
  }

  getCorpusIndex(): CorpusIndexRecord[] {
    return this.indexService.getIndex();
  }

  restoreIndex(records: CorpusIndexRecord[]): void {
    this.indexService.restoreIndex(records);
  }

  getDiagramMetadata(handle: string): DiagramMetadata | null {
    return this.lifecycleManager.getDiagramMetadata(handle);
  }

  async renameDiagram(handle: string, newTitle: string): Promise<{ success: boolean; error?: string }> {
    return this.lifecycleManager.renameDiagram(handle, newTitle);
  }

  async archiveDiagram(handle: string, archived: boolean = true): Promise<{ success: boolean; error?: string }> {
    return this.lifecycleManager.archiveDiagram(handle, archived);
  }

  async duplicateDiagram(handle: string, newTitle?: string): Promise<{ success: boolean; newHandle?: string; error?: string }> {
    return this.lifecycleManager.duplicateDiagram(handle, newTitle);
  }

  async markDiagramOpened(handle: string): Promise<void> {
    return this.lifecycleManager.markDiagramOpened(handle);
  }

  listCorpusEntries(options?: { includeArchived?: boolean }): CorpusListing {
    const result = this.indexService.listEntries(this.collection, this.manifest, this.lifecycleManager, options);
    this.issues = result.issues;
    return result;
  }

  searchCorpus(query: string, options?: { includeArchived?: boolean }): CorpusEntry[] {
    return this.indexService.searchEntries(this.collection, this.manifest, this.lifecycleManager, query, options);
  }

  openEntry(handle: string): OpenCorpusEntry {
    const row = this.indexService.getIndex().find((entry) => entry.handle === handle);
    if (!row) throw new Error(`Corpus entry not indexed: ${handle}`);
    const hash = this.collection.resolveHandle(handle);
    if (!hash || hash.asHex() !== row.hash.toLowerCase()) throw new Error(`Corpus entry is stale: ${handle}`);
    const card = this.collection.get(hash);
    if (!card || card.payload.kind !== 'text') throw new Error(`Corpus entry is not a TikZ text card: ${handle}`);
    const parsed = this.indexService.parseCard(hash.asHex(), card.payload.value);
    if (!parsed) throw new Error(`Corpus entry failed parsing: ${handle}`);
    const entry = this.listCorpusEntries({ includeArchived: true }).entries.find((c) => c.handle === handle);
    if (!entry) throw new Error(`Corpus entry failed index validation: ${handle}`);
    void this.markDiagramOpened(handle);
    return { entry, source: card.payload.value, ast: parsed.ast, sequence: card.sequence };
  }

  async seedZxCorpus(): Promise<CorpusSeedResult> {
    return this.commitCoordinator.seedZxCorpus();
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
    return this.commitCoordinator.commitCorpusDocument(options);
  }

  documentHistory(handle: string): DocumentHistoryResult {
    return this.commitService.documentHistory(handle);
  }

  async restoreVersion(options: RestoreVersionOptions): Promise<RestoreVersionResult> {
    return this.commitCoordinator.restoreVersion(options);
  }

  async flush(): Promise<void> {
    await this.persistence.flush();
  }

  get lastIssues(): CorpusIndexIssue[] {
    return [...this.issues];
  }
}
