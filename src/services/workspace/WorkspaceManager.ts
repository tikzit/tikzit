/**
 * Multi-Document Workspace Manager for TikZiT Web
 * Tracks multiple open diagram tabs, dirty buffers, active tab selection, and session persistence.
 */

import type { GraphAST } from '../../core/domain/types';
import { defaultDocumentStore, type DocumentRecord } from '../storage/DocumentStore';
export type { DocumentRecord };
import { parseTikz } from '../../core/parser/parser';

export interface WorkspaceState {
  activeDocId: string;
  openDocs: DocumentRecord[];
}

export interface WorkspaceSessionState {
  activeDocId: string | null;
  openHandles: string[];
  dirtyBuffers: Record<string, { content: string; updatedAt: number }>;
}

export type WorkspaceListener = (state: WorkspaceState) => void;

const DEFAULT_DOC_ID = 'default-doc';
export const STORAGE_KEY = 'tikzit:workspace-state';

export class WorkspaceManager {
  private activeDocId: string = DEFAULT_DOC_ID;
  private openDocs: Map<string, DocumentRecord> = new Map();
  private listeners: Set<WorkspaceListener> = new Set();
  private saveDebounceTimer: ReturnType<typeof setTimeout> | null = null;
  private isRestoring = false;

  constructor() {
    this.initDefault();
    this.attachBrowserEvents();
  }

  private initDefault(): void {
    const defaultDoc: DocumentRecord = {
      id: DEFAULT_DOC_ID,
      title: '01_spider_fusion.tikz',
      content: `\\begin{tikzpicture}
	\\begin{pgfonlayer}{nodelayer}
		\\node [style=green spider] (0) at (-1.5, 0) {$\\alpha$};
		\\node [style=green spider] (1) at (1.5, 0) {$\\beta$};
	\\end{pgfonlayer}
	\\begin{pgfonlayer}{edgelayer}
		\\draw (0) to (1);
	\\end{pgfonlayer}
\\end{tikzpicture}`,
      hash: 'init_hash',
      createdAt: Date.now(),
      updatedAt: Date.now(),
      version: 1,
      isDirty: false,
    };
    try {
      defaultDoc.ast = parseTikz(defaultDoc.content);
    } catch {
      // ignore
    }
    this.openDocs.set(defaultDoc.id, defaultDoc);
    this.activeDocId = defaultDoc.id;
  }

  public reset(): void {
    if (this.saveDebounceTimer !== null) {
      clearTimeout(this.saveDebounceTimer);
      this.saveDebounceTimer = null;
    }
    this.openDocs.clear();
    this.initDefault();
  }

