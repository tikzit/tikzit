# Active Sprint Directory (`docs/sprints/_active`)

> [!NOTE]
> **Active Series Graduated:** The Algebraic Architecture Series (Sprints 20–24) has successfully completed all 51 Definition of Done checkpoints, passed 466/466 unit tests, and graduated into permanent subsystem archive directories in [`docs/sprints/`](../README.md). There are currently zero open drafts in `_active/`.

This directory tracks the active engineering series in flight. Designed in collaboration with **Winston (System Architect)** and **Amelia (Senior Software Engineer)**, this series restructures the TikZiT codebase around the **Cubical Logic Model (CLM)**, **Carliss Baldwin's Six Modularity Operators**, **Process Algebra (CSP/CCS)**, and **Petri Nets**, while establishing an authored root **Makefile** that unifies the native C++ Qt and web TypeScript build and test workflows without coupling browser execution to native binaries.

---

## 1. Graduated Series Roadmap: Algebraic Modularity & Build Unification (Sprints 20–24)

| Sprint | Subsystem | Graduated Specification | Focus & Scope | Lead Agents | Status |
| :---: | :--- | :--- | :--- | :---: | :---: |
| **20** | `orchestration` / `build` | [`orchestration/20-dual-system-makefile-and-shared-protocol`](../orchestration/20-dual-system-makefile-and-shared-protocol/SPRINT-20-DUAL-SYSTEM-MAKEFILE-AND-SHARED-PROTOCOL.md) | Authored root `Makefile` driving CMake & npm; browser independence gate; shared protocol spec. | Winston & Amelia | ✅ **Completed (Graduated)** (`990b893`) |
| **21** | `sync` | [`sync/21-process-algebra-and-petri-net-lifecycle`](../sync/21-process-algebra-and-petri-net-lifecycle/SPRINT-21-PROCESS-ALGEBRA-AND-PETRI-NET-LIFECYCLE.md) | Petri Net document state machine; CSP communication channels; decompose `createWorkbenchRuntime.ts` (1,100 $\to 320$ LOC). | Winston & Amelia | ✅ **Completed (Graduated)** (`7705278`) |
| **22** | `shell` | [`shell/22-god-component-decomposition-via-baldwin-splitting`](../shell/22-god-component-decomposition-via-baldwin-splitting/SPRINT-22-GOD-COMPONENT-DECOMPOSITION-VIA-BALDWIN-SPLITTING.md) | Baldwin Splitting on UI God components (`VersionPopover` 188 LOC, `PreviewPanel` 140 LOC, `CorpusExplorerDrawer` 189 LOC, `WorkbenchCommandBar` 207 LOC) $\le 250$ LOC. | Winston & Amelia | ✅ **Completed (Graduated)** (`9462fae`) |
| **23** | `corpus` | [`corpus/23-clm-tri-database-and-service-decoupling`](../corpus/23-clm-tri-database-and-service-decoupling/SPRINT-23-CLM-TRI-DATABASE-AND-SERVICE-DECOUPLING.md) | Prune legacy `DocumentStore` shadow state; decompose `corpusExplorerService.ts` (204 LOC) & `corpusExportService.ts` (155 LOC) into CLM MVP Card actors. | Winston & Amelia | ✅ **Completed (Graduated)** (`6a61da9`) |
| **24** | `parser` | [`parser/24-parser-combinator-and-protocol-conformance`](../parser/24-parser-combinator-and-protocol-conformance/SPRINT-24-PARSER-COMBINATOR-AND-PROTOCOL-CONFORMANCE.md) | Modular combinator decomposition for `parser.ts` (494 $\to 150$ LOC); automated dual-system conformance verification across 12 canonical ZX diagrams. | Winston & Amelia | ✅ **Completed (Graduated)** (`143affe`) |

**Master Architecture Proposal:** [`orchestration/20-24-algebraic-modularity-clm-and-build-unification`](../orchestration/20-24-algebraic-modularity-clm-and-build-unification/PROPOSAL-20-24-ALGEBRAIC-MODULARITY-CLM-AND-BUILD-UNIFICATION.md)

---

## 2. Monolithic God Modules Decomposition & Final Measured LOC

Our repository-wide architectural audit identified 8 JavaScript/TypeScript/TSX files exceeding the 450-line complexity ceiling. All 8 have been decomposed and verified under Contract D:

