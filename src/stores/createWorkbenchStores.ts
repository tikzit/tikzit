import { atom, map, type WritableAtom, type MapStore } from 'nanostores';
import type { ToolMode } from '../services/kernel';
import type { GraphAST, TikzStylesCatalog } from '../core/domain/types';
import { getDefaultStylesCatalog } from '../core/styles/presets';
import { createEmptyAST } from '../core/parser/parser';
import type { CorpusEntry, CorpusIndexIssue, CorpusCommitResult } from '../services/clm/corpusExplorerService';

export interface SelectionState {
  nodes: string[];
  edges: string[];
}

export interface WorkbenchLayoutState {
  isDrawerCollapsed: boolean;
  drawerWidth: number;
  isWorkbenchDepressed: boolean;
  panelCount: number;
  tabsMenuOpen: boolean;
  themeMenuOpen: boolean;
}

export interface ActiveDiagramState {
  name: string;
  handle: string;
}

export interface DocumentHeadState {
  handle: string;
  hash: string;
  sequence: number;
  isValid: boolean;
  lastCommittedAt?: number;
  lastPersistedAt?: number;
}

export interface CorpusViewState {
  status: 'loading' | 'ready' | 'error';
  persistence: 'loading' | 'persistent' | 'non-persistent' | 'recovery-required' | 'stale';
  persistenceError?: string;
  seedFailures: CorpusIndexIssue[];
}

export interface SessionRecoveryState {
  recoveredCount: number;
  dirtyHandles: string[];
  announcement?: string;
  showArchived: boolean;
}

export interface DiagramSaveState {
  isSaving: boolean;
  lastResult?: CorpusCommitResult | null;
  error?: string;
  operationId?: string;
}

export interface ExportDialogState {
  isOpen: boolean;
  targetHandle?: string;
  targetTitle?: string;
  currentSource?: string;
  savedSource?: string;
  isDirty?: boolean;
  version?: number;
  isDraft?: boolean;
  lastAnnouncement?: string;
}

export interface ExportCollectionDialogState {
  isOpen: boolean;
  summary: import('../services/clm/corpusExportService').CollectionExportSummary | null;
  progress: 'idle' | 'verifying' | 'writing' | 'done';
  outcome: 'idle' | 'saved' | 'cancelled' | 'fallback' | 'write-failed' | 'verification-failed';
  errorMessage?: string;
  failingHandle?: string;
  filename?: string;
  receiptPersisted?: boolean;
  lastAnnouncement?: string;
}

export interface WorkbenchStores {
  readonly $corpusQuery: WritableAtom<string>;
  readonly $corpusEntries: WritableAtom<CorpusEntry[]>;
  readonly $corpusView: WritableAtom<CorpusViewState>;
  readonly $sessionRecovery: WritableAtom<SessionRecoveryState>;
  readonly $toolMode: WritableAtom<ToolMode>;
  readonly $theme: WritableAtom<'dark' | 'light'>;
  readonly $selectedElements: MapStore<SelectionState>;
  readonly $workbenchLayout: MapStore<WorkbenchLayoutState>;
  readonly $activeDiagram: WritableAtom<ActiveDiagramState>;
  readonly $graphAST: WritableAtom<GraphAST>;
  readonly $documentHead: WritableAtom<DocumentHeadState>;
  readonly $stylesCatalog: WritableAtom<TikzStylesCatalog>;
  readonly $activeStyle: WritableAtom<string>;
  readonly $styleFileName: WritableAtom<string>;
  readonly $styleFileBuffer: WritableAtom<string>;
  readonly $diagramSaveState: MapStore<Record<string, DiagramSaveState>>;
  readonly $dismissedDraftCallouts: WritableAtom<string[]>;
  readonly $exportDialogState: WritableAtom<ExportDialogState>;
  readonly $exportCollectionDialogState: WritableAtom<ExportCollectionDialogState>;
}

/**
 * Factory function creating an isolated, hermetic set of Nanostores stores.
 * Prevents cross-test pollution and enables multi-instance workbench tabs.
 */
export function createWorkbenchStores(): WorkbenchStores {
  return {
    $corpusQuery: atom(''),
    $corpusEntries: atom<CorpusEntry[]>([]),
    $corpusView: atom<CorpusViewState>({
      status: 'loading',
      persistence: 'loading',
      seedFailures: [],
    }),
    $sessionRecovery: atom<SessionRecoveryState>({
      recoveredCount: 0,
      dirtyHandles: [],
      announcement: '',
      showArchived: false,
    }),
    $toolMode: atom<ToolMode>('select'),
    $theme: atom<'dark' | 'light'>('dark'),
    $selectedElements: map<SelectionState>({ nodes: [], edges: [] }),
    $workbenchLayout: map<WorkbenchLayoutState>({
      isDrawerCollapsed: false,
      drawerWidth: 260,
      isWorkbenchDepressed: false,
      panelCount: 0,
      tabsMenuOpen: false,
      themeMenuOpen: false,
    }),
    $activeDiagram: atom<ActiveDiagramState>({
      name: '01_spider_fusion.tikz',
      handle: '',
    }),
    $graphAST: atom<GraphAST>(createEmptyAST()),
    $documentHead: atom<DocumentHeadState>({
      handle: '',
      hash: '',
      sequence: 0,
      isValid: true,
    }),
    $stylesCatalog: atom<TikzStylesCatalog>(getDefaultStylesCatalog()),
    $activeStyle: atom<string>('Z'),
    $styleFileName: atom<string>('[no styles]'),
    $styleFileBuffer: atom<string>(''),
    $diagramSaveState: map<Record<string, DiagramSaveState>>({}),
    $dismissedDraftCallouts: atom<string[]>([]),
    $exportDialogState: atom<ExportDialogState>({ isOpen: false }),
    $exportCollectionDialogState: atom<ExportCollectionDialogState>({
      isOpen: false,
      summary: null,
      progress: 'idle',
      outcome: 'idle',
    }),
  };
}
