# Changelog

All notable changes to the TikZiT project are documented weekly in the [`docs/changelog/`](docs/changelog/) directory in accordance with ISO week naming (`YYYY-Www.md`).

## Latest Entries

- [**2026-W40 (2026-09-28 – 2026-10-04)**](docs/changelog/2026-W40.md):
  - **Algebraic Modularity, CLM & Build Unification Series (Sprints 20–24 Completed & Graduated)**:
    - **Sprint 20 (Dual-System Makefile & Shared Protocol)**: Authored root Makefile build authority (`make build-web`, `make test-web`, `make check-independence`), automated browser-independence gate, and shared SQLite/TypeScript protocol specification.
    - **Sprint 21 (Process Algebra & Petri Net Lifecycle)**: Decomposed `createWorkbenchRuntime.ts` into CSP message channels (`SyncChannel.ts`) and a formal marked Petri Net document lifecycle actor (`DocumentProcess.ts`) with orthogonal dirty-state places.
    - **Sprint 22 (God Component Decomposition via Baldwin Splitting)**: Decomposed UI God components (`VersionPopover`, `PreviewPanel`, `CorpusExplorerDrawer`, `WorkbenchCommandBar`) into modules strictly $\le 250$ LOC, preserving 100% of the 196 literal testids.
    - **Sprint 23 (CLM TriDatabase & Service Decoupling)**: Decoupled `corpusExplorerService` and `corpusExportService` into headless storage, lineage, query, and export modules; completed legacy `DocumentStore` zero-new-writes boundary.
    - **Sprint 24 (Parser Combinator & Protocol Conformance)**: Decomposed recursive-descent parser into pure grammar combinators (`combinators/`) and verified dual-system AST conformance across 12 canonical PQP ZX diagrams.
    - **Quality & Verification Matrix**: 77 Vitest test files (466 tests 100% green), automated browser independence audit passing 5/5 checks, dual-system ZX AST conformance passing 12/12 diagrams, and 392+ E2E browser tests passing.
  - **Diagram Lifecycle, History & Sovereign Export Series (Sprints 16–19 Completed & Verified)**:
    - **Sprint 16 (Diagram Creation & Unified MCard Lifecycle)**: User diagram creation (`zx:diagrams:UUID`), explicit save to MCard, companion metadata cards (`zx:meta:diagrams:*`), snapshot v2 schema, and carry-over hardening (H1–H8).
    - **Sprint 16B (Diagram Library Management & Session Durability)**: Rename, duplicate, archive/unarchive via metadata-card lineage, dirty-buffer recovery across reloads, and idempotent legacy `DocumentStore` import.
    - **Sprint 17 (MCard Version History & Restore)**: History popover with real lineage ordering, version labels, non-destructive preview and visual compare modes, and card restore via historical head re-registration.
    - **Sprint 17B (Prominent Draft-to-MCard Save Affordance)**: High-visibility Draft save button and in-canvas dismissible callout card providing 1-click MCard commit with smooth transition to Diagram mode.
    - **Sprint 18 (Individual Diagram Export)**: Multi-format diagram export modal dialog supporting verbatim TikZ, vector SVG, raster PNG (1x, 2x, 4x), and PDF with style presets, File System Access API picker, and Blob fallback.
    - **Sprint 19 (Complete MCard Diagram Collection Export)**: Verified sovereign SQLite `.db` collection export of all diagram and metadata handles with complete lineage closure (including A→B→A restore lineage), orphan card exclusion (D3), pre-write cryptographic hash validation, and pinned `mcard-studio` round-trip compatibility.
    - **Verification Matrix**: 57 Vitest test files (355 unit tests 100% green), 392 Playwright E2E browser tests (100% green across Chromium, Firefox, WebKit), and 12/12 canonical ZX diagrams verified.
  - **Desktop Parity Series (Sprints 09–15 Graduated)**: Shared C++ icon pipeline, macOS dark window chrome, green active tool borders, white paper canvas calibration, teardrop self-loop mathematics, desktop style palette, live preview curvature synchronization, and MCard-backed Corpus Explorer.
- [**2026-W39 (2026-09-21 – 2026-09-27)**](docs/changelog/2026-W39.md):
  - Initial web-rebuild roadmap and architecture specifications.
  - 12-diagram ZX-calculus reference corpus with SVGs and build scripts.
  - CMake Qt6 build and macOS deployment fixes.

For the complete archive of weekly logs, see [docs/changelog/README.md](docs/changelog/README.md).
