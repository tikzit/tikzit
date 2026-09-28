/**
 * src/services/export/diagramExportCoordinator.ts - Sprint 21 helper
 * Encapsulates single-diagram export artifact creation and dialog state.
 */
import type { WorkbenchStores } from '../../stores/createWorkbenchStores';
import type { MCardCollection } from 'clm-kernel';
import type { CorpusExplorerService } from '../clm/corpusExplorerService';
import { defaultWorkspaceManager } from '../workspace/WorkspaceManager';
import { saveArtifact, type SaveArtifactResult, type SaveArtifactEnvironment } from './saveArtifact';
import { sanitizeFilename, defaultFilenameCollisionTracker } from './exportNaming';
import { ImageExporter } from './ImageExporter';
import { PdfExporter } from './PdfExporter';
import { safeParse } from '../../core/parser/parser';

export interface ExportDiagramOptions {
  handle: string;
  format: 'tikz' | 'tex' | 'svg' | 'png' | 'pdf';
  sourceKind: 'current' | 'saved';
  pngScale?: 1 | 2 | 4;
  environment?: SaveArtifactEnvironment;
}

export class DiagramExportCoordinator {
  constructor(
    private stores: WorkbenchStores,
    private corpusExplorer: CorpusExplorerService,
    private mcardCollection: MCardCollection
  ) {}

  public openExportDialog(handle?: string): void {
    const targetHandle = handle || defaultWorkspaceManager.getActiveDocument()?.id || '';
    if (!targetHandle) return;
    const wsDoc = defaultWorkspaceManager.getOpenDocuments().find((d) => d.id === targetHandle);
    const entry = this.corpusExplorer.listCorpusEntries({ includeArchived: true }).entries.find((e) => e.handle === targetHandle);
    const targetTitle = wsDoc?.title || entry?.title || targetHandle;
    const currentSource = wsDoc?.content ?? '';
    const isDirty = wsDoc?.isDirty ?? false;
    const history = this.corpusExplorer.documentHistory(targetHandle);
    const version = wsDoc?.version || history.rows.length || 0;
    const isDraft = version === 0 || !history.head;
    let savedSource: string | undefined;

    try {
      const headHash = this.mcardCollection.resolveHandle(targetHandle);
      if (headHash) {
        const card = this.mcardCollection.get(headHash);
        if (card && card.payload.kind === 'text') savedSource = card.payload.value;
      }
    } catch {
      // Ignore
    }

    this.stores.$exportDialogState.set({
      isOpen: true,
      targetHandle,
      targetTitle,
      currentSource: wsDoc ? currentSource : (savedSource ?? ''),
      savedSource,
      isDirty,
      version,
      isDraft,
    });
  }

  public closeExportDialog(): void {
    const current = this.stores.$exportDialogState.get();
    this.stores.$exportDialogState.set({ ...current, isOpen: false });
  }

  public async exportDiagramArtifact(options: ExportDiagramOptions): Promise<SaveArtifactResult> {
    const wsDoc = defaultWorkspaceManager.getOpenDocuments().find((d) => d.id === options.handle);
    const entry = this.corpusExplorer.listCorpusEntries({ includeArchived: true }).entries.find((e) => e.handle === options.handle);
    const title = wsDoc?.title || entry?.title || 'diagram';

    let sourceText = '';
    if (options.sourceKind === 'current' && wsDoc) {
      sourceText = wsDoc.content;
    } else {
      try {
        const headHash = this.mcardCollection.resolveHandle(options.handle);
        if (headHash) {
          const card = this.mcardCollection.get(headHash);
          if (card && card.payload.kind === 'text') sourceText = card.payload.value;
        }
      } catch {
        // Ignore
      }
      if (!sourceText && wsDoc) sourceText = wsDoc.content;
    }

    const styles = this.stores.$stylesCatalog.get();

    switch (options.format) {
      case 'tikz': {
        const rawName = sanitizeFilename(title, 'tikz');
        const filename = defaultFilenameCollisionTracker.getUniqueFilename(rawName);
        return saveArtifact(sourceText, filename, { mimeType: 'text/plain' }, options.environment);
      }
      case 'tex': {
        const texDoc = ImageExporter.generateStandaloneTex(sourceText, styles);
        const rawName = sanitizeFilename(title, 'tex');
        const filename = defaultFilenameCollisionTracker.getUniqueFilename(rawName);
        return saveArtifact(texDoc, filename, { mimeType: 'application/x-latex' }, options.environment);
      }
      case 'svg': {
        const parsed = safeParse(sourceText);
        if (!parsed.success || !parsed.ast) {
          return { status: 'failure', error: 'Diagram source contains syntax errors', code: 'ParseError' };
        }
        const svgBlob = ImageExporter.generateSvgBlob(parsed.ast, styles, { scale: 60, padding: 40 });
        const rawName = sanitizeFilename(title, 'svg');
        const filename = defaultFilenameCollisionTracker.getUniqueFilename(rawName);
        return saveArtifact(svgBlob, filename, { mimeType: 'image/svg+xml' }, options.environment);
      }
      case 'png': {
        const parsed = safeParse(sourceText);
        if (!parsed.success || !parsed.ast) {
          return { status: 'failure', error: 'Diagram source contains syntax errors', code: 'ParseError' };
        }
        try {
          const pngBlob = await ImageExporter.generatePngBlob(parsed.ast, styles, { scaleFactor: options.pngScale ?? 2 });
          const rawName = sanitizeFilename(title, 'png');
          const filename = defaultFilenameCollisionTracker.getUniqueFilename(rawName);
          return saveArtifact(pngBlob, filename, { mimeType: 'image/png' }, options.environment);
        } catch (pngErr) {
          return { status: 'failure', error: pngErr instanceof Error ? pngErr.message : String(pngErr), code: 'PngGenerationError' };
        }
      }
      case 'pdf': {
        const parsed = safeParse(sourceText);
        if (!parsed.success || !parsed.ast) {
          return { status: 'failure', error: 'Diagram source contains syntax errors', code: 'ParseError' };
        }
        const pdfBlob = PdfExporter.generatePdfBlob(parsed.ast, styles);
        const rawName = sanitizeFilename(title, 'pdf');
        const filename = defaultFilenameCollisionTracker.getUniqueFilename(rawName);
        return saveArtifact(pdfBlob, filename, { mimeType: 'application/pdf' }, options.environment);
      }
    }
  }
}
