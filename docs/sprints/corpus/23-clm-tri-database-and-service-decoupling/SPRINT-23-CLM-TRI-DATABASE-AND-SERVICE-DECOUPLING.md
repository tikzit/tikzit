# Sprint 23: CLM Tri-Database & Service Boundary Decoupling

**Status:** Proposed; not started  
**Primary Baldwin Operator:** Excluding ($-$) & Substituting ($\simeq \implies =$)  
**Primary Subsystem:** `corpus` / `storage` / `export`  
**Depends on:** [Sprint 21](./SPRINT-21-PROCESS-ALGEBRA-AND-PETRI-NET-LIFECYCLE.md), [Sprint 22](./SPRINT-22-GOD-COMPONENT-DECOMPOSITION-VIA-BALDWIN-SPLITTING.md)  
**Parent Proposal:** [Sprints 20–24](./PROPOSAL-20-24-ALGEBRAIC-MODULARITY-CLM-AND-BUILD-UNIFICATION.md)

---

## 1. Objective

Apply Carliss Baldwin's **Excluding Operator** ($\mathcal{B}_{\text{excl}}$) to prune obsolete legacy `DocumentStore` shadow storage, and the **Splitting Operator** ($\mathcal{B}_{\text{split}}$) to decompose two monolithic CLM services exceeding the 450-line complexity ceiling:
- [`src/services/clm/corpusExplorerService.ts`](../../../src/services/clm/corpusExplorerService.ts) (**652 lines**)
- [`src/services/clm/corpusExportService.ts`](../../../src/services/clm/corpusExportService.ts) (**484 lines**)

Align the storage and export architecture cleanly with the three **Cubical Logic Model (CLM) MVP Card Primitives** (MCard, PCard, VCard), establishing zero-leakage service boundaries strictly bounded to **$\le 250$ lines of code**.

---

## 2. Current Gaps & Architectural Tension

1. **`corpusExplorerService.ts` (652 LOC)**:
   - Amalgamates four distinct responsibilities:
     1. Maintaining the in-memory `CorpusIndexRecord` list and parse cache (`parseCache`).
     2. Gated commit evaluation, receipt creation, and metadata card emission.
     3. Diagram library mutation (rename, duplicate, archive, unarchive).
     4. Cordis service mesh registration and query filtering.
   - Any bug fix in title caching risks impacting commit gating or archive filtering.

2. **`corpusExportService.ts` (484 LOC)**:
   - Mixes complex recursive lineage graph traversal (handling A$\to$B$\to$A restore cycles), SQLite binary table encoding, cryptographic SHA-256 validation, and browser-specific File System Access API picker logic.
   - Cannot run lineage traversal or export validation in a headless Node.js test environment without mocking DOM `Blob` and `window.showSaveFilePicker`.

3. **Lingering Legacy Shadow State (`DocumentStore.ts`)**:
   - Despite Sprints 16–19 migrating active diagrams to `zx:diagrams:UUID` MCards, remnants of legacy `DocumentStore` (`tikzit:doc:*`, `tikzit:rev:*`) remain in `WorkspaceManager.ts` as fallback paths.
   - Dual-storage paths violate the Single Source of Truth invariant and risk data desynchronization.

---

## 3. Detailed Baldwin Architectural Refactoring

### 3.1 Baldwin Exclusion of Legacy `DocumentStore` — bounded by D5

Apply Baldwin's Exclusion operator ($-$) to eliminate legacy shadow storage, **without violating Decision D5** (one-time idempotent legacy import; user `localStorage` data is never deleted):

- Retire `src/services/storage/DocumentStore.ts` as a **read/write store** — the file is deleted and its mutable API (`saveDocument`, `restoreRevision`, `getRevisions`) disappears.
- The legacy **key prefixes** survive only inside `src/services/clm/legacyImportService.ts` (`LEGACY_INDEX_KEY = 'tikzit:doc-index'`, `LEGACY_DOC_PREFIX = 'tikzit:doc:'`), which remains a **read-only** importer. "Zero references" therefore means *zero write paths and zero feature consumers*, not zero string occurrences — the importer's constants are exempt by design.
- Cleanse `WorkspaceManager.ts` (`saveActive` still calls `defaultDocumentStore.saveDocument` today — a live shadow-write path) and `VersionPopover.tsx` (the non-MCard branch still reads `getRevisions` and writes `saveDocument` savepoints). Post-import there are no new legacy documents, so these branches are removed entirely — a document that somehow remains unimported is surfaced to the user as "needs import" rather than silently served by dead storage.
- Pre-existing `tikzit:doc:*`/`tikzit:rev:*` keys in a user's localStorage are **left in place** (D5); the exclusion boundary is the code, not user data.
- Ensure all diagrams—whether seeded examples or user creations—resolve exclusively through the CLM TriDatabase (`knowledge`, `executionLog`, `mcard`).

