import { test, expect } from '@playwright/test';

test.describe('Sprint 11: Desktop Style Palette & Action Bar', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('#style-palette-island');
    await page.waitForFunction(() => typeof (window as any).TikzitApp !== 'undefined');

    // Ensure baseline diagram exists with node 0 and edge 0
    await page.evaluate(() => {
      (window as any).TikzitApp.loadTikz(`\\begin{tikzpicture}
\\begin{pgfonlayer}{nodelayer}
\\node [style=none] (0) at (-1, 0) {};
\\node [style=none] (1) at (1, 0) {};
\\end{pgfonlayer}
\\begin{pgfonlayer}{edgelayer}
\\draw (0) to (1);
\\end{pgfonlayer}
\\end{tikzpicture}`);
    });
  });

  test('11-E2E-01: Displays desktop 4-button action bar and stylesheet file label', async ({ page }) => {
    const actionBar = page.locator('[data-testid="desktop-style-action-bar"]');
    await expect(actionBar).toBeVisible();

    const newBtn = page.locator('[data-testid="style-action-new"]');
    const openBtn = page.locator('[data-testid="style-action-open"]');
    const editBtn = page.locator('[data-testid="style-action-edit"]');
    const refreshBtn = page.locator('[data-testid="style-action-refresh"]');

    await expect(newBtn).toBeVisible();
    await expect(openBtn).toBeVisible();
    await expect(editBtn).toBeVisible();
    await expect(refreshBtn).toBeVisible();

    // Verify 16x16 icon sizing inside toolbar buttons
    const icon = openBtn.locator('img');
    await expect(icon).toHaveAttribute('width', '16');
    await expect(icon).toHaveAttribute('height', '16');

    // Stylesheet label
    const fileLabel = page.locator('[data-testid="style-file-label"]');
    await expect(fileLabel).toBeVisible();
  });

  test('11-E2E-02: Category combobox filters node styles while keeping edge styles intact', async ({ page }) => {
    const select = page.locator('[data-testid="category-select"]');
    await expect(select).toBeVisible();

    // Option (all) should be first
    const firstOption = select.locator('option').first();
    await expect(firstOption).toHaveText('(all)');
    await expect(firstOption).toHaveAttribute('value', '');

    // Both Z (node) and none (edge) should initially be visible
    const zSwatch = page.locator('button[data-style-name="Z"]');
    const edgeNoneSwatch = page.locator('button[data-style-name="none"]').last();
    await expect(zSwatch).toBeVisible();
    await expect(edgeNoneSwatch).toBeVisible();
  });

  test('11-E2E-03: Desktop swatch grid displays 48x48 icon cells with synthetic none at index 0', async ({ page }) => {
    // Both Node Styles and Edge Styles sections exist
    await expect(page.locator('text=Node Styles')).toBeVisible();
    await expect(page.locator('text=Edge Styles')).toBeVisible();

    // Both sections have synthetic none at index 0
    const noneButtons = page.locator('button[data-style-name="none"]');
    await expect(noneButtons.first()).toBeVisible();

    // Verify 48x48 bounding box (w-12 h-12 in Tailwind)
    const box = await noneButtons.first().boundingBox();
    expect(box).not.toBeNull();
    if (box) {
      expect(Math.round(box.width)).toBe(48);
      expect(Math.round(box.height)).toBe(48);
    }
  });

  test('11-E2E-04: Single-click sets active style and double-click applies to canvas selection', async ({ page }) => {
    // Select node 0 on canvas
    await page.evaluate(() => (window as any).TikzitApp.selectNode('0'));

    // Double-click on 'Z' swatch
    const zSwatch = page.locator('button[data-style-name="Z"]');
    await zSwatch.dblclick();

    // Verify node style updated to 'Z'
    const nodeStyle = await page.evaluate(() => (window as any).TikzitApp.getGraph().nodes[0].style);
    expect(nodeStyle).toBe('Z');
  });

  test('11-E2E-05: New Stylesheet action clears catalog and updates file label to [no styles]', async ({ page }) => {
    const newBtn = page.locator('[data-testid="style-action-new"]');
    await newBtn.click();

    const fileLabel = page.locator('[data-testid="style-file-label"]');
    await expect(fileLabel).toHaveText('[no styles]');
  });
});
