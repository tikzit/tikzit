/**
 * tests/unit/components/history/VersionDiffEngine.test.ts - Sprint 22
 * Unit tests T22-01 to T22-05 for pure AST delta and line diff engine.
 */
import { describe, it, expect } from 'vitest';
import {
  computeLineDiff,
  computeStatDeltas,
} from '../../../../src/components/workbench/panels/history/VersionDiffEngine';
import type { GraphAST } from '../../../../src/core/domain/types';

describe('VersionDiffEngine (T22-01 - T22-05)', () => {
  it('T22-01: computeLineDiff identifies unchanged identical lines', () => {
    const text = 'line 1\nline 2\nline 3';
    const diff = computeLineDiff(text, text);
    expect(diff).toHaveLength(3);
    expect(diff.every((d) => d.type === 'unchanged')).toBe(true);
    expect(diff.map((d) => d.text)).toEqual(['line 1', 'line 2', 'line 3']);
  });

  it('T22-02: computeLineDiff correctly detects additions and removals', () => {
    const oldText = 'apple\nbanana\ncherry';
    const newText = 'apple\nblueberry\ncherry\ndate';
    const diff = computeLineDiff(oldText, newText);

    expect(diff).toEqual([
      { type: 'unchanged', text: 'apple' },
      { type: 'removed', text: 'banana' },
      { type: 'added', text: 'blueberry' },
      { type: 'unchanged', text: 'cherry' },
      { type: 'added', text: 'date' },
    ]);
  });

  it('T22-03: computeStatDeltas computes node and edge differences', () => {
    const oldAst: GraphAST = {
      nodes: [
        { id: '1', name: '1', label: '', position: { x: 0, y: 0 }, data: [] },
        { id: '2', name: '2', label: '', position: { x: 1, y: 1 }, data: [] },
      ],
      edges: [{ id: 'e1', sourceId: '1', targetId: '2', data: [] }],
      data: [],
      paths: [],
    };

    const newAst: GraphAST = {
      nodes: [
        { id: '1', name: '1', label: '', position: { x: 0, y: 0 }, data: [] },
        { id: '2', name: '2', label: '', position: { x: 1, y: 1 }, data: [] },
        { id: '3', name: '3', label: '', position: { x: 2, y: 2 }, data: [] },
      ],
      edges: [
        { id: 'e1', sourceId: '1', targetId: '2', data: [] },
        { id: 'e2', sourceId: '2', targetId: '3', data: [] },
      ],
      data: [],
      paths: [],
    };

    const stats = computeStatDeltas(oldAst, newAst);
    expect(stats.nodeDelta).toBe(1);
    expect(stats.edgeDelta).toBe(1);
    expect(stats.oldNodeCount).toBe(2);
    expect(stats.newNodeCount).toBe(3);
    expect(stats.oldEdgeCount).toBe(1);
    expect(stats.newEdgeCount).toBe(2);
  });

  it('T22-04: computeStatDeltas safely handles null AST inputs', () => {
    const statsNullOld = computeStatDeltas(null, {
      nodes: [{ id: '1', name: '1', label: '', position: { x: 0, y: 0 }, data: [] }],
      edges: [],
      data: [],
      paths: [],
    });
    expect(statsNullOld.nodeDelta).toBe(1);
    expect(statsNullOld.oldNodeCount).toBe(0);
    expect(statsNullOld.newNodeCount).toBe(1);

    const statsBothNull = computeStatDeltas(null, null);
    expect(statsBothNull.nodeDelta).toBe(0);
    expect(statsBothNull.edgeDelta).toBe(0);
  });

  it('T22-05: computeLineDiff handles empty string transitions', () => {
    const diffFromEmpty = computeLineDiff('', 'line 1\nline 2');
    expect(diffFromEmpty.some((d) => d.type === 'added')).toBe(true);

    const diffToEmpty = computeLineDiff('line 1\nline 2', '');
    expect(diffToEmpty.some((d) => d.type === 'removed')).toBe(true);
  });
});
