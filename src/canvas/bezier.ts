/**
 * Bézier curve calculations with strict mathematical parity to TikZiT C++ desktop implementation:
 * - Edge::updateControls (src/data/edge.cpp)
 * - Closed-form cubic Bézier first derivatives for exact arrowhead tangents
 */

import type { Point2D, GraphElementData } from '../core/domain/types';
import { getProperty, hasAtom } from '../core/domain/types';

export { type Point2D };

export interface EdgeControls {
  src: Point2D;
  target: Point2D;
  tail: Point2D;
  cp1: Point2D;
  cp2: Point2D;
  head: Point2D;
  mid: Point2D;
  inAngle: number;     // Snap-cached degrees (15-deg increments in basic bend mode)
  outAngle: number;    // Snap-cached degrees (15-deg increments in basic bend mode)
  inAngleR: number;    // Radians used for geometry
  outAngleR: number;   // Radians used for geometry
  cpDist: number;
  headTangent: number; // Target incoming vector angle (radians)
  tailTangent: number; // Source outgoing vector angle (radians)
  isSelfLoop: boolean;
}

export interface EdgeInput {
  src: Point2D;
  target: Point2D;
  sourceId?: string;
  targetId?: string;
  srcStyle?: string;
  targetStyle?: string;
  bend?: number;             // signed bend in degrees (e.g. -30 for bend left, +30 for bend right)
  inAngle?: number;          // advanced mode in angle in degrees
  outAngle?: number;         // advanced mode out angle in degrees
  looseness?: number;        // looseness parameter (default 1.0, w = looseness / 2.5 = 0.4)
  weight?: number;           // direct curvature weight override
  properties?: Record<string, string>;
  data?: GraphElementData;
}

export function roundToNearest(nearest: number, val: number): number {
  return Math.round(val / nearest) * nearest;
}

export function evaluateCubicBezier(
  t: number,
  p0: Point2D,
  p1: Point2D,
  p2: Point2D,
  p3: Point2D
): Point2D {
  const mt = 1 - t;
  const mt2 = mt * mt;
  const t2 = t * t;
  const a = mt2 * mt;
  const b = 3 * mt2 * t;
  const c = 3 * mt * t2;
  const d = t2 * t;

  return {
    x: a * p0.x + b * p1.x + c * p2.x + d * p3.x,
    y: a * p0.y + b * p1.y + c * p2.y + d * p3.y,
  };
}

