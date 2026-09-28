import { describe, it, expect } from 'vitest';
import {
  computeEdgeControls,
  roundToNearest,
  evaluateCubicBezier,
} from '../../../src/canvas/bezier';

describe('Bézier Curvature Parity (edge.cpp)', () => {
  it('computes straight edge controls (bend=0)', () => {
    const src = { x: 0, y: 0 };
    const target = { x: 2, y: 0 };
    const controls = computeEdgeControls({ src, target });

    expect(controls.isSelfLoop).toBe(false);
    expect(controls.outAngle).toBe(0);
    expect(controls.inAngle).toBe(180);
    // 0.2 inset for standard nodes
    expect(controls.tail.x).toBeCloseTo(0.2, 5);
    expect(controls.tail.y).toBeCloseTo(0, 5);
    expect(controls.head.x).toBeCloseTo(1.8, 5);
    expect(controls.head.y).toBeCloseTo(0, 5);

    // Default weight is 0.4, distance = 2 * 0.4 = 0.8
    expect(controls.cpDist).toBeCloseTo(0.8, 5);
    expect(controls.cp1.x).toBeCloseTo(0.8, 5);
    expect(controls.cp1.y).toBeCloseTo(0, 5);
    expect(controls.cp2.x).toBeCloseTo(1.2, 5);
    expect(controls.cp2.y).toBeCloseTo(0, 5);

    // Tangents
    expect(controls.headTangent).toBeCloseTo(0, 5);
    expect(controls.tailTangent).toBeCloseTo(0, 5);
  });

  it('computes basic bend left mode with 15-deg snapping', () => {
    const src = { x: 0, y: 0 };
    const target = { x: 4, y: 0 };
    // atom bend left = -30 deg bend
    const controls = computeEdgeControls({
      src,
      target,
      properties: { 'bend left': '30' },
    });

    // dx=4, dy=0 => alpha = 0. bend = -30 => outAngleR = 0 - (-30) = +30 deg.
    // inAngleR = 180 + 0 + (-30) = 150 deg.
    expect(controls.outAngle).toBe(30);
    expect(controls.inAngle).toBe(150);

    // Distance = 4 * 0.4 = 1.6
    expect(controls.cpDist).toBeCloseTo(1.6, 5);
    expect(controls.cp1.x).toBeCloseTo(1.6 * Math.cos((30 * Math.PI) / 180), 5);
    expect(controls.cp1.y).toBeCloseTo(1.6 * Math.sin((30 * Math.PI) / 180), 5);

    // Midpoint is lifted in +Y
    expect(controls.mid.y).toBeGreaterThan(0);
  });

  it('computes basic bend right mode', () => {
    const src = { x: 0, y: 0 };
    const target = { x: 4, y: 0 };
    const controls = computeEdgeControls({
      src,
      target,
      properties: { 'bend right': '30' },
    });

    // bend = +30 => outAngleR = -30 deg, inAngleR = 180 + 30 = 210 deg
    expect(controls.outAngle).toBe(-30);
    expect(controls.inAngle).toBe(210);
    expect(controls.mid.y).toBeLessThan(0);
  });

  it('respects style=none endpoint zero-inset', () => {
    const src = { x: 0, y: 0 };
    const target = { x: 3, y: 4 };
    const controls = computeEdgeControls({
      src,
      target,
      srcStyle: 'none',
      targetStyle: 'none',
    });

    // Exactly at node center
    expect(controls.tail.x).toBe(src.x);
    expect(controls.tail.y).toBe(src.y);
    expect(controls.head.x).toBe(target.x);
    expect(controls.head.y).toBe(target.y);
  });

  it('handles advanced in/out angle mode', () => {
    const src = { x: -1, y: 0 };
    const target = { x: 1, y: 0 };
    const controls = computeEdgeControls({
      src,
      target,
      properties: { in: '90', out: '90', looseness: '1.5' },
    });

    expect(controls.outAngle).toBe(90);
    expect(controls.inAngle).toBe(90);
    // looseness = 1.5 => weight = 1.5 / 2.5 = 0.6
    // distance = 2 * 0.6 = 1.2
    expect(controls.cpDist).toBeCloseTo(1.2, 5);
    expect(controls.cp1.y).toBeCloseTo(1.2, 5);
    expect(controls.cp2.y).toBeCloseTo(1.2, 5);
  });

  it('handles self-loops with default unit weight', () => {
    const src = { x: 2, y: 2 };
    const target = { x: 2, y: 2 };
    const controls = computeEdgeControls({
      src,
      target,
      properties: { in: '270', out: '90' },
    });

    expect(controls.isSelfLoop).toBe(true);
    // Default weight for self loop is 1.0
    expect(controls.cpDist).toBeCloseTo(1.0, 5);
    expect(controls.cp1.y).toBeCloseTo(3.0, 5);
    expect(controls.cp2.y).toBeCloseTo(1.0, 5);
  });

  it('calculates closed-form arrowhead tangents', () => {
    const src = { x: 0, y: 0 };
    const target = { x: 2, y: 2 };
    const controls = computeEdgeControls({ src, target });

    // Straight line diagonal at 45 degrees
    expect(controls.headTangent).toBeCloseTo(Math.PI / 4, 4);
    expect(controls.tailTangent).toBeCloseTo(Math.PI / 4, 4);
  });

  it('correctly rounds angles to nearest 15 degrees', () => {
    expect(roundToNearest(15, 0)).toBe(0);
    expect(roundToNearest(15, 7)).toBe(0);
    expect(roundToNearest(15, 8)).toBe(15);
    expect(roundToNearest(15, 29)).toBe(30);
    expect(roundToNearest(15, -31)).toBe(-30);
  });
});
