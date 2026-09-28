/**
 * tests/unit/clm/DiagramCommitCoordinator.test.ts - Sprint 23
 * Tests T23-07 to T23-12: DiagramCommitCoordinator commits, seeding, persistence errors, and restoration.
 */
import { describe, it, expect, vi } from 'vitest';
import { createHash } from 'node:crypto';
import { createWorkbenchRuntime } from '../../../src/services/createWorkbenchRuntime';
import { DiagramCommitCoordinator } from '../../../src/services/clm/DiagramCommitCoordinator';
import { DiagramIndexService, type CorpusManifestEntry } from '../../../src/services/clm/DiagramIndexService';
import { DiagramLifecycleManager } from '../../../src/services/clm/DiagramLifecycleManager';

const sampleSource = '\\begin{tikzpicture}\n\\node (a) at (0,0) {};\n\\end{tikzpicture}\n';
const digest = (text: string) => createHash('sha256').update(text).digest('hex');

const manifest: CorpusManifestEntry[] = [
  {
    id: 'sample_manifest_1',
    title: 'Sample 1',
    tikz_file: 'zx-calculus/sample1.tikz',
    tikz_bytes: Buffer.byteLength(sampleSource),
    tikz_sha256: digest(sampleSource),
  },
];

describe('DiagramCommitCoordinator (Sprint 23: T23-07 to T23-12)', () => {
  function setupTestHarness() {
    const runtime = createWorkbenchRuntime({ bindKeybindings: false });
    const indexService = new DiagramIndexService([]);
    let persistenceFlushes = 0;
    let throwPersistence = false;
    const persistence = {
      flush: async () => {
        persistenceFlushes++;
        if (throwPersistence) throw new Error('Simulated persistence IO error');
      },
    };

    const lifecycleManager = new DiagramLifecycleManager({
      collection: runtime.mcardCollection,
      authorDid: runtime.authorDid,
      indexService,
      getPersistence: () => persistence,
      getManifest: () => manifest,
    });

    const persistedEvents: Array<{ handle: string; hash: string }> = [];
    const coordinator = new DiagramCommitCoordinator({
      collection: runtime.mcardCollection,
      commitService: runtime.ctx.documentCommit,
      indexService,
      lifecycleManager,
      getPersistence: () => persistence,
      authorDid: runtime.authorDid,
      getManifest: () => manifest,
      getFetcher: () => vi.fn(async () => new Response(sampleSource)),
      getBaseUrl: () => '/docs/examples/',
      onPersisted: (payload) => persistedEvents.push(payload),
    });

    return {
      runtime,
      indexService,
      lifecycleManager,
      coordinator,
      persistedEvents,
      getFlushCount: () => persistenceFlushes,
      setThrowPersistence: (val: boolean) => { throwPersistence = val; },
    };
  }

  it('T23-07: rejects commits to non-diagram handles', async () => {
    const { runtime, coordinator } = setupTestHarness();
    const result = await coordinator.commitCorpusDocument({
      handle: 'invalid:prefix:123',
      sourceText: sampleSource,
    });
    expect(result.success).toBe(false);
    expect(result.reason).toContain('Not a corpus handle');
    runtime.dispose();
  });

  it('T23-08: detects unchanged source and skips new card creation', async () => {
    const { runtime, coordinator, indexService } = setupTestHarness();
    const handle = 'zx:diagrams:unchanged-test';

    const commit1 = await coordinator.commitCorpusDocument({ handle, sourceText: sampleSource, title: 'Original' });
    expect(commit1.success).toBe(true);
    expect(commit1.unchanged).toBeFalsy();

    const commit2 = await coordinator.commitCorpusDocument({ handle, sourceText: sampleSource, title: 'Original' });
    expect(commit2.success).toBe(true);
    expect(commit2.unchanged).toBe(true);
    expect(commit2.hash).toBe(commit1.hash);
    expect(indexService.getIndex()).toHaveLength(1);
    runtime.dispose();
  });

  it('T23-09: saves document with gate, updates index, and writes metadata card for zx:diagrams:', async () => {
    const { runtime, coordinator, indexService, lifecycleManager } = setupTestHarness();
    const handle = 'zx:diagrams:meta-test-uuid';

    const commit = await coordinator.commitCorpusDocument({
      handle,
      sourceText: sampleSource,
      title: 'Meta Test Title',
      message: 'Initial version',
    });

    expect(commit.success).toBe(true);
    expect(commit.hash).toBeDefined();

    const row = indexService.getIndex().find((r) => r.handle === handle);
    expect(row).toBeDefined();
    expect(row?.title).toBe('Meta Test Title');

    const meta = lifecycleManager.getDiagramMetadata(handle);
    expect(meta).not.toBeNull();
    expect(meta?.title).toBe('Meta Test Title');
    expect(meta?.labels?.['1']).toBe('Initial version');
    runtime.dispose();
  });

  it('T23-10: handles persistence failure and reports persisted: false', async () => {
    const { runtime, coordinator, setThrowPersistence } = setupTestHarness();
    setThrowPersistence(true);

    const handle = 'zx:diagrams:persist-fail-uuid';
    const commit = await coordinator.commitCorpusDocument({
      handle,
      sourceText: sampleSource,
      title: 'Will Fail Persistence',
    });

    expect(commit.success).toBe(true);
    expect(commit.persisted).toBe(false);
    expect(commit.persistenceError).toContain('Simulated persistence IO error');
    runtime.dispose();
  });

  it('T23-11: restores version, updates head in index, and dispatches onPersisted', async () => {
    const { runtime, coordinator, indexService, persistedEvents } = setupTestHarness();
    const handle = 'zx:diagrams:restore-test-uuid';

    // Commit v1
    const v1 = await coordinator.commitCorpusDocument({ handle, sourceText: sampleSource, message: 'v1' });
    // Commit v2
    const v2Source = '\\begin{tikzpicture}\n\\node (b) at (1,1) {};\n\\end{tikzpicture}\n';
    const v2 = await coordinator.commitCorpusDocument({ handle, sourceText: v2Source, message: 'v2' });
    expect(v1.hash).not.toBe(v2.hash);

    // Restore to v1
    const restoreResult = await coordinator.restoreVersion({
      handle,
      targetHash: v1.hash!,
    });

    expect(restoreResult.status).toBe('success');
    if (restoreResult.status === 'success') {
      expect(restoreResult.hash).toBe(v1.hash);
    }
    expect(indexService.getIndex().find((r) => r.handle === handle)?.hash).toBe(v1.hash);
    expect(persistedEvents).toContainEqual({ handle, hash: v1.hash });
    runtime.dispose();
  });

  it('T23-12: seeds zx corpus from manifest, verifying byte count and SHA-256', async () => {
    const { runtime, coordinator, indexService } = setupTestHarness();

    const seedResult = await coordinator.seedZxCorpus();
    expect(seedResult.committed).toBe(1);
    expect(seedResult.failed).toBe(0);
    expect(seedResult.complete).toBe(true);
    expect(seedResult.failures).toEqual([]);

    const entry = indexService.getIndex().find((r) => r.handle === 'zx:examples:sample_manifest_1');
    expect(entry).toBeDefined();
    runtime.dispose();
  });
});
