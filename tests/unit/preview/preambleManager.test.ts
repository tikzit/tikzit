import { describe, it, expect, beforeEach } from 'vitest';
import { PreambleManager, DEFAULT_PREAMBLE_CONFIG } from '../../../src/services/preview/PreambleManager';

describe('PreambleManager', () => {
  let manager: PreambleManager;

  beforeEach(() => {
    manager = new PreambleManager();
    manager.resetToDefault();
  });

  it('initializes with default TikZiT packages and libraries', () => {
    const config = manager.getConfig();
    expect(config.packages).toContain('tikz');
    expect(config.packages).toContain('amsmath');
    expect(config.tikzLibraries).toContain('arrows.meta');
    expect(config.includeTikzitSty).toBe(true);
    expect(config.declareLayers).toBe(true);
  });

  it('validates allowed packages and libraries', () => {
    expect(manager.isPackageAllowed('tikz')).toBe(true);
    expect(manager.isPackageAllowed('amsmath')).toBe(true);
    expect(manager.isPackageAllowed('malicious-package')).toBe(false);

    expect(manager.isLibraryAllowed('arrows.meta')).toBe(true);
    expect(manager.isLibraryAllowed('decorations.pathmorphing')).toBe(true);
    expect(manager.isLibraryAllowed('unknown-library')).toBe(false);
  });

  it('generates standard preamble header with layers and tikzit definitions', () => {
    const header = manager.generatePreambleHeader();
    expect(header).toContain('\\documentclass[11pt]{article}');
    expect(header).toContain('\\usepackage{tikz}');
    expect(header).toContain('\\pgfdeclarelayer{edgelayer}');
    expect(header).toContain('\\pgfdeclarelayer{nodelayer}');
    expect(header).toContain('\\tikzstyle{tikzfig}=[baseline=-0.25em,scale=0.5]');
    expect(header).toContain('\\tikzstyle{none}=[inner sep=0mm]');
  });

  it('generates complete compilable standalone LaTeX document', () => {
    const tikzCode = '\\begin{tikzpicture}\n\\node (a) {A};\n\\end{tikzpicture}';
    const stylesCode = '\\tikzstyle{my style}=[circle,draw=black]';
    const doc = manager.generateStandaloneDocument(tikzCode, stylesCode);

    expect(doc).toContain('\\documentclass');
    expect(doc).toContain(stylesCode);
    expect(doc).toContain('\\begin{document}');
    expect(doc).toContain(tikzCode);
    expect(doc).toContain('\\end{document}');
  });

  it('supports custom preamble lines', () => {
    manager.setConfig({
      customPreambleLines: ['\\newcommand{\\ket}[1]{|#1\\rangle}'],
    });
    const header = manager.generatePreambleHeader();
    expect(header).toContain('\\newcommand{\\ket}[1]{|#1\\rangle}');
  });
});
