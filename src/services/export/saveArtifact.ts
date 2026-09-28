/**
 * Unified Artifact Saver for TikZiT Web
 * Handles browser File System Access API (showSaveFilePicker) with fallback to Blob download.
 * Ensures cancelled pickers do not trigger fallback, and failures are accurately reported.
 */

import { downloadBlob, downloadText } from './ImageExporter';

export interface SaveArtifactOptions {
  mimeType?: string;
  showPicker?: boolean;
}

export interface SaveArtifactEnvironment {
  showSaveFilePicker?: (options: unknown) => Promise<any>;
  downloadBlob?: (blob: Blob, filename: string) => Promise<void> | void;
  downloadText?: (content: string, filename: string, mimeType?: string) => Promise<void> | void;
}

export type SaveArtifactResult =
  | { status: 'success'; filename: string; method: 'picker' | 'download' }
  | { status: 'cancelled' }
  | { status: 'failure'; error: string; code?: string };

const EXTENSION_TYPE_MAP: Record<string, { description: string; mimeType: string }> = {
  '.tikz': { description: 'TikZ source file', mimeType: 'text/plain' },
  '.tex': { description: 'LaTeX document', mimeType: 'application/x-latex' },
  '.svg': { description: 'SVG image', mimeType: 'image/svg+xml' },
  '.png': { description: 'PNG image', mimeType: 'image/png' },
  '.pdf': { description: 'PDF document', mimeType: 'application/pdf' },
};

function getExtension(filename: string): string {
  const dotIndex = filename.lastIndexOf('.');
  return dotIndex >= 0 ? filename.slice(dotIndex).toLowerCase() : '';
}

export async function saveArtifact(
  data: Blob | string,
  filename: string,
  options: SaveArtifactOptions = {},
  environment: SaveArtifactEnvironment = {}
): Promise<SaveArtifactResult> {
  const ext = getExtension(filename);
  const typeConfig = EXTENSION_TYPE_MAP[ext] || {
    description: 'Diagram artifact',
    mimeType: options.mimeType || 'application/octet-stream',
  };
  const mimeType = options.mimeType || typeConfig.mimeType;

  // Convert string to Blob if necessary for writable streams
  const blob = typeof data === 'string'
    ? new Blob([data], { type: `${mimeType};charset=utf-8` })
    : data;

  const showPickerEnabled = options.showPicker !== false;

  const picker = showPickerEnabled
    ? environment.showSaveFilePicker ?? (
        typeof window === 'undefined'
          ? undefined
          : (window as Window & { showSaveFilePicker?: (opts: unknown) => Promise<any> }).showSaveFilePicker?.bind(window)
      )
    : undefined;

  const fallbackDownload = environment.downloadBlob ?? downloadBlob;

  if (picker) {
    let fileHandle: any;
    try {
      fileHandle = await picker({
        suggestedName: filename,
        types: [
          {
            description: typeConfig.description,
            accept: {
              [mimeType]: [ext],
            },
          },
        ],
      });
    } catch (pickerError) {
      if (pickerError instanceof Error && pickerError.name === 'AbortError') {
        return { status: 'cancelled' };
      }
      // Picker unavailable, denied before handle obtained, or not allowed in context -> fallback
      try {
        await fallbackDownload(blob, filename);
        return { status: 'success', filename, method: 'download' };
      } catch (fallbackError) {
        return {
          status: 'failure',
          error: fallbackError instanceof Error ? fallbackError.message : String(fallbackError),
          code: fallbackError instanceof Error ? fallbackError.name : 'DownloadError',
        };
      }
    }

    if (fileHandle) {
      try {
        const writable = await fileHandle.createWritable();
        await writable.write(blob);
        await writable.close();
        return { status: 'success', filename, method: 'picker' };
      } catch (writeError) {
        return {
          status: 'failure',
          error: writeError instanceof Error ? writeError.message : String(writeError),
          code: writeError instanceof Error ? writeError.name : 'WriteError',
        };
      }
    }
  }

  // No picker available -> fallback
  try {
    await fallbackDownload(blob, filename);
    return { status: 'success', filename, method: 'download' };
  } catch (err) {
    return {
      status: 'failure',
      error: err instanceof Error ? err.message : String(err),
      code: err instanceof Error ? err.name : 'DownloadError',
    };
  }
}
