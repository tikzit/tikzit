# Sprint 02: Astro Shell, Cordis Micro-Kernel & CLM State Integration
**Directory:** `docs/sprints/shell/02-astro-shell-and-cordis-runtime`
**Status:** ✅ **Completed (Graduated)**
**Graduated Date:** 2026-09-27
**Specifications:**
- [`SPRINT-02-ASTRO-SHELL-AND-CORDIS-RUNTIME.md`](./SPRINT-02-ASTRO-SHELL-AND-CORDIS-RUNTIME.md) *(Part A: Astro 7 Shell, Dockview Layout, Cordis Runtime & Nanostores Flux Engine)*
- [`SPRINT-02B-NANOSTORES-CORDIS-STATE-INTEGRATION.md`](./SPRINT-02B-NANOSTORES-CORDIS-STATE-INTEGRATION.md) *(Part B: Nanostores, Cordis Domain Mesh, TriDatabase & CLM State Integration)*

---

## 1. Overview

Sprint 02 delivered the complete web application substrate and hardened state architecture for TikZiT Web across two tightly integrated phases:

1. **Phase A (Application Shell & Spatial Workbench):**
   - Production-ready Astro 7 application shell with Vite 8 bundling.
   - Resilient Dockview window management supporting multi-panel splitting, collapsible sidebars, focal viewport depress/restore operations, and persistent layout storage.
   - Calibrated design token architecture providing high-density dark (`#0D1117`) and light (`#F6F8FA`) themes and PQP spider accents.
   - Universal desktop-parity keybinding engine with input suppression for forms and code editors.
   - Nanostores Flux reactive engine driving client UI chrome.

2. **Phase B (Hermetic Runtime & CLM State Integration):**
   - Zero-error TypeScript 7 compiler baseline across AST parser and emitter domain types.
   - Hermetic store factory (`createWorkbenchStores`) eliminating module-level singleton state.
   - Cordis micro-kernel domain event augmentation with typed namespaced events (`tikzit/tool:set`, `tikzit/selection:change`, `tikzit/graph:change`, `tikzit/document:change`, `tikzit/diagnostics:emit`) and duplicate-safe command registration.
   - In-memory Cubical Logic Model (CLM) integration via `clm-kernel` TriDatabase manager, exposing `'mcard.fs'` and `'mcard.collection'` into the Cordis mesh backed by verified `AgentDid`.
   - Formal A/B/C dimension registration in `knowledge`, binding `DynamicPCard.codeHash` to real implementation hash (rejecting `"0"` fallback).
   - Gated document commits via `PredicateBooleanPCard` and `evaluateVCard()`: pass receipts advance document handles in `mcard`; bail receipts preserve handle lineage; all receipts route to `executionLog`.
   - Pure unidirectional bridge projecting Cordis events to Nanostores with zero write-back loops.
   - Unified workbench runtime container (`createWorkbenchRuntime`) provided via React Context (`WorkbenchRuntimeContext`).

---

## 2. Architecture & Deliverables

| Module | Source Location | Description |
| :--- | :--- | :--- |
| **Isolated Store Factory** | [`src/stores/createWorkbenchStores.ts`](../../../../src/stores/createWorkbenchStores.ts) | Factory producing fresh Nanostores instances (`$toolMode`, `$theme`, `$selectedElements`, `$workbenchLayout`, `$activeDiagram`, `$graphAST`, `$documentHead`) ensuring complete test and instance hermeticity. |
| **Nanostores Flux Compatibility** | [`src/stores/workbench.ts`](../../../../src/stores/workbench.ts) | Pure Flux pattern action creators (`toolActions`, `workbenchActions`, `selectionActions`, `themeActions`, `graphActions`) maintaining backward compatibility. |
| **Cordis Domain Events** | [`src/services/events.ts`](../../../../src/services/events.ts) | Cordis `Events` declaration augmenting micro-kernel with typed namespaced events. |
| **Cordis Micro-Kernel** | [`src/services/kernel.ts`](../../../../src/services/kernel.ts) | Core domain services (`ToolService`, `SelectionService`, `CommandService`, `GraphService`) with duplicate-safe, identity-safe command registration. |
| **CLM TriDatabase Adapter** | [`src/services/clm/triDbAdapter.ts`](../../../../src/services/clm/triDbAdapter.ts) | In-memory TriDatabase adapter registering Layer 2 `MCardFileSystem` and Layer 0 `MCardCollection` directly into Cordis. |
| **CLM Triad Specification** | [`src/services/clm/triadDefinition.ts`](../../../../src/services/clm/triadDefinition.ts) | Formal A/B/C dimension registration in `knowledge` pillar; binds `DynamicPCard.codeHash` to verified implementation hash, rejecting `"0"` fallback. |
| **Gated Document Commit** | [`src/services/clm/documentCommitService.ts`](../../../../src/services/clm/documentCommitService.ts) | `DocumentCommitService` coordinating gated document saves via `BooleanPCard` and `evaluateVCard`; bails preserve handle lineage; receipts route to `executionLog`. |
| **Unidirectional Bridge** | [`src/services/nanostores-bridge.ts`](../../../../src/services/nanostores-bridge.ts) | Pure one-way bridge mapping Cordis events to Nanostores read-only projections with zero write-back loops. |
| **Workbench Runtime** | [`src/services/createWorkbenchRuntime.ts`](../../../../src/services/createWorkbenchRuntime.ts) | Unified runtime container encapsulating Cordis, Nanostores, CLM TriDb, keybindings, and idempotent teardown. |
| **React Runtime Context** | [`src/components/workbench/WorkbenchRuntimeContext.tsx`](../../../../src/components/workbench/WorkbenchRuntimeContext.tsx) | React Context provider and `useWorkbenchRuntime` hook for dependency injection. |
| **Dockview Workbench Host** | [`src/components/workbench/TikzitSpatialWorkbench.tsx`](../../../../src/components/workbench/TikzitSpatialWorkbench.tsx) | Spatial workbench host with Activity Bar, collapsible source drawer, resizable sashes, Dockview host, status bar, and focal viewport depress/restore. |
| **Panel Substrate** | [`src/components/workbench/panels/*.tsx`](../../../../src/components/workbench/panels/) | Client-side React panel components with `data-panel` semantics for `canvas`, `source`, `inspector`, `preview`, and `console`. |
| **Keybinding Engine** | [`src/services/keybindings.ts`](../../../../src/services/keybindings.ts) | Desktop-parity hotkey dispatcher (`S`, `V`/`N`, `E`, `B`, `Cmd+B`, undo/redo, delete) with contextual input suppression (`isInputSuppressed`). |
| **Design Tokens** | [`src/styles/global.css`](../../../../src/styles/global.css) | Calibrated CSS custom property design system providing dark/light themes, PQP spider accents, and Dockview styling. |
| **Theme & Shell Entry** | [`src/pages/index.astro`](../../../../src/pages/index.astro) | Astro 7 client island entrypoint with inline theme restoration, browser base64 shim, and Service Worker cleanup safeguards. |

