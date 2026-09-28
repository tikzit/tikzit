# Sprint 20: Dual-System Makefile & Shared Protocol Specification

**Status:** Proposed; not started  
**Primary Baldwin Operator:** Porting ($\text{Lan}$) & Substituting ($\simeq \implies =$)  
**Primary Subsystem:** `orchestration` / `verification`  
**Depends on:** Sprints 00–19  
**Parent Proposal:** [Sprints 20–24](./PROPOSAL-20-24-ALGEBRAIC-MODULARITY-CLM-AND-BUILD-UNIFICATION.md)

---

## 1. Objective

Create a unified developer `Makefile` at the repository root that builds, lints, and tests both the **Native C++ Qt6 Desktop Application** (via CMake / Ninja) and the **Web Spatial Workbench** (via Astro / Vite / npm) through a single developer interface. Formally establish the **Shared Dual-System Protocol** that enables both systems to interchange TikZ code, graph models, and MCard SQLite databases without coupling the browser JavaScript/TypeScript runtime to native C++ binaries.

Under our architectural policy (Decision Record D19), the native C++ desktop implementation remains untouched in its original state as an immutable reference baseline. The Makefile simply invokes its existing build toolchain into an isolated build directory without modifying any C++ source code. Code refactoring, Baldwin splitting, and modularity efforts apply strictly to JavaScript, TypeScript, and TSX files.

---

## 2. Current Gaps & Architectural Tension

1. **Auto-Generated Root Makefile Pollution**:
   - The current root `Makefile` is an auto-generated 3,552-line artifact produced by `qmake tikzit.pro` and **is git-tracked** — replacing it requires `git rm` plus the authored replacement in the same commit.
   - Running `qmake` overwrites custom Makefile targets, creating confusion between desktop C++ build recipes and web scripts.
   - Developers must manually alternate between `npm run dev`/`npm test` and `cmake --build` / `UnitTests`.
   - *Verified constraint:* `CMakeLists.txt` builds only the `tikzit` app (`add_executable(tikzit …)`); there is **no CMake test target**. `UnitTests` is produced exclusively by the qmake testcase configuration (`tikzit.pro` sets `CONFIG += testcase` / `TARGET = UnitTests` inside its `test {}` scope) and today lands in `build-test/UnitTests.app` (see `npm run test:native`).

2. **Absence of a Formal Browser Independence Gate**:
   - While the web workbench currently runs in browser environments, there is no automated gate in CI or the build system verifying that no native C++ dependency, node-gyp module, or platform-specific binary is accidentally introduced into `src/`.

3. **Implicit Dual-System Protocol**:
   - The TikZ AST grammar rules and graph element property names (`bend left`, `in`, `out`, `looseness`, `teardrop`, `style=none`) are duplicated across `src/data/tikzparser.y` (C++ Bison) and `src/core/parser/parser.ts` (TypeScript).
   - There is no unified specification document or conformance suite verifying that identical TikZ input produces topologically isomorphic graphs across both runtimes.

---

## 3. Detailed Technical Specification

### 3.1 Authored Root `Makefile` Architecture

Replace the qmake artifact with an authored, human-readable `Makefile`:

```makefile
# TikZiT Root Unified Makefile
# Bridges Native Qt6/C++ (CMake/Ninja) and Web Spatial Workbench (Astro/Vite/TS)

SHELL := /bin/bash
.DEFAULT_GOAL := all

# Build directories
BUILD_DIR_CPP ?= build          # CMake app build (tikzit binary only — no test target exists)
BUILD_DIR_TEST ?= build-test    # qmake testcase build (UnitTests) — matches `npm run test:native`
BUILD_DIR_QMAKE ?= build-qmake  # qmake app build, kept shadowed so `qmake` never clobbers this Makefile
DIST_DIR_WEB ?= dist

QMAKE ?= qmake
UNITTESTS ?= $(BUILD_DIR_TEST)/UnitTests.app/Contents/MacOS/UnitTests

.PHONY: all build build-web build-cpp build-qmake build-test-cpp \
        test test-web test-cpp test-e2e verify-corpus clean clean-web clean-cpp lint check-independence

all: build test

## --- Build Targets ---

build: build-web build-cpp

build-web:
	npm run build          # npm lifecycle already runs `prebuild`; do not invoke it twice

build-cpp:
	@command -v cmake >/dev/null 2>&1 || { echo "SKIP: cmake/Qt toolchain not installed"; exit 0; }
	cmake -B $(BUILD_DIR_CPP) -S . -GNinja -DCMAKE_BUILD_TYPE=Release
	cmake --build $(BUILD_DIR_CPP)

build-qmake:
	@mkdir -p $(BUILD_DIR_QMAKE)
	cd $(BUILD_DIR_QMAKE) && $(QMAKE) ../tikzit.pro && $(MAKE)

# Native test binary: qmake testcase config (tikzit.pro `test { CONFIG += testcase; TARGET = UnitTests }`).
# There is intentionally no CMake test target — see D20.
build-test-cpp:
	@command -v $(QMAKE) >/dev/null 2>&1 || { echo "SKIP: qmake not installed"; exit 0; }
	@mkdir -p $(BUILD_DIR_TEST)
	cd $(BUILD_DIR_TEST) && $(QMAKE) ../tikzit.pro "CONFIG+=test" && $(MAKE)

## --- Test & Verification Targets ---

test: test-web test-cpp

test-web:
	npm run test

test-cpp: build-test-cpp
	@if [ -f "$(UNITTESTS)" ]; then \
		$(UNITTESTS); \
	elif [ -f "$(BUILD_DIR_TEST)/UnitTests" ]; then \
		./$(BUILD_DIR_TEST)/UnitTests; \
	else \
		echo "SKIP: UnitTests binary not found (Qt not installed?)"; \
	fi

test-e2e:
	npm run test:e2e

verify-corpus:
	npm run verify:corpus

check-independence:
	@echo "Checking browser runtime independence (zero native C++ bindings in web bundle)..."
	@node scripts/verify-browser-independence.mjs

## --- Hygiene & Lint Targets ---

# The repository's real static gate is `npx tsc --noEmit` (what CI runs).
# No ESLint config exists today; if one is added later, extend this target —
# but a lint target MUST fail the build on failure (no `|| true` / `|| echo`).
lint:
	npx tsc --noEmit

clean: clean-web clean-cpp

clean-web:
	rm -rf $(DIST_DIR_WEB) .astro .tmp

clean-cpp:
	rm -rf $(BUILD_DIR_CPP) $(BUILD_DIR_QMAKE) $(BUILD_DIR_TEST)
```

### 3.2 Automated Browser Independence Gate (`scripts/verify-browser-independence.mjs`)

An automated verification script ensuring:
1. **Zero Native Addons**: Inspects `package.json` dependencies (incl. `install`/`postinstall` scripts for `node-gyp`) and scans `dist/` bundle chunks for `.node` binary references, `bindings(` calls, and Node core-module import specifiers (`node:fs`, `fs`, `node:child_process`, `child_process`, `node:path`, `path`). *Scanning note:* match on import/require specifiers and module-registration patterns, not bare substrings — a naive `grep` for `fs`/`path` inside bundled JS produces false positives on legitimate code.
2. **Pure WASM/WebCrypto Primitives**: Asserts that all SQLite storage operations resolve strictly to `sql.js` WASM, and all cryptographic hashing uses standard `crypto.subtle` or pure-JS hash primitives.
3. **Pure DOM/WebGL Sandboxing**: Verifies that `src/canvas/` and `src/services/` do not import or invoke C++ FFI or native operating system handles.

### 3.3 Shared Dual-System Protocol Specification (`docs/architecture/SHARED-PROTOCOL-SPECIFICATION.md`)

