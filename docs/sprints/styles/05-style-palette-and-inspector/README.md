# Sprint 05: Style Palette & Category Property Inspector
**Directory:** `docs/sprints/styles/05-style-palette-and-inspector`
**Status:** ✅ **Completed (Graduated)**
**Graduated Date:** 2026-09-27
**Specification:** [`SPRINT-05-STYLE-PALETTE-AND-PROPERTY-INSPECTOR.md`](./SPRINT-05-STYLE-PALETTE-AND-PROPERTY-INSPECTOR.md)

---

## 1. Overview

Sprint 05 delivered complete stylesheet parsing, categorical organization, and synchronized property inspection for TikZiT Web, establishing complete desktop-parity style management:

1. **TikZ Stylesheet Engine & Parser**:
   - Pure TypeScript parser and canonical emitter for `.tikzstyles` files (`\tikzstyle{NAME}=[PROPS]`).
   - Extended PGF RGB color format conversion: `{rgb,255: red,R; green,G; blue,B}` mapped to 24-bit hex `#RRGGBB` and Three.js color space, with lossless round-trip emitter.
   - Named LaTeX color resolution (`black`, `white`, `red`, `green`, `blue`, `cyan`, `magenta`, `yellow`, `teal`, etc.).
   - Category extraction matching desktop TikZiT (`tikzit category=...`), ensuring categories are defined as element properties and comments are not treated as metadata.
   - Desktop parity for edge style classification (`Style::isEdgeStyle()`), verifying arrow-tip atoms (`-`, `->`, `-|`, `<-`, `<->`, `<-|`, `|-`, `|->`, `|-|`) and ensuring `dashed` alone does not misclassify a node style as an edge style.

2. **Pre-bundled Style Libraries**:
   - Bundled ZX-calculus presets (`Z`, `X`, `H`, `none`, `wire`, `dashed wire`) in `src/core/styles/presets/zxPresets.ts`.
   - Default styles catalog automatically loaded in the Workbench runtime and exposed through Nanostores `$stylesCatalog`.

3. **Style Palette UI Island**:
   - Dockable panel (`#style-palette-island`) with category filtering tabs (`.style-category-tab`) populated dynamically from the active stylesheet.
   - Miniature high-contrast preview glyphs reflecting fill, stroke, shape, and dash patterns.
   - Click to select active style or immediately apply to currently selected nodes/edges on canvas.
   - Style Manager launcher button (`#open-style-editor-btn`) for creating and customizing styles.

4. **Context-Sensitive Property Inspector**:
   - Context-sensitive inspector displaying appropriate controls based on selection state (Node, Edge, Multi-selection, or Empty).
   - Node controls: Style preset dropdown (`#node-style-select`), X/Y coordinate inputs, and LaTeX Phase / Label input (`#node-label-input`) with Enter-key commit.
   - Edge controls: Wire style toggles, including dashed line checkbox (`#edge-dashed-checkbox`), bend angle, and source/target indicators.

5. **Style Editor Modal**:
   - Dialog (`#style-editor-modal`) for authoring new styles (`#new-style-btn`), configuring style name (`#style-name-input`), fill color (`#style-fill-color`), stroke color, shape, and category.
   - Live interactive swatch preview reflecting parameter adjustments in real time.
   - Save button (`#save-style-btn`) automatically updating the Cordis `StyleService` and propagating changes across all panels via Nanostores.

6. **Three.js Canvas Style Synchronization**:
   - Canvas `stage.renderGraph` takes the stylesheet dictionary, automatically evaluating PGF colors and shapes for nodes and edges.
   - Bidirectional synchronization between property inspector changes, palette swatches, AST updates, and WebGL stage re-renders.

---

## 2. Architecture & Deliverables

