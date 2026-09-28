# Sprint 14: Live TeX Preview Curvature & Edge Geometry Synchronization
**Directory:** `docs/sprints/preview/14-live-tex-preview-curvature-synchronization`  
**Status:** ✅ Completed (Graduated)  
**Date:** 2026-10-01  

## Executive Summary
Synchronized the Live TeX Preview rendering engine (`SvgGenerator.ts` / `PreviewPanel.tsx`) with the interactive Vector Canvas (`EdgeRenderer.ts` / `SelectTool.ts`) so that curved edges — authored via interactive curvature handles or parsed from TikZ source (`bend left`, `bend right`, `in`, `out`, `looseness`) — render as accurate cubic Bézier splines in the preview instead of collapsing to straight lines. The sprint also closed the internal model asymmetry: `SelectTool.ts` and the parser now update `edge.data` and `edge.bend` synchronously, and endpoint insets (`controls.tail`/`controls.head`) match node perimeters.

## Verification & Test Results
* **Unit Tests (Vitest):** `tests/unit/preview/svgGenerator.test.ts` — curvature-to-Bézier and inset assertions passing.
* **E2E Tests (Playwright):** `e2e/sprint-14/preview-curvature.spec.ts` — dragging a curvature handle updates the preview from `L` to `C` segments, verified across Chromium, Firefox, and WebKit.
* **Sprint Totals:** 38 Vitest files (219 unit tests, 100% green) and 18 Playwright E2E suites (270 cross-browser runs, 100% green).

## Documents
* **Master Specification:** [`SPRINT-14-LIVE-TEX-PREVIEW-CURVATURE-SYNCHRONIZATION.md`](./SPRINT-14-LIVE-TEX-PREVIEW-CURVATURE-SYNCHRONIZATION.md)
