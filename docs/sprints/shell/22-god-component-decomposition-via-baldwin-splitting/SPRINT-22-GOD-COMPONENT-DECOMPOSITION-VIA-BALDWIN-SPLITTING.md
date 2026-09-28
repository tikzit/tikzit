# Sprint 22: God-Component Decomposition via Baldwin Splitting

**Status:** Proposed; not started  
**Primary Baldwin Operator:** Splitting ($\times$) & Augmenting ($+$)  
**Primary Subsystem:** `interactions` / `styles` / `preview` / `shell`  
**Depends on:** [Sprint 21](./SPRINT-21-PROCESS-ALGEBRA-AND-PETRI-NET-LIFECYCLE.md)  
**Parent Proposal:** [Sprints 20–24](./PROPOSAL-20-24-ALGEBRAIC-MODULARITY-CLM-AND-BUILD-UNIFICATION.md)

---

## 1. Objective

Apply Carliss Baldwin's **Splitting Operator** ($\mathcal{B}_{\text{split}}$) and the **Kenotic Principle of CLM** to decompose four monolithic user-interface "God components" that exceed the project's 450-line complexity ceiling:
- [`src/components/workbench/panels/VersionPopover.tsx`](../../../src/components/workbench/panels/VersionPopover.tsx) (**739 lines**)
- [`src/components/workbench/panels/PreviewPanel.tsx`](../../../src/components/workbench/panels/PreviewPanel.tsx) (**605 lines**)
- [`src/components/workbench/CorpusExplorerDrawer.tsx`](../../../src/components/workbench/CorpusExplorerDrawer.tsx) (**572 lines**)
- [`src/components/workbench/WorkbenchCommandBar.tsx`](../../../src/components/workbench/WorkbenchCommandBar.tsx) (**472 lines**)

Refactor each into cohesive, single-responsibility sub-components strictly bounded to **$\le 250$ lines of code**. Empty each component of ambient mutable state, extract computation into pure mathematical **Functions**, govern user transitions with standardized `clm-kernel` verdicts (`VCardResult`, `BailVerdict.bail(reason, invariantCode)` — a factory + union, not an enum), and manage interactive lifecycles via `clm-kernel`'s `DisposableList` to eliminate information entanglement while guaranteeing 100% preservation of Contract B selectors.

This sprint also authors the Contract B tooling: **`scripts/audit-testids.mjs`** scans `src/` (literals *and* dynamic-template prefixes) and writes `docs/testing/testid-baseline.json`; the committed baseline is diffed on every run so selector changes are deliberate, reviewable diffs rather than silent drift.

---

## 2. Current Gaps & Architectural Tension

1. **`VersionPopover.tsx` (739 LOC)**:
   - Amalgamates timeline listing, diff stat delta calculations ($+N / -M$ vertices and edges), side-by-side visual compare panels, two confirmation dialogs (restore confirmation, dirty save-first prompt), and direct store event subscriptions.
   - Code changes to diff rendering risk destabilizing restore confirmation logic or popover positioning.

2. **`PreviewPanel.tsx` (605 LOC)**:
   - Mixes React SVG viewport layout, pan/zoom wheel and pointer interaction state, TeX compilation simulation, TikZ syntax re-rendering, error banner display, and standalone export triggers.
   - Rendering and compilation logic are coupled to React DOM life-cycles, preventing headless re-use in automated testing.

3. **`CorpusExplorerDrawer.tsx` (572 LOC)**:
   - Mixes debounced search text input, archived-item visibility toggles, sectioned list grouping (Drafts, User Diagrams, Seeded Examples), inline renaming text fields with key listeners (Enter/Escape), and contextual overflow action menus.

4. **`WorkbenchCommandBar.tsx` (472 LOC)**:
   - Combines document title editing, dirty state observation, Draft vs Diagram mode badges, Save button variants (`btn-save-draft` vs `btn-save-diagram`), layout reset buttons, tabs management dropdowns, and theme toggling.

---

## 3. Detailed Baldwin Splitting & Kenotic Decoupling Plans

### 3.1 Decomposition of `VersionPopover.tsx` (739 $\to$ 5 focused modules)

