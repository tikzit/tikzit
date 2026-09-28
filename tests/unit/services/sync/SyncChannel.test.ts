import { describe, it, expect, vi } from 'vitest';
import { SyncChannel } from '../../../../src/services/sync/SyncChannel';

describe('Sprint 21: SyncChannel CSP Communication & Anti-Echo Invariant', () => {
  const dummyAST = { nodes: [], edges: [], paths: [], data: [] };

  it('T21-13: transmits messages between distinct origins', () => {
    const channel = new SyncChannel();
    const received: any[] = [];
    channel.subscribe((msg) => received.push(msg));

    channel.send('editor', dummyAST, 'source 1');
    expect(received.length).toBe(1);
    expect(received[0].origin).toBe('editor');
    expect(received[0].sourceText).toBe('source 1');
  });

  it('T21-14: suppresses rapid echo messages from the identical origin within debounce window', () => {
    const channel = new SyncChannel(50);
    const received: any[] = [];
    channel.subscribe((msg) => received.push(msg));

    channel.send('canvas', dummyAST);
    channel.send('canvas', dummyAST); // Immediate duplicate from same origin suppressed

    expect(received.length).toBe(1);
  });

  it('T21-15: mutes and unmutes broadcast without dropping channel subscriptions', () => {
    const channel = new SyncChannel();
    const received: any[] = [];
    channel.subscribe((msg) => received.push(msg));

    channel.mute();
    channel.send('editor', dummyAST);
    expect(received.length).toBe(0);

    channel.unmute();
    channel.send('editor', dummyAST);
    expect(received.length).toBe(1);
  });

  it('T21-16: unsubscription cleanly stops message delivery', () => {
    const channel = new SyncChannel();
    const received: any[] = [];
    const unsubscribe = channel.subscribe((msg) => received.push(msg));

    channel.send('system', dummyAST);
    expect(received.length).toBe(1);

    unsubscribe();
    channel.send('system', dummyAST);
    expect(received.length).toBe(1);
  });
});
