# Sprint 00: Master Orchestration Plan
**Directory:** `docs/sprints/orchestration/00-master-orchestration`
**Status:** ✅ Completed (Graduated)  
**Date:** 2026-09-27  

## Executive Summary
Defines the technical architecture, invariants, service container mesh, reactive Flux state architecture, and execution roadmap for building TikZiT Web using Astro 7 (`astro@^7.3.5` with Vite 8 and Rust-based compiler), React 19, Dockview (`dockview-react@8.3.1`), Three.js, Anime.js, Tailwind CSS, **Nanostores Flux Architecture** (`nanostores@^1.5.4` and `@nanostores/react@^2.0.1`), and `clm-kernel`.

## Architectural Spikes & Specifications
* [SPIKE-DOCKVIEW.md](../../../architecture/SPIKE-DOCKVIEW.md) — Dockview spatial window management, sash semantics & hydration resilience.
* [SPIKE-CORDIS-CLM.md](../../../architecture/SPIKE-CORDIS-CLM.md) — Cordis reactive service mesh, MCard content-addressing & BLAKE3.
* [TIKZ-SUPPORTED-SUBSET.md](../../../architecture/TIKZ-SUPPORTED-SUBSET.md) — Bounded PGF/TikZ subset definition and diagnostics.
* [LICENSE-AND-PROVENANCE.md](../../../architecture/LICENSE-AND-PROVENANCE.md) — GPL-3.0 compliance and clean-room TS port boundary.

## Central Role of the Flux Pattern & Choice of Nanostores
A core architectural pillar established in Sprint 00 and realized across the shell sprints is the **unidirectional Flux pattern** implemented via **Nanostores**:
* **Multi-Projection Synchronization:** The Three.js WebGL canvas, CodeMirror TikZ source editor, Inspector/Style Palette, TeX Live Preview, and Dockview tabs all concurrently read and manipulate the same graph AST and application mode. The Flux pattern guarantees that all mutations occur via typed action creators (`toolActions`, `workbenchActions`, `selectionActions`, etc.), eliminating cascading re-render loops and non-deterministic state corruption.
* **Astro Island Native:** Unlike React Context (which fails across disconnected Astro islands) or heavy Redux/Zustand bundles, Nanostores provides tiny (<1 KB), zero-dependency, atomic state containers (`atom`, `map`) accessible universally across React islands, vanilla TypeScript modules, and WebGL animation loops.
* **Cordis Service Mesh Bridge:** Nanostores state binds cleanly to the Cordis micro-kernel (`bindStoresToKernel`), achieving an unequivocal boundary between reactive presentation state and domain services.

## Verification & Test Results
* **Nanostores Flux Suite (Vitest):** 6/6 passed (`tests/unit/shell/nanostores.test.ts`).
* **Cordis Domain & Spike Tests (Vitest):** 7/7 passed (`src/services/__tests__/clm-cordis.spec.ts`, `tests/unit/shell/kernel.test.ts`).
* **Workbench Shell E2E Tests (Playwright):** 13/13 passed (`e2e/sprint-00/web-shell.spec.ts`, `e2e/sprint-02/workbench-shell.spec.ts`).
* **Canonical Corpus E2E Tests (Playwright):** 5/5 passed (`e2e/corpus/gallery-visual.spec.ts`).
* **Native Qt 6 C++ Tests (UnitTests):** 20/20 passed.

## Documents
* **Master Specification:** [`SPRINT-00-MASTER-ORCHESTRATION.md`](./SPRINT-00-MASTER-ORCHESTRATION.md)
