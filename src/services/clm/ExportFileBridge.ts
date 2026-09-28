/**
 * src/services/clm/ExportFileBridge.ts - Sprint 23
 * File System Access API picker and fallback blob download with executionLog audit receipt generation.
 * Target: <= 120 LOC.
 */
import { AgentDid, MCard, structuredPayload, type TriDatabaseManager } from 'clm-kernel';

export type CorpusSaveStatus = 'success' | 'failure' | 'cancelled';

export interface CorpusSaveResult {
  status: CorpusSaveStatus;
  cardCount: number;
  filename: string;
  persisted: boolean;
  persistenceError?: string;
  failureCode?: string;
  failureReason?: string;
  method?: 'picker' | 'fallback';
  failingHandle?: string;
}

interface PickerWritable {
  write(data: Blob): Promise<void>;
  close(): Promise<void>;
}

interface PickerHandle {
  createWritable(): Promise<PickerWritable>;
}

export interface CorpusSaveEnvironment {
  showSaveFilePicker?: (options: unknown) => Promise<PickerHandle>;
  downloadBlob?: (bytes: Uint8Array, filename: string) => void | Promise<void>;
}

export function browserDownload(bytes: Uint8Array, filename: string): void {
  if (typeof document === 'undefined' || typeof URL === 'undefined') throw new Error('Blob download is unavailable');
  const blob = new Blob([Uint8Array.from(bytes).buffer], { type: 'application/vnd.sqlite3' });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  anchor.style.display = 'none';
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export class ExportFileBridge {
  constructor(
    private readonly triDb: TriDatabaseManager,
    private readonly authorDid: AgentDid,
    private readonly flush: () => Promise<void>,
  ) {}

  async deliverFile(
    bytes: Uint8Array,
    filename: string,
    environment: CorpusSaveEnvironment = {},
  ): Promise<{ status: CorpusSaveStatus; method: 'picker' | 'fallback'; failureCode?: string; failureReason?: string }> {
    const picker = environment.showSaveFilePicker ?? (
      typeof window === 'undefined'
        ? undefined
        : (window as Window & { showSaveFilePicker?: CorpusSaveEnvironment['showSaveFilePicker'] }).showSaveFilePicker?.bind(window)
    );

    if (picker) {
      let file: PickerHandle | undefined;
      try {
        file = await picker({
          suggestedName: filename,
          types: [{ description: 'SQLite database', accept: { 'application/vnd.sqlite3': ['.db', '.sqlite', '.sqlite3'] } }],
        });
      } catch (pickerError) {
        if (pickerError instanceof Error && pickerError.name === 'AbortError') {
          return { status: 'cancelled', method: 'picker' };
        }
        await (environment.downloadBlob ?? browserDownload)(bytes, filename);
        return { status: 'success', method: 'fallback' };
      }
      if (file) {
        try {
          const writable = await file.createWritable();
          await writable.write(new Blob([Uint8Array.from(bytes).buffer], { type: 'application/vnd.sqlite3' }));
          await writable.close();
          return { status: 'success', method: 'picker' };
        } catch (writeError) {
          return {
            status: 'failure',
            method: 'picker',
            failureCode: 'WriteError',
            failureReason: writeError instanceof Error ? writeError.message : String(writeError),
          };
        }
      }
    }

    await (environment.downloadBlob ?? browserDownload)(bytes, filename);
    return { status: 'success', method: 'fallback' };
  }

  async recordAuditReceipt(receiptData: {
    status: CorpusSaveStatus;
    cardCount: number;
    manifestDigest: string;
    filename: string;
    failureCode?: string;
    failingHandle?: string;
  }): Promise<{ persisted: boolean; persistenceError?: string }> {
    const receiptValue: Record<string, unknown> = {
      status: receiptData.status,
      cardCount: receiptData.cardCount,
      manifestDigest: receiptData.manifestDigest,
      filename: receiptData.filename,
      timestamp: Date.now(),
    };
    if (receiptData.failureCode !== undefined) receiptValue.failureCode = receiptData.failureCode;
    if (receiptData.failingHandle !== undefined) receiptValue.failingHandle = receiptData.failingHandle;

    const receipt = MCard.create(
      `tikzit://receipt/corpus-export/${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      structuredPayload(receiptValue),
      this.authorDid,
      0,
    );
    this.triDb.executionLog.putCard(receipt);

    try {
      await this.flush();
      return { persisted: true };
    } catch (error) {
      return {
        persisted: false,
        persistenceError: error instanceof Error ? error.message : String(error),
      };
    }
  }
}
