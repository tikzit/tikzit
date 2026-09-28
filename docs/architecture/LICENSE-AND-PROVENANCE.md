# License, Provenance & Dependency Audit

**Status:** Canonical Reference  
**Date:** 2026-09-27  
**Author:** TikZiT Web Engineering  
**Project License:** GNU General Public License v3.0 (GPL-3.0)  
**Original Authors:** Aleks Kissinger & Chris Heunen  

---

## 1. Project Provenance & Original Authorship

**TikZiT** was conceived and developed by:
- **Aleks Kissinger** (University of Oxford)
- **Chris Heunen** (University of Edinburgh)

The original C++/Qt codebase was authored to support string diagrammatic reasoning, category theory, and ZX-calculus, culminating in the publication of:
> **Picturing Quantum Processes: A First Course in Quantum Theory and Diagrammatic Reasoning**  
> Bob Coecke & Aleks Kissinger  
> *Cambridge University Press, 2017* (ISBN: 978-1107107816)  
> All 2,500+ diagrams in the textbook were drawn in TikZiT.

The desktop repository is licensed under the **GNU General Public License v3.0 (GPL-3.0)**.

---

## 2. Web Re-Implementation & Licensing Architecture

The TikZiT Web platform is a clean-room TypeScript re-implementation of the editor, porting the grammar and interaction semantics of the C++/Qt desktop codebase to modern browser standards (Astro, WebGL/Three.js, Dockview, React).

### 2.1 License Selection
To respect the original authors' intent and maintain reciprocal open-source protections, **TikZiT Web remains licensed under GPL-3.0**.
- Any redistribution, modification, or hosted derivative of TikZiT Web that constitutes a combined work must make its source code available under GPL-3.0.
- Pure domain models (AST types, TikZ parser) are kept modular to allow clean verification against desktop reference fixtures.

### 2.2 Third-Party Dependency Compatibility Matrix
All runtime and build-time web dependencies have been audited for GPL-3.0 compatibility:

| Package | Version | License | Compatibility with GPL-3.0 | Role |
| :--- | :--- | :--- | :--- | :--- |
| `astro` | ^7.3.5 | MIT | ✅ Fully Compatible | Static-first framework & SSR host (Vite 8 & Rust compiler) |
| `@astrojs/react` | ^7.0.0 | MIT | ✅ Fully Compatible | React client island renderer |
| `react` / `react-dom` | ^19.3.0 | MIT | ✅ Fully Compatible | UI island framework |
| `dockview-react` | ^8.3.1 | MIT | ✅ Fully Compatible | Spatial docking window manager (`mcard-studio` lineage) |
| `three` | ^0.186.1 | MIT | ✅ Fully Compatible | WebGL 2D/3D hardware-accelerated canvas |
| `animejs` | ^4.5.0 | MIT | ✅ Fully Compatible | Elastic physics & micro-animations |
| `cordis` | ^4.0.0-rc.10 | MIT | ✅ Fully Compatible | Reactive service container |
| `clm-kernel` | ^0.0.1 | MIT | ✅ Fully Compatible | Cubical Logic Model & MCard CAS |
| `tailwindcss` | ^4.3.3 | MIT | ✅ Fully Compatible | CSS styling engine |
| `@tailwindcss/vite` | ^4.3.3 | MIT | ✅ Fully Compatible | Tailwind CSS v4 Vite integration plugin |
| `typescript` | ^7.0.2 | Apache-2.0 | ✅ Fully Compatible | Static type checking and transpilation |
| `vitest` | ^5.0.2 | MIT | ✅ Fully Compatible | Pure domain unit test runner |
| `@playwright/test` | ^1.63.0 | Apache-2.0 | ✅ Fully Compatible | E2E browser automation & visual testing |
| `@types/node` | ^25.5.0 | MIT | ✅ Fully Compatible | Node.js ambient type definitions |
| `@types/react` / `@types/react-dom` | ^19.3.0 | MIT | ✅ Fully Compatible | React ambient type definitions |
| `@types/three` | ^0.186.0 | MIT | ✅ Fully Compatible | Three.js ambient type definitions |

All direct dependencies use permissive MIT or Apache-2.0 licenses, which can be legally linked and distributed alongside GPL-3.0 applications.

---

## 3. Clean-Room Parser Port Boundary

The TikZ grammar parser port in Sprint 01 translates the logic of `src/data/tikzlexer.l` (Flex) and `src/data/tikzparser.y` (Bison) into pure TypeScript.
1. The desktop Qt test suite (`src/test/testparser.cpp` and `src/test/testtikzoutput.cpp`) serves as the differential verification oracle.
2. No proprietary or closed-source code is utilized.
3. Full attribution is maintained in all ported headers and package manifests.
