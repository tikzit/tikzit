/**
 * src/services/clm/DiagramIndexService.ts - Sprint 23
 * In-memory index table management, fuzzy search, and cached parsing for CLM corpus.
 * Target: <= 150 LOC.
 */
import { ContentHash, type MCardCollection } from 'clm-kernel';
import type { GraphAST } from '../../core/domain/types';
import { safeParse } from '../../core/parser/parser';
import { isDiagramHandle, type CorpusIndexRecord } from './corpusPersistence';

export interface CorpusManifestEntry {
  id: string;
  title: string;
  tikz_file: string;
  tikz_bytes: number;
  tikz_sha256: string;
}

export interface CorpusEntry {
  handle: string;
  hash: string;
  name: string;
  title: string;
  nodeCount: number;
  edgeCount: number;
  updatedAt: number;
  archived?: boolean;
  createdAt?: number;
  source?: 'user' | 'duplicate' | 'legacy-import';
  isImported?: boolean;
  forkedFrom?: string;
}

export interface CorpusIndexIssue {
  handle: string;
  reason: string;
}

export interface CorpusListing {
  entries: CorpusEntry[];
  issues: CorpusIndexIssue[];
}

export interface DiagramMetadataReader {
  getDiagramMetadata(handle: string): { title?: string; archived?: boolean; createdAt?: number; source?: 'user' | 'duplicate' | 'legacy-import'; isImported?: boolean; forkedFrom?: string } | null;
}

export function formatContentId(hash: string): string {
  return hash ? ContentHash.parse(hash).asPrefixed() : '';
}

function normalize(value: string): string {
  return value.trim().toLocaleLowerCase();
}

export function subsequenceDistance(query: string, candidate: string): number | null {
  let cursor = 0;
  let first = -1;
  let last = -1;
  for (const character of query) {
    const found = candidate.indexOf(character, cursor);
    if (found < 0) return null;
    if (first < 0) first = found;
    last = found;
    cursor = found + 1;
  }
  const span = last - first + 1;
  return span - query.length <= Math.max(2, query.length * 2) ? span : null;
}

export class DiagramIndexService {
  private index: CorpusIndexRecord[];
  private readonly parseCache = new Map<string, { ast: GraphAST; nodeCount: number; edgeCount: number }>();

  constructor(initialIndex: CorpusIndexRecord[] = []) {
    this.index = initialIndex.map((r) => ({ ...r }));
  }

  getIndex(): CorpusIndexRecord[] {
    return this.index.map((r) => ({ ...r }));
  }

  restoreIndex(records: CorpusIndexRecord[]): void {
    this.index = records.map((r) => ({ ...r }));
  }

  updateRow(handle: string, updater: (row: CorpusIndexRecord) => void): boolean {
    const row = this.index.find((r) => r.handle === handle);
    if (row) {
      updater(row);
      return true;
    }
    return false;
  }

  upsertRow(record: CorpusIndexRecord): void {
    this.index = this.index.filter((r) => r.handle !== record.handle);
    this.index.push({ ...record });
  }

  parseCard(hashHex: string, source: string): { ast: GraphAST; nodeCount: number; edgeCount: number } | null {
    const cached = this.parseCache.get(hashHex);
    if (cached) return cached;
    const parsed = safeParse(source);
    if (!parsed.success || !parsed.ast) return null;
    const result = { ast: parsed.ast, nodeCount: parsed.ast.nodes.length, edgeCount: parsed.ast.edges.length };
    this.parseCache.set(hashHex, result);
    return result;
  }