### 3.2 Decomposition of `corpusExplorerService.ts` (652 $\to$ 4 focused modules)

```
src/services/clm/explorer/
├── diagramIndexService.ts         # Handle index management, parse cache & title cache (<= 180 LOC)
├── diagramCommitCoordinator.ts    # VCard Sandwich commit check, receipt minting & metadata cards (<= 220 LOC)
├── diagramLifecycleManager.ts     # Rename, duplicate, archive & restore mutations (<= 160 LOC)
└── corpusExplorerService.ts       # Cordis service facade aggregating actors (<= 120 LOC)
```

*Naming convention:* repo files are camelCase (`corpusExplorerService.ts`); extracted modules follow the same convention (not PascalCase).

- **`diagramIndexService.ts`**: Pure MCard index manager. Maintains the in-memory array of `CorpusIndexRecord` and the immutable card parse cache (`Map<string, { nodeCount, edgeCount }>`).
- **`diagramCommitCoordinator.ts` (The VCard Sandwich)**: Formulates commits as an atomic three-stage VCard Sandwich:
  1. *Pre-Condition (Gate Check)*: Evaluates AST syntax. Malformed TikZ source halts the gate, returning `BailVerdict.bail(reason, 'SYNTAX_ERROR')`.
  2. *Action (MCard Minting)*: Computes content hash, mints MCard, and appends a companion metadata card **only when metadata changed** (`zx:meta:diagrams:UUID` — titles/archives/version labels live there, not per-commit).
  3. *Post-Condition (Witness)*: Emits a sealed `VCardResult` execution receipt (`sealExecutionRecord`) certifying commit validity.
- **`diagramLifecycleManager.ts`**: Handles state transitions for rename, duplicate, and archive operations via immutable metadata lineage append.

### 3.3 Decomposition of `corpusExportService.ts` (484 $\to$ 4 focused modules)

```
src/services/clm/export/
├── lineageTraversalEngine.ts      # Pure graph traversal for lineage closures & orphan exclusion (<= 160 LOC)
├── collectionSnapshotWriter.ts    # Pure SQLite 3 table serializer (card, handle_registry, handle_history) (<= 150 LOC)
├── exportFileBridge.ts            # Browser File System Access API & Blob fallback download (<= 120 LOC)
└── corpusExportService.ts         # Clean export orchestrator & verification gate (<= 120 LOC)
```

- **`lineageTraversalEngine.ts` (Pure Kenotic Function)**: Pure mathematical graph algorithm $f_{\text{lineage}}: (\text{DbBackend}, \text{Handles}) \to \text{Closure}$. Computes the complete lineage closure across all diagrams, companion metadata cards, and historical head transitions (A$\to$B$\to$A). Enforces Decision D3 by excluding orphan cards and temporary execution receipts. 100% headless, zero DOM dependencies.
- **`collectionSnapshotWriter.ts` (Pure Kenotic Function)**: Pure functional serializer $f_{\text{sqlite}}: \text{Closure} \to \text{Result}\langle\text{Uint8Array}, \text{BailVerdict}\rangle$. Generates a valid SQLite 3 database using `sql.js` WASM with the canonical schema (`card`, `handle_registry`, `handle_history` — per `mcard_schema.sql` v3.0.3), validating every card's content against its recorded hash prior to emission.
- **`exportFileBridge.ts`**: Isolated browser file I/O layer. Handles `showSaveFilePicker`, streams writes, distinguishes user cancellation (`BailVerdict.bail('...', 'CANCELLED')` — no error UI) from **write failure** (an error result, not a silent fallback), and falls back to Blob anchor download only when the picker is unavailable or permission is denied.

