# Sprint 17: MCard Version History & Restore

**Status:** ✅ Completed & Verified  
**Primary category:** `corpus` (reusing the shell History affordance)  
**Depends on:** [Sprint 16](../16-diagram-creation-and-mcard-lifecycle/SPRINT-16-DIAGRAM-CREATION-AND-MCARD-LIFECYCLE.md)  
**Parent proposal:** [Sprints 16–19](../../orchestration/16-19-mcard-diagram-lifecycle-history-and-export/PROPOSAL-16-19-MCARD-DIAGRAM-LIFECYCLE-HISTORY-AND-EXPORT.md)

## Objective

Bind the existing **History** popover to the active diagram's real MCard lineage. Versions should be legible (labels, timestamps, positions) and comparable, and restore must be truthful: re-registering a historical card as the head, never rewinding.

## Current Gap

- `VersionPopover` reads `defaultDocumentStore.getRevisions()`. Its savepoint Save and Restore write to `DocumentStore`, a shadow lineage (30-revision cap, truncated hashes) invisible to `collection.history()` and to exports.
- `DocumentCommitService.getDocumentHistory` returns bare `ContentHash[]` with no timestamps. The kernel's `handleHistory` appends the current head only when it is absent, so after A→B→A its last element is **not** the head.
- `saveDocumentWithGate` mints a card with `sequence = history.length`. Restoring by re-committing A's payload would therefore mint A′, a different hash.
- `markCommitted` sets hash, version, and AST but not `content`, so a restore through it leaves the source buffer stale.
- `CommitDocumentOptions` has no `message` field, so versions cannot carry labels.

## Proposed UI

- Keep the top-bar History button (`btn-version-history`), popover placement (`version-popover`), and keyboard flow.
- The header shows diagram title, current head (short ID + copy full ID), and version count.
- Each timeline row shows a current/prior marker, position (`v1…vN`), `changed_at` timestamp, author, optional label, and short content ID with copy. A→B→A shows the same ID at two positions, clearly ordered.
- **Save with label:** the popover's savepoint input becomes an optional version label for the next explicit save, routed through the MCard commit path.
- **Preview** renders a historical version read-only in the popover without touching the active document.
- **Compare with current** shows a source diff (added/removed lines) and node/edge count deltas.
- **Restore** confirms with: "Makes vK the current version. Later versions stay in history." If the buffer is dirty, the dialog offers **Save first / Discard edits / Cancel** before restoring.
- States: loading, no history (draft), storage unavailable, missing/corrupt card, restoring, restored, already current, conflict, failed.

## Data & Event Contract

- `documentHistory(handle) → { head, rows: [{ hash, changedAt, position, label? }] }`, built from ordered `handle_history` rows plus the head. Rows are keyed by position, not hash. `card.sequence` is not used for ordering.
- Labels: `CommitDocumentOptions.message` is written into the diagram's metadata card as `labels: { "<position>": "<text>" }` in the same save. Labels are keyed by position, which is stable because history is append-only, and not by hash, which repeats in A→B→A. Labels therefore travel with the collection export; the execution-log receipt may echo the label, but it is not the source of truth. Card identity is unaffected.
- **Restore** = `putWithHandle(historicalCard, handle)`: one new history row, no new card, true A→B→A.
- **Compare-and-set:** capture `expectedHead` when the user picks a version and bail with `conflict` if `resolveHandle()` differs at restore time.
- Restoring the current head returns `already-current`; nothing is written.
- `applyRestoredHead(handle, content, ast, hash)` atomically updates `defaultWorkspaceManager` (`doc.content = content`, `doc.ast = ast`, `doc.hash = hash`, `doc.isDirty = false`, `doc.updatedAt = Date.now()`), synchronizes canvas projection via `ctx.graph.setAST(ast)`, and emits `document:change`; `document:persisted` follows the flush.
- Lazy card loading: timeline rows are populated from `handle_history` timestamps and hashes; full card payloads are fetched from `collection` lazily only when previewed, diffed, or restored.
- Legacy (non-MCard) documents keep the `DocumentStore` path with an explicit "Local revisions (not MCard history)" heading. MCard-backed documents never write `DocumentStore` revisions.


## Acceptance Criteria

- **17-AC-01:** MCard-backed diagrams read history exclusively through `documentHistory`; timestamps come from `handle_history.changed_at`.
- **17-AC-02:** The timeline is scoped to the active handle; switching documents while the popover is open re-scopes it or closes it and can never restore into another diagram.
- **17-AC-03:** Missing or corrupt historical cards are listed as unavailable rows, not omitted; they cannot be previewed or restored.
- **17-AC-04:** Preview and Compare never change the active buffer, AST, head, or dirty flag.
- **17-AC-05:** Restore re-registers the chosen card. After A→B→A, the head hash equals A's original hash, no new card exists, and history holds both transitions. Buffer, canvas, head, and dirty flag are consistent afterward.
- **17-AC-06:** A conflict or storage failure leaves the head intact and reports an actionable result; restoring the current head reports *already current*; a dirty buffer is never silently overwritten.
- **17-AC-07:** Legacy documents show local revisions under a distinct heading; MCard documents create no `DocumentStore` entries.
- **17-AC-08:** Labels entered in the popover appear on the resulting version after reload.
- **17-AC-09:** Focus management, Escape/close, keyboard preview/compare/restore, and live-region announcements are covered.

## Out of Scope

- Creating diagrams (Sprint 16); library management (Sprint 16B).
- Export controls (Sprints 18–19).
- Rewriting, squashing, or deleting history. Branching/merging lineages.
- Visual (canvas-overlay) diff; Compare is source- and count-based.

## Definition of Done

- [x] Unit tests cover lineage ordering with duplicate-hash rows, missing/corrupt cards, re-register restore, CAS conflict, already-current, dirty-buffer guard, atomic apply, and labels.
- [x] Playwright covers history for a seeded example and a user diagram, preview, compare, restore with dirty prompt, switching while open, and keyboard flow.
- [x] Legacy document behavior is tested and visibly distinguished.
- [x] Existing 12 seeded entries intact; `npm run verify:corpus` passes.
- [x] Typecheck, build, full unit suite, and E2E suite pass.

## Verification Commands

```bash
npx tsc --noEmit
npx vitest run
npm run verify:corpus
npm run build && npx playwright test
```
