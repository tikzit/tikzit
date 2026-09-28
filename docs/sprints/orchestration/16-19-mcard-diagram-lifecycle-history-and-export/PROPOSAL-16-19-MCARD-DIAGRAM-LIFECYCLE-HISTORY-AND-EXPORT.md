# Proposal: Sprints 16–19 — First-Class MCard Diagrams, History & Export

**Status:** Proposed; not started — revised after a three-lens review (adversarial, edge-case, structure) with findings verified against source and the CLM kernel  
**Planning participants:** Paige (Product/UX), Winston (Architecture), Amelia (Engineering)  
**Scope:** Explorer creation and library management, MCard handle lineage, individual diagram export, and complete diagram-collection export.

## Problem Statement

The Explorer lists the 12 seeded `zx:examples:` handles and exposes a single `Save Corpus (.db)` action; it cannot create anything. The header `+` creates a generic `WorkspaceManager` document with an ephemeral `doc-*` id, and ordinary saves go to the legacy `localStorage` `DocumentStore`. Corpus saves go through `CorpusExplorerService` → `DocumentCommitService`. The History popover reads `DocumentStore.getRevisions()`, not CLM handle history. The SQLite export walks only the example index.

The review also found that the `zx:examples:` prefix is enforced in seven places. One is the IndexedDB snapshot validator, so the first persisted user diagram would make every later startup fail. Several Sprint 15 defects are also live today (see [Sprint 16 Phase A](../../corpus/16-diagram-creation-and-mcard-lifecycle/SPRINT-16-DIAGRAM-CREATION-AND-MCARD-LIFECYCLE.md#phase-a--sprint-15-carry-over-hardening)).

**Target:** one coherent diagram lifecycle. Create from the Explorer or header, commit accepted saves as MCards on a stable handle, manage the library (rename, duplicate, archive), inspect and restore lineage, and export one diagram or the whole collection with verifiable lineage.

## UX Principles for Evolving Diagrams

1. **The Explorer is the diagram library.** Every diagram, draft, and seeded example is findable there. Rows show title, type badge (Example / Diagram / Draft), version count, and last-saved time.
2. **State is always legible.** The title chip and status bar distinguish *unsaved*, *saving…*, *saved · v7 · 2m ago*, and *saved in this session only* (committed but not flushed to disk).
3. **History is append-only and truthful.** Nothing is ever rewound or deleted; restore and archive are new facts in the lineage, not erasures. Versions can carry a short label.
4. **Nothing is silently lost.** Dirty buffers survive reload, closing prompts per document, and export never changes what is saved.
5. **Exports say exactly what they contain:** saved version or unsaved edits, which style catalog, and which collection scope.

## Proposed UI (contract level; mechanics live in each sprint)

- **Explorer action row** under the header: **New Diagram** and **Export Collection…** (icon-only with accessible names at minimum width). `New Diagram` and the header `+` run the same command.
- **Row overflow menu:** Open · Rename · Duplicate · Version History · Export Diagram… · Archive. A **Show archived** filter reveals archived diagrams with Un-archive.
- **History popover** (existing `btn-version-history`): MCard lineage, version labels, preview, compare with current, and restore.
- **Export dialogs** state the source (saved or unsaved), format, style catalog, and scope/counts before writing.

## Data & Event Contract

- **Namespaces.** Seeded examples keep `zx:examples:<id>`. User diagrams use `zx:diagrams:<uuid>`; `Handle.create` accepts any non-empty string, which has been verified. Diagram metadata lives in `zx:meta:diagrams:<uuid>` (see below).
- **One predicate.** A single exported `isDiagramHandle(handle)` replaces all seven scattered `startsWith('zx:examples:')` checks. Manifest seeding keeps its stricter examples-only rule on purpose.
- **Handle = document id from creation.** A draft is an uncommitted handle. Nothing is remapped at first save.
- **Metadata is itself an MCard.** Title, `archived`, `createdAt`, `source` (`user` / `duplicate` / `legacy-import`), and provenance (`forkedFrom: handle@hash`, `legacyId`) are a structured payload under `zx:meta:diagrams:<uuid>`. Renames and archives get versioned lineage for free and travel in the collection export as ordinary handles, with no custom SQLite table. The IndexedDB corpus index stores the title as a rebuildable cache. Seeded examples keep manifest titles.
- **Snapshot format v2.** `validateSnapshot` accepts both diagram namespaces and reads v1 snapshots through an identity migration. **Decouple the IndexedDB schema version from `CORPUS_SNAPSHOT_VERSION`:** define `CORPUS_INDEXEDDB_SCHEMA_VERSION = 1` for `indexedDB.open()`, while `CORPUS_SNAPSHOT_VERSION = 2` governs snapshot payload validation. Format bumps no longer trigger blockable IDB upgrades or push the app into `recovery-required`.
- **Explicit saves only.** Buffer edits mark a document dirty. A successful save appends the superseded head to `handle_history`, advances the head, and updates projections. A failed gate changes nothing.
- **Durability signal & events.** `tikzit/document:change` means *committed in memory*. A new `tikzit/document:persisted` (declared in `src/services/events.ts`) fires only after the IndexedDB flush succeeds. The UI shows *saved* only after `persisted`; otherwise it shows *saved in this session only* with Retry.
- **Multi-tab writer protection (D10).** Stale-snapshot rejection sets persistence to `'stale'` (added to `CorpusPersistenceState` and `CorpusViewState.persistence`), blocking further commits and rendering an actionable reload banner.
- **Parser performance caching.** Because MCards are content-addressed and immutable, `CorpusExplorerService` caches parsed node and edge counts keyed by card hash (`parseCache: Map<string, { nodeCount: number; edgeCount: number }>`), avoiding repeated TikZ parsing on corpus listing updates.
- **Empty diagrams are persistable (confirmed).** The gate rejects unparseable source but no longer requires nodes or edges.
- **Restore = re-register.** `putWithHandle(historicalCard, handle)` adds one history row and no new card, giving true A→B→A lineage. Re-committing the payload would mint a different hash (A→B→A′) and is rejected as the semantics.
- **Lineage API.** Kernel `handleHistory()` returns superseded heads in order and appends the current head only if it is absent, so after a revert its last element is not the head. Consumers use `documentHistory(handle) → { head, rows: [{ hash, changedAt, position }] }`, joined from `handle_history`. Timeline order is position, never `card.sequence`.
- **Collection export** includes every registered diagram handle and its metadata handle, each head, the full lineage closure, and history rows with real `changed_at` values. Excluded: CLM `executionLog` and `knowledge` pillars, plus orphan cards, which are counted and disclosed. Every card is re-hashed, every handle resolves to its exported head, and the round-trip rewrites nothing.
- **Text exports are verbatim.** `.tikz` and `.tex` use the card payload or buffer bytes, never AST re-emission (which drops comments and formatting).


## Proposed Sequence

| Sprint | Title | Primary outcome | Depends on |
|---|---|---|---|
| 16 | [Diagram Creation & Unified MCard Lifecycle](../../corpus/16-diagram-creation-and-mcard-lifecycle/SPRINT-16-DIAGRAM-CREATION-AND-MCARD-LIFECYCLE.md) | Hardening of Sprint 15 defects; one handle predicate; snapshot v2; create + explicit save of `zx:diagrams:` handles with metadata cards | — |
| 16B | [Diagram Library Management & Session Durability](../../corpus/16b-diagram-library-and-session-durability/SPRINT-16B-DIAGRAM-LIBRARY-AND-SESSION-DURABILITY.md) | Rename, duplicate, archive; dirty-buffer recovery across reload; legacy `DocumentStore` import | 16 |
| 17 | [MCard Version History & Restore](../../corpus/17-mcard-version-history-and-restore/SPRINT-17-MCARD-VERSION-HISTORY-AND-RESTORE.md) | History popover on real lineage; labels, preview, compare; restore by re-registration | 16 |
| 18 | [Individual Diagram Export](../../preview/18-individual-diagram-export/SPRINT-18-INDIVIDUAL-DIAGRAM-EXPORT.md) | Verbatim/rendered export of saved or unsaved diagram from row or active doc | 16 |
| 19 | [Complete MCard Diagram Collection Export](../../corpus/19-complete-mcard-collection-export/SPRINT-19-COMPLETE-MCARD-COLLECTION-EXPORT.md) | `.db` with all diagram + metadata handles and lineage, pinned mcard-studio round-trip | 16, 16B (metadata), 17 (restore semantics) |

16B, 17, and 18 can proceed in parallel after 16. Each specification is a proposal; do not treat its checkboxes as evidence.

## Decision Record

| # | Decision | Status | Resolution |
|---|---|---|---|
| D1 | Empty diagrams | **Confirmed** (product owner, 2026-09-28) | Syntactically valid empty diagrams commit as real heads |
| D2 | Save cadence | **Confirmed** (product owner, 2026-09-28) | Explicit saves only. No autosave of MCards; unsaved buffers are protected by session recovery (D8), not by minting versions |
| D3 | Orphan cards in collection export | **Confirmed** (product owner, 2026-09-28) | Exclude them; the dialog discloses the count ("N unrelated cards not included") |
| D4 | Dirty-buffer export default | **Confirmed** (product owner, 2026-09-28) | Export current edits, marked *Unsaved edits*; *Export saved version* is one click away. Same for non-active dirty rows |
| D5 | Legacy `DocumentStore` documents | **Confirmed** (product owner, 2026-09-28) | One-time idempotent import (16B): latest content → new `zx:diagrams:` head with `source: legacy-import`, `legacyId`; legacy revisions stay readable through the legacy History path; `localStorage` data is never deleted |
| D6 | Diagram retirement | **Confirmed** (product owner, 2026-09-28) | Archive flag in the metadata card (versioned, reversible). **No hard delete**, because it would orphan reachable lineage |
| D7 | Per-diagram styles | **Confirmed** (product owner, 2026-09-28) | This series exports with the workspace catalog and names it (`styleFileName`) in the dialog. Follow-up candidate: style catalogs as `zx:styles:<name>` MCards referenced from diagram metadata |
| D8 | Session persistence | **Confirmed** (product owner, 2026-09-28) | Persist open handles, active id, and dirty buffers to the already-declared `tikzit:workspace-state` key; offer *Recovered unsaved edits* on reload; warn on `beforeunload`. Closing the last tab opens a fresh draft instead of refusing |
| D9 | Title uniqueness | **Confirmed** (product owner, 2026-09-28) | Titles are labels, not identity. Default is `Untitled diagram N`; the Explorer disambiguates duplicate titles with the creation date; export filenames get a short hash suffix on collision |
| D10 | Multi-tab writers | **Confirmed** (product owner, 2026-09-28) | Stale-snapshot rejection sets persistence to `stale`, blocks further commits, and shows *Another tab changed your diagrams — Reload*. BroadcastChannel notification is optional polish |

## Cross-Sprint Quality Gates

- The [`docs/sprints/README.md`](../../README.md) Contracts A (Dockview preservation) and B (selector stability) bind this series. New selectors are listed in each sprint.
- The 12 seeded examples stay intact and `npm run verify:corpus` passes in every sprint.
- Race and failure matrix: parse failure, gate bail, save during flush, duplicate/no-op content, missing/corrupt cards, unavailable/blocked IndexedDB, stale writer, picker cancel versus write failure, partial export.
- `showSaveFilePicker` is Chromium-only: picker-path ACs run in the Chromium project; Blob-fallback ACs run in Chromium, Firefox, and WebKit.
- Typecheck, production build, full unit and E2E suites pass. Export sprints also pass the mcard-studio importer-integrity suite at a **pinned revision**.
- Graduation follows the Sprint 15 template (§1 Summary → §7 Out of Scope, with verification commands).

## Risks

| Risk | Mitigation |
|---|---|
| Snapshot v2 downgrade: older builds cannot read v2 | Explicit `Unsupported corpus snapshot version` message plus temporary-session option (already shipped); v2 reads v1 |
| Metadata cards grow the MCard pillar per rename | Small structured payloads; rename is rare; bounded by user action |
| Kernel `handleHistory` semantics change | `documentHistory` wrapper is the single consumer; unit tests pin A→B→A behavior |
| mcard-studio importer drift | Pinned revision plus fixture corpus in the round-trip gate |

## References

- Explorer and workbench: `src/components/workbench/CorpusExplorerDrawer.tsx`, `WorkbenchCommandBar.tsx`, `MacWindowChrome.tsx`
- Lifecycle and persistence: `src/services/clm/corpusExplorerService.ts`, `documentCommitService.ts`, `corpusPersistence.ts`, `corpusExportService.ts`, `src/services/createWorkbenchRuntime.ts`, `src/services/workspace/WorkspaceManager.ts`
- Version UI and legacy revisions: `src/components/workbench/panels/VersionPopover.tsx`, `src/services/storage/DocumentStore.ts`

- Export pipeline: `src/components/workbench/panels/PreviewPanel.tsx`, `src/services/export/ImageExporter.ts`, `src/services/export/PdfExporter.ts`
- CLM kernel: `clm-kernel` and `clm-kernel/layer0` npm packages (`MCardCollection`, `putWithHandle`, `history`, `SqlJsBackend`, `registerHandle`, `handleHistory`; upstream monorepo sources at `clm/kernel/clm_js_core/src/collection.ts` and `src/layer0/storage/sqljs.ts`)


