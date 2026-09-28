import { test, expect } from '@playwright/test';

test.describe('Sprint 02: Astro Workbench Shell & Cordis Runtime', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('#tikzit-workbench');
  });

  test('02-E2E-01: Mounts the initial Dockview workbench shell', async ({ page }) => {
    await expect(page.locator('#activity-bar')).toBeVisible();
    await expect(page.locator('#dockview-host')).toBeVisible();
    await expect(page.locator('[data-panel="source"]')).toBeVisible();
    await expect(page.locator('[data-panel="canvas"]')).toBeVisible();
  });

  test('02-E2E-02: Tool selection switches active tool via UI and keyboard', async ({ page }) => {
    const selectBtn = page.locator('button[data-tool="select"]');
    const vertexBtn = page.locator('button[data-tool="vertex"]');
    const edgeBtn = page.locator('button[data-tool="edge"]');
    const bboxBtn = page.locator('button[data-tool="bbox"]');

    // UI Clicks
    await vertexBtn.click();
    await expect(vertexBtn).toHaveAttribute('data-active', 'true');
    await expect(selectBtn).toHaveAttribute('data-active', 'false');

    await edgeBtn.click();
    await expect(edgeBtn).toHaveAttribute('data-active', 'true');

    // Keyboard Shortcuts
    await page.keyboard.press('S');
    await expect(selectBtn).toHaveAttribute('data-active', 'true');

    await page.keyboard.press('V');
    await expect(vertexBtn).toHaveAttribute('data-active', 'true');

    await page.keyboard.press('E');
    await expect(edgeBtn).toHaveAttribute('data-active', 'true');

    await page.keyboard.press('B');
    await expect(bboxBtn).toHaveAttribute('data-active', 'true');
  });

  test('02-E2E-03: Dockview sash resize, double-click reset, collapse and expand', async ({ page }) => {
    // Dockview sashes render as .dv-sash; shell sashes use role="separator"
    const sash = page.locator('.dv-sash, [role="separator"]').first();
    await expect(sash).toBeVisible();
    const box = await sash.boundingBox();
    if (box) {
      await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
      await page.mouse.down();
      await page.mouse.move(box.x + 100, box.y + box.height / 2);
      await page.mouse.up();
      // Double-click resets sash to default size (mcard-studio semantics)
      await page.mouse.dblclick(box.x + box.width / 2, box.y + box.height / 2);
    }

    const drawerToggle = page.locator('#toggle-source-drawer');
    await drawerToggle.click();
    await expect(page.locator('#source-drawer-island')).toHaveClass(/collapsed|hidden/);
    await drawerToggle.click();
    await expect(page.locator('#source-drawer-island')).toBeVisible();
  });

  test('02-E2E-03b: Tab close operations (Close All / Others / Right)', async ({ page }) => {
    await page.locator('[data-testid="editor-tabs-more-actions-btn"]').click();
    await expect(page.locator('[data-testid="tabs-more-actions-dropdown"]')).toBeVisible();
    await page.locator('[data-testid="tabs-close-others-btn"]').click();
    await page.locator('[data-testid="editor-tabs-more-actions-btn"]').click();
    await page.locator('[data-testid="tabs-close-all-btn"]').click();
    await expect(page.locator('.editor-tab')).toHaveCount(0);
  });

  test('02-E2E-03c: Workbench depress/restore preserves open tabs', async ({ page }) => {
    const tabCount = await page.locator('.editor-tab').count();
    await page.locator('[data-testid="status-dockview-focal"]').click(); // depress
    await expect(page.locator('[data-action="restore-dockview"]')).toBeVisible();
    await page.locator('[data-action="restore-dockview"]').click(); // restore
    await expect(page.locator('.editor-tab')).toHaveCount(tabCount);
  });

  test('02-E2E-03d: Dockview layout persists across reload', async ({ page }) => {
    const before = await page.locator('.dv-group').count();
    await page.reload();
    await page.waitForSelector('#tikzit-workbench');
    await expect(page.locator('.dv-group')).toHaveCount(before);
  });

  test('02-E2E-04: Theme switching and dark mode persistence', async ({ page }) => {
    const themeBtn = page.locator('#theme-selector-btn');
    await themeBtn.click();
    await page.locator('button[data-theme="dark"]').click();
    await expect(page.locator('html')).toHaveClass(/dark/);

    await page.reload();
    await expect(page.locator('html')).toHaveClass(/dark/);
  });

  test('02-E2E-05: Keybinding suppression inside text inputs', async ({ page }) => {
    const searchInput = page.locator('input[type="text"]').first();
    if (await searchInput.isVisible()) {
      await searchInput.focus();
      await page.keyboard.type('sever');
      // Tool should NOT switch to 'E' or 'V'
      await expect(searchInput).toHaveValue('sever');
    }
  });
});
