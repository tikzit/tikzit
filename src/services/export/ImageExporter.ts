/**
 * Multi-Format Image and TeX Exporter for TikZiT Web
 * Handles SVG, PNG (1x, 2x Retina, 4x Print), .tikz snippet, and standalone .tex exports.
 */

import type { GraphAST, TikzStylesCatalog } from '../../core/domain/types';
import { emitTikz, emitTikzStyles } from '../../core/parser/emitter';
import { generateSvg } from '../preview/SvgGenerator';
import type { SvgGeneratorOptions } from '../preview/SvgGenerator';
import { defaultPreambleManager } from '../preview/PreambleManager';
import type { PreambleConfig } from '../preview/PreambleManager';

export interface PngExportOptions {
  scaleFactor?: 1 | 2 | 4; // 1 = 1x (72/96 DPI), 2 = Retina, 4 = Print (300+ DPI)
  transparentBg?: boolean;
  theme?: 'light' | 'dark';
}

export function downloadBlob(blob: Blob, filename: string): void {
  if (typeof window === 'undefined') return;
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export function downloadText(content: string, filename: string, mimeType: string = 'text/plain'): void {
  const blob = new Blob([content], { type: `${mimeType};charset=utf-8` });
  downloadBlob(blob, filename);
}

export class ImageExporter {
  /**
   * Generates pure SVG string from GraphAST
   */
  public static generateSvg(
    ast: GraphAST,
    stylesCatalog?: TikzStylesCatalog,
    options: SvgGeneratorOptions = {}
  ): string {
    return generateSvg(ast, stylesCatalog, options);
  }

  /**
   * Generates pure SVG Blob from GraphAST
   */
  public static generateSvgBlob(
    ast: GraphAST,
    stylesCatalog?: TikzStylesCatalog,
    options: SvgGeneratorOptions = {}
  ): Blob {
    const svg = this.generateSvg(ast, stylesCatalog, options);
    return new Blob([svg], { type: 'image/svg+xml;charset=utf-8' });
  }

  /**
   * Export vector SVG file
   */
  public static exportSvg(
    ast: GraphAST,
    stylesCatalog?: TikzStylesCatalog,
    options: SvgGeneratorOptions = {},
    filename: string = 'diagram.svg'
  ): string {
    const svg = this.generateSvg(ast, stylesCatalog, options);
    downloadText(svg, filename, 'image/svg+xml');
    return svg;
  }

  /**
   * Generates high-resolution PNG image Blob without triggering download
   */
  public static async generatePngBlob(
    ast: GraphAST,
    stylesCatalog?: TikzStylesCatalog,
    options: PngExportOptions = {}
  ): Promise<Blob> {
    const scaleFactor = options.scaleFactor ?? 2;
    const svgString = this.generateSvg(ast, stylesCatalog, {
      scale: 60,
      padding: 40,
      theme: options.theme,
      transparentBg: options.transparentBg,
    });

    if (typeof window === 'undefined' || typeof Image === 'undefined') {
      return new Blob([svgString], { type: 'image/png' });
    }

    return new Promise<Blob>((resolve, reject) => {
      const img = new Image();
      const svgBlob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
      const url = URL.createObjectURL(svgBlob);

      img.onload = () => {
        try {
          const width = img.naturalWidth || img.width;
          const height = img.naturalHeight || img.height;

          const canvas = document.createElement('canvas');
          canvas.width = Math.round(width * scaleFactor);
          canvas.height = Math.round(height * scaleFactor);

          const ctx = canvas.getContext('2d');
          if (!ctx) {
            URL.revokeObjectURL(url);
            reject(new Error('Canvas 2D context not available'));
            return;
          }

          ctx.imageSmoothingEnabled = true;
          ctx.imageSmoothingQuality = 'high';
          ctx.scale(scaleFactor, scaleFactor);
          ctx.drawImage(img, 0, 0);

          URL.revokeObjectURL(url);

          canvas.toBlob((blob) => {
            if (blob) {
              resolve(blob);
            } else {
              reject(new Error('Failed to create PNG blob from canvas'));
            }
          }, 'image/png');
        } catch (err) {
          URL.revokeObjectURL(url);
          reject(err);
        }
      };

      img.onerror = () => {
        URL.revokeObjectURL(url);
        reject(new Error('Failed to load SVG into Image for rasterization'));
      };

      img.src = url;
    });
  }

  /**
   * Export high-resolution PNG image
   */
  public static async exportPng(
    ast: GraphAST,
    stylesCatalog?: TikzStylesCatalog,
    options: PngExportOptions = {},
    filename: string = 'diagram.png'
  ): Promise<Blob> {
    const blob = await this.generatePngBlob(ast, stylesCatalog, options);
    downloadBlob(blob, filename);
    return blob;
  }

  /**
   * Export pure .tikz code snippet
   */
  public static exportTikz(ast: GraphAST, filename: string = 'diagram.tikz'): string {
    const code = emitTikz(ast);
    downloadText(code, filename, 'text/plain');
    return code;
  }

  /**
   * Generates complete standalone LaTeX document (.tex) from raw TikZ code or GraphAST
   */
  public static generateStandaloneTex(
    sourceOrAst: string | GraphAST,
    stylesCatalog?: TikzStylesCatalog,
    config?: PreambleConfig
  ): string {
    const tikzCode = typeof sourceOrAst === 'string' ? sourceOrAst : emitTikz(sourceOrAst);
    const stylesCode = stylesCatalog ? emitTikzStyles(stylesCatalog) : undefined;
    return defaultPreambleManager.generateStandaloneDocument(tikzCode, stylesCode, config);
  }

  /**
   * Export complete standalone LaTeX document (.tex)
   */
  public static exportTex(
    sourceOrAst: string | GraphAST,
    stylesCatalog?: TikzStylesCatalog,
    config?: PreambleConfig,
    filename: string = 'diagram.tex'
  ): string {
    const texDoc = this.generateStandaloneTex(sourceOrAst, stylesCatalog, config);
    downloadText(texDoc, filename, 'application/x-latex');
    return texDoc;
  }

  /**
   * Copy TikZ snippet to system clipboard
   */
  public static async copyTikzToClipboard(ast: GraphAST): Promise<boolean> {
    const code = emitTikz(ast);
    if (typeof navigator !== 'undefined' && navigator.clipboard && navigator.clipboard.writeText) {
      try {
        await navigator.clipboard.writeText(code);
        return true;
      } catch {
        // Fallback
      }
    }

    if (typeof document !== 'undefined') {
      const textarea = document.createElement('textarea');
      textarea.value = code;
      textarea.style.position = 'fixed';
      textarea.style.opacity = '0';
      document.body.appendChild(textarea);
      textarea.select();
      const success = document.execCommand('copy');
      document.body.removeChild(textarea);
      return success;
    }
    return false;
  }
}
