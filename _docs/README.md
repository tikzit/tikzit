# TikZiT Strategic Analysis & Engineering Proposals (`_docs/`)

Welcome to the `_docs/` repository directory, hosting strategic architecture studies, technical audits, and future engineering proposals for the TikZiT diagramming ecosystem.

---

## Featured Whitepapers & Articles

### 📄 [CODEBASE-ANALYSIS-AND-STRATEGIC-RECOMMENDATIONS.md](file:///Users/bkoo/.gemini/antigravity/worktrees/tikzit/generate_project_summary/_docs/CODEBASE-ANALYSIS-AND-STRATEGIC-RECOMMENDATIONS.md)
*Comprehensive Codebase Study, Technical Debt Analysis, and Strategic Modernization Blueprint (September 2026)*

#### Executive Highlights & Key Proposals:
1. **Source Panel Modernization**: Upgrading from the plain HTML `<textarea>` in [`SourcePanel.tsx`](file:///Users/bkoo/.gemini/antigravity/worktrees/tikzit/generate_project_summary/src/components/workbench/panels/SourcePanel.tsx) to **CodeMirror 6**, delivering syntax highlighting, delimiter matching (`{...}`, `(...)`, `[...]`), diagnostic squiggles, and bi-directional focus synchronization with the WebGL canvas.
2. **Mathematical Typography & Graphics**: Replacing standard 2D canvas text with **KaTeX-rendered vector textures** in [`NodeRenderer.ts`](file:///Users/bkoo/.gemini/antigravity/worktrees/tikzit/generate_project_summary/src/canvas/renderers/NodeRenderer.ts) for genuine LaTeX math formatting (fractions, roots, subscripts, Greek characters), paired with `THREE.InstancedMesh` for 10,000+ node scale.
3. **Diagramming Ergonomics & Layout Tools**: Introducing multi-node alignment (align left/center/right, top/middle/bottom), equidistant pitch distribution, and arrow-key nudging (0.1 and 1.0 TikZ units) in [`WorkbenchCommandBar.tsx`](file:///Users/bkoo/.gemini/antigravity/worktrees/tikzit/generate_project_summary/src/components/workbench/WorkbenchCommandBar.tsx) and [`keybindings.ts`](file:///Users/bkoo/.gemini/antigravity/worktrees/tikzit/generate_project_summary/src/services/keybindings.ts).
4. **AST Lossless Comment Preservation**: Enhancing [`TikzParser`](file:///Users/bkoo/.gemini/antigravity/worktrees/tikzit/generate_project_summary/src/core/parser/parser.ts) and [`TikzEmitter`](file:///Users/bkoo/.gemini/antigravity/worktrees/tikzit/generate_project_summary/src/core/parser/emitter.ts) to retain LaTeX comments (`% ...`) throughout bidirectional edits.
5. **Interactive ZX-Calculus Rewrite Engine**: Adding automated quantum graph rewriting macros (Spider Fusion with phase algebra, Identity Elimination, Color Change) and PyZX integration.
6. **Native Desktop C++ Modernization**: Transitioning [`CMakeLists.txt`](file:///Users/bkoo/.gemini/antigravity/worktrees/tikzit/generate_project_summary/CMakeLists.txt) to default to Qt 6, fixing Poppler detection, and automating cross-platform GitHub Actions CI.

---

## Cross-References

- **[docs/PROJECT-SUMMARY.md](file:///Users/bkoo/.gemini/antigravity/worktrees/tikzit/generate_project_summary/docs/PROJECT-SUMMARY.md)**: Master architectural specification of the current production system (v2.2.0).
- **[docs/README.md](file:///Users/bkoo/.gemini/antigravity/worktrees/tikzit/generate_project_summary/docs/README.md)**: Main documentation index for architecture spikes, decisions, and sprint archives.
- **[docs/sprints/README.md](file:///Users/bkoo/.gemini/antigravity/worktrees/tikzit/generate_project_summary/docs/sprints/README.md)**: Historical record of completed Sprints 00 through 19.