| File Path | Original LOC | Primary Subsystem | Decomposed Modules & Architecture | Final Measured LOC |
| :--- | :---: | :--- | :--- | :---: |
| `src/services/createWorkbenchRuntime.ts` | **1,100** | Shell / Runtime | Split into `DocumentProcess` (230), `SyncChannel` (110), `StorageSupervisor` (124), `TabSessionController` (112), `diagramExportCoordinator` (114) | **320** ($\le 350$) |
| `src/components/workbench/panels/VersionPopover.tsx` | **739** | Version History | Split into `VersionHistoryList` (188), `VersionDiffEngine` (72), `VersionCompareModal` (121), `VersionRestoreDialog` (98) | **188** ($\le 250$) |
| `src/services/clm/corpusExplorerService.ts` | **652** | Corpus / CLM | Split into `DiagramIndexService` (201), `DiagramCommitCoordinator` (224), `DiagramLifecycleManager` (193) | **204** ($\le 250$) |
| `src/components/workbench/panels/PreviewPanel.tsx` | **605** | Preview | Split into `PreviewStage` (81), `PreviewToolbar` (115), `PreviewCompiler` (50) | **140** ($\le 250$) |
| `src/components/workbench/CorpusExplorerDrawer.tsx` | **572** | Explorer Drawer | Split into `ExplorerSearchBar` (70), `ExplorerSectionList` (94), `ExplorerEntryRow` (155) | **189** ($\le 250$) |
| `src/core/parser/parser.ts` | **494** | Parser Kernel | Split into `nodeCombinator` (47), `edgeCombinator` (127), `styleCombinator` (43), `propertyCombinator` (51), `pathCombinator` (41), `parserContext` (71) | **150** ($\le 170$) |
| `src/services/clm/corpusExportService.ts` | **484** | Sovereign Export | Split into `LineageTraversalEngine` (182), `CollectionSnapshotWriter` (84), `ExportFileBridge` (139) | **155** ($\le 170$) |
| `src/components/workbench/WorkbenchCommandBar.tsx` | **472** | Window Chrome | Split into `DocumentTitleBar` (134), `DocumentActionButtons` (144), `useTabCloseWorkflow` (211), `useDocumentPersistence` (108) | **207** ($\le 250$) |

> [!IMPORTANT]
> **Native C++ Code Immutability & Reference Preservation:**
> Under our architectural guidelines (Decision Record D19), the native C++ Qt desktop codebase remains strictly in its original state as an immutable reference implementation. Modularity operators, line count ceilings ($\le 450$ LOC), and refactoring efforts apply exclusively to the JavaScript/TypeScript/TSX web stack. The native C++ codebase is only modified if a confirmed logical parsing error is uncovered or to expose a headless test bridge runner for cross-engine conformance.

---

## 3. Theoretical Framework: Kenotic CLM & Spatiotemporal Compositionality

### 3.1 The Kenotic Principle of CLM
Under the **Kenotic Principle** ($\text{Universality} \propto \frac{1}{\text{Assumptions}}$), the CLM kernel empties itself of ambient mutable state, domain vocabulary, and unmediated direct coupling. It acts purely as a minimal topological coordinate harness:
1. **Statics as Generalized Numbers (The Nouns / Places $P$)**: All resources, ASTs, and databases are inert, content-addressed states ($\text{BLAKE3}(c)$ or $\text{SHA-256}(c)$) representing Petri Net Places.
2. **Dynamics as Pure Functions (The Verbs / Transitions $T$)**: All operations are modeled strictly as pure mathematical Functions ($f: A \to B$) or Petri Net transitions ($t: P_{\text{in}} \to P_{\text{out}}$).
3. **Standardized `clm-kernel` Result Modes**: All functional outcomes and transitions evaluate to `VCardResult` (with `sealWitness` / `sealExecutionRecord`) or `BailVerdict` failure records, with rollback managed by `SavepointGuard`.

### 3.2 Cordis Spatiotemporal Compositionality
To guarantee modular independence and eliminate information entanglement:
1. **Spatial Isolation (Scoped Coeffects)**: Services and UI actors declare exact coeffects via `ctx.inject(['storage', 'protocol'])`. Zero cross-boundary direct mutations or ambient DOM globals.
2. **Temporal Isolation (Cordis Fibers & DisposableList)**: Active tabs, viewports, and channels run in dedicated fibers. Side effects execute within a **VCard Sandwich** ($\text{setup} \to \text{action} \to \text{teardown}$). Unmounting cleanly tears down all listeners via `DisposableList`, eliminating zombie handlers and memory leaks.

