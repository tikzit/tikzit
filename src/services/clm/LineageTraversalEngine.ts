/**
 * src/services/clm/LineageTraversalEngine.ts - Sprint 23
 * Reachable hash traversal, history closure assertion, card verification, and export summary statistics.
 * Target: <= 150 LOC.
 */
import { ContentHash, MCard, type MCardCollection, type TriDatabaseManager } from 'clm-kernel';
import { isDiagramHandle, type CorpusIndexRecord } from './corpusPersistence';

export interface CollectionExportSummary {
  diagramsCount: number;
  archivedCount: number;
  versionsCount: number;
  totalCardsCount: number;
  orphanCardsCount: number;
  excludedReceiptsCount: number;
  excludedKnowledgeCount: number;
  defaultFilename: string;
}

export interface HistoryRecord {
  handle: string;
  previous_hash: string;
  changed_at?: string;
  changedAt?: string;
}

export interface VerifiedLineage {
  cards: Map<string, MCard>;
  histories: Array<{ handle: string; previousHash: string; changedAt: string }>;
  handleHeads: Map<string, string>;
}

export function getDiagramsDbFilename(date: Date = new Date()): string {
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const dd = String(date.getDate()).padStart(2, '0');
  return `tikzit-diagrams-${yyyy}${mm}${dd}.db`;
}

export function verifyCard(card: MCard, handle?: string): void {
  const recomputed = MCard.create(card.uri, card.payload, card.author, card.sequence);
  if (!recomputed.hash.equals(card.hash)) {
    const handleSuffix = handle ? ` for handle ${handle}` : '';
    throw new Error(`Card payload does not match hash ${card.hash.asHex()}${handleSuffix}`);
  }
}

export class LineageTraversalEngine {
  constructor(
    private readonly collection: MCardCollection,
    private readonly triDb: TriDatabaseManager,
    private readonly getIndex: () => CorpusIndexRecord[],
    private readonly getHistoryRows?: () => HistoryRecord[],
  ) {}

  async computeSummary(): Promise<CollectionExportSummary> {
    const rows = this.getIndex().map((r) => ({ ...r }));
    const diagramRows = rows.filter((r) => isDiagramHandle(r.handle));
    const diagramsCount = diagramRows.length;
    const archivedCount = diagramRows.filter((r) => Boolean(r.archived)).length;

    let versionsCount = 0;
    const reachableHashes = new Set<string>();
    const allHistoryRows = (this.getHistoryRows?.() ?? []).map((r) => ({ ...r }));

    for (const row of diagramRows) {
      const rawChain = this.collection.history(row.handle);
      const chain = rawChain.filter((h, idx) => idx === 0 || !h.equals(rawChain[idx - 1]));
      versionsCount += Math.max(1, chain.length);
      for (const hash of chain) reachableHashes.add(hash.asHex());
      const head = this.collection.resolveHandle(row.handle);
      if (head) reachableHashes.add(head.asHex());
      for (const hist of allHistoryRows.filter((r) => r.handle === row.handle)) reachableHashes.add(hist.previous_hash);

      if (row.handle.startsWith('zx:diagrams:')) {
        const metaHandle = `zx:meta:diagrams:${row.handle.slice('zx:diagrams:'.length)}`;
        const metaHead = this.collection.resolveHandle(metaHandle);
        if (metaHead) {
          reachableHashes.add(metaHead.asHex());
          const rawMetaChain = this.collection.history(metaHandle);
          const metaChain = rawMetaChain.filter((h, idx) => idx === 0 || !h.equals(rawMetaChain[idx - 1]));
          for (const mHash of metaChain) reachableHashes.add(mHash.asHex());
          for (const mHist of allHistoryRows.filter((r) => r.handle === metaHandle)) reachableHashes.add(mHist.previous_hash);
        }
      }
    }

    let excludedReceiptsCount = 0;
    try { excludedReceiptsCount = this.triDb.executionLog.list().length; } catch { excludedReceiptsCount = 0; }
    let excludedKnowledgeCount = 0;
    try { excludedKnowledgeCount = this.triDb.knowledge.list().length; } catch { excludedKnowledgeCount = 0; }

    return {
      diagramsCount,
      archivedCount,
      versionsCount,
      totalCardsCount: reachableHashes.size,
      orphanCardsCount: Math.max(0, this.collection.count() - reachableHashes.size),
      excludedReceiptsCount,
      excludedKnowledgeCount,
      defaultFilename: getDiagramsDbFilename(),
    };
  }

