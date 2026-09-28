import { describe, it, expect } from 'vitest';
import { compileMarkdown } from '../../../src/services/markdown/markdownCompiler';

describe('markdownCompiler', () => {
  it('compiles headers, paragraphs, lists, bold and italics', () => {
    const md = '# Title\n## Section\n\nThis is **bold** and *italic*.\n\n- Item 1\n- Item 2';
    const html = compileMarkdown(md);

    expect(html).toContain('<h1');
    expect(html).toContain('Title</h1>');
    expect(html).toContain('<h2');
    expect(html).toContain('Section</h2>');
    expect(html).toContain('<strong class="font-semibold text-slate-100">bold</strong>');
    expect(html).toContain('<em class="italic text-slate-200">italic</em>');
    expect(html).toContain('<li class="ml-4 list-disc text-slate-300 text-xs my-0.5">Item 1</li>');
  });

  it('compiles callout alerts', () => {
    const md = '> [!NOTE]\n> This is an important note.\n\n> [!WARNING]\n> Watch out!';
    const html = compileMarkdown(md);

    expect(html).toContain('NOTE');
    expect(html).toContain('This is an important note.');
    expect(html).toContain('WARNING');
    expect(html).toContain('Watch out!');
  });

  it('compiles inline and display math formulas', () => {
    const md = 'The phase is $\\alpha + \\beta$ and $$e^{i\\pi} + 1 = 0$$.';
    const html = compileMarkdown(md);

    expect(html).toContain('font-serif italic text-amber-300');
    expect(html).toContain('\\alpha + \\beta');
  });

  it('compiles inline tikz code fences into embedded SVG diagrams', () => {
    const md = [
      'Here is a diagram:',
      '',
      '```tikz',
      '\\begin{tikzpicture}',
      '\\node (a) at (0,0) {A};',
      '\\node (b) at (2,0) {B};',
      '\\draw (a) to (b);',
      '\\end{tikzpicture}',
      '```',
    ].join('\n');

    const html = compileMarkdown(md);
    expect(html).toContain('TikZ Diagram');
    expect(html).toContain('<svg xmlns="http://www.w3.org/2000/svg"');
    expect(html).toContain('id="nodelayer"');
    expect(html).toContain('id="edgelayer"');
  });
});
