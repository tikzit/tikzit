/**
 * src/core/parser/propertyCombinator.ts - Sprint 24
 * Extraction of typed curvature and routing properties from GraphElementData.
 * Target: <= 80 LOC.
 */
import type { GraphElementData } from '../domain/types';

export interface ExtractedCurvature {
  bend?: number;
  inAngle?: number;
  outAngle?: number;
  weight?: number;
}

export function extractCurvatureProperties(mergedData: GraphElementData): ExtractedCurvature {
  let bend: number | undefined = undefined;
  let inAngle: number | undefined = undefined;
  let outAngle: number | undefined = undefined;
  let weight: number | undefined = undefined;

  const bendLeft = mergedData.find((p) => p.key === 'bend left');
  const bendRight = mergedData.find((p) => p.key === 'bend right');
  if (bendLeft) {
    const val = parseFloat(bendLeft.value ?? '30');
    bend = isNaN(val) ? -30 : -val;
  } else if (bendRight) {
    const val = parseFloat(bendRight.value ?? '30');
    bend = isNaN(val) ? 30 : val;
  }

  const inProp = mergedData.find((p) => p.key === 'in');
  const outProp = mergedData.find((p) => p.key === 'out');
  if (inProp?.value !== undefined && outProp?.value !== undefined) {
    const parsedIn = parseFloat(inProp.value);
    const parsedOut = parseFloat(outProp.value);
    if (!isNaN(parsedIn) && !isNaN(parsedOut)) {
      inAngle = parsedIn;
      outAngle = parsedOut;
    }
  }

  const looseProp = mergedData.find((p) => p.key === 'looseness');
  if (looseProp?.value !== undefined) {
    const parsedLoose = parseFloat(looseProp.value);
    if (!isNaN(parsedLoose)) {
      weight = parsedLoose / 2.5;
    }
  }

  return { bend, inAngle, outAngle, weight };
}
