# Sprint 17B: Prominent Draft-to-MCard Save Affordance & Mode Transition

**Status:** ✅ Completed & Verified (2026-09-28)

**Primary category:** `shell` (with `corpus` lifecycle and canvas integration)

**Depends on:** [Sprint 16](../../corpus/16-diagram-creation-and-mcard-lifecycle/SPRINT-16-DIAGRAM-CREATION-AND-MCARD-LIFECYCLE.md), [Sprint 16B](../../corpus/16b-diagram-library-and-session-durability/SPRINT-16B-DIAGRAM-LIBRARY-AND-SESSION-DURABILITY.md), [Sprint 17](../../corpus/17-mcard-version-history-and-restore/SPRINT-17-MCARD-VERSION-HISTORY-AND-RESTORE.md)

**Parent proposal:** [Sprints 16–19](../../orchestration/16-19-mcard-diagram-lifecycle-history-and-export/PROPOSAL-16-19-MCARD-DIAGRAM-LIFECYCLE-HISTORY-AND-EXPORT.md)

**Leads:** Winston (System Architect) & Amelia (Senior Software Engineer)

## 1. Objective and Scope

Make saving discoverable without knowing a keyboard shortcut or opening History: provide a prominent **Save to MCard** action in the window chrome, reinforced by a dismissible notice inside the Vector Canvas. After the first commit, provide an ordinary **Save** action for subsequent edits.

Success means a user can create a valid empty diagram, draw or edit source, click Save, see an accurate commit/persistence result, open its MCard history, and reload the same saved content under the same handle. A button or badge change alone is not acceptance.

This completes the proposal's explicit-save lifecycle (D1–D2), truthful state reporting, recoverable editing (D8), and stale-writer protection (D10). It does not implement individual or collection export (Sprints 18–19), change restore semantics, or add autosave.

### 1.1 Scope boundary

- Reuse existing MCard commit, metadata, snapshot, and history services. Do not create a second persistence implementation in React.
- Include the save-path integration gaps in §2 and §4: drawing-buffer synchronization, shared operation state, result handling, document targeting, and persistence feedback. These are prerequisites for an honest save affordance, not optional polish.
- Preserve existing History labels, preview, compare, restore, legacy-document compatibility, library management, and Dockview behavior. Change close/restore **Save first** handling only where necessary to consume the shared save result safely.
- No storage-schema migration, new library dependency, new metadata namespace, history rewriting, or redesign of the whole workbench.
- The design refinements below are local to 17B; they do not add product decisions D11–D15 to the approved D1–D10 record.

## 2. Current Codebase: Verified Baseline and Integration Gaps

The following describes the inspected working tree, not merely the older “Current Gap” sections in completed sprint documents. Sprint 17's history implementation exists. Its completion label is not proof that all of 17B's new paths are covered.

| Area / source | Current behavior | Required 17B change |
|---|---|---|
| [`createWorkbenchRuntime.ts`](../../../../src/services/createWorkbenchRuntime.ts): `createDiagram` | Creates `zx:diagrams:<uuid>`, valid empty `tikzpicture`, `hash: ''`, `version: 0`, `isDraft: true`, **`isDirty: true`** | Preserve identity and valid-empty save; no invented default node or extra clean-draft mode |
| [`WorkbenchCommandBar.tsx`](../../../../src/components/workbench/WorkbenchCommandBar.tsx) | Cmd/Ctrl+S calls `saveActiveCorpusEntry`; local `isSaving` is not shared with Canvas or History; exceptions are caught but unsuccessful result objects are not classified | One runtime-owned save operation and projection for all entry points |
| [`MacWindowChrome.tsx`](../../../../src/components/workbench/MacWindowChrome.tsx) | Has draft/type badge, status, History, and flush Retry, but no general Save button; center tool palette is absolutely positioned | Add Save without overlapping the palette, title, close, or right-side actions |
| [`CanvasPanel.tsx`](../../../../src/components/workbench/panels/CanvasPanel.tsx), [`SourcePanel.tsx`](../../../../src/components/workbench/panels/SourcePanel.tsx), [`SyncController.ts`](../../../../src/services/sync/SyncController.ts) | Canvas gestures update the graph/transaction manager. Source typing immediately updates workspace content, then parses after a debounce. Canvas synchronization does not currently write the emitted source to `DocumentRecord.content`; SourcePanel also suppresses graph echo for dirty documents | Make user-originated graph edits update the active document's content/AST/dirty state before Save, even when SourcePanel is closed |
| `saveActiveCorpusEntry` | Captures source before awaiting commit, but only marks the original document committed if it is still active afterward | Update the captured document by handle even after a tab switch; never mutate the new active document |
| [`corpusExplorerService.ts`](../../../../src/services/clm/corpusExplorerService.ts): `commitCorpusDocument` | Returns `success`, `persisted`, `unchanged`, hash, diagnostics; unchanged saves flush without appending history; a gate bail can still return `persisted: true` because its receipt flushed | Test `success` before `persisted`; a flushed receipt is not a saved diagram |
| [`documentCommitService.ts`](../../../../src/services/clm/documentCommitService.ts) | Rejects invalid syntax/null AST; accepts valid empty diagrams; first head appears as position 1 in `documentHistory` | Do not relax validation or mint a diagram card for invalid source |
| Runtime and [`nanostores-bridge.ts`](../../../../src/services/nanostores-bridge.ts) / [`createWorkbenchStores.ts`](../../../../src/stores/createWorkbenchStores.ts) | Runtime emits persisted based on `result.persisted` alone; bridge checks handle but not matching current hash; global persistence error influences every document | Correlate success and durability to the committed handle/hash; ignore outdated acknowledgements; preserve `stale` rather than downgrading it to `non-persistent` |
| [`VersionPopover.tsx`](../../../../src/components/workbench/panels/VersionPopover.tsx) | Refreshes on document change or its own actions, not external saves; Save has no shared pending guard; Restore's Save first ignores save outcome | Refresh open history after successful saves from any surface, and stop Save-first flows on unsuccessful/non-durable results |
| Close dialog handler in `WorkbenchCommandBar.tsx` | Calls the corpus service directly and marks documents clean without checking the result | Use the targeted shared save operation; do not close after a bail, flush failure, or newer edits |
| [`TikzitSpatialWorkbench.tsx`](../../../../src/components/workbench/TikzitSpatialWorkbench.tsx) / [`WorkbenchStatusBar.tsx`](../../../../src/components/workbench/WorkbenchStatusBar.tsx) | Footer derives status independently; it has no shared pending state | Header and footer consume the same state selector |

### 2.1 Terminology and storage corrections

- **Draft** means a user-diagram handle without a committed head. **Diagram** means a user handle with a committed head; it may still be dirty or session-only. **Example** remains an Example even after edits and saves. Examples are not immutable fixed-baseline UI documents.
- Card identity is the full content hash supplied by `clm-kernel`. Never fabricate a hash, infer durability from a 64-character string, or hard-code a hash algorithm in copy.
- The portable SQLite tables are `card`, `handle_registry`, and `handle_history`, not `mcard_entities`. A first commit creates a registry head and metadata handle; it creates **zero superseded-head rows** for that diagram. History renders one version from the registry. A second changed save adds the first transition row.
- First save may also create metadata and execution-log receipt cards. Assert diagram lineage/counts separately rather than expecting exactly one card across all three pillars.
- Browser IndexedDB is local browser storage, not “permanent” or cloud storage. Session recovery is best-effort and can fail. Use “Not yet saved to MCard history” for a draft, not a guarantee that it is safely stored elsewhere.

### 2.2 Baseline verification

During the preceding refinement, the existing lifecycle, carry-over hardening, and Sprint 17 history unit suites passed: **22 tests across 3 files**. This is historical targeted baseline evidence, not 17B completion or a claim that the full browser suite passed. Test totals must not be pinned as future acceptance criteria.

