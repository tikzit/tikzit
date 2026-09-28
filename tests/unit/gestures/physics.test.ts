import { describe, it, expect, vi, afterEach } from 'vitest';
import { animatePointSnap, prefersReducedMotion } from '../../../src/canvas/animation/Physics';

describe('Anime.js Spring Motion Physics (Sprint 04)', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('immediately snaps to target if prefers-reduced-motion is true', () => {
    // Mock matchMedia
    vi.stubGlobal('matchMedia', (query: string) => ({
      matches: query.includes('prefers-reduced-motion: reduce'),
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    }));

    const updates: Array<{ x: number; y: number }> = [];
    const onComplete = vi.fn();

    const { cancel } = animatePointSnap(
      { x: 0, y: 0 },
      { x: 1, y: 2 },
      (pt) => updates.push(pt),
      onComplete
    );

    expect(updates.length).toBe(1);
    expect(updates[0]).toEqual({ x: 1, y: 2 });
    expect(onComplete).toHaveBeenCalledTimes(1);
    expect(typeof cancel).toBe('function');
  });

  it('animates towards target coordinate and completes with exact snapped values', async () => {
    vi.stubGlobal('matchMedia', () => ({
      matches: false,
    }));

    const updates: Array<{ x: number; y: number }> = [];

    await new Promise<void>((resolve) => {
      animatePointSnap(
        { x: 0, y: 0 },
        { x: 2, y: -1 },
        (pt) => updates.push({ ...pt }),
        () => resolve(),
        { duration: 50 }
      );
    });

    expect(updates.length).toBeGreaterThan(0);
    const finalUpdate = updates[updates.length - 1];
    expect(finalUpdate).toEqual({ x: 2, y: -1 });
  });

  it('allows cancelling an active spring animation', () => {
    vi.stubGlobal('matchMedia', () => ({
      matches: false,
    }));

    const onComplete = vi.fn();
    const handle = animatePointSnap(
      { x: 0, y: 0 },
      { x: 5, y: 5 },
      () => {},
      onComplete,
      { duration: 500 }
    );

    handle.cancel();
    expect(onComplete).not.toHaveBeenCalled();
  });
});
