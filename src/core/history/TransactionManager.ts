/**
 * Transactional Undo/Redo Engine for TikZiT Web
 * Supports command pattern, continuous drag coalescing, dirty tracking, and AST state management.
 */

import type { GraphAST, NodeData, EdgeData, Point2D } from '../domain/types';

export interface Command {
  id: string;
  description: string;
  timestamp: number;
  execute(): void;
  undo(): void;
  canMergeWith?(other: Command): boolean;
  mergeWith?(other: Command): void;
}

export interface CommandSummary {
  id: string;
  description: string;
  timestamp: number;
}

export type HistoryChangeListener = (state: {
  canUndo: boolean;
  canRedo: boolean;
  isDirty: boolean;
  lastCommand?: string;
}) => void;

/**
 * Snapshot Command: Captures entire GraphAST before and after a discrete mutation.
 */
export class ASTSnapshotCommand implements Command {
  public id: string;
  public description: string;
  public timestamp: number;
  private beforeAST: GraphAST;
  private afterAST: GraphAST;
  private apply: (ast: GraphAST) => void;

  constructor(
    description: string,
    beforeAST: GraphAST,
    afterAST: GraphAST,
    apply: (ast: GraphAST) => void
  ) {
    this.id = `ast-snap-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    this.description = description;
    this.timestamp = Date.now();
    this.beforeAST = JSON.parse(JSON.stringify(beforeAST));
    this.afterAST = JSON.parse(JSON.stringify(afterAST));
    this.apply = apply;
  }

  public execute(): void {
    this.apply(JSON.parse(JSON.stringify(this.afterAST)));
  }

  public undo(): void {
    this.apply(JSON.parse(JSON.stringify(this.beforeAST)));
  }
}

/**
 * Move Nodes Command with drag-coalescing support.
 */
export class MoveNodesCommand implements Command {
  public id: string;
  public description: string;
  public timestamp: number;
  public nodeIds: string[];
  public totalDelta: Point2D;
  private applyMove: (nodeIds: string[], delta: Point2D) => void;

  constructor(
    nodeIds: string[],
    delta: Point2D,
    applyMove: (nodeIds: string[], delta: Point2D) => void
  ) {
    this.id = `move-nodes-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    this.description = `Move ${nodeIds.length} node(s)`;
    this.timestamp = Date.now();
    this.nodeIds = [...nodeIds];
    this.totalDelta = { ...delta };
    this.applyMove = applyMove;
  }

  public execute(): void {
    this.applyMove(this.nodeIds, this.totalDelta);
  }

  public undo(): void {
    this.applyMove(this.nodeIds, {
      x: -this.totalDelta.x,
      y: -this.totalDelta.y,
    });
  }

  public canMergeWith(other: Command): boolean {
    if (!(other instanceof MoveNodesCommand)) return false;
    if (this.nodeIds.length !== other.nodeIds.length) return false;
    const sameNodes = this.nodeIds.every((id) => other.nodeIds.includes(id));
    const recent = other.timestamp - this.timestamp < 600; // within 600ms
    return sameNodes && recent;
  }

  public mergeWith(other: Command): void {
    if (other instanceof MoveNodesCommand) {
      this.totalDelta.x += other.totalDelta.x;
      this.totalDelta.y += other.totalDelta.y;
      this.timestamp = other.timestamp;
    }
  }
}

export class TransactionManager {
  private undoStack: Command[] = [];
  private redoStack: Command[] = [];
  private savePointIndex: number = 0;
  private maxHistory: number = 100;
  private listeners: Set<HistoryChangeListener> = new Set();

  constructor(maxHistory: number = 100) {
    this.maxHistory = maxHistory;
  }

  public execute(cmd: Command): void {
    // Try coalescing with top of undo stack if supported
    const top = this.undoStack[this.undoStack.length - 1];
    if (top && top.canMergeWith && top.mergeWith && top.canMergeWith(cmd)) {
      top.mergeWith(cmd);
      cmd.execute();
      this.notify();
      return;
    }

    cmd.execute();
    this.undoStack.push(cmd);
    if (this.undoStack.length > this.maxHistory) {
      this.undoStack.shift();
      if (this.savePointIndex > 0) {
        this.savePointIndex--;
      }
    }

    // New action invalidates redo stack
    this.redoStack = [];
    this.notify();
  }

  public undo(): boolean {
    const cmd = this.undoStack.pop();
    if (!cmd) return false;

    cmd.undo();
    this.redoStack.push(cmd);
    this.notify();
    return true;
  }

  public redo(): boolean {
    const cmd = this.redoStack.pop();
    if (!cmd) return false;

    cmd.execute();
    this.undoStack.push(cmd);
    this.notify();
    return true;
  }

  public canUndo(): boolean {
    return this.undoStack.length > 0;
  }

  public canRedo(): boolean {
    return this.redoStack.length > 0;
  }

  public get isDirty(): boolean {
    return this.undoStack.length !== this.savePointIndex;
  }

  public markClean(): void {
    this.savePointIndex = this.undoStack.length;
    this.notify();
  }

  public clear(): void {
    this.undoStack = [];
    this.redoStack = [];
    this.savePointIndex = 0;
    this.notify();
  }

  public subscribe(listener: HistoryChangeListener): () => void {
    this.listeners.add(listener);
    listener(this.getState());
    return () => this.listeners.delete(listener);
  }

  public getState() {
    const lastCmd = this.undoStack[this.undoStack.length - 1]?.description;
    return {
      canUndo: this.canUndo(),
      canRedo: this.canRedo(),
      isDirty: this.isDirty,
      lastCommand: lastCmd,
    };
  }

  public getHistorySummary(): {
    undo: CommandSummary[];
    redo: CommandSummary[];
  } {
    return {
      undo: this.undoStack.map((c) => ({
        id: c.id,
        description: c.description,
        timestamp: c.timestamp,
      })),
      redo: this.redoStack.map((c) => ({
        id: c.id,
        description: c.description,
        timestamp: c.timestamp,
      })),
    };
  }

  private notify(): void {
    const state = this.getState();
    this.listeners.forEach((fn) => fn(state));
  }
}

export const defaultTransactionManager = new TransactionManager();
