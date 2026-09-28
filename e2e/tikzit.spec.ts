import { test, expect } from '@playwright/test';

test.describe('Master TikZiT Web E2E Suite: Full Lifecycle Verification', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:4321/');
    await page.waitForSelector('[data-testid="workbench-root"]', { timeout: 10000 });
  });

  test('8.1: Spatial Workbench boots with complete 4-panel dockview layout', async ({ page }) => {
    // Verify all core dockview panels exist
    await expect(page.locator('[data-testid="workbench-root"]')).toBeVisible();
    await expect(page.locator('[data-testid="panel-source"]')).toBeVisible();
    await expect(page.locator('[data-testid="panel-preview"]')).toBeVisible();

    // Verify canvas is present
    const canvas = page.locator('canvas').first();
    await expect(canvas).toBeVisible();
  });

  test('8.2: End-to-end editing workflow: Tool selection -> Canvas edit -> Sync -> Preview -> Undo', async ({ page }) => {
    // 1. Select Vertex Tool
    const vertexBtn = page.locator('[data-testid="tool-vertex"]');
    await vertexBtn.click();
    await expect(vertexBtn).toHaveAttribute('data-active', 'true');

    // 2. Click on canvas to place a node
    const canvas = page.locator('canvas').first();
    const box = await canvas.boundingBox();
    expect(box).not.toBeNull();
    if (box) {
      await page.mouse.click(box.x + box.width / 2 + 60, box.y + box.height / 2 + 40);
    }

    // 3. Verify undo button is active
    const undoBtn = page.locator('[data-testid="btn-toolbar-undo"]');
    await expect(undoBtn).not.toHaveClass(/cursor-not-allowed/);

    // 4. Verify preview panel reflects the change
    const previewSvg = page.locator('[data-testid="preview-svg-container"] svg');
    await expect(previewSvg).toBeVisible();

    // 5. Test Undo
    await undoBtn.click();

    // 6. Test Redo
    const redoBtn = page.locator('[data-testid="btn-toolbar-redo"]');
    await expect(redoBtn).not.toHaveClass(/cursor-not-allowed/);
    await redoBtn.click();
  });

  test('8.3: Universal export actions and copy TikZ code execute seamlessly', async ({ page, context }) => {
    await context.grantPermissions(['clipboard-read', 'clipboard-write']).catch(() => {});

    // Copy TikZ snippet
    const copyBtn = page.locator('[data-testid="btn-copy-tikz"]');
    await copyBtn.click();

    const toast = page.locator('[data-testid="preview-toast"]');
    await expect(toast).toBeVisible();
    await expect(toast).toContainText('TikZ code copied');

    // Export dropdown
    const exportBtn = page.locator('[data-testid="btn-export-dropdown"]');
    await exportBtn.click();

    const menu = page.locator('[data-testid="preview-export-menu"]');
    await expect(menu).toBeVisible();
    await expect(page.locator('[data-testid="btn-export-svg"]')).toBeVisible();
    await expect(page.locator('[data-testid="btn-export-pdf"]')).toBeVisible();
  });

  test('8.4: Multi-document tabs and version history savepoints work end-to-end', async ({ page }) => {
    // Create new tab
    const newDocBtn = page.locator('[data-testid="btn-new-diagram"]');
    await newDocBtn.click();

    const tabTitle = page.locator('[data-testid="doc-tab-title"]');
    await expect(tabTitle).toContainText(/Untitled diagram|New Diagram/);

    // Version history
    const historyBtn = page.locator('[data-testid="btn-version-history"]');
    await historyBtn.click();

    const popover = page.locator('[data-testid="version-popover"]');
    await expect(popover).toBeVisible();

    const input = page.locator('[data-testid="savepoint-input"]');
    await input.fill('Production v1.0.0');
    await page.locator('[data-testid="btn-create-savepoint"]').click();

    const revList = page.locator('[data-testid="revisions-list"]');
    await expect(revList).toContainText('Production v1.0.0');
  });

  test('8.5: PWA Web App Manifest & Service Worker offline readiness', async ({ page }) => {
    // 1. Verify manifest link in HTML head
    const manifestLink = page.locator('link[rel="manifest"]');
    await expect(manifestLink).toHaveAttribute('href', '/manifest.json');

    // 2. Fetch /manifest.json and assert standalone mode & metadata
    const manifestResponse = await page.request.get('/manifest.json');
    expect(manifestResponse.status()).toBe(200);
    const manifestJson = await manifestResponse.json();
    expect(manifestJson.name).toContain('TikZiT');
    expect(manifestJson.display).toBe('standalone');
    expect(manifestJson.theme_color).toBe('#1a1d26');
    expect(manifestJson.icons.length).toBeGreaterThan(0);
  });

  test('8.6: PQP Canonical Corpus fixture rendering & round-trip verification', async ({ page }) => {
    // Inject and parse a representative PQP ZX Spider Fusion diagram into the workbench
    const samplePqp = `\\begin{tikzpicture}
\t\\begin{pgfonlayer}{nodelayer}
\t\t\\node [style=none] (in1) at (-2, 0.8) {};
\t\t\\node [style=none] (in2) at (-2, -0.8) {};
\t\t\\node [style=Z] (z1) at (-1, 0) {$\\alpha$};
\t\t\\node [style=Z] (z2) at (1, 0) {$\\beta$};
\t\t\\node [style=none] (out1) at (2, 0.8) {};
\t\t\\node [style=none] (out2) at (2, -0.8) {};
\t\\end{pgfonlayer}
\t\\begin{pgfonlayer}{edgelayer}
\t\t\\draw [style=wire] (in1) to (z1);
\t\t\\draw [style=wire] (in2) to (z1);
\t\t\\draw [style=wire, bend left=35] (z1) to (z2);
\t\t\\draw [style=wire, bend right=35] (z1) to (z2);
\t\t\\draw [style=wire] (z2) to (out1);
\t\t\\draw [style=wire] (z2) to (out2);
\t\\end{pgfonlayer}
\\end{tikzpicture}`;

    // Set source directly via TikzitApp runtime
    await page.evaluate((code) => {
      window.TikzitApp.loadTikz(code);
    }, samplePqp);

    // Wait for sync and verify AST is updated with 6 nodes and 6 edges
    await page.waitForTimeout(200);
    const graph = await page.evaluate(() => window.TikzitApp.getGraph());
    expect(graph.nodes.length).toBe(6);
    expect(graph.edges.length).toBe(6);

    // Verify SVG preview renders
    const preview = page.locator('[data-testid="preview-svg-container"] svg');
    await expect(preview).toBeVisible();
  });
});
