import { describe, it, expect, vi } from 'vitest';
import { saveArtifact } from '../../../src/services/export/saveArtifact';

describe('saveArtifact', () => {
  it('writes via showSaveFilePicker when available and returns success with method picker', async () => {
    let writtenData: any = null;
    let closed = false;

    const mockFileHandle = {
      createWritable: vi.fn().mockResolvedValue({
        write: vi.fn().mockImplementation(async (data) => {
          writtenData = data;
        }),
        close: vi.fn().mockImplementation(async () => {
          closed = true;
        }),
      }),
    };

    const mockShowSaveFilePicker = vi.fn().mockResolvedValue(mockFileHandle);
    const mockDownloadBlob = vi.fn();

    const result = await saveArtifact(
      '\\begin{tikzpicture}\\end{tikzpicture}',
      'diagram.tikz',
      {},
      {
        showSaveFilePicker: mockShowSaveFilePicker,
        downloadBlob: mockDownloadBlob,
      }
    );

    expect(result).toEqual({
      status: 'success',
      filename: 'diagram.tikz',
      method: 'picker',
    });
    expect(mockShowSaveFilePicker).toHaveBeenCalledTimes(1);
    expect(mockDownloadBlob).not.toHaveBeenCalled();
    expect(closed).toBe(true);
    expect(writtenData).toBeInstanceOf(Blob);
  });

  it('handles AbortError from picker by returning status cancelled with zero download side effects', async () => {
    const abortErr = new Error('The user aborted a request.');
    abortErr.name = 'AbortError';

    const mockShowSaveFilePicker = vi.fn().mockRejectedValue(abortErr);
    const mockDownloadBlob = vi.fn();

    const result = await saveArtifact(
      'test content',
      'diagram.tikz',
      {},
      {
        showSaveFilePicker: mockShowSaveFilePicker,
        downloadBlob: mockDownloadBlob,
      }
    );

    expect(result).toEqual({ status: 'cancelled' });
    expect(mockShowSaveFilePicker).toHaveBeenCalledTimes(1);
    expect(mockDownloadBlob).not.toHaveBeenCalled();
  });

  it('falls back to downloadBlob if showSaveFilePicker throws a non-abort error before handle returned', async () => {
    const permErr = new Error('Permission denied');
    permErr.name = 'SecurityError';

    const mockShowSaveFilePicker = vi.fn().mockRejectedValue(permErr);
    const mockDownloadBlob = vi.fn();

    const result = await saveArtifact(
      'test content',
      'diagram.tikz',
      {},
      {
        showSaveFilePicker: mockShowSaveFilePicker,
        downloadBlob: mockDownloadBlob,
      }
    );

    expect(result).toEqual({
      status: 'success',
      filename: 'diagram.tikz',
      method: 'download',
    });
    expect(mockShowSaveFilePicker).toHaveBeenCalledTimes(1);
    expect(mockDownloadBlob).toHaveBeenCalledTimes(1);
  });

  it('reports failure when write fails after handle is obtained, without fallback download', async () => {
    const writeErr = new Error('Disk full');
    writeErr.name = 'QuotaExceededError';

    const mockFileHandle = {
      createWritable: vi.fn().mockResolvedValue({
        write: vi.fn().mockRejectedValue(writeErr),
        close: vi.fn(),
      }),
    };

    const mockShowSaveFilePicker = vi.fn().mockResolvedValue(mockFileHandle);
    const mockDownloadBlob = vi.fn();

    const result = await saveArtifact(
      'test content',
      'diagram.tikz',
      {},
      {
        showSaveFilePicker: mockShowSaveFilePicker,
        downloadBlob: mockDownloadBlob,
      }
    );

    expect(result).toEqual({
      status: 'failure',
      error: 'Disk full',
      code: 'QuotaExceededError',
    });
    expect(mockDownloadBlob).not.toHaveBeenCalled();
  });

  it('uses downloadBlob directly when picker is not in environment or showPicker is false', async () => {
    const mockDownloadBlob = vi.fn();

    const result = await saveArtifact(
      new Blob(['binary data'], { type: 'application/pdf' }),
      'diagram.pdf',
      { showPicker: false },
      {
        downloadBlob: mockDownloadBlob,
      }
    );

    expect(result).toEqual({
      status: 'success',
      filename: 'diagram.pdf',
      method: 'download',
    });
    expect(mockDownloadBlob).toHaveBeenCalledTimes(1);
  });
});
