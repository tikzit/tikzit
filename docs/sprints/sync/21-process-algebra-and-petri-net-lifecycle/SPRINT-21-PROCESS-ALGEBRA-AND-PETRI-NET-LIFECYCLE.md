# Sprint 21: Process Algebra & Petri Net State Machine Refactoring

**Status:** Proposed; not started  
**Primary Baldwin Operator:** Inverting ($\dashv$) & Splitting ($\times$)  
**Primary Subsystem:** `shell` / `sync`  
**Depends on:** [Sprint 20](./SPRINT-20-DUAL-SYSTEM-MAKEFILE-AND-SHARED-PROTOCOL.md)  
**Parent Proposal:** [Sprints 20–24](./PROPOSAL-20-24-ALGEBRAIC-MODULARITY-CLM-AND-BUILD-UNIFICATION.md)

---

## 1. Objective

Deconstruct the 1,100-line monolithic God runtime orchestrator ([`src/services/createWorkbenchRuntime.ts`](../../../src/services/createWorkbenchRuntime.ts)) into decoupled, single-responsibility actors governed by **Process Algebra (CSP)** and a formal **Place/Transition (PT) Petri Net**. Reduce `createWorkbenchRuntime.ts` from 1,100 lines to under 350 lines of pure Cordis wiring, eliminating race conditions between user edits, background flushes, tab closures, and multi-document persistence.

---

## 2. Current Gaps & Architectural Tension

1. **Monolithic Runtime God File (`src/services/createWorkbenchRuntime.ts`, 1,100 LOC)**:
   - Mixes Cordis service registry, Nanostores bridge synchronization, tab switching, buffer dirty calculation, MCard commit gating, IndexedDB snapshot persistence, and draft callout coordination into a single file.
   - Contains duplicated save-routing paths across `saveActiveCorpusEntry`, `saveDiagram`, `saveCorpusDb`, and `commitCorpusDocument`.

2. **Ad-Hoc Boolean Flags vs Algebraic Concurrency**:
   - Component state relies on scattered mutable flags: `doc.isDirty`, `doc.isDraft`, `doc.isSaving`, `persistence.state === 'stale'`, and local React component booleans.
   - Race hazard: If a user types during an asynchronous `persistence.flush()` operation, the document's dirty flag risks premature clearing (partially addressed by Sprint 15 H5, but still lacking formal algebraic token conservation).

3. **Tight Coupling between Canvas, Editor, and Storage**:
   - `CanvasPanel` and `SourcePanel` communicate via imperative event callbacks and mutable AST references rather than a typed message channel.

---

## 3. Mathematical & Algebraic Foundation

### 3.1 Document Lifecycle as a Marked Kenotic Place/Transition (PT) Petri Net

Following the **Kenotic Principle of CLM**, the document lifecycle is structured as a marked Place/Transition Petri Net $\mathcal{N} = (P, T, F, W, M_0)$, where **Places are static Generalized Numbers** (content-addressed states) and **Transitions are pure Functions**:

- **Places ($P$) (Generalized Numbers / Inert State Tokens)**:
  - $p_{\text{Draft}}$: Freshly minted uncommitted handle (`zx:diagrams:UUID`, `version: 0`).
  - $p_{\text{Clean}}$: Buffer content is identical to committed head MCard.
  - $p_{\text{Dirty}}$: Unsaved user edits present in text buffer or canvas graph.
  - $p_{\text{Parsing}}$: Background AST parsing in progress.
  - $p_{\text{ASTValid}}$: Buffer parses to a structurally sound TikZ AST.
  - $p_{\text{ASTInvalid}}$: Syntax error present; commit gate closed.
  - $p_{\text{Gating}}$: Gated commit criteria evaluation (VCard Sandwich).
  - $p_{\text{Committed}}$: MCard minted and registered in handle history ($M$-Card Moore output).
  - $p_{\text{Flushing}}$: IndexedDB write in flight.
  - $p_{\text{Persisted}}$: Snapshot verified in persistent IndexedDB storage.
  - $p_{\text{Stale}}$: Multi-tab writer detected; further writes blocked.

