# Sprint 16: Diagram Creation & Unified MCard Lifecycle

**Status:** ✅ Completed & Verified  
**Primary category:** `corpus` (with Explorer interaction work)  
**Depends on:** —  
**Parent proposal:** [Sprints 16–19](../../orchestration/16-19-mcard-diagram-lifecycle-history-and-export/PROPOSAL-16-19-MCARD-DIAGRAM-LIFECYCLE-HISTORY-AND-EXPORT.md)

## Objective

Make the Explorer and header `+` create the same first-class diagram, backed by a stable `zx:diagrams:` MCard handle, and route every explicit save through one commit path. First, fix the Sprint 15 defects that this lifecycle depends on.

## Current Gap

- `MacWindowChrome` calls `WorkspaceManager.createNewDocument()`, minting an ephemeral `doc-*` id; the generic save goes to `DocumentStore`.
- The `zx:examples:` prefix is enforced at seven sites:
  - `corpusPersistence.ts` (`validateSnapshot`)
  - `corpusExplorerService.ts` (index-row filter, commit gate, seed completeness)
  - `corpusExportService.ts` (index filter)
  - `createWorkbenchRuntime.ts` (projection clearing, `saveActiveCorpusEntry`)
  - `WorkbenchCommandBar.tsx` (Cmd+S routing)
- Two of those sites are traps. A persisted `zx:diagrams:` row makes `validateSnapshot` throw, so every later startup fails. Cmd+S on a user diagram silently falls through to the legacy `DocumentStore` shadow lineage.
- `CorpusIndexRecord` has no title, so user titles have nowhere to live.
- `indexedDB.open(name, CORPUS_SNAPSHOT_VERSION)` couples the IDB schema version to the snapshot format version.

## Phase A — Sprint 15 Carry-Over Hardening

These defects are live in shipped code. Each gets a failing test first.

| ID | Defect (verified) | Fix |
|---|---|---|
| H1 | `saveCorpusDb`: any non-`AbortError` after a file handle is obtained (e.g. `write`/`close` failure) falls back to a Blob download and reports **success**, leaving a partial file at the picked path | Fall back only when the picker is unavailable or denied **before** a handle exists; a post-handle write failure returns `failure` |
| H2 | `reconstructHistoryRows` writes fabricated `1970-01-01` `changed_at` values into portable exports | Remove the fabrication; missing history rows fail the export closed |
| H3 | `cardCount` and `manifestDigest` are recomputed after export through a different query path and can diverge from the artifact | Return counts and digest from inside `exportCorpusDb`, over the same snapshot it wrote |
| H4 | The unchanged-save path returns `persisted: true` without flushing, even after an earlier flush failed | Attempt the flush (or surface outstanding persistence error) on the unchanged path |
| H5 | Buffer edits made while `await persistence.flush()` is pending are marked clean by `saveActiveCorpusEntry` | Mark clean only if the buffer still equals the committed source; otherwise stay dirty |
| H6 | `getHistoryRows` reads `storage.databases[2]` positionally | Resolve the mcard pillar by name and assert its schema (`handle_history` present) |
| H7 | A stale-writer rejection is never recovered; later saves keep failing | Implement D10: `stale` persistence state, block commits, show a reload banner |
| H8 | `openCorpusEntry` on a dirty doc uses `existing.ast ?? opened.ast`; a stale or absent AST projects the committed head over dirty text | Re-parse `existing.content`; on parse failure keep the prior graph and show diagnostics |

## Proposed UI

- An Explorer action row under the header holds **New Diagram** (`data-testid="btn-explorer-new-diagram"`) next to the existing export action. When there are no user diagrams, an empty-state card also offers **New Diagram**.
- Header `+` (`btn-new-diagram`, selector preserved) and Explorer **New Diagram** dispatch one `tikzit.diagram.create` command.
- A new diagram opens as a tab titled `Untitled diagram N`, focused, with a **Draft** badge until its first commit. It appears in the Explorer under **Drafts**.
- Title chip and status bar show *unsaved* → *saving…* → *saved · vN · time*, or *saved in this session only* with **Retry** when the flush fails.
- Explorer rows show a type badge (Example / Diagram / Draft), version count, and last-saved time; search covers titles of all three.

## Data & Event Contract

