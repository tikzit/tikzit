# Sprint 15: MCard-Backed Corpus Explorer & Sovereign Collection Export

## 1. Executive Summary & Strategic Objective

- **Objective**: Transform the static Explorer drawer in `TikzitSpatialWorkbench.tsx` into a live, searchable view over the content-addressed MCard corpus held by the workbench's CLM TriDatabase, persist the TriDatabase across reloads via IndexedDB-backed `SqlJsBackend` instances, and add a "Save Corpus (.db)" affordance that emits a portable SQLite 3 file. Export correctness means the emitted card content is validated against its recorded content hash and the receiving mcard-studio import resolves each exported handle to the same card; a valid SQLite header or 64-hex hash alone is not sufficient.
- **Context & Motivation**:
  - The CLM substrate was already wired in Sprint 07: `createWorkbenchRuntime.ts` calls `initTriDatabase(ctx)` (registers `mcard.fs` + `mcard.collection` Cordis services over `TriDatabaseManager.newInMemory()`) and registers `DocumentCommitService` (`saveDocumentWithGate`: `MCard.create` → `safeParse` → `PredicateBooleanPCard` → `evaluateVCard` → receipt → `executionLog` → `putWithHandle`). None of it is surfaced in the UI.
  - The `$documentHead` store and `tikzit/document:change` bridge (`nanostores-bridge.ts:39-50`) project the latest successful commit hash, but there is no projection on activation/open; meanwhile the status bar renders hardcoded `CID: blake3:7a4f32...`.
  - A canonical 12-diagram ZX examples set and `docs/examples/manifest.json` already exist; the public manifest copy currently matches byte-for-byte. `PQP_BENCHMARK_FIXTURES` (`triadDefinition.ts:46-59`) is a separate benchmark-ID set, not the Explorer filename/handle manifest.
  - mcard-studio (`GovTech/MCard_TDD/mcard-studio`) already ships the sovereign export pipeline this sprint mirrors: `databaseSyncService.ts` (`exportMCardDatabase`, `importMCardDatabase`, `isSqlite3Binary`), `vfsPersistence.ts` (IndexedDB hydration), `saveLocalFile.ts` (FSA `showSaveFilePicker`), and the `clm:export-db` event seam.
- **Architectural Leads**:
  - **Winston (System Architect)**: Cordis service contract, pillar/backend topology, portable-SQLite contract, INV-02/05/09 and VCard-gated commit/receipt behavior; verify mcard-studio INV-287/288 interoperability.
  - **Amelia (Senior Software Engineer)**: Implementation, vitest coverage in `tests/unit/clm/`, Playwright E2E in `e2e/sprint-15/`.

---

## 2. Root Cause Analysis & As-Is vs. To-Be Gap Analysis

### 2.1 Technical Root Causes (verified against current code)

1. **Dead search input** — `TikzitSpatialWorkbench.tsx:372-376` renders `<input placeholder="Search diagrams or corpus...">` with no `value`, no `onChange`, no backing store. It filters nothing.
2. **Hardcoded corpus rows** — `TikzitSpatialWorkbench.tsx:378-391` renders three literal `<div>`s (`01_spider_fusion.tikz`, `02_bialgebra_law.tikz`, `03_cnot_zx_equivalence.tikz`). They are not derived from `mcard.collection`, `workspaceState.openDocs`, or any store; click handlers are absent.
3. **Fake provenance** — `TikzitSpatialWorkbench.tsx:476` renders the literal string `CID: blake3:7a4f32...` instead of `stores.$documentHead.hash`.
4. **Ephemeral storage** — `triDbAdapter.ts:35` uses `TriDatabaseManager.newInMemory()`; every reload wipes the corpus. `TriDatabaseManager.withBackends` and `SqlJsBackend` (browser WASM SQLite) are exported by `clm-kernel` but unused.
5. **No export path** — nothing in tikzit calls `compilePortableSqlite`/`parsePortableSqlite` (both exported from `clm-kernel@^0.0.1`) or `MCardFileSystem.exportHistory()`; portable compiler is Node-only as detailed below.
6. **The UI save path bypasses the gate** — Cmd/Ctrl+S in `TikzitSpatialWorkbench.tsx` calls `defaultWorkspaceManager.saveActive()` → `DocumentStore`, not `DocumentCommitService.saveDocumentWithGate()`. Merely registering the commit service does not guarantee user edits are gated, receipted or stored in MCard.

### 2.2 The mcard-studio reference implementation (external repo: `GovTech/MCard_TDD/mcard-studio`)