```
src/components/workbench/panels/history/
├── VersionHistoryList.tsx        # Pure presentation of version timeline rows & copy buttons (<= 200 LOC)
├── VersionDiffEngine.ts          # Pure mathematical delta & AST diff computation function (<= 160 LOC)
├── VersionCompareModal.tsx       # Side-by-side visual compare & source diff view (<= 180 LOC)
├── VersionRestoreDialog.tsx      # Confirmation and Save-first dialogs with BailVerdict (<= 130 LOC)
└── VersionPopover.tsx            # Lightweight popover positioning & coordinating container (<= 120 LOC)
```

- **`VersionDiffEngine.ts` (Pure Kenotic Function)**: A pure mathematical function $f_{\text{diff}}: (\text{AST}_A, \text{AST}_B) \to \text{DiffReport}$. Accepts two immutable AST snapshots and returns `{ nodeDelta, edgeDelta, changedProperties, diffLines }`. 100% headless, zero React or DOM dependencies.
- **`VersionRestoreDialog.tsx` (Petri Net Transition)**: Models the restore decision as a formal Petri Net choice: confirming fires $t_{\text{restore}}$ returning a `VCardResult` witness, while cancelling returns `BailVerdict.bail('User cancelled restore', 'CANCELLED')`.
- **`VersionHistoryList.tsx`**: Pure functional rendering of timeline rows with positions, authors, formatted ISO dates, and commit labels.
- **`VersionCompareModal.tsx`**: Presents non-destructive visual comparison with scoped `DisposableList` key listeners (Escape to dismiss).
- **Dual-path preservation (verified)**: `VersionPopover` already branches `isMCard` — MCard lineage via `runtime.documentHistory(documentId)` and preview/compare via `runtime.mcardCollection`, versus legacy `DocumentStore` revisions (`savepoint`, `restoreRevision`) for non-MCard documents. Extraction must keep both paths behavior-identical; the legacy branch's fate is decided in Sprint 23, not here.

### 3.2 Decomposition of `PreviewPanel.tsx` (605 $\to$ 4 focused modules)

```
src/components/workbench/panels/preview/
├── PreviewStage.tsx              # Pure SVG viewport, pan/zoom transform matrix & render (<= 220 LOC)
├── PreviewToolbar.tsx            # Zoom In/Out, 100%, Fit-to-Page, and Copy TikZ actions (<= 120 LOC)
├── PreviewCompiler.ts            # Pure compilation function AST -> SVG (<= 180 LOC)
└── PreviewPanel.tsx              # Dockview panel container orchestrating state (<= 130 LOC)
```

- **`PreviewCompiler.ts` (Pure Kenotic Function)**: Pure functional transformation $f_{\text{svg}}: (\text{Graph}, \text{StyleCatalog}) \to \text{Result}\langle\text{SVGNodes}, \text{BailVerdict}\rangle$. Decouples geometry and Bézier math from React component rendering. Malformed TikZ source yields `BailVerdict.bail(reason, 'SYNTAX_ERROR')` with diagnostic banner data.
- **`PreviewStage.tsx`**: Pure interactive canvas handling SVG pan, pinch, and zoom transformations. Uses `DisposableList` to bind and cleanly unbind pointer and wheel listeners. Preserves the real selectors `preview-viewport` and `preview-svg-container` (not `preview-svg-stage`, which does not exist in the current code).

### 3.3 Decomposition of `CorpusExplorerDrawer.tsx` (572 $\to$ 4 focused modules)

```
src/components/workbench/explorer/
├── ExplorerSearchBar.tsx         # Search input with debounce and 'Show archived' toggle (<= 110 LOC)
├── ExplorerSectionList.tsx       # Grouped sections for Drafts, Diagrams, and Examples (<= 180 LOC)
├── ExplorerEntryRow.tsx          # Single row item, status badge, inline rename, and context menu (<= 160 LOC)
└── CorpusExplorerDrawer.tsx      # Drawer container orchestrating layout & service calls (<= 130 LOC)
```

- **`ExplorerEntryRow.tsx`**: Encapsulates inline rename keyboard handlers (`Enter` to save, `Escape` to cancel), type badge rendering, and overflow menu actions (Rename, Duplicate, Version History, Export, Archive). Uses `DisposableList` for cleanup.

### 3.4 Decomposition of `WorkbenchCommandBar.tsx` (472 $\to$ 3 focused modules)

