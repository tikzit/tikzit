/**
 * src/services/sync/SyncChannel.ts - Sprint 21
 * CSP-style bounded message channel mediating AST sync between Editor and Canvas.
 * Suppresses cyclic echoes between source typing and canvas graph updates.
 */
import type { GraphAST } from '../../core/domain/types';

export type SyncOrigin = 'editor' | 'canvas' | 'storage' | 'system';

export interface SyncMessage {
  origin: SyncOrigin;
  ast: GraphAST;
  sourceText?: string;
  timestamp: number;
}

export class SyncChannel {
  private lastOrigin: SyncOrigin = 'system';
  private lastTimestamp: number = 0;
  private isMuted: boolean = false;
  private subscribers: Array<(msg: SyncMessage) => void> = [];

  constructor(private debounceMs: number = 16) {}

  public send(origin: SyncOrigin, ast: GraphAST, sourceText?: string): void {
    if (this.isMuted) return;

    // Suppress immediate bounce-backs from the same origin
    const now = Date.now();
    if (this.lastOrigin === origin && now - this.lastTimestamp < this.debounceMs) {
      return;
    }

    this.lastOrigin = origin;
    this.lastTimestamp = now;

    const message: SyncMessage = {
      origin,
      ast,
      sourceText,
      timestamp: now,
    };

    for (const sub of this.subscribers) {
      try {
        sub(message);
      } catch (err) {
        console.warn('[SyncChannel] Subscriber error:', err);
      }
    }
  }

  public subscribe(handler: (msg: SyncMessage) => void): () => void {
    this.subscribers.push(handler);
    return () => {
      this.subscribers = this.subscribers.filter((s) => s !== handler);
    };
  }

  public mute(): void {
    this.isMuted = true;
  }

  public unmute(): void {
    this.isMuted = false;
  }

  public clear(): void {
    this.subscribers = [];
    this.lastOrigin = 'system';
    this.lastTimestamp = 0;
  }
}
