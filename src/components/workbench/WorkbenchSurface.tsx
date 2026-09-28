import React from 'react';
import {
  DockviewReact,
  DockviewDefaultTab,
  type DockviewReadyEvent,
  type IDockviewPanelHeaderProps,
} from 'dockview-react';
import { CanvasPanel } from './panels/CanvasPanel';
import { SourcePanel } from './panels/SourcePanel';
import { InspectorPanel } from './panels/InspectorPanel';
import { PreviewPanel } from './panels/PreviewPanel';
import { ConsolePanel } from './panels/ConsolePanel';
import { CorpusExplorerDrawer } from './CorpusExplorerDrawer';
import type { WorkbenchRuntime } from '../../services/createWorkbenchRuntime';

const components = {
  canvas: CanvasPanel,
  source: SourcePanel,
  inspector: InspectorPanel,
  preview: PreviewPanel,
  console: ConsolePanel,
};

// Custom tab component adding .editor-tab class for tab querying and semantic styling
const CustomTabComponent: React.FC<IDockviewPanelHeaderProps> = (props) => (
  <div className="editor-tab flex items-center h-full">
    <DockviewDefaultTab {...props} />
  </div>
);

interface WorkbenchSurfaceProps {
  runtime: WorkbenchRuntime;
  activeHandle: string;
  isDrawerCollapsed: boolean;
  drawerWidth: number;
  isWorkbenchDepressed: boolean;
  panelCount: number;
  theme: 'dark' | 'light';
  onReady(event: DockviewReadyEvent): void;
  onToggleDrawer(): void;
  onResetDrawerWidth(): void;
  onRestore(): void;
}

export const WorkbenchSurface: React.FC<WorkbenchSurfaceProps> = ({
  runtime,
  activeHandle,
  isDrawerCollapsed,
  drawerWidth,
  isWorkbenchDepressed,
  panelCount,
  theme,
  onReady,
  onToggleDrawer,
  onResetDrawerWidth,
  onRestore,
}) => (
  <div className="flex-1 flex overflow-hidden">
    {/* Activity Bar Rail */}
    <nav
      id="activity-bar"
      className="w-12 bg-[#12141a] border-r border-[#2e3446] flex flex-col items-center py-2 space-y-3 z-10 select-none shrink-0"
      aria-label="Activity Bar"
    >
      <button
        id="toggle-source-drawer"
        onClick={onToggleDrawer}
        className="w-8 h-8 rounded flex items-center justify-center text-blue-400 bg-blue-950/40 border border-blue-500/30 hover:bg-blue-900/50 transition-colors"
        title="Toggle Source Drawer (Cmd+B)"
      >
        📐
      </button>
      <button className="w-8 h-8 rounded flex items-center justify-center text-slate-400 hover:text-white hover:bg-[#1a1d26]" title="Styles & Palettes">
        🎨
      </button>
      <button className="w-8 h-8 rounded flex items-center justify-center text-slate-400 hover:text-white hover:bg-[#1a1d26]" title="Corpus Gallery">
        📚
      </button>
      <div className="flex-1" />
      <a
        href="https://github.com/xlp0/tikzit"
        target="_blank"
        rel="noreferrer"
        className="w-8 h-8 rounded flex items-center justify-center text-slate-400 hover:text-white hover:bg-[#1a1d26]"
        title="GitHub Repository (xlp0/tikzit)"
      >
        🐙
      </a>
    </nav>

    {/* Collapsible Source Drawer Island */}
    <CorpusExplorerDrawer
      runtime={runtime}
      activeHandle={activeHandle}
      isCollapsed={isDrawerCollapsed}
      width={drawerWidth}
    />

    {/* Resizable Sash between Drawer and Dockview */}
    {!isDrawerCollapsed && (
      <div
        role="separator"
        aria-orientation="vertical"
        className="w-1 bg-[#2e3446] hover:bg-blue-500 cursor-col-resize select-none transition-colors z-10"
        title="Resize Drawer (Double-click to reset)"
        onDoubleClick={onResetDrawerWidth}
      />
    )}

    {/* Depressed State / Welcome View */}
    {isWorkbenchDepressed && (
      <div className="flex-1 flex flex-col items-center justify-center bg-[#0d1117] p-8 text-center" data-testid="welcome-depressed-view">
        <div className="w-12 h-12 rounded-xl bg-linear-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white text-2xl font-bold mb-4 shadow-lg">
          T
        </div>
        <h2 className="text-lg font-bold text-white mb-2">TikZiT Spatial Workbench Depressed</h2>
        <p className="text-xs text-slate-400 mb-6 max-w-sm">
          The workbench viewport is currently focal-minimized. All {panelCount} panels and open editor tabs are safely preserved in Nanostores and Dockview state.
        </p>
        <button
          data-action="restore-dockview"
          onClick={onRestore}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded text-xs font-semibold shadow-md transition-colors"
        >
          Restore Workbench View
        </button>
      </div>
    )}

    {/* Dockview Container Host */}
    <main
      id="dockview-host"
      className="flex-1 h-full relative"
      data-testid="dockview-host"
      style={{ display: isWorkbenchDepressed ? 'none' : 'block' }}
    >
      <DockviewReact
        components={components}
        defaultTabComponent={CustomTabComponent}
        onReady={onReady}
        className={`${theme === 'dark' ? 'dockview-theme-dark' : 'dockview-theme-light'} h-full w-full`}
      />
    </main>
  </div>
);
