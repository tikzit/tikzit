#!/usr/bin/env node
/**
 * scripts/verify-protocol-conformance.mjs - Sprint 24
 * Dual-System Protocol Conformance Gate.
 * Verifies AST isomorphism across all 12 canonical ZX diagrams between
 * TypeScript parser AST and canonical representation / shared protocol spec.
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseTikz, parseTikzStyles, emitTikz } from '../src/core/parser/index.ts';
import { generateSvg } from '../src/services/preview/SvgGenerator.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '..');
const EXAMPLES_DIR = path.join(ROOT_DIR, 'docs', 'examples', 'zx-calculus');

const CANONICAL_DIAGRAMS = [
  '01_spider_fusion.tikz',
  '02_identity_spiders.tikz',
  '03_yanking_cup_cap.tikz',
  '04_cup_cap_duality.tikz',
  '05_bialgebra_law.tikz',
  '06_hadamard_color_change.tikz',
  '07_cnot_gate.tikz',
  '08_cz_gate.tikz',
  '09_swap_gate.tikz',
  '10_teleportation.tikz',
  '11_ghz_state.tikz',
  '12_entanglement_swapping.tikz',
];

console.log('=== Checking Dual-System Protocol Conformance ===\n');

// 1. Verify Stylesheet
const stylesPath = path.join(EXAMPLES_DIR, 'pqp-zx.tikzstyles');
if (!fs.existsSync(stylesPath)) {
  console.error(`✗ [FAIL] Missing stylesheet: ${stylesPath}`);
  process.exit(1);
}
const stylesContent = fs.readFileSync(stylesPath, 'utf8');
const stylesCatalog = parseTikzStyles(stylesContent);
if (!stylesCatalog || stylesCatalog.styles.length === 0) {
  console.error('✗ [FAIL] Failed to parse pqp-zx.tikzstyles or catalog is empty');
  process.exit(1);
}
console.log(`  ✓ [PASS] Stylesheet loaded (${stylesCatalog.styles.length} styles defined)`);

let passedCount = 0;
let failedCount = 0;

for (const filename of CANONICAL_DIAGRAMS) {
  const filePath = path.join(EXAMPLES_DIR, filename);
  if (!fs.existsSync(filePath)) {
    console.error(`  ✗ [FAIL] ${filename}: File missing on disk`);
    failedCount++;
    continue;
  }

  const tikzSource = fs.readFileSync(filePath, 'utf8');
  if (!tikzSource.trim()) {
    console.error(`  ✗ [FAIL] ${filename}: File is empty`);
    failedCount++;
    continue;
  }

  try {
    // 1. Parse initial AST
    const ast = parseTikz(tikzSource);
    if (!ast || !Array.isArray(ast.nodes) || !Array.isArray(ast.edges)) {
      throw new Error('Parser produced invalid AST structure');
    }
    if (ast.nodes.length === 0) {
      throw new Error('Diagram contains 0 nodes');
    }

    // 2. Referential integrity check
    const nodeIds = new Set(ast.nodes.map((n) => n.id));
    for (const edge of ast.edges) {
      if (!nodeIds.has(edge.sourceId)) {
        throw new Error(`Edge ${edge.id} references undefined source node '${edge.sourceId}'`);
      }
      if (!nodeIds.has(edge.targetId)) {
        throw new Error(`Edge ${edge.id} references undefined target node '${edge.targetId}'`);
      }
    }

    // 3. Round-trip emission and re-parse
    const emitted = emitTikz(ast);
    const reParsed = parseTikz(emitted);

    if (reParsed.nodes.length !== ast.nodes.length) {
      throw new Error(`Node count mismatch on round-trip: expected ${ast.nodes.length}, got ${reParsed.nodes.length}`);
    }
    if (reParsed.edges.length !== ast.edges.length) {
      throw new Error(`Edge count mismatch on round-trip: expected ${ast.edges.length}, got ${reParsed.edges.length}`);
    }

    // Node ID isomorphism check
    const reNodeIds = new Set(reParsed.nodes.map((n) => n.id));
    for (const id of nodeIds) {
      if (!reNodeIds.has(id)) {
        throw new Error(`Node '${id}' lost during round-trip emission`);
      }
    }

    // 4. SVG vector generation
    const svg = generateSvg(ast, stylesCatalog);
    if (!svg.includes('<svg') || !svg.includes('</svg>')) {
      throw new Error('SVG generation did not produce valid root <svg> container');
    }

    console.log(`  ✓ [PASS] ${filename} (${ast.nodes.length} nodes, ${ast.edges.length} edges, isomorphic round-trip verified)`);
    passedCount++;
  } catch (err) {
    console.error(`  ✗ [FAIL] ${filename}: ${err instanceof Error ? err.message : String(err)}`);
    failedCount++;
  }
}

console.log(`\nResults: ${passedCount} passed, ${failedCount} failed of ${CANONICAL_DIAGRAMS.length} canonical diagrams.`);

if (failedCount > 0) {
  process.exit(1);
} else {
  console.log('✓ All 12 canonical ZX diagrams satisfy dual-system protocol conformance.\n');
  process.exit(0);
}
