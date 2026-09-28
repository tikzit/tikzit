# Sprint 18: Individual Diagram Export
**Directory:** `docs/sprints/preview/18-individual-diagram-export`  
**Status:** ✅ Completed (Graduated)  
**Date:** 2026-09-28  

## Executive Summary
Delivered an accessible, multi-format individual diagram export dialog (`ExportDiagramDialog.tsx`) available from the active document header and any Explorer drawer row. Supports verbatim TikZ (`.tikz`), standalone TeX document wrapper (`.tex`), scalable vector SVG (`.svg`), raster PNG (`.png` at 1x, 2x, and 4x retina resolutions), and PDF (`.pdf`) with TikZ style presets. Implemented source selection between current uncommitted edits and the saved head version (D4), backed by File System Access API with Blob fallback.

## Verification & Test Results
* **Exporters & Formatting (Vitest):** `tests/unit/export/individualExport.test.ts`, `tests/unit/export/pureExporters.test.ts`, `tests/unit/export/exportNaming.test.ts`, `tests/unit/export/saveArtifact.test.ts` — full suite passing.
* **E2E Tests (Playwright):** `e2e/sprint-18/individual-export.spec.ts` — modal interactions, format selections, and export outputs passing across Chromium, Firefox, and WebKit.

## Documents
* **Master Specification:** [`SPRINT-18-INDIVIDUAL-DIAGRAM-EXPORT.md`](./SPRINT-18-INDIVIDUAL-DIAGRAM-EXPORT.md)
* **Parent Proposal:** [`PROPOSAL-16-19-MCARD-DIAGRAM-LIFECYCLE-HISTORY-AND-EXPORT.md`](../../orchestration/16-19-mcard-diagram-lifecycle-history-and-export/PROPOSAL-16-19-MCARD-DIAGRAM-LIFECYCLE-HISTORY-AND-EXPORT.md)
