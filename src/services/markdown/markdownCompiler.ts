/**
 * Safe In-Browser Markdown Compiler with TikZ Code Fence Rendering
 * Compiles Markdown subsets, callouts, math, and inline ```tikz fences into rich HTML.
 */

import { parseTikz } from '../../core/parser/parser';
import { generateSvg } from '../preview/SvgGenerator';
import type { TikzStylesCatalog } from '../../core/domain/types';

export function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

export function compileMarkdown(
  markdown: string,
  stylesCatalog?: TikzStylesCatalog
): string {
  const lines = markdown.split('\n');
  const output: string[] = [];
  let inCodeBlock = false;
  let codeBlockLang = '';
  let codeBlockBuffer: string[] = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Code block fences
    if (line.trim().startsWith('```')) {
      if (!inCodeBlock) {
        inCodeBlock = true;
        codeBlockLang = line.trim().slice(3).trim().toLowerCase();
        codeBlockBuffer = [];
        continue;
      } else {
        inCodeBlock = false;
        const codeContent = codeBlockBuffer.join('\n');

        if (codeBlockLang === 'tikz') {
          try {
            const ast = parseTikz(codeContent);
            if (ast) {
              const svg = generateSvg(ast, stylesCatalog, { scale: 50, padding: 30 });
              output.push(
                `<div class="my-4 p-4 bg-slate-900/60 rounded-lg border border-slate-700/50 flex flex-col items-center justify-center">\n` +
                `  <div class="text-[10px] text-slate-400 font-mono mb-2 self-start uppercase tracking-wider">TikZ Diagram</div>\n` +
                `  <div class="overflow-auto max-w-full">${svg}</div>\n` +
                `</div>`
              );
            } else {
              output.push(`<div class="p-3 bg-red-950/60 text-red-400 rounded text-xs font-mono">Failed to parse TikZ block</div>`);
            }
          } catch (err: any) {
            output.push(`<div class="p-3 bg-red-950/60 text-red-400 rounded text-xs font-mono">TikZ Error: ${escapeHtml(err.message || 'Syntax error')}</div>`);
          }
        } else {
          output.push(
            `<pre class="bg-slate-900 text-slate-100 p-3 rounded-lg text-xs font-mono overflow-x-auto my-3 border border-slate-800"><code>${escapeHtml(codeContent)}</code></pre>`
          );
        }
        continue;
      }
    }

    if (inCodeBlock) {
      codeBlockBuffer.push(line);
      continue;
    }

    // Callout alerts: > [!NOTE], > [!TIP], > [!IMPORTANT], > [!WARNING], > [!CAUTION]
    if (line.startsWith('>')) {
      const blockText = line.replace(/^>\s?/, '');
      const calloutMatch = blockText.match(/^\[!(NOTE|TIP|IMPORTANT|WARNING|CAUTION)\]\s*(.*)$/i);

      if (calloutMatch) {
        const type = calloutMatch[1].toUpperCase();
        const rest = calloutMatch[2];
        const colorClasses = {
          NOTE: 'border-blue-500/60 bg-blue-950/30 text-blue-200',
          TIP: 'border-emerald-500/60 bg-emerald-950/30 text-emerald-200',
          IMPORTANT: 'border-purple-500/60 bg-purple-950/30 text-purple-200',
          WARNING: 'border-amber-500/60 bg-amber-950/30 text-amber-200',
          CAUTION: 'border-rose-500/60 bg-rose-950/30 text-rose-200',
        }[type] || 'border-slate-500/60 bg-slate-900/30 text-slate-200';

        output.push(
          `<div class="my-3 p-3 pl-4 border-l-4 rounded-r-md text-xs ${colorClasses}">\n` +
          `  <strong class="font-semibold uppercase tracking-wider text-[11px] block mb-1">${type}</strong>\n` +
          `  <span>${formatInline(rest)}</span>\n` +
          `</div>`
        );
        continue;
      }

      output.push(`<blockquote class="border-l-4 border-slate-600 pl-3 my-2 text-slate-300 italic text-xs">${formatInline(blockText)}</blockquote>`);
      continue;
    }

    // Headers
    if (line.startsWith('### ')) {
      output.push(`<h3 class="text-sm font-semibold text-slate-200 mt-4 mb-1">${formatInline(line.slice(4))}</h3>`);
      continue;
    }
    if (line.startsWith('## ')) {
      output.push(`<h2 class="text-base font-bold text-slate-100 mt-5 mb-2 pb-1 border-b border-slate-800">${formatInline(line.slice(3))}</h2>`);
      continue;
    }
    if (line.startsWith('# ')) {
      output.push(`<h1 class="text-lg font-bold text-white mt-6 mb-3 pb-1 border-b border-slate-700">${formatInline(line.slice(2))}</h1>`);
      continue;
    }

    // Unordered lists
    if (line.trim().startsWith('- ') || line.trim().startsWith('* ')) {
      output.push(`<li class="ml-4 list-disc text-slate-300 text-xs my-0.5">${formatInline(line.trim().slice(2))}</li>`);
      continue;
    }

    // Empty lines
    if (line.trim().length === 0) {
      continue;
    }

    // Paragraph
    output.push(`<p class="text-xs text-slate-300 my-2 leading-relaxed">${formatInline(line)}</p>`);
  }

  return output.join('\n');
}

/**
 * Format inline markdown: bold, italics, code, math
 */
function formatInline(text: string): string {
  let escaped = escapeHtml(text);

  // Math display: $$...$$
  escaped = escaped.replace(/\$\$(.+?)\$\$/g, (_, math) => {
    return `<span class="font-serif italic text-amber-300 bg-slate-900/80 px-1 rounded">${math}</span>`;
  });

  // Math inline: $...$
  escaped = escaped.replace(/\$(.+?)\$/g, (_, math) => {
    return `<span class="font-serif italic text-amber-300">${math}</span>`;
  });

  // Inline code: `...`
  escaped = escaped.replace(/`([^\`]+)`/g, (_, code) => {
    return `<code class="bg-slate-800 text-emerald-400 px-1 py-0.5 rounded text-[11px] font-mono">${code}</code>`;
  });

  // Bold: **...**
  escaped = escaped.replace(/\*\*(.+?)\*\*/g, '<strong class="font-semibold text-slate-100">$1</strong>');

  // Italics: *...*
  escaped = escaped.replace(/\*(.+?)\*/g, '<em class="italic text-slate-200">$1</em>');

  return escaped;
}