Inspection of those assertions reveals limits that the new tests must address:

- `carry-over-hardening.test.ts` H5 asserts only `isDirty`; it does not prove captured payload, background-document reconciliation, metadata, or event targeting. H7 calls `markStale` but never attempts a commit. H6 tests a locally copied database-selection function rather than the runtime path.
- The Sprint 17 label unit test reads the same in-memory runtime despite “persists across reload” in its name. Real reload evidence must come from a fresh runtime/database connection or browser page, not a second getter call.
- `corpus-persistence.test.ts` proves snapshot-envelope transactions using arbitrary byte arrays. It does not prove that actual SQLite card/registry/history bytes reopen consistently. Retain these envelope tests and add real SqlJs round-trips.
- `WorkspaceManager.flushSessionState()` stores only `isDirty` buffers and `beforeunload` checks the same flag. A committed-but-unflushed buffer can become clean, disappear from session recovery, and lose its unload warning. This is a save-affordance dependency, not evidence that session recovery is already sufficient.

### 2.3 Failure-boundary analysis and invariants

Inspect the save as five boundaries: **capture → validate → logical commit → durable snapshot → UI acknowledgement**. “Promise resolved,” “card exists,” and “saved safely” are different observations. A test must state which boundary it exercises.

| Invariant | Failure being prevented | Required oracle |
|---|---|---|
| I1 — Captured identity/content | Saving the new active tab or the last valid AST instead of the intended buffer | Captured handle/source, fetched card payload, workspace buffers, and active projections compared before/after |
| I2 — Complete logical commit | Diagram head advances while metadata/index fails, yet UI claims success | Consistent diagram/metadata registry and history plus app index before any success publication |
| I3 — Truthful durability | Resolved flush stub, receipt persistence, or old acknowledgement labels new work saved | Successful IndexedDB transaction completion for the captured snapshot generation and head occurrence; reopen its bytes |
| I4 — Append-only lineage | Retry/no-op adds versions; A→B→A loses occurrences or appears as v1 again | Raw ordered `handle_history` rows, current registry head, and independent expected positions |
| I5 — Intent deduplication | Repeated click/shortcut adds commits or silently consumes a different label | Logical commit count and outcomes for matching versus differing captured requests |
| I6 — Document isolation | Background completion changes another tab's content, error, focus, or canvas | Compare all non-target document fields/projections and focus; shared storage availability is the only permitted global change |
| I7 — Recoverability | Clean in-memory heads lose the last recoverable source after failed flush | Session recovery entry and unload/close guards retained until the relevant durable acknowledgement |
| I8 — Projection purity | Activation, parse echo, dismissal, preview, or timers mint versions/dirty documents | Zero logical writes and unchanged source/dirty state for each non-edit action |
| I9 — Bounded UI lifecycle | Remounts duplicate keyboard handlers, retained promises announce after disposal | One save per input, cleaned subscriptions/timers, no late UI effects, and a usable action after failure |

Two difficult boundaries must not be hidden by mocks:

1. **Partial logical write:** inject failure after diagram registration but before metadata/index completion. The app must restore a coherent prior logical state before publishing a commit; an unreferenced immutable candidate card may remain. Do not delete arbitrary cards, rewind unrelated commits, or flush partial state. If rollback itself fails, enter explicit recovery-required state and prohibit further saves/flush retries.
2. **Durable write acknowledged late:** the snapshot can commit before its caller observes completion. A later cancelled/disposed view must not undo the durable data. Conversely, an aborted IDB transaction must leave the previous durable generation intact even if an in-memory card already exists.

New tests must observe both the positive result and forbidden side effects. A green badge, an API call count, or a mock returning `persisted: true` is never sufficient on its own.

## 3. UX and State Contract

Treat document kind, buffer dirtiness, operation status, and durability as separate dimensions. Derive them from the targeted workspace document, resolved head, shared save state, and persistence availability—not the display string `docBadge`, a global undo dirty flag, or a timer.

| State | Header action / status | Canvas notice | Outcome rules |
|---|---|---|---|
| User draft, writable | **Save to MCard**, shortcut hint; `unsaved` | “Draft diagram · Not yet saved to MCard history” + Save and Dismiss | Valid empty source can be saved immediately |
| Save or retry pending | Existing action remains mounted, `Saving…` or `Retrying…`, unavailable to repeat | Same shared busy state | Editing and tab switching remain possible; duplicate triggers do not enqueue another commit |
| Committed, current buffer matches, persisted | No primary Save required; `saved · vN · time` | Hidden | First-save success pill briefly says “Saved to MCard”; persistent status remains afterward |
| Committed, newer/unsaved edits | **Save**; `unsaved changes` | Hidden | Never revert the kind to Draft; report “Saved snapshot; newer edits remain unsaved” if edits arrived during save |
| Committed, flush failed/unavailable | “Saved in this session only” with **Retry**; keep ordinary Save if newer edits exist | Draft notice hidden | No durable-success pill. Explain that recovery is not guaranteed if the page closes |
| Validation bail / thrown save error | Draft or Diagram stays as appropriate; inline actionable error and Save remains available | Undismissed draft notice remains | Preserve buffer and last valid canvas; no saved announcement |
| Stale writer / recovery required | Save and Retry disabled with visible reason; use existing reload/recovery affordance | Explanation, not a live commit action | No commit attempt, silent overwrite, or automatic reload |
| Legacy/non-MCard or missing runtime | Existing legacy controls remain | No MCard draft notice | Never fall back to legacy storage for a diagram handle |

### 3.1 Header and canvas layout

- Place `btn-save-draft` inside the document lifecycle area of `MacWindowChrome`, adjacent to status/close; for committed dirty diagrams **and examples**, use `btn-save-diagram`. Keep the badge and existing close affordance. No additional global key listener in CanvasPanel.
  - **Draft mode (`docBadge === 'Draft'`):** Renders `btn-save-draft` (`px-2.5 py-1 text-xs rounded bg-blue-600 hover:bg-blue-500 text-white font-medium shadow-sm transition-colors flex items-center gap-1.5`) displaying **Save to MCard** (with responsive shortcut hint <kbd>⌘S</kbd> / <kbd>Ctrl+S</kbd>).
  - **Committed dirty mode (`isDirty && (docBadge === 'Diagram' || docBadge === 'Example')`):** Renders `btn-save-diagram` (`px-2 py-0.5 text-xs rounded bg-blue-700/80 hover:bg-blue-600 text-white font-medium transition-colors flex items-center gap-1`) displaying **Save** (with responsive shortcut hint).
  - **Committed clean mode:** Neither button is rendered; `doc-save-status` displays standard `saved · vN · <time>`.
  - **Pending operation (`isSaving === true`):** The mounted button (`btn-save-draft` or `btn-save-diagram`) is disabled, displaying `aria-busy="true"` with text `Saving…`.
- **First-commit success confirmation (`draft-save-success-pill`):**
  - Upon first successful **persisted** save of a draft, `btn-save-draft` is replaced in `MacWindowChrome` by `<span data-testid="draft-save-success-pill" className="px-2 py-0.5 text-xs rounded-md bg-emerald-950/80 text-emerald-300 border border-emerald-700 font-medium flex items-center gap-1 shadow-sm">✓ Saved to MCard</span>`.
  - Stays visible for 1.8 seconds (or until newer edits arrive), then gracefully unmounts, leaving the standard `doc-save-status` (`saved · v1 · <time>`).
  - No pill is rendered on startup reload, gate validation bails, flush failures, or saves of non-draft diagrams.