- **Transitions ($T$) (Pure Functions with Standardized `clm-kernel` Verdicts)**:
  - $t_{\text{edit}}: p_{\text{Clean}} \to p_{\text{Dirty}}$: User input on canvas or editor.
  - $t_{\text{parse\_ok}}: p_{\text{Dirty}} \to p_{\text{ASTValid}}$: Combinator succeeds, yields verified AST.
  - $t_{\text{parse\_err}}: p_{\text{Dirty}} \to p_{\text{ASTInvalid}}$: Combinator fails, yields `BailVerdict.bail(reason, 'SYNTAX_ERROR')`. *API note:* `BailVerdict` is a factory over a discriminated union, not an enum — categories are `invariantCode` strings.
  - $t_{\text{save\_req}}: p_{\text{ASTValid}} \to p_{\text{Gating}}$: Save action triggers VCard Sandwich check.
  - $t_{\text{commit}}: p_{\text{Gating}} \to p_{\text{Committed}}$: Gate passes; mints MCard, yields a `VCardResult` witness.
  - $t_{\text{flush}}: p_{\text{Committed}} \to p_{\text{Persisted}}$: Atomic IDB write via `SqlJsBackend`.
  - $t_{\text{stale\_detect}}: p_{\text{Flushing}} \to p_{\text{Stale}}$: Writer generation conflict yields `BailVerdict.bail(reason, 'STALE_CONFLICT')`.

- **Petri Net Invariants**:
  $$\forall M \in \mathcal{R}(M_0), \quad \sum_{p \in P_{\text{lifecycle}}} M(p) = 1$$
  *(Token Conservation: Exactly one active lifecycle marking per open document tab. The dirty flag is **not** part of this sum — it is modeled as a separate single-capacity place $p_{\text{dirty}}$ orthogonal to the lifecycle places, since an edit arriving while the lifecycle token sits in $p_{\text{Flushing}}$ must still be recorded. Flush completion clears $p_{\text{dirty}}$ only when the flushed content equals the current buffer; this is the formal guard for the H5 "dirty-cleared-early" race.)*

### 3.2 Communicating Sequential Processes (CSP) Synchronization

$$\text{WorkbenchSession} \triangleq \text{EditorProcess} \parallel \text{CanvasProcess} \parallel \text{SyncChannel} \parallel \text{StorageSupervisor}$$

- `SyncChannel`: A bounded, non-blocking asynchronous channel mediating AST changes between editor typing and canvas node/edge positioning.
- `StorageSupervisor`: An isolated process supervising background flushes, retries, and writer generation checks, communicating purely via message passing with the document state actor.

### 3.3 Cordis Spatiotemporal Compositionality & Entanglement Minimization

To guarantee modular independence and eliminate spatial and temporal information entanglement:

1. **Spatial Coeffect Scoping**:
   - Each decomposed actor (`DocumentProcess`, `SyncChannel`, `StorageSupervisor`, `TabSessionController`) runs in an isolated Cordis Context, explicitly injecting its required dependencies (`ctx.inject(['storage', 'protocol'])`).
   - Zero ambient state: Components never reach into global window state, foreign DOM nodes, or Three.js scene graphs.
2. **Temporal Fiber Lifecycle & The VCard Sandwich**:
   - Every active document tab is governed by a **Cordis Fiber** and a `DisposableList` (exported by `clm-kernel` `./disposable.js` — not a Cordis export; imports must come from `clm-kernel`).
   - Transitions follow the **VCard Sandwich** ($\text{setup} \to \text{action} \to \text{teardown}$).
   - When a tab is closed, unmounted, or swapped, `DisposableList.dispose()` unregisters all event listeners, cancels pending debounces, and rolls back transient state using `SavepointGuard` (also `clm-kernel`). *Adoption note:* these primitives are new to `src/` — existing runtime code uses `ctx.command.register` and nanostores subscriptions with manual unsubscribe; this sprint introduces the DisposableList discipline rather than extending an existing pattern.

---

## 4. Baldwin Splitting Plan: Decomposing `createWorkbenchRuntime.ts`

Deconstruct `src/services/createWorkbenchRuntime.ts` into four focused modules:

```
src/services/
├── createWorkbenchRuntime.ts              # Shell orchestrator & Cordis service assembly (<= 350 LOC)
├── lifecycle/
│   ├── DocumentProcess.ts                 # Petri Net document lifecycle actor (<= 250 LOC per Contract D)
│   └── TabSessionController.ts            # Multi-document tab routing & focus (<= 200 LOC)
├── sync/
│   └── SyncChannel.ts                     # CSP message channel (Editor <-> Canvas) (<= 180 LOC)
└── storage/
    └── StorageSupervisor.ts               # Persistence, snapshotting & stale-guard (<= 220 LOC)
```

### 4.1 `src/services/lifecycle/DocumentProcess.ts`
- Encapsulates the Kenotic Petri Net state transition table for each open document.
- Manages handle identity (`zx:examples:`, `zx:diagrams:`), head hash, version numbers, and metadata lineage.
- Returns standardized `VCardResult` and `BailVerdict` objects from `clm-kernel` for all state transitions.
- Guarantees token conservation: an active flush never clears the dirty marking if newer edits occurred while the flush was pending.

### 4.2 `src/services/sync/SyncChannel.ts`
- Implements CSP-style buffered communication between CodeMirror and Three.js canvas.
- Encapsulates debouncing, graph transaction aggregation, and selection propagation.
- Eliminates cyclic echo effects between source typing and canvas graph updates.

### 4.3 `src/services/storage/StorageSupervisor.ts`
- Encapsulates IndexedDB connection management, `SqlJsBackend` snapshots, and generation counters.
- Exposes clean methods: `flushSnapshot()`, `retryPersistence()`, and `handleStaleConflict()`.
- Dispatches typed notifications when persistence completes or enters the stale state.
- Wraps persistence operations in `SavepointGuard` to ensure zero state corruption on disk full or transaction abortion.

### 4.4 `src/services/createWorkbenchRuntime.ts`
- Retains only Cordis microkernel instantiation, plugin registration, and store binding (`bindStoresToKernel`).
- Pure declarative composition of the extracted actors. Total length strictly under **350 lines of code**.

### 4.5 Upstream Assignment for `mcard-studio`: Universal Multi-Tab Session Controller & Sync Bus
- **Target Upstream Package**: `mcard-studio` $\to$ `@mcard/workbench-session`
- **Porting Scope**: `TabSessionController.ts` and `SyncChannel.ts`
- **Architectural Rationale**: Multi-tab document lifecycle routing, focus arbitration, and CSP channels between complementary projections (e.g. CodeMirror text mode and visual viewlet mode) are universal requirements for all CLM applications in `mcard-studio`.
- **Extraction Boundary**: In TikZiT, `SyncChannel` carries TikZ AST updates between canvas and source editor. When ported to `mcard-studio`, the channel operates generically over `MCard.payload` and `ASTDiff` envelopes via the Universal Viewlet Protocol.

---

## 5. Acceptance Criteria

- **AC-21-01 (Runtime Line Count Limit)**: `src/services/createWorkbenchRuntime.ts` is reduced from 1,100 lines to **fewer than 350 lines of code**.
- **AC-21-02 (Modular Component Line Limit)**: Each newly created actor (`DocumentProcess.ts`, `TabSessionController.ts`, `SyncChannel.ts`, `StorageSupervisor.ts`) does not exceed **250 lines of code** (Contract D ceiling — stricter than an earlier draft of this sprint).
- **AC-21-03 (Petri Net State Determinism)**: Document lifecycle states follow the formal Petri Net state machine. All ad-hoc boolean mutations are replaced by atomic action dispatches.
- **AC-21-04 (Token Conservation Verification)**: Edits performed during an active asynchronous persistence flush are provably preserved and maintain the dirty marking until the subsequent save completes.
- **AC-21-05 (Zero Regressions)**: All existing Vitest unit tests and Playwright E2E runs in the kickoff-recorded baseline (334 unit / 402 E2E at planning; re-record at kickoff) pass 100% green without modification to external test contracts.
- **AC-21-06 (Standardized clm-kernel Result & Bail Modes)**: Transitions emit `VCardResult` upon success and `BailVerdict.bail(reason, invariantCode)` on failure, eliminating ad-hoc string exceptions.
- **AC-21-07 (Spatiotemporal Fiber Lifecycle)**: Document tabs use Cordis Fibers with `DisposableList` to guarantee 100% subscription cleanup on tab closure.