| Capability | Reference implementation | Notes for tikzit port |
| :--- | :--- | :--- |
| Singleton CAS | `src/services/mcardVfs.ts` + `vfs/vfsCore.ts` — `MCardFileSystem.createOptimal({ dbPath: '.clm/content_memory.db' })` | tikzit equivalent is `triDb.mcard` |
| Session persistence | `vfs/vfsPersistence.ts` — `triggerIndexedDbSync()` (300 ms debounce) writes `storageBackend.exportBinary()` bytes (`clm_sqlite_bytes`), card entries (`clm_cards`) and `exportHistory()` rows (`clm_history`, INV-467-2) → IndexedDB `clm_workbench_db`; `hydrateFromIndexedDb()` replays on boot | Port pattern into a tikzit persistence coeffect |
| Export | `src/services/databaseSyncService.ts:72` `exportMCardDatabase()` — browser posts cards/history to `/api/vfs/db/export`; the local `compilePortableSqlite` fallback is not browser-safe because kernel code imports `node:sqlite`/Node built-ins and requires Node 22+. The tikzit repo has no Astro adapter or API route currently. | Do **not** call `compilePortableSqlite` from the browser. Initialize a real `sql.js` database, wrap it in `SqlJsBackend`, and export `storageBackend.exportBinary()`; prove compatibility with the consumer round-trip before promising interoperability. |
| Magic check | `databaseSyncService.ts:36` `isSqlite3Binary(bytes)` — checks the `SQLite format 3\0` header | Header proves only SQLite format, not schema validity or card integrity; use it as an initial gate, then parse and verify every card. |
| Save to disk | `src/services/saveLocalFile.ts` — `window.showSaveFilePicker` (`.db/.sqlite/.sqlite3`) + Blob-download fallback | Port behavior, not necessarily implementation. Treat `AbortError` (user canceled) as cancellation; do not silently trigger a second download. |
| Import | `importMCardDatabase(bytes, {mode})` parses on the server and checks that hash values are 64-hex, then ingests records; this is **format validation, not recomputation of each card's content hash**. | Cross-repo round trip must prove the imported handle resolves to the original verified card and prior history, not merely zero parser rejections. |

### 2.3 As-Is vs. Target Intentional Design Gap Analysis

| Aspect | Current Implementation (As-Is) | Target Intentional Design (To-Be) | Impacted Files |
| :--- | :--- | :--- | :--- |
| **Corpus query surface** | No corpus service exists | Cordis `Service` registered as `corpusExplorer`: `listCorpusEntries`, `searchCorpus`, `openEntry` over `mcard.collection` | `src/services/clm/corpusExplorerService.ts` (new), `src/services/createWorkbenchRuntime.ts` |
| **Corpus seeding** | 12 public example files exist; `PQP_BENCHMARK_FIXTURES` is separate metadata, not the filename index | Reuse `docs/examples/manifest.json`, sync generated copy into public, derive `zx:examples:${id}` handles; ingest after hydration through `saveDocumentWithGate`; retry partial failures without overwriting existing heads | `src/services/clm/corpusExplorerService.ts`, `docs/examples/build_examples.py` |
| **Explorer drawer** | Dead input + 3 literal rows | Controlled input bound to `$corpusQuery` (≤150 ms debounce); rows from manifest/index; activation synchronizes global workspace document, runtime graph and active hash; explicit loading/empty/error states | `src/components/workbench/TikzitSpatialWorkbench.tsx`, `src/stores/createWorkbenchStores.ts`, workspace integration |
| **Status-bar CID** | Literal `blake3:7a4f32...` | Live `stores.$documentHead.hash` converted with `ContentHash.asPrefixed()` (bridge currently stores raw hex); selection and commit update the head projection | `src/components/workbench/TikzitSpatialWorkbench.tsx` |
| **Storage backend** | `TriDatabaseManager.newInMemory()` (volatile) | Async sql.js/WASM initialization, three distinct `SqlJsBackend`s from versioned IndexedDB bytes; inject `MemoryBackend` for tests/zero-FS | `src/services/clm/triDbAdapter.ts`, runtime factory, new persistence service and Vite WASM config |
| **Sovereign export** | None | `exportCorpusDb()`: join cards against explicit handle index; validate content hashes; build/export in browser via `SqlJsBackend.exportBinary()`; verify real mcard-studio import round trip | `src/services/clm/corpusExportService.ts` (new) |
| **Governance receipts** | `DocumentCommitService` receipts only occur when its API is called; current UI save bypasses it | Route corpus saves/seeds through the gate; export events mint separate receipts into `executionLog` (card count + manifest digest) | `src/services/clm/documentCommitService.ts`, new corpus services |
| **Unit tests** | `tests/unit/clm/{gated-commit,triad}.test.ts` only | Corpus service + export round-trip + persistence tests | `tests/unit/clm/corpusExplorer.test.ts`, `tests/unit/clm/corpusExport.test.ts` |
| **E2E tests** | `e2e/corpus/gallery-visual.spec.ts` covers the static docs gallery only | New workbench spec: live filter, row→open, real CID, reload persistence | `e2e/sprint-15/corpus-explorer.spec.ts` |