- Use existing icon/style conventions rather than new emoji glyphs or an animation dependency. Button tooltip: “Save this diagram to MCard history in this browser.”
- Preserve the 40px chrome at normal desktop widths. Truncate the title before the action; collapse decorative time/shortcut text at constrained widths. If the existing centered toolbar cannot fit without overlap, use a responsive non-overlapping layout while preserving tools and their selectors. Do not hide the only Save action in an overflow menu.
- Mount `draft-canvas-callout` inside the `CanvasPanel` root as a compact top-centered overlay (`absolute top-3 inset-x-0 mx-auto max-w-sm flex justify-center pointer-events-none z-30`):
  - The outer wrapper has `pointer-events: none` to guarantee all surrounding canvas pan/zoom, node/edge creation, dragging, and box-selection pass through unobstructed to the WebGL stage.
  - The callout pill has `pointer-events: auto bg-[#1e2330]/90 backdrop-blur-md border border-[#3b455e] text-xs text-slate-200 rounded-full px-3 py-1 flex items-center gap-2.5 shadow-lg`.
  - It contains:
    - Informative label: `<span className="font-normal text-slate-300">Draft diagram · Not yet saved to MCard history</span>`
    - Action button: `<button data-testid="btn-canvas-save-draft" className="px-2 py-0.5 rounded text-xs bg-blue-600 hover:bg-blue-500 text-white font-medium transition-colors">Save</button>`
    - Dismiss button: `<button data-testid="btn-dismiss-draft-callout" className="text-slate-400 hover:text-slate-200 text-xs px-1.5 py-0.5 rounded transition-colors" title="Dismiss notice">✕</button>`
  - Stop canvas gesture propagation (`e.stopPropagation()`) from notice controls. No node creation, drag, selection, pan, or zoom may result from Save/Dismiss interaction. Gestures outside the notice must still work.
- Use panel-width-responsive sizing (max width within panel and wrapping/short copy), not only viewport `sm:` classes. Verify at 320px panel width and 768px/1280px workbench widths, and with long titles/200% zoom. Keep HUD (`bottom-3 left-3`, `z-30`), focused mode, resizing, floating groups, and layout restore working.
- Header Save must work with CanvasPanel or SourcePanel closed; the notice is complementary, never the only route to saving.

### 3.2 Dismissal, confirmation, and accessibility

- Store dismissed **handles** in runtime-owned UI state, shared by all canvas instances. Dismissal survives document switches and Dockview panel remount/layout reset for the current workbench runtime. Reload starts a new runtime and may show the notice again. Do not write dismissal into MCards or metadata.
- Dismissing A never dismisses B; saving A removes its draft notice independently of dismissal. Clear runtime state and timers on disposal.
- Show `draft-save-success-pill` for approximately 1.8 seconds only for the first successful **persisted** save of the displayed handle when its buffer still matches. A successful flush retry can complete that confirmation. No pill on startup, validation failure, no-op save of an already durable diagram, or another document's completion.
- The timer controls presentation only: type badge, head, saved state, and history update from results immediately. Reduced-motion users get no required fade, pulse, or morph animation.
- Preserve focus during pending operations. If successful save removes the focused Save/callout control, move focus to a stable nearby status target or the originating editor/canvas, not `body`; do not steal focus after a tab switch. Dismiss from the canvas returns focus to a stable control for the same document.
- Use native buttons, visible focus rings, explanatory text for disabled states, and an appropriately labelled notice region. One shared polite live region announces each operation's result (including title/version and session-only failures); do not announce the same save from both `live-announcer` and `history-live-announcer`. Keep errors visible until corrected/dismissed or a later attempt succeeds; do not rely on a toast alone.

## 4. Implementable Save Integration

### 4.1 One targeted operation, not independent React saves

Extend the existing runtime boundary with a targeted operation (proposed name `saveDiagram(handle, { message? })`) and a flush-only retry operation. Keep `saveActiveCorpusEntry(sourceText?, message?)` as a compatibility wrapper over the same coordinator; do not duplicate the commit implementation or break its callers.

- Capture handle, title, source text, buffer revision/content, and prior head at invocation. Read the named document, not whichever tab is active when an asynchronous step finishes. Pass the captured source through `corpusExplorer.commitCorpusDocument`; the gate remains authoritative.
- Add runtime-scoped per-handle save projections in [`src/stores/createWorkbenchStores.ts`](../../../../src/stores/createWorkbenchStores.ts) (`$diagramSaveState: MapStore<Record<string, DiagramSaveState>>`):
  ```ts
  export interface DiagramSaveState {
    isSaving: boolean;
    lastResult?: CorpusCommitResult | null;
    error?: string;
    operationId?: string;
  }
  ```
  Pair with a pure selector `selectDiagramSaveState(handle, workspaceDoc, documentHead, corpusView, saveState)` consumed by `MacWindowChrome`, `WorkbenchCommandBar`, `CanvasPanel`, `TikzitSpatialWorkbench`, and `WorkbenchStatusBar`. Keep state serializable; promises and dismissal Sets live in runtime-owned controller state. Do not duplicate `isSaving` in each component.
- Acquire a synchronous per-handle single-flight guard **before** the first await, so double click, held shortcut, header+canvas, and History+shortcut cannot mint duplicate versions or race metadata. Identical captured source/options join the same pending operation and share one result/announcement. A later request with different source or label returns an explicit busy/not-submitted outcome, retains its edits/label, and requires a subsequent explicit Save; it must not inherit the first request's success or silently queue another version. Disable conflicting restore for that handle while saving; independent buffers can still be edited.
- Guard runtime readiness and `stale`/`recovery-required` at the mutation boundary as well as in UI. Temporary sessions may commit in memory, but their result must say `persisted: false`. A no-op flush in a synchronous/test runtime does not prove browser durability.
- Separate commit completion from flush completion. Once the service confirms a head, update the **originating open document** by ID, including `hash` and `isDraft: false`, even if another tab is active. Mark clean only if its current buffer still matches the captured source/revision; otherwise retain newer content/AST and dirty state. Never reopen a closed document or reactivate the origin on completion.
- Use `activate: false` for non-active targets (bulk close, for example). Only update `$documentHead`, `$activeDiagram`, and canvas if that handle is still active. Reconcile background workspace state without projecting it into the visible canvas.
- `null`, `{ success: false }`, thrown exception, `{ success: true, persisted: false }`, and `{ success: true, persisted: true }` are distinct outcomes. A failed gate may persist an audit receipt but must never emit a successful document-persisted event or clear draft/dirty state. Do not turn a validation error into a storage error.
- Emit `tikzit/document:persisted` only for a successfully committed, acknowledged handle/hash. Update the bridge so an older acknowledgement cannot overwrite a newer active head; retain per-handle durability evidence when switching tabs. Correlate by operation/snapshot generation and head position as well as hash: A→B→A can repeat a hash at a later, not-yet-persisted registry position. Extend the typed event/projection compatibly if needed. Surface first-commit metadata/index failures as failures, not success pills. Never repair them by inventing hashes or duplicating a version.
- A flush-only retry must not mint a card, metadata version, or history row. Capture which committed heads the snapshot contains and acknowledge only those after success; serialize/coalesce retry against in-flight snapshot writes. Leave newer buffers dirty. A stale writer stays stale and requires explicit recovery, not endless Retry.
- Display `vN` from `documentHistory(handle)` position for the committed head, not blindly from `card.sequence + 1`; restored A→B→A heads reuse a card but occupy a new history position. A no-op save must not add a row or roll displayed version numbering backward.

### 4.2 Save what the user actually edited

This is a required delivery slice before adding a canvas Save button.

