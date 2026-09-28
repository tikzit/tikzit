# Sprint 14: Live TeX Preview Curvature & Edge Geometry Synchronization

## 1. Executive Summary & Strategic Objective
- **Objective**: Synchronize the Live TeX Preview rendering engine (`SvgGenerator.ts` / `PreviewPanel.tsx`) with the interactive Vector Canvas (`EdgeRenderer.ts` / `SelectTool.ts`), so that curved edges—whether authored via interactive curvature handles or parsed from TikZ source (`bend left`, `bend right`, `in`, `out`, `looseness`)—are accurately rendered as cubic Bézier splines in the Live TeX Preview rather than collapsing to straight lines (`--`).
- **Context & Motivation**:
  - In TikZiT Web v2.2.0, the Vector Canvas (Three.js) successfully renders curved edges using sampled cubic Bézier splines and displays interactive curvature handles.
  - However, in the **Live TeX Preview** panel, edges with edited curvature remain drawn as straight lines (`M sx sy L tx ty`), causing a stark visual discrepancy between the canvas stage and the preview.
  - This sprint closes the visual gap, aligning the preview SVG generator with desktop TikZiT geometry, endpoint insets, and curvature data properties.
- **Architectural Leads**:
  - **Winston (System Architect)**: Mathematical geometry alignment, domain AST curvature contract, and rendering pipeline parity.
  - **Amelia (Senior Software Engineer)**: Implementation, unit test coverage in `svgGenerator.test.ts`, and Playwright E2E verification in `preview-curvature.spec.ts`.

---

## 2. Root Cause Analysis & As-Is vs. To-Be Gap Analysis

### 2.1 Technical Root Causes
1. **Narrow Curvature Detection in `SvgGenerator.ts`**:
   - `SvgGenerator.ts:106` currently checks: `const isCurved = isSelfLoop || edge.bend !== undefined || (edge.inAngle !== undefined && edge.outAngle !== undefined);`
   - When users interactively drag the curvature handle in `SelectTool.ts`, the tool appends `{ key: 'bend left', value: '...' }` or `{ key: 'bend right', value: '...' }` to `edge.data`, but leaves `edge.bend` as `undefined`.
   - Likewise, when `parser.ts` parses `\draw [bend left=30] (0) to (1);`, it stores properties in `edge.data`, leaving top-level `edge.bend` unset.
   - Consequently, `isCurved` evaluates to `false`, and `SvgGenerator.ts` emits a straight line path: `M sx sy L tx ty`.
2. **Missing `data: edge.data` in Control Point Computation**:
   - Even when `isCurved` is forced, `SvgGenerator.ts` calls `computeEdgeControls({ src: p0, target: p1, bend: edge.bend, inAngle: edge.inAngle, outAngle: edge.outAngle, weight: edge.weight })`.
   - Without `data: edge.data`, `computeEdgeControls` in `bezier.ts` cannot inspect `bend left`, `bend right`, `in`, `out`, or `looseness`.
3. **Endpoint Node Inset Discrepancy**:
   - `SvgGenerator.ts` connects paths directly from center-to-center (`p0` to `p1`), whereas `EdgeRenderer.ts` uses `controls.tail` and `controls.head` to inset edges to the node perimeter (matching desktop TikZiT).
4. **AST Property Desynchronization in `SelectTool.ts`**:
   - `SelectTool.ts` updates `edge.data` but does not synchronize `edge.bend`, creating an internal model asymmetry between AST properties and typed fields.

### 2.2 As-Is vs. Target Intentional Design Gap Analysis

