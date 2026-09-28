# Sprint 15: MCard-Backed Corpus Explorer & Sovereign Collection Export
**Directory:** `docs/sprints/corpus/15-mcard-backed-corpus-explorer-and-sovereign-export`  
**Status:** ✅ Completed (Graduated)  
**Date:** 2026-10-04  

## Executive Summary
Transformed the static Explorer drawer in `TikzitSpatialWorkbench.tsx` into a live, searchable view over the content-addressed MCard corpus held by the workbench's CLM TriDatabase, persisted the TriDatabase across reloads via IndexedDB-backed `SqlJsBackend` instances, and added a **"Save Corpus (.db)"** affordance emitting a portable SQLite 3 file ingestible by mcard-studio's existing importer. Every exported card's content is validated against its recorded content hash, and the receiving import resolves each exported handle to the same card — a valid SQLite header or 64-hex hash alone is not accepted as proof.

## Verification & Test Results
* **Corpus Manifest Gate:** `npm run verify:corpus` — 12/12 canonical ZX diagrams verified byte-exact with real content hashes.
* **Unit Tests (Vitest):** `tests/unit/clm/corpus-explorer.test.ts`, `tests/unit/clm/corpus-persistence.test.ts`, `tests/unit/clm/corpus-export.test.ts`, `tests/unit/clm/sqlite-runtime.test.ts` — full suite **261/261 green**.
* **E2E Tests (Playwright):** `e2e/sprint-15/corpus-explorer.spec.ts` — full suite **300/300** across Chromium, Firefox, and WebKit.
* **Typecheck & Build:** `npx tsc --noEmit` clean; `npm run build` clean; `sql.js` WASM asset emitted into `dist/`.
* **Cross-Repo Import Integrity:** mcard-studio `databaseSyncService.importMCardDatabase` round-trip test — **2/2 green**; CLM kernel reference suite **19/19 green**.

## Documents
* **Master Specification:** [`SPRINT-15-MCARD-BACKED-CORPUS-EXPLORER-AND-SOVEREIGN-EXPORT.md`](./SPRINT-15-MCARD-BACKED-CORPUS-EXPLORER-AND-SOVEREIGN-EXPORT.md)
* **BMAD Implementation Spec:** [`_bmad-output/implementation-artifacts/spec-sprint-15-mcard-corpus-explorer-export.md`](../../../../_bmad-output/implementation-artifacts/spec-sprint-15-mcard-corpus-explorer-export.md)
