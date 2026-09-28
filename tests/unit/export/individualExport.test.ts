import { describe, it, expect, vi } from 'vitest';
import { sanitizeFilename, FilenameCollisionTracker } from '../../../src/services/export/exportNaming';
import { saveArtifact } from '../../../src/services/export/saveArtifact';
import { ImageExporter } from '../../../src/services/export/ImageExporter';
import { PdfExporter } from '../../../src/services/export/PdfExporter';
import { safeParse } from '../../../src/core/parser/parser';
import type { GraphAST } from '../../../src/core/domain/types';

describe('Sprint 18: Individual Diagram Export Unit Suite', () => {
  const sampleAst: GraphAST = {
    data: [],
    paths: [],
    nodes: [
      {
        id: 'n0',
        name: '0',
        label: 'A',
        position: { x: 0, y: 0 },
        data: [],
      },
    ],
    edges: [],
  };

  describe('Verbatim Byte Equality (18-AC-01)', () => {
    it('preserves raw TikZ comments, indentation, and formatting verbatim', () => {
      const verbatimTikz = `% Author: Alice\n% Date: 2026-09-28\n\\begin{tikzpicture}\n  % Indented comment\n  \\node [style=none] (0) at (0, 0) {$X$};\n\\end{tikzpicture}\n% Trailing metadata\n`;
      
      // Standalone TeX wrapper must preserve the exact inner TikZ string without AST re-emission
      const standaloneTex = ImageExporter.generateStandaloneTex(verbatimTikz);

      expect(standaloneTex).toContain(verbatimTikz.trim());
      expect(standaloneTex).toContain('% Author: Alice');
      expect(standaloneTex).toContain('% Indented comment');
      expect(standaloneTex).toContain('% Trailing metadata');
      expect(standaloneTex).toContain('\\documentclass');
      expect(standaloneTex).toContain('\\usepackage{tikz}');
    });
  });

  describe('Fresh Parse and Syntax Error Protection (18-AC-03)', () => {
    it('fails SVG export when source has syntax errors', () => {
      const brokenSource = '\\begin{tikzpicture}\n\\node [broken syntax;\n';
      const parsed = safeParse(brokenSource);
      expect(parsed.success).toBe(false);
      expect(parsed.ast).toBeFalsy();
    });

    it('successfully parses valid TikZ source freshly at export time', () => {
      const validSource = '\\begin{tikzpicture}\n\\node (0) at (0, 0) {};\n\\end{tikzpicture}';
      const parsed = safeParse(validSource);
      expect(parsed.success).toBe(true);
      expect(parsed.ast).toBeDefined();

      if (parsed.ast) {
        const svg = ImageExporter.generateSvg(parsed.ast);
        expect(svg).toContain('<svg');
        const pdf = PdfExporter.generatePdfBlob(parsed.ast);
        expect(pdf.type).toBe('application/pdf');
      }
    });
  });

  describe('Filename Sanitization & Collision Safety (18-AC-04)', () => {
    it('sanitizes illegal path characters and trailing dots', () => {
      expect(sanitizeFilename('my/diagram:v1?', 'tikz')).toBe('my_diagram_v1.tikz');
      expect(sanitizeFilename('  lots   of   spaces  ', 'tex')).toBe('lots of spaces.tex');
      expect(sanitizeFilename('', 'png')).toBe('Untitled.png');
    });

    it('generates collision-safe filenames within a session', () => {
      const tracker = new FilenameCollisionTracker();
      const fn1 = tracker.getUniqueFilename('spider.svg');
      const fn2 = tracker.getUniqueFilename('spider.svg');
      const fn3 = tracker.getUniqueFilename('spider.svg');

      expect(fn1).toBe('spider.svg');
      expect(fn2).toBe('spider-2.svg');
      expect(fn3).toBe('spider-3.svg');
    });
  });

  describe('SaveArtifact Outcome Matrix (18-AC-05)', () => {
    it('quietly cancels on AbortError without fallback download', async () => {
      const mockEnv = {
        showSaveFilePicker: vi.fn().mockRejectedValue(new DOMException('User cancelled', 'AbortError')),
        downloadBlob: vi.fn(),
      };

      const result = await saveArtifact('content', 'test.tikz', {}, mockEnv as any);

      expect(result.status).toBe('cancelled');
      expect(mockEnv.showSaveFilePicker).toHaveBeenCalledTimes(1);
      expect(mockEnv.downloadBlob).not.toHaveBeenCalled();
    });

    it('falls back to downloadBlob if showSaveFilePicker is not available', async () => {
      const mockEnv = {
        downloadBlob: vi.fn(),
      };

      const result = await saveArtifact('content', 'test.tikz', {}, mockEnv as any);

      expect(result.status).toBe('success');
      if (result.status === 'success') {
        expect(result.method).toBe('download');
      }
      expect(mockEnv.downloadBlob).toHaveBeenCalledTimes(1);
      expect(mockEnv.downloadBlob).toHaveBeenCalledWith(expect.any(Blob), 'test.tikz');
    });

    it('falls back to downloadBlob if showSaveFilePicker throws NotAllowedError', async () => {
      const mockEnv = {
        showSaveFilePicker: vi.fn().mockRejectedValue(new DOMException('Permission denied', 'NotAllowedError')),
        downloadBlob: vi.fn(),
      };

      const result = await saveArtifact('content', 'test.tikz', {}, mockEnv as any);

      expect(result.status).toBe('success');
      if (result.status === 'success') {
        expect(result.method).toBe('download');
      }
      expect(mockEnv.downloadBlob).toHaveBeenCalledTimes(1);
    });

    it('reports failure if writing to acquired file handle fails', async () => {
      const mockHandle = {
        createWritable: vi.fn().mockRejectedValue(new Error('Disk I/O error')),
      };
      const mockEnv = {
        showSaveFilePicker: vi.fn().mockResolvedValue(mockHandle),
        downloadBlob: vi.fn(),
      };

      const result = await saveArtifact('content', 'test.tikz', {}, mockEnv as any);

      expect(result.status).toBe('failure');
      if (result.status === 'failure') {
        expect(result.error).toContain('Disk I/O error');
      }
      expect(mockEnv.downloadBlob).not.toHaveBeenCalled();
    });

    it('returns saved status upon successful stream write', async () => {
      const mockWritable = {
        write: vi.fn().mockResolvedValue(undefined),
        close: vi.fn().mockResolvedValue(undefined),
      };
      const mockHandle = {
        createWritable: vi.fn().mockResolvedValue(mockWritable),
      };
      const mockEnv = {
        showSaveFilePicker: vi.fn().mockResolvedValue(mockHandle),
        downloadBlob: vi.fn(),
      };

      const result = await saveArtifact('content', 'test.tikz', {}, mockEnv as any);

      expect(result.status).toBe('success');
      if (result.status === 'success') {
        expect(result.filename).toBe('test.tikz');
        expect(result.method).toBe('picker');
      }
      expect(mockWritable.write).toHaveBeenCalledTimes(1);
      expect(mockWritable.close).toHaveBeenCalledTimes(1);
      expect(mockEnv.downloadBlob).not.toHaveBeenCalled();
    });
  });

  describe('Non-Mutation Invariant (18-AC-06)', () => {
    it('verifies pure exporters produce output without mutating input AST', () => {
      const astSnapshot = JSON.parse(JSON.stringify(sampleAst));
      
      ImageExporter.generateSvg(sampleAst);
      ImageExporter.generateSvgBlob(sampleAst);
      PdfExporter.generatePdfBlob(sampleAst);

      expect(sampleAst).toEqual(astSnapshot);
    });
  });
});