```
src/components/workbench/commandbar/
├── DocumentTitleBar.tsx          # Document title, dirty '*' indicator, and amber Draft badge (<= 130 LOC)
├── DocumentActionButtons.tsx     # Save Draft/Diagram, Version History, and Export CTA buttons (<= 150 LOC)
└── WorkbenchCommandBar.tsx       # Top bar coordinator & utility menus (Layout, Theme) (<= 170 LOC)
```

- **`DocumentActionButtons.tsx`**: Encapsulates the save affordance transitions between Draft and Diagram modes, rendering `btn-save-draft` or `btn-save-diagram` with appropriate aria-labels and tooltips.

### 3.5 Upstream Assignment for `mcard-studio`: Universal MCard Lineage & Explorer Substrates
Under the cross-repository architectural boundary (D22), two major UI subsystems decomposed in this sprint are designated for future upstream migration to `mcard-studio`:

1. **Universal MCard Lineage & Diff Modal (`@mcard/workbench-history`)**:
   - **Constituents**: `VersionPopover.tsx`, `VersionHistoryList.tsx`, `VersionCompareModal.tsx`, `VersionRestoreDialog.tsx`, and `VersionDiffEngine.ts`.
   - **Universal Role**: Provides timeline navigation, cryptographic commit hash copying, side-by-side AST/text comparison, and transactional restoration for *any* MCard collection. It contains **zero TikZ-specific code**.
   - **Porting Strategy**: Extract to the `mcard-studio` monorepo. TikZiT will consume it as a dependency, injecting its active document handle and coeffects.

2. **Universal Handle Explorer & Search Drawer (`@mcard/workbench-explorer`)**:
   - **Constituents**: `CorpusExplorerDrawer.tsx`, `ExplorerSearchBar.tsx`, `ExplorerSectionList.tsx`, `ExplorerEntryRow.tsx`.
   - **Universal Role**: Provides search, grouping, filtering, inline renaming, archiving, and context actions across arbitrary MCard handle registries (`prefix:type:UUID`).
   - **Porting Strategy**: Extract to `@mcard/workbench-explorer`, allowing `mcard-studio` to provide a unified sidebar across all card types.

---

## 4. Cross-Sprint Selector Contract B Preservation Matrix

The **normative registry is generated**, not this table: `scripts/audit-testids.mjs` produces `docs/testing/testid-baseline.json` (196 literals + 5 dynamic prefixes at planning). The matrix below is a routing aid showing where the selectors *of the four split components* land after decomposition. Dynamic-template selectors are listed by their literal prefix.

