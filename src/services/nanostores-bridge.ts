import type { Context } from 'cordis';
import type { WorkbenchStores } from '../stores/createWorkbenchStores';
import type { ToolMode } from './kernel';
import type { SelectionPayload, DocumentChangePayload } from './events';
import type { GraphAST, TikzStylesCatalog } from '../core/domain/types';

/**
 * Binds Cordis Service Mesh events to Nanostores read-only reactive projections.
 * Strictly unidirectional (Cordis -> Nanostores). Zero echo loops.
 *
 * @param ctx The Cordis service context
 * @param stores The isolated WorkbenchStores instance
 * @returns Disposer function cleaning up all event listeners
 */
export function bindCordisToNanostores(ctx: Context, stores: WorkbenchStores): () => void {
  const disposers: Array<() => void> = [];

  // 1. Tool Mode Projection: Cordis -> Nanostores
  disposers.push(
    ctx.on('tikzit/tool:set', (tool: ToolMode) => {
      stores.$toolMode.set(tool);
    })
  );

  // 2. Selection Projection: Cordis -> Nanostores
  disposers.push(
    ctx.on('tikzit/selection:change', (selection: SelectionPayload) => {
      stores.$selectedElements.set(selection);
    })
  );

  // 3. Working AST Projection: Cordis -> Nanostores
  disposers.push(
    ctx.on('tikzit/graph:change', (ast: GraphAST) => {
      stores.$graphAST.set(ast);
    })
  );

  // 4. Committed Document Head Projection: Cordis -> Nanostores
  disposers.push(
    ctx.on('tikzit/document:change', (docState: DocumentChangePayload) => {
      stores.$documentHead.set({
        handle: docState.handle,
        hash: docState.hash,
        sequence: docState.sequence,
        isValid: true,
        lastCommittedAt: Date.now(),
      });
    })
  );

  // 4b. Persisted Document Head Projection: Cordis -> Nanostores
  disposers.push(
    ctx.on('tikzit/document:persisted', (payload) => {
      const currentHead = stores.$documentHead.get();
      if (currentHead.handle === payload.handle) {
        stores.$documentHead.set({
          ...currentHead,
          hash: payload.hash,
          lastPersistedAt: Date.now(),
        });
      }
    })
  );

  // 5. Styles Catalog Projection: Cordis -> Nanostores
  disposers.push(
    ctx.on('tikzit/styles:change', (catalog: TikzStylesCatalog) => {
      stores.$stylesCatalog.set(catalog);
    })
  );

  return () => {
    disposers.forEach((dispose) => dispose());
  };
}