| Module | Source Location | Description |
| :--- | :--- | :--- |
| **Style Data Model & Helpers** | [`src/core/styles/TikzStyleModel.ts`](../../../../src/core/styles/TikzStyleModel.ts) | PGF color parser/emitter, category extraction, edge style classifier, and shape/color accessors. |
| **Bundled Style Presets** | [`src/core/styles/presets/zxPresets.ts`](../../../../src/core/styles/presets/zxPresets.ts) | Pre-bundled ZX-calculus and quantum wire style definitions. |
| **Cordis StyleService** | [`src/services/kernel.ts`](../../../../src/services/kernel.ts) | Service managing active stylesheet catalog, style CRUD, and AST style application. |
| **Nanostores State Integration** | [`src/stores/createWorkbenchStores.ts`](../../../../src/stores/createWorkbenchStores.ts) | Nanostores projection `$stylesCatalog` and `$activeStyle` with reactive bridging. |
| **Style Palette Island** | [`src/components/styles/StylePalette.tsx`](../../../../src/components/styles/StylePalette.tsx) | Category tabs, miniature glyph swatches, and active style selector. |
| **Property Inspector Island** | [`src/components/inspector/PropertyInspector.tsx`](../../../../src/components/inspector/PropertyInspector.tsx) | Dynamic inspector for nodes (style, label, position) and edges (dashed, bend). |
| **Style Editor Modal** | [`src/components/styles/StyleEditorModal.tsx`](../../../../src/components/styles/StyleEditorModal.tsx) | Interactive modal for creating and customizing diagram styles with live preview. |
| **Inspector Dockview Panel** | [`src/components/workbench/panels/InspectorPanel.tsx`](../../../../src/components/workbench/panels/InspectorPanel.tsx) | Hosts Style Palette, Property Inspector, and Style Editor within the right workbench group. |

---

## 3. Test Coverage & Verification

### 3.1 Unit Test Suite (Vitest) — 22 Tests Passing
- [`tests/unit/styles/styleParser.test.ts`](../../../../tests/unit/styles/styleParser.test.ts):
  - Parses `\tikzstyle` declarations matching desktop TikZiT grammar.
  - Validates PGF extended RGB serialization (`{rgb,255: red,R; green,G; blue,B}`) and bidirectional hex conversion.
  - Validates category extraction via `tikzit category` and comments exclusion.
  - Validates desktop C++ parity for `isEdgeStyle()` arrow atoms and confirms `dashed` alone is not an edge style.
  - Validates round-trip serialization and re-parsing invariance.
- [`tests/unit/styles/registry.test.ts`](../../../../tests/unit/styles/registry.test.ts):
  - Validates ZX preset styles and category assignment.
  - Tests style cloning, renaming, and isolation.
  - Tests Cordis `StyleService` lifecycle: adding styles, removing styles, applying styles to nodes and edges, and Nanostores updates.
- [`tests/unit/styles/inspector.test.ts`](../../../../tests/unit/styles/inspector.test.ts):
  - Tests label updating with LaTeX phase angles (`\alpha`, `\pi/2`, `0`).
  - Tests node style changes preserving spatial positions.
  - Tests uniform multi-node style updates.
  - Tests edge property modifications (`dashed`, `bend left`).

### 3.2 Playwright End-to-End Suite — 5 Tests Passing
- [`e2e/sprint-05/style-palette.spec.ts`](../../../../e2e/sprint-05/style-palette.spec.ts):
  - `05-E2E-01`: Renders palette categories and styles from the loaded stylesheet.
  - `05-E2E-02`: Applies a stylesheet entry to a selected canvas node and verifies inspector reflection.
  - `05-E2E-03`: Property Inspector edits label and phase angle with AST reflection.
  - `05-E2E-04`: Edge property inspector configures wire styles (dashed line toggle).
  - `05-E2E-05`: Style Editor modal creates, configures, and saves a new custom style visible in the palette.

### 3.3 Full System Test Results
- **Vitest Unit Tests**: 118 / 118 passed across 21 test suites.
- **Playwright E2E Tests**: 36 / 36 passed across all active sprints.
- **TypeScript (`tsc --noEmit`)**: Clean (0 errors).
- **Astro Production Build (`npm run build`)**: Clean (3 pages built in 329ms).
