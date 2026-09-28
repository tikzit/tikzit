# Sprint 06: Live TeX Preview & Exporters
**Directory:** `docs/sprints/preview/06-preview-pipeline-and-exporters`

## Overview
In-browser TeX/SVG compilation pipeline, interactive preview panel with zoom/pan, preamble manager, Markdown card viewlet, and multi-format exporters (SVG, PNG 1x/2x/4x, PDF, TikZ, standalone TeX).

---

## Status
* **Lifecycle State:** ✅ **Completed & Graduated**
* **Final Specification:** [`SPRINT-06-PREVIEW-PIPELINE-AND-EXPORTERS.md`](./SPRINT-06-PREVIEW-PIPELINE-AND-EXPORTERS.md)

---

## Accomplishments & Deliverables
1. **ADR-006 Decision Spike (`docs/decisions/preview-engine.md`)**:
   - Comprehensive comparative evaluation of WebAssembly TeX, remote compilation, and hybrid vector-first synthesis.
   - Selected hybrid architecture delivering instantaneous (<2ms) interactive vector SVG preview while supporting standalone LaTeX generation and pluggable TeX compilation.

2. **Preamble Configuration Manager (`src/services/preview/PreambleManager.ts`)**:
   - Matches desktop TikZiT `tikzit.sty` standard macros, dummy property keys, and layer declarations (`edgelayer`, `nodelayer`, `main`).
   - Validates allowlisted packages (`tikz`, `amsmath`, `amssymb`, etc.) and TikZ libraries (`arrows.meta`, `shapes`, etc.).
   - Persists user custom preamble configurations across sessions via local storage.

3. **Standalone Vector SVG Generator (`src/services/preview/SvgGenerator.ts`)**:
   - Synthesizes vector SVG directly from `GraphAST` and `TikzStylesCatalog`.
   - Cartesian TikZ to SVG canvas transformation, cubic Bézier spline calculation via `computeEdgeControls`, and self-loop generation.
   - Desktop TikZiT visual parity for junction nodes (`style=none`: dashed circle + center dot).

4. **Multi-Format Exporters (`src/services/export/ImageExporter.ts` & `PdfExporter.ts`)**:
   - One-click formatted TikZ copy to clipboard with toast notification.
   - Standalone `.svg` vector file download with accurate bounding box.
   - High-resolution `.png` rasterization at 1x, 2x (Retina), and 4x (print / 300+ DPI) scales.
   - Standalone compliant PDF-1.4 vector document generation.
   - Standalone `.tex` document download with complete preamble and styles.

5. **Live TeX Preview Panel (`src/components/workbench/panels/PreviewPanel.tsx`)**:
   - Interactive viewport with wheel zoom, drag-to-pan, Zoom In, Zoom Out, 100% Reset, and Fit to Window.
   - Auto-compile toggle switch pausing and resuming real-time synchronization.
   - Universal Export dropdown toolbar with PNG resolution selector.
   - LaTeX Preamble configuration modal and TeX Compiler Logs drawer.

6. **Markdown Viewlet & Compiler (`src/services/markdown/markdownCompiler.ts` & `MarkdownViewlet.tsx`)**:
   - Compiles Markdown notes, callouts, math formulas, and inline ```tikz fences into rich HTML with embedded live SVG diagrams.

---

## Verification & Metrics
- **Unit Tests:** 148 passed across 27 suites (`tests/unit/`).
- **E2E Tests:** 48 passed across 8 suites (`e2e/`), including 6 new tests in `e2e/sprint-06/preview-exporters.spec.ts`.
- **TypeScript:** 0 errors via `npx tsc --noEmit`.
- **Production Build:** `npm run build` compiles cleanly in ~300ms.