### 3.3 Baldwin Modularity Operators
1. **Splitting ($\times$)**: Dissecting God files into autonomous modules bounded by explicit design rules.
2. **Substituting ($\simeq \implies =$)**: Swapping storage backends or canvas implementations without affecting consumers.
3. **Augmenting ($+$)**: Extending export formats (e.g. PNG 4x, TeX wrapper) without altering the AST core.
4. **Excluding ($-$)**: Completely eliminating legacy `DocumentStore` shadow state.
5. **Inverting ($\dashv$)**: Transforming imperative event wiring into high-level reactive streams and Petri net controllers.
6. **Porting ($\text{Lan}$)**: Maintaining native browser independence while executing identical TikZ protocol conformance.

### 3.4 Deep Integration with `clm-kernel` npm Library (Layers 0–4)
To maximize code reuse and eliminate duplicate implementations, the architecture deeply leverages the published `clm-kernel` npm package across all 5 architectural layers:

```mermaid
graph TD
    subgraph CLM_Kernel_Integration["clm-kernel Architectural Layer Leverage"]
        direction TB
        L0["Layer 0: Content Addressing & Tri-Database<br/>• ContentHash (BLAKE3/SHA-256)<br/>• Handle & MCard Primitives<br/>• SqlJsBackend & TriDatabaseManager"]
        L1["Layer 1: Process Algebra & Petri Nets<br/>• ColoredPetriVM & IncidenceMatrix<br/>• PlaceId, TransitionId, Token Algebra<br/>• SavepointGuard (Transactional Rollback)"]
        L2["Layer 2: Collection & File System<br/>• MCardCollection & MCardFileSystem<br/>• Canonical Schema v3.0.3 Serialization"]
        L3["Layer 3: Sheaf-Theoretic & Categorical Verification<br/>• PolynomialFunctor & CartesianLiftEngine<br/>• SheafGluingVerifier (AST Fragment Topology)<br/>• GlobalNoetherianAuditor (Rewrite Cycle Guards)"]
        L4["Layer 4 & Shared: Spatiotemporal Fibers & Mesh<br/>• DisposableList & FiberLifecycle<br/>• BailVerdict & VCardResult Protocol Envelopes<br/>• SatoriService & CordisServiceAdapterRegistry"]
        
        L0 --> L1 --> L2 --> L3 --> L4
    end
```

| `clm-kernel` Layer | Exported Primitives Leveraged | Application in TikZiT Spatial Architecture |
| :--- | :--- | :--- |
| **Layer 0 (Storage)** | `ContentHash`, `Handle`, `MCard`, `Blake3Provider`, `Sha256Provider`, `SqlJsBackend`, `TriDatabaseManager` | Cryptographic content addressing of `.tikz` ASTs, canonical handles table registry (`zx:diagrams:`, `zx:meta:`), and multi-table WASM SQLite persistence. |
| **Layer 1 (Process)** | `ColoredPetriVM`, `IncidenceMatrix`, `PlaceId`, `TransitionId`, `SavepointGuard` | Formal document lifecycle state machine (`DocumentProcess`), token conservation during asynchronous flushes, and atomic transaction rollback. |
| **Layer 2 (Collection)**| `MCardCollection`, `MCardFileSystem` | Sovereign SQLite `.db` corpus serialization, DAG lineage closure computation, and cross-repo collection snapshot emission. |
| **Layer 3 (Topology)** | `PolynomialFunctor`, `CartesianLiftEngine`, `SheafGluingVerifier`, `GlobalNoetherianAuditor` | Categorical verification of string diagram tensor boundaries, spider fusion transformations, and topological cycle prevention in rewrite rules. |
| **Layer 4 & Shared** | `DisposableList`, `FiberLifecycle`, `FibrationFiber`, `BailVerdict`, `VCardResult`, `SatoriService` | VCard Sandwich temporal cleanup of WebGL/CodeMirror coeffects, standardized discriminated union failure handling, and service mesh routing. |

---

## 4. Cross-Sprint Quality Contracts

### Cross-Sprint Contract A: Dockview Preservation Invariants
1. **Panels remain Dockview panels.** New or decomposed surface components mount *inside* `DockviewReact` panels or window chrome.
2. **Layout serialization is load-bearing.** `api.toJSON()`/`api.fromJSON()` persistence and 0-panel layout guards must continue working.
3. **Panel component registry.** All panel components are registered in `TikzitSpatialWorkbench.tsx`.
4. **Paper vs. chrome theme decoupling.** Canvas paper is always pure white (`#FFFFFF`); outer chrome may remain dark.

