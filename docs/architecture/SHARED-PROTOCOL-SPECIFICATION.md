# TikZiT Shared Dual-System Protocol Specification

**Status:** Canonical Reference Specification  
**Version:** 1.0.0  
**Scope:** Native C++ Qt6 Desktop & Web Spatial Workbench (Astro/TypeScript/Three.js)  
**Parent Sprint:** [Sprint 20](../sprints/_active/SPRINT-20-DUAL-SYSTEM-MAKEFILE-AND-SHARED-PROTOCOL.md)

---

## 1. Executive Summary & Purpose

This specification formally establishes the **Shared Dual-System Protocol** governing TikZ graph structures, coordinate transformations, geometric spline calculations, and sovereign MCard storage across TikZiT runtimes:
1. **The Native C++ Qt6 Desktop Application** (Bison/Flex parser, Qt Graphics Scene, SQLite backend).
2. **The Web Spatial Workbench** (TypeScript Parser Combinators, Three.js WebGL canvas, `sql.js` WASM backend).

Under the **Kenotic Principle of CLM** ($\text{Universality} \propto \frac{1}{\text{Assumptions}}$), this protocol defines zero ambient runtime state, modeling all operations strictly as **Pure Mathematical Functions** ($f: A \to B$) and **Petri Net Transitions** ($t: P_{\text{in}} \to P_{\text{out}}$).

---

## 2. Formal EBNF TikZ Subset Grammar

The shared grammar defines the subset of PGF/TikZ supported for bidirectional visual editing:

```ebnf
TikzPicture      ::= '\begin{tikzpicture}' ( OptionList )? StatementList '\end{tikzpicture}' ;
StatementList    ::= ( Statement )* ;
Statement        ::= NodeStatement | EdgeStatement | StyleStatement | CommentStatement ;

NodeStatement    ::= '\node' ( '[' NodeOptions ']' )? '(' Identifier ')' 'at' Coordinate '{' Label '}' ';' ;
EdgeStatement    ::= '\path' ( '[' PathOptions ']' )? PathSegmentList ';' ;
PathSegmentList  ::= PathSegment ( PathSegment )* ;
PathSegment      ::= '(' Identifier ')' ( 'edge' ( '[' EdgeOptions ']' )? )? '(' Identifier ')' ;

Coordinate       ::= '(' Number ',' Number ')' ;
Identifier       ::= [a-zA-Z0-9_\-]+ ;
Label            ::= '{' ( [^\{\}]* | '\{' | '\}' )* '}' ;

NodeOptions      ::= ( NodeOption ( ',' NodeOption )* )? ;
NodeOption       ::= 'style=' Identifier
                   | 'fill=' Color
                   | 'draw=' Color
                   | 'label=' ( Position ':' )? Label ;

EdgeOptions      ::= ( EdgeOption ( ',' EdgeOption )* )? ;
EdgeOption       ::= 'bend left' ( '=' Number )?
                   | 'bend right' ( '=' Number )?
                   | 'in=' Number
                   | 'out=' Number
                   | 'looseness=' Number
                   | 'style=' Identifier
                   | 'dashed' | 'dotted' | 'thick' ;

CommentStatement ::= '%' [^\n]* '\n' ;
```

---

## 3. Pure Functional Transformations & Coordinate Bijective Mapping

### 3.1 Bijective Coordinate Mapping ($f_{\text{geom}}$)

TikZ employs a standard mathematical Cartesian $Y$-up coordinate system in centimeters. WebGL (Three.js) world space aligns with standard 3D Cartesian coordinates ($X$ right, $Y$ up, $Z=0$ plane). Qt `QGraphicsScene` employs a display device coordinate system where $X$ increases to the right and $Y$ increases downwards.

The bijective coordinate transformation functions are defined as:

$$\begin{aligned}
f_{\text{TikZ}\to\text{ThreeJS}}(x, y) &= (x, y, 0) \\
f_{\text{ThreeJS}\to\text{TikZ}}(x, y, z) &= (x, y) \\
f_{\text{TikZ}\to\text{Qt}}(x, y) &= (k \cdot x, -k \cdot y) \quad \text{where } k = 100.0 \text{ (Qt scene units per TikZ unit)} \\
f_{\text{Qt}\to\text{TikZ}}(X, Y) &= \left(\frac{X}{k}, -\frac{Y}{k}\right)
\end{aligned}$$

**Invariance Constraint:**
$$\forall (x, y) \in [-100.0, 100.0]^2, \quad f_{\text{Qt}\to\text{TikZ}}\left(f_{\text{TikZ}\to\text{Qt}}(x, y)\right) = (x, y) \pm \epsilon \quad (\epsilon \le 10^{-7})$$

