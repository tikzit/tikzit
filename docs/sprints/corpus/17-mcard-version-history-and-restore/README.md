# Sprint 17: MCard Version History & Restore
**Directory:** `docs/sprints/corpus/17-mcard-version-history-and-restore`  
**Status:** ✅ Completed (Graduated)  
**Date:** 2026-09-28  

## Executive Summary
Bound the top-bar History popover (`VersionPopover.tsx`) to the diagram's real MCard lineage rather than the legacy shadow store. Rendered chronologically ordered version timelines with positions, human-readable labels, author DIDs, and ISO timestamps. Integrated non-destructive side-by-side Preview and Visual Compare modes that never mutate the active document buffer, and implemented truthful non-rewinding restore by re-registering historical head cards.

## Verification & Test Results
* **History & Restore (Vitest):** `tests/unit/clm/sprint17-history-and-restore.test.ts` — lineage tracking, A->B->A restore semantics, preview/compare isolation, and handle re-registration passing.
* **E2E Tests (Playwright):** `e2e/sprint-17/history-and-restore.spec.ts` — full suite passing across Chromium, Firefox, and WebKit.

## Documents
* **Master Specification:** [`SPRINT-17-MCARD-VERSION-HISTORY-AND-RESTORE.md`](./SPRINT-17-MCARD-VERSION-HISTORY-AND-RESTORE.md)
* **Parent Proposal:** [`PROPOSAL-16-19-MCARD-DIAGRAM-LIFECYCLE-HISTORY-AND-EXPORT.md`](../../orchestration/16-19-mcard-diagram-lifecycle-history-and-export/PROPOSAL-16-19-MCARD-DIAGRAM-LIFECYCLE-HISTORY-AND-EXPORT.md)
