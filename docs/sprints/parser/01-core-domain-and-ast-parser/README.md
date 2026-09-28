# Sprint 01: Core Domain Model & TypeScript AST Parser
**Directory:** `docs/sprints/parser/01-core-domain-and-ast-parser`
**Status:** ✅ **Completed (Graduated)**
**Graduated Date:** 2026-09-27

---

## 1. Overview

Sprint 01 delivered the mathematical foundation and AST parsing engine for TikZiT Web, faithfully replicating the Bison grammar (`src/data/tikzparser.y`) and canonical emitter (`src/data/graph.cpp`) of the Qt C++ desktop reference implementation in zero-dependency, pure TypeScript.

The domain model provides 100% JSON-serializable plain JavaScript objects (POJOs), supporting full bidirectional conversion between LaTeX TikZ markup and in-memory ASTs with exact semantic round-trip invariance across the complete 12-diagram Picturing Quantum Processes (PQP) ZX-calculus corpus.

---

## 2. Architecture & Deliverables

| Module | Source Location | Description |
| :--- | :--- | :--- |
| **Domain Model** | [`src/core/domain/types.ts`](../../../../src/core/domain/types.ts) | Strict TypeScript interfaces (`GraphAST`, `NodeData`, `EdgeData`, `PathData`, `GraphElementData`, `BoundingBox`, `TikzStylesCatalog`) and pure immutable helpers (`setProperty`, `setAtom`, `mergeData`, `partitionPathData`). |
| **Lexer** | [`src/core/parser/lexer.ts`](../../../../src/core/parser/lexer.ts) | Pure TypeScript tokenizer matching `tikzlexer.l`. Handles commands, balanced nested braces without regex backtracking, coordinate vectors, property brackets with atoms and key-values, node references, self-loops `()`, and LaTeX `%` comments. |
| **Parser** | [`src/core/parser/parser.ts`](../../../../src/core/parser/parser.ts) | Recursive descent parser for `tikzpicture` and `tikzstyles` modes. Supports edge chains (`to ... to ...`), self-loops (`()` -> current source), cycles (`cycle` -> path origin), bounding boxes, inline edge labels, and error diagnostics (`parseSafe`). |
| **Emitter** | [`src/core/parser/emitter.ts`](../../../../src/core/parser/emitter.ts) | Canonical LaTeX emitter replicating `Graph::tikz()`. Generates `nodelayer` and `edgelayer` PGF layer blocks, property escaping, `floatToString` formatting, path-data hoisting, and semantic AST normalization (`normalize`). |
| **Cordis Adapter** | [`src/services/parser-service.ts`](../../../../src/services/parser-service.ts) | Cordis service adapter exposing reactive parse/emit capabilities across the workbench mesh. |
| **Browser Test Harness** | [`src/pages/test-harness/ast-runner.astro`](../../../../src/pages/test-harness/ast-runner.astro) | Browser runner exposing `window.TikzParser` for real-browser Playwright E2E and benchmark evaluation. |

---

## 3. Verification & Test Evidence

### 3.1 Unit Test Suite (Vitest)
Ran via `npm test` (`vitest run`): **33 / 33 passing tests (100% green)**
- [`tests/unit/parser/lexer.test.ts`](../../../../tests/unit/parser/lexer.test.ts) (10 tests):
  - Commands, balanced nested braces, empty braces, error handling on unclosed delimiters, coordinates, references, property lists, atoms, and LaTeX comments.
- [`tests/unit/parser/parser.test.ts`](../../../../tests/unit/parser/parser.test.ts) (12 tests):
  - Ported cases from Qt `src/test/testparser.cpp` (`parseEmptyGraph`, `parseNodeGraph`, `parseEdgeGraph`, `parseEdgeNode`, `parseEdgeBends`, `parseBbox`).
  - Canonical parse conformance on all 12 PQP ZX-calculus reference diagrams with exact node/edge count verification.
  - Safe error recovery on malformed syntax with source-located diagnostics.
- [`tests/unit/parser/emitter.test.ts`](../../../../tests/unit/parser/emitter.test.ts) (7 tests):
  - Ported cases from Qt `src/test/testtikzoutput.cpp` (`escape`, `data`, `graphEmpty`, `graphBbox`, `graphFromTikz` golden reproduction).
- [`src/services/__tests__/parser-service.spec.ts`](../../../../src/services/__tests__/parser-service.spec.ts) (1 test):
  - Cordis event lifecycle integration.
- [`src/services/__tests__/clm-cordis.spec.ts`](../../../../src/services/__tests__/clm-cordis.spec.ts) (3 tests):
  - CLM kernel and MCard content-addressed hashing.

### 3.2 In-Browser Playwright E2E Suite
Ran via `npx playwright test e2e/sprint-01`: **3 / 3 passing in real Chromium**
- `01-E2E-01: Normalized semantic round-trip of reviewed supported fixtures`: 100% identical ASTs across all 12 corpus diagrams.
- `01-E2E-02: Graceful error recovery on malformed TikZ syntax`: verified diagnostic errors and non-null partial AST generation.
- `01-E2E-03: AST parsing benchmark reports fixture and runtime measurements`: verified sub-millisecond execution (< 0.05 ms / diagram).

---

## 4. Specification Document

The full graduated specification is archived in [SPRINT-01-CORE-DOMAIN-AND-AST-PARSER.md](./SPRINT-01-CORE-DOMAIN-AND-AST-PARSER.md).
