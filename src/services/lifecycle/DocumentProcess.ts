/**
 * src/services/lifecycle/DocumentProcess.ts - Sprint 21
 * Place/Transition Petri Net Document Lifecycle Actor with Token Conservation
 */
import type { CorpusExplorerService, CorpusCommitResult } from '../clm/corpusExplorerService';
import type { WorkbenchStores } from '../../stores/createWorkbenchStores';
import type { DocumentRecord } from '../workspace/WorkspaceManager';
import { defaultWorkspaceManager } from '../workspace/WorkspaceManager';
import { defaultTransactionManager } from '../../core/history/TransactionManager';
import { isDiagramHandle } from '../clm/corpusPersistence';
import { safeParse } from '../../core/parser/parser';

export type PetriPlace = 'Draft' | 'Clean' | 'Dirty' | 'Gating' | 'Committed' | 'Flushing' | 'Persisted' | 'Stale';

export interface BailVerdictRecord {
  verdict: 'bail';
  reason: string;
  invariantCode: 'STALE_CONFLICT' | 'SYNTAX_ERROR' | 'PROTOCOL_MISMATCH' | 'CANCELLED';
}

export class DocumentProcess {
  private inFlightSaves = new Map<string, { promise: Promise<CorpusCommitResult>; options?: { message?: string; sourceText?: string }; source: string }>();
  private dismissedDraftCallouts = new Set<string>();
  private activePlaces = new Map<string, PetriPlace>();
  private dirtyTokens = new Map<string, boolean>();

  constructor(
    private stores: WorkbenchStores,
    private corpusExplorer: CorpusExplorerService,
    private emitEvent: (event: string, data: unknown) => void
  ) {}

  public getPlace(handle: string): PetriPlace { return this.activePlaces.get(handle) ?? 'Clean'; }
  public setPlace(handle: string, place: PetriPlace): void { this.activePlaces.set(handle, place); }
  public isDirty(handle: string): boolean { return this.dirtyTokens.get(handle) ?? false; }
  public markDirty(handle: string): void {
    this.dirtyTokens.set(handle, true);
    this.activePlaces.set(handle, 'Dirty');
  }

  public dismissDraftCallout(handle: string): void {
    this.dismissedDraftCallouts.add(handle);
    const cur = this.stores.$dismissedDraftCallouts.get();
    if (!cur.includes(handle)) this.stores.$dismissedDraftCallouts.set([...cur, handle]);
  }

  public isDraftCalloutDismissed(handle: string): boolean {
    return this.dismissedDraftCallouts.has(handle) || this.stores.$dismissedDraftCallouts.get().includes(handle);
  }

  public createDiagram(title?: string, untitledIndex: number = 1): { handle: string; document: DocumentRecord } {
    const uuid = typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
    const handle = `zx:diagrams:${uuid}`;
    const diagramTitle = title ?? `Untitled diagram ${untitledIndex}`;
    const initialSource = '\\begin{tikzpicture}\n\\end{tikzpicture}\n';
    const parsed = safeParse(initialSource);
    const emptyAst = parsed.ast ?? { nodes: [], edges: [], paths: [], data: [] };

    const document: DocumentRecord = {
      id: handle, title: diagramTitle, content: initialSource, ast: emptyAst,
      hash: '', createdAt: Date.now(), updatedAt: Date.now(), version: 0, isDirty: true, isDraft: true,
    };

    defaultWorkspaceManager.openDocument(document);
    defaultWorkspaceManager.setActiveDocument(handle);
    this.setPlace(handle, 'Draft');
    this.dirtyTokens.set(handle, true);

    this.stores.$activeDiagram.set({ name: diagramTitle, handle });
    this.stores.$documentHead.set({ handle, hash: '', sequence: 0, isValid: true, lastCommittedAt: 0 });
    return { handle, document };
  }

