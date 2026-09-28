/**
 * src/services/lifecycle/TabSessionController.ts - Sprint 21
 * Manages tab switching, active document selection, and corpus entry opening.
 */
import type { Context } from 'cordis';
import type { CorpusExplorerService, OpenCorpusEntry } from '../clm/corpusExplorerService';
import type { WorkbenchStores } from '../../stores/createWorkbenchStores';
import { defaultWorkspaceManager } from '../workspace/WorkspaceManager';
import { safeParse } from '../../core/parser/parser';

export class TabSessionController {
  constructor(
    private ctx: Context,
    private stores: WorkbenchStores,
    private corpusExplorer: CorpusExplorerService
  ) {}

  public openCorpusEntry(handle: string): OpenCorpusEntry {
    const opened = this.corpusExplorer.openEntry(handle);
    const existing = defaultWorkspaceManager.getOpenDocuments().find((d) => d.id === handle);

    if (existing?.isDirty) {
      defaultWorkspaceManager.setActiveDocument(handle);
      const parsed = safeParse(existing.content);
      if (parsed.success && parsed.ast) {
        existing.ast = parsed.ast;
        this.ctx.graph.setAST(parsed.ast);
      } else if (existing.ast) {
        this.ctx.graph.setAST(existing.ast);
        if (parsed.errors) {
          this.ctx.emit('tikzit/diagnostics:emit', parsed.errors);
        }
      }
    } else {
      defaultWorkspaceManager.openDocument({
        id: handle,
        title: opened.entry.title,
        content: opened.source,
        ast: opened.ast,
        hash: opened.entry.hash,
        createdAt: existing?.createdAt ?? Date.now(),
        updatedAt: opened.entry.updatedAt,
        version: opened.sequence + 1,
        isDirty: false,
      });
      this.ctx.graph.setAST(opened.ast);
    }

    this.stores.$activeDiagram.set({ name: opened.entry.title, handle });
    this.stores.$documentHead.set({
      handle,
      hash: opened.entry.hash,
      sequence: opened.sequence,
      isValid: true,
      lastCommittedAt: opened.entry.updatedAt,
    });
    this.stores.$corpusEntries.set(this.corpusExplorer.listCorpusEntries().entries);
    return opened;
  }

  public activateDocument(handle: string): void {
    const doc = defaultWorkspaceManager.getOpenDocuments().find((d) => d.id === handle);
    if (!doc) return;
    defaultWorkspaceManager.setActiveDocument(handle);
    this.stores.$activeDiagram.set({ name: doc.title, handle });
    const parsed = safeParse(doc.content);
    if (parsed.success && parsed.ast) {
      this.ctx.graph.setAST(parsed.ast);
    }
  }

  public closeDocument(handle: string): void {
    defaultWorkspaceManager.closeDocument(handle);
    const active = defaultWorkspaceManager.getActiveDocument();
    if (active) {
      this.activateDocument(active.id);
    } else {
      this.stores.$activeDiagram.set({ name: '', handle: '' });
      this.stores.$documentHead.set({ handle: '', hash: '', sequence: 0, isValid: true });
    }
  }
}
