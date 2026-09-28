# Proposal & Architecture: Sprints 16–19 — First-Class MCard Diagrams, History & Export
**Directory:** `docs/sprints/orchestration/16-19-mcard-diagram-lifecycle-history-and-export`  
**Status:** ✅ Completed (Graduated)  
**Date:** 2026-09-28  

## Executive Summary
Establishes the umbrella architecture, lifecycle invariants, shared data/event contracts, and product owner decisions (D1–D10) for unifying diagram creation, metadata tracking, version history, non-destructive restore, individual multi-format export, and sovereign SQLite collection export under the content-addressed MCard model. The proposal was refined through a three-lens review (adversarial critique, edge-case analysis, structural editing) with findings verified directly against the TypeScript source and CLM kernel before implementation.

## Umbrella Scope & Realization
* **Sprint 16 (Corpus):** Carry-over hardening (H1–H8), unified `isDiagramHandle` predicate, snapshot v2 schema, and explicit save to MCard.
* **Sprint 16B (Corpus):** Diagram library management (rename, duplicate, archive), multi-tab dirty safety (`CloseTabDialog`), session durability across reload, and legacy `DocumentStore` migration.
* **Sprint 17 (Corpus):** MCard lineage version history popover (`VersionPopover`), commit labels, non-destructive preview/compare, and truthful non-rewinding restore.
* **Sprint 17B (Shell):** Prominent Draft-to-MCard save CTA (`btn-save-diagram`, amber badge), in-canvas callout, and smooth mode transition.
* **Sprint 18 (Preview):** Individual diagram export dialog (`ExportDiagramDialog`) supporting verbatim TikZ, standalone TeX, SVG, PNG (1x/2x/4x), and PDF with style presets.
* **Sprint 19 (Corpus):** Verified collection export (`ExportCollectionDialog`), full lineage closure traversal, cryptographic validation, and pinned `mcard-studio` round-trip.

## Verification & Test Results
* **Vitest Suite:** 57 test files, **355 unit and integration tests passing** (100% green).
* **Playwright Suite:** **392 end-to-end browser tests passing** across Chromium, Firefox, and WebKit (100% green).
* **PQP Canonical Corpus:** 12/12 canonical ZX diagrams verified (0 errors).
* **Cross-Repo Compatibility:** Pinned `mcard-studio` reference round-trip verified against specification `126cb34948e184748a21a472367b1878011b4980`.

## Documents
* **Umbrella Specification:** [`PROPOSAL-16-19-MCARD-DIAGRAM-LIFECYCLE-HISTORY-AND-EXPORT.md`](./PROPOSAL-16-19-MCARD-DIAGRAM-LIFECYCLE-HISTORY-AND-EXPORT.md)