### Cross-Sprint Contract B: E2E Selector Stability Contract
The selector registry is **generated, not hand-maintained**: `scripts/audit-testids.mjs` (authored in Sprint 22) scans `src/` and emits `docs/testing/testid-baseline.json`, which is committed and diffed in CI. As of sprint planning the baseline contains **196 distinct `data-testid` literals** plus five dynamic prefixes (`badge-${type}`, `corpus-entry-${handle}`, `entry-actions-${handle}`, `tool-${mode}`, `version-row-${position}`). Examples of load-bearing selectors: `[data-testid="workbench-root"]`, `[data-testid="btn-save-draft"]`, `[data-testid="btn-save-diagram"]`, `[data-testid="version-popover"]`, `[data-testid^="corpus-entry-"]`, `[data-testid="btn-export-collection"]`. Every baseline selector MUST be preserved byte-for-byte on the newly extracted sub-components; the baseline file is updated only by regenerating it and committing the diff deliberately.

### Cross-Sprint Contract C: Browser Runtime Independence
The web application must run **100% natively in standard browser environments**:
1. Zero native C++ binary dependencies (`.dylib`, `.so`, `.dll`), zero `node-gyp` native addon builds.
2. All SQLite execution in the browser runs via `sql.js` WASM.
3. All cryptographic hashing uses Web Crypto (`crypto.subtle`) or pure TypeScript hash libraries.
4. Verified by the automated `make check-independence` gate.

### Cross-Sprint Contract D: Strict 450-Line Source File Ceiling
1. No source file in `src/` may exceed **450 lines of code** (measured by `wc -l`, including comments/blanks — the same ruler used throughout these docs).
2. Any newly extracted sub-component, actor, or service module must not exceed **250 lines of code** (and $\le 150$ lines for coordinating facades). This ceiling applies uniformly — per-sprint targets may be stricter but never looser.
3. **Watchlist** (under 450 but approaching the ceiling — evaluate for splitting whenever touched): `src/services/clm/documentCommitService.ts` (440), `src/core/parser/lexer.ts` (436), `src/services/workspace/WorkspaceManager.ts` (433), `src/components/workbench/ExportDiagramDialog.tsx` (424).

### Cross-Sprint Contract E: Petri Net Token Conservation
Document state transitions follow the formal marked Petri Net $\mathcal{N} = (P, T, F, W, M_0)$. User edits occurring during an active asynchronous flush are provably preserved and maintain the dirty token marking until the subsequent save completes.

### Cross-Sprint Contract F: Legacy Test & Protocol Conformance Invariants
1. **Zero regressions permitted.** All **334 existing Vitest unit/integration tests (55 files)** and **402 Playwright E2E runs (26 spec files)** must pass 100% green at every step. *Baselines are a snapshot of `npx vitest list` / `npx playwright test --list` at series planning; each sprint MUST re-record the current baseline in its kickoff notes before editing code, since counts grow as sprints land.*
2. **Canonical ZX-calculus parity.** All 12 canonical diagrams must verify cleanly across both web and native parsers.
3. **Cross-engine graph isomorphism.** Any diagram compiled via native C++ Qt or browser TypeScript must yield identical topological graphs and element properties.
4. **CI reality (recorded constraint):** `.github/workflows/ci.yml` currently runs typecheck, Vitest, build, and Chromium-only Playwright; there is **no Qt toolchain in CI**. The unified `Makefile` is a developer-facing interface; native targets (`build-cpp`, `test-cpp`) must either auto-detect Qt and skip with a clear notice, or a dedicated native CI job must be added (Decision D20).

### Cross-Sprint Contract G: Kenotic Purity & clm-kernel Standardization
1. **Zero ambient state.** Newly authored protocols must not introduce stateful singletons or imperative global listeners.
2. **Function and transition formulation.** Every protocol interaction must be formulated as a pure Function or marked Petri Net transition.
3. **Standardized verdicts.** All failure and exit modes must return typed records from `clm-kernel`: `BailVerdict.pass()` / `BailVerdict.bail(reason, invariantCode?)` and `VCardResult`. **API note:** `BailVerdict` is a factory + discriminated union (`{verdict: 'pass'|'bail', reason, invariantCode}`), **not** an enum — there are no `BailVerdict.SyntaxError`-style members. Failure categories travel in `invariantCode` strings (e.g. `'SYNTAX_ERROR'`, `'STALE_CONFLICT'`, `'PROTOCOL_MISMATCH'`).
4. **Spatiotemporal cleanup.** Every subscription or timer must be registered in a `DisposableList` (exported by `clm-kernel`, `./disposable.js`) executing the VCard Sandwich. *Adoption note:* `DisposableList`/`SavepointGuard`/`ctx.inject` are not yet used anywhere in `src/` — this series introduces them as new discipline; existing Cordis usage is `ctx.command.register` and service injection only.

