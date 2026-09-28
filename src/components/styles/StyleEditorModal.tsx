import React, { useState } from 'react';
import type { TikzStyle } from '../../core/domain/types';
import {
  createStyle,
  getStyleFillColor,
  getStyleStrokeColor,
  getStyleShape,
  getStyleCategory,
  toPGFColor,
} from '../../core/styles/TikzStyleModel';

export interface StyleEditorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaveStyle: (style: TikzStyle) => void;
  existingStyles?: TikzStyle[];
}

export const StyleEditorModal: React.FC<StyleEditorModalProps> = ({
  isOpen,
  onClose,
  onSaveStyle,
  existingStyles = [],
}) => {
  if (!isOpen) return null;

  const [name, setName] = useState<string>('New Style');
  const [fillColor, setFillColor] = useState<string>('#3B82F6');
  const [strokeColor, setStrokeColor] = useState<string>('#000000');
  const [shape, setShape] = useState<string>('circle');
  const [category, setCategory] = useState<string>('Custom');

  const handleResetForNew = () => {
    setName('New Custom Style');
    setFillColor('#3B82F6');
    setStrokeColor('#000000');
    setShape('circle');
    setCategory('Custom');
  };

  const handleSave = () => {
    if (!name.trim()) return;

    const pgfFill = toPGFColor(fillColor);
    const properties = [
      { key: 'fill', value: pgfFill.replace(/[{}]/g, '') },
      { key: 'draw', value: strokeColor },
      { key: 'shape', value: shape },
      { key: 'tikzit category', value: category },
    ];

    const style = createStyle(name.trim(), properties, category);
    onSaveStyle(style);
    onClose();
  };

  return (
    <div
      id="style-editor-modal"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
    >
      <div className="bg-[#1a1d26] border border-[#2e3446] rounded-lg shadow-2xl w-[420px] max-w-full overflow-hidden text-xs text-[#94a3b8]">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-[#2e3446] bg-[#161922]">
          <h3 className="font-bold text-slate-200 text-sm">Style Editor</h3>
          <button
            onClick={onClose}
            className="text-[#64748b] hover:text-slate-200 text-lg leading-none"
          >
            ×
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-4 space-y-3.5">
          <div className="flex items-center justify-between">
            <span className="text-[11px] text-[#64748b]">Configure node or edge appearance</span>
            <button
              id="new-style-btn"
              onClick={handleResetForNew}
              className="px-2 py-1 text-[10px] font-medium bg-[#1f2330] hover:bg-[#2b3145] text-blue-400 rounded border border-[#2e3446]"
            >
              + Create Blank
            </button>
          </div>

          <div>
            <label className="block text-[11px] text-slate-300 font-medium mb-1">Style Name</label>
            <input
              id="style-name-input"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Custom Blue Node"
              className="w-full bg-[#1f2330] border border-[#2e3446] rounded px-2.5 py-1.5 text-slate-200 focus:outline-none focus:border-blue-500 font-medium"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] text-slate-300 font-medium mb-1">Fill Color</label>
              <div className="flex items-center space-x-1.5">
                <input
                  type="color"
                  value={fillColor.startsWith('#') && fillColor.length === 7 ? fillColor : '#3b82f6'}
                  onChange={(e) => setFillColor(e.target.value)}
                  className="w-7 h-7 rounded border border-[#2e3446] cursor-pointer bg-transparent"
                />
                <input
                  id="style-fill-color"
                  type="text"
                  value={fillColor}
                  onChange={(e) => setFillColor(e.target.value)}
                  className="w-full bg-[#1f2330] border border-[#2e3446] rounded px-2 py-1 text-slate-200 font-mono text-[11px] focus:outline-none focus:border-blue-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] text-slate-300 font-medium mb-1">Stroke Color</label>
              <div className="flex items-center space-x-1.5">
                <input
                  type="color"
                  value={strokeColor.startsWith('#') && strokeColor.length === 7 ? strokeColor : '#000000'}
                  onChange={(e) => setStrokeColor(e.target.value)}
                  className="w-7 h-7 rounded border border-[#2e3446] cursor-pointer bg-transparent"
                />
                <input
                  type="text"
                  value={strokeColor}
                  onChange={(e) => setStrokeColor(e.target.value)}
                  className="w-full bg-[#1f2330] border border-[#2e3446] rounded px-2 py-1 text-slate-200 font-mono text-[11px] focus:outline-none focus:border-blue-500"
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] text-slate-300 font-medium mb-1">Shape</label>
              <select
                value={shape}
                onChange={(e) => setShape(e.target.value)}
                className="w-full bg-[#1f2330] border border-[#2e3446] rounded px-2.5 py-1.5 text-slate-200 focus:outline-none focus:border-blue-500"
              >
                <option value="circle">Circle</option>
                <option value="rectangle">Rectangle</option>
                <option value="triangle">Triangle</option>
                <option value="diamond">Diamond</option>
                <option value="none">None (Dot)</option>
              </select>
            </div>

            <div>
              <label className="block text-[11px] text-slate-300 font-medium mb-1">Category</label>
              <input
                type="text"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                placeholder="Category name"
                className="w-full bg-[#1f2330] border border-[#2e3446] rounded px-2.5 py-1.5 text-slate-200 focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>

          {/* Live Preview */}
          <div className="border border-[#2e3446] rounded bg-[#161922] p-3 flex items-center justify-between">
            <span className="text-[11px] font-medium text-[#64748b]">Preview Swatch:</span>
            <div className="flex items-center space-x-2">
              <div
                className={`flex items-center justify-center shadow-sm ${
                  shape === 'rectangle' ? 'w-6 h-6 rounded-sm' : 'w-6 h-6 rounded-full'
                }`}
                style={{
                  backgroundColor: fillColor,
                  border: `2px solid ${strokeColor}`,
                }}
              />
              <span className="font-semibold text-slate-200">{name}</span>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-end space-x-2 px-4 py-3 border-t border-[#2e3446] bg-[#161922]">
          <button
            onClick={onClose}
            className="px-3 py-1.5 rounded text-xs font-medium bg-[#1f2330] hover:bg-[#282e40] text-slate-300 transition-colors"
          >
            Cancel
          </button>
          <button
            id="save-style-btn"
            onClick={handleSave}
            className="px-3 py-1.5 rounded text-xs font-medium bg-blue-600 hover:bg-blue-500 text-white shadow-sm transition-colors"
          >
            Save Style
          </button>
        </div>
      </div>
    </div>
  );
};