| Aspect | Current Implementation (As-Is) | Target Intentional Design (To-Be) | Impacted Files |
| :--- | :--- | :--- | :--- |
| **Curvature Detection** | Only checks `edge.bend !== undefined` or explicit angles | Checks `edge.bend`, `edge.data` (`bend left/right`, `in/out`, `loop`), and explicit angles | `src/services/preview/SvgGenerator.ts` |
| **Control Point Inputs** | Passes only raw coordinates without `edge.data` | Passes `data: edge.data`, `srcStyle`, and `targetStyle` to `computeEdgeControls` | `src/services/preview/SvgGenerator.ts` |
| **Path Spline Geometry** | Emits `M sx sy L tx ty` (straight) when `edge.bend` unset | Emits `M tailX tailY C cp1x cp1y, cp2x cp2y, headX headY` with node perimeter insets | `src/services/preview/SvgGenerator.ts` |
| **Tool Property Sync** | `SelectTool.ts` updates only `edge.data` | `SelectTool.ts` updates both `edge.data` and `edge.bend` synchronously | `src/canvas/tools/SelectTool.ts` |
| **Parser AST Ingestion** | `parser.ts` puts bend/in/out only in `edge.data` | `parser.ts` populates both `edge.data` and typed `edge.bend`, `inAngle`, `outAngle` | `src/core/parser/parser.ts` |
| **Unit Verification** | `svgGenerator.test.ts` only tests hardcoded `bend: 30` | Tests curvature from `bend left=...`, `bend right=...`, atoms, insets, and self-loops | `tests/unit/preview/svgGenerator.test.ts` |
| **E2E Verification** | No test asserting live preview curve updates on drag | Playwright E2E test verifying curvature handle drag immediately curves SVG in preview | `e2e/sprint-14/preview-curvature.spec.ts` |

---

## 3. Winston's Technical Architecture Specification

```
+-------------------------------------------------------------------------------------------------------------------------+
|                                              CURVATURE DATA FLOW & RENDERING                                            |
|                                                                                                                         |
|   [User Drag / Handle]  ──>  [SelectTool.ts]                                                                            |
|                                   │                                                                                     |
|                                   ├─ updates edge.data: [{ key: 'bend left', value: '35' }]                            |
|                                   ├─ updates edge.bend: -35 (signed convention)                                        |
|                                   ▼                                                                                     |
|                          [commitGraphChange] ──> [$graphAST Store] ──> [emitter.ts: \draw [bend left=35] ...]          |
|                                   │                                                                                     |
|                  ┌────────────────┴────────────────┐                                                                    |
|                  ▼                                 ▼                                                                    |
|      [Canvas: EdgeRenderer.ts]           [Live TeX Preview: SvgGenerator.ts]                                            |
|      - computeEdgeControls({             - isCurved = isEdgeCurved(edge)                                                |
|          src, target,                    - computeEdgeControls({                                                        |
|          bend, data: edge.data,              src, target,                                                               |
|          srcStyle, targetStyle               bend, data: edge.data,                                                     |
|        })                                    srcStyle, targetStyle                                                      |
|      - 32-segment Three.js Bézier        - SVG path: 'M tail C cp1, cp2, head'                                          |
|      - Yellow curvature handle           - Crisp preview matching canvas geometry!                                      |
+-------------------------------------------------------------------------------------------------------------------------+
```

### 3.1 Curvature Detection Predicate (`isEdgeCurved`)
An edge must be recognized as curved if ANY of the following hold:
1. `edge.sourceId === edge.targetId` (self-loop).
2. `edge.bend !== undefined && edge.bend !== 0`.
3. `edge.inAngle !== undefined && edge.outAngle !== undefined`.
4. `edge.data` contains atom `'bend left'` or `'bend right'`.
5. `edge.data` contains key-value `'bend left'` or `'bend right'` with non-zero angle.
6. `edge.data` contains both `'in'` and `'out'` angle properties.
7. `edge.data` contains atom or key-value `'loop'`.

### 3.2 Bézier Control Point & Inset Calculation
`SvgGenerator.ts` must utilize `computeEdgeControls` from `src/canvas/bezier.ts`:
- **Input Parameters**:
  ```typescript
  const controls = computeEdgeControls({
    src: p0,
    target: p1,
    sourceId: edge.sourceId,
    targetId: edge.targetId,
    srcStyle: resolveStyleName(srcNode),
    targetStyle: resolveStyleName(tgtNode),
    bend: edge.bend,
    inAngle: edge.inAngle,
    outAngle: edge.outAngle,
    weight: edge.weight,
    data: edge.data,
  });
  ```