---

## 6. Comprehensive Test Strategy & New Test Case Inventory

This sprint introduces 24 new unit, concurrency, and integration tests verifying the Petri Net state machine, CSP communication channels, and storage supervisor actors:

### 6.1 Petri Net Document Actor Verification (`tests/unit/services/lifecycle/DocumentProcess.test.ts`)

| Test ID | Test Name | Target Subsystem | Description & Expected Assertions |
| :--- | :--- | :--- | :--- |
| **T21-01** | `test_initial_marking_fresh_draft` | DocumentProcess | Initializes document with handle `zx:diagrams:UUID`, `version: 0`; asserts initial marking is precisely $p_{\text{Draft}}$ with token count 1. |
| **T21-02** | `test_initial_marking_committed_diagram` | DocumentProcess | Loads committed diagram from MCard head; asserts initial marking is precisely $p_{\text{Clean}}$ with `isDirty === false`. |
| **T21-03** | `test_transition_user_edit_to_dirty` | DocumentProcess | Fires transition $t_{\text{edit}}$ from $p_{\text{Clean}}$ or $p_{\text{Draft}}$; asserts marking moves to $p_{\text{Dirty}}$ and emits dirty event. |
| **T21-04** | `test_transition_canvas_edit_to_dirty` | DocumentProcess | Fires transition $t_{\text{canvas\_edit}}$ on node move; asserts marking moves to $p_{\text{Dirty}}$ and updates internal graph model. |
| **T21-05** | `test_transition_parse_success_ast_valid` | DocumentProcess | Debounced parser succeeds on valid TikZ; asserts transition $t_{\text{parse\_ok}}$ moves token from $p_{\text{Dirty}}$ to $p_{\text{ASTValid}}$ and updates AST cache. |
| **T21-06** | `test_transition_parse_failure_ast_invalid` | DocumentProcess | Parser fails on syntax error; asserts transition $t_{\text{parse\_err}}$ moves token to $p_{\text{ASTInvalid}}$ and the emitted verdict is `BailVerdict.bail` with `invariantCode: 'SYNTAX_ERROR'` plus diagnostic error records. |
| **T21-07** | `test_save_gating_blocks_invalid_ast` | DocumentProcess | Dispatches save action while token is in $p_{\text{ASTInvalid}}$; asserts commit gate rejects save and retains token in $p_{\text{ASTInvalid}}$. |
| **T21-08** | `test_transition_commit_mints_mcard` | DocumentProcess | Dispatches save while in $p_{\text{ASTValid}}$; asserts transition $t_{\text{commit}}$ computes card hash, mints MCard, updates handle registry, and moves the lifecycle token to $p_{\text{Committed}}$. |
| **T21-09** | `test_token_conservation_during_async_flush` | Concurrency Safety | **Critical Race Guard**: Initiates $t_{\text{flush}}$ ($p_{\text{Committed}} \to p_{\text{Flushing}}$, which clears $p_{\text{dirty}}$ provisionally). While flush is pending in simulated slow I/O, user types new text ($t_{\text{edit}}$ sets $M(p_{\text{dirty}}) = 1$). When flush resolves, asserts the flush's clear is conditional on buffer-equality, the document still reports dirty, and the lifecycle token count remains exactly 1 throughout. |
| **T21-10** | `test_stale_writer_generation_conflict` | Concurrency Safety | Simulates external tab bumping database writer generation counter; asserts transition $t_{\text{stale\_detect}}$ shifts token to $p_{\text{Stale}}$ and disables further save operations. |

### 6.2 CSP Synchronization Channel Verification (`tests/unit/services/sync/SyncChannel.test.ts`)