Formally documents the shared protocol under the **Kenotic Principle of CLM**: the protocol defines no stateful singletons or ambient runtime mechanisms, modeling all operations strictly as **Pure Mathematical Functions** ($f: A \to B$) and **Petri Net Transitions** ($t: P_{\text{in}} \to P_{\text{out}}$):

1. **Pure AST Transformation Functions**:
   - $f_{\text{parse}}: \text{TikZString} \to \text{Result}\langle\text{AST}, \text{BailVerdict}\rangle$: Pure functional grammar parser.
   - $f_{\text{geom}}: (x, y)_{\text{TikZ}} \to (x, y)_{\text{Canvas}}$: Bijective coordinate transformation function.
   - $f_{\text{teardrop}}: (u, \text{params}) \to \text{BézierControlPoints}$: Deterministic self-loop math ($in = 135^\circ, out = 45^\circ, \text{weight} = 1.0$).
2. **Petri Net MCard Storage Transitions**:
   - $t_{\text{mint}}: (\text{AST}, \text{Metadata}) \to \text{MCard}$: Minting content-addressed block $\text{BLAKE3}(c)$ (SHA-256 provider used for mcard-studio export compatibility).
   - $t_{\text{read}}: \text{Handle} \to \text{MCard}_{\text{head}}$: Pure query transition reading the active head.
   - DDL schema (**canonical — `clm-kernel` `types/schemas/mcard_schema.sql` v3.0.3**, do not improvise):
     - `card(hash TEXT PRIMARY KEY, content BLOB NOT NULL, g_time TEXT NOT NULL)`
     - `handle_registry(handle TEXT PRIMARY KEY, current_hash TEXT NOT NULL, created_at TEXT NOT NULL, updated_at TEXT NOT NULL)`
     - `handle_history(id INTEGER PRIMARY KEY AUTOINCREMENT, handle TEXT NOT NULL, previous_hash TEXT NOT NULL, changed_at TEXT NOT NULL)`
     - Note `handle_history` stores *superseded* hashes (`previous_hash`), not snapshots of the current head — the head is reconstructed from `handle_registry` + the latest history row. This is what makes A→B→A restore positionally valid.
3. **Standardized `clm-kernel` Success & Failure Modes**:
   - All protocol validation and cross-engine testing outcomes use `clm-kernel` types:
     - `VCardResult`: Returned upon successful graph isomorphism match and verified DDL conformance.
     - `BailVerdict.bail(reason, invariantCode)`: Categorizes mismatches via `invariantCode` strings (`'PROTOCOL_MISMATCH'`, `'SYNTAX_ERROR'`, `'COORDINATE_DRIFT'`). *API note:* `BailVerdict` is a factory + discriminated union, not an enum — no `BailVerdict.X` members exist.
     - Sealed via `sealWitness()` or `sealBailRecord()`.
4. **Cross-Engine Conformance Tests**:
   - Automated script (`scripts/verify-protocol-conformance.mjs`) compiling identical canonical diagrams through both C++ `UnitTests` and TS `vitest` to assert AST and attribute equality.

---

## 4. Acceptance Criteria

