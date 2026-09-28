import { createHash } from 'node:crypto';
import { AgentDid, MCard, structuredPayload, textPayload } from 'clm-kernel';
import { describe, expect, it, vi } from 'vitest';
import { createWorkbenchRuntime } from '../../../src/services/createWorkbenchRuntime';
import { formatContentId, type CorpusManifestEntry } from '../../../src/services/clm/corpusExplorerService';
import { defaultWorkspaceManager } from '../../../src/services/workspace/WorkspaceManager';

const source = '\\begin{tikzpicture}\n\\node [style=none] (a) at (0, 0) {A};\n\\end{tikzpicture}\n';
const digest = (text: string) => createHash('sha256').update(text).digest('hex');
const manifest: CorpusManifestEntry[] = [
  {
    id: '05_bialgebra_law',
    title: 'The Bialgebra Interaction Law',
    tikz_file: 'zx-calculus/05_bialgebra_law.tikz',
    tikz_bytes: Buffer.byteLength(source),
    tikz_sha256: digest(source),
  },
  {
    id: 'sample_spider',
    title: 'Spider Fusion',
    tikz_file: 'zx-calculus/sample_spider.tikz',
    tikz_bytes: Buffer.byteLength(source),
    tikz_sha256: digest(source),
  },
];

function setup(fetcher: (url: string) => Promise<Response> = vi.fn(async () => new Response(source))) {
  const runtime = createWorkbenchRuntime({ bindKeybindings: false });
  const flush = vi.fn(async () => undefined);
  const service = runtime.corpusExplorer;
  service.configure({ manifest, fetcher, persistence: { flush }, initialIndex: [] });
  return { runtime, service, fetcher, flush };
}

