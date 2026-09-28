# Sprint 03: Three.js WebGL Canvas Engine & Procedural Grid
**Directory:** `docs/sprints/canvas/03-threejs-webgl-canvas-engine`
**Status:** ✅ **Completed (Graduated)**
**Graduated Date:** 2026-09-27
**Specification:** [`SPRINT-03-THREEJS-WEBGL-CANVAS-ENGINE.md`](./SPRINT-03-THREEJS-WEBGL-CANVAS-ENGINE.md)

---

## 1. Overview

Sprint 03 delivered a high-performance, GPU-accelerated **Three.js WebGL canvas engine** tailored for visualizing quantum processes and TikZ diagrams with mathematical rigor and visual clarity:

1. **Orthographic 2D Viewport & Camera Controller**:
   - Cartesian coordinate alignment with TikZ (+X right, +Y up) in 1:1 units.
   - Smooth pan controls via middle-mouse drag and Space + Left Click drag.
   - Smooth mouse-wheel zooming centered directly at the cursor, clamping safely from 10% to 5,000%.
   - Exact bidirectional `screenToWorld` and `worldToScreen` coordinate transformations.
   - Responsive `ResizeObserver` lifecycle driving renderer size and camera frustum updates on Dockview sash dragging and group splits without canvas stretching.

2. **Infinite Procedural GLSL Grid Shader**:
   - Screen-space derivative anti-aliasing (`fwidth`) on a full-screen quad (`Z = -100`).
   - Adaptive major (1.0 TikZ unit) and minor (0.25 unit) grid lines with distance fading to eliminate moiré artifacts.
   - Visually distinct Cartesian origin axes $(x = 0, y = 0)$.
   - Real-time uniform updates toggling between dark (`#0D1117`) and light (`#F6F8FA`) calibrated themes.

3. **Node Geometry & Billboard Label Renderer**:
   - Multi-shape rendering supporting circles, rectangles, diamonds, and ellipse geometries.
   - Full fidelity PQP palette: Z-spider green (`#5AD25A`), X-spider red (`#EB4B4B`), and Hadamard yellow (`#FFDC46`).
   - High-resolution billboard text sprites for mathematical phases ($lpha, eta, \psi$) crisp at all zoom scales.
   - Active element selection rings (`#388BFD`).

4. **Curved Edge & Spline Renderer**:
   - Strict mathematical parity with desktop TikZiT `Edge::updateControls` (`src/data/edge.cpp`).
   - Evaluates cubic Bézier curves through 32 subdivisions with 15° angle snapping in basic bend mode, direct mapping in advanced mode, and desktop-parity 0.2 endpoint insets (zero-inset for `style=none` junctions).
   - Closed-form first derivatives for exact directional arrowhead tangents: $B'(1) = 3(\mathbf{head} - \mathbf{cp}_2)$ and $B'(0) = 3(\mathbf{cp}_1 - \mathbf{tail})$.
   - Dashed and dotted wire shaders.

5. **Dockview & Harness Integration**:
   - Integrated into [`src/components/workbench/panels/CanvasPanel.tsx`](../../../../src/components/workbench/panels/CanvasPanel.tsx) with HUD readout (FPS, units, element count).
   - Dedicated E2E runner harness at [`src/pages/test-harness/canvas-runner.astro`](../../../../src/pages/test-harness/canvas-runner.astro).

---

## 2. Architecture & Deliverables

