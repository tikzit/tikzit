import React from 'react';
import type { ToolMode } from '../../services/kernel';
import {
  SelectToolIcon,
  VertexToolIcon,
  EdgeToolIcon,
  CropToolIcon,
} from '../common/TikzitIcons';

export interface DesktopToolPaletteProps {
  activeTool: ToolMode;
  onSelectTool: (tool: ToolMode) => void;
  className?: string;
}

export const DesktopToolPalette: React.FC<DesktopToolPaletteProps> = ({
  activeTool,
  onSelectTool,
  className = '',
}) => {
  const tools: Array<{
    mode: ToolMode;
    label: string;
    shortcut: string;
    Icon: React.ComponentType<{ size?: number; className?: string }>;
  }> = [
    { mode: 'select', label: 'Select Tool', shortcut: 'S', Icon: SelectToolIcon },
    { mode: 'vertex', label: 'Vertex Tool', shortcut: 'V, N', Icon: VertexToolIcon },
    { mode: 'edge', label: 'Edge Tool', shortcut: 'E', Icon: EdgeToolIcon },
    { mode: 'bbox', label: 'Crop / Bounding Box Tool', shortcut: 'B', Icon: CropToolIcon },
  ];

  return (
    <div
      role="toolbar"
      aria-label="Tool Palette"
      data-testid="desktop-tool-palette"
      className={`flex items-center space-x-1.5 p-0.5 bg-[#1e1e1e] rounded border border-[#333333] ${className}`}
    >
      {tools.map(({ mode, label, shortcut, Icon }) => {
        const isActive = activeTool === mode;
        return (
          <button
            key={mode}
            type="button"
            onClick={() => onSelectTool(mode)}
            title={`${label} (${shortcut})`}
            data-tool={mode}
            data-active={isActive ? 'true' : 'false'}
            data-testid={`tool-${mode}`}
            className={`w-8 h-8 flex items-center justify-center rounded transition-colors duration-150 select-none ${
              isActive
                ? 'border-2 border-[#00c853] bg-[#3c3c3c] shadow-sm ring-1 ring-[#00c853]/20'
                : 'border border-[#444444] bg-[#2a2a2a] hover:bg-[#383838] hover:border-[#555555]'
            }`}
          >
            <Icon size={20} />
          </button>
        );
      })}
    </div>
  );
};