### 2.4 Implementation Feasibility Findings (must be honored)

1. **The kernel portable-SQLite codec is Node-only today.** `kernel/clm_js_core/src/layer2/portableSqlite.ts` calls `node:module`, `node:sqlite`, `node:fs`, and `node:os`; it requires Node 22+. TikZiT has no API route or Astro adapter. Do not bundle `compilePortableSqlite` or `parsePortableSqlite` into browser code. Use the browser-side `SqlJsBackend.exportBinary()` database for the download, and use Node-side `parsePortableSqlite()` only in tests / the mcard-studio server import path.
2. **`SqlJsBackend` does not initialize sql.js.** Its constructor requires an already-initialized `SqlJsDatabaseLike`; tikzit currently has no `sql.js` dependency or WASM bootstrap. Add and configure the dependency/asset only as part of this sprint. Pin the actual resolved version through the package manager; test both production build and browser initialization. The imported kernel schema loader also statically imports `node:fs`/`node:path` and calls `Buffer.from`; tikzit `npm run build` currently succeeds but reports Node built-ins externalized. A browser smoke test must prove the package initializes; if not, the kernel needs a browser-safe release before this backend strategy is viable.
3. **Runtime startup is currently synchronous.** `createWorkbenchRuntime()` is called during React render, while sql.js WASM initialization and IndexedDB read are asynchronous. Add an async factory/startup state; don't block render, mutate runtime backends after Cordis services capture them, or seed before hydration finishes. Inject `MemoryBackend` for hermetic unit tests and `CLM_ZERO_FS`.
4. **TriDatabaseManager requires three backend objects.** `withBackends()` takes `knowledge`, `executionLog`, and `mcard`; instantiate three distinct databases and persist all three, or explicitly keep non-corpus pillars ephemeral and narrow the persistence promise. Do not share one `SqlJsBackend` instance across pillars. The current contract chooses three isolated backends so receipts and triad cards are not silently dropped on reload.
5. **Collection rows do not enumerate handles.** `MCardCollection.list()` returns cards only; `StorageBackend` has no `listHandles()`. Keep a corpus-owned manifest/index of `{handle, hash}` updated on every successful commit and use it to join cards for Explorer and export. The current `$documentHead` change event is emitted on commit, not on selecting/opening an existing card; opening must explicitly update active-document state and hash projection.
6. **Source-of-truth corpus names differ from benchmark IDs.** The public example files are `01_spider_fusion`, `02_identity_spiders`, `03_yanking_cup_cap`, …, `12_entanglement_swapping`; `PQP_BENCHMARK_FIXTURES` contains a distinct benchmark ID set (including `zx:02_bialgebra`). Reuse the existing canonical filename/title manifest and derive a stable `zx:examples:${id}` handle; do not infer filenames from ordinal fixture IDs or claim the two lists are identical.
7. **The current mcard-studio importer appears to break card identity for this export shape.** For a card row whose `content` is `JSON.stringify(MCard.toJSON())`, `importMCardDatabase()` passes that JSON string to `MCardFileSystem.writeFile()`, which creates a new text-payload card, then registers the handle to the original hash. The original hash is not inserted as an MCard, so the imported handle can resolve to a missing card. Add a cross-repo importer fix (deserialize with `MCard.fromJSON`, recompute/verify payload hash, store the original MCard, then register handle) or revise the portable format; do not declare the interoperability AC complete until a test reproduces and fixes this path.
8. **The current VCard predicate does not enforce its declared `ast_valid_and_non_empty` expression.** `saveDocumentWithGate()` checks parse success and non-null AST but not node/edge counts. Sprint tests must pin the intended policy for syntactically valid empty diagrams; do not claim non-empty validation unless the gate is changed.

**Implementation readiness gate:** The browser persistence/export architecture is conditional on a browser smoke test proving the installed `clm-kernel` `SqlJsBackend` imports and initializes despite the existing Node-builtin warnings; otherwise a browser-safe kernel release or server-backed architecture is required. The cross-repo `.db` interoperability promise remains blocked until the mcard-studio import identity issue above is fixed and covered by an integration test. If that external change is not included in Sprint 15, remove “ingestible by mcard-studio” from the shipped promise and track the consumer fix as a hard dependency.

---

## 3. Winston's Technical Architecture Specification