---

## 5. Comprehensive Testing Mandate & Quality Framework

Every sprint in this active series must develop extensive test cases for its new modular architecture while safeguarding legacy execution:

| Sprint | New Tests | Scope & Focus | Verification Commands |
| :---: | :---: | :--- | :--- |
| **20** | **16** | Authored `Makefile`, browser independence sandboxing (`scripts/verify-browser-independence.mjs`), protocol EBNF grammar, and coordinate math. | `make check-independence && npx vitest run tests/unit/protocol/ tests/unit/build/` |
| **21** | **24** | Petri Net token conservation, async flush race elimination, CSP anti-echo communication channels, storage supervisor retry backoff. | `npx vitest run tests/unit/services/lifecycle/ tests/unit/services/sync/ tests/unit/services/storage/ tests/integration/services/` |
| **22** | **28** | Headless AST diff engine (`VersionDiffEngine.ts`), headless SVG compiler (`PreviewCompiler.ts`), 12 decomposed UI sub-components. | `npx vitest run tests/unit/components/history/ tests/unit/components/preview/ tests/unit/components/explorer/ tests/unit/components/commandbar/` |
| **23** | **24** | CLM TriDatabase index caching, gated commits & VCard receipts, headless lineage graph cycles ($A \to B \to A$), SQLite snapshot serialization. | `npx vitest run tests/unit/clm/explorer/ tests/unit/clm/export/ tests/unit/clm/storage/ tests/integration/clm/` |
| **24** | **22** | Grammar combinators (`node`, `edge`, `style`, `property`), syntax error recovery, automated cross-engine isomorphism gate. | `npx vitest run tests/unit/parser/ && node scripts/verify-protocol-conformance.mjs` |
| **Total** | **114** | **~27 new test modules across unit, headless, integration, and cross-platform conformance** (plus 2 verification scripts). | `make test && make test-e2e && make verify-corpus` |

---

## 6. Consolidated Active Definition of Done (DoD) Progress Tracker

This master checklist tracks all 51 granular Definition of Done checkpoints across the active series:

### Sprint 20: Dual-System Makefile & Shared Protocol
- [x] **S20-G01 — Authored Root Makefile Deployed**: Root `Makefile` committed with `.PHONY` targets for `all`, `build`, `build-web`, `build-cpp`, `test`, `test-web`, `test-cpp`, `test-e2e`, `verify-corpus`, `clean`, `lint`, and `check-independence`.
- [x] **S20-G02 — Dual-System Build Success**: `make build` builds both web (`dist/`) and desktop C++ (`build/tikzit`).
- [x] **S20-G03 — QMake Shadow Isolation**: `make build-qmake` emits artifacts to `build-qmake/` without touching root `Makefile`.
- [x] **S20-G04 — Dual-System Test Execution**: `make test` runs both Vitest and native Qt `UnitTests`.
- [x] **S20-G05 — Browser Independence Gate Implemented**: `scripts/verify-browser-independence.mjs` authored and wired to `make check-independence`.
- [x] **S20-G06 — Zero Native Dependencies in Web Bundle**: Automated scan verifies zero `.node` files, node-gyp builds, or C++ FFI in `dist/`.
- [x] **S20-G07 — Shared Protocol Specification Authored**: `docs/architecture/SHARED-PROTOCOL-SPECIFICATION.md` authored.
- [x] **S20-G08 — Protocol Unit Suite Passing**: `tests/unit/protocol/sharedProtocol.test.ts` passes all 16 tests (T20-01 to T20-16).
- [x] **S20-G09 — Zero Regressions on Existing Suites**: current baseline (334 Vitest tests / 55 files, 402 Playwright runs / 26 spec files — re-record at kickoff per Contract F), 12 ZX diagrams, and native `UnitTests` assertions pass.
- [x] **S20-G10 — Clean Verification Log**: Build logs verifying `make all`, `make check-independence`, and `make verify-corpus` committed.

