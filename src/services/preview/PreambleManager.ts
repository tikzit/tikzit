/**
 * Preamble Configuration Manager for TikZiT Web
 * Manages standard LaTeX/TikZ packages, TikZ libraries, layers, and standalone document generation.
 * Matches desktop TikZiT tex/sample/tikzit.sty and latexprocess.cpp semantics.
 */

export interface PreambleConfig {
  documentClass: string;
  documentClassOptions: string;
  packages: string[];
  tikzLibraries: string[];
  customPreambleLines: string[];
  includeTikzitSty: boolean;
  declareLayers: boolean;
}

export const ALLOWED_PACKAGES = [
  'tikz',
  'amsmath',
  'amssymb',
  'amsfonts',
  'tikz-cd',
  'pgfplots',
  'xcolor',
  'graphicx',
  'preview',
] as const;

export const ALLOWED_TIKZ_LIBRARIES = [
  'backgrounds',
  'arrows',
  'arrows.meta',
  'shapes',
  'shapes.geometric',
  'shapes.misc',
  'decorations.pathmorphing',
  'calc',
  'positioning',
  'fit',
  'matrix',
] as const;

export const DEFAULT_PREAMBLE_CONFIG: PreambleConfig = {
  documentClass: 'article',
  documentClassOptions: '11pt',
  packages: ['tikz', 'amsmath', 'amssymb'],
  tikzLibraries: [
    'backgrounds',
    'arrows',
    'arrows.meta',
    'shapes',
    'shapes.geometric',
    'shapes.misc',
    'decorations.pathmorphing',
    'calc',
  ],
  customPreambleLines: [],
  includeTikzitSty: true,
  declareLayers: true,
};

const STORAGE_KEY = 'tikzit:preamble-config';

export class PreambleManager {
  private config: PreambleConfig;

  constructor(initialConfig?: Partial<PreambleConfig>) {
    this.config = this.loadConfig(initialConfig);
  }

  private loadConfig(override?: Partial<PreambleConfig>): PreambleConfig {
    if (override) {
      return { ...DEFAULT_PREAMBLE_CONFIG, ...override };
    }
    if (typeof window !== 'undefined' && window.localStorage) {
      try {
        const stored = window.localStorage.getItem(STORAGE_KEY);
        if (stored) {
          const parsed = JSON.parse(stored);
          return { ...DEFAULT_PREAMBLE_CONFIG, ...parsed };
        }
      } catch {
        // Fallback to default
      }
    }
    return { ...DEFAULT_PREAMBLE_CONFIG };
  }

  public getConfig(): PreambleConfig {
    return { ...this.config };
  }

  public setConfig(newConfig: Partial<PreambleConfig>): PreambleConfig {
    this.config = { ...this.config, ...newConfig };
    this.save();
    return this.getConfig();
  }

  public resetToDefault(): PreambleConfig {
    this.config = { ...DEFAULT_PREAMBLE_CONFIG };
    this.save();
    return this.getConfig();
  }

  public save(): void {
    if (typeof window !== 'undefined' && window.localStorage) {
      try {
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(this.config));
      } catch {
        // ignore storage errors
      }
    }
  }

  public isPackageAllowed(pkg: string): boolean {
    return (ALLOWED_PACKAGES as readonly string[]).includes(pkg.trim());
  }

  public isLibraryAllowed(lib: string): boolean {
    return (ALLOWED_TIKZ_LIBRARIES as readonly string[]).includes(lib.trim());
  }

  /**
   * Generates the preamble portion (everything before \begin{document}).
   */
  public generatePreambleHeader(config: PreambleConfig = this.config): string {
    const lines: string[] = [];

    const opt = config.documentClassOptions ? `[${config.documentClassOptions}]` : '';
    lines.push(`\\documentclass${opt}{${config.documentClass}}`);
    lines.push('');

    // Packages
    for (const pkg of config.packages) {
      lines.push(`\\usepackage{${pkg}}`);
    }
    lines.push('');

    // TikZ Libraries
    if (config.tikzLibraries.length > 0) {
      lines.push(`\\usetikzlibrary{${config.tikzLibraries.join(',')}}`);
      lines.push('');
    }

    if (config.includeTikzitSty) {
      lines.push('% Standard TikZiT definitions and dummy keys');
      lines.push('\\pgfkeys{/tikz/tikzit fill/.initial=0}');
      lines.push('\\pgfkeys{/tikz/tikzit draw/.initial=0}');
      lines.push('\\pgfkeys{/tikz/tikzit shape/.initial=0}');
      lines.push('\\pgfkeys{/tikz/tikzit category/.initial=0}');
      lines.push('\\tikzstyle{tikzfig}=[baseline=-0.25em,scale=0.5]');
      lines.push('\\tikzstyle{none}=[inner sep=0mm]');
      lines.push('\\tikzstyle{every loop}=[]');
      lines.push('');
    }

    if (config.declareLayers) {
      lines.push('% PGF Layer declarations');
      lines.push('\\pgfdeclarelayer{edgelayer}');
      lines.push('\\pgfdeclarelayer{nodelayer}');
      lines.push('\\pgfsetlayers{background,edgelayer,nodelayer,main}');
      lines.push('');
    }

    // Custom preamble lines
    if (config.customPreambleLines.length > 0) {
      lines.push('% Custom preamble additions');
      for (const line of config.customPreambleLines) {
        lines.push(line);
      }
      lines.push('');
    }

    return lines.join('\n');
  }

  /**
   * Generates a complete compilable standalone LaTeX document.
   */
  public generateStandaloneDocument(
    tikzCode: string,
    stylesCode?: string,
    config: PreambleConfig = this.config
  ): string {
    const preamble = this.generatePreambleHeader(config);
    const parts: string[] = [preamble];

    if (stylesCode && stylesCode.trim().length > 0) {
      parts.push('% TikZ Stylesheet definitions');
      parts.push(stylesCode.trim());
      parts.push('');
    }

    parts.push('\\begin{document}');
    parts.push('');
    parts.push(tikzCode.trim());
    parts.push('');
    parts.push('\\end{document}');

    return parts.join('\n');
  }
}

export const defaultPreambleManager = new PreambleManager();