- **AC-20-01 (Root Makefile Developer Interface)**: A developer typing `make build` successfully builds the web spatial workbench (`dist/`) and, when the Qt toolchain is present, the native desktop C++ binary (`build/tikzit` or `build/tikzit.app`); without Qt, native targets print a clear SKIP notice and do not fail the web pipeline.
- **AC-20-02 (Unified Test Command)**: `make test` executes Vitest unit/integration tests and — when Qt is available — native `UnitTests` built via `make build-test-cpp` (qmake `CONFIG+=test` into `build-test/`). Native steps auto-skip with a visible notice on machines without Qt; a *failure* of an invoked suite always propagates a nonzero exit code.
- **AC-20-03 (Browser Independence Gate)**: `make check-independence` completes cleanly with 0 violations. Any accidental import of native bindings in `src/` or `dist/` triggers immediate build failure.
- **AC-20-04 (QMake Shadow Directory Isolation)**: The qmake app build (`make build-qmake`) generates its Makefile and artifacts strictly inside `build-qmake/`; the authored root `Makefile` carries an unmistakable "authored, do not regenerate" header, and a unit test (T20-04) asserts the root file is the authored one (e.g. by marker comment), catching an accidental root-level `qmake` run.
- **AC-20-05 (Protocol Specification Document)**: `docs/architecture/SHARED-PROTOCOL-SPECIFICATION.md` is authored, capturing TikZ grammar, coordinate mapping, and the **canonical** MCard DDL (`card` / `handle_registry` / `handle_history` per `clm-kernel` `mcard_schema.sql` v3.0.3) as pure functions and Petri Net transitions.
- **AC-20-06 (Corpus Verification Integration)**: `make verify-corpus` executes the 12-diagram ZX-Calculus verification and passes 100% green.
- **AC-20-07 (Standardized clm-kernel Result Modes)**: Cross-system conformance checks emit structured `VCardResult` witnesses and `BailVerdict.bail(reason, invariantCode)` failure records from `clm-kernel`.

---

## 5. Comprehensive Test Strategy & New Test Case Inventory

This sprint introduces automated verification suites across build orchestration, browser runtime sandboxing, and protocol specification compliance:

### 5.1 Build Orchestration & Makefile Verification (`tests/unit/build/makefile.test.ts`)

| Test ID | Test Name | Target Subsystem | Description & Expected Assertions |
| :--- | :--- | :--- | :--- |
| **T20-01** | `test_makefile_syntax_and_phony_targets` | Build Harness | Reads root `Makefile` and asserts that all essential targets (`all`, `build`, `build-web`, `build-cpp`, `build-qmake`, `build-test-cpp`, `test`, `test-web`, `test-cpp`, `test-e2e`, `verify-corpus`, `clean`, `lint`, `check-independence`) are declared in `.PHONY` and contain valid shell syntax; also asserts the authored-marker header is present (proving the file is not a qmake artifact). |
| **T20-02** | `test_makefile_parallel_execution` | Build Harness | Asserts that running `make -j4` does not produce race conditions between C++ build directory creation and web compilation. |
| **T20-03** | `test_makefile_error_exit_code_propagation` | Build Harness | Simulates a sub-command failure in `build-web` or `build-cpp` and verifies that `make` immediately terminates with a non-zero exit code. |
| **T20-04** | `test_qmake_shadow_directory_isolation` | Build Harness | Verifies that executing `make build-qmake` generates artifacts strictly in `build-qmake/` without touching or modifying the root `Makefile`, and that `make build-test-cpp` produces `build-test/UnitTests` (skipped when qmake is absent). |
| **T20-04b** | `test_native_test_binary_route` | Build Harness | Asserts `test-cpp` resolves `UnitTests` from `build-test/` (qmake testcase build), matching `npm run test:native` — never from the CMake `build/` tree, which contains no test target. |

### 5.2 Browser Runtime Independence Gate (`scripts/verify-browser-independence.mjs`)

| Test ID | Test Name | Target Subsystem | Description & Expected Assertions |
| :--- | :--- | :--- | :--- |
| **T20-05** | `test_zero_native_addon_in_package_json` | Sandboxing | Inspects `package.json` production and peer dependencies; asserts that zero packages require `node-gyp`, native C++ bindings, or `.node` binary files. |
| **T20-06** | `test_zero_node_binary_in_dist_bundle` | Sandboxing | Performs AST analysis and regex scan across all generated `.js` bundles in `dist/`; asserts zero references to Node `child_process`, `fs`, `path`, or native binary bindings. |
| **T20-07** | `test_pure_wasm_sqljs_storage_runtime` | Sandboxing | Verifies that all SQLite database operations in `src/services/clm/` resolve strictly to `sql.js` WASM initialization and never invoke native sqlite3 bindings. |
| **T20-08** | `test_pure_webcrypto_hashing_runtime` | Sandboxing | Verifies that all cryptographic hashing in `src/services/` resolves to standard browser `crypto.subtle` (SHA-256) or pure-JS hash primitives, functioning seamlessly in headless browser contexts. |

