import { describe, it, expect } from 'vitest';
import { Context, Service } from 'cordis';
import {
  MCard,
  textPayload,
  Blake3Provider,
  AgentDid,
} from 'clm-kernel';

// Define a test Cordis Service
declare module 'cordis' {
  interface Context {
    testGraph: TestGraphService;
  }
}

class TestGraphService extends Service {
  public diagramCount = 0;

  constructor(ctx: Context) {
    super(ctx, 'testGraph');
  }

  public addDiagram() {
    this.diagramCount++;
  }
}

describe('Sprint 00 Spike: Cordis & clm-kernel Integration', () => {
  it('initializes Cordis context and registers reactive services', () => {
    const ctx = new Context();
    new TestGraphService(ctx);

    expect(ctx.testGraph).toBeDefined();
    expect(ctx.testGraph.diagramCount).toBe(0);

    ctx.testGraph.addDiagram();
    expect(ctx.testGraph.diagramCount).toBe(1);
  });

  it('creates immutable content-addressed MCards with BLAKE3 hashing', () => {
    const provider = new Blake3Provider();
    const tikzCode = '\\begin{tikzpicture}\\node (0) at (0,0) {};\\end{tikzpicture}';
    const hash = provider.hash(new TextEncoder().encode(tikzCode));

    expect(typeof hash).toBe('string');
    expect(hash.length).toBe(64);

    const authorDid = AgentDid.create('did:key:z6MkhaXgBZDvotDkL5257faiz48Z8x288nn64PeE2KYm9976');
    const card = MCard.create(
      'tikzit://diagram/test',
      textPayload(tikzCode),
      authorDid,
      0
    );

    expect(card.uri).toBe('tikzit://diagram/test');
    expect(card.sequence).toBe(0);
    expect(card.hash).toBeDefined();
    expect(card.hash.asHex().length).toBe(64);
    expect(card.hash.asPrefixed().startsWith('blake3:')).toBe(true);
  });

  it('supports event bus communication across decoupled listeners', () => {
    const ctx = new Context();
    let receivedPayload = '';

    ctx.on('tikzit:diagram-parsed' as any, (payload: string) => {
      receivedPayload = payload;
    });

    ctx.emit('tikzit:diagram-parsed' as any, '01_spider_fusion');
    expect(receivedPayload).toBe('01_spider_fusion');
  });
});
