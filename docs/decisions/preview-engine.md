# ADR-006: In-Browser TeX Preview Engine & Exporter Architecture

## 1. Context & Problem Statement
TikZiT is an interactive graphical editor for TikZ diagrams. On desktop (C++/Qt), preview and export rely on an external `pdflatex` process executed via `QProcess`, piping a generated LaTeX document to a temporary directory and rendering the resulting PDF via Poppler (`PdfDocument`).

In a modern web application running in browser sandboxes, invoking an external native `pdflatex` binary is not directly available without local daemons or remote services. Users expect:
1. Instant, responsive, 60 FPS visual preview while manipulating diagrams on the canvas.
2. Full semantic parity with TikZ/PGF formatting (layers, curved edges, self-loops, custom shapes, colors, math labels).
3. Robust export options matching or exceeding desktop TikZiT: SVG, PNG (1x, 2x Retina, 4x Print), standalone PDF, and clean `.tikz` / `.tex` files.
4. Offline capability with zero required backend dependencies.

---

## 2. Evaluation of Evaluated Alternatives

### Option A: Monolithic WebAssembly TeX (SwiftLaTeX / Web2JS / TeXLive WASM)
- **Mechanism:** Compile full pdfTeX/XeTeX to WebAssembly via Emscripten.
- **Footprint:** ~35MB - 65MB initial payload (engine WASM + font metric files + macro packages).
- **Cold Boot Time:** 3,500ms - 8,000ms.
- **Warm Recompile:** 400ms - 1,500ms per render.
- **Failure Modes:** Memory exhaust in restricted browser tabs, WebWorker OOM, CSP restrictions in locked-down environments.
- **Verdict:** Unacceptable as the sole blocking preview path for interactive diagramming.

### Option B: Remote Compilation Service (HTTP / WebSocket to LaTeX backend)
- **Mechanism:** Send TikZ source over network to server running native `pdflatex`.
- **Latency:** 500ms - 2,000ms network round-trip.
- **Offline:** 0% availability when disconnected.
- **Privacy:** User diagrams leave local sandbox.
- **Verdict:** Violates offline-first architectural commitment.

### Option C: Hybrid Vector-First Pipeline (Selected Architecture)
- **Primary Interactive Pipeline:** High-performance, zero-latency TypeScript Vector Engine directly synthesizing SVG from `GraphAST` and `TikzStylesCatalog`.
  - Sub-millisecond execution (< 2ms for 200 nodes/edges).
  - Exact geometric parity with TikZ PGF coordinate systems, cubic Bézier splines, bend angles, self-loops, and layered rendering (`edgelayer` before `nodelayer`).
  - Desktop TikZiT visual fidelity for style conventions, junction nodes (`style=none`), and named colors.
- **TeX Preamble & Document Synthesis Pipeline:** `PreambleManager` manages standard TikZiT packages (`tikzit.sty`, `amsmath`, `shapes`, `arrows.meta`, `backgrounds`) and generates standalone `.tex` documents with PGF layers.
- **Asynchronous TeX Compilation Hook:** Optional WebAssembly / Worker compilation pipeline with debounced triggers, auto-compile toggle, and compiler log console.
- **Universal Multi-Format Exporters:**
  - Scalable vector SVG with proper XML namespaces and metadata.
  - High-resolution raster PNG at 1x (screen), 2x (Retina), and 4x (print / 300+ DPI).
  - Standalone PDF vector output.
  - Formatted `.tikz` fragment and standalone `.tex` document.

---

## 3. Decision
We adopt **Option C: Hybrid Vector-First Pipeline**.

1. **Immediate Preview:** The Preview Panel renders the verified SVG vector model instantly upon graph change, debounced at 100ms.
2. **Preamble Integrity:** The `PreambleManager` guarantees that generated LaTeX documents contain canonical `tikzit.sty` definitions, declared layers (`edgelayer`, `nodelayer`, `main`), and user-configured packages.
3. **Multi-Format Exporters:** All vector and image exporters leverage the verified AST and SVG geometry, ensuring crisp, standalone files for publication and inclusion in LaTeX papers.
4. **Markdown Integration:** Embedded `tikz` code fences within markdown documents compile directly into interactive diagrams via the preview pipeline.
