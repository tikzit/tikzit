import { describe, it, expect, beforeEach } from 'vitest';
import {
  TransactionManager,
  ASTSnapshotCommand,
  MoveNodesCommand,
} from '../../../src/core/history/TransactionManager';
import type { GraphAST } from '../../../src/core/domain/types';

describe('TransactionManager', () => {
  let tm: TransactionManager;

  beforeEach(() => {
    tm = new TransactionManager(100);
  });

  it('manages undo and redo stacks accurately', () => {
    let state = 0;
    const makeCmd = (val: number) => ({
      id: 'cmd-' + val,
      description: 'Set ' + val,
      timestamp: Date.now(),
      execute: () => { state = val; },
      undo: () => { state = val - 1; },
    });

    expect(tm.canUndo()).toBe(false);
    expect(tm.canRedo()).toBe(false);

    tm.execute(makeCmd(1));
    expect(state).toBe(1);
    expect(tm.canUndo()).toBe(true);

    tm.execute(makeCmd(2));
    expect(state).toBe(2);

    tm.undo();
    expect(state).toBe(1);
    expect(tm.canRedo()).toBe(true);

    tm.redo();
    expect(state).toBe(2);
  });

  it('coalesces rapid MoveNodesCommand continuous drags', () => {
    const positions: Record<string, { x: number; y: number }> = { 'n1': { x: 0, y: 0 } };
    const applyMove = (nodeIds: string[], delta: { x: number; y: number }) => {
      nodeIds.forEach(id => {
        positions[id].x += delta.x;
        positions[id].y += delta.y;
      });
    };

    const cmd1 = new MoveNodesCommand(['n1'], { x: 1, y: 0 }, applyMove);
    tm.execute(cmd1);

    const cmd2 = new MoveNodesCommand(['n1'], { x: 2, y: 0 }, applyMove);
    tm.execute(cmd2);

    // Coalesced into a single entry on the undo stack!
    const summary = tm.getHistorySummary();
    expect(summary.undo.length).toBe(1);
    expect(positions['n1'].x).toBe(3);

    // Single undo reverts entire continuous drag back to 0!
    tm.undo();
    expect(positions['n1'].x).toBe(0);
  });

  it('tracks isDirty state relative to save points', () => {
    let val = 0;
    const cmd = {
      id: 'c1',
      description: 'Test',
      timestamp: Date.now(),
      execute: () => { val++; },
      undo: () => { val--; },
    };

    expect(tm.isDirty).toBe(false);
    tm.execute(cmd);
    expect(tm.isDirty).toBe(true);

    tm.markClean();
    expect(tm.isDirty).toBe(false);

    tm.execute({ ...cmd, id: 'c2' });
    expect(tm.isDirty).toBe(true);

    tm.undo();
    expect(tm.isDirty).toBe(false);
  });

  it('passes 50-step undo/redo torture test without state drift', () => {
    let currentAST: GraphAST = { data: [], paths: [], nodes: [], edges: [] };
    const historyASTs: GraphAST[] = [];

    for (let i = 1; i <= 50; i++) {
      const prev = currentAST;
      const next: GraphAST = {
        data: [],
        paths: [],
        nodes: [...prev.nodes, { id: 'n' + i, name: 'n' + i, label: 'L' + i, position: { x: i, y: i }, data: [] }],
        edges: [],
      };
      historyASTs.push(next);
      tm.execute(new ASTSnapshotCommand('Add n' + i, prev, next, (a) => { currentAST = a; }));
    }

    expect(currentAST.nodes.length).toBe(50);

    // Undo all 50
    for (let i = 50; i >= 1; i--) {
      tm.undo();
      expect(currentAST.nodes.length).toBe(i - 1);
    }
    expect(currentAST.nodes.length).toBe(0);

    // Redo all 50
    for (let i = 1; i <= 50; i++) {
      tm.redo();
      expect(currentAST.nodes.length).toBe(i);
      expect(currentAST.nodes[i - 1].name).toBe('n' + i);
    }
  });
});
