# Sprint 17B: Prominent Draft-to-MCard Save Affordance & Mode Transition
**Directory:** `docs/sprints/shell/17b-prominent-draft-save-affordance`  
**Status:** ✅ Completed (Graduated)  
**Date:** 2026-09-28  

## Executive Summary
Designed and implemented a high-visibility Draft save affordance to make MCard persistence discoverable without requiring keyboard shortcuts or opening the History panel. Added a prominent **Save Draft** button (`btn-save-diagram`) with an amber `doc-type-badge` in the window chrome, complemented by an in-canvas dismissible callout card (`DraftSaveCallout.tsx`). Executed a seamless mode transition upon first commit with a green confirmation pill and subsequent versioned save semantics.

## Verification & Test Results
* **UI Affordance (Vitest):** `tests/unit/ui/draftSaveAffordance.test.ts` — button visibility, mode transitions, and badge states passing.
* **Coordination & State (Vitest):** `tests/unit/clm/draft-save-coordination.test.ts` — shared save state atom and buffer coordination passing.
* **E2E Tests (Playwright):** `e2e/sprint-17b/draft-save-affordance.spec.ts` — full suite passing across Chromium, Firefox, and WebKit.

## Documents
* **Master Specification:** [`SPRINT-17B-PROMINENT-DRAFT-SAVE-AFFORDANCE.md`](./SPRINT-17B-PROMINENT-DRAFT-SAVE-AFFORDANCE.md)
* **Parent Proposal:** [`PROPOSAL-16-19-MCARD-DIAGRAM-LIFECYCLE-HISTORY-AND-EXPORT.md`](../../orchestration/16-19-mcard-diagram-lifecycle-history-and-export/PROPOSAL-16-19-MCARD-DIAGRAM-LIFECYCLE-HISTORY-AND-EXPORT.md)