---

## 3. Verification & Test Evidence

### 3.1 TypeScript 7 Compiler
- Command: `npx tsc --noEmit`
- Status: **PASSED (0 errors)**

### 3.2 Unit & Integration Suites (Vitest)
Ran via `npx vitest run`: **57 / 57 passing tests across 11 test files (100% green in ~210ms)**
- [`tests/unit/shell/runtime.test.ts`](../../../../tests/unit/shell/runtime.test.ts) (4 tests): Store isolation, idempotent dispose, unidirectional projection, duplicate command rejection.
- [`tests/unit/clm/triad.test.ts`](../../../../tests/unit/clm/triad.test.ts) (4 tests): A/B/C separation, real `codeHash`, triad manifest indexing, 12 PQP fixtures.
- [`tests/unit/clm/gated-commit.test.ts`](../../../../tests/unit/clm/gated-commit.test.ts) (3 tests): Pass receipts, bail handle preservation, version lineage history.
- [`tests/unit/shell/nanostores.test.ts`](../../../../tests/unit/shell/nanostores.test.ts) (6 tests): Baseline validation, toolActions, selectionActions, workbenchActions, themeActions, kernel binding.
- [`tests/unit/shell/kernel.test.ts`](../../../../tests/unit/shell/kernel.test.ts) (4 tests): Service container initialization, tool state transitions, selection management, command registry.
- [`tests/unit/shell/keybindings.test.ts`](../../../../tests/unit/shell/keybindings.test.ts) (3 tests): Hotkey switching (`S`, `V`, `N`, `E`, `B`), input suppression, listener disposal.
- [`tests/unit/parser/*.test.ts`](../../../../tests/unit/parser/) (33 tests): Full AST lexer, parser, and emitter regression suite completely green.

### 3.3 Playwright End-to-End Suite
Ran via `npx playwright test`: **21 / 21 passing tests (100% green in 4.0s)**
- [`e2e/sprint-02/workbench-shell.spec.ts`](../../../../e2e/sprint-02/workbench-shell.spec.ts) (8 tests):
  - **02-E2E-01**: Mounts initial Dockview workbench shell (`#activity-bar`, `#dockview-host`, `data-panel="source"`, `data-panel="canvas"`).
  - **02-E2E-02**: Tool selection switches active tool bidirectionally via UI clicks and keyboard shortcuts (`S`, `V`, `E`, `B`).
  - **02-E2E-03**: Dockview sash drag resize, double-click reset, and drawer collapse/expand.
  - **02-E2E-03b**: Tab close operations (`Close Others` and `Close All`).
  - **02-E2E-03c**: Workbench depress/restore lifecycle preserving all open tabs and panel instances without data loss.
  - **02-E2E-03d**: Dockview layout persistence and restoration across full page reload.
  - **02-E2E-04**: Theme switching (`#theme-selector-btn`) and dark mode persistence across reload.
  - **02-E2E-05**: Keybinding suppression inside text inputs.
- Legacy & Corpus E2E suites (`e2e/sprint-00/`, `e2e/sprint-01/`, `e2e/corpus/`): 13 tests passing without regressions.

### 3.4 Astro 7 Production Build
- Command: `npm run build`
- Status: **PASSED (2 pages built in ~350ms)** with zero bundling errors.

---

## 4. Graduation Confirmation

All criteria outlined in both **Sprint 02** and **Sprint 02B** Definitions of Done (DoD) have been verified and satisfied. The unified architecture is fully documented and permanently graduated.
