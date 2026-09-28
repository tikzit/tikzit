# Sprint 18: Individual Diagram Export

**Status:** ✅ Completed & Verified (2026-09-28)  
**Primary category:** `preview` (with diagram selection from the corpus Explorer)  
**Depends on:** [Sprint 16](../../corpus/16-diagram-creation-and-mcard-lifecycle/SPRINT-16-DIAGRAM-CREATION-AND-MCARD-LIFECYCLE.md)  
**Parent proposal:** [Sprints 16–19](../../orchestration/16-19-mcard-diagram-lifecycle-history-and-export/PROPOSAL-16-19-MCARD-DIAGRAM-LIFECYCLE-HISTORY-AND-EXPORT.md)

## Objective

Export one diagram from its Explorer row or the active document, in the Preview pipeline's formats. The dialog states exactly which content and styles are exported, and exporting never changes saved state.

## Current Gap

- `ImageExporter`/`PdfExporter` call `downloadBlob` themselves, so wrapping them behind a save picker would produce a duplicate download.
- `.tikz`/`.tex` output re-emits TikZ from the AST (`emitTikz`), which drops `%` comments and formatting; exported bytes differ from the committed card payload.
- Exporters read the single global `$stylesCatalog`, so a row export of a non-active diagram renders with whatever catalog is loaded.
- `doc.ast` can lag the buffer (debounced parse) or be absent (parse failure).

## Proposed UI

- Row overflow menu **Export Diagram…** (`data-testid="row-export-diagram"`) and an active-document Export action (`data-testid="btn-export-diagram"`).
- The dialog shows target title, format (TikZ `.tikz`, standalone TeX `.tex`, SVG, PNG with 1×/2×/4× scale, PDF), source, and style catalog name.
- **Source:** for a dirty document (active or not), the default is **Current edits** (badge: *Unsaved edits*), with **Saved version (vN)** as the alternative (D4). For a clean document the source is the saved version and no choice is shown. A draft with no commit offers only current edits.
- When the buffer is unparseable, current edits are disabled and the parse error is shown; the saved version stays available.
- Outcomes: saved (filename), cancelled (quiet), fallback download used, write failed (Retry), all announced.

## Data & Event Contract

- **Verbatim text:** `.tikz` = `card.payload.value` (saved) or raw buffer (current edits), byte for byte. `.tex` wraps the same bytes in the standalone preamble. Neither re-emits from the AST.
- **Rendered formats:** SVG, PNG, and PDF render from a **fresh parse** of the chosen source at export time.
- **Styles:** use the workspace `$stylesCatalog`; the dialog names it (`styleFileName` or "Default styles"). Per-diagram styles are deferred (D7).
- **Pure exporters:** decouple generation from file emission in `ImageExporter`/`PdfExporter` by providing pure generator methods (`generateSvgBlob`, `generatePngBlob`, `generatePdfBlob`, `generateStandaloneTex`) returning `Blob | string`, shared by both `PreviewPanel` and the Export Dialog. One `saveArtifact(data: Blob | string, filename: string, options: { mimeType?: string; showPicker?: boolean })` helper performs exactly one write:
  - The picker (`showSaveFilePicker`) is used when available.
  - A picker `AbortError` means `cancelled`, with no fallback.
  - Picker unavailable or denied **before** a handle is obtained → Blob fallback (`downloadBlob`).
  - Failure after a handle is obtained → `failed`, never reported as success.

- **Target capture:** the row's handle and chosen source are captured when the dialog opens; later tab switches cannot redirect the export.
- **Filenames:** `sanitize(title)` (strip `/\:*?"<>|`, collapse whitespace, cap length). `Untitled` is used when the title is empty. A short hash suffix is added on collision within the session.

## Acceptance Criteria

- **18-AC-01:** `.tikz` output equals the chosen source bytes exactly; `.tex` contains them unmodified. Rendered formats match Preview's output for the same source and catalog.
- **18-AC-02:** Row export always targets its row's diagram despite concurrent tab switches; non-active dirty rows offer the same source choice.
- **18-AC-03:** Current-edits export uses a fresh parse; it is disabled while the buffer is unparseable. Saved-version export uses the resolved head card.
- **18-AC-04:** Filenames are sanitized and collision-safe; the dialog names the style catalog used.
- **18-AC-05:** Cancel is quiet with no download; write failure is reported and never counted as success; fallback runs exactly once.
- **18-AC-06:** Export is read-only: no handle advance, version, clean-mark, or buffer mutation.
- **18-AC-07:** Works for seeded examples, user diagrams, archived diagrams (via Show archived), and drafts.
- **18-AC-08:** Dialog and menus are keyboard accessible with live-region results. Picker-path tests run in Chromium; fallback-path tests run in all three browsers.

## Out of Scope

- Exporting a single diagram's full history as a package (candidate follow-up: a one-handle `.db` reusing Sprint 19's exporter).
- Complete collection export (Sprint 19).
- Per-diagram style persistence (D7).

## Definition of Done

- [x] Unit tests cover verbatim byte equality, fresh-parse behavior, unparseable-buffer disabling, filename sanitizing and collisions, the `saveArtifact` outcome matrix, and no mutation.
- [x] Playwright covers row- and active-targeted export, dirty source choice, cancel (Chromium), fallback (all browsers), write failure, and keyboard flow.
- [x] Preview-panel export buttons are migrated to the pure exporters with no duplicate downloads.
- [x] Existing 12 seeded entries intact; `npm run verify:corpus` passes.
- [x] Typecheck, build, full unit suite, and E2E suite pass.

## Verification Commands & Evidence Ledger

```bash
npx tsc --noEmit
npx vitest run
npm run verify:corpus
npm run build && npx playwright test
```

### Verification Evidence Ledger

1. **TypeScript Typecheck**:
   - `npx tsc --noEmit` -> Passed with 0 errors.

2. **Unit Test Suite**:
   - `npx vitest run` -> 56 test files, 346 tests passed (0 failures).
   - `tests/unit/export/individualExport.test.ts` (11 tests): Verbatim byte equality, comment preservation, standalone TeX wrapping, fresh-parse behavior, parse-error disabling, filename sanitization, session collision safety, `saveArtifact` outcome matrix (picker write, quiet cancel on `AbortError`, fallback download, write failure reporting), and non-mutation AST invariant.
   - `tests/unit/export/exportNaming.test.ts` (9 tests): Filename character sanitization, length limits, default untitled handling, and collision suffixes.
   - `tests/unit/export/saveArtifact.test.ts` (5 tests): Single-write execution, picker / fallback routing, quiet AbortError handling.
   - `tests/unit/export/pureExporters.test.ts` (6 tests): Pure generators for SVG, PNG, PDF, and TeX.

3. **Corpus Integrity**:
   - `npm run verify:corpus` -> All 12 canonical ZX diagrams compiled & verified with 0 errors.

4. **Production Build**:
   - `npm run build` -> Clean bundle emitted for static routes.

5. **Playwright E2E Suite**:
   - `npx playwright test e2e/sprint-18/individual-export.spec.ts`: 21 passed across Chromium, Firefox, WebKit (6 Chromium-only picker tests correctly skipped in non-Chromium).
   - Full test run `npx playwright test`: 381 passed, 6 skipped, 0 failed across all sprints.

