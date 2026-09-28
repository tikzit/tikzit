import { readFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { describe, expect, it } from 'vitest';
import { safeParse } from '../../../src/core/parser/parser';
import type { CorpusManifestEntry } from '../../../src/services/clm/corpusExplorerService';

const docsRoot = new URL('../../../docs/examples/', import.meta.url);
const publicRoot = new URL('../../../public/docs/examples/', import.meta.url);
const expectedIds = [
  '01_spider_fusion', '02_identity_spiders', '03_yanking_cup_cap', '04_cup_cap_duality',
  '05_bialgebra_law', '06_hadamard_color_change', '07_cnot_gate', '08_cz_gate',
  '09_swap_gate', '10_teleportation', '11_ghz_state', '12_entanglement_swapping',
];
const expectedAstCounts: Record<string, [number, number]> = {
  '01_spider_fusion': [6, 6],
  '02_identity_spiders': [6, 3],
  '03_yanking_cup_cap': [6, 4],
  '04_cup_cap_duality': [6, 2],
  '05_bialgebra_law': [6, 5],
  '06_hadamard_color_change': [5, 4],
  '07_cnot_gate': [6, 5],
  '08_cz_gate': [7, 6],
  '09_swap_gate': [4, 2],
  '10_teleportation': [8, 9],
  '11_ghz_state': [4, 3],
  '12_entanglement_swapping': [6, 5],
};

async function readManifest(root: URL): Promise<CorpusManifestEntry[]> {
  return JSON.parse(await readFile(new URL('manifest.json', root), 'utf8')) as CorpusManifestEntry[];
}

describe('Canonical example corpus manifest', () => {
  it('keeps the generated public manifest identical and independent of benchmark fixture IDs', async () => {
    const canonical = await readFile(new URL('manifest.json', docsRoot), 'utf8');
    const published = await readFile(new URL('manifest.json', publicRoot), 'utf8');
    const entries = JSON.parse(canonical) as CorpusManifestEntry[];

    expect(published).toBe(canonical);
    expect(entries.map((entry) => entry.id)).toEqual(expectedIds);
    expect(new Set(entries.map((entry) => entry.id)).size).toBe(12);
    expect(new Set(entries.map((entry) => entry.tikz_file)).size).toBe(12);
    expect(new Set(entries.map((entry) => entry.title)).size).toBe(12);
    expect(entries.map((entry) => `zx:examples:${entry.id}`)).not.toContain('zx:02_bialgebra');
  });

  it('verifies every source byte count and checksum before parsing it', async () => {
    const entries = await readManifest(docsRoot);
    for (const entry of entries) {
      const bytes = await readFile(new URL(entry.tikz_file, publicRoot));
      expect(bytes.byteLength).toBe(entry.tikz_bytes);
      expect(createHash('sha256').update(bytes).digest('hex')).toBe(entry.tikz_sha256);
      const source = new TextDecoder('utf-8', { fatal: true }).decode(bytes);
      const parsed = safeParse(source);
      expect(parsed.success).toBe(true);
      expect(parsed.ast).not.toBeNull();
      expect([parsed.ast!.nodes.length, parsed.ast!.edges.length]).toEqual(expectedAstCounts[entry.id]);
    }
  });
});
