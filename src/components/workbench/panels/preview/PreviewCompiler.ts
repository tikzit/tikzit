/**
 * src/components/workbench/panels/preview/PreviewCompiler.ts - Sprint 22
 * Pure compilation function AST -> SVG. Headless, decoupled from React lifecycle.
 */
import type { GraphAST, TikzStylesCatalog } from '../../../../core/domain/types';
import { generateSvg, type SvgGeneratorOptions } from '../../../../services/preview/SvgGenerator';

export interface CompilationResult {
  success: boolean;
  svg: string;
  error?: string;
  nodeCount: number;
  edgeCount: number;
  timestamp: number;
}

export function compileAstToSvg(
  graph: GraphAST,
  stylesCatalog: TikzStylesCatalog,
  options: Partial<SvgGeneratorOptions> = {}
): CompilationResult {
  const mergedOptions: SvgGeneratorOptions = {
    scale: 55,
    padding: 35,
    theme: 'dark',
    transparentBg: true,
    ...options,
  };

  try {
    const svg = generateSvg(graph, stylesCatalog, mergedOptions);
    return {
      success: true,
      svg,
      nodeCount: graph.nodes?.length ?? 0,
      edgeCount: graph.edges?.length ?? 0,
      timestamp: Date.now(),
    };
  } catch (err: any) {
    return {
      success: false,
      svg: '',
      error: err?.message || 'SVG compilation failed',
      nodeCount: graph?.nodes?.length ?? 0,
      edgeCount: graph?.edges?.length ?? 0,
      timestamp: Date.now(),
    };
  }
}
