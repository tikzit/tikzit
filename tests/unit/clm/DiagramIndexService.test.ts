/**
 * tests/unit/clm/DiagramIndexService.test.ts - Sprint 23
 * Tests T23-01 to T23-06: DiagramIndexService index management, fuzzy search, and parsing cache.
 */
import { describe, it, expect } from 'vitest';
import { AgentDid, MCard, MCardCollection, textPayload } from 'clm-kernel';
import { DiagramIndexService, subsequenceDistance } from '../../../src/services/clm/DiagramIndexService';

describe('DiagramIndexService (Sprint 23: T23-01 to T23-06)', () => {
  const authorDid = AgentDid.create('did:key:z6MkhaXgBZDvotDkL5257faiz4zMrAZshGWDSPEd81AwtRnU');

  it('T23-01: initializes with empty index or restored records', () => {
    const emptyService = new DiagramIndexService();
    expect(emptyService.getIndex()).toEqual([]);

    const initial = [{ handle: 'zx:diagrams:1', hash: 'a'.repeat(64), committedAt: 1000, title: 'First' }];
    const service = new DiagramIndexService(initial);
    expect(service.getIndex()).toEqual(initial);

    const updated = [{ handle: 'zx:diagrams:2', hash: 'b'.repeat(64), committedAt: 2000, title: 'Second' }];
    service.restoreIndex(updated);
    expect(service.getIndex()).toEqual(updated);
  });

  it('T23-02: updates rows and upserts rows correctly', () => {
    const service = new DiagramIndexService([{ handle: 'zx:diagrams:1', hash: 'a'.repeat(64), committedAt: 1000 }]);
    const ok = service.updateRow('zx:diagrams:1', (r) => { r.title = 'Updated Title'; });
    expect(ok).toBe(true);
    expect(service.getIndex()[0].title).toBe('Updated Title');

    const missing = service.updateRow('zx:diagrams:999', (r) => { r.title = 'Nope'; });
    expect(missing).toBe(false);

    service.upsertRow({ handle: 'zx:diagrams:2', hash: 'c'.repeat(64), committedAt: 3000, title: 'New' });
    expect(service.getIndex()).toHaveLength(2);
  });

  it('T23-03: caches card AST and node/edge count by hash', () => {
    const service = new DiagramIndexService();
    const source = '\\begin{tikzpicture}\n\\node (a) at (0,0) {};\n\\node (b) at (1,1) {};\n\\draw (a) to (b);\n\\end{tikzpicture}';
    const hash = '1'.repeat(64);

    const parsed1 = service.parseCard(hash, source);
    expect(parsed1).not.toBeNull();
    expect(parsed1?.nodeCount).toBe(2);
    expect(parsed1?.edgeCount).toBe(1);

    // Call again to verify cache return
    const parsed2 = service.parseCard(hash, source);
    expect(parsed2).toBe(parsed1);

    // Invalid source returns null
    expect(service.parseCard('2'.repeat(64), 'not tikz code')).toBeNull();
  });

  it('T23-04: lists entries with sorting and metadata extraction', () => {
    const collection = new MCardCollection();
    const card1 = MCard.create('tikzit://diagram/1', textPayload('\\begin{tikzpicture}\\node (a) at (0,0) {};\\end{tikzpicture}'), authorDid, 0);
    const card2 = MCard.create('tikzit://diagram/2', textPayload('\\begin{tikzpicture}\\node (b) at (1,1) {};\\end{tikzpicture}'), authorDid, 0);
    collection.putWithHandle(card1, 'zx:diagrams:uuid1');
    collection.putWithHandle(card2, 'zx:diagrams:uuid2');

    const service = new DiagramIndexService([
      { handle: 'zx:diagrams:uuid1', hash: card1.hash.asHex(), committedAt: 100, title: 'Zebra' },
      { handle: 'zx:diagrams:uuid2', hash: card2.hash.asHex(), committedAt: 200, title: 'Alpha' },
    ]);

    const metaReader = {
      getDiagramMetadata: (handle: string) => ({ title: handle.endsWith('uuid1') ? 'Zebra' : 'Alpha' }),
    };

    const listing = service.listEntries(collection, [], metaReader);
    expect(listing.issues).toEqual([]);
    expect(listing.entries).toHaveLength(2);
    expect(listing.entries[0].title).toBe('Alpha');
    expect(listing.entries[1].title).toBe('Zebra');
  });

  it('T23-05: detects malformed index rows, missing cards, and invalid parse', () => {
    const collection = new MCardCollection();
    const service = new DiagramIndexService([
      { handle: 'not-a-diagram-handle', hash: 'bad', committedAt: 0 },
      { handle: 'zx:diagrams:missing', hash: 'f'.repeat(64), committedAt: 100 },
    ]);

    const listing = service.listEntries(collection, [], { getDiagramMetadata: () => null });
    expect(listing.issues).toHaveLength(2);
    expect(listing.issues[0].reason).toContain('Malformed corpus index row');
    expect(listing.issues[1].reason).toContain('Corpus index head is stale or missing');
  });

  it('T23-06: searches entries with exact, prefix, substring, and fuzzy matching', () => {
    const collection = new MCardCollection();
    const card = MCard.create('tikzit://diagram/1', textPayload('\\begin{tikzpicture}\\end{tikzpicture}'), authorDid, 0);
    collection.putWithHandle(card, 'zx:diagrams:spider-calc');

    const service = new DiagramIndexService([
      { handle: 'zx:diagrams:spider-calc', hash: card.hash.asHex(), committedAt: 100, title: 'Spider Calculus' },
    ]);

    const metaReader = { getDiagramMetadata: () => ({ title: 'Spider Calculus' }) };

    // Subsequence distance helper test
    expect(subsequenceDistance('spc', 'spider calculus')).not.toBeNull();
    expect(subsequenceDistance('xyz', 'spider calculus')).toBeNull();

    // Exact search
    expect(service.searchEntries(collection, [], metaReader, 'Spider Calculus')).toHaveLength(1);
    // Prefix search
    expect(service.searchEntries(collection, [], metaReader, 'Spider')).toHaveLength(1);
    // Subsequence fuzzy search
    expect(service.searchEntries(collection, [], metaReader, 'spcalc')).toHaveLength(1);
    // Empty search returns all
    expect(service.searchEntries(collection, [], metaReader, '')).toHaveLength(1);
    // Non-matching query
    expect(service.searchEntries(collection, [], metaReader, 'quantum')).toHaveLength(0);
  });
});
