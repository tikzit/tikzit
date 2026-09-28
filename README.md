# TikZiT

TikZiT is a graphical tool for rapidly creating graphs and string diagrams using PGF/TikZ. It was used, for example, to make all of the 2500+ diagrams in <a href="http://cambridge.org/pqp">Picturing Quantum Processes</a>.

This repository hosts two complementary implementations:
1. **TikZiT Web Spatial Workbench** — A modern, in-browser graphical workbench built with Astro 7, React, TypeScript, Three.js WebGL, Dockview, and Cordis/Nanostores state management.
2. **TikZiT Native Desktop Application** — The original high-performance desktop application implemented in C++ and Qt (Qt 5 / Qt 6).

---

## TikZiT Web Spatial Workbench

The web workbench brings the complete TikZiT diagramming experience into modern browsers with zero local installation required. It is backed by a TypeScript recursive-descent parser directly compliant with TikZiT's Flex/Bison grammar, offering lossless round-tripping of TikZ code, 60 FPS WebGL rendering, and full PWA offline support.

### Features
- **Deterministic AST Parser & Combinators**: Pure TypeScript tokenizer, recursive-descent grammar combinators (`nodeCombinator`, `edgeCombinator`, `styleCombinator`, `propertyCombinator`, `pathCombinator`), and emitter ensuring byte-level fidelity with native TikZiT PGF/TikZ files.
- **Three.js WebGL Canvas**: Infinite smooth pan/zoom canvas, procedural coordinate grid shader, high-contrast dashed junction circles, and Bézier curves.
- **Dockview Spatial Workbench**: Fully customizable multi-dock workspace with draggable, collapsable panels for the canvas, source code editor, live TeX preview, style palette, and property inspector.
- **Petri Net Document Lifecycle & CSP Sync**: Formal marked Petri Net state machine (`DocumentProcess.ts`) guaranteeing token conservation and dirty-buffer protection during async persistence, coordinated via bounded CSP asynchronous channels (`SyncChannel.ts`).
- **Unified Diagram Lifecycle & Version History**: User diagram creation (`zx:diagrams:UUID`), prominent Draft save affordance, session durability across reloads, and version history popover with non-destructive restore, preview, and comparison.
- **Comprehensive Multi-Format Export**: Verbatim TikZ/TeX export, rendered vector SVG, raster PNG (1x, 2x, 4x), PDF generation via `pdf-lib`, and standalone sovereign SQLite `.db` collection export with complete lineage closure and `mcard-studio` round-trip verification.
- **CLM TriDatabase Persistence**: Transactional state history and local offline storage via `SqlJsBackend` pillars (mcard, executionLog, knowledge) snapshotted to IndexedDB with PWA service worker offline readiness.
- **Dual-System Protocol & Independence Gate**: Authored root `Makefile` backed by an automated 5-check browser independence gate (`make check-independence`) guaranteeing pure WASM execution, and cross-engine protocol conformance tests (`make check-conformance`).

### Quick Start (Web)

Ensure you have [Node.js](https://nodejs.org/) (v18 or later) installed:

```bash
# 1. Install dependencies
npm install

# 2. Launch local development server (runs on http://localhost:4321)
npm run dev
```

### Testing & Verification

The web workbench is backed by a comprehensive automated test matrix orchestrated via the root `Makefile`:

```bash
# Run Vitest unit, parser, CLM, and integration test suite (77 test files, 466 tests)
make test-web

# Run automated browser independence verification (5 checks, 0 native C++ bindings)
make check-independence

# Verify dual-system protocol conformance across 12 canonical ZX diagrams
make check-conformance

# Run Playwright cross-browser test suite (Chromium, Firefox, WebKit)
make test-e2e

# Verify 12 canonical ZX diagrams corpus fixture
make verify-corpus

# Check TypeScript types
npx tsc --noEmit

# Compile production bundle and PWA service worker
make build-web
```

---

## Repository Layout

```
tikzit/
├── Makefile            # Unified developer Makefile (web and native desktop)
├── src/
│   ├── core/           # TypeScript TikZ AST parser, grammar combinators, and lexer
│   ├── canvas/         # Three.js WebGL canvas engine, shaders, and renderers
│   ├── components/     # Dockview spatial workbench, style palette, preview, inspectors
│   ├── stores/         # Nanostores flux state management and undo/redo history
│   ├── services/       # Cordis service mesh, Petri Net actors, and MCard persistence
│   ├── gui/            # Native C++ Qt window, scene, and tool implementations (Reference)
│   └── data/           # Native C++ graph and parser data structures (Reference)
├── docs/
│   ├── sprints/        # Implementation sprint specifications (Sprints 00-24 Graduated)
│   ├── examples/       # 12-diagram ZX-calculus reference corpus with SVGs
│   ├── architecture/   # Architecture specifications (Shared Dual-System Protocol)
│   └── changelog/      # Weekly changelog archive (YYYY-Www.md)
├── tests/              # Vitest unit, integration, and headless test suites (466 tests)
├── e2e/                # Playwright end-to-end and browser inspection scenarios
├── scripts/            # Build, testid audit, independence, and conformance verification scripts
├── images/             # Canonical application icon and tool SVGs
├── CMakeLists.txt      # CMake build configuration for native Qt application
├── tikzit.pro          # qmake project file for native Qt application
└── astro.config.mjs    # Astro configuration for Web Spatial Workbench
```

---

## Building Native Desktop App with CMake

A CMake build is supported (Qt 6 recommended). The application requires the Qt Core, Gui, Widgets, Network, and **Pdf** modules — `QPdfDocument` is used by the preview window, so QtPdf must be installed (it ships with the standard Qt distribution):

```bash
cmake -B build -DCMAKE_BUILD_TYPE=Release
cmake --build build
```

On macOS with Qt installed via Homebrew, point CMake at the Qt prefix, e.g.:

```bash
cmake -B build -DCMAKE_PREFIX_PATH="$(brew --prefix qt)"
```

---

## Building Native Desktop App on macOS

You'll need developer tools, Qt5 or Qt6, and Poppler (with Qt bindings) installed. You can install these via Homebrew with the following commands:

```bash
brew install qt
brew install poppler --with-qt
```

Once installed, TikZiT can be built from the command line via:

```bash
qmake -r
make
```

To bundle the required libraries into `tikzit.app` and create a `.dmg` file, run:

```bash
./deploy-osx.sh
```

---

## Building Native Desktop App on Linux

Tested on modern Linux distributions (e.g. Ubuntu 22.04+):

```bash
sudo apt install flex bison libpoppler-dev libpoppler-cpp-dev libgl1-mesa-dev
qmake -r
make
```

To package into a portable directory:

```bash
./deploy-linux.sh
```

---

## Building Native Desktop App on Windows

TiKZiT can be built on Windows using Qt Creator or from the command line with MinGW.

In addition to Qt itself, TikZiT requires flex/bison, [Poppler](https://poppler.freedesktop.org/) (with Qt bindings), and [OpenSSL](https://www.openssl.org/). For flex/bison, install via [Chocolatey](https://chocolatey.org):

```cmd
choco install winflexbison
```

Download [win32-deps.zip](http://tikzit.github.io/download/win32-deps.zip) and extract it into the source folder before building. From the MinGW prompt:

```cmd
qmake -r
mingw32-make
deploy-win.bat
```
