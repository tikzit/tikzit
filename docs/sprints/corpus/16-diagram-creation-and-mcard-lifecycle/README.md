# Sprint 16: Diagram Creation & Unified MCard Lifecycle
**Directory:** `docs/sprints/corpus/16-diagram-creation-and-mcard-lifecycle`  
**Status:** ✅ Completed (Graduated)  
**Date:** 2026-09-28  

## Executive Summary
Replaced the ephemeral `doc-*` workspace document workflow with first-class MCard diagram creation under stable `zx:diagrams:<uuid>` handles. Fixed eight live Sprint 15 carry-over defects (H1–H8) in handle parsing, history reconstruction, unchanged-buffer persistence, and stale-writer protection. Introduced snapshot format v2 with decoupled IndexedDB schema versions, companion metadata cards under `zx:meta:diagrams:<uuid>`, unified `isDiagramHandle` checking across all seven subsystem sites, and mapped Cmd+S directly to the MCard commit path.

## Verification & Test Results
* **Carry-Over Hardening (Vitest):** `tests/unit/clm/carry-over-hardening.test.ts` — verified fixes H1–H8 passing.
* **Diagram Lifecycle (Vitest):** `tests/unit/clm/sprint16-diagram-lifecycle.test.ts`, `tests/unit/clm/gated-commit.test.ts` — creation, gated commit, snapshot v2, and metadata card emission passing.
* **E2E Tests (Playwright):** `e2e/sprint-16/diagram-creation.spec.ts` — full lifecycle tests passing across Chromium, Firefox, and WebKit.
* **Corpus Seeding:** 12/12 canonical example diagrams verified intact.

## Documents
* **Master Specification:** [`SPRINT-16-DIAGRAM-CREATION-AND-MCARD-LIFECYCLE.md`](./SPRINT-16-DIAGRAM-CREATION-AND-MCARD-LIFECYCLE.md)
* **Parent Proposal:** [`PROPOSAL-16-19-MCARD-DIAGRAM-LIFECYCLE-HISTORY-AND-EXPORT.md`](../../orchestration/16-19-mcard-diagram-lifecycle-history-and-export/PROPOSAL-16-19-MCARD-DIAGRAM-LIFECYCLE-HISTORY-AND-EXPORT.md)