| Module | Source Location | Description |
| :--- | :--- | :--- |
| **Bézier Math Engine** | [`src/canvas/bezier.ts`](../../../../src/canvas/bezier.ts) | Parity implementation of `Edge::updateControls`, cubic interpolation, and closed-form arrowhead tangents. |
| **Procedural Grid Shader** | [`src/canvas/shaders/gridShader.ts`](../../../../src/canvas/shaders/gridShader.ts) | GLSL fragment shader rendering infinite anti-aliased grid lines on a clip-space quad at Z = -100. |
| **Camera Controller** | [`src/canvas/CameraController.ts`](../../../../src/canvas/CameraController.ts) | Orthographic camera navigation with cursor-centered zoom, middle/space panning, and coordinate conversions. |
| **Node Renderer** | [`src/canvas/renderers/NodeRenderer.ts`](../../../../src/canvas/renderers/NodeRenderer.ts) | Meshes, borders, selection highlights, and billboard text sprites for circles, rectangles, diamonds, and dots. |
| **Edge Renderer** | [`src/canvas/renderers/EdgeRenderer.ts`](../../../../src/canvas/renderers/EdgeRenderer.ts) | Sampled cubic Bézier lines, directional arrowheads, and dashed/dotted stroke styles. |
| **WebGL Stage** | [`src/canvas/Stage.ts`](../../../../src/canvas/Stage.ts) | Central WebGL stage container managing Three.js scene graph, renderers, ResizeObserver, and context loss recovery. |
| **Canvas Panel** | [`src/components/workbench/panels/CanvasPanel.tsx`](../../../../src/components/workbench/panels/CanvasPanel.tsx) | Dockview panel host binding WebGL Stage to Nanostores `$graphAST`, `$theme`, and `$selectedElements`. |
| **Canvas Test Harness** | [`src/pages/test-harness/canvas-runner.astro`](../../../../src/pages/test-harness/canvas-runner.astro) | E2E browser harness exposing `window.TestCanvas` with pre-compiled PQP corpus diagrams. |

---

## 3. Verification & Test Evidence

### 3.1 TypeScript 7 Compiler
- Command: `npx tsc --noEmit`
- Status: **PASSED (0 errors)**

### 3.2 Unit & Integration Suites (Vitest)
Ran via `npx vitest run`: **74 / 74 passing tests across 15 test files (100% green in ~290ms)**
- [`tests/unit/canvas/bezier.test.ts`](../../../../tests/unit/canvas/bezier.test.ts) (8 tests): Straight edges, bend left/right with 15° snapping, endpoint insets, advanced in/out angles, self-loops, and arrowhead tangents.
- [`tests/unit/canvas/grid.test.ts`](../../../../tests/unit/canvas/grid.test.ts) (3 tests): Shader uniform initialization, dynamic pan/zoom scaling, and dark/light theme switching.
- [`tests/unit/canvas/camera.test.ts`](../../../../tests/unit/canvas/camera.test.ts) (4 tests): Screen/world coordinate transformations, cursor-centered zoom invariance, and pan offsets.
- [`tests/unit/canvas/disposal.test.ts`](../../../../tests/unit/canvas/disposal.test.ts) (2 tests): 500-node and 500-edge lifecycle disposal and memory leak prevention.
- All previous unit suites (shell, kernel, keybindings, runtime, triad, gated-commit, parser): **57 / 57 passing tests**.

### 3.3 Playwright End-to-End Suite
Ran via `npx playwright test`: **26 / 26 passing tests (100% green in ~11s)**
- [`e2e/sprint-03/webgl-canvas.spec.ts`](../../../../e2e/sprint-03/webgl-canvas.spec.ts) (5 tests):
  - **03-E2E-01**: Mounts WebGL canvas and initializes rendering context (`webgl2` / `webgl`).
  - **03-E2E-02**: Loads and verifies all 12 canonical PQP corpus diagrams deterministically.
  - **03-E2E-03**: Interactive middle-mouse drag panning and wheel zooming with coordinate projection accuracy.
  - **03-E2E-04**: WebGL context loss (`WEBGL_lose_context`) and automatic scene recovery resilience.
  - **03-E2E-05**: Viewport frame-time measurement during stress testing (1,000 elements pan/zoom).
- All previous E2E suites (`e2e/sprint-00/`, `e2e/sprint-01/`, `e2e/sprint-02/`, `e2e/corpus/`): **21 / 21 passing tests**.

### 3.4 Astro 7 Production Build
- Command: `npm run build`
- Status: **PASSED (3 pages built in ~370ms)** with zero bundling errors.

---

## 4. Graduation Confirmation

All criteria outlined in the **Sprint 03 Definition of Done (DoD)** have been implemented, tested across unit and E2E layers, and officially graduated.