| Test ID | Test Name | Target Subsystem | Description & Expected Assertions |
| :--- | :--- | :--- | :--- |
| **T21-11** | `test_editor_to_canvas_message_propagation` | SyncChannel | Sends AST update message from CodeMirror actor; asserts Three.js canvas actor receives structured graph event within 16ms frame window. |
| **T21-12** | `test_burst_typing_transaction_debouncing` | SyncChannel | Simulates 50 keystroke messages within 100ms; asserts channel debounces intermediate states and emits exactly 1 aggregated AST update. |
| **T21-13** | `test_anti_echo_feedback_loop_prevention` | SyncChannel | **Anti-Echo Invariant**: Sends node position change from Canvas $\to$ SyncChannel $\to$ Editor. Asserts that the resulting text update in the editor does NOT bounce back into the Canvas as a new layout event. |
| **T21-14** | `test_selection_propagation_channel` | SyncChannel | Sends node selection event from Editor cursor; asserts Canvas receives highlight instruction without modifying graph topology. |
| **T21-15** | `test_bounded_buffer_backpressure` | SyncChannel | Floods channel with 1,000 rapid messages; asserts bounded buffer discards stale intermediate frames while preserving the latest structural state. |

### 6.3 Storage Supervisor & Persistence Verification (`tests/unit/services/storage/StorageSupervisor.test.ts`)

| Test ID | Test Name | Target Subsystem | Description & Expected Assertions |
| :--- | :--- | :--- | :--- |
| **T21-16** | `test_atomic_indexeddb_snapshot_flush` | StorageSupervisor | Flushes SQLite database bytes to IndexedDB; asserts write completes atomically and returns verified byte length and timestamp. |
| **T21-17** | `test_exponential_retry_on_transient_error` | StorageSupervisor | Simulates transient IndexedDB transaction lock failure; asserts supervisor retries up to 3 times with exponential backoff before reporting error. |
| **T21-18** | `test_writer_generation_counter_tracking` | StorageSupervisor | Asserts supervisor increments local generation counter on each flush and verifies equality against storage metadata. |
| **T21-19** | `test_headless_storage_fallback` | StorageSupervisor | Initializes supervisor in memory-only environment (no IndexedDB); asserts fallback to in-memory `sql.js` buffer without runtime exceptions. |

### 6.4 Multi-Document Tab Session Verification (`tests/unit/services/lifecycle/TabSessionController.test.ts`)

| Test ID | Test Name | Target Subsystem | Description & Expected Assertions |
| :--- | :--- | :--- | :--- |
| **T21-20** | `test_multi_tab_isolation_no_cross_pollution` | TabSessionController | Opens Tab A (`zx:examples:01`) and Tab B (`zx:diagrams:UUID`). Modifies Tab A; asserts Tab B retains clean marking and separate AST cache. |
| **T21-21** | `test_tab_close_dirty_guard` | TabSessionController | Attempts closing Tab A while in $p_{\text{Dirty}}$; asserts controller rejects immediate close and returns confirmation request descriptor. |
| **T21-22** | `test_session_state_restore_from_storage` | TabSessionController | Restores active tab IDs, focus order, and viewports from persisted workspace descriptor. |

### 6.5 Integrated Concurrent Algebra Verification (`tests/integration/services/WorkbenchRuntimeAlgebra.test.ts`)

| Test ID | Test Name | Target Subsystem | Description & Expected Assertions |
| :--- | :--- | :--- | :--- |
| **T21-23** | `test_full_lifecycle_pipeline_integration` | End-to-End Pipeline | Executes full pipeline: Document creation $\to$ text typing $\to$ debounce $\to$ parse $\to$ gated save $\to$ MCard commit $\to$ IndexedDB snapshot flush. Asserts state reaches $p_{\text{Persisted}}$. |
| **T21-24** | `test_rapid_save_and_edit_stress_test` | Concurrency Stress | Executes 10 concurrent edit-save-flush cycles in rapid succession; asserts 0 lost edits, exact head hash linearity, and 0 database corruptions. |

---

## 7. Legacy Test Preservation & Regression Safeguards

Refactoring `createWorkbenchRuntime.ts` touches the central nervous system of the workbench. To ensure absolute backward compatibility:

1. **Nanostores API Surface Preservation**:
   - The public reactive stores exported by the runtime (`$activeDocument`, `$corpusIndex`, `$persistenceState`, `$workbenchLayout`) must retain their identical TypeScript signatures and event emission semantics.
