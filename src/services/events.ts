import type { ToolMode } from './kernel';
import type { GraphAST, ParseDiagnostic, TikzStylesCatalog } from '../core/domain/types';

export interface SelectionPayload {
  nodes: string[];
  edges: string[];
}

export interface DocumentChangePayload {
  handle: string;
  hash: string;
  sequence: number;
}

export interface DocumentPersistedPayload {
  handle: string;
  hash: string;
}

declare module 'cordis' {
  interface Events {
    'tikzit/tool:set'(tool: ToolMode): void;
    'tikzit/selection:change'(payload: SelectionPayload): void;
    'tikzit/graph:change'(ast: GraphAST): void;
    'tikzit/styles:change'(catalog: TikzStylesCatalog): void;
    'tikzit/document:change'(payload: DocumentChangePayload): void;
    'tikzit/document:persisted'(payload: DocumentPersistedPayload): void;
    'tikzit/diagnostics:emit'(diagnostics: ParseDiagnostic[]): void;


    // Legacy aliases for backward compatibility
    'tool:set'(tool: ToolMode): void;
    'selection:change'(payload: SelectionPayload): void;
    'graph:change'(ast: GraphAST): void;
    'styles:change'(catalog: TikzStylesCatalog): void;
  }
}
