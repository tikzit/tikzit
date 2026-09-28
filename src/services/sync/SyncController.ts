/**
 * Bidirectional State Synchronization Controller for TikZiT Web
 * Orchestrates real-time AST sync between WebGL Canvas and Code Editor,
 * enforcing echo suppression, debounced non-destructive parsing, and diagnostic reporting.
 */

import type { GraphAST } from '../../core/domain/types';
import { parseTikz } from '../../core/parser/parser';
import { emitTikz } from '../../core/parser/emitter';

export type SyncOrigin = 'canvas' | 'editor' | 'storage' | 'external';

export interface SyncDiagnostic {
  message: string;
  line?: number;
  column?: number;
  severity: 'error' | 'warning' | 'info';
}

export type SyncListener = (event: {
  origin: SyncOrigin;
  ast: GraphAST;
  sourceCode: string;
  diagnostics: SyncDiagnostic[];
}) => void;

export class SyncController {
  private currentAST: GraphAST | null = null;
  private currentSource: string = '';
  private isSyncing: boolean = false;
  private debounceTimer: any = null;
  private debounceMs: number = 120;
  private diagnostics: SyncDiagnostic[] = [];
  private listeners: Set<SyncListener> = new Set();

  constructor(initialAST?: GraphAST, debounceMs: number = 120) {
    this.debounceMs = debounceMs;
    if (initialAST) {
      this.currentAST = initialAST;
      this.currentSource = emitTikz(initialAST);
    }
  }

  /**
   * Called when Canvas commits a mutated AST (e.g. node moved, edge added).
   */
  public commitFromCanvas(ast: GraphAST): void {
    if (this.isSyncing) return;
    this.isSyncing = true;
    try {
      this.currentAST = ast;
      const emitted = emitTikz(ast);
      this.currentSource = emitted;
      this.diagnostics = [];
      this.notify('canvas');
    } finally {
      this.isSyncing = false;
    }
  }

  /**
   * Called when Editor text content changes.
   * Debounces parsing and updates canvas AST without echoing back to editor.
   */
  public updateFromEditor(newSource: string, onValidAST?: (ast: GraphAST) => void): void {
    this.currentSource = newSource;
    if (this.isSyncing) return;

    if (this.debounceTimer) {
      clearTimeout(this.debounceTimer);
    }

    this.debounceTimer = setTimeout(() => {
      this.isSyncing = true;
      try {
        const parsed = parseTikz(newSource);
        if (parsed) {
          this.currentAST = parsed;
          this.diagnostics = [];
          if (onValidAST) {
            onValidAST(parsed);
          }
          this.notify('editor');
        } else {
          this.diagnostics = [
            {
              message: 'Parsing returned empty AST',
              severity: 'warning',
            },
          ];
        }
      } catch (err: any) {
        // Non-fatal parse error: preserve current AST and set diagnostic
        this.diagnostics = [
          {
            message: err.message || 'Syntax error in TikZ source',
            line: err.line,
            column: err.column,
            severity: 'error',
          },
        ];
        this.notify('editor');
      } finally {
        this.isSyncing = false;
      }
    }, this.debounceMs);
  }

  public getAST(): GraphAST | null {
    return this.currentAST;
  }

  public getSource(): string {
    return this.currentSource;
  }

  public getDiagnostics(): SyncDiagnostic[] {
    return [...this.diagnostics];
  }

  public subscribe(listener: SyncListener): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private notify(origin: SyncOrigin): void {
    const event = {
      origin,
      ast: this.currentAST || { data: [], paths: [], nodes: [], edges: [] },
      sourceCode: this.currentSource,
      diagnostics: this.getDiagnostics(),
    };
    this.listeners.forEach((fn) => fn(event));
  }
}

export const defaultSyncController = new SyncController();
