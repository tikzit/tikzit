import { describe, it, expect, vi } from 'vitest';
import { StorageSupervisor } from '../../../../src/services/storage/StorageSupervisor';
import { createWorkbenchStores } from '../../../../src/stores/createWorkbenchStores';

describe('Sprint 21: StorageSupervisor Persistence & Conflict Handling', () => {
  it('T21-17: successfully executes flush and clears persistence errors', async () => {
    const stores = createWorkbenchStores();
    stores.$corpusView.set({ ...stores.$corpusView.get(), persistenceError: 'old error' });
    const flushMock = vi.fn().mockResolvedValue(undefined);
    const supervisor = new StorageSupervisor({
      flush: flushMock,
      corpusExplorer: {} as any,
      stores,
    });

    await supervisor.flush();
    expect(flushMock).toHaveBeenCalledTimes(1);
    expect(stores.$corpusView.get().persistence).toBe('persistent');
    expect(stores.$corpusView.get().persistenceError).toBeUndefined();
  });

  it('T21-18: coalesces concurrent flush requests into a single promise', async () => {
    const stores = createWorkbenchStores();
    let resolveFlush: () => void;
    const flushMock = vi.fn().mockImplementation(() => new Promise<void>((r) => { resolveFlush = r; }));
    const supervisor = new StorageSupervisor({
      flush: flushMock,
      corpusExplorer: {} as any,
      stores,
    });

    const f1 = supervisor.flush();
    const f2 = supervisor.flush();
    expect(f1).toBe(f2);

    resolveFlush!();
    await f1;
    expect(flushMock).toHaveBeenCalledTimes(1);
  });

  it('T21-19: records persistence error on flush failure and allows retry', async () => {
    const stores = createWorkbenchStores();
    let fail = true;
    const flushMock = vi.fn().mockImplementation(async () => {
      if (fail) throw new Error('IDB write failed');
    });
    const supervisor = new StorageSupervisor({
      flush: flushMock,
      corpusExplorer: {} as any,
      stores,
    });

    const success1 = await supervisor.retryFlush();
    expect(success1).toBe(false);
    expect(stores.$corpusView.get().persistenceError).toContain('IDB write failed');

    fail = false;
    const success2 = await supervisor.retryFlush();
    expect(success2).toBe(true);
    expect(stores.$corpusView.get().persistenceError).toBeUndefined();
  });

  it('T21-20: marks state as stale on writer generation conflict', () => {
    const stores = createWorkbenchStores();
    const supervisor = new StorageSupervisor({
      flush: vi.fn(),
      corpusExplorer: {} as any,
      stores,
    });

    supervisor.handleStaleConflict(1, 2);
    expect(stores.$corpusView.get().persistence).toBe('stale');
    expect(stores.$corpusView.get().persistenceError).toContain('Stale writer conflict');
  });
});
