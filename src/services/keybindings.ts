import type { Context } from 'cordis';

export interface TargetLike {
  tagName?: string;
  isContentEditable?: boolean;
  closest?: (selector: string) => any;
}

/**
 * Check if the active keyboard event target should suppress global shortcuts
 */
export function isInputSuppressed(target: any): boolean {
  if (!target) return false;
  const tag = String(target.tagName || '').toUpperCase();
  if (['INPUT', 'TEXTAREA', 'SELECT'].includes(tag)) return true;
  if (target.isContentEditable) return true;
  if (typeof target.closest === 'function' && target.closest('.cm-editor, .monaco-editor')) return true;
  return false;
}

export interface EventTargetEmitter {
  addEventListener(type: string, listener: (e: any) => void): void;
  removeEventListener(type: string, listener: (e: any) => void): void;
}

/**
 * Global keybinding dispatcher matching desktop TikZiT hotkeys
 */
export function createKeybindingDispatcher(
  ctx: Context,
  targetWindow?: EventTargetEmitter
): () => void {
  const emitter: EventTargetEmitter =
    targetWindow || (typeof window !== 'undefined' ? window : ({} as any));

  if (!emitter || typeof emitter.addEventListener !== 'function') {
    return () => {};
  }

  const handleKeyDown = (e: any) => {
    if (isInputSuppressed(e.target)) {
      return;
    }

    const key = String(e.key || '').toLowerCase();
    const isMetaOrCtrl = !!(e.metaKey || e.ctrlKey);

    // Command shortcuts with Meta/Ctrl
    if (isMetaOrCtrl) {
      if (key === 'b') {
        if (typeof e.preventDefault === 'function') e.preventDefault();
        if (ctx.command.has('cmd:view:sidebar')) {
          ctx.command.execute('cmd:view:sidebar');
        }
        return;
      }
      if (key === 'z') {
        if (typeof e.preventDefault === 'function') e.preventDefault();
        if (e.shiftKey) {
          if (ctx.command.has('cmd:edit:redo')) ctx.command.execute('cmd:edit:redo');
        } else {
          if (ctx.command.has('cmd:edit:undo')) ctx.command.execute('cmd:edit:undo');
        }
        return;
      }
      if (key === '\\') {
        if (typeof e.preventDefault === 'function') e.preventDefault();
        if (ctx.command.has('cmd:view:split')) ctx.command.execute('cmd:view:split');
        return;
      }
      if (e.key === '`') {
        if (typeof e.preventDefault === 'function') e.preventDefault();
        if (ctx.command.has('cmd:view:panel')) ctx.command.execute('cmd:view:panel');
        return;
      }
      return;
    }

    // Single-key tool selection shortcuts matching desktop TikZiT
    switch (key) {
      case 's':
        ctx.tool.setTool('select');
        break;
      case 'v':
      case 'n':
        ctx.tool.setTool('vertex');
        break;
      case 'e':
        ctx.tool.setTool('edge');
        break;
      case 'b':
        ctx.tool.setTool('bbox');
        break;
      case 'backspace':
      case 'delete':
        if (typeof e.preventDefault === 'function') e.preventDefault();
        if (ctx.command.has('cmd:edit:delete')) {
          ctx.command.execute('cmd:edit:delete');
        }
        break;
    }
  };

  emitter.addEventListener('keydown', handleKeyDown);
  return () => {
    emitter.removeEventListener('keydown', handleKeyDown);
  };
}
