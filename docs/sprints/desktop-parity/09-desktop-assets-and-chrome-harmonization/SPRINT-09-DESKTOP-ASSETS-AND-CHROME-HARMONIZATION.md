# Sprint 09: Desktop Asset Pipeline & macOS Chrome Harmonization

## 1. Executive Summary & Vision
- **Objective**: Establish the shared media asset pipeline between the native C++ Qt codebase (`images/`, `tikzit.qrc`) and the Astro/React web workbench, and transform the web window frame and tool palette into an exact replica of the desktop macOS TikZiT application.
- **Architectural Leads**:
  - **Winston (System Architect)**: System asset ingestion architecture, macOS window chrome component hierarchy, and tool palette state model.
  - **Amelia (Senior Software Engineer)**: Test-first implementation, acceptance criteria, type safety, Vitest unit suite, and Playwright E2E visual verification.

---

## 2. Visual & Architectural Baseline Analysis

From our study of the original desktop application (`tikzit.app`, `mainwindow.cpp`, `toolpalette.cpp`, and screenshot reference):

```
+---------------------------------------------------------------------------------------+
| (o)(o)(o)                     untitled* - TikZiT                                      |  <- macOS Chrome
| [ -> ] [ (o) ] [ ~/~ ]*                                                                |  <- Tool Palette
| (select)(node) (edge - ACTIVE green border #00c853)                                   |
+-------------------------------------------------------------------+-------------------+
|                                                                   | Styles            |
|                                                                   | [no styles]       |
|                                                                   | [+][f][e][r]      |
|                       CANVAS STAGE                                | [Categories v]    |
|                      (Pure White #FFFFFF)                         | +---------------+ |
|                                                                   | | Node Styles   | |
|                                                                   | +---------------+ |
|                                                                   | | Edge Styles   | |
|                                                                   | +---------------+ |
+-------------------------------------------------------------------+-------------------+
```

### 2.1 C++ Media Asset Inventory
The `images/` directory is the single source of truth; `tikzit.qrc` bundles a subset of it into the Qt binary. Assets required by the web workbench:
- `images/tikzit-tool-select.svg`: Selection arrow pointer tool. *(in qrc)*
- `images/tikzit-tool-node.svg`: Vertex/Node circle tool. *(in qrc)*
- `images/tikzit-tool-edge.svg`: Edge Bézier curve with control handles. *(in qrc)*
- `images/document-new.svg`: New file action icon. *(in qrc)*
- `images/document-open.svg`: Open directory/file action icon. *(in qrc)*
- `images/text-x-generic_with_pencil.svg`: Edit style action icon. *(in qrc)*
- `images/refresh.svg`: Reload/refresh stylesheet action icon. *(in qrc)*
- `images/tikzit.png` / `images/tikzit.svg`: Application brand logo. *(only `tikzit.png` is in qrc; `tikzit.svg` exists in `images/` only)*
- `images/crop.svg`: Bounding-box tool icon. *(exists in `images/` but is **not** in qrc; retained for web bbox tool)*

---

## 3. Architectural Specifications (Winston)

### 3.1 Media Sharing & Asset Pipeline Architecture
1. **Asset Pipeline**:
   - The C++ `images/` folder remains the single source of truth for canonical icons.
   - An automated build/sync script (`scripts/sync-desktop-icons.mjs`) synchronizes all required SVGs and PNGs from `images/` to `public/icons/`.
   - In `package.json`, the `prebuild` and `predev` scripts invoke `node scripts/sync-desktop-icons.mjs` to guarantee zero drift.
2. **Type-Safe Icon Registry (`src/components/common/TikzitIcons.tsx`)**:
   - Exposes clean React components for `SelectToolIcon`, `VertexToolIcon`, `EdgeToolIcon`, `CropToolIcon`, `NewDocumentIcon`, `OpenDocumentIcon`, `EditDocumentIcon`, and `RefreshIcon`.
   - Supports crisp SVG rendering with customizable `className`, `size` (default 16 or 24), and inline vector preservation.
3. **macOS Window Chrome Architecture (`src/components/workbench/MacWindowChrome.tsx`)**:
   - Top Header bar (`h-10` / `38px`, background `#2a2a2a`, border-b `#383838`).
   - Left side: Traffic light buttons (Close: `#ff5f56`, Minimize: `#ffbd2e`, Maximize: `#27c93f`, diameter `12px`, decorative `aria-hidden="true"`).
   - Center: Document title chip with `data-testid="doc-tab-title"`, rendering `{shortName}{isDirty ? '*' : ''} - TikZiT` (matching `mainwindow.cpp:191-197`).
   - Right side: **Absorb existing header actions** — undo/redo buttons (`[data-testid="btn-toolbar-undo"]`, `[data-testid="btn-toolbar-redo"]`), version-history popover, tabs menu, reset layout, theme toggle (Contract A §4, Contract B).
4. **Desktop Tool Palette Architecture (`src/components/workbench/DesktopToolPalette.tsx`)**:
   - Compact toolbar container situated in the top bar or directly beneath the chrome.
   - 32x32px square icon buttons, dark charcoal background (`#2b2b2b` / `#333333`).
   - Active tool state: **Bright green border** (`border-2 border-[#00c853]`, background `#3c3c3c`), matching the exact visual cue from the desktop screenshot.
   - Passive tool state: Subtle border (`border border-[#444444]`), hover (`bg-[#383838]`).
   - Preserves all data attributes: `data-tool="select|vertex|edge|bbox"` and `data-testid="tool-*"`.

---

## 4. Implementation Steps & Acceptance Criteria (Amelia)

