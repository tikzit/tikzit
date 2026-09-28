/**
 * src/services/clm/DiagramLifecycleManager.ts - Sprint 23
 * Diagram metadata CRUD, duplication, renaming, and archiving operations.
 * Target: <= 150 LOC.
 */
import { AgentDid, MCard, type MCardCollection, structuredPayload, textPayload } from 'clm-kernel';
import { isDiagramHandle } from './corpusPersistence';
import type { DiagramIndexService, CorpusManifestEntry } from './DiagramIndexService';

export interface DiagramMetadata {
  title: string;
  archived: boolean;
  createdAt: number;
  source: 'user' | 'duplicate' | 'legacy-import';
  forkedFrom?: string;
  legacyId?: string;
  legacySavedAt?: number;
  isImported?: boolean;
  updatedAt?: number;
  labels?: Record<string, string>;
}

export function cleanPayload<T extends Record<string, any>>(obj: T): T {
  const clean: Record<string, any> = {};
  for (const [key, value] of Object.entries(obj)) {
    if (value !== undefined) clean[key] = value;
  }
  return clean as T;
}

export interface DiagramLifecycleOptions {
  collection: MCardCollection;
  authorDid: AgentDid;
  indexService: DiagramIndexService;
  getPersistence: () => { flush(): Promise<void> };
  getManifest(): CorpusManifestEntry[];
}

export class DiagramLifecycleManager {
  private readonly collection: MCardCollection;
  private readonly authorDid: AgentDid;
  private readonly indexService: DiagramIndexService;
  private readonly getPersistence: () => { flush(): Promise<void> };
  private readonly getManifest: () => CorpusManifestEntry[];

  constructor(options: DiagramLifecycleOptions) {
    this.collection = options.collection;
    this.authorDid = options.authorDid;
    this.indexService = options.indexService;
    this.getPersistence = options.getPersistence;
    this.getManifest = options.getManifest;
  }

  getDiagramMetadata(handle: string): DiagramMetadata | null {
    if (!handle.startsWith('zx:diagrams:')) {
      if (handle.startsWith('zx:examples:')) {
        const id = handle.slice('zx:examples:'.length);
        const manifestEntry = this.getManifest().find((m) => m.id === id);
        return {
          title: manifestEntry?.title ?? id,
          archived: false,
          createdAt: 0,
          source: 'user',
        };
      }
      return null;
    }
    const uuid = handle.slice('zx:diagrams:'.length);
    const metaHandle = `zx:meta:diagrams:${uuid}`;
    const hash = this.collection.resolveHandle(metaHandle);
    if (!hash) return null;
    const card = this.collection.get(hash);
    if (!card || card.payload.kind !== 'structured') return null;
    return card.payload.value as DiagramMetadata;
  }

  async renameDiagram(handle: string, newTitle: string): Promise<{ success: boolean; error?: string }> {
    if (!handle.startsWith('zx:diagrams:')) return { success: false, error: 'Only user diagrams can be renamed' };
    const trimmed = newTitle.trim();
    if (!trimmed) return { success: false, error: 'Title cannot be empty' };
    const uuid = handle.slice('zx:diagrams:'.length);
    const metaHandle = `zx:meta:diagrams:${uuid}`;
    const existing = this.getDiagramMetadata(handle);
    const updatedMeta = cleanPayload<DiagramMetadata>({
      title: trimmed,
      archived: existing?.archived ?? false,
      createdAt: existing?.createdAt ?? Date.now(),
      source: existing?.source ?? 'user',
      forkedFrom: existing?.forkedFrom,
      legacyId: existing?.legacyId,
      legacySavedAt: existing?.legacySavedAt,
      isImported: existing?.isImported,
      updatedAt: Date.now(),
    });
    const metaCard = MCard.create(`tikzit://meta/diagrams/${uuid}`, structuredPayload(updatedMeta), this.authorDid, 0);
    this.collection.putWithHandle(metaCard, metaHandle);
    this.indexService.updateRow(handle, (r) => { r.title = trimmed; });
    try {
      await this.getPersistence().flush();
      return { success: true };
    } catch (err) {
      return { success: false, error: err instanceof Error ? err.message : String(err) };
    }
  }

