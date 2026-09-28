import { describe, it, expect, vi } from 'vitest';
import { CACHE_NAME, SHELL_ASSETS, handleInstall, handleActivate, type SWExtendableEvent } from '../../../src/pwa/service-worker';

describe('PWA Service Worker Offline Architecture', () => {
  it('defines cache name and core shell assets', () => {
    expect(CACHE_NAME).toBe('tikzit-shell-v1');
    expect(SHELL_ASSETS).toContain('/');
    expect(SHELL_ASSETS).toContain('/manifest.json');
    expect(SHELL_ASSETS).toContain('/favicon.svg');
  });

  it('handleInstall precaches shell assets into Cache API', async () => {
    const mockCache = {
      addAll: vi.fn().mockResolvedValue(undefined)
    };
    (global as any).caches = {
      open: vi.fn().mockResolvedValue(mockCache)
    };

    let waitUntilPromise: Promise<any> | null = null;
    const mockEvent: SWExtendableEvent = {
      waitUntil: vi.fn((p) => { waitUntilPromise = p; })
    };

    handleInstall(mockEvent, ['/', '/manifest.json']);
    expect(mockEvent.waitUntil).toHaveBeenCalled();
    await waitUntilPromise;
    expect((global as any).caches.open).toHaveBeenCalledWith('tikzit-shell-v1');
    expect(mockCache.addAll).toHaveBeenCalledWith(['/', '/manifest.json']);
  });

  it('handleActivate purges stale caches', async () => {
    (global as any).caches = {
      keys: vi.fn().mockResolvedValue(['tikzit-shell-v1', 'old-cache-v0']),
      delete: vi.fn().mockResolvedValue(true)
    };

    let waitUntilPromise: Promise<any> | null = null;
    const mockEvent: SWExtendableEvent = {
      waitUntil: vi.fn((p) => { waitUntilPromise = p; })
    };

    handleActivate(mockEvent);
    expect(mockEvent.waitUntil).toHaveBeenCalled();
    await waitUntilPromise;
    expect((global as any).caches.delete).toHaveBeenCalledWith('old-cache-v0');
    expect((global as any).caches.delete).not.toHaveBeenCalledWith('tikzit-shell-v1');
  });
});