### 3.2 Teardrop Self-Loop Spline Math ($f_{\text{teardrop}}$)

A self-loop on node $u$ at position $(x_0, y_0)$ with default radius $R$ is defined deterministically by entry/exit angles:
- Exit angle: $\theta_{\text{out}} = 45^\circ = \frac{\pi}{4}$ rad
- Entry angle: $\theta_{\text{in}} = 135^\circ = \frac{3\pi}{4}$ rad
- Default looseness: $L = 1.0$

The cubic Bézier control points $\mathbf{P}_0, \mathbf{P}_1, \mathbf{P}_2, \mathbf{P}_3$ are computed as:
$$\begin{aligned}
\mathbf{P}_0 &= (x_0 + r \cos \theta_{\text{out}}, y_0 + r \sin \theta_{\text{out}}) \\
\mathbf{P}_1 &= \mathbf{P}_0 + L \cdot d \cdot (\cos \theta_{\text{out}}, \sin \theta_{\text{out}}) \\
\mathbf{P}_2 &= \mathbf{P}_3 + L \cdot d \cdot (\cos \theta_{\text{in}}, \sin \theta_{\text{in}}) \\
\mathbf{P}_3 &= (x_0 + r \cos \theta_{\text{in}}, y_0 + r \sin \theta_{\text{in}})
\end{aligned}$$
where $r$ is the node boundary radius and $d = \frac{4}{3} R$.

### 3.3 Junction Node Conventions

Junction nodes (wire splitters / routing dots) follow strict canonical styling:
- TikZ property: `style=none`
- Label: `{}` (empty)
- Web Visual Rendering:
  - Outer ring: Dashed circle `#B4B4DC`, line width 1px, radius 4px.
  - Center dot: Solid circle `#B4B4C8`, radius 1.5px.
- C++ Native Equivalent: Transparent node shape with a center coordinate anchor.

---

## 4. Canonical MCard SQLite Storage Protocol

Both native desktop and web environments interoperate using the canonical **Cubical Logic Model (CLM)** MCard SQLite database format (`mcard_schema.sql` v3.0.3):

```sql
-- Content-addressed immutable blocks
CREATE TABLE IF NOT EXISTS card (
    hash TEXT PRIMARY KEY,
    content BLOB NOT NULL,
    g_time TEXT NOT NULL
);

-- Mutable handle pointers to active heads
CREATE TABLE IF NOT EXISTS handle_registry (
    handle TEXT PRIMARY KEY,
    current_hash TEXT NOT NULL,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    FOREIGN KEY (current_hash) REFERENCES card(hash)
);

-- Immutable lineage trail of superseded heads
CREATE TABLE IF NOT EXISTS handle_history (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    handle TEXT NOT NULL,
    previous_hash TEXT NOT NULL,
    changed_at TEXT NOT NULL,
    FOREIGN KEY (handle) REFERENCES handle_registry(handle),
    FOREIGN KEY (previous_hash) REFERENCES card(hash)
);
```

### 4.1 Storage Invariants
1. **Content Addressing**: `hash` is calculated as $\text{SHA-256}(\text{content})$ (or $\text{BLAKE3}$) over the raw serialized payload.
2. **Superseded History**: `handle_history` records `previous_hash` when a handle is updated. The head is reconstructed from `handle_registry.current_hash`.
3. **Restoration Position Validity**: Rolling back $A \to B \to A$ appends a new head identical to $A$, preserving lineage without rewriting historical IDs.

---

## 5. Standardized `clm-kernel` Verdicts & Result Modes

To guarantee kenotic purity and eliminate untyped string exceptions, all protocol validations, parsers, and conformance assertions evaluate to typed result objects:

```typescript
// Success mode
export interface VCardResult<T = unknown> {
  witness: string;       // Cryptographic or topological witness string
  payload: T;
  timestamp: string;     // ISO-8601
}

// Failure mode (BailVerdict factory + discriminated union)
export interface BailVerdictRecord {
  verdict: 'bail';
  reason: string;
  invariantCode: 'PROTOCOL_MISMATCH' | 'SYNTAX_ERROR' | 'COORDINATE_DRIFT' | 'STALE_CONFLICT' | 'CANCELLED';
}
```

---

## 6. Verification Mandate & Conformance Testing

Compliance with this shared protocol is verified automatically through:
1. `tests/unit/protocol/sharedProtocol.test.ts` (16 unit tests for math, grammar, and schema contracts).
2. `make verify-corpus` (12/12 canonical ZX diagrams).
3. `scripts/verify-protocol-conformance.mjs` (cross-system AST isomorphism).
