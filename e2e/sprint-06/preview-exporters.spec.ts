import { test, expect } from '@playwright/test';

test.describe('Sprint 06: Live TeX Preview Pipeline & Exporters', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to workbench
    await page.goto('http://localhost:4321/');
    await page.waitForSelector('[data-testid="panel-preview"]', { timeout: 10000 });
  });

  test('6.1: Live TeX preview panel renders synchronized SVG diagram', async ({ page }) => {
    const previewPanel = page.locator('[data-testid="panel-preview"]');
    await expect(previewPanel).toBeVisible();

    // Check status badge
    const statusBadge = page.locator('[data-testid="preview-status-badge"]');
    await expect(statusBadge).toBeVisible();
    await expect(statusBadge).toContainText('Synced');

    // Check SVG container contains rendered SVG elements
    const svgContainer = page.locator('[data-testid="preview-svg-container"]');
    await expect(svgContainer).toBeVisible();
    const svg = svgContainer.locator('svg');
    await expect(svg).toBeVisible();

    // Check layers inside SVG
    const edgeLayer = svg.locator('#edgelayer');
    const nodeLayer = svg.locator('#nodelayer');
    await expect(edgeLayer).toBeAttached();
    await expect(nodeLayer).toBeAttached();
  });

  test('6.2: Auto-compile toggle pauses and resumes synchronization', async ({ page }) => {
    const toggleBtn = page.locator('[data-testid="toggle-auto-compile"]');
    await expect(toggleBtn).toBeVisible();
    await expect(toggleBtn).toContainText('Auto: ON');

    // Click to pause
    await toggleBtn.click();
    await expect(toggleBtn).toContainText('Auto: OFF');

    const statusBadge = page.locator('[data-testid="preview-status-badge"]');
    await expect(statusBadge).toContainText('Paused');

    // Click to resume
    await toggleBtn.click();
    await expect(toggleBtn).toContainText('Auto: ON');
    await expect(statusBadge).toContainText('Synced');
  });

  test('6.3: Viewport zoom controls adjust zoom level and reset accurately', async ({ page }) => {
    const zoomInBtn = page.locator('[data-testid="btn-preview-zoom-in"]');
    const zoomOutBtn = page.locator('[data-testid="btn-preview-zoom-out"]');
    const zoomResetBtn = page.locator('[data-testid="btn-preview-zoom-reset"]');
    const zoomText = page.locator('[data-testid="preview-zoom-text"]');

    await expect(zoomInBtn).toBeVisible();
    await expect(zoomText).toContainText('100%');

    // Zoom in
    await zoomInBtn.click();
    await expect(zoomText).toContainText('125%');

    // Zoom out
    await zoomOutBtn.click();
    await expect(zoomText).toContainText('100%');

    // Zoom out further
    await zoomOutBtn.click();
    await expect(zoomText).toContainText('80%');

    // Reset zoom
    await zoomResetBtn.click();
    await expect(zoomText).toContainText('100%');
  });

  test('6.4: One-click Copy TikZ code triggers toast feedback', async ({ page, context }) => {
    await context.grantPermissions(['clipboard-read', 'clipboard-write']).catch(() => {});

    const copyBtn = page.locator('[data-testid="btn-copy-tikz"]');
    await expect(copyBtn).toBeVisible();

    await copyBtn.click();

    // Verify toast notification appears
    const toast = page.locator('[data-testid="preview-toast"]');
    await expect(toast).toBeVisible();
    await expect(toast).toContainText('TikZ code copied');
  });

  test('6.5: Export dropdown displays multi-format options (SVG, PNG, PDF, TikZ, TeX)', async ({ page }) => {
    const exportBtn = page.locator('[data-testid="btn-export-dropdown"]');
    await expect(exportBtn).toBeVisible();

    await exportBtn.click();

    const exportMenu = page.locator('[data-testid="preview-export-menu"]');
    await expect(exportMenu).toBeVisible();

    await expect(page.locator('[data-testid="btn-export-svg"]')).toBeVisible();
    await expect(page.locator('[data-testid="btn-export-png"]')).toBeVisible();
    await expect(page.locator('[data-testid="btn-export-pdf"]')).toBeVisible();
    await expect(page.locator('[data-testid="btn-export-tikz"]')).toBeVisible();
    await expect(page.locator('[data-testid="btn-export-tex"]')).toBeVisible();

    // Check PNG resolution selector (1x, 2x, 4x)
    await expect(exportMenu.locator('text=1x')).toBeVisible();
    await expect(exportMenu.locator('text=2x')).toBeVisible();
    await expect(exportMenu.locator('text=4x')).toBeVisible();
  });

  test('6.6: Preamble settings modal and compiler logs drawer open and close', async ({ page }) => {
    // Open Preamble Modal
    const preambleBtn = page.locator('[data-testid="btn-preview-preamble"]');
    await preambleBtn.click();

    const preambleModal = page.locator('[data-testid="preamble-modal"]');
    await expect(preambleModal).toBeVisible();
    await expect(preambleModal).toContainText('LaTeX Preamble Configuration');
    await expect(preambleModal).toContainText('\\usepackage{tikz}');

    // Close modal
    await preambleModal.locator('button:has-text("Done")').click();
    await expect(preambleModal).not.toBeVisible();

    // Open Logs Drawer
    const logsBtn = page.locator('[data-testid="btn-preview-logs"]');
    await logsBtn.click();

    const logsDrawer = page.locator('[data-testid="preview-logs-drawer"]');
    await expect(logsDrawer).toBeVisible();
    await expect(logsDrawer).toContainText('TeX Compiler Logs');

    // Close drawer
    await logsDrawer.locator('button:has-text("✕")').click();
    await expect(logsDrawer).not.toBeVisible();
  });
});