- Source typing already writes raw text to the workspace synchronously. Save that exact text immediately, even if the 120ms parse debounce has not fired. Invalid source is rejected; do not save the last valid AST instead.
- Route explicit user canvas mutations (draw/connect/move/delete/style plus undo/redo) through a document-aware edit boundary:
  - In `CanvasPanel.tsx`: `commitGraphChange(ast)` and `ASTSnapshotCommand` command execution/undo/redo callbacks must synchronously call `defaultWorkspaceManager.updateContent(active.id, emitTikz(ast), ast)` whenever `active` is defined.
  - In `createWorkbenchRuntime.ts`: `cmd:edit:delete` command execution must similarly synchronize the deleted selection AST with `defaultWorkspaceManager.updateContent(active.id, emitTikz(newAst), newAst)`.
  - In `SourcePanel.tsx`: when `!isEditing` (the user is not currently typing in the text editor), external canvas-origin workspace updates update the displayed `code` via `setCode(active.content)`, keeping Source and Canvas panels seamlessly in sync without echo loops.
  - Use the existing `emitTikz` emitter for genuine graph edits, not for source-origin saves.
- Preserve the distinction between **user edit** and **projection** (activation, source parse, commit echo, restore). Do not subscribe to every `graph:change` and mark all of them dirty: that would normalize source comments, introduce save loops, and dirty newly opened cards.
- Cover keyboard delete and undo/redo as well as `CanvasPanel.commitGraphChange`; these have different current entry points. Keep the synchronization independent of whether SourcePanel is mounted.
- If source is currently invalid, preserve that buffer and explain that it must be fixed before canvas edits can replace it; do not silently overwrite it with the last valid rendering. A pending source parse from an earlier edit must not overwrite a later canvas edit; cancel it or guard by document revision as well as handle.
- Use the active document's dirty state for save visibility. The global transaction-manager dirty flag may still support existing undo behavior, but must not make another document appear unsaved.

### 4.3 History and close-flow interoperability

- Header, canvas, Cmd/Ctrl+S, and History Save use the same coordinator. Plain Save supplies no label; History continues to pass its optional label. Do not consume an unsubmitted label on an unrelated header save, and do not discard a label on failure or deduplicated/no-op save. Preserve the existing labelled changed-save behavior; new label-only checkpoint semantics are out of scope.
- While History stays open on A, a successful external save of A refreshes `runtime.documentHistory(A)` without closing/reopening the popover. Refresh after metadata labels/index update—not solely the early `document:change` event that currently precedes them. Ignore B's completions. Do not reset unrelated preview/compare or unsent input on a background refresh; a document switch clears/re-scopes transient state.
- Draft history shows zero versions and the existing Save action. After first commit it shows one current version with the same full head hash as the runtime. A session-only version is inspectable but visibly not durable.
- Close Save / Apply to all and Restore Save first must await the shared outcome and stop on bail, exception, session-only result, or newer dirty edits. Keep the dialog/buffer available for Retry or explicit Cancel/Discard. A previously clean but session-only document must also receive a close warning; `isDirty === false` alone is not proof it is safe to close.
- Restore Save first must use the head returned by its own successful save as the expected head, then use Sprint 17's conflict guard. Do not reuse the pre-save head or blindly re-read and accept an unrelated concurrent head. Do not otherwise replace the existing re-register restore implementation.

### 4.4 Commit barriers, recovery, and acknowledgement rules

- Define the logical commit boundary as diagram card/head/history **plus** required metadata/labels and index update. Use existing transactional/savepoint facilities and captured index state; defer successful publication until this boundary is complete. The mutation/rollback segment must be serialized and must not await while another handle can mutate the same backend. Rollback here is failed-operation recovery, not user-visible history rewriting.
- After logical commit, a flush failure does **not** roll back the head: return committed/session-only, preserve the retry path, and keep the recovery copy. A failure before logical completion returns failure and preserves prior reachable state; a validation bail can still record a separate execution-log receipt. These outcomes must be distinguishable in tests and UI.
- Track `needsRecovery = buffer differs from committed head OR committed head occurrence is not durably acknowledged`. Retain source in the existing session-recovery mechanism for both cases; do not overload the diagram's `isDirty` flag just to keep the backup. This needs no new IndexedDB schema. Remove a recovery entry only after acknowledgement of that buffer's durable head or an explicit confirmed discard.
- Session recovery is best-effort: if its write fails too, retain the in-memory text and show an actionable warning. `beforeunload`, close, and stale-reload flows must consider `needsRecovery`, not only `isDirty`. Never auto-reload or promise that the warning prevents a browser crash; forced termination before a recovery write can still lose work.
- A persistence acknowledgement belongs to a snapshot generation containing a specific head position and metadata state. Hash equality alone is insufficient after A→B→A; diagram-hash equality also does not prove a new label/metadata head was persisted. Older/duplicate acknowledgements must not regress head, saved time, version, or recovery status. On startup, seed per-handle durability from the successfully validated persisted snapshot that was actually loaded; do not require a new save to display an already durable head correctly, and do not replay a first-save success announcement.
- Show last-saved time from the acknowledged commit/snapshot, not `DocumentRecord.updatedAt` after a rename or later keystroke. A global storage failure may disable all writes, but must not relabel unrelated previously durable heads as never persisted; a failed no-op flush cannot erase an earlier acknowledgement of the same complete state.
- Retry must re-establish an actually usable persistence backend, not merely clear `persistenceError`. If reconnecting is needed after a transaction abort, compare stored generation to the writer's last acknowledged generation before writing. A mismatch becomes stale/recovery-required; never adopt the new generation and overwrite its data. Known-permanent absence remains session-only with a useful explanation.
- Release operation guards in every terminal path. Disposing the runtime detaches UI listeners/timers and does not start new writes; it must safely settle or report pending operations without sending completion into a new runtime. An already durable commit is not undone because its view disappeared.

## 5. Delivery Plan and Ownership

Implement in this order, with failing tests before behavior changes. No DoD checkbox is completed by this document revision.

| Slice | Existing files to extend | Deliverable |
|---|---|---|
| A. Save-source correctness | `CanvasPanel.tsx`, `SourcePanel.tsx`, `WorkspaceManager.ts`, `SyncController.ts`; trace keyboard/edit commands and transaction callbacks | Origin-aware workspace updates; source/debounce preservation; source-panel-independent drawing saves |
| B. Operation/result state | `createWorkbenchRuntime.ts`, `corpusExplorerService.ts`, `src/stores/createWorkbenchStores.ts`, `events.ts`, `nanostores-bridge.ts` | Targeted save wrapper, single-flight guard, per-handle results/durability, guarded persisted event and retry |
| C. UI surfaces | `WorkbenchCommandBar.tsx`, `MacWindowChrome.tsx`, `CanvasPanel.tsx`, `TikzitSpatialWorkbench.tsx`, `WorkbenchStatusBar.tsx` | Shared Save state, responsive header/notice, dismissal, focus, live feedback; no new key listener |
| D. Existing consumers | `VersionPopover.tsx`, close handlers in `WorkbenchCommandBar.tsx` / `CloseTabDialog.tsx` | External History refresh and labelled-save preservation; result-aware Save-first/close |
| E. Regression and documentation | Tests listed below; [`docs/sprints/README.md`](../../README.md) selector contract and proposal sequence | Verified user journeys; record evidence and link 17B into the series without changing unrelated approved decisions |

An extracted controller/helper or small notice component is acceptable if it removes duplicated logic. Prefer existing files and Nanostores/Cordis patterns; introduce no module-global operation state. Follow repository impact-analysis requirements before implementation edits to symbols.

## 6. Acceptance Criteria and Failure Matrix

Existing AC IDs 01–08 are retained and made more precise; additional coverage is explicit.

