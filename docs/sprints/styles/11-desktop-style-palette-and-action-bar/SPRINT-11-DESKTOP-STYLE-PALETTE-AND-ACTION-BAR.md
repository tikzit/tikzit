# Sprint 11: Desktop-Parity Style Palette & Action Bar

## 1. Executive Summary & Vision
- **Objective**: Re-engineer the right dock panel to achieve exact architectural and visual parity with the desktop Qt `StylePalette` (`stylepalette.ui` and `stylepalette.cpp`), featuring the 4-icon action toolbar, category combobox, and split 48x48 icon-mode grids for Node and Edge styles on dark slate (`#181818`).
- **Architectural Leads**:
  - **Winston (System Architect)**: Dockview layout model, action bar event bus, and icon-grid visual structure.
  - **Amelia (Senior Software Engineer)**: Component implementation, file ingestion/export handlers, unit tests, and Playwright E2E verification.

---

## 2. Desktop Baseline Analysis (`stylepalette.ui` & `stylepalette.cpp`)

In the desktop C++ application:
```
+-------------------------------------------------------------+
| Styles                                                [x][=]|  <- Dock header
+-------------------------------------------------------------+
| [no styles]                                                 |  <- Loaded file label (italic)
| [ New ] [ Open ] [ Edit ] [ Refresh ]                       |  <- 4 Action Buttons (16x16)
| (doc-new) (doc-open) (pencil) (refresh)                     |
+-------------------------------------------------------------+
| [ Category Dropdown: (all)                       v ]        |  <- Category Combobox ("" entry = all)
+-------------------------------------------------------------+
| NODE STYLES (QListView::IconMode, 48x48px grid, #181818)    |
|   +-------+   +-------+   +-------+                         |
|   | ( o ) |   |  (Z)  |   |  (X)  |                         |
|   | none  |   |   Z   |   |   X   |                         |
|   +-------+   +-------+   +-------+                         |
+-------------------------------------------------------------+
| EDGE STYLES (QListView::IconMode, 48x48px grid, #181818)    |
|   +-------+   +-------+                                     |
|   |  ---  |   |  ---> |                                     |
|   | none  |   | arrow |                                     |
|   +-------+   +-------+                                     |
+-------------------------------------------------------------+
```

### 2.1 The 4-Icon Action Bar
Directly beneath the stylesheet filename label are 4 compact toolbar buttons utilizing canonical SVGs (icon size in `stylepalette.ui:77-142` is **16×16**):
1. **New (`document-new.svg`)**: Initializes a new, empty stylesheet catalog, with option to save/download as `.tikzstyles`.
2. **Open (`document-open.svg`)**: Invokes file chooser to import and parse a `.tikzstyles` file. (Extends `FileDropZone.tsx:49` to also accept `.tikzstyles`).
3. **Edit (`text-x-generic_with_pencil.svg`)**: Opens the `StyleEditorModal` for the active style — guarded with a warning when stylesheet is `[no styles]` (`stylepalette.cpp:215-224`).
4. **Refresh (`refresh.svg`)**: Reloads the last-opened `.tikzstyles` from retained file handle/content (`stylepalette.cpp:226-231`).

### 2.2 Category Combobox
A full-width native-styled dark dropdown (`<select>`):
- Width: 100% of dock panel width.
- Background: `#222222`, border: `#383838`, text: `#ffffff`.
- **Populated from node styles only** (`TikzStyles::categories()`, `tikzstyles.cpp:141-152`), sorted alphabetically, starting with an empty string `""` entry representing "all categories" (unfiltered pass-through).
- **Filters node styles only** (`stylepalette.cpp:233-238`); edge styles grid is never filtered by node categories.

### 2.3 Split Icon-Mode Grids (`IconMode`, 48x48px)
Grid cells are `48×48px` (`style-icon-spacing` setting, `stylepalette.cpp:39-53`) on dark slate background (`#181818`):
- **Top Section (Node Styles)**:
  - Background: Dark slate `#181818`.
  - Grid cell: `48x48px` with style preview graphic and label centered underneath.
  - Index 0: Synthetic `none` style with dashed-circle preview, **pinned at index 0 in every category filter** (`stylelist.cpp:79-99`).
  - Active selection: Highlighted with blue selection border `#0078d4` / `#2563eb`.
  - **Single-click**: Selects the active node style for the Vertex tool (`activeStyleStore.set`).
  - **Double-click**: Applies the active style to currently selected nodes in the canvas (`applyActiveStyleToNodes()`, `stylepalette.cpp:195-203`).
- **Bottom Section (Edge Styles)**:
  - Background: Dark slate `#181818`.
  - Grid cell: `48x48px` with edge preview graphic and label centered underneath.
  - Index 0: Default `none` style with simple wire preview, pinned at index 0.
  - **Single-click**: Selects the active edge style for the Edge tool.
  - **Double-click**: Applies the active edge style to currently selected edges in the canvas (`applyActiveStyleToEdges()`).

---

## 3. Dockview Preservation Constraints (Contract A applied)

The styles dock panel mounts as a **Dockview panel**, preserving full workspace flexibility:
1. **Dedicated Styles Panel**: Registered in the `components` map of `TikzitSpatialWorkbench.tsx` as panel ID `styles` (title `"Styles"`), positioned to the right of the canvas.
2. **Layout Migration & Reconciliation**: Existing saved layouts in `localStorage['tikzit:workbench:layout']` are reconciled on load so that the new `styles` panel is automatically mounted without throwing or losing user layouts.
3. **Selector Compatibility (Contract B)**: Preserves `#style-palette-island`, `button[data-style-name="..."]`, `#open-style-editor-btn`, and `#style-editor-modal` to guarantee 100% pass across all 59 existing Playwright tests.