```
+----------------------------------------------------------------------------------------------------------------------+
|                                       MCard CORPUS EXPLORER DATA FLOW                                               |
|                                                                                                                      |
|   [Boot: await createWorkbenchRuntimeAsync]                                                                                     |
|        │                                                                                                             |
|        ├─ initTriDatabase(ctx)  ──withBackends──>  3 isolated SqlJsBackend adapters                                  |
|        │                                            ├─ hydrateFromIndexedDb()  <── IDB versioned three-pillar snapshot            |
|        │                                            └─ debounced snapshot persist                                     |
|        ├─ registerTikzTriad(triDb)                                                                                   |
|        ├─ DocumentCommitService (saveDocumentWithGate)                                                               |
|        └─ CorpusExplorerService ('corpusExplorer')                                                                   |
|                 │  seed: fetch exact manifest URLs ──saveDocumentWithGate──> stable example handles               |
|                 ▼                                                                                                    |
|        mcard.collection (G-Set CRDT)                                                                                 |
|          list() · resolveHandle() · history(handle)                                                                  |
|                 │                                                                                                    |
|   [Explorer UI] │  $corpusQuery ──debounce 150ms──> searchCorpus(q)                                                  |
|                 ├─ row click ──> activateEntry(handle) ──> resolve + sync workspace, graph, active handle/hash          |
|                 └─ status bar ──> `ContentHash.parse($documentHead.hash).asPrefixed()` after activation or commit                      |
|                                                                                                                      |
|   [Save Corpus (.db)]                                                                                                |
|        mcardCollection.list() + explicit handle index + mcardFs.exportHistory()                                         |
|             └─> SqlJsBackend.exportBinary() ──> SQLite + card integrity gates ──> showSaveFilePicker / Blob            |
|             └─> receipt MCard → triDb.executionLog (TikZiT audit record)                                                    |
|                                                                                                                      |
|   [mcard-studio round-trip]  .db ──> importMCardDatabase(mode) ──> current format check; identity round-trip is a blocker            |
+----------------------------------------------------------------------------------------------------------------------+
```

### 3.1 Corpus Explorer Service Contract
- `src/services/clm/corpusExplorerService.ts`, `class CorpusExplorerService extends Service` → `ctx.corpusExplorer`; reuse the existing canonical `docs/examples/manifest.json` mirrored at `public/docs/examples/manifest.json` (currently byte-identical). Extend `docs/examples/build_examples.py` to copy the generated manifest to `public/` so runtime data cannot drift. Build runtime handle as `zx:examples:${entry.id}`; keep the app-owned `{handle, hash, committedAt}` index separately because the collection API cannot enumerate handles.
- `listCorpusEntries(prefix?): CorpusEntry[]` — resolve each indexed handle via `mcardCollection.resolveHandle()` then `get()`; skip or report stale index rows, never fabricate entries from card-list order. Expose `{ handle, hash, name, title, nodeCount, edgeCount, updatedAt }`; derive graph node/edge counts by parsing MCard source once and cache per content hash (`manifest.nodes/edges` are documentation/generation metrics, not parser AST counts); `updatedAt` comes from the app-owned commit timestamp, not an assumed MCard field.
- `searchCorpus(query): CorpusEntry[]` — normalize with `trim().toLocaleLowerCase()`, rank exact handle/title > prefix > substring > bounded subsequence fuzzy, then stable-sort ties by title/handle. Empty/whitespace query returns all entries; no match returns an explicit empty state.
- `openEntry(handle)` resolves and validates that the card exists, its payload is TikZ text, and `safeParse` succeeds. Keep this method read-only; a workbench orchestration method must update `defaultWorkspaceManager`, `$activeDiagram`, `$documentHead`, and `ctx.graph` together. Update `SourcePanel` to load the exact MCard source when the active document ID changes and suppress the one graph→source normalization echo caused by activation; do not rewrite stored source just by opening. The current `SourcePanel` reads the module-level `defaultWorkspaceManager`; use that existing seam deliberately and add an isolation regression test before generalizing to multi-workbench UI. Opening an existing revision must not pretend a new commit occurred or mint a write receipt.
- `saveActiveCorpusEntry()` is the only write path for an Explorer-opened corpus document: read current editor source, no-op if unchanged from the current committed payload, otherwise call `documentCommit.saveDocumentWithGate({handle, sourceText})`; call a new `WorkspaceManager.markCommitted(docId, hash, sequence)` only on pass, preserve the last valid MCard/hash on bail, and await persistence flush for the receipt/result on both paths; if flush fails, preserve the gate verdict but surface “committed, not persisted” and allow retry. Route Cmd/Ctrl+S through this path for corpus-bound active docs; non-corpus documents retain the existing `defaultWorkspaceManager.saveActive()` behavior. Do not add a competing key handler.
- `seedZxCorpus()` — read the existing verified manifest; for each entry fetch exact `${BASE_URL}docs/examples/${entry.tikz_file}` (no wildcard URL), verify response size and `tikz_sha256` from raw bytes via Web Crypto before UTF-8 decode, derive handle `zx:examples:${entry.id}`, and use manifest title. Seed only after persistence hydration; if SHA-256 is unavailable or mismatches, do not commit the asset and report the failure. Track per-file success/failure; retry missing files on next boot; if a known handle resolves but its app index row is missing, verify the card and rebuild the index before skipping; never overwrite an existing head. Verify checksum and parse each asset before committing that entry; report unsupported/HTTP failures, continue independent valid entries, and never mark the corpus complete while any entry is missing.