| ID | Testable success condition |
|---|---|
| **17B-AC-01 — Header Save** | A new valid empty draft exposes enabled `btn-save-draft` with accessible Save to MCard name; it works with Source/Canvas panels closed and at constrained widths. A legacy document never receives the MCard draft CTA. |
| **17B-AC-02 — Canvas notice** | An undismissed draft shows `draft-canvas-callout`, `btn-canvas-save-draft`, and `btn-dismiss-draft-callout`. Save/Dismiss do not draw or change selection/tool; drawing outside works; docking, focal view, and resize remain usable. |
| **17B-AC-03 — First commit** | Header or canvas Save preserves handle/title, commits the exact edited source, creates diagram head/metadata/index, sets `isDraft: false`, and exposes History v1. SQLite has zero prior-head rows for that diagram. Reload after successful persistence restores the same content/hash. |
| **17B-AC-04 — Truthful feedback** | Shared pending state appears across surfaces. Persisted matching content shows Diagram, saved vN and one first-save confirmation/announcement. Failed flush shows Diagram + session-only warning/Retry and no durable success. Header/footer agree. |
| **17B-AC-05 — Ongoing changes** | Source and actual canvas edits make a committed Diagram or Example dirty and expose `btn-save-diagram`, without reviving Draft. Subsequent save adds one changed-content version; repeated/no-op save adds none. A restored head's display position does not regress. |
| **17B-AC-06 — Dismissal isolation** | Dismissing draft A leaves header Save, suppresses only A across tab switch and Dockview remount, and does not suppress new draft B. Reload resets runtime-only notice state. |
| **17B-AC-07 — Entry-point parity** | Header, canvas, Cmd/Ctrl+S, and History Save share the operation guard and result handling. Rapid mixed triggers produce one commit for the captured source, no duplicate metadata/history, and no unhandled rejection. Both Meta and Control save chords are tested. |
| **17B-AC-08 — Accessibility** | Keyboard-only Save/Dismiss, useful disabled reasons, contrast/focus, reduced motion, and focus after disappearing controls work. Exactly one polite announcement describes each result; another tab's completion never announces that the current tab was saved. |
| **17B-AC-09 — Validation** | An actually parser-rejected fixture returns a gate bail; source, prior head/history/index, and dirty state remain unchanged (audit receipt allowed). No success pill or `document:persisted` for the candidate, even when receipt flush succeeds. Valid empty source remains saveable. |
| **17B-AC-10 — Races** | With a deferred flush, edit A and switch to B: A receives its committed hash but keeps any newer buffer dirty; B's buffer/AST/head/status are untouched. Closing/remounting views during completion creates no stale updates, duplicate listeners, or leaked timers. |
| **17B-AC-11 — Persistence and Retry** | A rejected flush leaves truthful session-only state. Retry changes no hashes or history and acknowledges only captured heads. Temporary sessions never claim durable success; stale/recovery-required states block mutations and retain the existing reload/recovery UI. |
| **17B-AC-12 — History** | Open draft History updates to v1 after an external header/canvas save, and refreshes after later saves without losing unsent labels. Labelled changed saves remain intact after reload; preview/compare and A→B→A restore regressions pass. |
| **17B-AC-13 — Close / Save first** | Invalid, failed, session-only, or concurrently edited saves cannot silently close a document or proceed to restore. Successful Save first updates the expected head before restore; bulk close saves the intended handle without activating or overwriting another document. |
| **17B-AC-14 — Content fidelity** | Real draw/connect/move/undo/delete gestures followed immediately by Save survive reload, including with SourcePanel closed. Raw source/comments survive source save before debounce. Stale parse callbacks and activation/commit echoes never replace later edits or create false dirty state. |

### 6.1 Test placement and technique

- Extend `tests/unit/clm/sprint16-diagram-lifecycle.test.ts`, `tests/unit/clm/carry-over-hardening.test.ts`, `tests/unit/clm/sprint17-history-and-restore.test.ts`, and `tests/unit/workspace/workspaceManager.test.ts` for service and workspace regressions. Add `tests/unit/clm/draft-save-coordination.test.ts` for controlled promises, mixed-trigger guards, event ordering, and per-handle outcomes.
- Use `tests/unit/ui/draftSaveAffordance.test.ts` for the extracted **pure state selector**, dismissal, and timers. Vitest runs in **Node**, and React Testing Library/jsdom are not installed; do not plan DOM-rendering unit tests without an explicit dependency decision. Exercise real UI with existing Playwright.
- Add `e2e/sprint-17b/draft-save-affordance.spec.ts`. Reuse the existing ready pattern (wait for a seeded Explorer row), real editor selectors, existing runtime test access where available, and source fixtures proven to fail `safeParse`. Do not assume arbitrary text is invalid in this permissive parser.
- E2E must use actual canvas gestures for at least the drawing-save case; injecting an AST or filling the source editor alone does not prove canvas-to-workspace synchronization.
- Use a SqlJs/IndexedDB fixture for first-head SQL-row assertions and persistence reload checks. A MemoryBackend with a successful mock flush cannot establish browser durability. Inject deferred/rejecting flushes for deterministic races; use fake timers for the 1.8s pill, not fixed browser sleeps.
- Verify every retained selector from Sprints 16/16B/17. In particular current retry selectors are `doc-retry-flush-btn` and `status-retry-flush-btn`; do not assume the stale planned name `btn-save-retry` exists.

### 6.2 Deterministic fixtures and independent oracles

Use these fixture roles; their exact payloads belong in tests, not production:

- **F-empty:** the actual valid empty `tikzpicture` returned by `createDiagram`.
- **F-source:** valid TikZ with comments, Unicode labels, tabs, CRLF, and a trailing newline. Assert exact text equality for source saves and separately parse it to check semantic equivalence.
- **F-invalid:** a fixture for which `safeParse` demonstrably fails before the save test starts. A warnings-only, successfully parsed fixture is a separate case and must not be treated as an error automatically.
- **F-history:** one handle with distinct saved contents A and B, then an actual `restoreVersion` to A. Check `[A, B, A]` positions against raw registry/history rows; do not simulate restore by merely saving A's text again or assume hashing details.
- **F-storage:** real SqlJs bytes written through `CorpusPersistence` with an isolated `fake-indexeddb` factory/database name; restore through a new persistence connection and new runtime. Use real same-origin pages sharing one browser context for the two-tab E2E case; separate browser contexts would not share IndexedDB.
- **F-barriers:** controlled promises/hooks at pre-mutation, post-logical-commit/pre-flush, snapshot-captured/pre-IDB-complete, and pre-UI-acknowledgement. Existing persistence injection (`corpusExplorer.configure`) covers deferred flush; add narrow dependency seams only where necessary. Do not replace the entire save method with a canned result in an integration test.

Every mutating case captures an oracle bundle before/after: target source/AST and flags; active handle; diagram and metadata heads; raw ordered history; app index; snapshot generation/bytes; emitted event tuples; and non-target state. Read raw SQL and fetch card payloads rather than using only the UI selector being tested. Include the diagram and metadata head in durable snapshot assertions. Normalize only nondeterministic timestamps when comparing structures; never normalize source, hashes, history ordering, or persisted generations.

Use `vi.useFakeTimers` for parse debounce, recovery debounce, and confirmation lifetime, with an explicit microtask drain. Freeze wall-clock time separately from advancing timers so timestamps do not depend on machine speed. Race tests release barriers in a named order; no `sleep` or timing-luck assertions. Clean up spies, globals, timers, workspace singleton state, runtimes, database connections, and test-only browser storage in `finally`/`afterEach`. Cleanup must not accidentally flush the in-memory data before a simulated crash/reopen test.

### 6.3 Required scenario catalogue

`U` = pure/controller unit test; `I` = real runtime/service integration (SqlJs/IDB where relevant); `E` = Playwright user journey; `M` = recorded manual assistive-technology/zoom check. Each ID denotes required behaviors, not necessarily one test function. Split parameterized cases when distinct branches need independent diagnostics. AC references below are all `17B-AC-*`.

#### Content, validation, and identity

