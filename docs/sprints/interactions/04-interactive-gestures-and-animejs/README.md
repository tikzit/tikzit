# Sprint 04: Interactive Gestures & Anime.js Motion Physics
**Directory:** `docs/sprints/interactions/04-interactive-gestures-and-animejs`
**Status:** ✅ **Completed (Graduated)**
**Graduated Date:** 2026-09-27
**Specification:** [`SPRINT-04-INTERACTIVE-GESTURES-AND-ANIMEJS-PHYSICS.md`](./SPRINT-04-INTERACTIVE-GESTURES-AND-ANIMEJS-PHYSICS.md)

---

## 1. Overview

Sprint 04 delivered direct-manipulation interactive tooling, precision raycasting, and kinetic motion physics for TikZiT Web, establishing complete desktop-parity gesture interactions:

1. **Tool State Machine Architecture**:
   - `SelectTool` (`S`): Single-click node/edge selection, `Shift+Click` additive selection, marquee rectangular selection, multi-node dragging preserving relative distances, curvature handle dragging with 5° bend angle snapping, keyboard delete (`Delete`/`Backspace`), and desktop-compatible node nudging (`Ctrl+Arrow` by 0.25 units, `Ctrl+Shift+Arrow` by 0.025 units).
   - `VertexTool` (`V` or `N`): Pointer-down node placement with 0.25-unit grid snapping, sequential non-colliding auto-naming (`0`, `1`, `2`...), and automatic transactional commit to the graph AST.
   - `EdgeTool` (`E`): Rubberband wire dragging connecting source node to target node; drag back to source creates self-loops with desktop-parity `in=90`, `out=270` angles; dropping onto empty canvas cleanly cancels wire creation without state corruption.
   - `BBoxTool` (`B`): Dragging defines or updates diagram bounding boxes (`\path [use as bounding box] (min) rectangle (max);`) snapped to the 0.25-unit grid.

2. **Pointer Raycasting & Sub-Pixel Hit Testing**:
   - Screen-to-world and world-to-screen coordinate unprojecting via Three.js camera controller.
   - Precision node hit testing within $0.30$ world units.
   - Edge hit testing along sampled cubic Bézier subdivisions within $0.18$ units.
   - Curvature handle midpoint hit testing ($t = 0.5$) within $0.25$ units.
   - Axis-aligned rectangular marquee query finding all contained nodes.
   - Deterministic 0.25-unit grid snapping.

3. **Interactive Gizmo Layer**:
   - Three.js overlay layer at $Z = 30$ rendering visual feedback widgets.
   - Translucent marquee quad with contrasting borders.
   - Dynamic dashed rubberband line during edge creation.
   - Circular curvature handle at Bézier midpoints for interactive bending.
   - Dashed diagram bounding box outline.

4. **Anime.js 4 Motion Physics**:
   - Spring damping kinematics on release settling nodes into snapped grid coordinates.
   - Strict architectural separation: physics animations execute entirely in the presentation layer, while AST domain positions remain exact snapped coordinates.
   - Automatic reduced-motion detection (`prefers-reduced-motion: reduce`) with synchronous settling fallback.

5. **Desktop Geometric Operators**:
   - Horizontal and vertical reflection of selected nodes across their bounding box center $\frac{1}{2}(\min + \max)$, with automatic \(	ext{bend left} \leftrightarrow 	ext{bend right}\) sign inversion on induced edges.
   - 90° clockwise and counter-clockwise rotation about the Cartesian origin.

6. **Dockview-Aware Input Routing & Global Test Harness**:
   - Pointer events bind directly to the canvas element with `setPointerCapture` to isolate canvas gestures from Dockview sash and tab dragging.
   - Keyboard events are suppressed when text inputs or source editors hold focus.
   - Integrated `window.TikzitApp` automation API mounted on `/` supporting end-to-end Playwright tests and headless scripting.

---

## 2. Architecture & Deliverables