### 5.3 Shared Protocol Conformance Unit Suite (`tests/unit/protocol/sharedProtocol.test.ts`)

| Test ID | Test Name | Target Subsystem | Description & Expected Assertions |
| :--- | :--- | :--- | :--- |
| **T20-09** | `test_ebnf_grammar_ast_type_validation` | Shared Protocol | Validates that the shared AST TypeScript definitions (`src/core/parser/ast.ts`) accurately represent all EBNF grammar productions defined in `SHARED-PROTOCOL-SPECIFICATION.md`. |
| **T20-10** | `test_coordinate_mapping_transform_math` | Shared Protocol | Verifies coordinate transformation bijection: mathematical Cartesian $Y$-up $(x, y) \leftrightarrow$ Three.js world space $(x, y, 0) \leftrightarrow$ Qt scene space $(x, -y)$, with zero precision loss across float ranges $[-100.0, 100.0]$. |
| **T20-11** | `test_teardrop_self_loop_math_invariants` | Shared Protocol | Asserts exact geometric angles for self-loops: $in = 135^\circ, out = 45^\circ$, weight 1.0, and verifies identical Bézier control points in both JS SVG rendering and C++ TikzScene. |
| **T20-12** | `test_junction_node_conventions` | Shared Protocol | Asserts standard styling for junction nodes: `style=none`, empty label `{}`, dashed lavender ring `#B4B4DC`, center dot `#B4B4C8`. |
| **T20-13** | `test_mcard_tri_database_schema_contract` | Shared Protocol | Asserts that `SHARED-PROTOCOL-SPECIFICATION.md` documents exact DDL statements for `cards`, `handles`, and `handle_history`, matching the table structures used across both platforms. |
| **T20-14** | `test_canonical_zx_corpus_graph_isomorphism` | Shared Protocol | Compiles the 12 canonical ZX diagrams through the protocol validator and asserts graph topological equivalence (matching vertex degrees, connectivity, and style names). |
| **T20-15** | `test_edge_case_syntax_parity` | Shared Protocol | Validates behavior on complex TikZ constructs (nested brackets in labels, empty paths, multi-segment edges), asserting identical AST representations. |
| **T20-16** | `test_syntax_error_reporting_parity` | Shared Protocol | Verifies that malformed TikZ code triggers clear syntax error objects with line and column numbers matching across runtimes. |

---

## 6. Legacy Test Preservation & Regression Safeguards

Refactoring the build system and defining the shared protocol must not degrade or destabilize the existing codebase:

1. **Vitest Unit & Integration Suite Protection**:
   - Baseline (recorded 2026-09-29 via `npx vitest list`): **55 test files, 334 tests** passing 100% green.
   - Requirement: `npm test` and `make test-web` must continue executing the full kickoff-recorded baseline with zero failures or skipped suites.
2. **Playwright End-to-End Suite Protection**:
   - Baseline (recorded 2026-09-29 via `npx playwright test --list`): **26 spec files, 402 test runs** across Chromium, Firefox, WebKit.
   - Requirement: `npm run test:e2e` and `make test-e2e` must pass cleanly without modification to any existing test scripts.
3. **PQP Canonical ZX-Calculus Corpus Invariant**:
   - Baseline: **12/12 diagrams verified** (`npm run verify:corpus`).
   - Requirement: `make verify-corpus` must pass 100% green.
4. **Native C++ Qt6 UnitTests Invariant**:
   - Baseline: `UnitTests` binary (qmake testcase build at `build-test/`) executing all assertions green.
   - Requirement: `make test-cpp` must execute the native test binary and assert full pass (or SKIP with notice when Qt is absent — skip is not a pass and must be visible in logs).