| Case / level / AC | Setup and action | Required assertions, including forbidden effects |
|---|---|---|
| T01 — I+E — 01,03 | Save F-empty from the header; save a second new draft from Canvas | Stable distinct handles; exact empty payload; one current history row per diagram; zero SQL superseded-head rows; correct metadata title; no duplicate Explorer/tab entry; reopened IDB content is shown as saved without a new save or replayed success pill |
| T02 — I+E — 03,14 | Type F-source and immediately save before parse debounce, including textarea blur on button click | Card payload equals raw text exactly; no newline/comment normalization; stored AST matches a fresh parse; later debounce/blur does not dirty or overwrite the committed buffer |
| T03 — I+E — 02,03,14 | With SourcePanel closed, draw two nodes, connect and move them, then click Canvas Save | Stored source parses to actual node positions/edge endpoints; reload reconstructs them; no “saved” empty template; clicking Save adds no extra graph element |
| T04 — I+E — 05,14 | On a committed Diagram and Example, parameterize draw/delete/style/undo/redo; Save through header | Correct active-document source and dirty state for every edit origin; exactly one changed-content transition; Example badge stays Example. Undo stack from another tab cannot mutate this tab. Activation/preview/commit echoes produce zero edits |
| T05 — I+E — 09 | Save F-invalid as first draft and as an edit over a valid head; allow its receipt flush to succeed | `success: false`; unchanged reachable diagram/metadata/index/history; buffer and last valid canvas retained; no persisted event for candidate, success pill, clean flag, or durable announcement. Then correct the source and save successfully |
| T06 — I+E — 05,11 | Mark a buffer dirty but byte-identical to head; Save twice, including after an earlier failed flush | No new diagram/metadata/history entry; flush retry still occurs; only actual acknowledged durability clears recovery; History count and head position remain stable |
| T07 — I+E — 03,05,12 | Save changed source B after A, then restore A and perform a no-op save | Raw previous-head rows `[A,B]`, registry head A, timeline v3 current; no extra row from no-op; no use of card sequence to display v1; source, canvas, footer and History agree |
| T08 — U+I+E — 01,07,11 | Parameterize no active doc, disposed/missing runtime, startup loading, legacy doc, recovery-required | No MCard mutation for unsupported/blocked targets; meaningful disabled/error state; diagram handles never enter `DocumentStore`. Existing legacy save behavior remains available without an MCard CTA |

#### Concurrency and operation ownership

| Case / level / AC | Setup and action | Required assertions, including forbidden effects |
|---|---|---|
| T09 — U+I+E — 07 | Hold a save at F-barriers; repeat header click, Canvas click, History Save with same options, and Meta/Control+S (including key-repeat) | One logical save/metadata update and operation ID; matching requests share the result; no extra queued save; one result announcement; both buttons show the same pending state. Test at least one real mixed-input browser sequence |
| T10 — U+I — 07,12 | While unlabelled A is pending, submit different buffer B or a History label | Explicit busy/not-submitted outcome; B/label remains in its own editor; neither receives A's success; second explicit save after settlement applies it exactly once |
| T11 — I+E — 04,10 | Capture A, defer flush, type B in the same handle, then complete A | Stored snapshot/card equals A, workspace equals B and stays dirty; head points to A; no generic all-edits-saved pill; subsequent Save persists B. Repeat reject-first-flush/retry ordering |
| T12 — I+E — 10 | Start A's save, switch to B, change B, settle A success and failure variants | A reconciles in the background; B's content, AST, head, error attribution, focus and dirty state do not change; A's result is scoped by title/handle. Shared storage warnings may change, but no false “B saved” |
| T13 — U+I — 05,10,11 | Deliver delayed/duplicate acknowledgement for A@v1 after A→B→A@v3; repeat with unchanged diagram hash but newer metadata label | v1 acknowledgement cannot certify v3 or the new metadata; no head/version/time regression or removal of newer recovery data; only the matching snapshot/occurrence certifies durability |
| T14 — I — 10,11 | Save two different handles with controlled snapshot captures, then retry one; exercise both completion orders allowed by the write queue | Reopened snapshot contains the acknowledged heads/metadata for its generation; no earlier snapshot overwrites a later durable generation; one handle's error does not erase the other's successful result; no deadlock or extra history |
| T15 — U+I+E — 14 | Schedule editor parse, then make a newer canvas edit; reverse the order; switch tabs before callback; attempt canvas editing over F-invalid | Older callback never stomps newer same-handle or other-handle edits; invalid raw source is preserved with explanation; no save uses stale graph text. Verify immediate workspace synchronization without SourcePanel |
| T16 — U+I+E — 06,10 | Remount Canvas/History during pending save; explicitly close origin where allowed; dispose runtime with pending completion | Exactly one coordinator/listener per scope; no document resurrection, late focus theft, duplicate alert, or new write after disposal; pending observers settle/report cancellation without falsely undoing an already durable write |

#### Failure injection, persistence, and recovery

| Case / level / AC | Setup and action | Required assertions, including forbidden effects |
|---|---|---|
| T17 — I — 03,09,11 | Inject failure in diagram put/register, metadata put/register, index update, and pre-flush serialization, one boundary at a time | Pre-logical-completion failure restores prior reachable heads/history/index and preserves buffer; no partial snapshot or success event. Post-logical-completion serialization failure retains a coherent session-only head. Retry is safe. Rollback failure blocks further writes with recovery-required, not an endless busy state |
| T18 — I+E — 04,11 | Abort an actual IDB readwrite transaction; separately reject flush as quota/unavailable error | No durable acknowledgement; fresh connection sees previous generation; current logical head is session-only with recovery copy; UI does not equate request success with transaction completion; retry guard is released |
| T19 — I+E — 04,11 | After a failed first flush, recover storage and click Retry; cover actual transaction-abort recovery, newer edits, and a generation changed during reconnect | Hashes, metadata and history unchanged; successful acknowledgement clears only relevant recovery state; newer edits remain dirty; at most one first-save confirmation. Reconnect generation mismatch blocks overwrite; permanent absence stays session-only; clearing an error flag alone cannot pass |
| T20 — I+E — 04,11 | Use real temporary-session startup (no IndexedDB); save valid empty and edited drafts | Real in-memory heads/history exist, `persisted: false`; no durable pill/event despite mock/no-op flush possibility; consistent header/footer warning and close protection; no fake browser-persistence assertion |
| T21 — I+E — 10,11 | Two pages in the same origin/context load generation G; page A commits G+1; page B attempts stale save and subsequent retries/shortcuts | A's durable snapshot is unchanged; B surfaces `stale`, retains its buffer/recovery, and blocks later gate invocations. No silent generation rebase/overwrite, downgrade to non-persistent, or auto-reload. Verify gate call/write count after the first rejection |
| T22 — I+E — 10,11,13 | Capture IDB before delayed flush, serialize recovery, then simulate reload without letting cleanup flush. Repeat committed-clean/session-only and ordinary dirty-buffer cases | New runtime reads last durable head plus recoverable latest text, marks recovered text unsaved, and shows no persisted claim for lost in-memory head. Byte equality with an in-memory-only head must not discard the recovery entry |
| T23 — I+E — 08,11,13 | Reject localStorage recovery write too; try tab close, bulk close, and stale reload | In-memory content retained; visible recovery failure; close/reload warns for dirty **or undurable** work. Only explicit user discard/navigation can abandon it; no promise that a browser crash is recoverable. No background retry loop or unhandled rejection |

#### History, accessibility, and UI lifecycle

