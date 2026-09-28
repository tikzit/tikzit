/**
 * tests/unit/clm/LineageTraversalEngine.test.ts - Sprint 23
 * Tests T23-13 to T23-18: Lineage traversal, history closure assertion, card verification, and summaries.
 */
import { describe, it, expect, vi } from 'vitest';
import { AgentDid, ContentHash, MCard, MCardCollection, textPayload, TriDatabaseManager } from 'clm-kernel';
import { LineageTraversalEngine, verifyCard } from '../../../src/services/clm/LineageTraversalEngine';

describe('LineageTraversalEngine (Sprint 23: T23-13 to T23-18)', () => {
  const authorDid = AgentDid.create('did:key:z6MkhaXgBZDvotDkL5257faiz4zMrAZshGWDSPEd81AwtRnU');

  function setupEngine(options?: {
    cardsWithHandles?: Array<{ card: MCard; handle: string }>;
    orphanCards?: MCard[];
    historyRows?: Array<{ handle: string; previous_hash: string; changed_at?: string }>;
    index?: Array<{ handle: string; hash: string; committedAt: number }>;
  }) {
    const collection = new MCardCollection();
    const triDb = TriDatabaseManager.newInMemory();

    for (const item of options?.cardsWithHandles ?? []) {
      collection.putWithHandle(item.card, item.handle);
    }
    for (const card of options?.orphanCards ?? []) {
      collection.put(card);
    }

    const index = options?.index ?? [];
    const historyRows = options?.historyRows ?? [];

    const engine = new LineageTraversalEngine(
      collection,
      triDb,
      () => index,
      () => historyRows,
    );

    return { collection, triDb, engine };
  }

  it('T23-13: computes summary with diagram counts, versions, and total reachable cards', async () => {
    const card = MCard.create('tikzit://diagram/1', textPayload('\\begin{tikzpicture}\\end{tikzpicture}'), authorDid, 0);
    const { engine } = setupEngine({
      cardsWithHandles: [{ card, handle: 'zx:diagrams:d1' }],
      index: [{ handle: 'zx:diagrams:d1', hash: card.hash.asHex(), committedAt: 1000 }],
    });

    const summary = await engine.computeSummary();
    expect(summary.diagramsCount).toBe(1);
    expect(summary.archivedCount).toBe(0);
    expect(summary.totalCardsCount).toBe(1);
    expect(summary.orphanCardsCount).toBe(0);
    expect(summary.defaultFilename).toMatch(/^tikzit-diagrams-\d{8}\.db$/);
  });

  it('T23-14: calculates orphan cards excluding unreferenced cards', async () => {
    const reachableCard = MCard.create('tikzit://diagram/reachable', textPayload('\\begin{tikzpicture}\\end{tikzpicture}'), authorDid, 0);
    const orphanCard = MCard.create('tikzit://diagram/orphan', textPayload('orphan text'), authorDid, 0);

    const { engine } = setupEngine({
      cardsWithHandles: [{ card: reachableCard, handle: 'zx:diagrams:d1' }],
      orphanCards: [orphanCard],
      index: [{ handle: 'zx:diagrams:d1', hash: reachableCard.hash.asHex(), committedAt: 1000 }],
    });

    const summary = await engine.computeSummary();
    expect(summary.totalCardsCount).toBe(1);
    expect(summary.orphanCardsCount).toBe(1);
  });

  it('T23-15: throws when duplicate handles exist in index', () => {
    const card = MCard.create('tikzit://diagram/1', textPayload('\\begin{tikzpicture}\\end{tikzpicture}'), authorDid, 0);
    const { engine } = setupEngine({
      cardsWithHandles: [{ card, handle: 'zx:diagrams:dup' }],
      index: [
        { handle: 'zx:diagrams:dup', hash: card.hash.asHex(), committedAt: 1000 },
        { handle: 'zx:diagrams:dup', hash: card.hash.asHex(), committedAt: 2000 },
      ],
    });

    expect(() => engine.traverseVerifiedLineage()).toThrow(/Duplicate corpus handle index row/);
  });

  it('T23-16: throws when history chain does not end at HEAD', () => {
    const cardA = MCard.create('tikzit://diagram/a', textPayload('a'), authorDid, 0);
    const cardB = MCard.create('tikzit://diagram/b', textPayload('b'), authorDid, 0);

    const { collection, engine } = setupEngine({
      cardsWithHandles: [{ card: cardA, handle: 'zx:diagrams:d1' }, { card: cardB, handle: 'zx:diagrams:d2' }],
      index: [{ handle: 'zx:diagrams:d1', hash: cardA.hash.asHex(), committedAt: 1000 }],
    });

    // Artificially corrupt history chain
    vi.spyOn(collection, 'history').mockReturnValue([cardB.hash]);

    expect(() => engine.traverseVerifiedLineage()).toThrow(/History chain does not end at HEAD/);
  });

  it('T23-17: asserts history previous_hash closure set equality', () => {
    const cardA = MCard.create('tikzit://diagram/a', textPayload('a'), authorDid, 0);
    const cardB = MCard.create('tikzit://diagram/b', textPayload('b'), authorDid, 0);

    const { collection, engine } = setupEngine({
      cardsWithHandles: [{ card: cardB, handle: 'zx:diagrams:d1' }],
      orphanCards: [cardA],
      index: [{ handle: 'zx:diagrams:d1', hash: cardB.hash.asHex(), committedAt: 2000 }],
      // Missing genuine history record for cardA -> cardB transition
      historyRows: [],
    });

    vi.spyOn(collection, 'history').mockReturnValue([cardA.hash, cardB.hash]);

    expect(() => engine.traverseVerifiedLineage()).toThrow(/Missing genuine history rows/);
  });

  it('T23-18: verifies card content hash matching payload', () => {
    const validCard = MCard.create('tikzit://diagram/valid', textPayload('valid content'), authorDid, 0);
    expect(() => verifyCard(validCard, 'zx:diagrams:valid')).not.toThrow();

    // Corrupted card
    const corruptCard = {
      ...validCard,
      hash: ContentHash.parse('0'.repeat(64)),
    } as unknown as MCard;
    expect(() => verifyCard(corruptCard, 'zx:diagrams:corrupt')).toThrow(/Card payload does not match hash/);
  });
});
