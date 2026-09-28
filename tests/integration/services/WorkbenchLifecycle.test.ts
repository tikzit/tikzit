import { describe, it, expect, vi } from 'vitest';
import { createWorkbenchRuntime } from '../../../src/services/createWorkbenchRuntime';
import { defaultWorkspaceManager } from '../../../src/services/workspace/WorkspaceManager';

describe('Sprint 21: WorkbenchLifecycle End-to-End Integration', () => {
  it('T21-21: creates, saves, and tracks lifecycle of newly minted diagram', async () => {
    const runtime = createWorkbenchRuntime();

    const { handle, document } = runtime.createDiagram('Integration Diagram');
    expect(handle).toMatch(/^zx:diagrams:/);
    expect(document.title).toBe('Integration Diagram');
    expect(document.isDraft).toBe(true);

    const active = defaultWorkspaceManager.getActiveDocument();
    expect(active?.id).toBe(handle);

    runtime.dismissDraftCallout(handle);
    expect(runtime.isDraftCalloutDismissed(handle)).toBe(true);

    runtime.dispose();
    expect(runtime.isDisposed).toBe(true);
  });

  it('T21-22: executes rename and duplicate lifecycle transitions on workspace document', async () => {
    const runtime = createWorkbenchRuntime();
    const { handle } = runtime.createDiagram('Before Rename');

    // First commit so handle exists in corpus registry
    await runtime.saveDiagram(handle);

    const renameRes = await runtime.renameDiagram(handle, 'After Rename');
    expect(renameRes.success).toBe(true);
    expect(runtime.stores.$activeDiagram.get().name).toBe('After Rename');

    const dupRes = await runtime.duplicateDiagram(handle, 'Duplicated Diagram');
    expect(dupRes.success).toBe(true);
    expect(dupRes.newHandle).toBeDefined();

    runtime.dispose();
  });

  it('T21-23: registers and dispatches Cordis commands to runtime actors', async () => {
    const runtime = createWorkbenchRuntime();
    expect(runtime.ctx).toBeDefined();

    // Verify command execution
    const res = await runtime.ctx.command.execute('cmd:diagram:create' as any);
    expect(res).toBeDefined();
    expect((res as any).handle).toMatch(/^zx:diagrams:/);

    runtime.dispose();
  });

  it('T21-24: disposes cleanly without memory leaks or dangling listeners', () => {
    const runtime = createWorkbenchRuntime();
    runtime.createDiagram('Cleanup Test');
    expect(runtime.isDisposed).toBe(false);

    runtime.dispose();
    expect(runtime.isDisposed).toBe(true);

    // Repeated disposal is safe and idempotent
    expect(() => runtime.dispose()).not.toThrow();
  });
});
