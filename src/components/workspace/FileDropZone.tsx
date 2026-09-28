import React, { useState, useEffect } from 'react';
import { defaultWorkspaceManager } from '../../services/workspace/WorkspaceManager';
import { parseTikz, parseTikzStyles } from '../../core/parser/parser';
import { $stylesCatalog, $styleFileName, $styleFileBuffer } from '../../stores/workbench';

export interface FileDropZoneProps {
  children?: React.ReactNode;
  onFileIngested?: (filename: string, content: string) => void;
}

export const FileDropZone: React.FC<FileDropZoneProps> = ({ children, onFileIngested }) => {
  const [isDraggingOver, setIsDraggingOver] = useState(false);

  useEffect(() => {
    let dragCounter = 0;

    const handleDragEnter = (e: DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      dragCounter++;
      if (e.dataTransfer && e.dataTransfer.types.includes('Files')) {
        setIsDraggingOver(true);
      }
    };

    const handleDragLeave = (e: DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      dragCounter--;
      if (dragCounter <= 0) {
        setIsDraggingOver(false);
      }
    };

    const handleDragOver = (e: DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
    };

    const handleDrop = (e: DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      dragCounter = 0;
      setIsDraggingOver(false);

      if (!e.dataTransfer || !e.dataTransfer.files.length) return;
      const file = e.dataTransfer.files[0];
      const filename = file.name;

      if (filename.endsWith('.tikzstyles')) {
        const reader = new FileReader();
        reader.onload = (event) => {
          const text = event.target?.result as string;
          if (!text) return;
          try {
            const catalog = parseTikzStyles(text);
            $stylesCatalog.set(catalog);
            $styleFileName.set(filename);
            $styleFileBuffer.set(text);
            if (onFileIngested) {
              onFileIngested(filename, text);
            }
          } catch (err: any) {
            alert('Failed to parse .tikzstyles file: ' + err.message);
          }
        };
        reader.readAsText(file);
        return;
      }

      if (!filename.endsWith('.tikz') && !filename.endsWith('.tex') && !filename.endsWith('.md')) {
        alert('Unsupported file format. Please drop .tikz, .tex, .md, or .tikzstyles files.');
        return;
      }

      const reader = new FileReader();
      reader.onload = (event) => {
        const text = event.target?.result as string;
        if (!text) return;

        try {
          const ast = parseTikz(text);
          defaultWorkspaceManager.openDocument({
            id: `doc-${Date.now()}`,
            title: filename,
            content: text,
            ast: ast || undefined,
            hash: 'imported_' + Date.now(),
            createdAt: Date.now(),
            updatedAt: Date.now(),
            version: 1,
            isDirty: false,
          });

          if (onFileIngested) {
            onFileIngested(filename, text);
          }
        } catch (err: any) {
          alert('Failed to parse dropped TikZ file: ' + err.message);
        }
      };
      reader.readAsText(file);
    };

    window.addEventListener('dragenter', handleDragEnter);
    window.addEventListener('dragleave', handleDragLeave);
    window.addEventListener('dragover', handleDragOver);
    window.addEventListener('drop', handleDrop);

    return () => {
      window.removeEventListener('dragenter', handleDragEnter);
      window.removeEventListener('dragleave', handleDragLeave);
      window.removeEventListener('dragover', handleDragOver);
      window.removeEventListener('drop', handleDrop);
    };
  }, [onFileIngested]);

  return (
    <div className="relative w-full h-full" data-testid="file-drop-zone">
      {children}

      {isDraggingOver && (
        <div
          data-testid="file-drop-overlay"
          className="absolute inset-0 z-50 bg-blue-950/80 backdrop-blur-sm border-2 border-dashed border-blue-400 flex flex-col items-center justify-center pointer-events-none transition-all"
        >
          <div className="p-6 bg-slate-900/90 rounded-xl border border-blue-500/40 shadow-2xl flex flex-col items-center">
            <span className="text-3xl mb-2">📥</span>
            <span className="text-sm font-semibold text-slate-100">Drop diagram to import</span>
            <span className="text-xs text-slate-400 mt-1">Supports .tikz, .tex, and .md files</span>
          </div>
        </div>
      )}
    </div>
  );
};
