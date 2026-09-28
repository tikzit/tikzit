import { test, expect } from '@playwright/test';

test.describe('Sprint 00: TikZiT Web Spatial Workbench & Dockview Shell', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to root workbench
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');
  });

  test('00-E2E-01: Workbench shell mounts with Dockview container and chrome', async ({ page }) => {
    const workbench = page.locator('[data-testid="workbench-root"]');
    await expect(workbench).toBeVisible();

    const dockviewHost = page.locator('[data-testid="dockview-host"]');
    await expect(dockviewHost).toBeVisible();

    const statusBar = page.locator('[data-testid="status-bar"]');
    await expect(statusBar).toBeVisible();
    await expect(page.getByTestId('status-cid')).toHaveText('CID: —');
  });

  test('00-E2E-02: Renders all five core workbench panels', async ({ page }) => {
    // Verify Canvas Panel
    const canvas = page.locator('[data-testid="panel-canvas"]');
    await expect(canvas).toBeVisible();
    await expect(canvas).toContainText('WebGL 2D Ready');

    // Verify Source Panel
    const source = page.locator('[data-testid="panel-source"]');
    await expect(source).toBeVisible();
    await expect(source).toContainText('01_spider_fusion.tikz');

    // Verify Inspector Panel
    const inspector = page.locator('[data-testid="panel-inspector"]');
    await expect(inspector).toBeVisible();
    await expect(inspector).toContainText('Selected Element');

    // Verify Preview Panel
    const preview = page.locator('[data-testid="panel-preview"]');
    await expect(preview).toBeVisible();

    // Verify Console Panel — the CID line must show live state, never a fabricated hash
    const consolePanel = page.locator('[data-testid="panel-console"]');
    await expect(consolePanel).toBeVisible();
    await expect(consolePanel).toContainText('[INIT] TikZiT Web Runtime');
    await expect(consolePanel).not.toContainText('7a4f32');
    await expect(page.getByTestId('console-mcard-cid')).toContainText(/CID: (uncommitted|blake3:[0-9a-f]{64})/);
  });

  test('00-E2E-03: Tool palette and keyboard shortcuts (S, V, E, B) dispatch correctly', async ({ page }) => {
    const statusBar = page.locator('[data-testid="status-bar"]');
    await expect(statusBar).toContainText('Tool: SELECT');

    // Switch via UI click to Vertex tool
    await page.locator('[data-testid="tool-vertex"]').click();
    await expect(statusBar).toContainText('Tool: VERTEX');

    // Switch via Keyboard 'E' to Edge tool
    await page.keyboard.press('KeyE');
    await expect(statusBar).toContainText('Tool: EDGE');

    // Switch via Keyboard 'B' to BBox tool
    await page.keyboard.press('KeyB');
    await expect(statusBar).toContainText('Tool: BBOX');

    // Switch via Keyboard 'S' back to Select tool
    await page.keyboard.press('KeyS');
    await expect(statusBar).toContainText('Tool: SELECT');
  });

  test('00-E2E-04: Theme toggle alternates between dark and light themes', async ({ page }) => {
    const workbench = page.locator('[data-testid="workbench-root"]');
    await expect(workbench).toHaveClass(/dockview-theme-dark/);

    const themeBtn = page.locator('[data-testid="btn-theme-toggle"]');
    await themeBtn.click();
    await expect(workbench).toHaveClass(/dockview-theme-light/);

    await themeBtn.click();
    await expect(workbench).toHaveClass(/dockview-theme-dark/);
  });

  test('00-E2E-05: Reset layout restores default panel configuration', async ({ page }) => {
    const resetBtn = page.locator('[data-testid="btn-reset-layout"]');
    await expect(resetBtn).toBeVisible();
    await resetBtn.click();

    // Panels should remain present
    await expect(page.locator('[data-testid="panel-canvas"]')).toBeVisible();
    await expect(page.locator('[data-testid="panel-source"]')).toBeVisible();
    await expect(page.locator('[data-testid="panel-inspector"]')).toBeVisible();
    await expect(page.locator('[data-testid="panel-preview"]')).toBeVisible();
  });
});