export function computeEdgeControls(input: EdgeInput): EdgeControls {
  const { src, target } = input;
  const dx = target.x - src.x;
  const dy = target.y - src.y;
  // Desktop TikZiT Parity (edge.cpp:34): evaluate self-loops by node identity (sourceId === targetId)
  const isSelfLoop =
    input.sourceId !== undefined && input.targetId !== undefined
      ? input.sourceId === input.targetId
      : Math.abs(dx) < 1e-6 && Math.abs(dy) < 1e-6;

  // Resolve properties
  let bend = input.bend ?? 0;
  let inAngleProp = input.inAngle;
  let outAngleProp = input.outAngle;
  let looseness = input.looseness;

  if (input.data) {
    if (hasAtom(input.data, 'bend left')) {
      bend = -30;
    } else if (hasAtom(input.data, 'bend right')) {
      bend = 30;
    } else {
      const bLeft = getProperty(input.data, 'bend left');
      const bRight = getProperty(input.data, 'bend right');
      if (bLeft !== undefined) {
        const val = parseFloat(bLeft);
        bend = isNaN(val) ? -30 : -val;
      } else if (bRight !== undefined) {
        const val = parseFloat(bRight);
        bend = isNaN(val) ? 30 : val;
      }
    }

    const inVal = getProperty(input.data, 'in');
    const outVal = getProperty(input.data, 'out');
    if (inVal !== undefined && outVal !== undefined) {
      inAngleProp = parseFloat(inVal);
      outAngleProp = parseFloat(outVal);
    }

    const looseVal = getProperty(input.data, 'looseness');
    if (looseVal !== undefined) {
      looseness = parseFloat(looseVal);
    }
  }

  if (input.properties) {
    if (input.properties['bend left'] !== undefined) {
      const val = parseFloat(input.properties['bend left']);
      bend = isNaN(val) ? -30 : -val;
    } else if (input.properties['bend right'] !== undefined) {
      const val = parseFloat(input.properties['bend right']);
      bend = isNaN(val) ? 30 : val;
    }
    if (input.properties['in'] !== undefined && input.properties['out'] !== undefined) {
      inAngleProp = parseFloat(input.properties['in']);
      outAngleProp = parseFloat(input.properties['out']);
    }
    if (input.properties['looseness'] !== undefined) {
      looseness = parseFloat(input.properties['looseness']);
    }
  }

  const basicBendMode = inAngleProp === undefined || outAngleProp === undefined;

  let outAngleR = 0;
  let inAngleR = 0;
  let outAngleDeg = 0;
  let inAngleDeg = 0;

  if (isSelfLoop && (inAngleProp === undefined || outAngleProp === undefined)) {
    // Desktop TikZiT Parity (edge.cpp:43-44):
    // Self-loops default to _outAngle = 45 deg, _inAngle = 135 deg, weight = 1.0 (upward teardrop loop)
    outAngleDeg = outAngleProp ?? 45;
    inAngleDeg = inAngleProp ?? 135;
    outAngleR = (outAngleDeg * Math.PI) / 180;
    inAngleR = (inAngleDeg * Math.PI) / 180;
  } else if (basicBendMode) {
    const angle = Math.atan2(dy, dx);
    const bnd = (bend * Math.PI) / 180;
    outAngleR = angle - bnd;
    inAngleR = Math.PI + angle + bnd;

    outAngleDeg = Math.round(roundToNearest(15, (outAngleR * 180) / Math.PI));
    inAngleDeg = Math.round(roundToNearest(15, (inAngleR * 180) / Math.PI));
  } else {
    outAngleDeg = outAngleProp ?? 180;
    inAngleDeg = inAngleProp ?? 0;
    outAngleR = (outAngleDeg * Math.PI) / 180;
    inAngleR = (inAngleDeg * Math.PI) / 180;
  }

  // Endpoint inset (0.2 for standard nodes, 0 for 'none' style)
  const isSrcNone = input.srcStyle === 'none';
  const isTargetNone = input.targetStyle === 'none';

  const tail: Point2D = isSrcNone
    ? { x: src.x, y: src.y }
    : {
        x: src.x + Math.cos(outAngleR) * 0.2,
        y: src.y + Math.sin(outAngleR) * 0.2,
      };

  const head: Point2D = isTargetNone
    ? { x: target.x, y: target.y }
    : {
        x: target.x + Math.cos(inAngleR) * 0.2,
        y: target.y + Math.sin(inAngleR) * 0.2,
      };

  // Control arm distance
  let weight = input.weight ?? (isSelfLoop ? 1.0 : 0.4);
  if (looseness !== undefined && !isNaN(looseness)) {
    weight = looseness / 2.5;
  }

  const cpDist = isSelfLoop ? weight : Math.sqrt(dx * dx + dy * dy) * weight;

  const cp1: Point2D = {
    x: src.x + cpDist * Math.cos(outAngleR),
    y: src.y + cpDist * Math.sin(outAngleR),
  };

  const cp2: Point2D = {
    x: target.x + cpDist * Math.cos(inAngleR),
    y: target.y + cpDist * Math.sin(inAngleR),
  };

  // Midpoint at t = 0.5
  const mid = evaluateCubicBezier(0.5, tail, cp1, cp2, head);

  // Exact derivatives at endpoints:
  // B'(1) = 3 * (head - cp2)
  // B'(0) = 3 * (cp1 - tail)
  const dHeadX = head.x - cp2.x;
  const dHeadY = head.y - cp2.y;
  const headTangent =
    Math.abs(dHeadX) < 1e-9 && Math.abs(dHeadY) < 1e-9
      ? Math.atan2(dy, dx)
      : Math.atan2(dHeadY, dHeadX);

  const dTailX = cp1.x - tail.x;
  const dTailY = cp1.y - tail.y;
  const tailTangent =
    Math.abs(dTailX) < 1e-9 && Math.abs(dTailY) < 1e-9
      ? Math.atan2(dy, dx)
      : Math.atan2(dTailY, dTailX);

  return {
    src,
    target,
    tail,
    cp1,
    cp2,
    head,
    mid,
    inAngle: inAngleDeg,
    outAngle: outAngleDeg,
    inAngleR,
    outAngleR,
    cpDist,
    headTangent,
    tailTangent,
    isSelfLoop,
  };
}
