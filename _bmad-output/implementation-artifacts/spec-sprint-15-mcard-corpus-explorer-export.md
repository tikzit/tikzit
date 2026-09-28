---
title: 'Sprint 15 — MCard-backed Corpus Explorer & Sovereign Export'
type: 'feature'
created: '2026-09-28'
status: 'done'
route: 'dispatch'
baseline_commit: '9e4d8af9281f299168e63bff9ea2354a84872dc8'
review_loop_iteration: 1
context: ['docs/sprints/corpus/15-mcard-backed-corpus-explorer-and-sovereign-export/SPRINT-15-MCARD-BACKED-CORPUS-EXPLORER-AND-SOVEREIGN-EXPORT.md']
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** The Explorer drawer in `TikzitSpatialWorkbench.tsx` is static mock UI — a dead search input, three literal rows, a fabricated `CID: blake3:7a4f32...` — and the CLM TriDatabase is `TriDatabaseManager.newInMemory()`, so nothing survives reload and there is no way to export the corpus as a portable SQLite file that mcard-studio can import.

**Approach:** Make runtime startup async: initialize sql.js WASM, hydrate three distinct persisted `SqlJsBackend` pillars (knowledge / executionLog / mcard) plus an explicit corpus handle index from a versioned IndexedDB store, then seed the corpus from `docs/examples/manifest.json` under `zx:examples:{id}` handles. Drive the Explorer UI from that index (debounced search, open-entry activates exact source without minting receipts). Route corpus-bound Cmd/Ctrl+S through `DocumentCommitService.saveDocumentWithGate`. Add a "Save Corpus (.db)" action that builds an isolated sql.js database via `SqlJsBackend.exportBinary()`, validates card/hash integrity and history semantics, then saves via File System Access API with Blob fallback. Treat the mcard-studio importer hash-identity defect as a hard gate verified by a cross-repo round-trip test.

## Boundaries & Constraints

**Always:**

- Human-approved decisions: enforce non-empty parsed diagrams (bail when both node and edge counts are zero); fix the mcard-studio importer and require real cross-repo round-trip verification; keep the cohesive full scope despite exceeding the token advisory.
- Test-first (vitest under `tests/unit/clm/`, Playwright under `e2e/sprint-15/`); implement against the sprint doc's CEX-01…CEX-21 matrix.
- Three **distinct** backends in `TriDatabaseManager.withBackends({knowledge, executionLog, mcard})`: `SqlJsBackend` in the browser, `MemoryBackend` in tests/`CLM_ZERO_FS`. Never share one backend across pillars.
- Corpus handles are `zx:examples:{manifest.id}` (e.g. `zx:examples:05_bialgebra_law`) — never benchmark IDs like `zx:02_bialgebra`.
- Persist a separate handle index of `{handle, hash, committedAt}` rows — `MCardCollection` cannot enumerate handles.
- Before any seed write: fetch each manifest file, verify HTTP status, byte count (`tikz_bytes`), SHA-256 over raw bytes (`tikz_sha256`), UTF-8 decode, and `safeParse`. Parse all entries before committing; seed only after hydration; never overwrite an existing head; partial failures stay retryable and don't mark the corpus seeded.
- The document commit gate enforces non-empty diagrams: bail when parsed AST has zero nodes **and** zero edges, matching `ast_valid_and_non_empty`.
- Format status CID from `$documentHead.hash` via `ContentHash.parse`/`fromHex` + `asPrefixed()`; truncated label, full value in `title`/accessible text; placeholder when uncommitted.
- Export validation: SQLite magic bytes, expected schema tables, per-card payload/hash integrity, no stale handles, no invalid hashes; replay only genuine prior `handle_history` rows (current HEAD is never its own `previous_hash`).
- `showSaveFilePicker` `AbortError` = user cancellation → no Blob fallback, no file, receipt status `cancelled`. Blob fallback only when picker is unavailable or fails non-cancellation; revoke object URLs.
- SSR-safe: no `window`/IndexedDB/sql.js access during server render; runtime init is async with ready/loading/error state and an idempotent `disposeAsync()` that flushes then closes.

**Never:**