| Step | Task | Deliverable | Acceptance Criteria |
| :--- | :--- | :--- | :--- |
| **09.1** | Media Asset Extraction & Sync | `scripts/sync-desktop-icons.mjs` & `public/icons/*` | All C++ SVGs copied to `public/icons/`, verified by SHA-256 in `prebuild`/`predev` |
| **09.2** | Type-Safe Icon Registry | `src/components/common/TikzitIcons.tsx` | Typed React wrappers for all tool and style action icons with crisp SVG scaling |
| **09.3** | macOS Window Chrome | `src/components/workbench/MacWindowChrome.tsx` | Traffic light buttons, centered reactive title (`untitled* - TikZiT`), dark #2a2a2a chrome |
| **09.4** | Desktop Tool Palette | `src/components/workbench/DesktopToolPalette.tsx` | 32x32px square buttons with SVG icons, bright green border (`#00c853`) on active tool |
| **09.5** | Workbench Integration | `src/components/workbench/TikzitSpatialWorkbench.tsx` | Seamless integration replacing legacy pill buttons while preserving all Contract B selectors |
| **09.6** | Unit & E2E Test Verification | `tests/unit/ui/desktopChrome.test.tsx` & `e2e/sprint-09/desktop-chrome.spec.ts` | 100% green tests verifying icons, active tool states, title updates, and 59 prior tests |

### Detailed Acceptance Criteria:
- **AC-09-01**: `public/icons/tikzit-tool-select.svg`, `tikzit-tool-node.svg`, `tikzit-tool-edge.svg`, `document-new.svg`, `document-open.svg`, `text-x-generic_with_pencil.svg`, and `refresh.svg` exist and match C++ source hashes.
- **AC-09-02**: `TikzitIcons.tsx` exports typed icon components that render SVG cleanly with zero blur or distortion at 16px, 20px, 24px, and 32px.
- **AC-09-03**: Window title reacts to active document tab and dirty buffer status (e.g. showing `*` when edits occur, matching desktop `untitled* - TikZiT` — format: `{shortName|untitled}{dirty?"*":""} - TikZiT` per `mainwindow.cpp:191-197`).
- **AC-09-04**: Tool palette displays Select, Vertex, Edge, BBox buttons. Clicking Edge tool or pressing `E` applies the signature `border-2 border-[#00c853]` active border. Full desktop keymap supported: `S` → select, `V`/`N` → vertex, `E` → edge, `B` → bbox (`tikzscene.cpp:1049-1061`).
- **AC-09-05**: Vitest unit suite passes with >= 6 tests validating icon rendering and tool selection state changes.
- **AC-09-06**: Playwright E2E spec passes validating DOM attributes, tool click interactions, and keyboard shortcut parity.
- **AC-09-07**: Selector stability — the new palette buttons keep `data-tool="select|vertex|edge|bbox"` and `data-testid="tool-*"` attributes, and the chrome keeps `[data-testid="doc-tab-title"]`, `btn-toolbar-undo/redo`, `btn-version-history`, `editor-tabs-more-actions-btn`, `tabs-close-*`, `btn-reset-layout`, `btn-theme-toggle`/`#theme-selector-btn`. All 59 pre-existing E2E tests still pass (Contract B).

---

## 5. Verification Sources (C++ → AC Traceability)

| AC | C++ Source of Truth | Notes |
| :--- | :--- | :--- |
| AC-09-01 | `images/` directory; `tikzit.qrc:2-16` | `crop.svg`, `tikzit.svg` are **not** in qrc — sync directly from `images/` |
| AC-09-02 | `src/gui/toolpalette.cpp:45-50`, `src/gui/stylepalette.ui:73-143` | Icon usages: `:/images/tikzit-tool-*.svg`, `document-*.svg`, `text-x-generic_with_pencil.svg`, `refresh.svg` |
| AC-09-03 | `src/gui/mainwindow.cpp:191-197` (`updateFileName`) | `nm + " - TikZiT"`, `*` appended iff `!isClean()` |
| AC-09-04 | `src/gui/toolpalette.cpp:26-68`; `src/gui/tikzscene.cpp:1049-1061` | Checkable QActionGroup; keymap S / V,N / E / B. Green border = design choice |
| AC-09-07 | `e2e/` selector inventory (Contract B) | Verified 59 `test(` blocks reference these selectors |

---

## 6. Definition of Done (DoD) Checklist

- [x] All required C++ SVG and PNG media assets synchronized from `images/` to `public/icons/` via `scripts/sync-desktop-icons.mjs` in `prebuild` and `predev`.
- [x] Type-safe React icon components authored in `src/components/common/TikzitIcons.tsx`.
- [x] macOS window chrome implemented in `src/components/workbench/MacWindowChrome.tsx` with traffic light buttons and reactive `title* - TikZiT` document title.
- [x] Desktop-parity Tool Palette implemented in `src/components/workbench/DesktopToolPalette.tsx` with 32x32px square buttons, exact C++ SVGs, and bright green active border (`#00c853`).
- [x] Keyboard shortcuts (`S`, `V`, `N`, `E`, `B`) seamlessly toggle tool modes and visually update active borders.
- [x] macOS window chrome preserves all pre-existing header features (undo/redo, version popover, tabs menu, reset layout, theme toggle, doc tab + `+` button) and every selector in Contract B.
- [x] Tool palette keeps `data-tool`/`data-testid="tool-*"` attributes; no prior E2E test regresses.
- [x] Unit tests in `tests/unit/ui/desktopChrome.test.tsx` pass 100%.
- [x] Playwright E2E tests in `e2e/sprint-09/desktop-chrome.spec.ts` pass 100%.
- [x] Zero TypeScript errors (`npx tsc --noEmit`) and zero build warnings.
