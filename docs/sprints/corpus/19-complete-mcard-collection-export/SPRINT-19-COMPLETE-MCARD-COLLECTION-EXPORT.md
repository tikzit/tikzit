# Sprint 19: Complete MCard Diagram Collection Export

**Status:** ✅ Completed & Verified  
**Primary category:** `corpus`  
**Depends on:** [Sprint 16](../16-diagram-creation-and-mcard-lifecycle/SPRINT-16-DIAGRAM-CREATION-AND-MCARD-LIFECYCLE.md), [Sprint 16B](../16b-diagram-library-and-session-durability/SPRINT-16B-DIAGRAM-LIBRARY-AND-SESSION-DURABILITY.md) (metadata lifecycle), [Sprint 17](../17-mcard-version-history-and-restore/SPRINT-17-MCARD-VERSION-HISTORY-AND-RESTORE.md) (restore semantics)  
**Parent proposal:** [Sprints 16–19](../../orchestration/16-19-mcard-diagram-lifecycle-history-and-export/PROPOSAL-16-19-MCARD-DIAGRAM-LIFECYCLE-HISTORY-AND-EXPORT.md)

## Objective

Turn **Save Corpus (.db)** into **Export Collection…**: a verified SQLite export of every diagram, its metadata, and its full lineage, with a proven round-trip into mcard-studio.

## Current Gap

After Sprint 16 Phase A fixes H1–H3 and H6, the remaining gaps are:

- `exportCorpusDb` walks only the example index. User diagrams, their `zx:meta:diagrams:` handles, and archived diagrams are absent.
- Scope and counts are not shown before export.
- No test proves that restore lineage (A→B→A, where the head equals an earlier card) survives export and import.
- The mcard-studio round-trip runs against an unpinned repository.

## Proposed UI

- The Explorer action row gets **Export Collection…** (`data-testid="btn-export-collection"`), replacing `Save Corpus (.db)` (`corpus-save-btn`); `corpus-explorer.spec.ts` migrates in the same commit per Contract B.
- The confirmation dialog shows:
  - Scope: all diagrams, including N archived.
  - Counts: diagrams, versions, and total cards.
  - Excluded: execution receipts, knowledge records, and "M unrelated cards" (orphans, D3).
  - Destination filename `tikzit-diagrams-YYYYMMDD.db`.
- Progress runs *Verifying… → Writing…*. Outcomes are *saved*, *cancelled*, *fallback download used*, *write failed*, and *verification failed* (with the failing handle). Local receipt persistence is reported separately.

## Export Contract

- **Scope:** every handle for which `isDiagramHandle` is true, plus each diagram's `zx:meta:diagrams:` handle, including archived ones. For each handle: the head card, every card in the lineage closure, the registry row, and ordered `handle_history` rows with real `changed_at` values. Version labels travel inside metadata cards.
- **Excluded:** `executionLog` and `knowledge` pillars, and orphan cards (counted and disclosed, D3).
- **Identity preservation:** exact payloads, hashes, authors, sequences, URIs, and timestamps. No rehashing or lineage normalization.
- **One coherent snapshot:** the dialog counts, artifact, and receipt digest come from a single capture taken at the start of export. A commit that lands mid-export is not included and cannot desync the counts.
- **Verification before write:**
  - Every card re-hashes to its recorded hash.
  - Every handle resolves to its captured head.
  - The set of `handle_history.previous_hash` values equals the lineage closure minus the head, so no prior head is silently dropped.
  - The final row never points at the head.
  - The schema has `card`, `handle_registry`, and `handle_history`.
  - Record counts match.
- **Round-trip:** import through the mcard-studio importer at a **pinned revision** with a checked-in fixture corpus that includes an A→B→A handle, an empty diagram, an archived diagram, and a renamed diagram. Heads, histories, and metadata must match exactly. A valid SQLite header alone is not success.
- **Receipt:** a deterministic digest (sorted handle→head map plus counts) goes in the execution log; no execution-log data goes into the `.db`.

## Acceptance Criteria

- **19-AC-01:** The export contains all seeded, user, and archived diagram handles and their metadata handles, not just the example index.
- **19-AC-02:** Every card in each lineage closure appears exactly once and recomputes to its hash.
- **19-AC-03:** Registry heads and ordered history are preserved. A→B→A exports and imports with the head equal to the earliest card and both transitions intact.
- **19-AC-04:** An mcard-studio import at the pinned revision resolves every handle to identical content, lineage, and metadata (title, archived, labels).
- **19-AC-05:** Missing cards, stale index, duplicate handles, hash mismatch, invalid schema, and write failure fail closed with the failing handle named; no partial file is reported as saved.
- **19-AC-06:** Saved, cancelled, fallback, write-failed, verification-failed, persistence-unavailable, and receipt-not-persisted are distinct visible outcomes. Picker paths are tested in Chromium; fallback in all browsers.
- **19-AC-07:** Export does not alter cards, handles, history, the active document, or dirty buffers.
- **19-AC-08:** Pre-export counts equal the verified artifact's counts, including when a commit lands during export.
- **19-AC-09:** Zero, one, and many user diagrams export correctly; committed empty diagrams round-trip like any head.

## Out of Scope

- Full TriDatabase backup (execution log, knowledge) unless separately approved.
- Importing or merging an external collection into the workbench (candidate follow-up; it would reuse the metadata-card model).
- Individual diagram export (Sprint 18).

## Definition of Done

- [x] Export algorithm reviewed against the CLM SQLite schema, kernel `registerHandle`/`handleHistory` semantics, and the pinned mcard-studio importer.
- [x] Unit tests cover scope (seeded, user, archived, metadata), closure/history set-equality, A→B→A, orphan exclusion count, snapshot coherence under a concurrent commit, and every failure path.
- [x] The hermetic round-trip test with the fixture corpus passes using the pinned mcard-studio import validator (verifying heads, histories, and metadata).
- [x] Playwright covers dialog scope and counts, save, cancel (Chromium), fallback (all browsers), failure, and no mutation of active or dirty work.
- [x] Existing 12 seeded entries intact; `npm run verify:corpus` passes.
- [x] Typecheck, build, full unit suite, and E2E suite pass.

## Verification Commands

```bash
npx tsc --noEmit
npx vitest run
npm run verify:corpus
npm run build && npx playwright test
# Cross-repo round-trip validation against pinned mcard-studio fixture specification
npx vitest run tests/unit/clm/mcard-collection-export.test.ts
```

