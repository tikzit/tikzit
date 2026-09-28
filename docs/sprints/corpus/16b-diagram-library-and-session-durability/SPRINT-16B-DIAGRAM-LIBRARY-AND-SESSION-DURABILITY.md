# Sprint 16B: Diagram Library Management & Session Durability

**Status:** ✅ Completed & Verified  
**Primary category:** `corpus` (with workspace/shell work)  
**Depends on:** [Sprint 16](../16-diagram-creation-and-mcard-lifecycle/SPRINT-16-DIAGRAM-CREATION-AND-MCARD-LIFECYCLE.md)  
**Parent proposal:** [Sprints 16–19](../../orchestration/16-19-mcard-diagram-lifecycle-history-and-export/PROPOSAL-16-19-MCARD-DIAGRAM-LIFECYCLE-HISTORY-AND-EXPORT.md)

## Objective

Give users the tools to manage a growing library of evolving diagrams (rename, duplicate, archive) without breaking append-only MCard lineage. Guarantee that unsaved work survives reloads and tab closes. Bring pre-existing `localStorage` documents into the library.

## Current Gap

- The handle registry is append-only and has no rename, archive, or fork operations, so every accidental **New Diagram** pollutes the Explorer and every future export.
- `WorkspaceManager` declares `STORAGE_KEY = 'tikzit:workspace-state'` but never reads or writes it. Open tabs and dirty buffers die on reload.
- `closeDocument` returns `false` when only one tab is open, so a single dirty draft cannot be closed or discarded.
- Documents saved before Sprint 16 live in `DocumentStore` (`tikzit:doc:*`, `tikzit:doc-index`, `tikzit:rev:*` capped at 30) and are invisible to the MCard library.

## Proposed UI

- The row overflow menu adds **Rename** (inline edit, Enter/Escape), **Duplicate**, and **Archive**.
- A **Show archived** toggle in the Explorer lists archived diagrams dimmed, each with **Un-archive**.
- Duplicate titles are disambiguated in the row by creation date. Titles are labels, not identity (D9).
- After reload with recovered buffers, a banner reads **Recovered unsaved edits in N diagrams** with **Review** (focus the first) and **Discard all** (confirmed).
- Closing a dirty tab prompts **Save / Discard / Cancel**. Close Others and Close All prompt once per dirty doc, with an *apply to all* option. Closing the last tab opens a fresh draft.
- A browser `beforeunload` warning appears whenever any buffer is dirty.
- Imported legacy documents carry an **Imported** badge until first opened.

## Data & Event Contract

- **Rename** commits a new version of `zx:meta:diagrams:<uuid>` with the updated title. The diagram handle and its cards are untouched, and rename history is auditable through the metadata handle's lineage.
- **Archive/Un-archive** commits a metadata version with `archived: true|false`. Archived diagrams are excluded from default listing and search but stay resolvable and exportable. There is **no hard delete** (D6).
- **Duplicate** creates a new `zx:diagrams:<uuid>`. Its first head is a new card with the source's payload (a different URI gives a distinct hash), and its metadata records `source: 'duplicate'` and `forkedFrom: '<handle>@<hash>'`. The source handle is unchanged.
- **Session state** writes `{ activeDocId, openHandles[], dirtyBuffers: { [handle]: { content, updatedAt } } }` to `tikzit:workspace-state` (debounced by 300ms, and synchronously on `visibilitychange`/`pagehide`). A window `beforeunload` listener alerts the user when any buffer is dirty (`doc.isDirty === true`). Restored buffers are marked dirty; they are **not** MCards (D2). If the recovered content equals the current head, the buffer is dropped silently.
- **Legacy import** runs once and idempotently at startup. For each `tikzit:doc-index` entry without a matching `legacyId` in any metadata card, it creates a `zx:diagrams:` handle and commits the latest content through the gate. Metadata records `{ source: 'legacy-import', legacyId, legacySavedAt }`. Content that fails the gate becomes a recovered draft. Legacy revisions remain readable through the legacy History path (Sprint 17 AC-07). `localStorage` data is never modified or deleted.


## Acceptance Criteria

- **16B-AC-01:** Rename updates the Explorer, tab, and title chip; it survives reload; it creates one metadata version and no diagram-card change.
- **16B-AC-02:** Archive hides a diagram from default listing and search; Show archived plus Un-archive restores it; the diagram's lineage is unchanged in both directions.
- **16B-AC-03:** Duplicate produces an independent handle whose later edits never affect the source; provenance `forkedFrom` is recorded.
- **16B-AC-04:** Reload with dirty buffers restores tabs, active doc, and unsaved content, and announces the recovery. Discard all is confirmed and irreversible only for buffers.
- **16B-AC-05:** Closing a dirty tab, bulk close, and closing the last tab follow the prompts above; no path silently discards edits.
- **16B-AC-06:** Legacy import is idempotent across reloads, never deletes `localStorage` data, and imports gate-failing content as a recoverable draft.
- **16B-AC-07:** All new controls are keyboard-operable and have accessible names; recovery and import results are announced via live region.

## Out of Scope

- History UI for diagram or metadata lineage (Sprint 17).
- Export of archived diagrams in the collection (covered by Sprint 19 scope rules).
- Cross-device sync of workspace session state.

## Definition of Done

- [x] Unit tests cover rename/archive/duplicate lineage effects, session serialize/restore (including quota errors), bulk-close policy, last-tab close, and idempotent legacy import.
- [x] Playwright covers rename, archive/un-archive, duplicate, reload recovery, close prompts, and a seeded `localStorage` legacy fixture being imported.
- [x] Existing 12 seeded entries intact; `npm run verify:corpus` passes.
- [x] Typecheck, build, full unit suite, and E2E suite pass.
- [x] New selectors are added to Contract B in `_active/README.md`.

## Verification Commands

```bash
npx tsc --noEmit
npx vitest run
npm run verify:corpus
npm run build && npx playwright test
```