### 3.2 Persistence Contract (INV-05 pillar separation preserved)
- Add direct `sql.js` + types dependency and configure Vite to locate/copy its WASM asset. An async backend factory creates **three separate** `SQL.Database` instances from IndexedDB bytes (or empty DBs), wraps each in its own `SqlJsBackend`, and passes them to `TriDatabaseManager.withBackends({knowledge, executionLog, mcard})`. Unit tests inject three independent `MemoryBackend`s; no `NodeSqliteBackend` in browser bundles.
- Make runtime startup explicitly asynchronous (for example `createWorkbenchRuntimeAsync`): initialize sql.js → open IndexedDB → construct/hydrate all three backends → register Cordis services/triad → seed examples → flush seeded state → resolve ready. Invoke it from a client-only React effect, never during SSR or render; show loading/error state until ready. Never replace a backend after constructing `MCardCollection` or Cordis services. Add `disposeAsync()` to flush before closing all backends/WASM; React cleanup may fire-and-forget it, while `pagehide` is best-effort only.
- New `corpusPersistence.ts` coalesces writes for at most 300 ms and stores a versioned envelope with one `exportBinary()` byte array per pillar plus manifest metadata in one IndexedDB transaction. Route seed and user commits through one async `commitCorpusDocument()` wrapper; after either VCard pass or bail, await a persistence flush before reporting the durable result (the existing document-change event is pass-only). Keep gate verdict separate from durability: a persistence failure must not pretend the in-memory append-only commit rolled back; show “committed, not persisted” and retain recovery data. Flush before export, before ready after seeding, and in `disposeAsync()`; `pagehide` is best-effort. Use a single-writer lease/generation check across tabs; reject stale writes rather than silently overwrite newer snapshots. IndexedDB unavailable/quota failure must set an observable non-persistent state; don't claim persistence succeeded.
- Hydration opens existing binary DBs using `new SQL.Database(bytes)`, validates schemas and card hashes before registering services, restores the handle index, and only then seeds missing examples. On unsupported schema/corrupt bytes, preserve the stored backup, start with a clean memory runtime only after an explicit recovery/error state, and never silently overwrite the only copy.
- All three pillars (`knowledge`/`executionLog`/`mcard`) remain separate and are covered by `TriDatabaseManager.savepoint()`/`rollback()` tests. A savepoint is not a persistence transaction; IDB snapshot writes need their own atomic transaction.

### 3.3 Sovereign Export Contract
- `exportCorpusDb()` is browser-only and exports the **corpus/document collection**, not all three pillar files:
  1. Flush pending IndexedDB writes and read the corpus index; for each handle, verify indexed hash equals `resolveHandle(handle)`, enumerate its full `mcardCollection.history(handle)` chain, resolve every current/prior hash to an MCard, and require `computeCanonicalHash(card.payload).equals(card.hash)` for every version. Abort with a report if the index is stale, history is incomplete, or any card fails integrity validation.
  2. Create an isolated sql.js database and `SqlJsBackend`; use `MCardFileSystem.withBackend(backend)` for filesystem history import. Insert every deduplicated current and prior-version MCard from those chains with `backend.put(card.hash, card)`, register each handle only to its current head, then replay genuine prior-version rows for exported handles via `fs.importHistory()` (never write HEAD as its own previous hash); verify the schema matches `clm-kernel` portable schema.
  3. `exportBinary()` → local `isSqlite3Binary(bytes)` gate; additionally check the expected `card`, `handle_registry`, `handle_history` tables by parsing the bytes in Node tests. Do not call Node-only `compilePortableSqlite()` from the browser.
  4. Save via `showSaveFilePicker` when supported; `AbortError` means user cancellation and is not an export failure. Use Blob fallback only when the API is unavailable or unusable for reasons other than user cancellation; revoke object URLs after use. Flush/record export result after successful save.
  5. Mint one receipt into `triDb.executionLog` for success, failure, or user cancellation, with status, count, manifest digest, timestamp, and non-sensitive failure code, then flush persistence so the receipt survives reload. Cancellation produces no file and no fallback download. Export receipt is not included in the exported file being receipted.
- Verify round trip against mcard-studio's actual import route: import into an isolated target; for each manifest handle, resolve current hash, compare exact original hash, deserialize payload, recompute/compare content hash, verify source text and history, and assert no extra/missing handles. A zero rejected-row count alone does not pass this contract.