| Selector (literal or prefix) | Original File | New Sub-Component Location |
| :--- | :--- | :--- |
| `[data-testid="btn-version-history"]` | `WorkbenchCommandBar.tsx` | `DocumentActionButtons.tsx` |
| `[data-testid="btn-save-draft"]`, `[data-testid="btn-save-diagram"]`, `[data-testid="btn-new-diagram"]` | `WorkbenchCommandBar.tsx` | `DocumentActionButtons.tsx` |
| `[data-testid="doc-tab-title"]`, `[data-testid="doc-type-badge"]`, `[data-testid="doc-save-status"]`, `[data-testid="status-save-state"]` | `WorkbenchCommandBar.tsx` | `DocumentTitleBar.tsx` |
| `[data-testid="version-popover"]`, `[data-testid="history-live-announcer"]`, `[data-testid="history-version-count"]` | `VersionPopover.tsx` | `VersionPopover.tsx` (container) |
| `[data-testid="history-head-hash"]`, `[data-testid="btn-copy-head-hash"]`, `[data-testid="savepoint-input"]`, `[data-testid="btn-create-savepoint"]` | `VersionPopover.tsx` | `VersionHistoryList.tsx` |
| `[data-testid^="version-row-"]`, `[data-testid="btn-restore-version"]`, `[data-testid="btn-preview-version"]`, `[data-testid="btn-compare-version"]`, `[data-testid="version-label"]`, `[data-testid="version-hash"]`, `[data-testid="version-timestamp"]`, `[data-testid="badge-current-version"]` | `VersionPopover.tsx` | `VersionHistoryList.tsx` |
| `[data-testid="history-compare-panel"]`, `[data-testid="compare-stat-deltas"]`, `[data-testid="compare-diff-view"]`, `[data-testid="btn-close-compare"]` | `VersionPopover.tsx` | `VersionCompareModal.tsx` |
| `[data-testid="history-preview-panel"]`, `[data-testid="preview-source-code"]`, `[data-testid="btn-close-preview"]` | `VersionPopover.tsx` | `VersionCompareModal.tsx` (or `VersionPreviewPanel` if split separately) |
| `[data-testid="restore-confirm-dialog"]`, `[data-testid="restore-dirty-dialog"]`, `[data-testid="btn-confirm-restore"]`, `[data-testid="btn-cancel-restore"]`, `[data-testid="btn-restore-save-first"]`, `[data-testid="btn-restore-discard"]`, `[data-testid="btn-restore-cancel"]` | `VersionPopover.tsx` | `VersionRestoreDialog.tsx` |
| `[data-testid="corpus-search-input"]`, `[data-testid="toggle-show-archived"]`, `[data-testid="btn-explorer-new-diagram"]`, `[data-testid="btn-export-collection"]` | `CorpusExplorerDrawer.tsx` | `ExplorerSearchBar.tsx` / drawer header |
| `[data-testid^="corpus-entry-"]`, `[data-testid^="entry-actions-"]`, `[data-testid^="badge-"]` (dynamic `badge-${type}`), `[data-testid="badge-archived"]`, `[data-testid="badge-imported"]`, `[data-testid="entry-version"]`, `[data-testid="row-export-diagram"]`, `[data-testid="input-rename-diagram"]`, `[data-testid="action-rename"]`, `[data-testid="action-duplicate"]`, `[data-testid="action-archive"]`, `[data-testid="action-unarchive"]` | `CorpusExplorerDrawer.tsx` | `ExplorerEntryRow.tsx` |
| `[data-testid="recovery-banner"]`, `[data-testid="btn-recovery-review"]`, `[data-testid="btn-recovery-discard"]`, `[data-testid="stale-reload-banner"]`, `[data-testid="btn-reload-window"]`, `[data-testid="empty-diagrams-card"]`, `[data-testid="btn-empty-state-new-diagram"]`, `[data-testid="corpus-persistence-state"]`, `[data-testid="live-announcer"]` | `CorpusExplorerDrawer.tsx` | `CorpusExplorerDrawer.tsx` (container) |
| `[data-testid="panel-preview"]`, `[data-testid="preview-viewport"]`, `[data-testid="preview-svg-container"]`, `[data-testid="preview-toast"]`, `[data-testid="preview-logs-drawer"]`, `[data-testid="preamble-modal"]` | `PreviewPanel.tsx` | `PreviewStage.tsx` / `PreviewPanel.tsx` container |
| `[data-testid="toggle-auto-compile"]`, `[data-testid="preview-status-badge"]`, `[data-testid^="btn-preview-"]`, `[data-testid="btn-copy-tikz"]`, `[data-testid="btn-export-dropdown"]`, `[data-testid="preview-export-menu"]`, `[data-testid^="btn-export-"]` | `PreviewPanel.tsx` | `PreviewToolbar.tsx` |

*Any selector discovered in the baseline but absent from this matrix still counts as Contract B-protected — the baseline file is authoritative.*

---

## 5. Acceptance Criteria

- **AC-22-01 (Strict 250 LOC Limit for Sub-Components)**: All newly extracted sub-components do not exceed **250 lines of code**.
- **AC-22-02 (Strict 200 LOC Limit for Containers)**: Parent coordinating components (`VersionPopover.tsx`, `PreviewPanel.tsx`, `CorpusExplorerDrawer.tsx`, `WorkbenchCommandBar.tsx`) do not exceed **200 lines of code**.
- **AC-22-03 (Selector Contract B Invariant)**: All Playwright E2E tests in `e2e/sprint-16/`, `e2e/sprint-16b/`, `e2e/sprint-17/`, `e2e/sprint-17b/`, `e2e/sprint-18/`, and `e2e/sprint-19/` pass without modifying selector queries, and `scripts/audit-testids.mjs` reports zero removed selectors versus `docs/testing/testid-baseline.json`.
- **AC-22-04 (Headless Diff Verification)**: `VersionDiffEngine.ts` is a pure function covered by dedicated unit tests asserting exact node and edge delta calculations without instantiating React components.
- **AC-22-05 (Pure Compilation Decoupling)**: `PreviewCompiler.ts` produces identical SVG DOM nodes across standalone testing and in-panel rendering, returning standardized `clm-kernel` diagnostic records on syntax error.
- **AC-22-06 (Spatiotemporal Cleanup via DisposableList)**: All interactive listeners (pan/zoom, keyboard shortcuts) are governed by `clm-kernel`'s `DisposableList` to guarantee 100% listener unregistration on unmount.
- **AC-22-07 (Generated Selector Registry)**: `scripts/audit-testids.mjs` is authored, generates the committed `docs/testing/testid-baseline.json`, fails on literal-selector removals, and records dynamic-prefix patterns (`badge-*`, `corpus-entry-*`, `entry-actions-*`, `tool-*`, `version-row-*`, `btn-preview-*`, `btn-export-*`) separately.