- No `compilePortableSqlite`/`parsePortableSqlite` in browser code — they import `node:*` modules. Browser export uses sql.js + `SqlJsBackend.exportBinary()`; `parsePortableSqlite` is Node-test/consumer-side only.
- No fabricating explorer rows for stale/malformed index entries — surface them as error/stale state.
- No second Cmd/Ctrl+S handler and no change to the existing non-corpus `WorkspaceManager.saveActive` path.
- No synchronous `createWorkbenchRuntime()` inside React render.
- No claiming mcard-studio interop until the import round-trip test passes.

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|----------|--------------|---------------------------|----------------|
| SEED | manifest + 12 verified assets | all committed under `zx:examples:*`, index rows written | partial failure → flagged, retryable, corpus not "seeded" |
| RESEED | existing current heads | no-op; heads and histories preserved | — |
| SEARCH | query, ≤150 ms debounce | ranked manifest-backed rows; empty state on no match | stale/malformed index rows reported, not rendered as valid |
| OPEN | row click | exact stored source in SourcePanel; active handle/hash/AST updated; no commit receipt | missing card → error state, prior doc untouched |
| SAVE_PASS | changed valid source | gate pass → handle advances, history kept, clean, CID updates | persistence failure → "committed, not persisted" + retry |
| SAVE_BAIL | invalid source | prior head kept, stays dirty, diagnostics emitted, bail receipt minted | — |
| RELOAD | committed corpus | pillars + handle index + histories restored | corrupt/unsupported/IDB-unavailable → observable non-persistent state, no fake success |
| EXPORT | verified corpus | valid SQLite 3 bytes, handles + prior histories only | AbortError → `cancelled` receipt, zero bytes written |
| INTEROP | exported .db imported by mcard-studio | every handle resolves to identical hash + payload + full history | any mismatch → gate fails |

</frozen-after-approval>


## Code Map

- `src/services/createWorkbenchRuntime.ts` — sync render-time construction (line ~50 `initTriDatabase`); becomes async; add `disposeAsync`.
- `src/services/clm/triDbAdapter.ts` — `newInMemory()` at :35; add backend-injected variant producing three `SqlJsBackend`/`MemoryBackend` pillars.
- `src/services/clm/documentCommitService.ts` — `saveDocumentWithGate` (:76) is the save path; `resolveDocument`/`getDocumentHistory` for open/history.
- `src/components/workbench/TikzitSpatialWorkbench.tsx` — Explorer mock :372-391, fake CID :476, render-time `createWorkbenchRuntime()` :51-52 → async bootstrap + loading gate.
- `src/stores/createWorkbenchStores.ts` — `$documentHead` {handle, hash, sequence, isValid, lastCommittedAt}; add corpus-query/active-entry/persistence-status stores.
- `src/services/nanostores-bridge.ts` — `tikzit/document:change` → `$documentHead` bridge :39-50; extend for corpus events.
- `src/services/workspace/WorkspaceManager.ts` — module-global; add `markCommitted(docId, hash, sequence)`; corpus-bound `saveActive` delegates to `documentCommit`.
- `src/components/workbench/panels/SourcePanel.tsx` — reads `defaultWorkspaceManager` directly; load exact MCard source on activation without normalization writeback.
- `src/services/keybindings.ts` — existing Cmd/Ctrl+S dispatch; route corpus-bound docs to gated commit.
- `docs/examples/manifest.json` + `public/docs/examples/{manifest.json,zx-calculus/*.tikz}` — seed source of truth (12 files, byte counts + sha256 per entry).
- `node_modules/clm-kernel` — `TriDatabaseManager.withBackends`, `SqlJsBackend` (needs an initialized `SqlJsDatabaseLike` — sql.js not yet a dependency), `MemoryBackend`, `MCardFileSystem.exportHistory`/`importHistory`, `ContentHash`, `Handle`, `MCard.fromJSON`/`toJSON`.
- `GovTech/MCard_TDD/mcard-studio/src/services/databaseSyncService.ts` — importer identity defect :244-275; fix only after GitNexus impact analysis in that repo, and add import-integrity test.

## Tasks & Acceptance

**Execution:**

