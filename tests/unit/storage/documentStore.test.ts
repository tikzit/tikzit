import { describe, it, expect, beforeEach } from 'vitest';
import { DocumentStore, computeContentHash } from '../../../src/services/storage/DocumentStore';

describe('DocumentStore', () => {
  let store: DocumentStore;

  beforeEach(() => {
    store = new DocumentStore();
  });

  it('computes content hashes deterministically', async () => {
    const content = '\\begin{tikzpicture}\\node (a) {};\\end{tikzpicture}';
    const hash1 = await computeContentHash(content);
    const hash2 = await computeContentHash(content);
    expect(hash1).toBe(hash2);
    expect(hash1.length).toBeGreaterThan(4);
  });

  it('saves, loads, and manages document revisions', async () => {
    const doc = await store.saveDocument({
      id: 'test-doc-1',
      title: 'My Graph',
      content: '\\begin{tikzpicture}\\node (a) {};\\end{tikzpicture}',
    });

    expect(doc.id).toBe('test-doc-1');
    expect(doc.version).toBe(1);

    const loaded = await store.loadDocument('test-doc-1');
    expect(loaded?.title).toBe('My Graph');

    // Update document
    const updated = await store.saveDocument({
      id: 'test-doc-1',
      content: '\\begin{tikzpicture}\\node (a) {};\\node (b) {};\\end{tikzpicture}',
      message: 'Added node b',
    });
    expect(updated.version).toBe(2);

    // Revisions
    const revs = await store.getRevisions('test-doc-1');
    expect(revs.length).toBeGreaterThanOrEqual(1);
    expect(revs[0].message).toBe('Added node b');
  });
});
