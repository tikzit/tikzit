import { animate } from 'animejs';
import type { Point2D } from '../../core/domain/types';

export interface SpringConfig {
  mass?: number;
  stiffness?: number;
  damping?: number;
  duration?: number;
}

export function prefersReducedMotion(): boolean {
  const mm = typeof window !== 'undefined' && window.matchMedia
    ? window.matchMedia
    : typeof globalThis !== 'undefined' && (globalThis as any).matchMedia
    ? (globalThis as any).matchMedia
    : null;

  if (!mm) return false;
  return mm('(prefers-reduced-motion: reduce)').matches;
}

/**
 * Animates a point from start position to snapped target position using spring physics.
 * Guaranteed to settle at exact destination coordinate.
 */
export function animatePointSnap(
  from: Point2D,
  to: Point2D,
  onUpdate: (current: Point2D) => void,
  onComplete?: () => void,
  config: SpringConfig = {}
): { cancel: () => void } {
  if (prefersReducedMotion()) {
    onUpdate({ x: to.x, y: to.y });
    if (onComplete) onComplete();
    return { cancel: () => {} };
  }

  const animObj = { x: from.x, y: from.y };

  const anim = animate(animObj, {
    x: to.x,
    y: to.y,
    duration: config.duration ?? 220,
    ease: 'outElastic(1, .8)',
    onUpdate: () => {
      onUpdate({ x: animObj.x, y: animObj.y });
    },
    onComplete: () => {
      onUpdate({ x: to.x, y: to.y });
      if (onComplete) onComplete();
    },
  });

  return {
    cancel: () => {
      anim.pause();
    },
  };
}