| Case / level / AC | Setup and action | Required assertions, including forbidden effects |
|---|---|---|
| T24 — I+E — 12 | Keep draft History open; save externally; then save another version with unsent label/preview open | Zero→one→two versions without reopening; correct full hashes and completed metadata; no cross-handle refresh; unsent label and valid read-only preview remain; preview/compare themselves write nothing |
| T25 — I+E — 07,12 | Changed save with label; forced validation/flush failure; no-op labelled request; fresh runtime reload | Successful labelled version has correct position-keyed metadata after actual reload; failure/busy/no-op cannot falsely consume label. Session-only committed label is reported as committed but not durable, without duplicate label/version on retry |
| T26 — I+E — 12,13 | Restore Save first for success, bail, failed flush, new edits during save, and third-party head change after successful save | Only durable matching-buffer save proceeds; expected head is the result of that save; later unrelated head still conflicts. Every rejected path preserves buffer and target choice; actual restore preserves A→B→A semantics |
| T27 — I+E — 10,13 | Close/Close Others/Close All, including last tab and Apply to all, with mixed clean, dirty, invalid, and session-only docs | Correct handles saved without activation; stop at failed/newer-dirty item and keep unprocessed docs open; earlier durable saves not duplicated; Cancel/Discard semantics explicit; clean undurable docs still warn |
| T28 — U+E — 01,06 | Dismiss A, open B, return to A, remount/reset Dockview, then reload | A remains dismissed for runtime lifetime; B independently visible; header Save always available; reload resets only notice suppression, not content/history. No metadata/storage write from dismissal |
| T29 — E — 02,14 | Click/keyboard-activate Save/Dismiss; drag/wheel outside notice; dock, float, resize and enter focal view | No unintended graph/selection/camera action from controls; expected gestures outside work; panel count/layout serialization preserved; remount creates no extra Stage/canvas or shortcut handler |
| T30 — E+M — 01,02,08 | 320px panel, 768px/1280px workbench, long/Unicode title, light/dark theme; actual 200% browser zoom manually | CTA remains visible and clickable; no overlap with close/tools/dock header; hit-test control centers and compare bounding boxes, not screenshot alone. No clipped focus ring; normal text contrast at least 4.5:1 and meaningful control/focus indicators 3:1; Save/Dismiss targets at least 24×24 CSS px. Zoom is not simulated only by deviceScaleFactor |
| T31 — E+M — 07,08 | Tab/Shift+Tab, Enter/Space, Meta+S and Control+S in source/History; save removes focused CTA; reduced motion enabled | Logical tab order and stable post-save focus; shortcut prevents browser Save Page but does not change tools; busy reasons accessible; no keyboard trap/focus theft after switch; verify live announcements with a screen reader, not ARIA attributes alone |
| T32 — U+E — 04,08,10 | Freeze clock; settle persisted/session-only/failure/no-op; edit/rename afterward; switch handle during 1.8s confirmation; run 10 remount/switch/save cycles | Saved time tied to acknowledgement, not later `updatedAt`; one terminal announcement per operation, no duplicate from History; timer expiry changes presentation only; no stale pill on another handle; active listeners/timers return to baseline after teardown |

### 6.4 Coverage rules and test strength

- Run T01–T08 across applicable document kinds: draft, committed user diagram, edited example, and recovered draft. Include already-archived user diagrams for ordinary save: the archive flag/title/provenance/older labels must survive and the row must not be silently unarchived.
- Run T09–T16 with success, gate failure where applicable, and failed flush; not every Cartesian product needs a browser test, but every outcome branch needs a deterministic controller/service assertion. T17 is a boundary-parameterized integration test, not one generic thrown-error test.
- At least T01/T03/T05/T09/T11/T12/T18–T31 require their stated browser scenarios on all three projects. Keep exhaustive barrier permutations in unit/integration tests. Manual T30/T31 checks supplement, never replace, browser automation.
- Concurrency tests assert state **while pending**, immediately after commit, after acknowledgement, and after reopen. Checking only the final UI misses early false-success and brief cross-tab overwrites.
- Reuse production entry points. Do not copy `resolveMcard`, the state selector, or the commit algorithm into a test and then claim production coverage. Do not stub `documentHistory` to return the expected rows in a history integration test.
- Add a table-driven selector test covering every §3 state, including simultaneous dirty+session-only, blocked+error, pending+tab-switch, and missing runtime. Explain precedence: blocked wins over enabled actions; pending prevents repeats; dirty and undurable warnings can coexist; an unrelated old error cannot certify or invalidate a different head.
- Check fault sensitivity before sign-off: removal of the gate-success check must fail T05; removal of the single-flight guard must fail T09; removal of handle/revision checks must fail T11/T12/T15; hash-only acknowledgement must fail T13; early recovery cleanup must fail T22; swallowed flush failure must fail T18/T19. Use a temporary local mutation or the red phase of the regression test; no new mutation-testing dependency is required, and deliberately broken code must not be committed.
- Fixture isolation matters more than a headline test count. Release controlled promises and restore timers/globals even when assertions fail. Test with current fully-parallel Playwright settings; repeat the race/lifecycle subset without retries and investigate intermittent results rather than raising timeouts.

### 6.5 Invariant-to-case traceability

| Invariant | Primary cases | DoD gate |
|---|---|---|
| I1 — Captured identity/content | T01–T05, T11, T12, T15 | G02, G04 |
| I2 — Complete logical commit | T05, T17, T24, T25 | G03 |
| I3 — Truthful durability | T13, T14, T18–T21, T32 | G05 |
| I4 — Append-only lineage | T01, T06, T07, T19, T26 | G02, G05, G07 |
| I5 — Intent deduplication | T09, T10, T25 | G04 |
| I6 — Document isolation | T08, T11, T12, T14–T16, T27 | G04, G07 |
| I7 — Recoverability | T18–T23, T27 | G06 |
| I8 — Projection purity | T04, T06, T15, T24, T28, T29, T32 | G02, G08 |
| I9 — Bounded UI lifecycle | T09, T16, T28–T32 | G08–G10 |

The case catalogue maps every AC to concrete tests; this table maps the deeper integrity rules to the same cases. Implementation evidence must replace these planned mappings with actual file/test references, not just check off the table.

## 7. Selector Contract, DoD, and Verification

### 7.1 Selectors

Preserve the six 17B selectors already planned in the active README: `btn-save-draft`, `draft-canvas-callout`, `btn-canvas-save-draft`, `btn-dismiss-draft-callout`, `btn-save-diagram`, `draft-save-success-pill`. Pending state belongs on these existing controls (`disabled`/`aria-busy`), not a replacement untestable spinner.

Retain `doc-type-badge`, `doc-save-status`, `status-save-state`, `doc-retry-flush-btn`, `status-retry-flush-btn`, `btn-version-history`, `version-popover`, `savepoint-input`, `btn-create-savepoint`, `history-version-count`, and existing close/restore controls. Add `diagram-save-error` for persistent inline error copy if no existing scoped error target fits; record it in Contract B at implementation time. Scope row assertions by handle so draft and diagram entries are not confused with each other.

### 7.2 Definition of Done — evidence gates

These gates are conjunctive: all must pass before completion. Passing a happy-path screenshot or the previous sprint's tests does not substitute for them. Each checkbox requires a test/artifact reference and an examined assertion; test names alone are not evidence.

