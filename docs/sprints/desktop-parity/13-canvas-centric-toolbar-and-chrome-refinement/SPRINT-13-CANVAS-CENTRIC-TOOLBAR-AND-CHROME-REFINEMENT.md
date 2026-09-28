# Sprint 13: Canvas-Centric Tool Placement & Window Chrome Refinement

## 1. Executive Summary & Intentional Design Vision
- **Objective**: Refine the top window chrome and tool palette ergonomics based on the intentional web interface design:
  1. **Remove Non-Functional Elements**: Completely remove the decorative macOS "traffic light" dots (Red, Yellow, Green), which are non-functional in web context and introduce misleading clutter next to the Select tool.
  2. **Canvas-Centric Tool Placement**: Relocate the primary drawing tool palette (**Select**, **Vertex**, **Edge**, and **BBox**) from the top-left sidebar zone to the **horizontal center directly above the Vector Canvas**, establishing an ergonomic visual hierarchy where drawing tools sit immediately adjacent to the drawing canvas.
  3. **Header Re-balancing**: Reorganize the top chrome into three distinct functional zones:
     - **Left**: Document title tab badge (`{doc}* - TikZiT`) and New Diagram button (`+`).
     - **Center**: Centered Tool Palette with 32x32px square buttons and signature bright green active border (`#00c853`).
     - **Right**: Transactional & system utilities (Undo, Redo, History, More Actions, Reset Layout, Theme Toggle).
- **Architectural Leads**:
  - **Winston (System Architect)**: Interface hierarchy, ergonomic layout zoning, and Contract A/B compatibility.
  - **Amelia (Senior Software Engineer)**: Component refactoring, Playwright cross-browser regression verification, and DoD sign-off.

---

## 2. As-Is vs. Target Intentional Design Gap Analysis

| Element | Current Implementation (As-Is) | Intentional Design Requirement (To-Be) | Rationale |
| :--- | :--- | :--- | :--- |
| **Traffic Light Controls** | Decorative Red, Yellow, Green circles (`#ff5f56`, `#ffbd2e`, `#27c93f`) on far-left | **Completely Removed** | Non-functional in browser; violates HIG and web usability; wastes prime screen real estate. |
| **Tool Palette Position** | Pinned to top-left header directly above Explorer sidebar | **Centered above the Vector Canvas** | Drawing tools control canvas state and belong visually centered directly above the canvas workspace. |
| **Document Title Badge** | Centered in middle of top bar (`doc-tab-title`) | **Moved to Left Header Section** | Follows standard application conventions (app brand / active file on left, tools in center). |
| **New Diagram Button (`+`)** | Squeezed between tool palette and center title | **Adjacent to Document Title on Left** | Groups document lifecycle operations together on the left side of the header. |

---

## 3. Detailed Architectural Layout Specification (Winston)

```
+-------------------------------------------------------------------------------------------------------------------------+
| [MacWindowChrome]                                                                                                       |
|  LEFT (Document LifeCycle):            CENTER (Canvas Drawing Tools):                  RIGHT (Utilities & Settings):    |
|  [ 📄 01_spider_fusion.tikz* - TikZiT ] [+]    [ ↖ ][ ● ][ ☍ ][ ⛶ ] (border: #00c853)   [ ↶ Undo ][ ↷ Redo ] [ 🕒 ] [⋯] [Reset] [☀️] |
+------------------------------------+---------------------------------------------------+--------------------------------+
| [Activity Bar] | [EXPLORER Drawer] | [Vector Canvas (Three.js)]                        | [Inspector & Styles Dock]      |
|  - Diagram     |  - Files          |                                                   |  - [no styles]                 |
|  - Styles      |  - Corpus         |                 CANVAS STAGE                      |  - Category: (all)             |
|  - ZX Guide    |                   |            (Centered Under Tools)                 |  - 48x48 Swatch Grids          |
+------------------------------------+---------------------------------------------------+--------------------------------+
```

### 3.1 Contract A: Dockview Invariants Preservation
- Header component remains a sovereign top chrome bar spanning above the Dockview layout.
- Vector Canvas panel continues to function as a resizable, draggable, and maximizable Dockview group.
- Relocating the tool palette to the center of the top bar keeps it visible at all times across all panel configurations.

### 3.2 Contract B: Selector Stability Preservation
All existing test selectors must remain functional:
- `[data-testid="mac-window-chrome"]` (or workbench header)
- `[data-testid="doc-tab-title"]`
- `[data-testid="btn-new-diagram"]`
- `button[data-tool="select"]`, `button[data-tool="vertex"]`, `button[data-tool="edge"]`, `button[data-tool="bbox"]`
- `[data-testid="tool-*"]`
- `[data-testid="btn-toolbar-undo"]`, `[data-testid="btn-toolbar-redo"]`
- `[data-testid="btn-version-history"]`, `[data-testid="btn-reset-layout"]`, `[data-testid="btn-theme-toggle"]`

---

## 4. Implementation Steps & Acceptance Criteria (Amelia)

| Step | Task | Deliverable | Acceptance Criteria |
| :--- | :--- | :--- | :--- |
| **13.1** | Remove Non-Functional Traffic Lights | `src/components/workbench/MacWindowChrome.tsx` | Remove the 3 decorative dots (`#ff5f56`, `#ffbd2e`, `#27c93f`) and container `[data-testid="mac-traffic-lights"]` |
| **13.2** | Center Tool Palette Above Canvas | `src/components/workbench/MacWindowChrome.tsx` | Move `DesktopToolPalette` to center flex container; move `doc-tab-title` and `btn-new-diagram` to left flex container |
| **13.3** | Update Unit Test Assertions | `tests/unit/ui/desktopChrome.test.tsx` | Assert absence of traffic lights; assert tool palette is in center and title is on left; verify all unit tests pass |
| **13.4** | Update Playwright E2E Suites | `e2e/sprint-09/desktop-chrome.spec.ts`, `e2e/sprint-12/visual-regression.spec.ts` | Update assertions to verify tool palette centered above canvas and traffic lights removed |
| **13.5** | Cross-Browser Regression Audit | Chromium, Firefox, WebKit | 100% green pass across all 81+ test scenarios (243 test runs) |

---

## 5. Definition of Done (DoD) Checklist

- [x] Red, Yellow, Green decorative dots removed completely from `MacWindowChrome.tsx`.
- [x] Tool Palette (`DesktopToolPalette`: Select, Vertex, Edge, BBox) centered horizontally in the top bar directly above the Vector Canvas area.
- [x] Document title badge (`[data-testid="doc-tab-title"]`) and New Diagram button (`[data-testid="btn-new-diagram"]`) positioned on the left side of the header.
- [x] All Contract B test selectors preserved with zero regressions across prior tests.
- [x] Unit tests in `tests/unit/ui/desktopChrome.test.tsx` updated and passing 100%.
- [x] Playwright E2E tests in `e2e/sprint-09/desktop-chrome.spec.ts` and `e2e/sprint-12/visual-regression.spec.ts` updated and passing 100%.
- [x] Full cross-browser matrix (Chromium, Desktop Firefox, Desktop Safari WebKit) passes with 100% green test results (258/258 tests passing).
- [x] TypeScript compilation (`npx tsc --noEmit`) passes with 0 errors.
- [x] Production build (`npm run build`) succeeds with 0 errors.
