/**
 * Document Storage Adapter & MCard Lineage Persistence
 * Provides content-addressed hashing, version lineage, savepoints, and quota-safe storage.
 */

import type { GraphAST } from '../../core/domain/types';
import { parseTikz } from '../../core/parser/parser';

export interface DocumentRecord {
  id: string;
  title: string;
  content: string;
  ast?: GraphAST;
  hash: string;
  createdAt: number;
  updatedAt: number;
  version: number;
  isDirty?: boolean;
  isDraft?: boolean;
  legacyId?: string;
}

export interface DocumentRevision {
  hash: string;
  timestamp: number;
  content: string;
  message?: string;
}

export async function computeContentHash(content: string): Promise<string> {
  if (typeof crypto !== 'undefined' && crypto.subtle && crypto.subtle.digest) {
    try {
      const encoder = new TextEncoder();
      const data = encoder.encode(content);
      const hashBuffer = await crypto.subtle.digest('SHA-256', data);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('').substring(0, 16);
    } catch {
      // Fallback
    }
  }

  // Fast djb2-like string hash fallback
  let hash = 5381;
  for (let i = 0; i < content.length; i++) {
    hash = ((hash << 5) + hash) + content.charCodeAt(i);
    hash |= 0;
  }
  return 'h_' + Math.abs(hash).toString(16);
}

export class DocumentStore {
  private prefix = 'tikzit:doc:';
  private indexKey = 'tikzit:doc-index';
  private revPrefix = 'tikzit:rev:';
  private memoryStorage = new Map<string, string>();

  private getItem(key: string): string | null {
    {
      try {
        return window.localStorage.getItem(key);
      } catch {
        // fallback
      }
    }
    return this.memoryStorage.get(key) || null;
  }

  private setItem(key: string, value: string): void {
    {
      try {
        window.localStorage.setItem(key, value);
      } catch {
        // quota fallback
      }
    }
    this.memoryStorage.set(key, value);
  }

  private removeItem(key: string): void {
    {
      try {
        window.localStorage.removeItem(key);
      } catch {
        // ignore
      }
    }
    this.memoryStorage.delete(key);
  }

  public async saveDocument(
    doc: { id: string; title?: string; content: string; ast?: GraphAST; message?: string }
  ): Promise<DocumentRecord> {
    const hash = await computeContentHash(doc.content);
    const now = Date.now();

    const existing = await this.loadDocument(doc.id);
    const version = existing ? existing.version + 1 : 1;
    const title = doc.title || existing?.title || 'Untitled Diagram';
    const createdAt = existing ? existing.createdAt : now;

    let ast = doc.ast;
    if (!ast) {
      try {
        ast = parseTikz(doc.content);
      } catch {
        // preserve existing if available
        ast = existing?.ast;
      }
    }

    const record: DocumentRecord = {
      id: doc.id,
      title,
      content: doc.content,
      ast,
      hash,
      version,
      createdAt,
      updatedAt: now,
      isDirty: false,
    };

    {
      try {
        // Save document record
        this.setItem(this.prefix + doc.id, JSON.stringify(record));

        // Update index
        const index = this.getIndex();
        if (!index.includes(doc.id)) {
          index.push(doc.id);
          this.setItem(this.indexKey, JSON.stringify(index));
        }

        // Append to revision lineage
        const revs = await this.getRevisions(doc.id);
        revs.unshift({
          hash,
          timestamp: now,
          content: doc.content,
          message: doc.message || `Version ${version}`,
        });
        this.setItem(this.revPrefix + doc.id, JSON.stringify(revs.slice(0, 30)));
      } catch (err: any) {
        console.warn('Storage quota or error saving document:', err);
      }
    }

    return record;
  }

  public async loadDocument(id: string): Promise<DocumentRecord | null> {
    
    const raw = this.getItem(this.prefix + id);
    if (!raw) return null;
    try {
      return JSON.parse(raw) as DocumentRecord;
    } catch {
      return null;
    }
  }

  public async listDocuments(): Promise<DocumentRecord[]> {
    const ids = this.getIndex();
    const records: DocumentRecord[] = [];
    for (const id of ids) {
      const doc = await this.loadDocument(id);
      if (doc) records.push(doc);
    }
    return records;
  }

  public async deleteDocument(id: string): Promise<boolean> {
    
    this.removeItem(this.prefix + id);
    this.removeItem(this.revPrefix + id);

    let index = this.getIndex();
    index = index.filter((item) => item !== id);
    this.setItem(this.indexKey, JSON.stringify(index));
    return true;
  }

  public async getRevisions(id: string): Promise<DocumentRevision[]> {
    
    const raw = this.getItem(this.revPrefix + id);
    if (!raw) return [];
    try {
      return JSON.parse(raw) as DocumentRevision[];
    } catch {
      return [];
    }
  }

  public async restoreRevision(id: string, hash: string): Promise<DocumentRecord | null> {
    const revs = await this.getRevisions(id);
    const targetRev = revs.find((r) => r.hash === hash);
    if (!targetRev) return null;

    return this.saveDocument({
      id,
      content: targetRev.content,
      message: `Restored from revision ${hash.substring(0, 8)}`,
    });
  }

  private getIndex(): string[] {
    
    const raw = this.getItem(this.indexKey);
    if (!raw) return [];
    try {
      return JSON.parse(raw);
    } catch {
      return [];
    }
  }
}

export const defaultDocumentStore = new DocumentStore();