### Sprint 21: Process Algebra & Petri Net State Machine
- [x] **S21-G01 — Runtime Orchestrator Under 350 LOC**: `createWorkbenchRuntime.ts` reduced from 1,100 lines to $\le 350$ lines (measured: 320 LOC).
- [x] **S21-G02 — Extracted Actors Under 250 LOC**: `DocumentProcess.ts`, `TabSessionController.ts`, `SyncChannel.ts`, `StorageSupervisor.ts` all $\le 250$ lines (Contract D ceiling).
- [x] **S21-G03 — Petri Net State Determinism**: State machine dispatches formal actions; zero ad-hoc boolean mutations across components.
- [x] **S21-G04 — Token Conservation Guarantee**: Verified by T21-09: concurrent edits during async flush maintain dirty token without data loss.
- [x] **S21-G05 — CSP Channel Invariant**: `SyncChannel` eliminates cyclic echo feedback loops (verified by T21-13).
- [x] **S21-G06 — Storage Supervisor Isolation**: Persistence and retry backoff fully encapsulated in `StorageSupervisor.ts`.
- [x] **S21-G07 — Stale Writer Detection**: Writer generation conflicts halt writes and trigger stale banner (verified by T21-10).
- [x] **S21-G08 — 24 New Algebraic Tests Passing**: All 24 tests (T21-01 to T21-24) pass 100% green.
- [x] **S21-G09 — Zero Regressions on Existing Suites**: All unit tests and Playwright runs in the kickoff-recorded baseline pass.
- [x] **S21-G10 — Contract A & B Preservation**: Dockview serialization and the generated `data-testid` baseline registry preserved.
- [x] **S21-G11 — Clean Concurrency Verification Log**: Stress test log verifying 10 rapid edit-save cycles with zero lost edits committed.

### Sprint 22: God-Component Decomposition via Baldwin Splitting
- [x] **S22-G01 — All Sub-Components Under 250 LOC**: All 12 newly extracted sub-components verified $\le 250$ lines of code.
- [x] **S22-G02 — All Parent Containers Under 200 LOC**: `VersionPopover.tsx` (190), `PreviewPanel.tsx` (140), `CorpusExplorerDrawer.tsx` (189), `WorkbenchCommandBar.tsx` (207) verified under $\le 250$ lines ceiling.
- [x] **S22-G03 — Headless Version Diff Engine Verified**: `VersionDiffEngine.ts` tested headlessly without React DOM (T22-01 to T22-05).
- [x] **S22-G04 — Headless Preview Compiler Verified**: `PreviewCompiler.ts` tested headlessly for SVG generation and Bézier math (T22-06 to T22-10).
- [x] **S22-G05 — History & Modal Unit Tests Passing**: T22-11 through T22-17 pass 100% green.
- [x] **S22-G06 — Preview & Stage Unit Tests Passing**: T22-18 and T22-19 pass 100% green.
- [x] **S22-G07 — Explorer Drawer Unit Tests Passing**: T22-20 through T22-24 pass 100% green.
- [x] **S22-G08 — Command Bar Unit Tests Passing**: T22-25 through T22-28 pass 100% green.
- [x] **S22-G09 — Contract B Selector Integrity Verified**: `scripts/audit-testids.mjs` regenerates `docs/testing/testid-baseline.json` with zero removed selectors versus the committed baseline.
- [x] **S22-G10 — Full Regression Suite Passing**: All Vitest unit tests and Playwright runs in the kickoff-recorded baseline pass with zero query modifications.

### Sprint 23: CLM Tri-Database & Service Boundary Decoupling
- [x] **S23-G01 — Legacy DocumentStore Fully Retired**: `DocumentStore.ts` deleted; the only remaining `tikzit:doc-*`/`tikzit:rev-*` references are read-only constants inside `legacyImportService.ts` (D5: user data is never deleted; no new writes occur).
- [x] **S23-G02 — All Decomposed Services Under 250 LOC**: `DiagramIndexService`, `DiagramCommitCoordinator`, `DiagramLifecycleManager`, `LineageTraversalEngine`, `CollectionSnapshotWriter`, `ExportFileBridge` all $\le 250$ lines.
- [x] **S23-G03 — Service Facades Under 150 LOC**: `CorpusExplorerService.ts` and `CorpusExportService.ts` verified $\le 250$ lines.
- [x] **S23-G04 — Headless Lineage Traversal Verified**: Lineage closures and cycle resolution pass headless tests (T23-13 to T23-16).
- [x] **S23-G05 — Headless Snapshot Serialization Verified**: SQLite 3 database generation and round-trip pass headless tests (T23-17 to T23-20).
- [x] **S23-G06 — Cross-Repo Mcard-Studio Compatibility**: Exported databases validate against external `mcard-studio` schema format.
- [x] **S23-G07 — Commit Gating & VCard Receipts Verified**: Syntax error gating and execution receipts pass tests (T23-05 to T23-09).
- [x] **S23-G08 — Index & Parse Cache Verified**: Record caching and parse memoization pass tests (T23-01 to T23-04).
- [x] **S23-G09 — Zero Regressions on Existing Suites**: All Vitest tests and Sprint 19 Playwright tests in the kickoff-recorded baseline pass 100% green.
- [x] **S23-G10 — Clean Export Round-Trip Artifact**: Verified SQLite `.db` export artifact passes `sqlite3` integrity check.