5. **NPM Script Backward Compatibility**:
   - All standard `package.json` scripts (`npm run dev`, `npm run build`, `npm run preview`, `npm test`, `npm run test:native`, `npm run verify:corpus`) must remain completely functional and unaltered.

---

## 7. Definition of Done (DoD) Checklists

To examine progress systematically, this sprint is gated by 10 verifiable Definition of Done checkpoints:

### Architecture & Build Orchestration Gates
- [x] **G01 — Authored Root Makefile Deployed**: Root `Makefile` is authored and committed; the git-tracked qmake artifact is removed (`git rm`) in the same change. It defines `.PHONY` targets for `all`, `build`, `build-web`, `build-cpp`, `build-qmake`, `build-test-cpp`, `test`, `test-web`, `test-cpp`, `test-e2e`, `verify-corpus`, `clean`, `lint`, and `check-independence`, and carries an authored-marker header asserted by T20-01.
- [x] **G02 — Dual-System Build Success**: Running `make build` from a clean checkout builds the web application (`dist/`) and, on Qt-equipped machines, the desktop C++ binary (`build/tikzit` or `build/tikzit.app`); on machines without Qt the native step prints a SKIP notice and the web build still succeeds.
- [x] **G03 — QMake Shadow Isolation**: Running `make build-qmake` emits artifacts strictly to `build-qmake/` and never overwrites the root `Makefile`; `make build-test-cpp` emits strictly to `build-test/`.
- [x] **G04 — Dual-System Test Execution**: Running `make test` executes Vitest unit/integration tests and native Qt `UnitTests` (when Qt present), returning exit code 0 on complete success and non-zero on any failure of an invoked suite.

### Browser Independence & Sandboxing Gates
- [x] **G05 — Browser Independence Gate Implemented**: `scripts/verify-browser-independence.mjs` is authored, executable via `make check-independence`, and asserts zero native C++ bindings, `.node` addons, or Node-specific I/O in client bundles.
- [x] **G06 — Zero Native Dependencies in Web Bundle**: Automated scan verifies that `dist/` contains purely browser-compatible JavaScript, CSS, and WASM (`sql.js`), with zero C++ FFI bindings.

### Shared Protocol & Documentation Gates
- [x] **G07 — Shared Protocol Specification Authored**: `docs/architecture/SHARED-PROTOCOL-SPECIFICATION.md` is authored, capturing TikZ EBNF grammar, coordinate transformations ($Y$-up $\leftrightarrow$ Three.js $\leftrightarrow$ Qt), teardrop loop math, junction conventions, and MCard SQLite DDL.
- [x] **G08 — Protocol Unit Suite Passing**: `tests/unit/protocol/sharedProtocol.test.ts` is implemented and passes all test cases (T20-09 to T20-16).

### Regression & Verification Artifact Gates
- [x] **G09 — Zero Regressions on Existing Suites**: All Vitest unit tests, Playwright E2E runs, 12 canonical ZX diagrams, and native `UnitTests` assertions in the kickoff-recorded baseline pass 100% green.
- [x] **G10 — Verification Evidence**: Output logs of `make all`, `make check-independence`, and `make verify-corpus` are captured under the sprint's verification artifacts directory (or CI artifacts) — logs are evidenced, not committed to `docs/`.

---

## 8. Verification Commands & Execution Runbook

Execute these commands to verify Sprint 20 completion:

```bash
# 1. Clean build directories
make clean

# 2. Build both platforms through unified Makefile
make build

# 3. Verify browser runtime independence (zero native C++ in web bundles)
make check-independence

# 4. Run unified test suite (Web Vitest + Native C++ UnitTests)
make test

# 5. Run end-to-end browser test suite
make test-e2e

# 6. Verify 12 canonical ZX-calculus diagrams
make verify-corpus

# 7. Run code hygiene and linting
make lint
```

