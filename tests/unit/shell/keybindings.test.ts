import { describe, expect, it } from 'vitest';
import { createKernelContext } from '../../../src/services/kernel';
import { createKeybindingDispatcher } from '../../../src/services/keybindings';

function createEmitter() {
  const listeners = new Set<(event: any) => void>();
  return {
    addEventListener(_type: string, listener: (event: any) => void) {
      listeners.add(listener);
    },
    removeEventListener(_type: string, listener: (event: any) => void) {
      listeners.delete(listener);
    },
    fire(event: any) {
      for (const listener of [...listeners]) listener(event);
    },
  };
}

describe('keybinding dispatcher', () => {
  it('does not change the active tool for Meta/Ctrl+S (save is handled elsewhere)', () => {
    const ctx = createKernelContext();
    const emitter = createEmitter();
    const dispose = createKeybindingDispatcher(ctx, emitter);
    ctx.tool.setTool('vertex');

    emitter.fire({ key: 's', metaKey: true, preventDefault: () => undefined });
    emitter.fire({ key: 's', ctrlKey: true, preventDefault: () => undefined });

    expect(ctx.tool.current).toBe('vertex');
    dispose();
  });

  it('still maps a bare S keypress to the select tool', () => {
    const ctx = createKernelContext();
    const emitter = createEmitter();
    const dispose = createKeybindingDispatcher(ctx, emitter);
    ctx.tool.setTool('vertex');

    emitter.fire({ key: 's' });

    expect(ctx.tool.current).toBe('select');
    dispose();
  });
});