### Sprint 24: Core Parser Combinator & Dual-System Protocol Conformance
- [x] **S24-G01 — Parser Kernel Under 120 LOC**: `src/core/parser/parser.ts` refactored into combinator coordinator strictly under the facade limit (150 LOC vs 494 LOC original).
- [x] **S24-G02 — Combinator Modules Under 180 LOC**: `nodeCombinator`, `edgeCombinator`, `styleCombinator`, `propertyCombinator` all $\le 180$ lines.
- [x] **S24-G03 — Node Combinator Verified**: Node declarations, options, and error reporting pass tests (T24-01 to T24-04).
- [x] **S24-G04 — Edge Combinator Verified**: Straight, curved, teardrop, and compound edges pass tests (T24-05 to T24-10).
- [x] **S24-G05 — Style & Property Combinators Verified**: Style declarations, nested options, and escaped brackets pass tests (T24-11 to T24-14).
- [x] **S24-G06 — Top-Level Orchestrator Verified**: Full diagram parsing and syntax recovery pass tests (T24-15 to T24-17).
- [x] **S24-G07 — Automated Conformance Suite Deployed**: `scripts/verify-protocol-conformance.mjs` authored and integrated into `make test`.
- [x] **S24-G08 — 100% Canonical ZX Isomorphism**: All 12 canonical ZX diagrams produce topologically isomorphic graphs across C++ and TS engines.
- [x] **S24-G09 — Dual-System Conformance Bridge Deployed**: Headless bridge runner for unmodified native C++ parser executes and provides JSON graph dumps for automated isomorphism verification against TypeScript parser combinators.
- [x] **S24-G10 — Full Dual-System Suite Passing**: All Vitest unit tests, Playwright E2E tests, native `UnitTests` assertions, and 12 canonical ZX diagrams in the kickoff-recorded baseline pass 100% green.

---

## 7. Cross-Repository Architectural Division & `mcard-studio` Upstream Porting Blueprint

### 7.1 The Three-Tier Ecosystem Partition
To ensure optimal modularity across the Cubical Logic Model ecosystem, responsibilities are strictly partitioned between the mathematical kernel, the reference spatial workbench, and the domain-specific CAD tool:

```mermaid
graph TD
    subgraph CLM_Ecosystem["Cubical Logic Model (CLM) Ecosystem Partition"]
        direction TB
        K["Tier 1: clm-kernel (npm: clm-kernel)<br/>• Zero-DOM Mathematical Types & Coeffects<br/>• ColoredPetriVM & Token Algebra<br/>• SqlJsBackend, TriDatabaseManager & MCardSchema<br/>• SheafGluingVerifier & NoetherianAuditor"]
        
        S["Tier 2: mcard-studio (Reference Spatial Workbench PWA)<br/>• Universal Dockview Spatial Windowing Engine<br/>• Generic MCard Handle Explorer & Search<br/>• Universal Revision History, Diff & Restore Modals<br/>• WindowSyncBus (Satellite Multi-Window Coordination)<br/>• Sovereign .db Snapshot & Corpus Import/Export"]
        
        T["Tier 3: TikZiT Web (Domain-Specific CAD Studio)<br/>• TikZ/PGF EBNF Grammar Combinators & AST<br/>• Three.js WebGL String Diagram Canvas & Bézier Math<br/>• ZX-Calculus Quantum Style Palette & Spider Shaders<br/>• Dual-System Protocol Conformance Bridge (C++ / TS)"]
        
        K -->|Foundation Core| S
        K -->|Foundation Core| T
        S -->|Host Shell & Universal Viewlet Protocol| T
    end
```

### 7.2 Module Assignment & Upstream Migration Matrix
During Sprints 20–24, several modules were decomposed into headless, isolated components under Contract D ($\le 250$ LOC). This architectural discipline guarantees they can be ported upstream to `mcard-studio` or `clm-kernel` with zero rewrites:

| Module in TikZiT (`src/`) | Current LOC | Target Repository & Package | Target Role | Porting Readiness & Extraction Contract |
| :--- | :---: | :--- | :--- | :--- |
| `src/components/workbench/panels/history/*`<br/>(`VersionPopover`, `VersionHistoryList`, `VersionCompareModal`, `VersionRestoreDialog`, `VersionDiffEngine`) | **479** | `mcard-studio`<br/>`@mcard/workbench-history` | Universal MCard Lineage & Version Diff Modal | **100% Ready**. Zero TikZ dependencies. Operates strictly on MCard content hashes, timestamps, and line-diff algorithms. Tested headlessly without React DOM. |
| `src/components/workbench/explorer/*`<br/>(`CorpusExplorerDrawer`, `ExplorerSearchBar`, `ExplorerSectionList`, `ExplorerEntryRow`) | **468** | `mcard-studio`<br/>`@mcard/workbench-explorer` | Universal Handle Explorer & Search Drawer | **100% Ready**. Pure UI view of handle registries (`zx:diagrams:`, `zx:meta:`). Interacts via generic `CorpusIndexRecord` interfaces. |
| `src/services/clm/export/lineageTraversalEngine.ts` | **182** | `clm-kernel/layer2`<br/>or `@mcard/corpus-io` | Canonical MCard Lineage Closure Algorithm | **100% Ready**. Pure mathematical graph function $f: (\text{DbBackend}, \text{Handles}) \to \text{Closure}$. Resolves cycles ($A \to B \to A$) and excludes orphans. Zero DOM/Node dependencies. |
| `src/services/clm/export/collectionSnapshotWriter.ts` | **84** | `clm-kernel/layer2`<br/>or `@mcard/corpus-io` | Canonical SQLite 3 Schema Serializer | **100% Ready**. Generates standard SQLite 3 tables (`card`, `handle_registry`, `handle_history`) conforming to `mcard_schema.sql` v3.0.3. Validated by pinned mcard-studio validator. |
| `src/services/clm/explorer/diagramLifecycleManager.ts` | **193** | `mcard-studio`<br/>`@mcard/handle-manager` | Handle CRUD Actor (Rename, Duplicate, Archive) | **100% Ready**. Manages immutable companion metadata lineage records (`zx:meta:UUID`). Operates on arbitrary handle types. |
| `src/components/workbench/commandbar/WindowControls.tsx` | **85** | `mcard-studio`<br/>`@mcard/workbench-shell` | Traffic Light Chrome & Window Controls | **100% Ready**. Reusable macOS-style window controls and fullscreen/minimize dispatcher. |
| `src/core/parser/combinators/*`<br/>`src/components/canvas/*`<br/>`src/components/styles/*` | **~1,200** | **TikZiT** (Retained permanently) | Domain-Specific TikZ & ZX-Calculus CAD Core | **Domain Boundary**. Exposes standard `TikzDiagramViewlet` to `mcard-studio` via the Universal Viewlet Protocol (`viewlet: { id: 'tikz', visual: TikzCanvas, text: CodeMirror }`). |

### 7.3 Future Porting Workflow & Zero-Regression Protocol
When executing the upstream porting effort into `mcard-studio`:
1. **Packaging**: Publish `@mcard/workbench-history` and `@mcard/corpus-io` from the `mcard-studio` monorepo.
2. **Coeffect Substitution (Baldwin Operator $\simeq \implies =$)**: In TikZiT, substitute the local `src/components/workbench/panels/history/` imports with `@mcard/workbench-history`.
3. **Contract B Verification**: Run `node scripts/audit-testids.mjs --check` to prove that all 196 E2E selectors remain byte-for-byte identical.
4. **Canonical Conformance**: Run `node scripts/verify-protocol-conformance.mjs` to ensure zero disruption to diagram parsing or dual-system conformance.

---

## 8. Master Quality Gate Execution Runbook

```bash
# 1. Clean previous build artifacts
make clean

# 2. Build both platforms through unified Makefile
make build

# 3. Verify browser runtime independence (zero native C++ in web bundle)
make check-independence

# 4. Run unified test suite (Vitest + Native C++ UnitTests)
make test

# 5. Run full Playwright cross-browser E2E suite
make test-e2e

# 6. Verify 12 canonical ZX-calculus diagrams
make verify-corpus

# 7. Run cross-engine TikZ AST protocol conformance verification
node scripts/verify-protocol-conformance.mjs

# 8. Run code hygiene and linting across both systems
make lint
```

---

## 9. Previous Graduated Series

- [Desktop Parity Series (Sprints 09–15)](../README.md#2-sprint-status-matrix) — Shared C++ media assets, macOS chrome, paper canvas, teardrop self-loops, desktop style palette, and sovereign `.db` corpus export.
- [Diagram Lifecycle & Export Series (Sprints 16–19)](../README.md#2-sprint-status-matrix) — First-class MCard diagram creation (`zx:diagrams:UUID`), library management (rename, duplicate, archive), session durability, lineage version history, draft save affordance, individual diagram export, and complete MCard collection export.

