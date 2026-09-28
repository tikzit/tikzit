import React from 'react';
import type { TikzStyle } from '../../core/domain/types';
import {
  getStyleFillColor,
  getStyleStrokeColor,
  getStyleShape,
  isStyleDashed,
} from '../../core/styles/TikzStyleModel';

export interface DesktopSwatchGridProps {
  title: string;
  styles: TikzStyle[];
  activeStyle: string;
  isEdgeSection?: boolean;
  onSelectStyle: (styleName: string) => void;
  onApplyStyle: (styleName: string) => void;
  className?: string;
}

export const DesktopSwatchGrid: React.FC<DesktopSwatchGridProps> = ({
  title,
  styles,
  activeStyle,
  isEdgeSection = false,
  onSelectStyle,
  onApplyStyle,
  className = '',
}) => {
  // Desktop TikZiT Parity (stylelist.cpp:5-12, 79-99):
  // Synthetic 'none' style is ALWAYS pinned at index 0
  const effectiveStyles = [
    {
      name: 'none',
      data: [{ key: 'style', value: 'none' }],
      category: '',
    } as TikzStyle,
    ...styles.filter((s) => s.name !== 'none'),
  ];

  return (
    <div className={`flex flex-col bg-[#181818] p-2 ${className}`}>
      {/* Section Header */}
      <div className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1.5 select-none">
        {title}
      </div>

      {/* 48x48 Icon Grid (stylepalette.cpp:39-53: QListView::IconMode, 48x48) */}
      <div className="grid grid-cols-[repeat(auto-fill,48px)] gap-2">
        {effectiveStyles.map((s) => {
          const isNone = s.name === 'none';
          const fill = getStyleFillColor(s);
          const stroke = getStyleStrokeColor(s);
          const shape = getStyleShape(s);
          const isDashed = isStyleDashed(s);
          const isActive = activeStyle === s.name;

          return (
            <button
              key={s.name}
              type="button"
              data-style-name={s.name}
              title={`${s.name} (Click to set active, double-click to apply to selection)`}
              onClick={() => onSelectStyle(s.name)}
              onDoubleClick={() => onApplyStyle(s.name)}
              className={`w-12 h-12 flex flex-col items-center justify-between p-1 rounded transition-colors select-none ${
                isActive
                  ? 'border-2 border-[#0078d4] bg-[#2a2a2a] text-white shadow-sm ring-1 ring-[#0078d4]/30'
                  : 'border border-[#2a2a2a] bg-[#1e1e1e] hover:bg-[#252525] hover:border-[#383838] text-slate-300'
              }`}
            >
              {/* Miniature Icon Preview Area (24x24) */}
              <div className="w-6 h-6 flex items-center justify-center flex-shrink-0">
                {isEdgeSection ? (
                  // Edge Preview
                  isNone ? (
                    <div className="w-5 h-0.5 bg-slate-300" />
                  ) : (
                    <div
                      className="w-5 h-0.5"
                      style={{
                        backgroundColor: stroke !== 'transparent' ? stroke : '#ffffff',
                        borderTop: isDashed ? '1px dashed currentColor' : undefined,
                      }}
                    />
                  )
                ) : (
                  // Node Preview
                  isNone ? (
                    // Junction none node: dashed circle with center dot
                    <div className="w-4 h-4 rounded-full border border-dashed border-[#b4b4dc] flex items-center justify-center">
                      <div className="w-1 h-1 rounded-full bg-[#b4b4c8]" />
                    </div>
                  ) : shape === 'rectangle' ? (
                    <div
                      className="w-4 h-4 rounded-sm"
                      style={{
                        backgroundColor: fill !== 'transparent' ? fill : 'transparent',
                        border: `1.5px solid ${stroke !== 'transparent' ? stroke : '#ffffff'}`,
                      }}
                    />
                  ) : shape === 'diamond' ? (
                    <div
                      className="w-3.5 h-3.5 rotate-45"
                      style={{
                        backgroundColor: fill !== 'transparent' ? fill : 'transparent',
                        border: `1.5px solid ${stroke !== 'transparent' ? stroke : '#ffffff'}`,
                      }}
                    />
                  ) : (
                    // Circle or dot
                    <div
                      className="w-4 h-4 rounded-full"
                      style={{
                        backgroundColor: fill !== 'transparent' ? fill : 'transparent',
                        border: `1.5px solid ${stroke !== 'transparent' ? stroke : '#ffffff'}`,
                      }}
                    />
                  )
                )}
              </div>

              {/* Truncated Label Underneath */}
              <span className="text-[9px] font-medium leading-none text-center truncate w-full text-slate-400">
                {s.name}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
};