---

## 4. Implementation Steps & Acceptance Criteria (Amelia)

| Step | Task | Deliverable | Acceptance Criteria |
| :--- | :--- | :--- | :--- |
| **11.1** | Desktop Action Bar Component | `src/components/styles/DesktopStyleActionBar.tsx` | 4 action buttons with canonical SVGs (New, Open, Edit, Refresh) at 16×16; Edit guarded on `[no styles]` |
| **11.2** | Category Combobox | `src/components/styles/CategorySelect.tsx` | Full-width dark `<select>`; node categories + `""` (all) entry; filters node grid only |
| **11.3** | Desktop 48x48 Swatch Grid | `src/components/styles/DesktopSwatchGrid.tsx` | 48x48px cells on `#181818`; label underneath; synthetic `none` pinned at index 0 |
| **11.4** | StylePalette Re-architecture | `src/components/styles/StylePalette.tsx` | Complete re-assembly into desktop layout with node/edge split; Dockview integration |
| **11.5** | Stylesheet Ingestion & Refresh | `src/components/workspace/FileDropZone.tsx` & `src/stores/workbench.ts` | `.tikzstyles` accepted by drop zone + Open button; `styleFileName` tracked; Refresh re-parses buffer |
| **11.6** | Test Suite Verification | `tests/unit/styles/desktopStylePalette.test.tsx` & `e2e/sprint-11/desktop-style-palette.spec.ts` | 100% green tests for 4 actions, category filter, swatch double-click, and 59 prior tests |

### Detailed Acceptance Criteria:
- **AC-11-01**: 4 toolbar buttons render using canonical SVGs (`document-new.svg`, `document-open.svg`, `text-x-generic_with_pencil.svg`, `refresh.svg`) at 16×16 icon size.
- **AC-11-02**: The loaded stylesheet label displays accurately (`[no styles]` default, or filename e.g. `pqp-zx.tikzstyles`) in italic.
- **AC-11-03**: Category combobox populates from node-style categories (sorted, with `""` all as first entry) and filters only the node grid; the edge grid is unaffected.
- **AC-11-04**: Node and Edge styles display in separate split panels in 48×48 icon grid format on `#181818`, each always starting with synthetic `none` at index 0.
- **AC-11-05**: Single-click sets the active style in stores; double-click applies the active style to selected elements in the canvas.
- **AC-11-06**: Vitest suite passes >= 6 tests validating categorization and actions; Playwright E2E suite passes validating UI workflows.
- **AC-11-07**: Selector contract — preserve all Contract B selectors; zero regressions across the 59 prior E2E tests.

---

## 5. Verification Sources (C++ → AC Traceability)

| AC / Claim | C++ Source of Truth | Verified Value |
| :--- | :--- | :--- |
| Panel structure | `src/gui/stylepalette.ui:37-193` | `QDockWidget "Styles"` → italic `styleFile` label → 4 `QToolButton`s (iconSize 16×16) → `currentCategory` `QComboBox` → two `QListView`s |
| IconMode + 48 grid | `src/gui/stylepalette.cpp:39-53` | `setViewMode(IconMode)`, `setGridSize(QSize(48,48))`, background `#181818` |
| `[no styles]` label | `src/tikzit.cpp:42`, `stylepalette.cpp:66-85` | `_styleFile` initialized `"[no styles]"` |
| Action button semantics | `src/tikzit.cpp:142-174`, `stylepalette.cpp:205-231` | New = clear/save; Open = file chooser; Edit = modal; Refresh = reload file |
| Double-click | `stylepalette.cpp:195-203`, `tikzscene.cpp:1147-1155` | `applyActiveStyleToNodes/Edges()` — applies to selection |
| Categories | `src/data/tikzstyles.cpp:141-152`, `stylepalette.cpp:233-238` | Node styles only, sorted, `""` = all; filters node grid only |
| `none` pinned | `src/data/stylelist.cpp:5-12, 79-99` | `none` and `noneEdgeStyle` always index 0 in every category |

---

## 6. Definition of Done (DoD) Checklist

- [x] Right dock panel restructured into desktop layout matching `stylepalette.ui`, mounted inside Dockview with all capabilities intact (Contract A).
- [x] 4-button action bar implemented with original SVG icons at 16×16; New/Open/Edit/Refresh mapped to web storage and file API.
- [x] `FileDropZone.tsx` updated to accept and parse `.tikzstyles` files.
- [x] Category combobox implemented as full-width dark `<select>`, populated from node-style categories with `""` (all) first, filtering only the node grid.
- [x] Node styles and Edge styles rendered in distinct split 48×48 icon-grid sections on `#181818`, `none` pinned at index 0.
- [x] Single-click = set active style; double-click = apply to selection.
- [x] Contract-B selectors preserved; zero regressions in the 59 prior E2E tests.
- [x] Unit tests in `tests/unit/styles/desktopStylePalette.test.tsx` pass 100%.
- [x] Playwright E2E tests in `e2e/sprint-11/desktop-style-palette.spec.ts` pass 100%.
- [x] TypeScript compilation (`npx tsc --noEmit`) passes with 0 errors.
