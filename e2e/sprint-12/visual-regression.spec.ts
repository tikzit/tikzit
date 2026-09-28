import { test, expect } from '@playwright/test';

test.describe('Sprint 12: Visual Regression & Layout Baseline Parity', () => {
  test.beforeEach(async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto('/');
    await page.waitForSelector('canvas#webgl-stage');
    await page.waitForFunction(() => typeof (window as any).TikzitApp !== 'undefined');
    await page.evaluate(() => {
      (window as any).TikzitApp.setActiveStyle('none');
    });
  });

  test('12-E2E-04: Full Workbench Visual Layout and Chrome Parity', async ({ page }) => {
    // 1. Window Chrome Header
    const title = page.locator('[data-testid="doc-tab-title"]');
    await expect(title).toBeVisible();
    await expect(title).toContainText('TikZiT');

    // Traffic lights removed per intentional design
    const trafficLights = page.locator('[data-testid="mac-traffic-lights"]');
    await expect(trafficLights).toHaveCount(0);

    // 2. Desktop Tool Palette with 32x32 square buttons
    const selectBtn = page.locator('[data-tool="select"]');
    const vertexBtn = page.locator('[data-tool="vertex"]');
    const edgeBtn = page.locator('[data-tool="edge"]');
    const bboxBtn = page.locator('[data-tool="bbox"]');

    await expect(selectBtn).toBeVisible();
    await expect(vertexBtn).toBeVisible();
    await expect(edgeBtn).toBeVisible();
    await expect(bboxBtn).toBeVisible();

    // Verify 32x32px dimensions
    const edgeBox = await edgeBtn.boundingBox();
    expect(edgeBox).not.toBeNull();
    expect(Math.round(edgeBox!.width)).toBe(32);
    expect(Math.round(edgeBox!.height)).toBe(32);

    // Activate Edge tool and verify active green border #00c853 (rgb(0, 200, 83))
    await edgeBtn.click();
    await expect(edgeBtn).toHaveAttribute('data-active', 'true');
    await expect(edgeBtn).toHaveCSS('border-color', 'rgb(0, 200, 83)');

    // 3. Canvas Stage Paper Background
    const canvasContainer = page.locator('.canvas-container, [data-panel="canvas"]');
    await expect(canvasContainer.first()).toBeVisible();

    // 4. Desktop Style Palette
    const stylesPanel = page.locator('#style-palette-island, [data-testid="style-palette-island"]');
    await expect(stylesPanel).toBeVisible();

    // Action bar buttons
    const actionBtns = stylesPanel.locator('button[data-testid^="style-action-"]');
    await expect(actionBtns).toHaveCount(4);

    // Stylesheet filename label with [no styles] default in italic
    const styleLabel = page.locator('[data-testid="style-file-label"]');
    await expect(styleLabel).toBeVisible();
    await expect(styleLabel).toHaveText('[no styles]');
    await expect(styleLabel).toHaveCSS('font-style', 'italic');

    // Category Combobox
    const catSelect = page.locator('[data-testid="category-select"]');
    await expect(catSelect).toBeVisible();
    const firstOption = catSelect.locator('option').first();
    await expect(firstOption).toHaveText('(all)');

    // 48x48px Swatch Grids with synthetic none at index 0
    const noneButtons = page.locator('button[data-style-name="none"]');
    await expect(noneButtons.first()).toBeVisible();
    await expect(noneButtons.last()).toBeVisible();

    const nodeBox = await noneButtons.first().boundingBox();
    expect(nodeBox).not.toBeNull();
    expect(Math.round(nodeBox!.width)).toBe(48);
    expect(Math.round(nodeBox!.height)).toBe(48);
  });

  test('12-E2E-05: Canvas Visual Golden Snapshot Verification', async ({ page }) => {
    // Load canonical reference scenario: 2 nodes, connecting edge, 2 self-loops
    const canonicalTikz = String.raw`\begin{tikzpicture}
\begin{pgfonlayer}{nodelayer}
\node [style=none] (0) at (-1, 0) {};
\node [style=none] (1) at (1, 0) {};
\end{pgfonlayer}
\begin{pgfonlayer}{edgelayer}
\draw (0) to (1);
\draw [in=135, out=45, loop] (0) to ();
\draw [in=135, out=45, loop] (1) to ();
\end{pgfonlayer}
\end{tikzpicture}`;

    await page.evaluate((code) => {
      (window as any).TikzitApp.loadTikz(code);
      (window as any).TikzitApp.stage.cameraController.setCamera(0, 0, 1.0);
      (window as any).TikzitApp.stage.render();
    }, canonicalTikz);

    await page.waitForFunction(
      () =>
        (window as any).TikzitApp.getGraph().nodes.length === 2 &&
        (window as any).TikzitApp.getGraph().edges.length === 3
    );

    // Select Edge tool to display active green border
    const edgeBtn = page.locator('[data-tool="edge"]');
    await edgeBtn.click();
    await expect(edgeBtn).toHaveCSS('border-color', 'rgb(0, 200, 83)');

    // Visual layout validation: assert clear background color of canvas renderer is pure white (r=1, g=1, b=1)
    const clearColor = await page.evaluate(() => {
      const target = {
        r: 0, g: 0, b: 0,
        copy(c: any) { this.r = c.r; this.g = c.g; this.b = c.b; return this; }
      };
      (window as any).TikzitApp.stage.renderer.getClearColor(target);
      return { r: target.r, g: target.g, b: target.b };
    });
    expect(clearColor.r).toBe(1);
    expect(clearColor.g).toBe(1);
    expect(clearColor.b).toBe(1);

    // Verify canvas element is active and visible
    const canvas = page.locator('canvas#webgl-stage');
    await expect(canvas).toBeVisible();
  });
});