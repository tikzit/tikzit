import { test, expect } from '@playwright/test';
import fs from 'fs';
import path from 'path';

test.describe('Sprint 01: In-Browser AST Round-Trip Invariance', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/test-harness/ast-runner.html');
    await page.waitForFunction(() => (window as any).TikzParser !== undefined);
  });

  test('01-E2E-01: Normalized semantic round-trip of reviewed supported fixtures', async ({ page }) => {
    const manifestPath = path.resolve('docs/examples/manifest.json');
    const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));

    for (const item of manifest) {
      const tikzPath = path.resolve('docs/examples', item.tikz_file);
      const originalTikz = fs.readFileSync(tikzPath, 'utf8');

      const result = await page.evaluate((source) => {
        const ast = (window as any).TikzParser.parse(source);
        const reEmitted = (window as any).TikzParser.emit(ast);
        const reParsed = (window as any).TikzParser.parse(reEmitted);

        return {
          nodeCount: ast.nodes.length,
          edgeCount: ast.edges.length,
          reParsedNodeCount: reParsed.nodes.length,
          reParsedEdgeCount: reParsed.edges.length,
          astDiffEmpty:
            JSON.stringify((window as any).TikzParser.normalize(ast)) ===
            JSON.stringify((window as any).TikzParser.normalize(reParsed)),
        };
      }, originalTikz);

      expect(result.nodeCount).toBeGreaterThan(0);
      expect(result.nodeCount).toBe(result.reParsedNodeCount);
      expect(result.edgeCount).toBe(result.reParsedEdgeCount);
      expect(result.astDiffEmpty).toBe(true);
    }
  });

  test('01-E2E-02: Graceful error recovery on malformed TikZ syntax', async ({ page }) => {
    const malformedSnippets = [
      String.raw`\begin{tikzpicture} \node [style=none] (a) at (0, 0) {Missing semicolon} \end{tikzpicture}`,
      String.raw`\begin{tikzpicture} \node [style=none (unmatched) at (0, 0) {}; \end{tikzpicture}`,
      String.raw`\begin{tikzpicture} \draw (a) to [bend left=30] ; \end{tikzpicture}`,
    ];

    for (const snippet of malformedSnippets) {
      const errorReport = await page.evaluate((code) => {
        return (window as any).TikzParser.parseSafe(code);
      }, snippet);

      expect(errorReport.success).toBe(false);
      expect(errorReport.errors.length).toBeGreaterThan(0);
      expect(errorReport.errors[0].line).toBeGreaterThan(0);
      expect(errorReport.partialAST).not.toBeNull();
    }
  });

  test('01-E2E-03: AST parsing benchmark reports fixture and runtime measurements', async ({ page }) => {
    const benchmarkResults = await page.evaluate(async () => {
      const sampleTikz = String.raw`\begin{tikzpicture}
\begin{pgfonlayer}{nodelayer}
\node [style=Z] (0) at (-1, 0) {$\\alpha$};
\node [style=X] (1) at (1, 0) {$\\beta$};
\end{pgfonlayer}
\begin{pgfonlayer}{edgelayer}
\draw [style=wire, bend left=30] (0) to (1);
\draw [style=wire, bend right=30] (0) to (1);
\end{pgfonlayer}
\end{tikzpicture}`;

      const t0 = performance.now();
      for (let i = 0; i < 200; i++) {
        (window as any).TikzParser.parse(sampleTikz);
      }
      const t1 = performance.now();
      return (t1 - t0) / 200; // avg ms
    });

    expect(Number.isFinite(benchmarkResults)).toBe(true);
    expect(benchmarkResults).toBeGreaterThanOrEqual(0);
  });
});
