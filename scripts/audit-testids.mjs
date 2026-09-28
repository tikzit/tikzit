#!/usr/bin/env node
/**
 * scripts/audit-testids.mjs - Sprint 22
 * Contract B E2E Selector Stability Audit Tool
 *
 * Scans `src/` for data-testid attributes (literals and template literals).
 * Emits and diffs `docs/testing/testid-baseline.json`.
 * Usage:
 *   node scripts/audit-testids.mjs          # Generates/updates baseline
 *   node scripts/audit-testids.mjs --check  # Fails if any baseline selector is missing
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '..');
const BASELINE_PATH = path.join(ROOT_DIR, 'docs/testing/testid-baseline.json');

const isCheckMode = process.argv.includes('--check');

function scanFiles(dir) {
  let files = [];
  if (!fs.existsSync(dir)) return files;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name !== 'node_modules' && entry.name !== '.git' && entry.name !== '__tests__') {
        files = files.concat(scanFiles(full));
      }
    } else if (/\.(tsx|jsx|ts|js|astro)$/.test(entry.name)) {
      files.push(full);
    }
  }
  return files;
}

const sourceFiles = scanFiles(path.join(ROOT_DIR, 'src'));

const literalSelectors = new Set();
const dynamicPrefixes = new Set();

const literalRegex = /data-testid=["']([^"']+)["']/g;
const templateRegex = /data-testid=\{`([^`$]+)\$\{/g;

for (const file of sourceFiles) {
  const content = fs.readFileSync(file, 'utf8');

  let match;
  while ((match = literalRegex.exec(content)) !== null) {
    literalSelectors.add(match[1]);
  }

  while ((match = templateRegex.exec(content)) !== null) {
    dynamicPrefixes.add(match[1]);
  }
}

const currentAudit = {
  version: '1.0.0',
  generatedAt: new Date().toISOString(),
  literalCount: literalSelectors.size,
  dynamicPrefixCount: dynamicPrefixes.size,
  literals: Array.from(literalSelectors).sort(),
  dynamicPrefixes: Array.from(dynamicPrefixes).sort(),
};

if (isCheckMode) {
  if (!fs.existsSync(BASELINE_PATH)) {
    console.error(`✗ [FAIL] Baseline not found at ${BASELINE_PATH}. Run without --check first.`);
    process.exit(1);
  }

  const baseline = JSON.parse(fs.readFileSync(BASELINE_PATH, 'utf8'));
  const missingLiterals = baseline.literals.filter((sel) => !literalSelectors.has(sel));
  const missingPrefixes = baseline.dynamicPrefixes.filter((pfx) => !dynamicPrefixes.has(pfx));

  if (missingLiterals.length > 0 || missingPrefixes.length > 0) {
    console.error('✗ [FAIL] Contract B Selector Violations Detected!');
    if (missingLiterals.length > 0) {
      console.error('  Missing literal selectors:\n   ', missingLiterals.join('\n    '));
    }
    if (missingPrefixes.length > 0) {
      console.error('  Missing dynamic prefixes:\n   ', missingPrefixes.join('\n    '));
    }
    process.exit(1);
  }

  console.log(`✓ [PASS] Contract B verified: all ${baseline.literals.length} selectors and ${baseline.dynamicPrefixes.length} dynamic prefixes intact.`);
  process.exit(0);
}

// Generate or update baseline
fs.mkdirSync(path.dirname(BASELINE_PATH), { recursive: true });
fs.writeFileSync(BASELINE_PATH, JSON.stringify(currentAudit, null, 2) + '\n', 'utf8');
console.log(`✓ Locked ${currentAudit.literalCount} literal selectors and ${currentAudit.dynamicPrefixCount} dynamic prefixes into ${path.relative(ROOT_DIR, BASELINE_PATH)}`);
