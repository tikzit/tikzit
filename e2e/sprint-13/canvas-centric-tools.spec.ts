import { test, expect } from '@playwright/test';

test.describe('Sprint 13: Canvas-Centric Tool Placement & Chrome Refinement', () => {
  test.beforeEach(async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto('/');
    await page.waitForSelector('#tikzit-workbench');
    await page.waitForSelector('canvas#webgl-stage');
  });

  test('13-E2E-01: Non-functional traffic light dots are completely removed from window chrome', async ({ page }) => {
    const chrome = page.locator('[data-testid="mac-window-chrome"]');
    await expect(chrome).toBeVisible();

    // Verify absence of decorative dots and container
    await expect(page.locator('[data-testid="mac-traffic-lights"]')).toHaveCount(0);
    await expect(page.locator('[data-testid="traffic-light-close"]')).toHaveCount(0);
    await expect(page.locator('[data-testid="traffic-light-minimize"]')).toHaveCount(0);
    await expect(page.locator('[data-testid="traffic-light-fullscreen"]')).toHaveCount(0);
  });

  test('13-E2E-02: Document title badge and New Diagram button reside on the left', async ({ page }) => {
    const chrome = page.locator('[data-testid="mac-window-chrome"]');
    const docTitle = page.locator('[data-testid="doc-tab-title"]');
    const newBtn = page.locator('[data-testid="btn-new-diagram"]');

    await expect(docTitle).toBeVisible();
    await expect(newBtn).toBeVisible();

    const chromeBox = await chrome.boundingBox();
    const titleBox = await docTitle.boundingBox();
    const newBox = await newBtn.boundingBox();

    expect(chromeBox).not.toBeNull();
    expect(titleBox).not.toBeNull();
    expect(newBox).not.toBeNull();

    if (chromeBox && titleBox && newBox) {
      // Both title and new diagram button should be on the left third of the header (x < chrome.width / 3)
      expect(titleBox.x).toBeLessThan(chromeBox.width / 3);
      expect(newBox.x).toBeLessThan(chromeBox.width / 3);
      // New button should be adjacent to (right of) the title
      expect(newBox.x).toBeGreaterThan(titleBox.x);
    }
  });

  test('13-E2E-03: Drawing tools (Select, Vertex, Edge, BBox) are centered directly above Vector Canvas workspace', async ({ page }) => {
    const chrome = page.locator('[data-testid="mac-window-chrome"]');
    const palette = page.locator('[data-testid="desktop-tool-palette"]');
    const centerZone = page.locator('[data-testid="center-toolbar-zone"]');

    await expect(palette).toBeVisible();
    await expect(centerZone).toBeVisible();

    // Ensure all 4 tools are present
    const selectBtn = page.locator('[data-tool="select"]');
    const vertexBtn = page.locator('[data-tool="vertex"]');
    const edgeBtn = page.locator('[data-tool="edge"]');
    const bboxBtn = page.locator('[data-tool="bbox"]');

    await expect(selectBtn).toBeVisible();
    await expect(vertexBtn).toBeVisible();
    await expect(edgeBtn).toBeVisible();
    await expect(bboxBtn).toBeVisible();

    // Verify mathematical horizontal centering relative to the window chrome
    const chromeBox = await chrome.boundingBox();
    const paletteBox = await palette.boundingBox();

    expect(chromeBox).not.toBeNull();
    expect(paletteBox).not.toBeNull();

    if (chromeBox && paletteBox) {
      const chromeCenter = chromeBox.x + chromeBox.width / 2;
      const paletteCenter = paletteBox.x + paletteBox.width / 2;
      expect(Math.abs(chromeCenter - paletteCenter)).toBeLessThan(5);
    }

    // Verify the palette sits above the canvas viewport in the top header
    const canvas = page.locator('canvas#webgl-stage');
    const canvasBox = await canvas.boundingBox();
    expect(canvasBox).not.toBeNull();
    if (paletteBox && canvasBox) {
      expect(paletteBox.y + paletteBox.height).toBeLessThanOrEqual(canvasBox.y);
    }
  });

  test('13-E2E-04: Tool switching in centered palette retains signature active green border', async ({ page }) => {
    const selectBtn = page.locator('[data-tool="select"]');
    const vertexBtn = page.locator('[data-tool="vertex"]');
    const edgeBtn = page.locator('[data-tool="edge"]');
    const bboxBtn = page.locator('[data-tool="bbox"]');

    // Default: select tool is active
    await expect(selectBtn).toHaveAttribute('data-active', 'true');

    // Click vertex tool
    await vertexBtn.click();
    await expect(vertexBtn).toHaveAttribute('data-active', 'true');
    await expect(vertexBtn).toHaveCSS('border-color', 'rgb(0, 200, 83)');
    await expect(selectBtn).toHaveAttribute('data-active', 'false');

    // Click edge tool
    await edgeBtn.click();
    await expect(edgeBtn).toHaveAttribute('data-active', 'true');
    await expect(edgeBtn).toHaveCSS('border-color', 'rgb(0, 200, 83)');
    await expect(vertexBtn).toHaveAttribute('data-active', 'false');

    // Click bbox tool
    await bboxBtn.click();
    await expect(bboxBtn).toHaveAttribute('data-active', 'true');
    await expect(bboxBtn).toHaveCSS('border-color', 'rgb(0, 200, 83)');

    // Reset to select tool
    await selectBtn.click();
    await expect(selectBtn).toHaveAttribute('data-active', 'true');
  });

  test('13-E2E-05: Right-side utilities remain fully accessible and functional', async ({ page }) => {
    const undoBtn = page.locator('[data-testid="btn-toolbar-undo"]');
    const redoBtn = page.locator('[data-testid="btn-toolbar-redo"]');
    const historyBtn = page.locator('[data-testid="btn-version-history"]');
    const moreBtn = page.locator('[data-testid="editor-tabs-more-actions-btn"]');
    const resetBtn = page.locator('[data-testid="btn-reset-layout"]');
    const themeBtn = page.locator('[data-testid="btn-theme-toggle"]');

    await expect(undoBtn).toBeVisible();
    await expect(redoBtn).toBeVisible();
    await expect(historyBtn).toBeVisible();
    await expect(moreBtn).toBeVisible();
    await expect(resetBtn).toBeVisible();
    await expect(themeBtn).toBeVisible();
  });
});