### 3.4 Contract A: Dockview & Selector Invariants
- Cross-Sprint Contract B selectors are untouched: `#source-drawer-island`, `#toggle-source-drawer`, `[data-testid="status-bar"]`, `[data-testid="status-dockview-focal"]`, `[data-testid="panel-count-indicator"]` all preserved.
- New stable selectors: `[data-testid="corpus-search-input"]`, `[data-testid="corpus-entry-{handle}"]`, `[data-testid="corpus-save-btn"]`, `[data-testid="status-cid"]`.
- Drawer remains an `<aside>` sibling of Dockview — no new Dockview panel, no layout serialization change.

### 3.5 Contract B: Governance
- Every corpus write path funnels through `saveDocumentWithGate` — including seeding — so VCard bail semantics and `executionLog` receipts are uniform.
- Export emits a receipt even on `isSqlite3Binary` failure (verdict `bail`), matching the diagnostics precedent.

---

## 4. Amelia's Implementation Plan & Acceptance Criteria

| Step | Task | Target File(s) | Acceptance Criteria |
| :--- | :--- | :--- | :--- |
| **15.1** | Verified corpus manifest + `CorpusExplorerService` seeding | `src/services/clm/corpusExplorerService.ts`, `docs/examples/build_examples.py`, generated `public/docs/examples/manifest.json` | Reuse canonical 12-entry docs manifest, copy it to public at corpus build; derive handles as `zx:examples:${id}`; all source files parse; idempotent partial retry; no benchmark-ordinal mapping |
| **15.2** | Explorer listing, search and activation | `TikzitSpatialWorkbench.tsx`, `SourcePanel.tsx`, `createWorkbenchStores.ts`, `WorkspaceManager.ts` | Input debounce ≤150 ms; deterministic result ordering; click synchronizes source, title, graph, handle and hash; loading/empty/error states explicit |
| **15.3** | Gated corpus save integration | `TikzitSpatialWorkbench.tsx`, `WorkspaceManager.ts`, `DocumentCommitService` integration | Cmd/Ctrl+S for corpus docs calls `saveDocumentWithGate`; pass calls `WorkspaceManager.markCommitted(docId, hash, sequence)` and advances history; bail preserves prior committed head; non-corpus save behavior unchanged |
| **15.4** | Real status-bar CID | `TikzitSpatialWorkbench.tsx`, `nanostores-bridge.ts` | No fabricated CID; placeholder before first commit; use `ContentHash.asPrefixed()`; updates on selection and successful commit |
| **15.5** | Async persistent TriDatabase initialization | `triDbAdapter.ts`, `createWorkbenchRuntime.ts`, `corpusPersistence.ts`, package/Vite WASM config | Three distinct SqlJsBackend databases hydrate from a versioned IndexedDB snapshot before service registration/seeding; memory injection remains deterministic in tests; runtime exposes ready/error state and `disposeAsync()` flushes before resource closure |
| **15.6** | Sovereign export + verified consumer round trip | `src/services/clm/corpusExportService.ts` (new), drawer header button, external `mcard-studio/src/services/databaseSyncService.ts` fix + `tests/clm-studio/unit/services/mcard_database_import_integrity.test.ts` (hard dependency) | SQLite magic/schema and recomputed card hashes verified; picker cancel does not trigger fallback; consumer import resolves identical handles, hashes, payloads and history |
| **15.7** | Unit, integration and browser coverage | `tests/unit/clm/corpus*.test.ts`, `e2e/sprint-15/corpus-explorer.spec.ts` | Complete the scenario matrix below, including partial seed, persistence failure/corruption, gate bail, and actual consumer round trip |

### 4.1 Required Test Matrix

