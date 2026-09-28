/**
 * src/components/workbench/MacWindowChrome.tsx - Sprint 22
 * Decomposed Mac window chrome coordinating DocumentTitleBar, DesktopToolPalette, and action buttons.
 * Preserves all Contract B selectors.
 */
import React from 'react';
import type { ToolMode } from '../../services/kernel';
import type { WorkbenchRuntime } from '../../services/createWorkbenchRuntime';
import { DesktopToolPalette } from './DesktopToolPalette';
import { DocumentTitleBar } from './commandbar/DocumentTitleBar';
import { VersionHistoryButton } from './commandbar/DocumentActionButtons';

export interface MacWindowChromeProps {
  runtime?: WorkbenchRuntime;
  documentTitle: string;
  isDirty?: boolean;
  docBadge?: 'Draft' | 'Diagram' | 'Example';
  saveStatusText?: string;
  saveError?: string;
  isSessionOnly?: boolean;
  onRetryFlush?: () => void;
  onSave?: () => void;
  isSaving?: boolean;
  buttonKind?: 'save-draft' | 'save-diagram' | 'none';
  buttonLabel?: string;
  buttonTooltip?: string;
  showSuccessPill?: boolean;
  activeTool: ToolMode;
  onSelectTool: (tool: ToolMode) => void;
  canUndo: boolean;
  canRedo: boolean;
  onUndo: () => void;
  onRedo: () => void;
  showVersionPopover: boolean;
  onToggleVersionPopover: () => void;
  activeDocId?: string;
  tabsMenuOpen: boolean;
  onToggleTabsMenu: () => void;
  onCloseOthers: () => void;
  onCloseAll: () => void;
  onCloseActiveTab?: () => void;
  onResetLayout: () => void;
  theme: 'dark' | 'light';
  themeMenuOpen: boolean;
  onToggleThemeMenu: () => void;
  onSetTheme: (theme: 'dark' | 'light') => void;
  onNewDiagram: () => void;
  onExport?: () => void;
}

