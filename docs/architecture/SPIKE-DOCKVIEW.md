# Architectural Spike: Dockview Window Management & Hydration Resilience

**Status:** Complete  
**Date:** 2026-09-27  
**Author:** TikZiT Web Engineering  
**Lineage:** `mcard-studio` spatial workbench design pattern  

---

## 1. Executive Summary

TikZiT Web adopts **Dockview** (`dockview-react` 8.3+) as its core spatial window management engine. Dockview provides VS Code-grade docking, splitting, tab dragging, and floating panels. We inherit the architectural design patterns of `mcard-studio` (the reference CLM-native PWA workbench) without importing its code.

This document details the architectural findings, lifecycle management, sash mechanics, and critical hydration/caching safeguards required when running Dockview within Astro 7 SSR/client-islands.

---

## 2. Workbench Anatomy & Dockview Host

The application shell organizes panels into structured regions:

```
+--------------------------------------------------------------------------+
| Global Command Bar (Header, Title, Document Tabs, Zoom/Theme Controls)  |
+----+----------------------------------------------+----------------------+
| A  | Primary Editor Grid (DockviewReact Container)| Right Inspector Rail |
| c  | +----------------------+---------------------+ (Properties, Styles)|
| t  | | Canvas (Three.js)    | TeX Preview (SVG)   |                      |
| i  | |                      |                     |                      |
| v  | +----------------------+---------------------+                      |
| i  | | Source Editor (CodeMirror / Monaco)        |                      |
| t  | +--------------------------------------------+                      |
| y  | Bottom Console & Diagnostics Drawer          |                      |
+----+----------------------------------------------+----------------------+
| Status Bar (TikZ Mode, Node/Edge Count, BLAKE3 CID, Zoom, Layout State)   |
+--------------------------------------------------------------------------+
```

### 2.1 React Island Isolation
Dockview is mounted as a client-only React island:
```astro
---
// src/pages/index.astro
import TikzitSpatialWorkbench from '../components/workbench/TikzitSpatialWorkbench';
---
<TikzitSpatialWorkbench client:only="react" />
```
Using `client:only="react"` prevents server-side rendering mismatches since Dockview relies directly on DOM dimension calculations, `ResizeObserver`, and WebGL canvas mounting.

---

## 3. Hydration Resilience & Caching Mitigations

### 3.1 The 0-Panel Layout Poisoning Hazard
When a user closes all tabs or when a race condition occurs during unmount, Dockview's `api.toJSON()` may emit a structure with zero panels (`api.panels.length === 0`). If persisted to `localStorage`, subsequent reloads load an empty grid, rendering a completely blank viewport.

**Mitigation Rule:**
```typescript
const saveLayout = (api: DockviewApi) => {
  if (!api || api.panels.length === 0) {
    // ABORT: Never persist an empty layout
    return;
  }
  const layout = api.toJSON();
  localStorage.setItem('tikzit:workbench:layout', JSON.stringify(layout));
};

const restoreLayout = (api: DockviewApi) => {
  try {
    const raw = localStorage.getItem('tikzit:workbench:layout');
    if (raw) {
      const layout = JSON.parse(raw);
      if (layout && layout.grid && layout.panels && Object.keys(layout.panels).length > 0) {
        api.fromJSON(layout);
        return;
      }
    }
  } catch (err) {
    console.warn('Failed to restore layout, loading default layout', err);
  }
  loadDefaultLayout(api);
};
```

### 3.2 Service Worker & Vite Dev Caching
Aggressive Service Worker caching during local development causes stale JavaScript chunks and outdated module evaluation.
1. **Dev Service Worker Disabled:** In `astro.config.mjs`, Service Workers are omitted during development.
2. **Localhost Auto-Unregistration:** An inline script detects `localhost` / `127.0.0.1` and unregisters any lingering Service Workers.
3. **No-Cache Headers:** Vite dev server sets:
   ```http
   Cache-Control: no-store, no-cache, must-revalidate, proxy-revalidate
   ```

---

## 4. Sash Semantics & Group Equalization

1. **Draggable Sashes:** 5px draggable separators with `role="separator"`, min/max clamping per region (e.g. Inspector clamped to 240px–600px).
2. **Double-Click Equalization:** Double-clicking any sash separating two Dockview groups triggers an instant 50/50 space equalization between adjacent panes.
3. **Kenotic Depress & Restore:**
   - When a user enters Welcome / Presentation mode, the workbench state is depressed into the background (`$isDockviewDepressed = true`).
   - A floating `DockviewRestoreAnchor` in the status bar displays `DockView: N tabs`. Clicking it elevates the workbench with zero state loss.

---

## 5. Panel Registry

| Panel ID | Component Renderer | Role |
| :--- | :--- | :--- |
| `canvas` | `CanvasPanel` | Three.js WebGL canvas stage with infinite vector grid |
| `source` | `SourcePanel` | TikZ text editor with syntax highlighting and bidirectional sync |
| `inspector` | `InspectorPanel` | Property editor for selected nodes/edges/bounding boxes |
| `palette` | `PalettePanel` | ZX-calculus & category theory style swatch picker |
| `preview` | `PreviewPanel` | TeX/SVG live rendered output preview |
| `console` | `ConsolePanel` | Diagnostics, parser errors, and CLM execution receipts |
| `welcome` | `WelcomePanel` | Getting started guide and canonical PQP gallery launcher |

---

## 6. Event Bus Decoupling (`tikzit:*`)

Panels never mutate graph state or cross-reference other panels directly. All inter-panel communication occurs via the global Cordis action mesh or typed DOM CustomEvents:
- `tikzit:layout-reset`: Resets Dockview to default 4-panel quadrant.
- `tikzit:toggle-panel`: Shows or hides a specific panel.
- `tikzit:tool-selected`: Broadcasts active tool change (`SELECT`, `VERTEX`, `EDGE`, `BBOX`).
- `tikzit:selection-changed`: Updates Inspector when nodes/edges are selected on the canvas.
