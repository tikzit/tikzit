/**
 * src/services/clm/corpusExportService.ts - Sprint 23
 * Coordinating facade for CLM corpus database export, lineage verification, and audit receipts.
 * Target: <= 120 LOC.
 */
import { AgentDid, ContentHash, MCardCollection, TriDatabaseManager } from 'clm-kernel';
import type { CorpusIndexRecord } from './corpusPersistence';
import {
  LineageTraversalEngine,
  type CollectionExportSummary,
  type HistoryRecord,
  getDiagramsDbFilename,
} from './LineageTraversalEngine';
import {
  CollectionSnapshotWriter,
  type CorpusExportArtifact,
} from './CollectionSnapshotWriter';
import {
  ExportFileBridge,
  type CorpusSaveEnvironment,
  type CorpusSaveResult,
  type CorpusSaveStatus,
} from './ExportFileBridge';

export type {
  CorpusSaveStatus,
  CorpusSaveResult,
  CollectionExportSummary,
  CorpusSaveEnvironment,
  CorpusExportArtifact,
};
export { getDiagramsDbFilename };

export interface ExportCorpusDbOptions {
  onProgress?: (step: 'verifying' | 'writing') => void;
  filename?: string;
}

export interface SaveCorpusDbOptions {
  onProgress?: (step: 'verifying' | 'writing') => void;
  filename?: string;
}

export interface CorpusExportOptions {
  triDb: TriDatabaseManager;
  collection: MCardCollection;
  authorDid: AgentDid;
  getIndex(): CorpusIndexRecord[];
  getHistoryRows?(): HistoryRecord[];
  flush(): Promise<void>;
}

export class CorpusExportService {
  private readonly getIndex: () => CorpusIndexRecord[];
  private readonly getHistoryRows?: () => HistoryRecord[];
  private readonly flush: () => Promise<void>;
  private readonly lineageEngine: LineageTraversalEngine;
  private readonly snapshotWriter: CollectionSnapshotWriter;
  private readonly fileBridge: ExportFileBridge;

  constructor(options: CorpusExportOptions) {
    this.getIndex = options.getIndex;
    this.getHistoryRows = options.getHistoryRows;
    this.flush = options.flush;
    this.lineageEngine = new LineageTraversalEngine(
      options.collection,
      options.triDb,
      options.getIndex,
      options.getHistoryRows,
    );
    this.snapshotWriter = new CollectionSnapshotWriter();
    this.fileBridge = new ExportFileBridge(options.triDb, options.authorDid, options.flush);
  }

  async getCollectionExportSummary(): Promise<CollectionExportSummary> {
    try { await this.flush(); } catch {}
    return this.lineageEngine.computeSummary();
  }

  async exportCorpusDb(options?: ExportCorpusDbOptions): Promise<Uint8Array> {
    const artifact = await this.exportCorpusDbWithMetadata(options);
    return artifact.bytes;
  }

  async exportCorpusDbWithMetadata(options?: ExportCorpusDbOptions): Promise<CorpusExportArtifact> {
    // Coherent single snapshot capture at export initiation (19-AC-08)
    const snapshotRows = this.getIndex().map((r) => ({ ...r }));
    const snapshotHistoryRows = (this.getHistoryRows?.() ?? []).map((r) => ({ ...r }));

    options?.onProgress?.('verifying');
    try { await this.flush(); } catch {}
    const lineage = this.lineageEngine.traverseVerifiedLineage(snapshotRows, snapshotHistoryRows);
    options?.onProgress?.('writing');
    return this.snapshotWriter.writeSnapshot(lineage, options?.filename ?? getDiagramsDbFilename());
  }

  async saveCorpusDb(environment: CorpusSaveEnvironment = {}, options?: SaveCorpusDbOptions): Promise<CorpusSaveResult> {
    const filename = options?.filename ?? getDiagramsDbFilename();
    let status: CorpusSaveStatus = 'failure';
    let cardCount = 0;
    let failureCode: string | undefined;
    let failureReason: string | undefined;
    let failingHandle: string | undefined;
    let manifestDigest = '';
    let method: 'picker' | 'fallback' = 'picker';

    try {
      const artifact = await this.exportCorpusDbWithMetadata({ onProgress: options?.onProgress, filename });
      cardCount = artifact.cardCount;
      manifestDigest = artifact.manifestDigest;

      const delivery = await this.fileBridge.deliverFile(artifact.bytes, filename, environment);
      status = delivery.status;
      method = delivery.method;
      failureCode = delivery.failureCode;
      failureReason = delivery.failureReason;
    } catch (error) {
      status = 'failure';
      const msg = error instanceof Error ? error.message : String(error);
      const handleMatch = msg.match(/for handle ([^\s:]+:[^\s]+)/i);
      failingHandle = handleMatch ? handleMatch[1] : undefined;
      failureCode = (failingHandle || msg.includes('for handle'))
        ? 'VerificationError'
        : (error instanceof Error ? error.name || 'ExportError' : 'ExportError');
      failureReason = msg;
    }

    if (!manifestDigest) {
      manifestDigest = ContentHash.computeString(
        JSON.stringify(this.getIndex().slice().sort((a, b) => a.handle.localeCompare(b.handle)))
      ).asHex();
    }

    const audit = await this.fileBridge.recordAuditReceipt({
      status,
      cardCount,
      manifestDigest,
      filename,
      failureCode,
      failingHandle,
    });

    return {
      status,
      method,
      cardCount,
      filename,
      persisted: audit.persisted,
      persistenceError: audit.persistenceError,
      failureCode,
      failureReason,
      failingHandle,
    };
  }
}
