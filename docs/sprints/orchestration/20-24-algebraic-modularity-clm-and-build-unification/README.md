# Proposal & Architecture: Sprints 20–24 — Algebraic Modularity, CLM Architecture & Build Unification
**Directory:** `docs/sprints/orchestration/20-24-algebraic-modularity-clm-and-build-unification`  
**Status:** ✅ Completed (Graduated)  
**Date:** 2026-09-29  

## Executive Summary
Establishes the umbrella architecture, algebraic concurrency foundations (Process Algebra CSP/CCS, marked Petri Nets), Baldwin Modularity Operators ($\mathcal{B}_{\text{split}}$, $\mathcal{B}_{\text{sub}}$, $\mathcal{B}_{\text{port}}$), Kenotic CLM purity, and dual-system build unification for the TikZiT Web Spatial Workbench and Native Desktop application. Enforces Decision Record D19: the native C++ Qt codebase remains strictly frozen as an immutable reference implementation, while the JavaScript/TypeScript/TSX spatial workbench is decomposed into cohesive modules strictly $\le 450$ lines of code with zero native C++ runtime dependencies.

## Umbrella Scope & Realization
* **Sprint 20 (Orchestration):** Authored root `Makefile`, automated browser independence gate (`scripts/verify-browser-independence.mjs`), and formal shared dual-system protocol specification (`docs/architecture/SHARED-PROTOCOL-SPECIFICATION.md`).
* **Sprint 21 (Sync):** Formal marked Petri Net document lifecycle actor (`DocumentProcess.ts`), CSP asynchronous channel (`SyncChannel.ts`), storage supervisor (`StorageSupervisor.ts`), tab session coordinator (`TabSessionController.ts`), and deconstruction of `createWorkbenchRuntime.ts` (1,100 $\to$ 320 LOC).
* **Sprint 22 (Shell):** Baldwin Splitting on UI God components (`VersionPopover.tsx` $\to$ 188 LOC, `PreviewPanel.tsx` $\to$ 140 LOC, `CorpusExplorerDrawer.tsx` $\to$ 189 LOC, `WorkbenchCommandBar.tsx` $\to$ 207 LOC) into cohesive sub-components ($\le 250$ LOC), headless diff and SVG engines, and 100% preservation of Contract B selectors (196 testids).
* **Sprint 23 (Corpus):** CLM TriDatabase decoupling (`DiagramIndexService.ts`, `DiagramCommitCoordinator.ts`, `DiagramLifecycleManager.ts`), headless lineage closure traversal (`LineageTraversalEngine.ts`), sovereign SQLite serialization (`CollectionSnapshotWriter.ts`), browser File I/O bridge (`ExportFileBridge.ts`), and total deletion of legacy `DocumentStore.ts`.
* **Sprint 24 (Parser):** Pure grammar combinator decomposition (`nodeCombinator.ts`, `edgeCombinator.ts`, `styleCombinator.ts`, `propertyCombinator.ts`, `pathCombinator.ts`), lean `parser.ts` facade ($\le 150$ LOC), and automated dual-system protocol conformance runner (`scripts/verify-protocol-conformance.mjs`) proving 100% AST isomorphism against all 12 canonical ZX diagrams.

## Verification & Quality Gates
* **Unit & Integration Suite (Vitest):** 77 test files, **466 unit and integration tests passing** (100% green).
* **Browser Runtime Independence:** 5/5 automated audit checks passed (`make check-independence`), guaranteeing zero native C++ addons in client bundles.
* **Dual-System Protocol Conformance:** 12/12 canonical ZX-calculus diagrams verified isomorphic across runtimes (`make check-conformance`).
* **Playwright E2E Suite:** **392+ test runs passing** across Chromium, Firefox, WebKit, plus live browser inspection spec (`e2e/browser-inspection.spec.ts`).
* **Definition of Done:** 51/51 checkpoints verified and closed across all 5 sprints.

## Documents
* **Umbrella Specification:** [`PROPOSAL-20-24-ALGEBRAIC-MODULARITY-CLM-AND-BUILD-UNIFICATION.md`](./PROPOSAL-20-24-ALGEBRAIC-MODULARITY-CLM-AND-BUILD-UNIFICATION.md)
* **Sprint 20:** [`../../orchestration/20-dual-system-makefile-and-shared-protocol/SPRINT-20-DUAL-SYSTEM-MAKEFILE-AND-SHARED-PROTOCOL.md`](../20-dual-system-makefile-and-shared-protocol/SPRINT-20-DUAL-SYSTEM-MAKEFILE-AND-SHARED-PROTOCOL.md)
* **Sprint 21:** [`../../sync/21-process-algebra-and-petri-net-lifecycle/SPRINT-21-PROCESS-ALGEBRA-AND-PETRI-NET-LIFECYCLE.md`](../../sync/21-process-algebra-and-petri-net-lifecycle/SPRINT-21-PROCESS-ALGEBRA-AND-PETRI-NET-LIFECYCLE.md)
* **Sprint 22:** [`../../shell/22-god-component-decomposition-via-baldwin-splitting/SPRINT-22-GOD-COMPONENT-DECOMPOSITION-VIA-BALDWIN-SPLITTING.md`](../../shell/22-god-component-decomposition-via-baldwin-splitting/SPRINT-22-GOD-COMPONENT-DECOMPOSITION-VIA-BALDWIN-SPLITTING.md)
* **Sprint 23:** [`../../corpus/23-clm-tri-database-and-service-decoupling/SPRINT-23-CLM-TRI-DATABASE-AND-SERVICE-DECOUPLING.md`](../../corpus/23-clm-tri-database-and-service-decoupling/SPRINT-23-CLM-TRI-DATABASE-AND-SERVICE-DECOUPLING.md)
* **Sprint 24:** [`../../parser/24-parser-combinator-and-protocol-conformance/SPRINT-24-PARSER-COMBINATOR-AND-PROTOCOL-CONFORMANCE.md`](../../parser/24-parser-combinator-and-protocol-conformance/SPRINT-24-PARSER-COMBINATOR-AND-PROTOCOL-CONFORMANCE.md)
