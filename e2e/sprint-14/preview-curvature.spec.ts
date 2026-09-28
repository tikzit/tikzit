import { test, expect } from '@playwright/test';

test.describe('Sprint 14: Live TeX Preview Curvature & Edge Geometry Synchronization', () => {
  test.beforeEach(async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto('/');
    await page.waitForSelector('#tikzit-workbench');
    await page.waitForSelector('canvas#webgl-stage');
    await page.waitForSelector('[data-testid="panel-preview"]');
  });

  test('14-E2E-01: Straight edges render with linear SVG paths (L) in Live TeX Preview', async ({ page }) => {
    const straightTikz = String.raw`\begin{tikzpicture}
\begin{pgfonlayer}{nodelayer}
\node [style=none] (0) at (-1, 0) {};
\node [style=none] (1) at (1, 0) {};
\end{pgfonlayer}
\begin{pgfonlayer}{edgelayer}
\draw (0) to (1);
\end{pgfonlayer}
\end{tikzpicture}`;

    await page.evaluate((code) => {
      (window as any).TikzitApp.loadTikz(code);
    }, straightTikz);

    const previewEdge = page.locator('[data-testid="panel-preview"] svg #edge-e_0');
    await expect(previewEdge).toBeAttached();
    await expect(previewEdge).toHaveAttribute('d', / L /);
    await expect(previewEdge).not.toHaveAttribute('d', / C /);
  });

  test('14-E2E-02: Curved edges with bend left/right render as cubic Bézier paths (C) in Live TeX Preview', async ({ page }) => {
    const curvedTikz = String.raw`\begin{tikzpicture}
\begin{pgfonlayer}{nodelayer}
\node [style=none] (0) at (-1, 0) {};
\node [style=none] (1) at (1, 1) {};
\node [style=none] (2) at (1, -1) {};
\end{pgfonlayer}
\begin{pgfonlayer}{edgelayer}
\draw [bend left=35] (0) to (1);
\draw [bend right=45] (0) to (2);
\end{pgfonlayer}
\end{tikzpicture}`;

    await page.evaluate((code) => {
      (window as any).TikzitApp.loadTikz(code);
    }, curvedTikz);

    const topEdge = page.locator('[data-testid="panel-preview"] svg #edge-e_0');
    const bottomEdge = page.locator('[data-testid="panel-preview"] svg #edge-e_1');

    await expect(topEdge).toBeAttached();
    await expect(bottomEdge).toBeAttached();

    await expect(topEdge).toHaveAttribute('d', / C /);
    await expect(bottomEdge).toHaveAttribute('d', / C /);
  });

  test('14-E2E-03: Dynamic curvature editing updates Live TeX Preview immediately', async ({ page }) => {
    const initialTikz = String.raw`\begin{tikzpicture}
\begin{pgfonlayer}{nodelayer}
\node [style=none] (0) at (-1, 0) {};
\node [style=none] (1) at (1, 0) {};
\end{pgfonlayer}
\begin{pgfonlayer}{edgelayer}
\draw (0) to (1);
\end{pgfonlayer}
\end{tikzpicture}`;

    await page.evaluate((code) => {
      (window as any).TikzitApp.loadTikz(code);
    }, initialTikz);

    const previewEdge = page.locator('[data-testid="panel-preview"] svg #edge-e_0');
    await expect(previewEdge).toBeAttached();
    await expect(previewEdge).toHaveAttribute('d', / L /);

    // Mutate graph to add curvature
    await page.evaluate(() => {
      const graph = (window as any).TikzitApp.getGraph();
      graph.edges[0].data.push({ key: 'bend left', value: '40' });
      graph.edges[0].bend = -40;
      (window as any).TikzitApp.setGraph({ ...graph });
    });

    // Verify preview automatically updates with cubic Bézier path 'C'
    await expect(previewEdge).toHaveAttribute('d', / C /);
  });

  test('14-E2E-04: Self-loop edges render as smooth loops (C) in Live TeX Preview', async ({ page }) => {
    const loopTikz = String.raw`\begin{tikzpicture}
\begin{pgfonlayer}{nodelayer}
\node [style=none] (0) at (0, 0) {};
\end{pgfonlayer}
\begin{pgfonlayer}{edgelayer}
\draw [in=135, out=45, loop] (0) to ();
\end{pgfonlayer}
\end{tikzpicture}`;

    await page.evaluate((code) => {
      (window as any).TikzitApp.loadTikz(code);
    }, loopTikz);

    const loopEdge = page.locator('[data-testid="panel-preview"] svg #edge-e_0');
    await expect(loopEdge).toBeAttached();
    await expect(loopEdge).toHaveAttribute('d', / C /);
  });
});