- `isDiagramHandle(handle)` covers `zx:examples:` and `zx:diagrams:`. All seven sites migrate to it, except manifest seeding, which keeps an examples-only check marked with a comment.
- Creation mints `zx:diagrams:<uuid>` and uses it as the workspace document id. No remapping happens later. Cmd+S in `WorkbenchCommandBar.tsx` routes all `isDiagramHandle(active.id)` documents to `runtime.saveActiveCorpusEntry()` (not the legacy `DocumentStore`).
- On first commit, a metadata card `zx:meta:diagrams:<uuid>` is written with `{ title, archived: false, createdAt, source: 'user' }`. The corpus index row caches `title`, and the cache can be rebuilt from metadata cards during index repair.
- Snapshot format v2: `validateSnapshot` uses `isDiagramHandle`, v1 snapshots migrate as identity, and the optional `title` cache field is allowed. Decouple IndexedDB schema from snapshot format: `CORPUS_INDEXEDDB_SCHEMA_VERSION = 1` governs `indexedDB.open()`, while `CORPUS_SNAPSHOT_VERSION = 2` validates the snapshot payload. Format bumps no longer trigger blockable IDB upgrades.
- Multi-tab writer protection (D10): stale-snapshot rejection sets persistence to `'stale'` (added to `CorpusPersistenceState` and `CorpusViewState.persistence`), blocking further commits and prompting reload.
- Parser performance caching: `CorpusExplorerService` caches parsed node and edge counts keyed by immutable card hash (`parseCache: Map<string, { nodeCount: number; edgeCount: number }>`), eliminating redundant parsing during Explorer updates.
- The commit gate drops the `EMPTY_DIAGRAM` bail (D1). `INVALID_TIKZ_SYNTAX` and `NULL_AST` still bail.
- `commitCorpusDocument` generalizes to `commitDiagram` for both namespaces, keeping the gate, receipt, and index update.
- Emit `tikzit/document:persisted { handle, hash }` after a successful flush (declared under `Events` in `src/services/events.ts`). The saved-state UI subscribes to it.


## Acceptance Criteria

- **16-AC-01:** Explorer **New Diagram** and the empty state are accessible; one activation creates exactly one focused tab.
- **16-AC-02:** Header `+` runs the same command; rapid repeated activation creates one diagram per activation with no duplicate handles or tabs.
- **16-AC-03:** New diagrams get unique `zx:diagrams:<uuid>` handles used as document ids; seeded handles and manifest seeding are unchanged.
- **16-AC-04:** Saving a valid diagram, including an empty one, advances its handle and records prior-head history. **After reload** the app starts, and the diagram, title, head, and history are restored.
- **16-AC-05:** A failed gate mutates no handle, history, or index. Edits during the commit/flush window stay dirty (H5).
- **16-AC-06:** Switching documents preserves independent buffers; a dirty doc with a stale or absent AST is re-parsed, never overwritten by its head (H8).
- **16-AC-07:** *Saved* appears only after `document:persisted`; a flush failure shows *saved in this session only* with a working **Retry**.
- **16-AC-08:** H1–H7 each have a regression test that failed before its fix.
- **16-AC-09:** A v1 snapshot produced by Sprint 15 loads unchanged under v2; opening does not trigger an IDB upgrade `onblocked`.

## Out of Scope

- Rename, duplicate, archive, session recovery, legacy import (Sprint 16B).
- History UI (Sprint 17); per-diagram export (Sprint 18); collection export expansion (Sprint 19).
- Autosave (D2).

## Definition of Done

- [x] All `startsWith('zx:examples:')` sites migrated or annotated as examples-only.
- [x] Unit tests cover H1–H8, create, commit (empty and non-empty), unique identity, no-op save with flush, gate bail, persistence failure, metadata card creation, v1→v2 snapshot load, and reload with user handles.
- [x] Playwright covers Explorer create, header `+`, first save, reload, switching with a dirty buffer, and the saved/unsaved/session-only indicator.
- [x] Existing 12 seeded entries intact; `npm run verify:corpus` passes.
- [x] Typecheck, build, full unit suite, and E2E suite pass.
- [x] New selectors are added to Contract B in `_active/README.md`; states are keyboard-accessible and announced.

## Verification Commands

```bash
npx tsc --noEmit
npx vitest run
npm run verify:corpus
npm run build && npx playwright test
```