export const MacWindowChrome: React.FC<MacWindowChromeProps> = ({
  runtime,
  documentTitle,
  isDirty = false,
  docBadge,
  saveStatusText,
  saveError,
  isSessionOnly = false,
  onRetryFlush,
  onSave,
  isSaving = false,
  buttonKind = 'none',
  buttonLabel,
  buttonTooltip,
  showSuccessPill = false,
  activeTool,
  onSelectTool,
  canUndo,
  canRedo,
  onUndo,
  onRedo,
  showVersionPopover,
  onToggleVersionPopover,
  activeDocId,
  tabsMenuOpen,
  onToggleTabsMenu,
  onCloseOthers,
  onCloseAll,
  onCloseActiveTab,
  onResetLayout,
  theme,
  themeMenuOpen,
  onToggleThemeMenu,
  onSetTheme,
  onNewDiagram,
  onExport,
}) => {
  return (
    <header data-testid="mac-window-chrome" className="relative h-10 bg-[#2a2a2a] border-b border-[#383838] px-3 flex items-center justify-between z-[100] select-none text-slate-200">
      {/* Left side: Document Lifecycle & Active Document Title */}
      <DocumentTitleBar
        documentTitle={documentTitle}
        isDirty={isDirty}
        docBadge={docBadge}
        saveStatusText={saveStatusText}
        saveError={saveError}
        isSessionOnly={isSessionOnly}
        onRetryFlush={onRetryFlush}
        showSuccessPill={showSuccessPill}
        buttonKind={buttonKind}
        buttonLabel={buttonLabel}
        buttonTooltip={buttonTooltip}
        isSaving={isSaving}
        onSave={onSave}
        onCloseActiveTab={onCloseActiveTab}
        onNewDiagram={onNewDiagram}
      />

      {/* Center: Canvas Drawing Tools */}
      <div
        data-testid="center-toolbar-zone"
        className="absolute left-1/2 -translate-x-1/2 flex items-center justify-center pointer-events-auto"
      >
        <DesktopToolPalette activeTool={activeTool} onSelectTool={onSelectTool} />
      </div>

      {/* Right side: Absorbed Actions (Undo/Redo, History, Tabs, Layout, Theme) */}
      <div className="flex items-center space-x-2 z-10">
        {/* Undo / Redo */}
        <div className="flex items-center bg-[#1e1e1e] rounded p-0.5 border border-[#383838] space-x-0.5">
          <button
            type="button"
            onClick={onUndo}
            disabled={!canUndo}
            data-testid="btn-toolbar-undo"
            title="Undo (Cmd+Z)"
            className={`px-2 py-1 rounded text-xs transition-colors ${
              canUndo ? 'text-slate-200 hover:bg-[#333333]' : 'text-slate-600 cursor-not-allowed'
            }`}
          >
            ↶ Undo
          </button>
          <button
            type="button"
            onClick={onRedo}
            disabled={!canRedo}
            data-testid="btn-toolbar-redo"
            title="Redo (Cmd+Shift+Z)"
            className={`px-2 py-1 rounded text-xs transition-colors ${
              canRedo ? 'text-slate-200 hover:bg-[#333333]' : 'text-slate-600 cursor-not-allowed'
            }`}
          >
            ↷ Redo
          </button>
        </div>

        {/* Version History Popover Toggle */}
        <VersionHistoryButton
          showVersionPopover={showVersionPopover}
          onToggleVersionPopover={onToggleVersionPopover}
          runtime={runtime}
          activeDocId={activeDocId}
        />

        {/* Export Diagram Action */}
        {onExport && (
          <button
            type="button"
            onClick={onExport}
            data-testid="btn-export-diagram"
            className="text-xs text-slate-300 hover:text-white px-2 py-1 rounded bg-[#333333] hover:bg-[#444444] border border-[#444444] transition-colors flex items-center space-x-1"
            title="Export Diagram (TikZ, TeX, SVG, PNG, PDF)"
          >
            <span>⤓ Export</span>
          </button>
        )}

        {/* Tab Actions Menu */}
        <div className="relative">
          <button
            type="button"
            onClick={onToggleTabsMenu}
            className="text-xs text-slate-300 hover:text-white px-2 py-1 rounded bg-[#333333] hover:bg-[#444444] border border-[#444444] transition-colors"
            title="More Editor Tab Actions"
            data-testid="editor-tabs-more-actions-btn"
          >
            ⋯
          </button>
          {tabsMenuOpen && (
            <div
              className="absolute right-0 top-full mt-1 bg-[#222222] border border-[#383838] shadow-xl rounded py-1 z-50 text-xs text-slate-200 min-w-[120px]"
              data-testid="tabs-more-actions-dropdown"
            >
              <button
                type="button"
                onClick={onCloseOthers}
                className="w-full text-left px-3 py-1.5 hover:bg-[#333333] hover:text-white transition-colors"
                data-testid="tabs-close-others-btn"
              >
                Close Others
              </button>
              <button
                type="button"
                onClick={onCloseAll}
                className="w-full text-left px-3 py-1.5 hover:bg-[#333333] hover:text-white transition-colors"
                data-testid="tabs-close-all-btn"
              >
                Close All
              </button>
            </div>
          )}
        </div>

        {/* Reset Layout */}
        <button
          type="button"
          onClick={onResetLayout}
          className="text-xs text-slate-300 hover:text-white px-2 py-1 rounded bg-[#333333] hover:bg-[#444444] border border-[#444444] transition-colors"
          title="Reset to default 4-panel layout"
          data-testid="btn-reset-layout"
        >
          Reset Layout
        </button>

        {/* Theme Selector Button & Menu */}
        <div className="relative">
          <button
            type="button"
            id="theme-selector-btn"
            data-testid="btn-theme-toggle"
            onClick={onToggleThemeMenu}
            className="text-xs text-slate-300 hover:text-white px-2 py-1 rounded bg-[#333333] hover:bg-[#444444] border border-[#444444] transition-colors"
            title="Toggle or Select Dark/Light Theme"
          >
            {theme === 'dark' ? '☀️ Light' : '🌙 Dark'}
          </button>
          {themeMenuOpen && (
            <div className="absolute right-0 top-full mt-1 bg-[#222222] border border-[#383838] shadow-xl rounded py-1 z-50 text-xs text-slate-200 min-w-[110px]">
              <button
                type="button"
                data-theme="dark"
                onClick={() => onSetTheme('dark')}
                className="w-full text-left px-3 py-1.5 hover:bg-[#333333] hover:text-white transition-colors"
              >
                🌙 Dark
              </button>
              <button
                type="button"
                data-theme="light"
                onClick={() => onSetTheme('light')}
                className="w-full text-left px-3 py-1.5 hover:bg-[#333333] hover:text-white transition-colors"
              >
                ☀️ Light
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