  traverseVerifiedLineage(snapshotRows?: CorpusIndexRecord[], snapshotHistoryRows?: HistoryRecord[]): VerifiedLineage {
    const rows = (snapshotRows ?? this.getIndex()).map((r) => ({ ...r }));
    const allHistoryRows = (snapshotHistoryRows ?? (this.getHistoryRows?.() ?? [])).map((r) => ({ ...r }));
    const seenHandles = new Set<string>();

    for (const row of rows) {
      if (seenHandles.has(row.handle)) throw new Error(`Duplicate corpus handle index row for handle ${row.handle}`);
      seenHandles.add(row.handle);
    }

    const targets: Array<{ handle: string; isMeta: boolean; expectedHash?: string }> = [];
    for (const row of rows) {
      if (!row || !isDiagramHandle(row.handle) || !Number.isFinite(row.committedAt)) {
        throw new Error(`Malformed corpus handle index for handle ${row?.handle ?? 'unknown'}`);
      }
      targets.push({ handle: row.handle, isMeta: false, expectedHash: row.hash });
      if (row.handle.startsWith('zx:diagrams:')) {
        targets.push({ handle: `zx:meta:diagrams:${row.handle.slice('zx:diagrams:'.length)}`, isMeta: true });
      }
    }

    const cards = new Map<string, MCard>();
    const histories: Array<{ handle: string; previousHash: string; changedAt: string }> = [];
    const handleHeads = new Map<string, string>();

    for (const target of targets) {
      const currentHash = this.collection.resolveHandle(target.handle);
      if (!currentHash) {
        if (target.isMeta) continue;
        throw new Error(`Missing head for handle ${target.handle}`);
      }
      if (target.expectedHash && currentHash.asHex() !== target.expectedHash) {
        throw new Error(`Stale corpus index for handle ${target.handle}`);
      }

      const rawChain = this.collection.history(target.handle);
      const chain = rawChain.filter((h, idx) => idx === 0 || !h.equals(rawChain[idx - 1]));
      if (chain.length === 0) throw new Error(`Incomplete corpus history for handle ${target.handle}`);
      if (!chain.at(-1)?.equals(currentHash)) throw new Error(`History chain does not end at HEAD for handle ${target.handle}`);

      const matchingHistory = allHistoryRows.filter((r) => r.handle === target.handle);
      if (chain.length > 1 && matchingHistory.length === 0) throw new Error(`Missing genuine history rows for handle ${target.handle}`);

      const fsHistory = matchingHistory.map((r) => ({
        previousHash: ContentHash.parse(r.previous_hash),
        changedAt: r.changed_at ?? r.changedAt ?? new Date().toISOString(),
      }));

      if (fsHistory.at(-1)?.previousHash.equals(currentHash)) {
        throw new Error(`HEAD appears as its own history for handle ${target.handle}`);
      }

      const priorHeads = new Set(chain.slice(0, -1).map((h) => h.asHex()));
      const recordedPrevious = new Set(fsHistory.map((h) => h.previousHash.asHex()));
      for (const prior of priorHeads) {
        if (!recordedPrevious.has(prior)) throw new Error(`Missing genuine history rows for handle ${target.handle}`);
      }

      const referenced = new Map<string, ContentHash>([[currentHash.asHex(), currentHash]]);
      for (const record of fsHistory) referenced.set(record.previousHash.asHex(), record.previousHash);
      for (const hash of chain) referenced.set(hash.asHex(), hash);

      for (const [hex, hash] of referenced) {
        const card = this.collection.get(hash);
        if (!card) throw new Error(`Missing historical MCard ${hex} for handle ${target.handle}`);
        verifyCard(card, target.handle);
        cards.set(hex, card);
      }

      for (const record of fsHistory) {
        histories.push({ handle: target.handle, previousHash: record.previousHash.asHex(), changedAt: record.changedAt });
      }
      handleHeads.set(target.handle, currentHash.asHex());
    }

    return { cards, histories, handleHeads };
  }
}