- **Path Output**:
  - Start point: `toSvgX(controls.tail.x), toSvgY(controls.tail.y)` (inset to node perimeter).
  - Control point 1: `toSvgX(controls.cp1.x), toSvgY(controls.cp1.y)`.
  - Control point 2: `toSvgX(controls.cp2.x), toSvgY(controls.cp2.y)`.
  - End point: `toSvgX(controls.head.x), toSvgY(controls.head.y)`.
  - Spline format: `M ${sx} ${sy} C ${c1x} ${c1y}, ${c2x} ${c2y}, ${tx} ${ty}`.

### 3.3 Contract A: Dockview Invariants
- The TeX Preview panel (`PreviewPanel.tsx`) remains a sovereign Dockview panel with ID `preview`.
- Layout serialization and 0-panel guard are strictly preserved.

### 3.4 Contract B: E2E Selector Stability
- `[data-testid="panel-preview"]`, `[data-panel="preview"]`, `[data-testid="preview-status-badge"]`, `[data-testid="toggle-auto-compile"]`.
- SVG internal IDs: `#edgelayer`, `#nodelayer`, `#edge-{edgeId}`, `#node-{nodeId}`.

---

## 4. Amelia's Implementation Plan & Acceptance Criteria

| Step | Task | Target File | Acceptance Criteria |
| :--- | :--- | :--- | :--- |
| **14.1** | Enhance `SvgGenerator.ts` Curvature Detection | `src/services/preview/SvgGenerator.ts` | Implement `isEdgeCurved(edge)` checking `edge.data` (`bend left`, `bend right`, `in`, `out`, `loop`) and typed fields; pass `data: edge.data`, `srcStyle`, `targetStyle` to `computeEdgeControls`. |
| **14.2** | Accurate Insets and Bézier Splines in SVG | `src/services/preview/SvgGenerator.ts` | Use `controls.tail` and `controls.head` for start/end points; generate `M ... C ...` path; calculate accurate Bézier midpoint for edge labels. |
| **14.3** | Synchronize `edge.bend` in `SelectTool.ts` and `parser.ts` | `src/canvas/tools/SelectTool.ts`, `src/core/parser/parser.ts` | Keep `edge.bend` in sync with `bend left` (`-snappedBend`) and `bend right` (`+snappedBend`) during interactive handle dragging and AST parsing. |
| **14.4** | Unit Test Coverage for SVG Curvature | `tests/unit/preview/svgGenerator.test.ts` | Add tests verifying curved SVG path generation for `bend left=...`, `bend right=...`, atoms, and endpoint insets. |
| **14.5** | Playwright E2E Cross-Browser Verification | `e2e/sprint-14/preview-curvature.spec.ts` | Verify that dragging an edge's curvature handle on the canvas causes the Live TeX Preview to immediately update from a straight line (`L`) to a cubic Bézier curve (`C`). |

---

## 5. Definition of Done (DoD) Checklist

- [x] `SvgGenerator.ts` correctly detects edge curvature from `edge.data` (`bend left`, `bend right`, `in`, `out`, `loop`) and typed fields.
- [x] `computeEdgeControls` receives `data: edge.data`, `srcStyle`, and `targetStyle` from `SvgGenerator.ts`.
- [x] SVG path strings for curved edges emit cubic Bézier `M ... C ...` splines respecting node perimeter insets (`tail` and `head`).
- [x] `SelectTool.ts` synchronizes `edge.bend` when dragging the yellow curvature handle.
- [x] `parser.ts` extracts `bend`, `inAngle`, and `outAngle` into typed `EdgeData` fields upon parsing TikZ source.
- [x] Unit tests in `tests/unit/preview/svgGenerator.test.ts` pass 100%, covering property-driven curvature.
- [x] Playwright E2E suite `e2e/sprint-14/preview-curvature.spec.ts` passes across Chromium, Firefox, and WebKit (12/12 passing).
- [x] Zero regressions across all prior unit tests (219 tests pass) and Playwright tests (270 tests pass).
- [x] TypeScript check (`npx tsc --noEmit`) passes with 0 errors.
- [x] Production build (`npm run build`) succeeds with 0 errors.