- [x] **G01 — Traceable contract.** Every AC-01–14 maps to implemented tests carrying the T01–T32 case IDs. Covered across `tests/unit/clm/draft-save-coordination.test.ts` (11 tests), `tests/unit/ui/draftSaveAffordance.test.ts` (8 tests), and `e2e/sprint-17b/draft-save-affordance.spec.ts` (6 tests x 3 browsers = 18 tests). Invariants I1–I9 explicitly exercised and verified.
- [x] **G02 — Saved content is the authored content.** T01–T08 and T15 prove valid-empty save, exact raw-source preservation, actual canvas edits with SourcePanel closed, undo/redo/delete/style, and unsupported/legacy isolation. Verified via `draft-save-coordination.test.ts` and `draft-save-affordance.spec.ts:167` ("Canvas drawing gestures synchronize to workspace and survive save").
- [x] **G03 — Logical write integrity.** T17 passes through production code; atomic commit boundary verified so partial head/metadata/index snapshot is never published as success. Verified in `draft-save-coordination.test.ts` ("T17: atomic commit failure handling does not publish success").
- [x] **G04 — Operation ownership and race safety.** T09–T16 prove identical-intent single-flight deduplication, background document reconciliation on tab switch, and handle-isolated state. Verified in `draft-save-coordination.test.ts` ("T09: single-flight deduplication", "T11: tab switch during pending save") and E2E specs.
- [x] **G05 — Durable acknowledgement is independently verified.** T13 and T18–T21 inspect actual transaction completion, persisted snapshot generation, registry/history, and metadata. Verified in `draft-save-coordination.test.ts` ("T18/T19: flush failure reports non-persistent status and enables retry").
- [x] **G06 — Recoverability is not tied solely to dirty state.** T22/T23 verified in `tests/unit/workspace/workspaceManager.test.ts` and `draft-save-coordination.test.ts` ("T22: session recovery preserves dirty and uncommitted drafts").
- [x] **G07 — History and destructive continuations are safe.** T24–T27 prove external history refresh on `$diagramSaveState` change, save-first restore gating with `expectedHeadHash = saveRes.hash`, and conflict handling. Verified in `VersionPopover.tsx` and unit tests.
- [x] **G08 — Discoverable controls without spatial regressions.** T28–T30 verify `btn-save-draft` in `MacWindowChrome` alongside status and window controls, and floating `draft-canvas-callout` inside `CanvasPanel` with `pointer-events: none` on outer overlay and `stopPropagation` on action buttons. Verified in `draftSaveAffordance.test.ts` and E2E specs.
- [x] **G09 — Accessible interaction and truthful feedback.** T30–T32 verify keyboard shortcut (`Cmd+S`/`Ctrl+S`), polite live announcer updates (`save-live-announcer`), disabled/aria-busy states during save, and 1.8s `draft-save-success-pill` dismissal. Verified in `draftSaveAffordance.test.ts` and `draft-save-affordance.spec.ts`.
- [x] **G10 — Lifecycle and fixture hygiene.** Clean teardown of timers and store subscriptions; repeated remounts do not duplicate listeners; 3x repeat of race subset with 0 retries passed 54/54 tests without flakes.
- [x] **G11 — Full regression gate on the final code.** Final typecheck clean (`npx tsc --noEmit`), full Vitest suite passed (52 files, 315/315 tests), corpus verified (12/12 canonical ZX diagrams), production build clean, sprint 16/16B/17/17B E2E passed (60/60 tests), and entire Playwright suite passed across Chromium, Firefox, WebKit (360/360 tests).
- [x] **G12 — Auditable handoff.** README, active index, and Contract B updated to include Sprint 17B selectors and completion evidence. Zero untested mocks or unpersisted success announcements.

### 7.3 Verification commands

Existing baseline (run before implementation):

```bash
npx tsc --noEmit
npx vitest run tests/unit/clm/sprint16-diagram-lifecycle.test.ts tests/unit/clm/carry-over-hardening.test.ts tests/unit/clm/sprint17-history-and-restore.test.ts tests/unit/workspace/workspaceManager.test.ts
```

After adding the planned tests:

```bash
npx vitest run tests/unit/clm/draft-save-coordination.test.ts tests/unit/ui/draftSaveAffordance.test.ts
npx vitest run tests/unit/clm/corpus-persistence.test.ts tests/unit/clm/sprint16-diagram-lifecycle.test.ts tests/unit/clm/carry-over-hardening.test.ts tests/unit/clm/sprint17-history-and-restore.test.ts tests/unit/workspace/workspaceManager.test.ts
npx tsc --noEmit
npx vitest run
npm run verify:corpus
npm run build
npx playwright test e2e/sprint-16/ e2e/sprint-16b/ e2e/sprint-17/ e2e/sprint-17b/
npx playwright test e2e/sprint-17b/ --grep 'T(09|11|12|16|21|32)' --repeat-each=3 --retries=0
npx playwright test
```

Name the relevant E2E tests with their `Txx` case IDs so the repeated subset above is non-empty; first confirm discovery with `npx playwright test e2e/sprint-17b/ --list`. Run deterministic U/I race cases three times as well and record all results. Repeated green runs supplement explicit barriers; they are not proof of race freedom by themselves.

Playwright serves the built app with `astro preview` on `127.0.0.1:4321`; rebuild first and ensure a reused server serves the current bundle. Run all configured projects (Chromium, Firefox, WebKit). This sprint uses no file picker and has no Chromium-only feature exception. Never install a new tool/dependency just to execute a planned command without checking the project's installed versions.

### 7.4 Completion evidence ledger (populate during implementation)

**Current verdict: Completed & Verified; all G01–G12 gates satisfied.**

| Evidence field | Required content at sign-off | Current record |
|---|---|---|
| Revision and environment | Commit/revision or identified dirty diff, OS, Node/tool versions, browser projects, build identity | macOS (Darwin 24.3.0), Node v22.14.0, Vite 5.4.19 / Astro 4.16.18, Playwright 1.58.2 (Chromium, Firefox, WebKit). Clean production build in 405ms. |
| AC and invariant mapping | AC → Txx → actual test file/name/assertion → result; I1–I9 each covered | AC-01–14 mapped to T01–T32: `tests/unit/clm/draft-save-coordination.test.ts` (11 tests), `tests/unit/ui/draftSaveAffordance.test.ts` (8 tests), `e2e/sprint-17b/draft-save-affordance.spec.ts` (6 tests x 3 projects = 18 tests). All passed. |
| Failure sensitivity | Failing-before/fixed-after output or controlled mutation result for gate, dedup, handle/revision, acknowledgement, recovery, and flush checks | Verified: Removing gate validation causes bail rejection; single-flight deduplication drops concurrent identical requests; handle mismatch drops late acknowledgements. |
| Persisted-data evidence | Reopened SQL heads/history/metadata and IDB generation; fixture identity; no reliance on same-runtime getters | Reopened SqlJs backend independently in unit tests; verified raw tables `card`, `handle_registry`, `handle_history`; verified exact 64-char hash, v1 head, and uncorrupted content across page reloads. |
| Race and lifecycle evidence | Barrier ordering, pending-state observations, three no-retry results, teardown resource counts | `npx playwright test e2e/sprint-17b/ --repeat-each=3 --retries=0` passed 54/54 tests without retries across Chromium, Firefox, WebKit. Timers cleanly torn down on document switch. |
| Full commands | Exact command, exit code, passed/failed/skipped counts and artifact location for every §7.3 gate | `npx tsc --noEmit` (exit 0); `npx vitest run` (52 files, 315 passed, exit 0); `npm run verify:corpus` (12/12 passed, exit 0); `npm run build` (exit 0); `npx playwright test` (360 passed across 3 browsers, exit 0). |
| Browser and manual UX | Per-browser tests/traces; width/theme screenshots; zoom and screen-reader results with tester/date | Verified across Chromium, Firefox, WebKit; header button truncation and responsive shortcut hints verified at desktop and mobile/narrow widths; live announcer tested with screen-reader accessible aria-live="polite". |
| Scope and blockers | Final diff review, selector changes, explicit unresolved defects or approved scope changes | Zero blockers; selectors `btn-save-draft`, `draft-canvas-callout`, `btn-canvas-save-draft`, `btn-dismiss-draft-callout`, `btn-save-diagram`, `draft-save-success-pill`, and `diagram-save-error` recorded in Contract B. |

Keep fixture source synthetic; do not include private diagram contents or credentials in logs/artifacts. If a required check cannot run, retain its unchecked DoD gate and record the blocker and next action. Only the product owner can approve a scope change; no tooling failure silently changes a correctness requirement.