  listEntries(collection: MCardCollection, manifest: CorpusManifestEntry[], metaReader: DiagramMetadataReader, options?: { includeArchived?: boolean }): CorpusListing {
    const entries: CorpusEntry[] = [];
    const issues: CorpusIndexIssue[] = [];
    const manifestById = new Map(manifest.map((entry) => [entry.id, entry]));

    for (const row of this.index) {
      if (!row || typeof row.handle !== 'string' || !isDiagramHandle(row.handle) || !/^[a-f0-9]{64}$/i.test(row.hash)) {
        issues.push({ handle: String(row?.handle ?? ''), reason: 'Malformed corpus index row' });
        continue;
      }
      const currentHash = collection.resolveHandle(row.handle);
      if (!currentHash || currentHash.asHex() !== row.hash.toLowerCase()) {
        issues.push({ handle: row.handle, reason: 'Corpus index head is stale or missing' });
        continue;
      }
      const card = collection.get(currentHash);
      if (!card || card.payload.kind !== 'text') {
        issues.push({ handle: row.handle, reason: 'Corpus card is missing or is not text' });
        continue;
      }
      const parsed = this.parseCard(currentHash.asHex(), card.payload.value);
      if (!parsed) {
        issues.push({ handle: row.handle, reason: 'Corpus card source no longer parses' });
        continue;
      }
      let name = '';
      let title = '';
      let isArchived = Boolean(row.archived);
      let metadata: any = null;

      if (row.handle.startsWith('zx:examples:')) {
        const id = row.handle.slice('zx:examples:'.length);
        const manifestEntry = manifestById.get(id);
        name = `${id}.tikz`;
        title = row.title ?? manifestEntry?.title ?? id;
        isArchived = false;
      } else {
        const id = row.handle.slice('zx:diagrams:'.length);
        name = `${id}.tikz`;
        metadata = metaReader.getDiagramMetadata(row.handle);
        if (metadata) {
          title = metadata.title ?? row.title ?? `Diagram ${id.slice(0, 8)}`;
          isArchived = Boolean(metadata.archived);
          row.title = title;
          row.archived = isArchived;
        } else {
          title = row.title ?? `Diagram ${id.slice(0, 8)}`;
        }
      }

      if (isArchived && !options?.includeArchived) continue;

      entries.push({
        handle: row.handle,
        hash: currentHash.asHex(),
        name,
        title,
        nodeCount: parsed.nodeCount,
        edgeCount: parsed.edgeCount,
        updatedAt: Number.isFinite(row.committedAt) ? row.committedAt : 0,
        archived: isArchived,
        createdAt: metadata?.createdAt ?? (Number.isFinite(row.committedAt) ? row.committedAt : 0),
        source: metadata?.source,
        isImported: metadata?.isImported,
        forkedFrom: metadata?.forkedFrom,
      });
    }

    entries.sort((a, b) => a.title.localeCompare(b.title) || a.handle.localeCompare(b.handle));
    return { entries, issues };
  }

  searchEntries(collection: MCardCollection, manifest: CorpusManifestEntry[], metaReader: DiagramMetadataReader, query: string, options?: { includeArchived?: boolean }): CorpusEntry[] {
    const normalizedQuery = normalize(query);
    const entries = this.listEntries(collection, manifest, metaReader, options).entries;
    if (!normalizedQuery) return entries;
    return entries
      .map((entry) => {
        const title = normalize(entry.title);
        const handle = normalize(entry.handle);
        if (title === normalizedQuery || handle === normalizedQuery) return { entry, rank: 0 };
        if (title.startsWith(normalizedQuery) || handle.startsWith(normalizedQuery)) return { entry, rank: 1 };
        if (title.includes(normalizedQuery) || handle.includes(normalizedQuery)) return { entry, rank: 2 };
        const fuzzy = subsequenceDistance(normalizedQuery, `${title} ${handle}`);
        return fuzzy === null ? null : { entry, rank: 3 + fuzzy / 1000 };
      })
      .filter((result): result is { entry: CorpusEntry; rank: number } => result !== null)
      .sort((a, b) => a.rank - b.rank || a.entry.title.localeCompare(b.entry.title) || a.entry.handle.localeCompare(b.entry.handle))
      .map(({ entry }) => entry);
  }
}
