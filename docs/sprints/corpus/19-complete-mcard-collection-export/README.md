# Sprint 19: Complete MCard Diagram Collection Export
**Directory:** `docs/sprints/corpus/19-complete-mcard-collection-export`  
**Status:** ✅ Completed (Graduated)  
**Date:** 2026-09-28  

## Executive Summary
Replaced the legacy single-pass `Save Corpus (.db)` button with a verified, scoped `Export Collection…` dialog (`ExportCollectionDialog.tsx`). Implemented full graph traversal across all diagram handles (`zx:examples:`, `zx:diagrams:`), companion metadata handles (`zx:meta:diagrams:`), and full lineage closures (including complex A->B->A restore graphs). Excluded orphan cards, execution receipts, and knowledge records (D3). Captured a single atomic snapshot at export initiation (19-AC-08) with cryptographic validation and proven round-trip compatibility into `mcard-studio`.

## Verification & Test Results
* **Collection Export (Vitest):** `tests/unit/clm/mcard-collection-export.test.ts`, `tests/unit/clm/corpus-export.test.ts` — traversal, exclusion rules, snapshot capture, and round-trip verification passing.
* **E2E Tests (Playwright):** `e2e/sprint-19/collection-export.spec.ts` — full suite passing across Chromium, Firefox, and WebKit.
* **Cross-Repo Verification:** Pinned `mcard-studio` round-trip test green against specification `126cb34948e184748a21a472367b1878011b4980`.

## Documents
* **Master Specification:** [`SPRINT-19-COMPLETE-MCARD-COLLECTION-EXPORT.md`](./SPRINT-19-COMPLETE-MCARD-COLLECTION-EXPORT.md)
* **Parent Proposal:** [`PROPOSAL-16-19-MCARD-DIAGRAM-LIFECYCLE-HISTORY-AND-EXPORT.md`](../../orchestration/16-19-mcard-diagram-lifecycle-history-and-export/PROPOSAL-16-19-MCARD-DIAGRAM-LIFECYCLE-HISTORY-AND-EXPORT.md)
