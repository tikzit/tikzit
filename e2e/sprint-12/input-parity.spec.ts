import { test, expect } from '@playwright/test';

test.describe('Sprint 12: Keyboard & Input Parity', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('canvas#webgl-stage');
    await page.waitForFunction(() => typeof (window as any).TikzitApp !== 'undefined');
    await page.locator('canvas#webgl-stage').click();
  });

  test('12-E2E-06: Single-key tool selection shortcuts (S, V, N, E, B)', async ({ page }) => {
    const selectBtn = page.locator('[data-tool="select"]');
    const vertexBtn = page.locator('[data-tool="vertex"]');
    const edgeBtn = page.locator('[data-tool="edge"]');
    const bboxBtn = page.locator('[data-tool="bbox"]');

    // Press 'E' -> Switch to Edge tool
    await page.keyboard.press('e');
    await expect(edgeBtn).toHaveAttribute('data-active', 'true');
    await expect(edgeBtn).toHaveCSS('border-color', 'rgb(0, 200, 83)');

    // Press 'S' -> Switch to Select tool
    await page.keyboard.press('s');
    await expect(selectBtn).toHaveAttribute('data-active', 'true');
    await expect(selectBtn).toHaveCSS('border-color', 'rgb(0, 200, 83)');

    // Press 'V' -> Switch to Vertex tool
    await page.keyboard.press('v');
    await expect(vertexBtn).toHaveAttribute('data-active', 'true');
    await expect(vertexBtn).toHaveCSS('border-color', 'rgb(0, 200, 83)');

    // Press 'B' -> Switch to BBox tool
    await page.keyboard.press('b');
    await expect(bboxBtn).toHaveAttribute('data-active', 'true');
    await expect(bboxBtn).toHaveCSS('border-color', 'rgb(0, 200, 83)');

    // Press 'N' -> Switch to Vertex tool (alternate hotkey)
    await page.keyboard.press('n');
    await expect(vertexBtn).toHaveAttribute('data-active', 'true');
    await expect(vertexBtn).toHaveCSS('border-color', 'rgb(0, 200, 83)');
  });

  test('12-E2E-07: Keyboard element deletion via Backspace / Delete', async ({ page }) => {
    // Load diagram with 2 nodes and 1 connecting edge
    await page.evaluate(() => {
      (window as any).TikzitApp.loadTikz(String.raw`\begin{tikzpicture}
\begin{pgfonlayer}{nodelayer}
\node [style=none] (0) at (-1, 0) {};
\node [style=none] (1) at (1, 0) {};
\end{pgfonlayer}
\begin{pgfonlayer}{edgelayer}
\draw (0) to (1);
\end{pgfonlayer}
\end{tikzpicture}`);
    });

    await page.waitForFunction(
      () =>
        (window as any).TikzitApp.getGraph().nodes.length === 2 &&
        (window as any).TikzitApp.getGraph().edges.length === 1
    );

    // Select node 1
    await page.evaluate(() => {
      (window as any).TikzitApp.selectNode('1');
    });

    // Press Backspace / Delete to delete node 1 and incident edge
    await page.keyboard.press('Backspace');

    await page.waitForFunction(
      () =>
        (window as any).TikzitApp.getGraph().nodes.length === 1 &&
        (window as any).TikzitApp.getGraph().edges.length === 0
    );

    const graph = await page.evaluate(() => (window as any).TikzitApp.getGraph());
    expect(graph.nodes).toHaveLength(1);
    expect(graph.nodes[0].id).toBe('0');
    expect(graph.edges).toHaveLength(0);
  });

  test('12-E2E-08: Shortcut suppression inside text inputs', async ({ page }) => {
    // Switch to Edge tool initially
    await page.keyboard.press('e');
    const edgeBtn = page.locator('[data-tool="edge"]');
    await expect(edgeBtn).toHaveAttribute('data-active', 'true');

    // Focus explorer search textbox
    const searchInput = page.locator('input[placeholder*="Search"], input[type="text"]').first();
    await searchInput.focus();
    await page.keyboard.type('select vertex bbox');

    // Active tool should still be edge, NOT switched by typing 's', 'v', or 'b'
    await expect(edgeBtn).toHaveAttribute('data-active', 'true');
  });
});