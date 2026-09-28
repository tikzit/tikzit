import { describe, it, expect } from 'vitest';
import {
  TriDatabaseManager,
  AgentDid,
} from 'clm-kernel';
import {
  registerTikzTriad,
  SPEC_A_URI,
  IMPL_C_URI,
  FIXTURES_B_URI,
  TRIAD_INDEX_URI,
  PQP_BENCHMARK_FIXTURES,
} from '../../../src/services/clm/triadDefinition';

describe('CLM Triad Categorical Invariants & Code Hash Binding (Sprint 02B)', () => {
  const authorDid = AgentDid.create('did:key:z6MkhaXgBZDvotDkL5257faiz48Z8x288nn64PeE2KYm9976');

  it('populates knowledge pillar with distinct A, B, and C dimension MCards', () => {
    const triDb = TriDatabaseManager.newInMemory();
    const result = registerTikzTriad(triDb, authorDid);

    // 1. Verify existence of dimension cards in knowledge pillar
    const cardA = triDb.knowledge.get(SPEC_A_URI);
    const cardB = triDb.knowledge.get(FIXTURES_B_URI);
    const cardC = triDb.knowledge.get(IMPL_C_URI);
    const triad = triDb.knowledge.get(TRIAD_INDEX_URI);

    expect(cardA).toBeDefined();
    expect(cardB).toBeDefined();
    expect(cardC).toBeDefined();
    expect(triad).toBeDefined();

    // 2. Verify all dimension hashes are distinct
    const hashes = new Set([
      cardA!.hash.asHex(),
      cardB!.hash.asHex(),
      cardC!.hash.asHex(),
      triad!.hash.asHex(),
    ]);
    expect(hashes.size).toBe(4);
  });

  it('binds DynamicPCard.codeHash strictly to cardC hash (rejects fallback "0")', () => {
    const triDb = TriDatabaseManager.newInMemory();
    const { cardC, dynamicPCard } = registerTikzTriad(triDb, authorDid);

    // 1. Rejects "0" fallback
    expect(dynamicPCard.codeHash.toString()).not.toBe('0');
    expect(dynamicPCard.codeHash.asHex().length).toBe(64);

    // 2. Strictly equals cardC hash
    expect(dynamicPCard.codeHash.asHex()).toBe(cardC.hash.asHex());
    expect(dynamicPCard.codeHash.equals(cardC.hash)).toBe(true);

    // 3. Coeffects and signature matching
    expect(dynamicPCard.coeffects.requiredServices).toEqual(['graph', 'command']);
    expect(dynamicPCard.sourceUri).toBe(IMPL_C_URI);
  });

  it('indexes verified A/B/C hashes inside the Triad Index Manifest', () => {
    const triDb = TriDatabaseManager.newInMemory();
    const { cardA, cardB, cardC, triadCard } = registerTikzTriad(triDb, authorDid);

    expect(triadCard.payload.kind).toBe('structured');
    const manifest = (triadCard.payload as any).value;

    expect(manifest.meta.a_uri).toBe(SPEC_A_URI);
    expect(manifest.meta.a_hash).toBe(cardA.hash.asHex());

    expect(manifest.meta.b_uri).toBe(FIXTURES_B_URI);
    expect(manifest.meta.b_hash).toBe(cardB.hash.asHex());

    expect(manifest.meta.c_uri).toBe(IMPL_C_URI);
    expect(manifest.meta.c_hash).toBe(cardC.hash.asHex());

    expect(manifest.meta.pcard_id).toBe('pcard:diagram-parser:v1');
  });

  it('Dimension B contains all 12 canonical PQP benchmark fixtures', () => {
    const triDb = TriDatabaseManager.newInMemory();
    const { cardB } = registerTikzTriad(triDb, authorDid);

    expect(cardB.payload.kind).toBe('structured');
    const fixtures = (cardB.payload as any).value.fixtures;

    expect(Array.isArray(fixtures)).toBe(true);
    expect(fixtures.length).toBe(12);
    expect(fixtures).toEqual(PQP_BENCHMARK_FIXTURES);

    // Verify first fixture is spider fusion
    expect(fixtures[0].id).toBe('zx:01_spider_fusion');
    expect(fixtures[0].title).toBe('Spider Fusion Law');
  });
});