---

## 6. Comprehensive Test Strategy & New Test Case Inventory

This sprint introduces 28 new unit and headless component tests verifying the decomposed sub-components, headless diff algorithms, and SVG compilation math:

### 6.1 Headless History Diff Engine Verification (`tests/unit/components/history/VersionDiffEngine.test.ts`)

| Test ID | Test Name | Target Subsystem | Description & Expected Assertions |
| :--- | :--- | :--- | :--- |
| **T22-01** | `test_diff_vertex_additions_delta` | VersionDiffEngine | Compares AST $A$ (2 nodes) to AST $B$ (5 nodes); asserts `{ nodeDelta: 3, edgeDelta: 0, addedNodes: ['v2', 'v3', 'v4'] }`. |
| **T22-02** | `test_diff_vertex_deletions_delta` | VersionDiffEngine | Compares AST $A$ (4 nodes) to AST $B$ (2 nodes); asserts `{ nodeDelta: -2, edgeDelta: 0, removedNodes: [...] }`. |
| **T22-03** | `test_diff_edge_topology_and_style_changes` | VersionDiffEngine | Compares graphs with changed edge styles or bend angles; asserts exact delta detection and style property diff strings. |
| **T22-04** | `test_diff_identical_graphs_returns_zero` | VersionDiffEngine | Compares identical ASTs; asserts `{ nodeDelta: 0, edgeDelta: 0, hasDifferences: false }`. |
| **T22-05** | `test_diff_unified_line_generation` | VersionDiffEngine | Asserts generated unified diff lines format correctly with line prefixes (`+`, `-`, ` `) and syntax highlight tags. |

### 6.2 Headless Preview Compiler Verification (`tests/unit/components/preview/PreviewCompiler.test.ts`)

| Test ID | Test Name | Target Subsystem | Description & Expected Assertions |
| :--- | :--- | :--- | :--- |
| **T22-06** | `test_pure_svg_compilation_from_ast` | PreviewCompiler | Compiles canonical AST directly to SVG DOM nodes in headless Vitest; asserts root `<svg>` contains expected `<g>`, `<circle>`, and `<path>` children. |
| **T22-07** | `test_style_catalog_resolution` | PreviewCompiler | Applies `$stylesCatalog` rules (fill color, stroke width, dashed borders); asserts computed SVG presentation attributes match style definitions. |
| **T22-08** | `test_teardrop_loop_bezier_generation` | PreviewCompiler | Verifies cubic Bézier path data generation for self-loops ($in=135^\circ, out=45^\circ$); asserts path string matches expected SVG `d` syntax. |
| **T22-09** | `test_junction_node_svg_presentation` | PreviewCompiler | Asserts that junction nodes (`style=none`) compile to lavender ring `#B4B4DC` with center dot `#B4B4C8`. |
| **T22-10** | `test_syntax_error_diagnostic_generation` | PreviewCompiler | Passes malformed TikZ string; asserts compiler generates structured diagnostic banner with line and column markers. |

### 6.3 Version History Sub-Component Verification (`tests/unit/components/history/`)