  async archiveDiagram(handle: string, archived: boolean = true): Promise<{ success: boolean; error?: string }> {
    if (!handle.startsWith('zx:diagrams:')) return { success: false, error: 'Only user diagrams can be archived' };
    const uuid = handle.slice('zx:diagrams:'.length);
    const metaHandle = `zx:meta:diagrams:${uuid}`;
    const existing = this.getDiagramMetadata(handle);
    const updatedMeta = cleanPayload<DiagramMetadata>({
      title: existing?.title ?? `Diagram ${uuid.slice(0, 8)}`,
      archived,
      createdAt: existing?.createdAt ?? Date.now(),
      source: existing?.source ?? 'user',
      forkedFrom: existing?.forkedFrom,
      legacyId: existing?.legacyId,
      legacySavedAt: existing?.legacySavedAt,
      isImported: existing?.isImported,
      updatedAt: Date.now(),
    });
    const metaCard = MCard.create(`tikzit://meta/diagrams/${uuid}`, structuredPayload(updatedMeta), this.authorDid, 0);
    this.collection.putWithHandle(metaCard, metaHandle);
    this.indexService.updateRow(handle, (r) => { r.archived = archived; });
    try {
      await this.getPersistence().flush();
      return { success: true };
    } catch (err) {
      return { success: false, error: err instanceof Error ? err.message : String(err) };
    }
  }

  async duplicateDiagram(handle: string, newTitle?: string): Promise<{ success: boolean; newHandle?: string; error?: string }> {
    if (!isDiagramHandle(handle)) return { success: false, error: `Invalid diagram handle: ${handle}` };
    const sourceHash = this.collection.resolveHandle(handle);
    if (!sourceHash) return { success: false, error: `Cannot resolve source handle: ${handle}` };
    const sourceCard = this.collection.get(sourceHash);
    if (!sourceCard || sourceCard.payload.kind !== 'text') return { success: false, error: 'Source diagram card is missing or not text' };
    const sourceMeta = this.getDiagramMetadata(handle);
    const sourceTitle = sourceMeta?.title ?? this.indexService.getIndex().find((r) => r.handle === handle)?.title ?? 'Diagram';
    const targetTitle = newTitle?.trim() || `${sourceTitle} (Copy)`;

    const uuid = typeof crypto !== 'undefined' && crypto.randomUUID
      ? crypto.randomUUID()
      : `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
    const newHandle = `zx:diagrams:${uuid}`;
    const newCard = MCard.create(`tikzit://diagrams/${uuid}`, textPayload(sourceCard.payload.value), this.authorDid, 0);
    this.collection.putWithHandle(newCard, newHandle);

    const metaHandle = `zx:meta:diagrams:${uuid}`;
    const metaCard = MCard.create(
      `tikzit://meta/diagrams/${uuid}`,
      structuredPayload(cleanPayload({
        title: targetTitle,
        archived: false,
        createdAt: Date.now(),
        source: 'duplicate',
        forkedFrom: `${handle}@${sourceHash.asHex()}`,
      })),
      this.authorDid,
      0
    );
    this.collection.putWithHandle(metaCard, metaHandle);

    this.indexService.upsertRow({
      handle: newHandle,
      hash: newCard.hash.asHex(),
      committedAt: Date.now(),
      title: targetTitle,
      archived: false,
    });

    try {
      await this.getPersistence().flush();
      return { success: true, newHandle };
    } catch (err) {
      return { success: false, error: err instanceof Error ? err.message : String(err) };
    }
  }

  async markDiagramOpened(handle: string): Promise<void> {
    if (!handle.startsWith('zx:diagrams:')) return;
    const meta = this.getDiagramMetadata(handle);
    if (meta && meta.isImported) {
      meta.isImported = false;
      const uuid = handle.slice('zx:diagrams:'.length);
      const metaHandle = `zx:meta:diagrams:${uuid}`;
      const metaCard = MCard.create(`tikzit://meta/diagrams/${uuid}`, structuredPayload(cleanPayload(meta)), this.authorDid, 0);
      this.collection.putWithHandle(metaCard, metaHandle);
      try { await this.getPersistence().flush(); } catch {}
    }
  }
}
