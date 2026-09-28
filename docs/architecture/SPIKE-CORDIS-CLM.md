# Architectural Spike: Cordis Service Container & CLM Kernel Integration

**Status:** Complete  
**Date:** 2026-09-27  
**Author:** TikZiT Web Engineering  
**Packages:** `cordis@4.0.0-rc.10`, `clm-kernel@0.0.1`  

---

## 1. Architectural Role & Motivation

TikZiT's core functionality requires orchestrating multiple domain subsystems:
1. Graph AST model and mutations
2. TikZ Bison/Flex parser and string emitter
3. Stylesheet library (`.tikzstyles`)
4. Undo/redo transaction history
5. Content-addressed storage (MCard snapshots)
6. TeX preview and vector exporter pipelines

Rather than coupling these systems through direct object references or monolithic global singletons, TikZiT Web utilizes **Cordis** as a lightweight, reactive dependency-injection kernel and **clm-kernel** for Cubical Logic Model mathematical invariants and content-addressed storage.

---

## 2. Cordis Service Container Lifecycle

Cordis provides scoped contexts, automatic lifecycle binding, and typed event propagation.

### 2.1 Service Declaration & Registration Semantics
In Cordis 4.x, services inherit from `Service` and are registered via `super(ctx, name)`:

```typescript
import { Context, Service } from 'cordis';

declare module 'cordis' {
  interface Context {
    graph: GraphService;
    parser: ParserService;
    styles: StyleService;
  }
}

export class GraphService extends Service {
  constructor(ctx: Context) {
    // Calling super automatically attaches this instance to ctx.graph
    super(ctx, 'graph');
  }

  protected [Service.init]() {
    // Lifecycle hook: runs when service is initialized
  }

  protected [Service.dispose]() {
    // Lifecycle hook: runs when context or plugin is disposed
  }
}
```

> **CRITICAL GOTCHA IDENTIFIED IN SPIKE:**  
> Do **NOT** invoke `ctx.provide('graph')` prior to `new GraphService(ctx)`. In Cordis 4.x, calling `super(ctx, 'graph')` automatically registers and provides the service. Doing both throws an error: `"service graph has been registered"`.

### 2.2 Event Bus Dispatch & Subscriptions
Cordis provides an event emitter that decouples UI components from domain mutations:
```typescript
// Emitting a domain event
ctx.emit('tikzit:graph-updated', { nodeCount: 14, edgeCount: 16 });

// Subscribing in an Astro/React component
useEffect(() => {
  const dispose = ctx.on('tikzit:graph-updated', (event) => {
    updateVisualProjection(event);
  });
  return () => dispose();
}, []);
```

---

## 3. CLM Kernel Primitives & Content Addressing

`clm-kernel` implements the Cubical Logic Model specification for cryptographic traceability.

### 3.1 MCard (Resting States)
Diagram files (`.tikz`), stylesheets (`.tikzstyles`), and workspace layouts are preserved as immutable MCards.
- **URI:** Canonical identifier (`tikzit://diagram/{id}` or `mcard:workspace/layout`).
- **Hash:** BLAKE3 cryptographic hash computed over the serialized canonical payload.
- **Author:** Cryptographic decentralized identifier (DID) of the creator (`did:key:...`).
- **Sequence:** Monotonically increasing logical clock.

```typescript
import { MCard, textPayload } from 'clm-kernel';

const tikzCode = `\\begin{tikzpicture}
\\node [style=Z] (0) at (0, 0) {};
\\node [style=X] (1) at (2, 0) {};
\\draw (0) to (1);
\\end{tikzpicture}`;

const card = MCard.create(
  'tikzit://diagram/spider-fusion',
  textPayload(tikzCode),
  'did:key:z6MkhaXgBZDvotDkL5257faiz48Z8x288nn64PeE2KYm9976',
  0
);

console.log(card.hash.asPrefixed()); // blake3:7a4f...
console.log(card.hash.asHex());      // 64-character BLAKE3 hex digest
```

### 3.2 Hashing Provider Evaluation (BLAKE3 vs SHA-256)
Our test suite verified:
- `Blake3Provider` is pure JavaScript, synchronous, and operates seamlessly across both Node.js (test runner) and browser environments (WASM/JS) without requiring Web Crypto permissions.
- `Sha256Provider` requires Node.js `crypto` module in Node or asynchronous `crypto.subtle` in browsers.
- **Decision:** **BLAKE3** is the primary hashing standard for all TikZiT Web diagram artifacts and MCards.

### 3.3 Tri-Database Pillar Architecture
`clm-kernel` structures storage into three distinct pillars (`TriDatabaseManager`):
1. **`knowledge`**: Canonical PQP ZX stylesheets, grammar definitions, and style presets.
2. **`mcard`**: Live diagram documents, revision history, and workspace configurations.
3. **`execution_log`**: Verified execution receipts, parse diagnostics, and TeX compilation logs.

---

## 4. Verification & Testing

Unit tests for Cordis service initialization and `clm-kernel` MCard hashing are implemented in:
- `src/services/__tests__/clm-cordis.spec.ts` (100% passing in Vitest).