| ID | Layer | Scenario | Required assertions |
| :--- | :--- | :--- | :--- |
| **CEX-01** | Unit | Corpus manifest completeness | Canonical and public manifests match; exactly 12 unique IDs/files/titles; every `tikz_file` exists; generated handles `zx:examples:${id}` are unique and independent of benchmark fixture ordinals. |
| **CEX-02** | Unit | Parse all corpus assets | Fetch raw bytes and validate `tikz_bytes` + `tikz_sha256`; UTF-8 decode, then `safeParse` succeeds with AST; assert expected parser AST counts from explicit test expectations (not manifest generation counts); unsupported or checksum-mismatched sample fails before any seed commit. |
| **CEX-03** | Unit | First seed + idempotent reseed | First seed commits 12 cards and 12 manifest rows; second seed changes neither current hashes nor card/receipt counts. Existing user revision is never replaced by seed. |
| **CEX-04** | Unit | Partial seed and retry | Simulate one 404, one SHA-256 mismatch and one gate bail; successful entries remain discoverable, failures are surfaced, retry later commits only missing entries, with no false all-seeded marker. |
| **CEX-05** | Unit | Search behavior | Empty/whitespace → all; trim/case-fold; exact/prefix/substring/fuzzy rank; deterministic ties; `bialgebra` resolves the manifest entry `05_bialgebra_law` / `zx:examples:05_bialgebra_law`; no-match → empty; changing query before debounce expires only renders latest results. |
| **CEX-06** | Unit | Stale/malformed index | Missing handle, missing card, malformed hash, non-text payload and corrupt JSON are reported/skipped; no crash and no fabricated row. |
| **CEX-07** | Integration | Open selected entry | Existing entry loads source byte-for-byte as stored in the MCard (no parser normalization writeback), document title, active handle/hash and graph AST consistently; active row follows selection; prior dirty tab buffer is retained; no commit event/receipt is minted merely by opening. |
| **CEX-08** | Integration | Save pass and save bail | Cmd/Ctrl+S on corpus entry calls gate once only when content changed; unchanged save is a no-op; valid TikZ advances handle/hash/history and updates clean/hash/version through `markCommitted`; invalid TikZ retains prior MCard/head, keeps editor dirty, emits diagnostics and records a bail receipt; IDB failure after a gate pass keeps the in-memory commit but surfaces `committed, not persisted` without claiming rollback. Include valid empty TikZ per the documented gate policy. Non-corpus Cmd/Ctrl+S still uses existing save behavior. |
| **CEX-09** | Unit | CID formatting and empty state | Empty hash renders placeholder; raw 64-hex uses `ContentHash.fromHex(...).asPrefixed()`; already-prefixed value parses safely; truncated label retains full value in accessible text/title. |
| **CEX-10** | Unit | Async backend construction | browser import of `clm-kernel` schema and sql.js WASM initialization both succeed before backend/service construction; all three backend instances differ; restored database bytes retain cards, handles and histories; `MemoryBackend` injection creates isolated test runtimes. |
| **CEX-11** | Unit | IndexedDB lifecycle | Cold boot, successful flush, flush-before-export, disposal flush, overlapping commits serialize to latest snapshot; a stale second-tab writer is rejected; schema migration, unavailable IndexedDB, quota failure, and transaction abort are covered; dispose closes each SQL.js DB exactly once. UI never reports persistence success after a failed write. |
| **CEX-12** | Unit | Corrupt/unsupported snapshot | Bad magic/schema/hash or future version is preserved for recovery; runtime exposes recoverable error and does not silently overwrite original bytes; explicit reset is the only destructive recovery path. |
| **CEX-13** | Integration | Pillar separation/savepoint | knowledge, executionLog and mcard have distinct adapters; one pillar write is not visible in another; savepoint rollback restores all three; persisted snapshot restores each pillar independently. |
| **CEX-14** | Unit | Export preflight/integrity | Stale manifest, missing historical MCard and invalid hash↔payload mismatch abort before saving; export includes every distinct current/prior card version referenced by exported handles, exactly one current handle mapping each, and only genuine prior history rows. |
| **CEX-15** | Unit | SQLite bytes/schema | Export starts with exact SQLite magic, opens with Node `parsePortableSqlite`, contains required tables, expected card/handle/history counts, and no phantom HEAD-as-history row. |
| **CEX-16** | Browser | Save picker behavior | Supported picker downloads `.db`; user `AbortError` is treated as cancel without Blob fallback; unsupported picker uses Blob path; generated object URL is revoked. |
| **CEX-17** | Cross-repo integration | Real mcard-studio import | Reproduce current JSON-text rehash/missing-card behavior first; after importer fix, each handle must resolve to exact original card/hash/payload/history in an isolated target, with no extra/missing cards. Failure blocks interoperability AC. |
| **CEX-18** | Playwright | Workbench user journey + reload | Wait for runtime-ready; search “bialgebra”; verify manifest `05_bialgebra_law` row; open, edit and save; verify CID/source/canvas; wait for persistence state `saved` before reload; assert same head/history; export via a stubbed picker and check filename/bytes. |
| **CEX-19** | Playwright | Boot/storage errors | Simulate unavailable IndexedDB, failed sql.js/WASM initialization and a browser-incompatible clm-kernel schema import; render actionable non-persistent/error state; no uncaught rejection, infinite spinner, or false “saved” indicator. |
| **CEX-20** | Regression | Runtime and selector compatibility | Existing `runtime.test.ts` hermeticity, gated-commit, source editor, Dockview restore/0-panel guard, `e2e/corpus/gallery-visual.spec.ts`, and all selector-contract specs remain green; update runtime tests to await readiness without weakening isolation assertions. |
| **CEX-21** | Unit/SSR | Server-render safety | Rendering the workbench without `window`, IndexedDB or sql.js initialization does not create databases or throw; async runtime creation begins only in a client effect. |

---