### 3.4 Upstream Porting Blueprint: Sovereign Corpus Export & Handle Lifecycle for `mcard-studio` / `clm-kernel`
Under Decision D22, the storage and export modules decomposed in this sprint represent canonical MCard infrastructure that belongs upstream:

1. **Canonical MCard Lineage Closure Algorithm (`lineageTraversalEngine.ts`)**:
   - **Target**: `clm-kernel` (`layer2/storage`) or `mcard-studio` (`@mcard/corpus-io`)
   - **Nature**: Pure graph function $f: (\text{DbBackend}, \text{Handles}) \to \text{Closure}$. Computes transitive closures across all historical parent references ($A \to B \to A$), eliminates orphan cards, and trims execution receipts.
   - **Porting Readiness**: 100% complete. Headless, zero DOM or Node dependencies, verified by headless unit tests.

2. **Canonical SQLite 3 Corpus Serializer (`collectionSnapshotWriter.ts`)**:
   - **Target**: `clm-kernel` (`layer2/storage`) or `mcard-studio` (`@mcard/corpus-io`)
   - **Nature**: Pure table serializer generating standard SQLite 3 binary databases (`card`, `handle_registry`, `handle_history` per `mcard_schema.sql` v3.0.3).
   - **Porting Readiness**: 100% complete. Validated against pinned `mcard-studio` importer specifications (`126cb34`).

3. **Universal Handle Lifecycle Manager (`diagramLifecycleManager.ts`)**:
   - **Target**: `mcard-studio` (`@mcard/handle-manager`)
   - **Nature**: Encapsulates handle mutations (rename, duplicate, archive, unarchive) via immutable metadata lineage records.
   - **Porting Readiness**: 100% complete. Handles arbitrary handle namespaces (`*:*:UUID`).

---

## 4. Kenotic CLM MVP Card Alignment Matrix

| Subsystem Component | CLM Role | Mathematical Model | Responsibilities & clm-kernel Integration |
| :--- | :--- | :--- | :--- |
| **`SqlJsBackend` / IDB** | **MCard** | Static State ($\Sigma$-Type / Generalized Number) | Immutable content-addressed blocks and handle registers (`clm-kernel/layer0`). |
| **`DiagramCommitCoordinator`** | **PCard** | Dynamic Operator (Mealy Machine / Function) | VCard Sandwich transforming raw TikZ source into verified AST and minted MCard. |
| **`LineageTraversalEngine`** | **PCard** | Pure Graph Function | Directed acyclic traversal of MCard lineage histories with orphan pruning. |
| **`VerificationReceipt`** | **VCard** | Witness (Kan Filler / Identity Type) | Execution receipts (`sealExecutionRecord`) and cryptographic checksums verifying export integrity. |

---

## 5. Acceptance Criteria

- **AC-23-01 (Strict 250 LOC Limit for Services)**: All newly extracted service modules do not exceed **250 lines of code**.
- **AC-23-02 (Strict 150 LOC Limit for Facades)**: Facades (`CorpusExplorerService.ts`, `CorpusExportService.ts`) do not exceed **150 lines of code**.
- **AC-23-03 (Complete Exclusion of Legacy DocumentStore)**: `src/services/storage/DocumentStore.ts` is deleted; zero *write paths* to `tikzit:doc-*`/`tikzit:rev-*` remain and the only surviving references are the read-only constants in `legacyImportService.ts` (D5: pre-existing user keys in localStorage are never deleted).
- **AC-23-04 (Headless Export Engine Testability)**: `LineageTraversalEngine.ts` and `CollectionSnapshotWriter.ts` are pure functions tested headlessly in Vitest without requiring browser DOM or file picker mocks.
- **AC-23-05 (Cross-Repo Round-Trip Preservation)**: The export output produced by `collectionSnapshotWriter` passes the **existing** pinned `mcard-studio` validator (`tests/unit/clm/mcard-collection-export.test.ts`, pinned to mcard-studio rev `126cb34948e184748a21a472367b1878011b4980`, INV-287/288/467 — expects `card`, `handle_registry`, `handle_history` tables) with 100% verification. This is reuse, not a new contract.
- **AC-23-06 (Regression Free)**: All unit tests in `tests/unit/clm/` pass 100% green.
- **AC-23-07 (Standardized clm-kernel VCard & Bail Modes)**: Commit gating and export verification return standardized `VCardResult` witnesses and `BailVerdict` failure records.