| Module | Source Location | Description |
| :--- | :--- | :--- |
| **Pointer Raycaster** | [`src/canvas/input/Raycaster.ts`](../../../../src/canvas/input/Raycaster.ts) | Screen-to-world mapping, 0.25-unit grid snapping, node/edge/handle hit testing, and marquee bounding box queries. |
| **Gizmo Renderer** | [`src/canvas/renderers/GizmoRenderer.ts`](../../../../src/canvas/renderers/GizmoRenderer.ts) | Three.js interactive overlay ($Z = 30$) rendering marquee boxes, rubberbands, curvature handles, and bounding boxes. |
| **Motion Physics** | [`src/canvas/animation/Physics.ts`](../../../../src/canvas/animation/Physics.ts) | Anime.js 4 spring physics animation for kinetic snap settling and reduced-motion fallback. |
| **Tool Types & Interfaces** | [`src/canvas/tools/types.ts`](../../../../src/canvas/tools/types.ts) | Contract for `CanvasTool`, `ToolContext`, and `SelectionStateIds`. |
| **Select & Transform Tool** | [`src/canvas/tools/SelectTool.ts`](../../../../src/canvas/tools/SelectTool.ts) | Node translation, marquee selection, curvature bending, arrow nudging, and keyboard deletion. |
| **Vertex Creation Tool** | [`src/canvas/tools/VertexTool.ts`](../../../../src/canvas/tools/VertexTool.ts) | Pointer-down node creation with 0.25-unit grid snapping and collision-free auto-naming. |
| **Edge & Wire Tool** | [`src/canvas/tools/EdgeTool.ts`](../../../../src/canvas/tools/EdgeTool.ts) | Rubberband wire creation between nodes, self-loop synthesis, and cancel-on-void mechanics. |
| **Bounding Box Tool** | [`src/canvas/tools/BBoxTool.ts`](../../../../src/canvas/tools/BBoxTool.ts) | Interactive diagram bounding box creation and resizing. |
| **Tool Coordinator** | [`src/canvas/tools/ToolManager.ts`](../../../../src/canvas/tools/ToolManager.ts) | Central tool dispatcher, keyboard shortcut router, and geometric reflection/rotation operator engine. |
| **Canvas Panel Integration** | [`src/components/workbench/panels/CanvasPanel.tsx`](../../../../src/components/workbench/panels/CanvasPanel.tsx) | Dockview panel host wiring `ToolManager` to Nanostores, Cordis runtime, and `window.TikzitApp` harness. |
| **Raycaster Unit Tests** | [`tests/unit/gestures/raycaster.test.ts`](../../../../tests/unit/gestures/raycaster.test.ts) | Vitest test suite verifying node, edge, and handle hit testing and grid snapping math. |
| **Tools Unit Tests** | [`tests/unit/gestures/tools.test.ts`](../../../../tests/unit/gestures/tools.test.ts) | Vitest test suite for Vertex, Edge, BBox, and Select tools and desktop reflection/rotation parity. |
| **Physics Unit Tests** | [`tests/unit/gestures/physics.test.ts`](../../../../tests/unit/gestures/physics.test.ts) | Vitest test suite verifying Anime.js 4 spring physics settling and reduced-motion handling. |
| **Playwright E2E Suite** | [`e2e/sprint-04/interactive-gestures.spec.ts`](../../../../e2e/sprint-04/interactive-gestures.spec.ts) | 5 end-to-end browser tests verifying gestures, wire creation, handle bending, marquee, and keyboard editing. |

---

## 3. Verification & Test Evidence

### 3.1 TypeScript Type Completeness
```bash
npx tsc --noEmit
# Result: 0 errors (clean compilation across entire repository)
```

### 3.2 Vitest Unit Test Results
```
 Test Files  18 passed (18)
      Tests  96 passed (96)
   Duration  398ms
```
Includes full coverage for:
- `tests/unit/gestures/raycaster.test.ts` (5/5 tests passed)
- `tests/unit/gestures/tools.test.ts` (14/14 tests passed)
- `tests/unit/gestures/physics.test.ts` (3/3 tests passed)

### 3.3 Astro Production Build
```
[build] 3 page(s) built in 330ms
[build] Complete!
```

### 3.4 Playwright End-to-End Suite
```
Running 31 tests using 5 workers
  ✓ 31 passed (11.2s)
```
All 5 Sprint 04 E2E scenarios passed 100%:
- `04-E2E-01`: Vertex tool places nodes with grid snapping
- `04-E2E-02`: Edge tool drag connects two nodes with wire
- `04-E2E-03`: Curvature handle bending interaction
- `04-E2E-04`: Marquee selection and multi-node dragging
- `04-E2E-05`: Keyboard delete and arrow-key nudge