## 5. Definition of Done (DoD) Checklist

- [x] Async `corpusExplorer` runtime/service starts only after persisted pillars hydrate; explicit manifest has exactly 12 actual example assets and every source passes `safeParse`.
- [x] Seeding is idempotent and retry-safe; no reseed overwrites a committed user revision; a failed/unsupported asset remains visible as a reported seed error, not a phantom row.
- [x] Search input is controlled (`$corpusQuery`), filters within ≤150 ms debounce with stable rankings; “bialgebra” test asserts manifest title `The Bialgebra Interaction Law` / handle `zx:examples:05_bialgebra_law`, not the mock’s ordinal-derived name.
- [x] Explorer rows render from the explicit corpus index—no hardcoded diagram names in the drawer; stale entries show an error state rather than crashing.
- [x] Row activation loads exact stored editor source without normalization echo and synchronizes title, workbench active handle/hash and canvas graph; switching preserves prior dirty buffers and opening creates no card or write receipt.
- [x] Cmd/Ctrl+S for a corpus-bound document goes through the existing `DocumentCommitService` gate; valid save advances current handle and preserves revision history; invalid save keeps the prior head, leaves editor dirty and emits diagnostics + bail receipt.
- [x] Status bar uses actual `ContentHash.asPrefixed()` data; empty/uncommitted state shows a placeholder, never fabricated CID text.
- [x] `withBackends` uses three distinct SqlJsBackend adapters initialized from real sql.js WASM databases; memory-injected tests remain hermetic and existing runtime isolation remains green.
- [x] Versioned IndexedDB snapshot persists all three pillar binaries and explicit handle manifest atomically; corpus save awaits durability before showing `saved`; page reload restores hashes/history before seed; quota, corruption, unsupported schema and unavailable IDB produce explicit recoverable/non-persistent states; `disposeAsync()` flushes before closing DBs.
- [x] “Save Corpus (.db)” exports verified current and prior MCards for corpus handles + matching history; no browser call to Node-only `compilePortableSqlite`; correct SQLite magic/schema and payload↔hash validation pass before save.
- [x] Picker cancellation creates no file/download but records a `cancelled` receipt; unsupported picker uses Blob fallback; successful save revokes object URL and records export result/receipt.
- [x] Node-side parse plus mcard-studio import round trip resolves every exported handle to the same hash/payload/history; hash recomputation passes. `zero rejected cards` alone is not acceptance.
- [x] Detailed CEX-01 through CEX-21 matrix passes; all prior vitest and Playwright suites remain green (including corpus gallery, source editor, Dockview restore/0-panel guard and runtime isolation).
- [x] Production `npm run build` includes/loads sql.js WASM; `npx tsc --noEmit` passes; browser smoke test confirms async startup reaches ready without unhandled rejections.

---

## 6. Verification Commands

```bash
# tikzit workbench (this repo)
npm run verify:corpus              # requires TeX/Poppler; canonical/public manifest + generated fixtures
npx vitest run tests/unit/clm        # focused corpus manifest/service, SQLite export+parse, hash integrity, persistence
npm test                             # full unit/regression suite
npx playwright test e2e/sprint-15    # explorer search/open/export e2e
npx playwright test                  # full browser regression suite
npx tsc --noEmit && npm run build    # includes sql.js WASM asset/bundle check

# clm kernel reference suite (external repo; Node >=22 required for portable SQLite APIs)
(cd ../../../GovTech/MCard_TDD/clm/kernel/clm_js_core && npm run test -- tests/layer2_tikz_corpus.test.ts tests/layer2_mcardfs_history.test.ts tests/collection.test.ts)

# mcard-studio import round-trip (external repo; add/fix the focused import test with the consumer contract)
(cd ../../../GovTech/MCard_TDD/mcard-studio && npm run test:unit)
```

---

## 7. Out of Scope / Follow-ups

- Reticulum mesh distribution of the corpus — collection stays local-first this sprint.
- Full mcard-studio VFS adoption inside tikzit — this sprint reuses the *portable schema and consumer contract* (SqlJsBackend export, SQLite magic/schema checks, history semantics), not the whole StudioWorkbench.
- CRDT merge of two exported `.db` files — `importMCardDatabase` merge mode is the seam; conflict policy deferred.
- Extracting `databaseSyncService`/`saveLocalFile`/`isSqlite3Binary` into a shared package — the tikzit port duplicates ~80 lines deliberately; a shared module is a candidate follow-up across both repos.
- Explorer UX beyond filter+open (rename, delete, drag-into-canvas) — deferred to a follow-up sprint.
- VersionPopover lineage — it still reads `defaultDocumentStore.getRevisions()`; wiring it to `documentCommit.getDocumentHistory(handle)` for corpus documents is a follow-up (corpus history is already queryable; only the popover projection is missing).
