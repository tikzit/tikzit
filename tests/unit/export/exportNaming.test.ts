import { describe, it, expect, beforeEach } from 'vitest';
import { sanitizeFilename, FilenameCollisionTracker } from '../../../src/services/export/exportNaming';

describe('exportNaming', () => {
  describe('sanitizeFilename', () => {
    it('preserves valid characters and appends extension', () => {
      expect(sanitizeFilename('my-diagram', 'tikz')).toBe('my-diagram.tikz');
      expect(sanitizeFilename('my-diagram', '.tikz')).toBe('my-diagram.tikz');
      expect(sanitizeFilename('Quantum Teleportation 2026', 'pdf')).toBe('Quantum Teleportation 2026.pdf');
    });

    it('strips illegal filename characters', () => {
      expect(sanitizeFilename('foo/bar:baz*qux?val"ok<yes>no|pipe', 'svg')).toBe(
        'foo_bar_baz_qux_val_ok_yes_no_pipe.svg'
      );
    });

    it('collapses multiple whitespace characters and trims', () => {
      expect(sanitizeFilename('   spaced   out   name   ', 'png')).toBe('spaced out name.png');
    });

    it('handles empty or blank titles with fallback', () => {
      expect(sanitizeFilename('', 'tex')).toBe('Untitled.tex');
      expect(sanitizeFilename('   ', 'tex')).toBe('Untitled.tex');
      expect(sanitizeFilename(null, 'tex')).toBe('Untitled.tex');
      expect(sanitizeFilename('???', 'tex')).toBe('Untitled.tex');
      expect(sanitizeFilename('', 'tex', { fallbackTitle: 'Draft' })).toBe('Draft.tex');
    });

    it('strips leading and trailing dots to prevent hidden/unsafe files', () => {
      expect(sanitizeFilename('...diagram...', 'tikz')).toBe('diagram.tikz');
    });

    it('caps maximum length before extension', () => {
      const veryLong = 'a'.repeat(200);
      const res = sanitizeFilename(veryLong, 'pdf', { maxLength: 50 });
      expect(res).toBe(`${'a'.repeat(50)}.pdf`);
    });
  });

  describe('FilenameCollisionTracker', () => {
    let tracker: FilenameCollisionTracker;

    beforeEach(() => {
      tracker = new FilenameCollisionTracker();
    });

    it('returns original name when no collision exists', () => {
      expect(tracker.getUniqueFilename('spider.tikz')).toBe('spider.tikz');
      expect(tracker.getUniqueFilename('teleport.pdf')).toBe('teleport.pdf');
    });

    it('appends incrementing suffixes upon collisions', () => {
      expect(tracker.getUniqueFilename('spider.tikz')).toBe('spider.tikz');
      expect(tracker.getUniqueFilename('spider.tikz')).toBe('spider-2.tikz');
      expect(tracker.getUniqueFilename('spider.tikz')).toBe('spider-3.tikz');
    });

    it('resets cleanly', () => {
      expect(tracker.getUniqueFilename('diagram.svg')).toBe('diagram.svg');
      expect(tracker.getUniqueFilename('diagram.svg')).toBe('diagram-2.svg');
      tracker.reset();
      expect(tracker.getUniqueFilename('diagram.svg')).toBe('diagram.svg');
    });
  });
});
