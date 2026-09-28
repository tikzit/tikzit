import { MCard, structuredPayload, type AgentDid } from 'clm-kernel';
import type { CorpusExplorerService, DiagramMetadata } from './corpusExplorerService';
import { cleanPayload } from './corpusExplorerService';
import type { WorkspaceManager } from '../workspace/WorkspaceManager';
import { safeParse } from '../../core/parser/parser';

export interface LegacyImportOptions {
  corpusExplorer: CorpusExplorerService;
  authorDid: AgentDid;
  workspaceManager: WorkspaceManager;
  localStorage?: Storage | null;
}

export interface LegacyImportResult {
  importedCount: number;
  failedDraftsCount: number;
  importedHandles: string[];
}

export const LEGACY_INDEX_KEY = 'tikzit:doc-index';
export const LEGACY_DOC_PREFIX = 'tikzit:doc:';

export async function runLegacyImport(options: LegacyImportOptions): Promise<LegacyImportResult> {
  const storage = options.localStorage !== undefined
    ? options.localStorage
    : (typeof window !== 'undefined' ? window.localStorage : null);

  if (!storage) {
    return { importedCount: 0, failedDraftsCount: 0, importedHandles: [] };
  }

  let indexRaw: string | null = null;
  try {
    indexRaw = storage.getItem(LEGACY_INDEX_KEY);
  } catch {
    return { importedCount: 0, failedDraftsCount: 0, importedHandles: [] };
  }

  if (!indexRaw) {
    return { importedCount: 0, failedDraftsCount: 0, importedHandles: [] };
  }

  let legacyIds: unknown[];
  try {
    legacyIds = JSON.parse(indexRaw);
    if (!Array.isArray(legacyIds)) {
      return { importedCount: 0, failedDraftsCount: 0, importedHandles: [] };
    }
  } catch {
    return { importedCount: 0, failedDraftsCount: 0, importedHandles: [] };
  }

  // Collect all legacyIds already imported into CLM metadata cards
  const existingLegacyIds = new Set<string>();
  const corpusEntries = options.corpusExplorer.listCorpusEntries({ includeArchived: true }).entries;
  for (const entry of corpusEntries) {
    if (entry.handle.startsWith('zx:diagrams:')) {
      const meta = options.corpusExplorer.getDiagramMetadata(entry.handle);
      if (meta?.legacyId) {
        existingLegacyIds.add(meta.legacyId);
      }
    }
  }

  // Also check existing open drafts in workspaceManager
  for (const doc of options.workspaceManager.getOpenDocuments()) {
    if (doc.id.startsWith('zx:diagrams:')) {
      const meta = options.corpusExplorer.getDiagramMetadata(doc.id);
      if (meta?.legacyId) {
        existingLegacyIds.add(meta.legacyId);
      }
      if ((doc as any).legacyId) {
        existingLegacyIds.add((doc as any).legacyId);
      }
    }
  }

  let importedCount = 0;
  let failedDraftsCount = 0;
  const importedHandles: string[] = [];

  for (const item of legacyIds) {
    let legacyId: string | null = null;
    let fallbackTitle: string | undefined;
    if (typeof item === 'string') {
      legacyId = item;
    } else if (item && typeof item === 'object') {
      legacyId = typeof (item as any).id === 'string' ? (item as any).id : null;
      fallbackTitle = typeof (item as any).title === 'string' ? (item as any).title : undefined;
    }

    if (!legacyId || existingLegacyIds.has(legacyId)) {
      continue;
    }

    let docRaw: string | null = null;
    try {
      docRaw = storage.getItem(LEGACY_DOC_PREFIX + legacyId);
    } catch {
      continue;
    }

    if (!docRaw) continue;

    let docData: { title?: string; content?: string; createdAt?: number; updatedAt?: number };
    try {
      docData = JSON.parse(docRaw);
    } catch {
      continue;
    }

    const title = docData.title || fallbackTitle || `Imported Diagram ${legacyId.slice(0, 8)}`;
    const content = typeof docData.content === 'string' ? docData.content : '';
    const uuid = typeof crypto !== 'undefined' && crypto.randomUUID
      ? crypto.randomUUID()
      : `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
    const handle = `zx:diagrams:${uuid}`;

    const parsed = safeParse(content);
    if (parsed.success && parsed.ast) {
      // Commit as valid MCard diagram with source: 'legacy-import'
      const commitRes = await options.corpusExplorer.commitCorpusDocument({
        handle,
        sourceText: content,
        title,
        uri: `tikzit://diagrams/${uuid}`,
        metadata: cleanPayload<Partial<DiagramMetadata>>({
          title,
          archived: false,
          createdAt: docData.createdAt || Date.now(),
          source: 'legacy-import',
          legacyId,
          legacySavedAt: docData.updatedAt || docData.createdAt || Date.now(),
          isImported: true,
        }),
      });

      if (commitRes.success) {
        importedCount++;
        importedHandles.push(handle);
        existingLegacyIds.add(legacyId);
      } else {
        // Gate failed: write metadata and open as a recoverable draft in WorkspaceManager
        const metaHandle = `zx:meta:diagrams:${uuid}`;
        const metaCard = MCard.create(
          `tikzit://meta/diagrams/${uuid}`,
          structuredPayload(cleanPayload({
            title,
            archived: false,
            createdAt: docData.createdAt || Date.now(),
            source: 'legacy-import',
            legacyId,
            legacySavedAt: docData.updatedAt || docData.createdAt || Date.now(),
            isImported: true,
          })),
          options.authorDid,
          0
        );
        (options.corpusExplorer as any).collection.putWithHandle(metaCard, metaHandle);

        options.workspaceManager.openDocument({
          id: handle,
          title,
          content,
          ast: parsed.ast,
          hash: '',
          createdAt: docData.createdAt || Date.now(),
          updatedAt: docData.updatedAt || Date.now(),
          version: 1,
          isDirty: true,
          legacyId,
        } as any);
        failedDraftsCount++;
        importedHandles.push(handle);
        existingLegacyIds.add(legacyId);
      }
    } else {
      // Parse failed: write metadata and open as a recoverable draft in WorkspaceManager
      const metaHandle = `zx:meta:diagrams:${uuid}`;
      const metaCard = MCard.create(
        `tikzit://meta/diagrams/${uuid}`,
        structuredPayload(cleanPayload({
          title,
          archived: false,
          createdAt: docData.createdAt || Date.now(),
          source: 'legacy-import',
          legacyId,
          legacySavedAt: docData.updatedAt || docData.createdAt || Date.now(),
          isImported: true,
        })),
        options.authorDid,
        0
      );
      (options.corpusExplorer as any).collection.putWithHandle(metaCard, metaHandle);

      options.workspaceManager.openDocument({
        id: handle,
        title,
        content,
        hash: '',
        createdAt: docData.createdAt || Date.now(),
        updatedAt: docData.updatedAt || Date.now(),
        version: 1,
        isDirty: true,
        legacyId,
      } as any);
      failedDraftsCount++;
      importedHandles.push(handle);
      existingLegacyIds.add(legacyId);
    }
  }

  return { importedCount, failedDraftsCount, importedHandles };
}