- [x] `package.json` — add `sql.js` + `@types/sql.js` (pinned, ≥7-day-old version) — required for browser WASM SQLite.
- [x] `tests/unit/clm/*` + `e2e/sprint-15/*` — write failing tests for CEX-01…CEX-21 first — sprint contract.
- [x] `src/services/clm/sqliteRuntime.ts` (new) — sql.js init, three-pillar backend factory, IndexedDB hydrate/flush (`tikzit_corpus_db`, versioned, atomic writes, corruption/unsupported-version recovery, non-persistent observable fallback) — CEX-12…15.
- [x] `src/services/clm/corpusExplorerService.ts` (new) — manifest fetch/verify, `zx:examples:{id}` seeding, `{handle,hash,committedAt}` index, `listCorpusEntries`/`searchCorpus`/`openEntry`, corpus-bound save orchestration — CEX-01…09.
- [x] `src/services/clm/triDbAdapter.ts` — injectable backends variant — async init support.
- [x] `src/services/createWorkbenchRuntime.ts` + `TikzitSpatialWorkbench.tsx` — async bootstrap, ready/error state, `disposeAsync`, SSR-safe — CEX-21.
- [x] `src/components/workbench/…` Explorer drawer — controlled debounced search `[data-testid="corpus-search-input"]`, rows `[data-testid="corpus-entry-{handle}"]`, loading/empty/error/active states — CEX-05…07.
- [x] `WorkspaceManager.ts` + `SourcePanel.tsx` + `keybindings.ts` — `markCommitted`, exact-source activation, corpus-bound save routing — CEX-08.
- [x] `TikzitSpatialWorkbench.tsx` status bar — real CID `[data-testid="status-cid"]` — CEX-10.
- [x] `src/services/clm/corpusExport.ts` (new) + save button `[data-testid="corpus-save-btn"]` — verified isolated export, FS-Access/Blob save, receipts — CEX-16…18.
- [x] `mcard-studio/src/services/databaseSyncService.ts` + `tests/clm-studio/unit/services/mcard_database_import_integrity.test.ts` — preserve original `MCard.fromJSON` identity, verify recomputed hash before handle registration, and round-trip full histories — CEX-19 (perform GitNexus impact analysis in mcard-studio before edits).

**Acceptance Criteria:**

- Given a fresh browser session, when the workbench loads, then the Explorer lists all 12 manifest examples and Cmd/Ctrl+S on a corpus doc mints a commit that survives reload.
- Given an invalid edit, when saving, then the prior head is preserved, the doc stays dirty, and a bail receipt exists in executionLog.
- Given a seeded corpus, when "Save Corpus (.db)" completes, then the bytes parse as SQLite 3, every card verifies against its hash, and mcard-studio import resolves every handle to identical cards and histories.
- Given `SSR`/no `window`, when the module loads, then no IndexedDB/sql.js access occurs and render does not crash.

## Implementation Notes

Post-review fixes landed: sql.js rejected-init cache reset (retry-safe); export made best-effort on non-persistent flush; revert-safe history validation (last row only must not equal head); `meta+s` no longer falls through to `setTool('select')`; SourcePanel stale-debounce and same-id echo suppression via `doc.ast === graph` reference check; `commitCorpusDocument` rejects non-`zx:examples:` handles; stale index rows repaired to resolved head on reseed; ConsolePanel bound to live `$documentHead`; non-corpus activation clears `$documentHead`/`$activeDiagram`; `saveActiveCorpusEntry` marks dirty-but-unchanged saves clean; `browserDownload` mounts the anchor and revokes after 1 s; `build_examples.py` mirrors `.tikz`/`.svg` assets into `public/` when it isn't a symlink; temp-session regex broadened to IndexedDB/storage/blocked errors.

## Spec Change Log

## Review Triage Log

Three parallel layers (edge-case, blind-hunter, verification-gap) reviewed the 201 kB diff. Converged findings verified and patched: rejected-WASM retry dead-end, export abort in non-persistent sessions, revert-lineage (A→B→A) export abort, `meta+s` clobbering the active tool, stale debounced parse stomping a newly opened doc, same-id reopen normalizing exact source, fabricated `ConsolePanel` CID, sticky drawer error state, unhandled `saveActiveCorpusEntry` rejection, dirty no-op save left dirty, Blob fallback anchor/URL lifecycle, missing activation/edge-count/gate-bail E2E assertions, runtime-isolation regression coverage. Deferred/out-of-scope: VersionPopover lineage wiring (documented follow-up — corpus history surfaced via `documentCommit.getDocumentHistory`).

## Design Notes

Persistence layout: one IndexedDB db `tikzit_corpus_db` (versioned) with per-pillar binary snapshots from `SqlJsBackend.exportBinary()` plus a `corpus_index` store for `{handle, hash, committedAt}` rows; writes are transactional per flush; `disposeAsync` flushes then `close()`s each sql.js db exactly once. Export builds a fresh isolated sql.js db (not the live pillar) so only verified corpus cards + handle registry + genuine history rows are emitted.

## Verification

**Commands:**
- `npm run verify:corpus` — expected: manifest/asset integrity passes
- `npx vitest run tests/unit/clm` — expected: all CEX unit cases pass
- `npm test` — expected: existing suite still green
- `npx playwright test e2e/sprint-15` — expected: workbench journey + reload pass
- `npx tsc --noEmit && npm run build` — expected: no type errors; no `node:*` externals pulled into browser bundle
- `(cd ../../../GovTech/MCard_TDD/mcard-studio && npm run test:unit)` — expected: import-integrity test passes
