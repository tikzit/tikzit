import { describe, it, expect } from 'vitest';
import { selectDiagramSaveState } from '../../../src/services/clm/saveAffordanceState';
import type { DocumentRecord } from '../../../src/services/workspace/WorkspaceManager';

describe('selectDiagramSaveState', () => {
  const mockDraftDoc: DocumentRecord = {
    id: 'zx:diagrams:12345678-0000-0000-0000-000000000000',
    title: 'Untitled.tikz',
    content: '\\begin{tikzpicture}\n\\end{tikzpicture}\n',
    hash: '',
    version: 0,
    isDirty: true,
    isDraft: true,
    createdAt: 1000,
    updatedAt: 1000,
  };

  const mockSavedDoc: DocumentRecord = {
    id: 'zx:diagrams:12345678-0000-0000-0000-000000000000',
    title: 'Diagram.tikz',
    content: '\\begin{tikzpicture}\n\\node (0) at (0, 0) {A};\n\\end{tikzpicture}\n',
    hash: 'a'.repeat(64),
    version: 1,
    isDirty: false,
    isDraft: false,
    createdAt: 1000,
    updatedAt: 2000,
  };

  const mockExampleDoc: DocumentRecord = {
    id: 'zx:examples:01_spider_fusion',
    title: '01_spider_fusion.tikz',
    content: '\\begin{tikzpicture}\n\\end{tikzpicture}\n',
    hash: 'b'.repeat(64),
    version: 1,
    isDirty: false,
    isDraft: false,
    createdAt: 1000,
    updatedAt: 2000,
  };

  it('selects Draft state correctly for newly created diagram', () => {
    const res = selectDiagramSaveState({
      workspaceDoc: mockDraftDoc,
    });

    expect(res.isDraft).toBe(true);
    expect(res.isDiagram).toBe(false);
    expect(res.buttonKind).toBe('save-draft');
    expect(res.buttonLabel).toBe('Save to MCard');
    expect(res.statusText).toBe('unsaved');
    expect(res.showCallout).toBe(true);
    expect(res.canRetryFlush).toBe(false);
  });

  it('hides callout when draft callout is marked dismissed', () => {
    const res = selectDiagramSaveState({
      workspaceDoc: mockDraftDoc,
      isDismissed: true,
    });

    expect(res.isDraft).toBe(true);
    expect(res.buttonKind).toBe('save-draft');
    expect(res.showCallout).toBe(false);
  });

  it('reflects saving pending state across button label, status text, and hides callout', () => {
    const res = selectDiagramSaveState({
      workspaceDoc: mockDraftDoc,
      saveState: { isSaving: true },
    });

    expect(res.isSaving).toBe(true);
    expect(res.buttonLabel).toBe('Saving…');
    expect(res.statusText).toBe('saving…');
    expect(res.showCallout).toBe(false);
  });

  it('hides save button for committed clean diagram', () => {
    const res = selectDiagramSaveState({
      workspaceDoc: mockSavedDoc,
      documentHead: {
        handle: mockSavedDoc.id,
        hash: mockSavedDoc.hash,
        sequence: 1,
        isValid: true,
        lastPersistedAt: 3000,
      },
    });

    expect(res.isDraft).toBe(false);
    expect(res.isDiagram).toBe(true);
    expect(res.isDirty).toBe(false);
    expect(res.buttonKind).toBe('none');
    expect(res.showCallout).toBe(false);
    expect(res.statusText).toContain('saved · v1');
  });

  it('shows Save button when committed diagram is edited dirty', () => {
    const dirtyDoc = { ...mockSavedDoc, isDirty: true };
    const res = selectDiagramSaveState({
      workspaceDoc: dirtyDoc,
    });

    expect(res.isDraft).toBe(false);
    expect(res.isDiagram).toBe(true);
    expect(res.isDirty).toBe(true);
    expect(res.buttonKind).toBe('save-diagram');
    expect(res.buttonLabel).toBe('Save');
    expect(res.statusText).toBe('unsaved');
  });

  it('shows Save button when example diagram is edited dirty', () => {
    const dirtyExample = { ...mockExampleDoc, isDirty: true };
    const res = selectDiagramSaveState({
      workspaceDoc: dirtyExample,
    });

    expect(res.isExample).toBe(true);
    expect(res.isDirty).toBe(true);
    expect(res.buttonKind).toBe('save-diagram');
    expect(res.buttonLabel).toBe('Save');
    expect(res.statusText).toBe('unsaved');
  });

  it('surfaces session-only warning and allows retry when flush failed', () => {
    const res = selectDiagramSaveState({
      workspaceDoc: mockSavedDoc,
      corpusView: {
        status: 'ready',
        persistence: 'non-persistent',
        persistenceError: 'Disk quota exceeded',
        seedFailures: [],
      },
    });

    expect(res.isSessionOnly).toBe(true);
    expect(res.statusText).toBe('saved in this session only');
    expect(res.canRetryFlush).toBe(true);
  });

  it('blocks mutations when state is stale or recovery-required', () => {
    const resStale = selectDiagramSaveState({
      workspaceDoc: mockDraftDoc,
      corpusView: {
        status: 'ready',
        persistence: 'stale',
        seedFailures: [],
      },
    });

    expect(resStale.isBlocked).toBe(true);
    expect(resStale.buttonKind).toBe('none');
    expect(resStale.statusText).toBe('stale · reload required');
    expect(resStale.showCallout).toBe(false);

    const resRec = selectDiagramSaveState({
      workspaceDoc: mockDraftDoc,
      corpusView: {
        status: 'ready',
        persistence: 'recovery-required',
        seedFailures: [],
      },
    });

    expect(resRec.isBlocked).toBe(true);
    expect(resRec.buttonKind).toBe('none');
    expect(resRec.statusText).toBe('recovery required');
  });
});