describe('CorpusExplorerService', () => {
  it('formats raw and prefixed hashes and uses an empty placeholder value', () => {
    expect(formatContentId('')).toBe('');
    expect(formatContentId('a'.repeat(64))).toBe(`blake3:${'a'.repeat(64)}`);
    expect(formatContentId(`blake3:${'b'.repeat(64)}`)).toBe(`blake3:${'b'.repeat(64)}`);
    expect(() => formatContentId('bad-hash')).toThrow();
  });

  it('seeds manifest assets under stable example handles and reseeds without duplicate commits', async () => {
    const { runtime, service, fetcher } = setup();
    const first = await service.seedZxCorpus();
    const receiptCount = runtime.triDb.executionLog.list().length;
    const hashes = service.listCorpusEntries().entries.map((entry) => entry.hash);
    const second = await service.seedZxCorpus();

    expect(first.committed).toBe(2);
    expect(runtime.stores.$documentHead.get().hash).toBe('');
    expect(runtime.stores.$graphAST.get().nodes).toHaveLength(0);
    expect(second.committed).toBe(0);
    expect(second.failed).toBe(0);
    expect(service.listCorpusEntries().entries.map((entry) => entry.handle)).toEqual([
      'zx:examples:sample_spider',
      'zx:examples:05_bialgebra_law',
    ]);
    expect(service.listCorpusEntries().entries.map((entry) => entry.hash)).toEqual(hashes);
    expect(runtime.triDb.executionLog.list().length).toBe(receiptCount);
    expect(fetcher).toHaveBeenCalledTimes(2);
    runtime.dispose();
  });

  it('validates every asset before writes, reports failures, and retries only missing handles', async () => {
    let failBialgebra = true;
    const fetcher = vi.fn(async (url: string) => {
      if (failBialgebra && url.includes('05_bialgebra_law')) return new Response('not found', { status: 404 });
      return new Response(source);
    });
    const { runtime, service } = setup(fetcher);

    const partial = await service.seedZxCorpus();
    expect(partial.committed).toBe(1);
    expect(partial.failed).toBe(1);
    expect(service.listCorpusEntries().entries).toHaveLength(1);
    expect(partial.complete).toBe(false);

    failBialgebra = false;
    const retry = await service.seedZxCorpus();
    expect(retry.committed).toBe(1);
    expect(retry.failed).toBe(0);
    expect(retry.complete).toBe(true);
    expect(runtime.triDb.executionLog.list().length).toBe(2);
    runtime.dispose();
  });

  it('allows committing a syntactically valid empty seeded asset (Sprint 16 D1)', async () => {
    const empty = '\\begin{tikzpicture}\n\\end{tikzpicture}\n';
    const bailManifest: CorpusManifestEntry[] = [
      {
        id: 'empty_diagram',
        title: 'Empty Diagram',
        tikz_file: 'zx-calculus/empty_diagram.tikz',
        tikz_bytes: Buffer.byteLength(empty),
        tikz_sha256: digest(empty),
      },
      ...manifest.slice(1),
    ];
    const runtime = createWorkbenchRuntime({ bindKeybindings: false });
    const service = runtime.corpusExplorer;
    service.configure({
      manifest: bailManifest,
      fetcher: async (url: string) => new Response(url.includes('empty_diagram') ? empty : source),
      persistence: { flush: vi.fn(async () => undefined) },
      initialIndex: [],
    });

    const result = await service.seedZxCorpus();

    expect(result.committed).toBe(2);
    expect(result.failed).toBe(0);
    expect(result.complete).toBe(true);
    expect(runtime.mcardCollection.resolveHandle('zx:examples:empty_diagram')).toBeDefined();
    runtime.dispose();
  });

  it('rejects a checksum mismatch before committing any card', async () => {
    const broken = manifest.map((entry) => ({ ...entry, tikz_sha256: '0'.repeat(64) }));
    const runtime = createWorkbenchRuntime({ bindKeybindings: false });
    const service = runtime.corpusExplorer;
    service.configure({
      manifest: broken,
      fetcher: async () => new Response(source),
      persistence: { flush: vi.fn(async () => undefined) },
      initialIndex: [],
    });

    const result = await service.seedZxCorpus();
    expect(result.committed).toBe(0);
    expect(result.failed).toBe(2);
    expect(runtime.mcardCollection.count()).toBe(0);
    runtime.dispose();
  });

  it('ranks exact and prefix matches before substring and fuzzy results deterministically', async () => {
    const { runtime, service } = setup();
    await service.seedZxCorpus();

    expect(service.searchCorpus('  BIALGEBRA ').map((entry) => entry.handle)).toEqual([
      'zx:examples:05_bialgebra_law',
    ]);
    expect(service.searchCorpus('spider')[0].handle).toBe('zx:examples:sample_spider');
    expect(service.searchCorpus('spidr')[0].handle).toBe('zx:examples:sample_spider');
    expect(service.searchCorpus('no-such-entry')).toEqual([]);
    runtime.dispose();
  });

  it('no-ops unchanged saves, gates changed saves, and flushes pass and bail receipts', async () => {
    const { runtime, service, flush } = setup();
    await service.seedZxCorpus();
    const handle = 'zx:examples:05_bialgebra_law';
    const original = service.openEntry(handle);
    const receiptCount = runtime.triDb.executionLog.list().length;

    const unchanged = await service.commitCorpusDocument({ handle, sourceText: original.source });
    expect(unchanged.unchanged).toBe(true);
    expect(runtime.triDb.executionLog.list()).toHaveLength(receiptCount);

    const changed = await service.commitCorpusDocument({ handle, sourceText: `${original.source}% edited\n` });
    expect(changed.success).toBe(true);
    expect(changed.persisted).toBe(true);
    const changedHash = service.listCorpusEntries().entries.find((entry) => entry.handle === handle)?.hash;

    const bailed = await service.commitCorpusDocument({ handle, sourceText: '\\\\begin{tikzpicture}\\\\node (' });
    expect(bailed.success).toBe(false);
    expect(service.listCorpusEntries().entries.find((entry) => entry.handle === handle)?.hash).toBe(changedHash);
    expect(flush.mock.calls.length).toBeGreaterThan(2);
    runtime.dispose();
  });

  it('preserves an in-memory gate pass when IndexedDB persistence fails', async () => {
    const { runtime, service } = setup();
    await service.seedZxCorpus();
    const handle = 'zx:examples:05_bialgebra_law';
    const original = service.openEntry(handle);
    service.configure({ persistence: { flush: async () => { throw new Error('quota exceeded'); } } });

    const result = await service.commitCorpusDocument({ handle, sourceText: `${original.source}% retry persistence\n` });

    expect(result.success).toBe(true);
    expect(result.persisted).toBe(false);
    expect(result.persistenceError).toMatch(/quota/i);
    expect(service.openEntry(handle).source).toContain('retry persistence');
    runtime.dispose();
  });

  it('reports malformed, missing, non-text, and corrupt index rows without fabricating entries', () => {
    const { runtime, service } = setup();
    const author = AgentDid.create('did:clm:corpus-test');
    const nonText = MCard.create('tikzit://diagram/non-text', structuredPayload({ value: 1 }), author, 0);
    const corrupt = MCard.create('tikzit://diagram/corrupt', textPayload('not TikZ'), author, 0);
    runtime.mcardCollection.putWithHandle(nonText, 'zx:examples:non-text');
    runtime.mcardCollection.putWithHandle(corrupt, 'zx:examples:corrupt');
    service.restoreIndex([
      { handle: 'zx:examples:malformed', hash: 'bad', committedAt: 1 },
      { handle: 'zx:examples:missing', hash: 'a'.repeat(64), committedAt: 1 },
      { handle: 'zx:examples:non-text', hash: nonText.hash.asHex(), committedAt: 1 },
      { handle: 'zx:examples:corrupt', hash: corrupt.hash.asHex(), committedAt: 1 },
    ]);

    const result = service.listCorpusEntries();
    expect(result.entries).toEqual([]);
    expect(result.issues).toHaveLength(4);
    expect(result.issues.map((issue) => issue.handle)).toEqual([
      'zx:examples:malformed', 'zx:examples:missing', 'zx:examples:non-text', 'zx:examples:corrupt',
    ]);
    runtime.dispose();
  });

  it('reports stale index records and opens exact stored source without minting a receipt', async () => {
    const { runtime, service } = setup();
    await service.seedZxCorpus();
    service.restoreIndex([
      ...service.getCorpusIndex(),
      { handle: 'zx:examples:stale', hash: 'b'.repeat(64), committedAt: 1 },
    ]);
    const receiptCount = runtime.triDb.executionLog.list().length;

    const listing = service.listCorpusEntries();
    const opened = service.openEntry('zx:examples:05_bialgebra_law');

    expect(listing.entries).toHaveLength(2);
    expect(listing.issues).toEqual([expect.objectContaining({ handle: 'zx:examples:stale' })]);
    expect(opened.source).toBe(source);
    expect(opened.ast.nodes).toHaveLength(1);
    expect(runtime.triDb.executionLog.list().length).toBe(receiptCount);
    runtime.dispose();
  });

  it('repairs a stale app-owned index row to the resolved head on reseed', async () => {
    const { runtime, service } = setup();
    await service.seedZxCorpus();
    const handle = 'zx:examples:05_bialgebra_law';
    const original = service.openEntry(handle);
    await service.commitCorpusDocument({ handle, sourceText: `${original.source}% v2\n` });
    const liveHash = service.getCorpusIndex().find((row) => row.handle === handle)!.hash;
    expect(liveHash).not.toBe(original.entry.hash);

    // Simulate a snapshot whose index row lags behind the resolved handle head.
    service.restoreIndex([{ handle, hash: original.entry.hash, committedAt: 1 }]);
    expect(service.listCorpusEntries().issues.map((issue) => issue.handle)).toContain(handle);

    const reseed = await service.seedZxCorpus();
    expect(reseed.complete).toBe(true);
    expect(service.getCorpusIndex().find((row) => row.handle === handle)!.hash).toBe(liveHash);
    expect(service.listCorpusEntries().issues).toEqual([]);
    runtime.dispose();
  });

  it('reports seed persistence warnings separately from corpus asset failures', async () => {
    const { runtime, service } = setup();
    service.configure({ persistence: { flush: async () => { throw new Error('IndexedDB unavailable'); } } });

    const result = await service.seedZxCorpus();

    expect(result.committed).toBe(2);
    expect(result.failed).toBe(0);
    expect(result.complete).toBe(true);
    expect(result.failures).toEqual([]);
    expect(result.persistenceError).toMatch(/IndexedDB/i);
    runtime.dispose();
  });

  it('rejects commits to non-corpus handles so the index stays corpus-scoped', async () => {
    const { runtime, service } = setup();
    const result = await service.commitCorpusDocument({ handle: 'scratch:local', sourceText: source });
    expect(result.success).toBe(false);
    expect(service.getCorpusIndex()).toEqual([]);
    runtime.dispose();
  });

  it('marks a dirty buffer clean when a save resolves to an unchanged head', async () => {
    const { runtime, service } = setup();
    await service.seedZxCorpus();
    const handle = 'zx:examples:05_bialgebra_law';
    runtime.openCorpusEntry(handle);
    const active = defaultWorkspaceManager.getActiveDocument()!;
    defaultWorkspaceManager.updateContent(handle, active.content);
    expect(defaultWorkspaceManager.getActiveDocument()!.isDirty).toBe(true);

    const result = await runtime.saveActiveCorpusEntry();

    expect(result?.success).toBe(true);
    expect(result?.unchanged).toBe(true);
    expect(defaultWorkspaceManager.getActiveDocument()!.isDirty).toBe(false);
    runtime.dispose();
  });

  it('projects the opened head into status stores and clears them for non-corpus documents', async () => {
    const { runtime, service } = setup();
    await service.seedZxCorpus();
    const handle = 'zx:examples:05_bialgebra_law';
    const receipts = runtime.triDb.executionLog.list().length;

    runtime.openCorpusEntry(handle);
    const indexed = service.getCorpusIndex().find((row) => row.handle === handle)!;
    expect(runtime.stores.$documentHead.get()).toMatchObject({ handle, hash: indexed.hash });
    expect(runtime.stores.$activeDiagram.get().handle).toBe(handle);
    // Opening an existing revision mints no receipt and fabricates no commit.
    expect(runtime.triDb.executionLog.list()).toHaveLength(receipts);

    defaultWorkspaceManager.setActiveDocument('default-doc');
    expect(runtime.stores.$documentHead.get().hash).toBe('');
    expect(runtime.stores.$documentHead.get().handle).toBe('');
    expect(runtime.stores.$activeDiagram.get().handle).toBe('default-doc');
    runtime.dispose();
  });

  it('keeps corpus projections isolated between runtimes sharing the workspace manager', async () => {
    const { runtime: first, service: firstService } = setup();
    const second = createWorkbenchRuntime({ bindKeybindings: false });
    await firstService.seedZxCorpus();

    first.openCorpusEntry('zx:examples:05_bialgebra_law');

    expect(first.stores.$documentHead.get().hash).not.toBe('');
    expect(second.stores.$documentHead.get().hash).toBe('');
    expect(second.stores.$activeDiagram.get().handle).not.toBe('zx:examples:05_bialgebra_law');
    first.dispose();
    second.dispose();
  });
});