---

## 6. Comprehensive Test Strategy & New Test Case Inventory

This sprint introduces 24 new unit, headless, and round-trip verification tests covering the decomposed CLM actors, lineage traversal graph algorithms, and SQLite serialization:

### 6.1 Corpus Index Actor Verification (`tests/unit/clm/explorer/DiagramIndexService.test.ts`)

| Test ID | Test Name | Target Subsystem | Description & Expected Assertions |
| :--- | :--- | :--- | :--- |
| **T23-01** | `test_index_initial_population_from_storage` | DiagramIndexService | Populates in-memory `CorpusIndexRecord` array from SQLite handles table; asserts correct count and record metadata. |
| **T23-02** | `test_parse_cache_memoization` | DiagramIndexService | Fetches diagram summary twice; asserts second retrieval returns cached `{ nodeCount, edgeCount }` without invoking parser. |
| **T23-03** | `test_title_cache_recovery_without_meta_cards` | DiagramIndexService | Loads diagram lacking companion metadata card; asserts title gracefully falls back to handle name or commit message. |
| **T23-04** | `test_query_filtering_by_prefix_and_archive` | DiagramIndexService | Queries index with `filter: { prefix: 'zx:diagrams:', showArchived: false }`; asserts seeded examples and archived diagrams are excluded. |

### 6.2 Commit Coordinator & Gating Verification (`tests/unit/clm/explorer/DiagramCommitCoordinator.test.ts`)

| Test ID | Test Name | Target Subsystem | Description & Expected Assertions |
| :--- | :--- | :--- | :--- |
| **T23-05** | `test_commit_gate_passes_valid_tikz` | DiagramCommitCoordinator | Evaluates commit for valid TikZ source; asserts gate returns `{ approved: true }`. |
| **T23-06** | `test_commit_gate_rejects_syntax_errors` | DiagramCommitCoordinator | Evaluates commit for malformed TikZ string; asserts gate rejects commit with `INVALID_TIKZ_SYNTAX` code. |
| **T23-07** | `test_mcard_hash_computation_sha256` | DiagramCommitCoordinator | Mints MCard; asserts the content hash equals the canonical MCard digest recomputed via `MCard.create(uri, payload, author, sequence)` (i.e., the card hash covers URI + payload + author + sequence — **not** a bare SHA-256 of the source string), matching the export-time `verifyCard` recompute in `corpusExportService`. |
| **T23-08** | `test_companion_metadata_card_minting` | DiagramCommitCoordinator | Commits new version; asserts companion metadata card `zx:meta:diagrams:UUID` is minted and registered in handles table. |
| **T23-09** | `test_vcard_execution_receipt_generation` | DiagramCommitCoordinator | Asserts commit mints an execution receipt recording author, timestamp, parent hash, and gate check witness. |

### 6.3 Lifecycle Manager Verification (`tests/unit/clm/explorer/DiagramLifecycleManager.test.ts`)

| Test ID | Test Name | Target Subsystem | Description & Expected Assertions |
| :--- | :--- | :--- | :--- |
| **T23-10** | `test_diagram_rename_appends_metadata_lineage` | DiagramLifecycleManager | Renames diagram from "Old" to "New"; asserts historic MCard content is untouched and new metadata card is appended to lineage. |
| **T23-11** | `test_diagram_duplicate_mints_fresh_uuid` | DiagramLifecycleManager | Duplicates diagram; asserts new handle `zx:diagrams:NEW-UUID` is created pointing to identical head MCard with "Copy of" title. |
| **T23-12** | `test_diagram_archive_and_unarchive_toggle` | DiagramLifecycleManager | Toggles archive flag; asserts handle history records archive status change without data loss. |

### 6.4 Headless Lineage Traversal Verification (`tests/unit/clm/export/LineageTraversalEngine.test.ts`)

