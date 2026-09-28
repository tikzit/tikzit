# Sprint 10: Canvas Stage Visual Parity & Teardrop Self-Loop Engine

## 1. Executive Summary & Vision
- **Objective**: Achieve exact visual fidelity on the Three.js WebGL canvas matching the desktop Qt `TikzView` and `TikzScene` implementations: a crisp white diagram paper canvas (`#FFFFFF`), subtle blue-lavender coordinate axes and grid lines, dashed junction circles for `style=none` nodes, and the signature upward teardrop self-loops.
- **Architectural Leads**:
  - **Winston (System Architect)**: Canvas stage paper-sheet architecture, grid shader color calibration, and mathematical curvature model for self-loops.
  - **Amelia (Senior Software Engineer)**: Shaders, node/edge renderers, tool interaction handlers, unit tests, and Playwright E2E verification.

---

## 2. Desktop Visual Baseline & Geometry Specifications

From our reverse-engineering of `tikzview.cpp`, `nodeitem.cpp`, `edge.cpp`, and `style.cpp`:

```
          (Teardrop Self-Loop)
                 _.-''''-._
               .'          '.
              /   cp1   cp2                |   (45) (135) |
                     /     /
               '.     v    .'
                 '-..___.-'
                    /                    | v |
               +-----------+
               |   ( o )   |  <- Junction Node (style=none)
               |  dashed   |     Center dot: #B4B4C8 (2 scene-px diameter)
               |  boundary |     Dashed ring: #B4B4DC, pen 2.0 scene px,
               +-----------+     dashPattern [1,2] in pen-width units
                                 = effective dash 2.0 / gap 4.0 scene px
                                 = 0.05 / 0.10 TikZ units
                                 Radius: 0.20 units (8 scene px)
```

