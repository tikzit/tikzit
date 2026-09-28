import React from 'react';
import { atom } from 'nanostores';
import { useStore } from '@nanostores/react';
import type { IDockviewPanelProps } from 'dockview-react';
import { useWorkbenchRuntime } from '../WorkbenchRuntimeContext';
import { formatContentId } from '../../../services/clm/corpusExplorerService';
import type { DocumentHeadState } from '../../../stores/createWorkbenchStores';

const emptyDocumentHead = atom<DocumentHeadState>({ handle: '', hash: '', sequence: 0, isValid: true });

export const ConsolePanel: React.FC<IDockviewPanelProps> = () => {
  let runtime: ReturnType<typeof useWorkbenchRuntime> | null = null;
  try {
    runtime = useWorkbenchRuntime();
  } catch {
    // outside provider fallback
  }
  const head = useStore(runtime ? runtime.stores.$documentHead : emptyDocumentHead);
  const cid = head.hash ? formatContentId(head.hash) : 'uncommitted';
  return (
    <div className="w-full h-full bg-[#0f1117] p-2.5 font-mono text-[11px] text-[#94a3b8] overflow-y-auto space-y-1" data-testid="panel-console" data-panel="console">
      <div className="text-emerald-400">[INIT] TikZiT Web Runtime v2.2.0 initialized.</div>
      <div className="text-blue-400">[CORDIS] Service mesh context mounted. Services: graph, parser, styles, mcard.</div>
      <div className="text-slate-400" data-testid="console-mcard-cid">[CLM] Active MCard CID: {cid} (sequence: {head.sequence})</div>
      <div className="text-slate-500">[AST] Canvas renders the active document's committed graph.</div>
    </div>
  );
};