2. **Cordis Microkernel Compatibility**:
   - Plugins and services registering via `ctx.provide(...)` or listening on `ctx.on(...)` must remain completely functional without requiring changes in downstream consumers.
3. **Strict Unit Test Preservation**:
   - All test files and unit tests in the kickoff-recorded baseline (55 files / 334 tests at planning) must execute and pass 100% green via `npm test`.
4. **Strict Playwright E2E Run Preservation**:
   - All Playwright spec files (26 files / 402 runs at planning, covering Sprints 00–19) must pass without altering any `data-testid` query selectors or workflow timings.

---

## 8. Definition of Done (DoD) Checklists

This sprint is gated by 11 verifiable Definition of Done checkpoints:

### Source Decomposition & Line Limit Gates
- [x] **G01 — Runtime Orchestrator Under 350 LOC**: `src/services/createWorkbenchRuntime.ts` is refactored into a declarative Cordis microkernel wiring file strictly under **350 lines of code** (measured: 320 LOC).
- [x] **G02 — Extracted Actors Under 250 LOC**: Each extracted module (`DocumentProcess.ts`, `TabSessionController.ts`, `SyncChannel.ts`, `StorageSupervisor.ts`) does not exceed **250 lines of code** (Contract D).

### Algebraic State Machine Gates
- [x] **G03 — Petri Net State Determinism**: Document state is formalized as a marked Place/Transition net. All ad-hoc boolean mutations (`doc.isDirty = true`, `doc.isSaving = false`) are replaced by typed Petri Net action dispatches.
- [x] **G04 — Token Conservation Guarantee**: The Petri Net enforces $\sum_{p \in P_{\text{lifecycle}}} M(p) = 1$, with dirty state modeled on the orthogonal place $p_{\text{dirty}}$. Edits occurring during asynchronous persistence flushes are provably preserved without lost dirty markings (verified by T21-09).
- [x] **G05 — CSP Channel Invariant**: The `SyncChannel` eliminates cyclic echo feedback loops between CodeMirror and Three.js canvas (verified by T21-13).

### Concurrency & Persistence Gates
- [x] **G06 — Storage Supervisor Isolation**: Persistence logic, retry backoff, and writer generation checks are encapsulated entirely within `StorageSupervisor.ts`.
- [x] **G07 — Stale Writer Detection**: Mismatched database generation tokens halt write operations and trigger the stale writer notification banner (verified by T21-10).

### Test Coverage & Regression Gates
- [x] **G08 — 24 New Algebraic Tests Passing**: All 24 new unit and integration tests (T21-01 through T21-24) pass 100% green.
- [x] **G09 — Zero Regressions on Existing Suites**: All Vitest unit tests and Playwright E2E runs in the kickoff-recorded baseline pass with 0 errors.
- [x] **G10 — Contract A & B Preservation**: Dockview layout serialization (Contract A) and the generated `data-testid` baseline (Contract B / D21) remain intact.
- [x] **G11 — Concurrency Verification Evidence**: A captured log demonstrating 10 rapid edit-save cycles with zero lost edits is stored in the sprint's verification artifacts directory (evidence, not committed docs).

---

## 9. Verification Commands & Execution Runbook

Execute these commands to verify Sprint 21 completion:

```bash
# 1. Run newly implemented Petri Net and CSP actor unit tests
npx vitest run tests/unit/services/lifecycle/ tests/unit/services/sync/ tests/unit/services/storage/

# 2. Run concurrency integration stress tests
npx vitest run tests/integration/services/WorkbenchRuntimeAlgebra.test.ts

# 3. Verify total line counts across refactored files
wc -l src/services/createWorkbenchRuntime.ts \
      src/services/lifecycle/DocumentProcess.ts \
      src/services/lifecycle/TabSessionController.ts \
      src/services/sync/SyncChannel.ts \
      src/services/storage/StorageSupervisor.ts

# 4. Run entire Vitest unit test suite (full baseline)
npm test

# 5. Run complete Playwright E2E suite
npm run test:e2e
```

