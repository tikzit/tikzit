import {
  MCard,
  ContentHash,
  DynamicPCard,
  structuredPayload,
  AgentDid,
  TriDatabaseManager,
} from 'clm-kernel';

export interface DiagramValidationSpec {
  coordinateSnapping: number;
  enforceBalancedTikzPicture: boolean;
  allowChainedDrawPaths: boolean;
  nodeUniqueNames: boolean;
  maxDimension: number;
}

export interface ParserImplementationSpec {
  name: string;
  version: string;
  runtime: string;
  coeffects: string[];
  sourceHash: string;
}

export interface BenchmarkFixtureEntry {
  id: string;
  title: string;
  expectedNodes: number;
  expectedEdges: number;
}

export interface TriadRegistrationResult {
  cardA: MCard;
  cardB: MCard;
  cardC: MCard;
  triadCard: MCard;
  dynamicPCard: DynamicPCard;
}

export const SPEC_A_URI = 'tikzit://spec/diagram-validation/v1';
export const IMPL_C_URI = 'tikzit://impl/typescript-parser/v1';
export const FIXTURES_B_URI = 'tikzit://fixtures/pqp-corpus-benchmarks/v1';
export const TRIAD_INDEX_URI = 'tikzit://triad/diagram-pipeline/v1';

export const PQP_BENCHMARK_FIXTURES: BenchmarkFixtureEntry[] = [
  { id: 'zx:01_spider_fusion', title: 'Spider Fusion Law', expectedNodes: 2, expectedEdges: 1 },
  { id: 'zx:02_bialgebra', title: 'Bialgebra Commutation', expectedNodes: 4, expectedEdges: 4 },
  { id: 'zx:03_hopf_law', title: 'Hopf Law Invariance', expectedNodes: 2, expectedEdges: 2 },
  { id: 'zx:04_hadamard_color_change', title: 'Hadamard Color Change', expectedNodes: 3, expectedEdges: 2 },
  { id: 'zx:05_cnot_gate', title: 'CNOT Interaction', expectedNodes: 4, expectedEdges: 4 },
  { id: 'zx:06_cup_cap_adjoint', title: 'Cup/Cap Adjoint Identity', expectedNodes: 2, expectedEdges: 1 },
  { id: 'zx:07_green_spider_pi', title: 'Green Spider Pi Phase', expectedNodes: 1, expectedEdges: 2 },
  { id: 'zx:08_red_spider_copy', title: 'Red Spider Copy Law', expectedNodes: 3, expectedEdges: 2 },
  { id: 'zx:09_quantum_teleportation', title: 'Quantum Teleportation Protocol', expectedNodes: 6, expectedEdges: 5 },
  { id: 'zx:10_ghz_w_state', title: 'GHZ and W Tripartite Entanglement', expectedNodes: 5, expectedEdges: 4 },
  { id: 'zx:11_clifford_simplification', title: 'Clifford Normalization', expectedNodes: 4, expectedEdges: 3 },
  { id: 'zx:12_measurement_identity', title: 'Demolition Measurement Identity', expectedNodes: 2, expectedEdges: 1 },
];

/**
 * Registers the canonical A/B/C Cubical Logic Model Triad in the knowledge pillar.
 * Rejects "0" fallback hashes and guarantees that DynamicPCard.codeHash matches card C.
 */
export function registerTikzTriad(
  triDb: TriDatabaseManager,
  authorDid: AgentDid
): TriadRegistrationResult {
  // Dimension A: Abstract Specification
  const specA: DiagramValidationSpec = Object.freeze({
    coordinateSnapping: 0.25,
    enforceBalancedTikzPicture: true,
    allowChainedDrawPaths: true,
    nodeUniqueNames: true,
    maxDimension: 100,
  });

  const cardA = MCard.create(
    SPEC_A_URI,
    structuredPayload(specA),
    authorDid,
    0
  );
  triDb.knowledge.putCard(cardA);

  // Dimension C: Concrete Parser Implementation
  // Canonical signature of the TypeScript AST parser implementation
  const parserImplementationSignature = 'TikzParserService::v1.0.0::coeffects:[graph,command]::ast-builder';
  const cSourceHash = ContentHash.computeString(parserImplementationSignature);

  if (!cSourceHash || cSourceHash.asHex() === '0' || cSourceHash.asHex().length < 64) {
    throw new Error('Triad verification failed: concrete implementation hash cannot be "0" or invalid.');
  }

  const implC: ParserImplementationSpec = Object.freeze({
    name: 'TikzParserService',
    version: '1.0.0',
    runtime: 'ts-runtime',
    coeffects: ['graph', 'command'],
    sourceHash: cSourceHash.asHex(),
  });

  const cardC = MCard.create(
    IMPL_C_URI,
    structuredPayload(implC),
    authorDid,
    0
  );
  triDb.knowledge.putCard(cardC);

  // DynamicPCard bound strictly to cardC.hash
  const dynamicPCard = new DynamicPCard({
    id: 'pcard:diagram-parser:v1',
    codeHash: cardC.hash,
    sourceUri: IMPL_C_URI,
    coeffects: { requiredServices: ['graph', 'command'] },
    signature: '(tikzText: string) => SafeParseResult',
  });

  if (dynamicPCard.codeHash.toString() === '0' || !dynamicPCard.codeHash.equals(cardC.hash)) {
    throw new Error('DynamicPCard codeHash integrity failure: does not match implementation card hash.');
  }

  // Dimension B: Balanced Expectations (Benchmark Fixtures)
  const cardB = MCard.create(
    FIXTURES_B_URI,
    structuredPayload({ fixtures: PQP_BENCHMARK_FIXTURES }),
    authorDid,
    0
  );
  triDb.knowledge.putCard(cardB);

  // Triad Index Manifest MCard
  const triadManifest = Object.freeze({
    triad_id: 'triad:diagram-pipeline:v1',
    name: 'TikZiT Diagram Parser & Validation Triad',
    meta: {
      a_uri: SPEC_A_URI,
      a_hash: cardA.hash.asHex(),
      b_uri: FIXTURES_B_URI,
      b_hash: cardB.hash.asHex(),
      c_uri: IMPL_C_URI,
      c_hash: cardC.hash.asHex(),
      pcard_id: dynamicPCard.id,
    },
  });

  const triadCard = MCard.create(
    TRIAD_INDEX_URI,
    structuredPayload(triadManifest),
    authorDid,
    0
  );
  triDb.knowledge.putCard(triadCard);

  return {
    cardA,
    cardB,
    cardC,
    triadCard,
    dynamicPCard,
  };
}
