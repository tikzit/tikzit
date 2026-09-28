import React, { useRef } from 'react';
import {
  NewDocumentIcon,
  OpenDocumentIcon,
  EditDocumentIcon,
  RefreshIcon,
} from '../common/TikzitIcons';

export interface DesktopStyleActionBarProps {
  styleFileName: string;
  hasStyles: boolean;
  onNew: () => void;
  onOpen: (fileName: string, content: string) => void;
  onEdit: () => void;
  onRefresh: () => void;
  className?: string;
}

export const DesktopStyleActionBar: React.FC<DesktopStyleActionBarProps> = ({
  styleFileName,
  hasStyles,
  onNew,
  onOpen,
  onEdit,
  onRefresh,
  className = '',
}) => {
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const handleOpenClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      if (text !== undefined) {
        onOpen(file.name, text);
      }
    };
    reader.readAsText(file);
    // Reset so same file can be reopened if needed
    e.target.value = '';
  };

  const handleEditClick = () => {
    // Desktop TikZiT Parity (stylepalette.cpp:215-224):
    // Guard edit if stylesheet is empty / [no styles]
    if (!hasStyles && styleFileName === '[no styles]') {
      alert('No styles loaded. Please open or create a stylesheet first.');
      return;
    }
    onEdit();
  };

  return (
    <div
      data-testid="desktop-style-action-bar"
      className={`flex flex-col space-y-1.5 p-2 bg-[#1e1e1e] border-b border-[#2e2e2e] ${className}`}
    >
      {/* Hidden File Input for .tikzstyles */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".tikzstyles"
        className="hidden"
        data-testid="style-file-input"
        onChange={handleFileChange}
      />

      {/* Stylesheet File Name Label */}
      <div className="flex items-center justify-between text-xs select-none">
        <span
          data-testid="style-file-label"
          className="italic text-slate-300 font-serif tracking-wide truncate max-w-[200px]"
          title={styleFileName}
        >
          {styleFileName || '[no styles]'}
        </span>
      </div>

      {/* 4-Icon Toolbar (stylepalette.ui:77-142: iconSize 16x16) */}
      <div
        role="toolbar"
        aria-label="Style Palette Actions"
        className="flex items-center space-x-1"
      >
        <button
          type="button"
          onClick={onNew}
          title="New Stylesheet (Clear)"
          data-testid="style-action-new"
          className="w-7 h-7 flex items-center justify-center rounded bg-[#2a2a2a] hover:bg-[#383838] border border-[#3e3e3e] text-slate-200 hover:text-white transition-colors"
        >
          <NewDocumentIcon size={16} />
        </button>

        <button
          type="button"
          onClick={handleOpenClick}
          title="Open Stylesheet (.tikzstyles)"
          data-testid="style-action-open"
          className="w-7 h-7 flex items-center justify-center rounded bg-[#2a2a2a] hover:bg-[#383838] border border-[#3e3e3e] text-slate-200 hover:text-white transition-colors"
        >
          <OpenDocumentIcon size={16} />
        </button>

        <button
          type="button"
          onClick={handleEditClick}
          id="open-style-editor-btn"
          title="Edit Stylesheet"
          data-testid="style-action-edit"
          className="w-7 h-7 flex items-center justify-center rounded bg-[#2a2a2a] hover:bg-[#383838] border border-[#3e3e3e] text-slate-200 hover:text-white transition-colors"
        >
          <EditDocumentIcon size={16} />
        </button>

        <button
          type="button"
          onClick={onRefresh}
          title="Refresh / Reload Stylesheet"
          data-testid="style-action-refresh"
          className="w-7 h-7 flex items-center justify-center rounded bg-[#2a2a2a] hover:bg-[#383838] border border-[#3e3e3e] text-slate-200 hover:text-white transition-colors"
        >
          <RefreshIcon size={16} />
        </button>
      </div>
    </div>
  );
};
