/**
 * src/components/workbench/panels/history/VersionDiffEngine.ts - Sprint 22
 * Pure mathematical AST delta and line diff engine. Zero React/DOM dependencies.
 */
import type { GraphAST } from '../../../../core/domain/types';

export interface LineDiffItem {
  type: 'added' | 'removed' | 'unchanged';
  text: string;
}

export interface StatDeltas {
  nodeDelta: number;
  edgeDelta: number;
  oldNodeCount: number;
  newNodeCount: number;
  oldEdgeCount: number;
  newEdgeCount: number;
}

export function computeLineDiff(oldText: string, newText: string): LineDiffItem[] {
  const oldLines = oldText.split('\n');
  const newLines = newText.split('\n');
  const m = oldLines.length;
  const n = newLines.length;
  const dp: number[][] = Array.from({ length: m + 1 }, () => new Array(n + 1).fill(0));

  for (let i = 0; i < m; i++) {
    for (let j = 0; j < n; j++) {
      if (oldLines[i] === newLines[j]) {
        dp[i + 1][j + 1] = dp[i][j] + 1;
      } else {
        dp[i + 1][j + 1] = Math.max(dp[i + 1][j], dp[i][j + 1]);
      }
    }
  }

  const result: LineDiffItem[] = [];
  let i = m;
  let j = n;
  while (i > 0 || j > 0) {
    if (i > 0 && j > 0 && oldLines[i - 1] === newLines[j - 1]) {
      result.unshift({ type: 'unchanged', text: oldLines[i - 1] });
      i--;
      j--;
    } else if (j > 0 && (i === 0 || dp[i][j - 1] >= dp[i - 1][j])) {
      result.unshift({ type: 'added', text: newLines[j - 1] });
      j--;
    } else if (i > 0 && (j === 0 || dp[i][j - 1] < dp[i - 1][j])) {
      result.unshift({ type: 'removed', text: oldLines[i - 1] });
      i--;
    }
  }
  return result;
}

export function computeStatDeltas(oldAst: GraphAST | null, newAst: GraphAST | null): StatDeltas {
  const oldNodes = oldAst?.nodes?.length ?? 0;
  const newNodes = newAst?.nodes?.length ?? 0;
  const oldEdges = oldAst?.edges?.length ?? 0;
  const newEdges = newAst?.edges?.length ?? 0;

  return {
    nodeDelta: newNodes - oldNodes,
    edgeDelta: newEdges - oldEdges,
    oldNodeCount: oldNodes,
    newNodeCount: newNodes,
    oldEdgeCount: oldEdges,
    newEdgeCount: newEdges,
  };
}