  public saveDiagram(handle: string, options?: { message?: string; sourceText?: string }): Promise<CorpusCommitResult> {
    if (!isDiagramHandle(handle)) {
      return Promise.resolve({ success: false, reason: `Not a corpus handle: ${handle}`, persisted: false, receiptHash: '' });
    }
    const view = this.stores.$corpusView.get();
    if (view.persistence === 'stale' || view.persistence === 'recovery-required') {
      this.setPlace(handle, 'Stale');
      return Promise.resolve({ success: false, reason: `Persistence is ${view.persistence}`, persisted: false, receiptHash: '' });
    }

    const targetDoc = defaultWorkspaceManager.getOpenDocuments().find((d) => d.id === handle) ??
      (defaultWorkspaceManager.getActiveDocument()?.id === handle ? defaultWorkspaceManager.getActiveDocument() : undefined);
    if (!targetDoc) {
      return Promise.resolve({ success: false, reason: `Document not open: ${handle}`, persisted: false, receiptHash: '' });
    }

    const targetText = options?.sourceText ?? targetDoc.content;
    const existing = this.inFlightSaves.get(handle);
    if (existing) {
      if (existing.source === targetText && existing.options?.message === options?.message) {
        return existing.promise;
      }
      return Promise.resolve({ success: false, reason: 'Save operation already in progress for this document', persisted: false, receiptHash: '' });
    }

    this.setPlace(handle, 'Gating');
    const opId = `op_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
    this.stores.$diagramSaveState.setKey(handle, { isSaving: true, operationId: opId });

    const promise = (async (): Promise<CorpusCommitResult> => {
      try {
        this.setPlace(handle, 'Flushing');
        const result = await this.corpusExplorer.commitCorpusDocument({
          handle, sourceText: targetText, title: targetDoc.title, message: options?.message?.trim() || undefined,
        });

        // Token Conservation Invariant: Check if buffer received newer edits during flush
        const currentDoc = defaultWorkspaceManager.getOpenDocuments().find((d) => d.id === handle);
        const stillMatches = currentDoc?.content === targetText;

        if (result.success && result.unchanged) {
          if (stillMatches) {
            defaultWorkspaceManager.markClean(handle);
            this.dirtyTokens.set(handle, false);
            this.setPlace(handle, 'Clean');
            if (defaultWorkspaceManager.getActiveDocument()?.id === handle) defaultTransactionManager.markClean();
          } else {
            this.dirtyTokens.set(handle, true);
            this.setPlace(handle, 'Dirty');
          }
        } else if (result.success && result.hash) {
          if (stillMatches) {
            defaultWorkspaceManager.markCommitted(handle, result.hash, result.sequence ?? targetDoc.version, result.ast);
            this.dirtyTokens.set(handle, false);
            this.setPlace(handle, result.persisted ? 'Persisted' : 'Committed');
            if (defaultWorkspaceManager.getActiveDocument()?.id === handle) defaultTransactionManager.markClean();
          } else if (currentDoc) {
            defaultWorkspaceManager.markCommitted(handle, result.hash, result.sequence ?? targetDoc.version, undefined, true);
            this.dirtyTokens.set(handle, true);
            this.setPlace(handle, 'Dirty');
          }
        }

        if (result.success && result.persisted) {
          this.emitEvent('tikzit/document:persisted', { handle, hash: result.hash ?? targetDoc.hash });
        }

        this.updatePersistenceView(result);
        const activeNow = defaultWorkspaceManager.getActiveDocument();
        if (activeNow?.id === handle && result.success && result.hash) {
          this.stores.$documentHead.set({
            handle, hash: result.hash, sequence: result.sequence ?? targetDoc.version,
            isValid: true, lastCommittedAt: Date.now(), lastPersistedAt: result.persisted ? Date.now() : undefined,
          });
          this.stores.$activeDiagram.set({ name: targetDoc.title, handle });
        }

        this.stores.$corpusEntries.set(this.corpusExplorer.listCorpusEntries().entries);
        this.stores.$diagramSaveState.setKey(handle, {
          isSaving: false, lastResult: result, error: result.success ? undefined : result.reason, operationId: opId,
        });
        return result;
      } catch (err: any) {
        this.setPlace(handle, 'Dirty');
        const errResult: CorpusCommitResult = { success: false, reason: err?.message || String(err), persisted: false, receiptHash: '' };
        this.stores.$diagramSaveState.setKey(handle, { isSaving: false, lastResult: errResult, error: errResult.reason, operationId: opId });
        return errResult;
      } finally {
        this.inFlightSaves.delete(handle);
      }
    })();

    this.inFlightSaves.set(handle, { promise, options, source: targetText });
    return promise;
  }

  private updatePersistenceView(result: CorpusCommitResult): void {
    const cur = this.stores.$corpusView.get();
    if (!result.persisted) {
      if (cur.persistence !== 'stale' && cur.persistence !== 'recovery-required') {
        this.stores.$corpusView.set({ ...cur, persistence: 'non-persistent', persistenceError: result.persistenceError ?? 'Committed, not persisted' });
      }
    } else if (result.success && cur.persistenceError) {
      this.stores.$corpusView.set({ ...cur, persistence: 'persistent', persistenceError: undefined });
    }
  }

  public clear(): void {
    this.inFlightSaves.clear();
    this.dismissedDraftCallouts.clear();
    this.activePlaces.clear();
    this.dirtyTokens.clear();
  }
}