### 2.1 Grid & Axis Exact Color Calibration (`tikzview.cpp`)
Constants: `GLOBAL_SCALEF = 40` (1 TikZ unit = 40 scene px), `GRID_SEP = 10` scene px, `GRID_N = 4` (`src/tikzit.h:78-82`).
1. **Background**: Pure white (`#FFFFFF`) paper surface (`tikzview.cpp:32`), decoupled from outer dark window chrome (Contract A §5).
2. **Central Axes**: `QColor(220, 220, 240)` -> **`#DCDCF0`** (`THREE.Color('#DCDCF0')`), spanning `x=0` and `y=0`. *(Note: 240 is 0xF0; do not use #DCDCFA).*
3. **Major Grid**: `QColor(240, 240, 250)` -> `#F0F0FA` (`THREE.Color('#F0F0FA')`), interval `GRID_SEP * GRID_N` = 40 scene px (`1.0` TikZ unit).
4. **Minor Grid**: `QColor(250, 250, 255)` -> `#FAFAFF` (`THREE.Color('#FAFAFF')`), interval `GRID_SEP` = 10 scene px (`0.25` TikZ unit, visible when `_scale > 0.2` → `pixelsPerUnit > 8`; `tikzview.cpp:79`).
5. **Shader In-Line Alpha**: Raise line blend alphas to `1.0` to render pure unattenuated hex values instead of washed-out blends.
6. **Initial Zoom Framing**: The desktop view defaults to `_scale = 2.5` → **100 scene px per TikZ unit** (`tikzview.cpp:34-35`). The web default camera zoom is initialized to 100 px/unit to match desktop screenshot framing.

### 2.2 Junction Node Visual Formulation (`nodeitem.cpp`)
For nodes with `style=none` or unstyled blank nodes:
1. Center point: Small solid disk, radius 1 scene px (2 scene-px diameter; `drawEllipse(QPointF(0,0), 1, 1)`), color `#B4B4C8` (`QColor(180, 180, 200)`).
2. Boundary circle: Dashed stroke, radius `0.20` TikZ units (`8 scene px` at `scale=40`; `nodeitem.cpp:172`), color `#B4B4DC` (`QColor(180, 180, 220)`), stroke width `2.0` scene px.
   - Dash pattern: `pen.setDashPattern([1.0, 2.0])` is in pen-width units (`widthF 2.0`), giving dash 2.0 scene px / gap 4.0 scene px = **`0.05` dash / `0.10` gap TikZ units**. (Correct `gapSize` from 0.05 to 0.10).
   - WebGL Linewidth Guard: Reconstruct the dashed ring using `LineSegments` geometry buffer or ribbon mesh to ensure 2px visual width across all WebGL viewports.
3. Selection indicator: Translucent blue halo `QColor(150, 200, 255, 100)` (alpha `100/255 ≈ 0.392` → `rgba(150, 200, 255, 0.39)`) expanding 2 scene px beyond the boundary.

### 2.3 Teardrop Self-Loop Engine (`edge.cpp`, `edgeitem.cpp`, `graph.cpp`)

When creating an edge where `sourceId === targetId` (node identity, not coordinate coincidence):
1. **Curvature Angles**: `_outAngle = 45°`, `_inAngle = 135°` (`edge.cpp:43-44`), `_basicBendMode = false`.
2. **Curvature Weight**: `_weight = 1.0`; `_cpDist = _weight` (1.0 TikZ unit = 40 scene px).
3. **Control Points**:
   - `cp1 = src + 1.0 * (cos(45°), sin(45°))`
   - `cp2 = target + 1.0 * (cos(135°), sin(135°))`
4. **Endpoints**: For `style=none` nodes, `tail` and `head` connect to node center (`edge.cpp:189-201`); styled nodes inset 0.2 units.
5. **Visual Ribbon Stroke**: Solid black (`#000000`), stroke width `0.05` TikZ units (`2.0` scene px, `halfWidth = 0.025`). The stroke is ALWAYS solid black on the white paper canvas regardless of whether the outer workbench theme is dark or light.
6. **TikZ AST Emission** (`edge.cpp:255-297`, `graph.cpp:304-333`): Normalizes properties to:
   ```latex
   \draw [in=135, out=45, loop] (u) to ();
   ```
   Note: `style=none` is omitted, property order is `[style=<name>?, in=135, out=45, loop]`, and the target is empty `()`.

---

## 3. Implementation Steps & Acceptance Criteria (Amelia)

| Step | Task | Deliverable | Acceptance Criteria |
| :--- | :--- | :--- | :--- |
| **10.1** | Grid Shader Calibration | `src/canvas/shaders/gridShader.ts` | Exact C++ RGB values (`#FFFFFF` bg, `#DCDCF0` axis, `#F0F0FA` major, `#FAFAFF` minor); minor grid gated at `pixelsPerUnit > 8`; in-line mix alpha 1.0 |
| **10.2** | Stage Paper Theme Integration | `src/canvas/Stage.ts` | Canvas paper is always pure white (`#FFFFFF`), decoupled from chrome theme (Contract A §5); default camera zoom 100 px/unit |
| **10.3** | Junction Node Geometric Ring | `src/canvas/renderers/NodeRenderer.ts` | `style=none` nodes render center dot (`#B4B4C8`) and dashed ring (`#B4B4DC`, dash 0.05 / gap 0.10) with 2px geometric width |
| **10.4** | Teardrop Self-Loop Ribbon | `src/canvas/bezier.ts` & `src/canvas/renderers/EdgeRenderer.ts` | `sourceId === targetId` computes `in=135`, `out=45`, `weight=1.0`; rendered as 2.0 scene-px (`0.05` u) black ribbon |
| **10.5** | Self-Loop Interaction | `src/canvas/tools/EdgeTool.ts` | Press-release on same node (or two-click on same node) creates self-loop; node identity checked via IDs |
| **10.6** | Emission Normalization | `src/core/parser/emitter.ts` & `EdgeTool.ts` | Self-loop emits `[style=<name>?, in=135, out=45, loop]`, `style=none` omitted, empty `()` target |
| **10.7** | Test Suite Verification | `tests/unit/canvas/desktopVisuals.test.ts` & `e2e/sprint-10/canvas-desktop-parity.spec.ts` | 100% green tests verifying grid colors, junction rings, self-loop topology, and 59 prior tests |

### Detailed Acceptance Criteria:
- **AC-10-01**: `GRID_THEMES.desktop` (used for paper canvas) matches exact C++ hex codes: bg `#FFFFFF`, minor `#FAFAFF`, major `#F0F0FA`, axis `#DCDCF0`.
- **AC-10-02**: Grid shader renders axes at `x=0` and `y=0` with clear distinction from grid lines, cosmetic lines responsive to zoom, minor grid hidden when `pixelsPerUnit <= 8`.
- **AC-10-03**: `NodeRenderer` produces visible dashed `#B4B4DC` rings (dash 0.05 / gap 0.10 units) with `#B4B4C8` center dots for junction nodes on the white canvas.
- **AC-10-04**: Press-release or two-click on a node with the Edge tool creates an upward teardrop self-loop with `in=135`, `out=45`, `weight=1.0`.
- **AC-10-05**: Emitted TikZ syntax contains `\draw [in=135, out=45, loop] (u) to ();` for self-loop edges without `style=none`.
- **AC-10-06**: `computeEdgeControls` evaluates self-loops by node identity (`sourceId === targetId`), not coordinate coincidence.
- **AC-10-07**: Edge ribbon renders in solid black `#000000` on the white canvas regardless of outer UI dark/light theme setting.
- **AC-10-08**: Vitest suite passes >= 6 tests validating math and shaders; Playwright E2E suite passes validating canvas visual elements; zero regressions in 59 prior tests.

---

## 4. Verification Sources (C++ → AC Traceability)

| AC / Claim | C++ Source of Truth | Verified Value |
| :--- | :--- | :--- |
| AC-10-01 grid colors | `src/gui/tikzview.cpp:66-75` | minor `QColor(250,250,255)` `#FAFAFF`; major `QColor(240,240,250)` `#F0F0FA`; axes `QColor(220,220,240)` **`#DCDCF0`** |
| Grid intervals | `src/tikzit.h:78-82` | `GRID_SEP=10`, `GRID_N=4`, `GLOBAL_SCALEF=40` → minor 10 px (`0.25 u`), major 40 px (`1.0 u`) |
| Minor-grid threshold | `tikzview.cpp:79` | visible when `_scale > 0.2` → `pixelsPerUnit > 8` |
| Initial zoom | `tikzview.cpp:34-35` | `_scale = 2.5` → 100 px/unit |
| Junction dot/ring | `src/gui/nodeitem.cpp:72-85, 145-175` | dot `#B4B4C8` r=1 px; ring `#B4B4DC` dash 0.05 / gap 0.10 units, radius `0.20` u |
| Selection halo | `nodeitem.cpp:133-140` | `QColor(150,200,255,100)` ≈ alpha 0.39; 2 px visible expansion beyond boundary |
| Self-loop defaults | `src/data/edge.cpp:34-46` | `s==t` → `_basicBendMode=false`, `in=135`, `out=45`, `weight=1.0` |
| Edge stroke | `src/data/style.cpp:90-93, 168-192` | pen width `strokeThickness()*2.0` = 2.0 scene px = `0.05` TikZ units (`#000000`) |
| Emission | `edge.cpp:255-297`, `src/data/graph.cpp:304-333` | `[style?, in=135, out=45, loop]`, `style=none` omitted, `to ();` |

---

## 5. Definition of Done (DoD) Checklist

- [x] Canvas background calibrated to pure white (`#FFFFFF`) with exact axes (`#DCDCF0`) and grid lines (`#F0F0FA` / `#FAFAFF`).
- [x] Canvas paper sheet decoupled from outer dark window chrome.
- [x] Junction nodes (`style=none`) render with center dot (`#B4B4C8`) and geometric dashed boundary ring (`#B4B4DC`, dash 0.05 / gap 0.10).
- [x] Edge tool creates self-loops with upward teardrop geometry (`in=135°`, `out=45°`, `weight=1.0`) on node click/drag-to-self.
- [x] Edges render as crisp solid black ribbons (`#000000`, `0.05` TikZ units = 2.0 scene px) on the white paper canvas.
- [x] AST and emitter round-trip self-loop properties in canonical order `[style?, in=135, out=45, loop]` with `style=none` omitted and `to ()` target.
- [x] Unit tests in `tests/unit/canvas/desktopVisuals.test.ts` pass 100%.
- [x] Playwright E2E tests in `e2e/sprint-10/canvas-desktop-parity.spec.ts` pass 100%.
- [x] TypeScript compilation (`npx tsc --noEmit`) passes with 0 errors.