  private attachBrowserEvents(): void {
    if (typeof window === 'undefined') return;
    if (typeof document !== 'undefined' && typeof document.addEventListener === 'function') {
      document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'hidden') {
          this.flushSessionState();
        }
      });
    }
    if (typeof window.addEventListener === 'function') {
      window.addEventListener('pagehide', () => {
        this.flushSessionState();
      });
      window.addEventListener('beforeunload', (e) => {
        if (this.hasDirtyDocuments()) {
          e.preventDefault();
          e.returnValue = '';
        }
      });
    }
  }

  public hasDirtyDocuments(): boolean {
    return Array.from(this.openDocs.values()).some((d) => Boolean(d.isDirty));
  }

  public getActiveDocument(): DocumentRecord | undefined {
    return this.openDocs.get(this.activeDocId);
  }

  public getOpenDocuments(): DocumentRecord[] {
    return Array.from(this.openDocs.values());
  }

  public setActiveDocument(id: string): void {
    if (this.openDocs.has(id)) {
      this.activeDocId = id;
      this.notify();
    }
  }

  public openDocument(doc: DocumentRecord): void {
    this.openDocs.set(doc.id, { ...doc });
    this.activeDocId = doc.id;
    this.notify();
  }

  public createNewDocument(title: string = 'Untitled.tikz'): DocumentRecord {
    const id = `doc-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    const newDoc: DocumentRecord = {
      id,
      title,
      content: `\\begin{tikzpicture}
	\\begin{pgfonlayer}{nodelayer}
		\\node [style=none] (0) at (0, 0) {};
	\\end{pgfonlayer}
	\\begin{pgfonlayer}{edgelayer}
	\\end{pgfonlayer}
\\end{tikzpicture}`,
      hash: 'new_doc',
      createdAt: Date.now(),
      updatedAt: Date.now(),
      version: 1,
      isDirty: true,
    };
    try {
      newDoc.ast = parseTikz(newDoc.content);
    } catch {
      // ignore
    }

    this.openDocs.set(id, newDoc);
    this.activeDocId = id;
    this.notify();
    return newDoc;
  }

  public closeDocument(id: string, createDraftFallback?: () => DocumentRecord): boolean {
    if (!this.openDocs.has(id)) return false;

    if (this.openDocs.size <= 1) {
      // Closing the last tab opens a fresh draft
      this.openDocs.delete(id);
      const fallback = createDraftFallback
        ? createDraftFallback()
        : this.createNewDocument('Untitled diagram 1');
      this.openDocs.set(fallback.id, fallback);
      this.activeDocId = fallback.id;
      this.notify();
      return true;
    }

    this.openDocs.delete(id);
    if (this.activeDocId === id) {
      const remaining = Array.from(this.openDocs.keys());
      this.activeDocId = remaining[remaining.length - 1];
    }
    this.notify();
    return true;
  }

  public renameDocument(id: string, newTitle: string): void {
    const doc = this.openDocs.get(id);
    if (!doc) return;
    doc.title = newTitle;
    doc.updatedAt = Date.now();
    this.notify();
  }

  public updateContent(id: string, content: string, ast?: GraphAST): void {
    const doc = this.openDocs.get(id);
    if (!doc) return;

    doc.content = content;
    if (ast) {
      doc.ast = ast;
    }
    doc.updatedAt = Date.now();
    doc.isDirty = true;
    this.notify();
  }

  public updateAst(id: string, ast: GraphAST): void {
    const doc = this.openDocs.get(id);
    if (!doc) return;
    doc.ast = ast;
    this.notify();
  }

  public markClean(id: string): void {
    const doc = this.openDocs.get(id);
    if (!doc) return;
    doc.isDirty = false;
    this.notify();
  }

  public markCommitted(id: string, hash: string, sequence: number, ast?: GraphAST, keepDirty: boolean = false): void {
    const doc = this.openDocs.get(id);
    if (!doc) return;
    doc.hash = hash;
    doc.version = sequence + 1;
    doc.isDraft = false;
    if (ast) doc.ast = ast;
    doc.updatedAt = Date.now();
    if (!keepDirty) {
      doc.isDirty = false;
    }
    this.notify();
  }

  public applyRestoredHead(id: string, content: string, ast: GraphAST | undefined, hash: string): void {
    const doc = this.openDocs.get(id);
    if (!doc) return;
    doc.content = content;
    if (ast) doc.ast = ast;
    doc.hash = hash;
    doc.isDirty = false;
    doc.updatedAt = Date.now();
    this.flushSessionState();
    this.notify();
  }

  public async saveActive(): Promise<DocumentRecord | null> {
    const doc = this.getActiveDocument();
    if (!doc) return null;

    const saved = await defaultDocumentStore.saveDocument({
      id: doc.id,
      title: doc.title,
      content: doc.content,
      ast: doc.ast,
    });

    doc.hash = saved.hash;
    doc.version = saved.version;
    doc.isDirty = false;
    this.notify();
    return doc;
  }

  public scheduleSaveSessionState(): void {
    if (this.isRestoring) return;
    if (this.saveDebounceTimer !== null) {
      clearTimeout(this.saveDebounceTimer);
    }
    this.saveDebounceTimer = setTimeout(() => {
      this.flushSessionState();
    }, 300);
  }

  public flushSessionState(): void {
    if (this.isRestoring) return;
    if (this.saveDebounceTimer !== null) {
      clearTimeout(this.saveDebounceTimer);
      this.saveDebounceTimer = null;
    }
    const dirtyBuffers: Record<string, { content: string; updatedAt: number }> = {};
    for (const [id, doc] of this.openDocs.entries()) {
      if (doc.isDirty) {
        dirtyBuffers[id] = { content: doc.content, updatedAt: doc.updatedAt };
      }
    }
    const state: WorkspaceSessionState = {
      activeDocId: this.activeDocId,
      openHandles: Array.from(this.openDocs.keys()),
      dirtyBuffers,
    };
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
      }
    } catch (err) {
      console.warn('Failed to save workspace session state:', err);
    }
  }

  public restoreSessionState(options: {
    resolveHeadContent?: (handle: string) => string | null;
    resolveDoc?: (handle: string) => DocumentRecord | null;
  } = {}): { recoveredCount: number; dirtyHandles: string[] } {
    let raw: string | null = null;
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        raw = window.localStorage.getItem(STORAGE_KEY);
      }
    } catch {
      return { recoveredCount: 0, dirtyHandles: [] };
    }
    if (!raw) return { recoveredCount: 0, dirtyHandles: [] };

    let state: WorkspaceSessionState;
    try {
      state = JSON.parse(raw);
    } catch {
      return { recoveredCount: 0, dirtyHandles: [] };
    }

    if (!state || !Array.isArray(state.openHandles) || state.openHandles.length === 0) {
      return { recoveredCount: 0, dirtyHandles: [] };
    }

    this.isRestoring = true;
    this.openDocs.clear();
    const dirtyHandles: string[] = [];

    for (const handle of state.openHandles) {
      let doc: DocumentRecord | null = options.resolveDoc ? options.resolveDoc(handle) : null;
      const headContent = options.resolveHeadContent ? options.resolveHeadContent(handle) : null;

      if (!doc) {
        const title = handle.startsWith('zx:diagrams:')
          ? `Diagram ${handle.slice('zx:diagrams:'.length).slice(0, 8)}`
          : handle.startsWith('zx:examples:')
          ? `${handle.slice('zx:examples:'.length)}.tikz`
          : 'Untitled Diagram';
        const content = headContent ?? '\\begin{tikzpicture}\n\\end{tikzpicture}\n';
        doc = {
          id: handle,
          title,
          content,
          hash: headContent ? 'restored_head' : '',
          createdAt: Date.now(),
          updatedAt: Date.now(),
          version: 1,
          isDirty: false,
        };
        try {
          doc.ast = parseTikz(doc.content);
        } catch {
          // ignore
        }
      }

      const buffer = state.dirtyBuffers?.[handle];
      if (buffer && typeof buffer.content === 'string') {
        // If recovered content equals current head, drop buffer silently
        if (headContent !== null && buffer.content === headContent) {
          doc.isDirty = false;
        } else {
          doc.content = buffer.content;
          doc.updatedAt = buffer.updatedAt || Date.now();
          doc.isDirty = true;
          try {
            doc.ast = parseTikz(doc.content);
          } catch {
            // ignore
          }
          dirtyHandles.push(handle);
        }
      }

      this.openDocs.set(doc.id, doc);
    }

    if (state.activeDocId && this.openDocs.has(state.activeDocId)) {
      this.activeDocId = state.activeDocId;
    } else if (state.openHandles.length > 0 && this.openDocs.has(state.openHandles[0])) {
      this.activeDocId = state.openHandles[0];
    } else {
      this.activeDocId = Array.from(this.openDocs.keys())[0] || DEFAULT_DOC_ID;
    }

    this.isRestoring = false;
    this.notify();
    return { recoveredCount: dirtyHandles.length, dirtyHandles };
  }

  public discardAllRecovered(options: { resolveHeadContent?: (handle: string) => string | null } = {}): void {
    for (const doc of this.openDocs.values()) {
      if (doc.isDirty) {
        const head = options.resolveHeadContent ? options.resolveHeadContent(doc.id) : null;
        if (head !== null) {
          doc.content = head;
          doc.isDirty = false;
          try {
            doc.ast = parseTikz(head);
          } catch {
            // ignore
          }
        } else {
          doc.content = '\\begin{tikzpicture}\n\\end{tikzpicture}\n';
          doc.isDirty = false;
          try {
            doc.ast = parseTikz(doc.content);
          } catch {
            // ignore
          }
        }
      }
    }
    this.flushSessionState();
    this.notify();
  }

  public subscribe(listener: WorkspaceListener): () => void {
    this.listeners.add(listener);
    listener(this.getState());
    return () => this.listeners.delete(listener);
  }

  public getState(): WorkspaceState {
    return {
      activeDocId: this.activeDocId,
      openDocs: this.getOpenDocuments(),
    };
  }

  private notify(): void {
    const state = this.getState();
    this.listeners.forEach((fn) => fn(state));
    this.scheduleSaveSessionState();
  }
}

export const defaultWorkspaceManager = new WorkspaceManager();
if (typeof window !== 'undefined') {
  (window as any).defaultWorkspaceManager = defaultWorkspaceManager;
}
