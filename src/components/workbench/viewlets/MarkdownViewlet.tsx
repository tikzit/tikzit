import React, { useState } from 'react';
import { compileMarkdown } from '../../../services/markdown/markdownCompiler';
import { downloadText } from '../../../services/export/ImageExporter';
import { useWorkbenchRuntime } from '../WorkbenchRuntimeContext';
import { useStore } from '@nanostores/react';
import { $stylesCatalog } from '../../../stores/workbench';

export interface MarkdownViewletProps {
  initialContent?: string;
  onContentChange?: (content: string) => void;
}

const DEFAULT_SAMPLE_MD = [
  '# ZX-Calculus Derivation',
  '',
  '> [!NOTE]',
  '> This diagram illustrates the **Spider Fusion** rule in the ZX-calculus: when two spiders of the same color are connected, they merge and their phases add modulo $2\\pi$.',
  '',
  '## Spider Fusion Theorem',
  '',
  'Consider two green spiders connected by an edge:',
  '',
  '\`\`\`tikz',
  '\\begin{tikzpicture}',
  '\t\\begin{pgfonlayer}{nodelayer}',
  '\t\t\\node [style=green spider] (0) at (-1.5, 0) {$\\alpha$};',
  '\t\t\\node [style=green spider] (1) at (1.5, 0) {$\\beta$};',
  '\t\\end{pgfonlayer}',
  '\t\\begin{pgfonlayer}{edgelayer}',
  '\t\t\\draw (0) to (1);',
  '\t\\end{pgfonlayer}',
  '\\end{tikzpicture}',
  '\`\`\`',
  '',
  '> [!TIP]',
  '> Use the **Preview** panel to pan and zoom on the vector diagram, or export to SVG/PDF.',
].join('\n');

export const MarkdownViewlet: React.FC<MarkdownViewletProps> = ({
  initialContent = DEFAULT_SAMPLE_MD,
  onContentChange,
}) => {
  let runtime: ReturnType<typeof useWorkbenchRuntime> | null = null;
  try {
    runtime = useWorkbenchRuntime();
  } catch {
    // outside provider
  }

  const catalogStore = runtime ? runtime.stores.$stylesCatalog : $stylesCatalog;
  const stylesCatalog = useStore(catalogStore);

  const [content, setContent] = useState(initialContent);
  const [mode, setMode] = useState<'preview' | 'edit'>('preview');
  const [copied, setCopied] = useState(false);

  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value;
    setContent(val);
    if (onContentChange) onContentChange(val);
  };

  const handleCopy = async () => {
    if (navigator?.clipboard?.writeText) {
      await navigator.clipboard.writeText(content);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleDownload = () => {
    downloadText(content, 'document.md', 'text/markdown');
  };

  const compiledHtml = compileMarkdown(content, stylesCatalog);

  return (
    <div
      className="w-full h-full bg-[#12141a] flex flex-col font-sans text-xs select-text"
      data-testid="markdown-viewlet"
    >
      {/* Viewlet Header */}
      <div className="h-8 bg-[#1a1d26] border-b border-[#2e3446] px-3 flex items-center justify-between text-[#94a3b8]">
        <div className="flex items-center space-x-2">
          <span className="font-semibold text-slate-200">Markdown Note</span>
          <span className="text-[10px] bg-purple-900/50 text-purple-300 px-1.5 py-0.5 rounded border border-purple-700/40">
            TeX / TikZ Card
          </span>
        </div>

        <div className="flex items-center space-x-1.5">
          <div className="bg-[#12141a] p-0.5 rounded border border-[#2e3446] flex">
            <button
              onClick={() => setMode('preview')}
              className={`px-2 py-0.5 rounded text-[11px] font-medium transition-colors ${
                mode === 'preview'
                  ? 'bg-blue-600 text-white'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
              data-testid="md-btn-preview"
            >
              Preview
            </button>
            <button
              onClick={() => setMode('edit')}
              className={`px-2 py-0.5 rounded text-[11px] font-medium transition-colors ${
                mode === 'edit'
                  ? 'bg-blue-600 text-white'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
              data-testid="md-btn-edit"
            >
              Edit
            </button>
          </div>

          <button
            onClick={handleCopy}
            className="hover:text-white px-2 py-1 bg-[#222634] rounded border border-[#2e3446] text-[11px] transition-colors"
            title="Copy Markdown"
          >
            {copied ? 'Copied!' : 'Copy'}
          </button>
          <button
            onClick={handleDownload}
            className="hover:text-white px-2 py-1 bg-[#222634] rounded border border-[#2e3446] text-[11px] transition-colors"
            title="Download Markdown file"
          >
            Download .md
          </button>
        </div>
      </div>

      {/* Viewlet Content */}
      <div className="flex-1 overflow-auto p-4">
        {mode === 'preview' ? (
          <div
            className="prose prose-invert max-w-none text-slate-200 leading-relaxed"
            dangerouslySetInnerHTML={{ __html: compiledHtml }}
            data-testid="md-preview-content"
          />
        ) : (
          <textarea
            value={content}
            onChange={handleTextChange}
            data-testid="md-editor-textarea"
            className="w-full h-full bg-transparent font-mono text-emerald-400 p-2 focus:outline-none resize-none leading-relaxed text-xs border border-slate-700/40 rounded"
            spellCheck={false}
          />
        )}
      </div>
    </div>
  );
};