| Test ID | Test Name | Target Subsystem | Description & Expected Assertions |
| :--- | :--- | :--- | :--- |
| **T22-11** | `test_history_list_row_rendering` | VersionHistoryList | Renders list with 5 commit entries; asserts rows render `[data-testid^="version-row-"]` with commit messages, dates, and author badges. |
| **T22-12** | `test_history_copy_head_hash_feedback` | VersionHistoryList | Clicks `btn-copy-head-hash`; asserts clipboard API is invoked and button displays checkmark confirmation icon for 2 seconds. |
| **T22-13** | `test_history_restore_button_emission` | VersionHistoryList | Clicks `btn-restore-version`; asserts `onRestoreRequested` callback emits selected commit hash. |
| **T22-14** | `test_compare_modal_side_by_side_layout` | VersionCompareModal | Mounts modal; asserts `history-compare-panel` renders both left (historic) and right (current) preview stages with `compare-stat-deltas`. |
| **T22-15** | `test_compare_modal_keyboard_close` | VersionCompareModal | Presses `Escape` key inside compare modal; asserts modal unmounts. |
| **T22-16** | `test_restore_confirm_dialog_clean_buffer` | VersionRestoreDialog | Opens restore dialog for clean buffer; asserts `restore-confirm-dialog` mounts with "Restore Version" primary button. |
| **T22-17** | `test_restore_dirty_dialog_save_first` | VersionRestoreDialog | Opens restore dialog for dirty buffer; asserts `restore-dirty-dialog` mounts with "Save & Restore" and "Discard & Restore" options. |

### 6.4 Preview Panel Sub-Component Verification (`tests/unit/components/preview/`)

| Test ID | Test Name | Target Subsystem | Description & Expected Assertions |
| :--- | :--- | :--- | :--- |
| **T22-18** | `test_preview_stage_pan_zoom_transform` | PreviewStage | Simulates wheel scroll and drag on `preview-viewport` (wrapping `preview-svg-container`); asserts SVG `<g>` transform matrix scales and translates smoothly. |
| **T22-19** | `test_preview_toolbar_actions` | PreviewToolbar | Clicks Zoom In, Zoom Out, 100%, and Fit-to-Page buttons; asserts appropriate transform dispatches. |

### 6.5 Explorer Drawer Sub-Component Verification (`tests/unit/components/explorer/`)

| Test ID | Test Name | Target Subsystem | Description & Expected Assertions |
| :--- | :--- | :--- | :--- |
| **T22-20** | `test_search_bar_debounced_filtering` | ExplorerSearchBar | Types search query into `corpus-search-input`; asserts filtering callback debounces by 300ms before triggering search index query. |
| **T22-21** | `test_search_bar_archived_toggle` | ExplorerSearchBar | Toggles `toggle-show-archived`; asserts archived visibility state flips and notifies parent container. |
| **T22-22** | `test_entry_row_inline_rename_commit` | ExplorerEntryRow | Double clicks title; types new name and presses `Enter`; asserts rename callback emits new title string. |
| **T22-23** | `test_entry_row_inline_rename_cancel` | ExplorerEntryRow | Begins editing name and presses `Escape`; asserts text field reverts to original title without emitting rename. |
| **T22-24** | `test_entry_row_context_menu_options` | ExplorerEntryRow | Opens row actions menu; asserts menu displays Rename, Duplicate, Version History, Export, and Archive choices. |

### 6.6 Command Bar Sub-Component Verification (`tests/unit/components/commandbar/`)

| Test ID | Test Name | Target Subsystem | Description & Expected Assertions |
| :--- | :--- | :--- | :--- |
| **T22-25** | `test_title_bar_dirty_asterisk_indicator` | DocumentTitleBar | Renders title bar with dirty document; asserts `doc-tab-title` displays trailing `*` indicator. |
| **T22-26** | `test_title_bar_amber_draft_badge` | DocumentTitleBar | Renders title bar for `zx:diagrams:UUID` with `version: 0`; asserts amber `badge-draft` is visible with text "Draft". |
| **T22-27** | `test_action_buttons_draft_mode_variant` | DocumentActionButtons | In draft mode, asserts primary save button is `btn-save-draft` with label "Save Draft". |
| **T22-28** | `test_action_buttons_diagram_mode_variant` | DocumentActionButtons | In diagram mode, asserts primary save button is `btn-save-diagram` with label "Save Diagram". |

---

## 7. Legacy Test Preservation & Regression Safeguards

Refactoring high-traffic UI components requires bulletproof protection against visual and behavioral regression:

1. **Selector Contract B Invariant**:
   - Every selector in the generated `docs/testing/testid-baseline.json` (196 literals + dynamic prefixes at planning) MUST be preserved on the newly decomposed sub-components, matching the routing in the Section 4 Matrix.
   - Zero test query changes are permitted in `e2e/`.
2. **Dockview Contract A Invariant**:
   - Decomposed panels (`PreviewPanel`, `VersionPopover`, `CorpusExplorerDrawer`) must continue mounting inside standard Dockview panel headers and layout slots.
   - Panel layout serialization and deserialization via `api.toJSON()` / `api.fromJSON()` must remain 100% backward compatible.
3. **Playwright Regression Suite**:
   - All Playwright test runs in the kickoff-recorded baseline (402 at planning) across Sprints 00–19 (`npm run test:e2e`) must pass with zero failures.
4. **Vitest Unit Suite**:
   - All unit tests in the kickoff-recorded baseline (334 at planning) must pass 100% green.

---

## 8. Definition of Done (DoD) Checklists

This sprint is gated by 10 verifiable Definition of Done checkpoints:

### Source Decomposition & Line Limit Gates
- [x] **G01 — All Sub-Components Under 250 LOC**: Every newly extracted sub-component (`VersionHistoryList`, `VersionDiffEngine`, `VersionCompareModal`, `VersionRestoreDialog`, `PreviewStage`, `PreviewToolbar`, `PreviewCompiler`, `ExplorerSearchBar`, `ExplorerSectionList`, `ExplorerEntryRow`, `DocumentTitleBar`, `DocumentActionButtons`) is verified strictly **$\le 250$ lines of code**.
- [x] **G02 — All Parent Containers Under 200 LOC**: Parent coordinating containers (`VersionPopover.tsx` 190 LOC, `PreviewPanel.tsx` 140 LOC, `CorpusExplorerDrawer.tsx` 189 LOC, `WorkbenchCommandBar.tsx` 207 LOC) are refactored into clean composition wrappers strictly under the $\le 250$ lines ceiling.

### Headless Algorithm & Decoupling Gates
- [x] **G03 — Headless Version Diff Engine Verified**: `VersionDiffEngine.ts` is fully decoupled from React and passes all mathematical AST diff tests (T22-01 to T22-05).
- [x] **G04 — Headless Preview Compiler Verified**: `PreviewCompiler.ts` compiles SVG elements directly from AST and passes all styling and Bézier geometry tests (T22-06 to T22-10).

### UI Sub-Component Unit Coverage Gates
- [x] **G05 — History & Modal Unit Tests Passing**: All history sub-components pass unit tests (T22-11 to T22-17).
- [x] **G06 — Preview & Stage Unit Tests Passing**: All preview sub-components pass unit tests (T22-18 to T22-19).
- [x] **G07 — Explorer Drawer Unit Tests Passing**: All explorer drawer sub-components pass unit tests (T22-20 to T22-24).
- [x] **G08 — Command Bar Unit Tests Passing**: All command bar sub-components pass unit tests (T22-25 to T22-28).

### Regression & Contract Invariant Gates
- [x] **G09 — Contract B Selector Integrity Verified**: `scripts/audit-testids.mjs` runs clean — zero removed selectors versus the committed `docs/testing/testid-baseline.json`; any baseline diff is deliberate and committed.
- [x] **G10 — Full Regression Suite Passing**: All Vitest unit tests and Playwright E2E runs in the kickoff-recorded baseline pass 100% green with zero modifications to legacy test assertions.

---

## 9. Verification Commands & Execution Runbook

Execute these commands to verify Sprint 22 completion:

```bash
# 1. Run headless algorithmic tests (Diff Engine & Preview Compiler)
npx vitest run tests/unit/components/history/VersionDiffEngine.test.ts \
               tests/unit/components/preview/PreviewCompiler.test.ts

# 2. Run sub-component unit test suites
npx vitest run tests/unit/components/history/ \
               tests/unit/components/preview/ \
               tests/unit/components/explorer/ \
               tests/unit/components/commandbar/

# 3. Verify line counts of all decomposed modules
wc -l src/components/workbench/panels/history/* \
      src/components/workbench/panels/preview/* \
      src/components/workbench/explorer/* \
      src/components/workbench/commandbar/*

# 4. Run full Vitest regression suite
npm test

# 5. Run full Playwright E2E regression suite across all browsers
npm run test:e2e
```

