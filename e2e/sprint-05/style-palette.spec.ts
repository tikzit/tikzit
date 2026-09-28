import { test, expect } from '@playwright/test';

test.describe('Sprint 05: Style Palette & Property Inspector', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('#style-palette-island');
    // Ensure TikzitApp is ready
    await page.waitForFunction(() => typeof (window as any).TikzitApp !== 'undefined');

    // Ensure a baseline diagram exists with node 0 and edge 0
    await page.evaluate(() => {
      const g = (window as any).TikzitApp.getGraph();
      if (!g || g.nodes.length === 0) {
        (window as any).TikzitApp.loadTikz(`\\begin{tikzpicture}
\\begin{pgfonlayer}{nodelayer}
\\node [style=none] (0) at (-1, 0) {};
\\node [style=none] (1) at (1, 0) {};
\\end{pgfonlayer}
\\begin{pgfonlayer}{edgelayer}
\\draw (0) to (1);
\\end{pgfonlayer}
\\end{tikzpicture}`);
      }
    });
  });

  test('05-E2E-01: Renders palette categories and styles from the loaded stylesheet', async ({ page }) => {
    const categories = page.locator('.style-category-tab');
    await expect(categories.first()).toBeVisible();

    const zSpiderSwatch = page.locator('button[data-style-name="Z"]');
    await expect(zSpiderSwatch).toBeVisible();

    const xSpiderSwatch = page.locator('button[data-style-name="X"]');
    await expect(xSpiderSwatch).toBeVisible();
  });

  test('05-E2E-02: Applies a stylesheet entry to a selected canvas node', async ({ page }) => {
    // Select node 0 on canvas
    await page.evaluate(() => (window as any).TikzitApp.selectNode('0'));

    // Apply the green Z style
    await page.locator('button[data-style-name="Z"]').click();

    // Verify node style updated in graph model and inspector
    const nodeStyle = await page.evaluate(() => (window as any).TikzitApp.getGraph().nodes[0].style);
    expect(nodeStyle).toBe('Z');

    const inspectorStyleInput = page.locator('#node-style-select');
    await expect(inspectorStyleInput).toHaveValue('Z');
  });

  test('05-E2E-03: Property Inspector edits label and phase angle', async ({ page }) => {
    await page.evaluate(() => (window as any).TikzitApp.selectNode('0'));

    const labelInput = page.locator('#node-label-input');
    await labelInput.fill('\\alpha');
    await labelInput.press('Enter');

    const updatedLabel = await page.evaluate(() => (window as any).TikzitApp.getGraph().nodes[0].label);
    expect(updatedLabel).toBe('\\alpha');
  });

  test('05-E2E-04: Edge property inspector configures wire styles', async ({ page }) => {
    await page.evaluate(() => (window as any).TikzitApp.selectEdge(0));

    const dashedCheckbox = page.locator('#edge-dashed-checkbox');
    await dashedCheckbox.check();

    const isDashed = await page.evaluate(() => {
      const edge = (window as any).TikzitApp.getGraph().edges[0];
      return edge.properties['dashed'] !== undefined;
    });
    expect(isDashed).toBe(true);
  });

  test('05-E2E-05: Style Editor modal creates and saves new custom style', async ({ page }) => {
    await page.locator('#open-style-editor-btn').click();
    const modal = page.locator('#style-editor-modal');
    await expect(modal).toBeVisible();

    await modal.locator('#new-style-btn').click();
    await modal.locator('#style-name-input').fill('Custom Blue Node');
    await modal.locator('#style-fill-color').fill('#3B82F6');
    await modal.locator('#save-style-btn').click();

    await expect(modal).toBeHidden();
    await expect(page.locator('button[data-style-name="Custom Blue Node"]')).toBeVisible();
  });
});
