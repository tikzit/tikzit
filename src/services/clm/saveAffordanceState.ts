import type { DocumentRecord } from '../workspace/WorkspaceManager';
import type {
  DocumentHeadState,
  CorpusViewState,
  DiagramSaveState,
} from '../../stores/createWorkbenchStores';
import { isDiagramHandle } from './corpusPersistence';

export interface DiagramSaveAffordance {
  handle: string;
  isDraft: boolean;
  isDiagram: boolean;
  isExample: boolean;
  isDirty: boolean;
  isSaving: boolean;
  isSessionOnly: boolean;
  isBlocked: boolean;
  blockedReason?: string;
  buttonKind: 'save-draft' | 'save-diagram' | 'none';
  buttonLabel: string;
  buttonTooltip: string;
  statusText: string;
  showCallout: boolean;
  canRetryFlush: boolean;
  error?: string;
  versionNumber: number;
}

export interface SelectDiagramSaveStateOptions {
  handle?: string;
  workspaceDoc?: DocumentRecord;
  documentHead?: DocumentHeadState;
  corpusView?: CorpusViewState;
  saveState?: DiagramSaveState;
  isDismissed?: boolean;
  historyStateIsDirty?: boolean;
}

export function selectDiagramSaveState(
  options: SelectDiagramSaveStateOptions
): DiagramSaveAffordance {
  const handle = options.handle || options.workspaceDoc?.id || '';
  const isCorpusDiagram = isDiagramHandle(handle);
  const isExample = handle.startsWith('zx:examples:');

  const isDraft = isCorpusDiagram && !options.workspaceDoc?.hash;
  const isDiagram = isCorpusDiagram && Boolean(options.workspaceDoc?.hash);
  const isSaving = Boolean(options.saveState?.isSaving);
  const isDirty = Boolean(options.workspaceDoc ? options.workspaceDoc.isDirty : options.historyStateIsDirty);

  const persistence = options.corpusView?.persistence;
  const isBlocked = persistence === 'stale' || persistence === 'recovery-required';
  const blockedReason = isBlocked
    ? persistence === 'stale'
      ? 'A newer version was saved in another window. Please reload to see the latest changes.'
      : 'Corpus storage requires recovery before further changes can be saved.'
    : undefined;

  const isSessionOnly =
    !isBlocked &&
    (persistence === 'non-persistent' || Boolean(options.corpusView?.persistenceError));

  let buttonKind: 'save-draft' | 'save-diagram' | 'none' = 'none';
  if (isBlocked) {
    buttonKind = 'none';
  } else if (isDraft) {
    buttonKind = 'save-draft';
  } else if ((isDiagram || isExample) && isDirty) {
    buttonKind = 'save-diagram';
  }

  let buttonLabel = '';
  if (isSaving) {
    buttonLabel = 'Saving…';
  } else if (buttonKind === 'save-draft') {
    buttonLabel = 'Save to MCard';
  } else if (buttonKind === 'save-diagram') {
    buttonLabel = 'Save';
  }

  let buttonTooltip = '';
  if (buttonKind === 'save-draft') {
    buttonTooltip = 'Save this diagram to MCard history in this browser';
  } else if (buttonKind === 'save-diagram') {
    buttonTooltip = 'Save changes to MCard history';
  }

  const versionNumber = options.workspaceDoc?.version ?? options.documentHead?.sequence ?? 1;

  let statusText = '';
  if (isSaving) {
    statusText = 'saving…';
  } else if (isBlocked) {
    statusText = persistence === 'stale' ? 'stale · reload required' : 'recovery required';
  } else if (isDraft || isDirty) {
    statusText = 'unsaved';
  } else if (isSessionOnly) {
    statusText = 'saved in this session only';
  } else if (options.documentHead?.lastPersistedAt || options.workspaceDoc?.hash) {
    const vText = `v${versionNumber}`;
    const tText = options.workspaceDoc?.updatedAt
      ? new Date(options.workspaceDoc.updatedAt).toLocaleTimeString([], {
          hour: '2-digit',
          minute: '2-digit',
        })
      : '';
    statusText = tText ? `saved · ${vText} · ${tText}` : `saved · ${vText}`;
  }

  const showCallout = isDraft && !options.isDismissed && !isSaving && !isBlocked;
  const canRetryFlush = isSessionOnly && !isSaving;

  return {
    handle,
    isDraft,
    isDiagram,
    isExample,
    isDirty,
    isSaving,
    isSessionOnly,
    isBlocked,
    blockedReason,
    buttonKind,
    buttonLabel,
    buttonTooltip,
    statusText,
    showCallout,
    canRetryFlush,
    error: options.saveState?.error,
    versionNumber,
  };
}