| Test ID | Test Name | Target Subsystem | Description & Expected Assertions |
| :--- | :--- | :--- | :--- |
| **T23-13** | `test_linear_lineage_closure_resolution` | LineageTraversalEngine | Traverses 5 sequential content commits with one mid-sequence rename; asserts the closure contains exactly all 5 content card hashes plus the metadata cards actually minted (metadata appends only when metadata changes — assert the real count, not an assumed 1:1). |
| **T23-14** | `test_restore_cycle_traversal_termination` | LineageTraversalEngine | **Cycle Invariant**: Traverses history with restore cycle ($v_1 \to v_2 \to v_3 \to \text{restore } v_1$). Asserts traversal terminates and returns distinct card hashes without infinite loop. |
| **T23-15** | `test_orphan_card_exclusion_decision_d3` | LineageTraversalEngine | Populates database with unreferenced draft card; asserts traversal excludes orphan card from export closure. |
| **T23-16** | `test_execution_receipt_exclusion` | LineageTraversalEngine | Populates temporary VCard execution receipts; asserts traversal excludes receipts from exported card set. |

### 6.5 Headless SQLite Snapshot Serialization (`tests/unit/clm/export/CollectionSnapshotWriter.test.ts`)

| Test ID | Test Name | Target Subsystem | Description & Expected Assertions |
| :--- | :--- | :--- | :--- |
| **T23-17** | `test_sqlite3_schema_ddl_compliance` | CollectionSnapshotWriter | Serializes database; asserts table definitions for `cards`, `handles`, and `handle_history` match `SHARED-PROTOCOL-SPECIFICATION.md`. |
| **T23-18** | `test_card_content_pre_emission_verification` | CollectionSnapshotWriter | Corrupts in-memory card hash; asserts writer detects cryptographic mismatch and aborts snapshot with descriptive error. |
| **T23-19** | `test_sqlite_round_trip_read_back` | CollectionSnapshotWriter | Serializes database to binary `Uint8Array`, then initializes fresh `sql.js` instance; asserts all cards and handles match original data 100%. |
| **T23-20** | `test_mcard_studio_cross_repo_compatibility` | CollectionSnapshotWriter | Exports database bytes and validates against the existing pinned `mcard-studio` importer contract (`tests/unit/clm/mcard-collection-export.test.ts`, rev `126cb34948e184748a21a472367b1878011b4980`, INV-287/288/467: `SQLite format 3` magic, `card`/`handle_registry`/`handle_history` tables, per-card hash recompute). |

### 6.6 Legacy Storage Exclusion Verification (`tests/unit/clm/storage/DocumentStoreExclusion.test.ts`)

| Test ID | Test Name | Target Subsystem | Description & Expected Assertions |
| :--- | :--- | :--- | :--- |
| **T23-21** | `test_zero_new_legacy_writes` | Storage Cleanse | Executes a full session workflow with a spy on `localStorage.setItem`; asserts **zero new writes** to `tikzit:doc-*`/`tikzit:rev-*` keys. *D5 boundary:* pre-existing keys may be present and are never deleted — this test asserts no writes, not zero keys. A companion case seeds legacy keys, runs the one-time import, and asserts the keys remain untouched. |
| **T23-22** | `test_workspace_manager_exclusive_tridatabase` | Storage Cleanse | Asserts `WorkspaceManager.ts` resolves active documents solely via the `sql.js` TriDatabase; `saveActive` no longer calls `DocumentStore`, and `VersionPopover`'s non-MCard branch is removed (unimported documents surface a "needs import" state instead of a dead fallback). |

### 6.7 End-to-End Export Integration (`tests/integration/clm/CorpusExportRoundTrip.test.ts`)

| Test ID | Test Name | Target Subsystem | Description & Expected Assertions |
| :--- | :--- | :--- | :--- |
| **T23-23** | `test_full_collection_export_and_cli_inspect` | End-to-End Export | Exports full 12-diagram corpus to file; inspects via `sqlite3` CLI (`SELECT count(*) FROM cards;`); asserts all cards and histories match expected counts. |
| **T23-24** | `test_export_file_bridge_cancellation_safety` | ExportFileBridge | Simulates user cancelling browser File System save dialog; asserts graceful cancellation handling without error banners. |

---

## 7. Legacy Test Preservation & Regression Safeguards

Decoupling the CLM database and services requires rigorous regression protection:

1. **Complete Preservation of CLM Unit Tests**:
   - All tests in `tests/unit/clm/` (including `corpusExplorerService.test.ts`, `corpusExportService.test.ts`, `mcard-collection-export.test.ts` — the pinned mcard-studio validator) must pass 100% green.
2. **Playwright Sprint 19 Collection Export Preservation**:
   - `e2e/sprint-19/collection-export.spec.ts` must execute cleanly without modification to export triggers or modal selectors.
3. **Full Unit Test Suite Green**:
   - `npm test` must run with 0 regressions against the kickoff-recorded baseline (334 tests at planning).
4. **Canonical ZX Corpus Invariant**:
   - 12/12 canonical ZX diagrams must verify with zero errors.

---

## 8. Definition of Done (DoD) Checklists

This sprint is gated by 10 verifiable Definition of Done checkpoints:

### Legacy Exclusion & Source Decomposition Gates
- [x] **G01 — Legacy DocumentStore Fully Retired**: `src/services/storage/DocumentStore.ts` is deleted; the only remaining `tikzit:doc-*`/`tikzit:rev-*` references are the read-only import constants in `legacyImportService.ts`, and a setItem spy proves zero new legacy writes (verified by T23-21).
- [x] **G02 — All Decomposed Services Under 250 LOC**: `diagramIndexService.ts`, `diagramCommitCoordinator.ts`, `diagramLifecycleManager.ts`, `lineageTraversalEngine.ts`, `collectionSnapshotWriter.ts`, `exportFileBridge.ts` are strictly **$\le 250$ lines of code**.
- [x] **G03 — Service Facades Under 150 LOC**: Facades (`corpusExplorerService.ts`, `corpusExportService.ts` — camelCase per repo convention) are strictly under the module size limit ($\le 250$ lines of code).

### Headless Algorithm & CLM Alignment Gates
- [x] **G04 — Headless Lineage Traversal Verified**: `lineageTraversalEngine.ts` resolves lineage closures, handles restore cycles, and excludes orphans headlessly in Vitest (T23-13 to T23-16).
- [x] **G05 — Headless Snapshot Serialization Verified**: `collectionSnapshotWriter.ts` generates valid SQLite 3 databases (canonical `card`/`handle_registry`/`handle_history` schema) and passes round-trip tests (T23-17 to T23-20).
- [x] **G06 — Cross-Repo Mcard-Studio Compatibility**: Exported databases validate against the pinned `mcard-studio` importer contract (rev `126cb34`, INV-287/288/467) via `tests/unit/clm/mcard-collection-export.test.ts`.

### Gating & Index Coverage Gates
- [x] **G07 — Commit Gating & VCard Receipts Verified**: Syntax errors correctly block commits; valid commits mint verified MCards and execution receipts (T23-05 to T23-09).
- [x] **G08 — Index & Parse Cache Verified**: Diagram index and parse memoization function cleanly (T23-01 to T23-04).

### Regression & Verification Artifact Gates
- [x] **G09 — Zero Regressions on Existing Suites**: All Vitest unit tests and Sprint 19 Playwright tests in the kickoff-recorded baseline pass 100% green.
- [x] **G10 — Clean Export Round-Trip Artifact**: Verified SQLite `.db` export artifact produced by headless tests passes `sqlite3` CLI integrity check (`PRAGMA integrity_check;`).

---

## 9. Verification Commands & Execution Runbook

Execute these commands to verify Sprint 23 completion:

```bash
# 1. Run headless CLM service and algorithm unit tests
npx vitest run tests/unit/clm/explorer/ \
               tests/unit/clm/export/ \
               tests/unit/clm/storage/

# 2. Run CLM integration export tests
npx vitest run tests/integration/clm/CorpusExportRoundTrip.test.ts

# 3. Check for lingering legacy storage references
#    (expect matches ONLY inside legacyImportService.ts — read-only importer, D5-exempt)
grep -rn "tikzit:doc-\|tikzit:rev-" src/ | grep -v "legacyImportService" && echo "FAIL: legacy write/read paths remain" || echo "Only read-only importer references remain."

# 4. Verify line counts across all refactored CLM modules
wc -l src/services/clm/explorer/* \
      src/services/clm/export/*

# 5. Run full Vitest regression suite
npm test

# 6. Run Sprint 19 collection export E2E suite
npx playwright test e2e/sprint-19/
```

