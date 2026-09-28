/**
 * src/components/workbench/panels/preview/PreviewStage.tsx - Sprint 22
 * Interactive SVG viewport stage with Pan/Zoom and Contract B selectors.
 */
import React, { useRef } from 'react';

export interface PreviewStageProps {
  svgContent: string;
  zoom: number;
  pan: { x: number; y: number };
  onPanChange: (pan: { x: number; y: number }) => void;
  onZoomChange: (zoom: (prev: number) => number) => void;
}

export const PreviewStage: React.FC<PreviewStageProps> = ({
  svgContent,
  zoom,
  pan,
  onPanChange,
  onZoomChange,
}) => {
  const isPanningRef = useRef(false);
  const panStartRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (e.button !== 0 && e.button !== 1) return;
    isPanningRef.current = true;
    panStartRef.current = { x: e.clientX - pan.x, y: e.clientY - pan.y };
    e.currentTarget.setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isPanningRef.current) return;
    onPanChange({
      x: e.clientX - panStartRef.current.x,
      y: e.clientY - panStartRef.current.y,
    });
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    isPanningRef.current = false;
    try {
      e.currentTarget.releasePointerCapture(e.pointerId);
    } catch {}
  };

  const handleWheel = (e: React.WheelEvent<HTMLDivElement>) => {
    e.preventDefault();
    const factor = e.deltaY < 0 ? 1.1 : 0.9;
    onZoomChange((z) => Math.min(5.0, Math.max(0.1, z * factor)));
  };

  return (
    <div
      data-testid="preview-viewport"
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onWheel={handleWheel}
      className="flex-1 w-full h-full relative overflow-hidden bg-neutral-950 flex items-center justify-center cursor-grab active:cursor-grabbing select-none"
    >
      <div
        data-testid="preview-svg-container"
        style={{
          transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
          transformOrigin: 'center center',
          transition: isPanningRef.current ? 'none' : 'transform 0.05s ease-out',
        }}
      >
        {svgContent ? (
          <div data-testid="preview-svg-content" dangerouslySetInnerHTML={{ __html: svgContent }} />
        ) : (
          <div data-testid="preview-empty-message" className="text-neutral-500 text-xs italic pointer-events-none">
            Canvas is empty. Add nodes or edges to see live TeX preview.
          </div>
        )}
      </div>
    </div>
  );
};
