# Specification: Supported TikZ/PGF Subset & Round-Trip Grammar

**Status:** Canonical Reference  
**Date:** 2026-09-27  
**Author:** TikZiT Web Engineering  
**Reference Oracle:** TikZiT Desktop (C++/Qt) `tikzlexer.l` and `tikzparser.y`  

---

## 1. Executive Charter

TikZiT is a specialized visual editor designed specifically for **string diagrams, quantum circuits (ZX-calculus), and category theory wiring diagrams**. It intentionally defines a clean, mathematically tractable subset of PGF/TikZ.

This specification documents the exact syntax supported by TikZiT Web, guarantees bidirectional round-trip invariance for valid diagrams, and specifies diagnostic behaviors for unhandled LaTeX/PGF constructs.

---

## 2. Formal Grammar Subset

A valid TikZiT document consists of an optional bounding box path, followed by nodes grouped in a `nodelayer`, and edges grouped in an `edgelayer`.

```latex
\begin{tikzpicture}[baseline=(current bounding box.east)]
	\begin{pgfonlayer}{nodelayer}
		\node [style=Z] (0) at (-1.5, 0.75) {$\alpha$};
		\node [style=X] (1) at (1.5, -0.75) {};
	\end{pgfonlayer}
	\begin{pgfonlayer}{edgelayer}
		\draw [style=wire, in=180, out=0, looseness=1.25] (0) to (1);
	\end{pgfonlayer}
\end{tikzpicture}
```

### 2.1 Bounding Box Specification
- **Syntax:**
  ```latex
  \path [use as bounding box] (x1, y1) rectangle (x2, y2);
  ```
- Coordinates are floating point values in TikZ units (where 1 unit = 40 scene pixels in default zoom).
- When omitted, the bounding box is computed from the bounding envelope of all nodes and control points.

### 2.2 Node Declarations
- **Syntax:**
  ```latex
  \node [style=<StyleName>] (<NodeId>) at (<X>, <Y>) {<Label>};
  ```
- `<NodeId>`: Alphanumeric identifier, typically a numeric string (`0`, `1`, `v0`).
- `<X>`, `<Y>`: Float values in TikZ units.
- `<StyleName>`: Style identifier declared in the associated `.tikzstyles` stylesheet.
- `<Label>`: Text or LaTeX math formula (e.g. `$\alpha + \beta$`, `$\pi/2$`).

### 2.3 Edge and Path Declarations
- **Syntax:**
  ```latex
  \draw [style=<EdgeStyle>, <RoutingOptions>] (<SrcId>) to (<TgtId>);
  ```
- **Routing Options:**
  - Straight: (no routing options specified)
  - Curved by Angles: `in=<angle>, out=<angle>` (angles in degrees: 0° to 360°)
  - Curved by Bend: `bend left=<degrees>` or `bend right=<degrees>`
  - Tension / Looseness: `looseness=<weight>` (default `1.0`)
- **Multi-Hop Paths:**
  ```latex
  \draw [style=wire] (0) to (1) to (2);
  ```

### 2.4 PGF Layer Environments
TikZiT partitions rendering into explicit PGF layers to guarantee depth ordering:
- `\begin{pgfonlayer}{nodelayer} ... \end{pgfonlayer}`
- `\begin{pgfonlayer}{edgelayer} ... \end{pgfonlayer}`
- Custom user layers are preserved in order when present in the AST.

---

## 3. Stylesheet Format (`.tikzstyles`)

Styles are parsed from and serialized to `.tikzstyles` files:
```latex
% Node styles
\tikzstyle{Z}=[fill=green, draw=black, shape=circle]
\tikzstyle{X}=[fill=red, draw=black, shape=circle]
\tikzstyle{H}=[fill=yellow, draw=black, shape=rectangle]

% Edge styles
\tikzstyle{wire}=[-, draw=black]
\tikzstyle{directed}=[->, draw=black]
\tikzstyle{dashed}=[-, dashed, draw=black]
```

TikZiT categories for organization are serialized as comments:
```latex
% tikzit category: ZX-Calculus
```

---

## 4. Unsupported Constructs & Diagnostic Policy

TikZiT is **not** an arbitrary LaTeX compiler. If a user pastes unsupported TeX code into the source editor, the system must **never silently drop data or crash**.

| Construct | Handling Policy | Diagnostic Feedback |
| :--- | :--- | :--- |
| Arbitrary TeX Macros (`\def`, `\newcommand`) | Retained in raw unparsed preamble | Warning: *"Custom TeX macros cannot be visualized on canvas."* |
| `\foreach` loops | Flattened if possible; otherwise preserved in raw buffer | Squiggly underline: *"TikZiT requires explicit node and edge declarations."* |
| Arbitrary TikZ paths (`--`, `cycle`, `circle`) | Preserved in unparsed AST block | Non-destructive warning: *"Arbitrary geometric paths rendered in read-only mode."* |
| Missing node identifiers | Auto-generated during repair (`n_auto_1`) | Informational notice |
| Missing semicolons `;` | Parser tolerance adds semicolon at statement boundary | Auto-fixed with warning |

---

## 5. Bidirectional Round-Trip Invariants

For any document $D$ in the supported subset:
$$\text{emit}(\text{parse}(D)) \sim_{\text{sem}} D$$

Where $\sim_{\text{sem}}$ denotes semantic equivalence:
1. Every node maintains identical ID, coordinate $(x,y)$, style, and label.
2. Every edge maintains identical endpoints, routing angles, bend angle, weight, and style.
3. Every bounding box retains its exact extents.
4. The output compiles cleanly under standard `pdflatex` with `pgf` packages.
