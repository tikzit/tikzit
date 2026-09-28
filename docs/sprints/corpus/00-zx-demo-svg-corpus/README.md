# Sprint 00-A: Canonical ZX-Diagram Reference Corpus & SVG Generation
**Directory:** `docs/sprints/corpus/00-zx-demo-svg-corpus`
**Status:** ✅ Completed (Graduated)  
**Date Completed:** 2026-09-27  

---

## 1. Executive Summary
This sprint established the empirical mathematical ground truth for the TikZiT Web project by extracting, authoring, and compiling 12 canonical string diagrams from Cambridge University Press's foundational textbook:
> *Picturing Quantum Processes: A First Course in Quantum Theory and Diagrammatic Reasoning* (Bob Coecke & Aleks Kissinger, 2017).

These 12 diagrams serve as the immutable categorical baseline, the visual golden master for Three.js WebGL canvas rendering, and the parser test fixtures for the pure TypeScript AST parser in Sprint 01.

---

## 2. Deliverables & Key Artifacts

| Deliverable | Path | Description |
| :--- | :--- | :--- |
| **Graduated Specification** | [`SPRINT-00-ZX-DEMO-SVG-CORPUS.md`](./SPRINT-00-ZX-DEMO-SVG-CORPUS.md) | Full mathematical taxonomy, AST counts, and 100% completed Definition of Done |
| **Canonical Stylesheet** | [`../../examples/zx-calculus/pqp-zx.tikzstyles`](../../../examples/zx-calculus/pqp-zx.tikzstyles) | PQP color palette: Z-spider (`#5AD25A`), X-spider (`#EB4B4B`), H-box (`#FFDC46`) |
| **12 Vector SVGs** | [`../../examples/zx-calculus/*.svg`](../../../examples/zx-calculus/) | Pristine standalone vector outputs generated via `pdftocairo -svg` |
| **Interactive Visual Gallery** | [`../../examples/index.html`](../../../examples/index.html) | Responsive web viewer with search, category filtering, dark/light theme, and TikZ modal |
| **Automated Build Tool** | [`../../examples/build_examples.py`](../../../examples/build_examples.py) | Zero-tolerance fail-fast compilation pipeline with auto-path detection and `--verify-only` mode |
| **Cryptographic Manifest** | [`../../examples/manifest.json`](../../../examples/manifest.json) | SHA-256 hashes, node/edge AST counts, byte sizes, and formal provenance attribution |
| **Playwright E2E Suite** | [`../../../e2e/corpus/gallery-visual.spec.ts`](../../../../e2e/corpus/gallery-visual.spec.ts) | 5 automated browser test scenarios covering gallery rendering, SVGs, theme toggle, and modal |
| **Native Parser Tests** | [`../../../src/test/testparser.cpp`](../../../../src/test/testparser.cpp) | Qt 6 test slot `TestParser::parseCorpusDiagrams()` validating 12/12 diagrams under `TikzAssembler` |

---

## 3. Structural Telemetry Baseline

| Diagram ID | Category | Nodes | Edges | TikZ Size | SVG Size | SHA-256 Checksum (TikZ) |
| :--- | :--- | :---: | :---: | :---: | :---: | :--- |
| `01_spider_fusion` | Elementary Spiders | 6 | 6 | 649 B | 6,834 B | `33b9ab0cb248...` |
| `02_identity_spiders` | Elementary Spiders | 6 | 3 | 520 B | 2,781 B | `db769b70cfec...` |
| `03_yanking_cup_cap` | Dualities & Invariants | 6 | 4 | 634 B | 1,363 B | `72ccf6b098b5...` |
| `04_cup_cap_duality` | Dualities & Invariants | 6 | 2 | 613 B | 15,516 B | `fa2bd07361e1...` |
| `05_bialgebra_law` | Bialgebra & Hopf Laws | 6 | 5 | 582 B | 3,372 B | `c73896009fcf...` |
| `06_hadamard_color_change` | Bialgebra & Hopf Laws | 5 | 4 | 505 B | 7,006 B | `b61c6a2b331a...` |
| `07_cnot_gate` | Quantum Gates & Circuits | 6 | 5 | 630 B | 3,247 B | `251d3083b95e...` |
| `08_cz_gate` | Quantum Gates & Circuits | 7 | 6 | 678 B | 6,299 B | `d7c26ae4b9ec...` |
| `09_swap_gate` | Quantum Gates & Circuits | 4 | 2 | 428 B | 1,025 B | `c3a18453bd39...` |
| `10_teleportation` | Protocols & Entangled States | 8 | 9 | 991 B | 5,458 B | `0db87e47bb73...` |
| `11_ghz_state` | Protocols & Entangled States | 4 | 3 | 440 B | 1,953 B | `cab491848689...` |
| `12_entanglement_swapping` | Protocols & Entangled States | 6 | 5 | 692 B | 2,179 B | `fe4feae88bf8...` |

---

## 4. Verification Test Results

### 4.1 Playwright E2E Visual Suite (`npm run test:corpus`)
- **Status:** ✅ 5 passed (1.4s)
- **Scenarios Validated:**
  - `0A-E2E-01`: Renders all 12 reference fixture cards with authoritative PQP titles
  - `0A-E2E-02`: Validates SVG markup, visibility, and natural dimensions (`naturalWidth > 0`)
  - `0A-E2E-03`: Dark/Light mode theme toggle visual stability and golden master screenshot comparison
  - `0A-E2E-04`: Code inspection modal displays valid TikZ PGF source with `nodelayer` and `edgelayer`
  - `0A-E2E-05`: Responsive layout across viewports (1920×1080 desktop, 768×1024 tablet, 375×812 mobile)

### 4.2 Native Qt 6 C++ Testlib Suite (`npm run test:native`)
- **Status:** ✅ 20 passed (1ms)
  - `TestTest`: 4 passed
  - `TestParser`: 9 passed (including `parseCorpusDiagrams` checking all 12 diagrams)
  - `TestTikzOutput`: 7 passed

### 4.3 Automated Verification Pipeline (`npm run verify:corpus`)
- **Status:** ✅ 12/12 diagrams verified with 0 errors against cryptographic SHA-256 hashes and AST structural node/edge counts.

---

## 5. Verification Commands

```bash
# Run Playwright E2E visual gallery tests
npm run test:corpus

# Run native Qt 6 C++ parser test suite
npm run test:native

# Run SHA-256 hash and AST integrity verification
npm run verify:corpus

# Recompile all diagrams from TeX source to SVG
npm run build:corpus
```
