import { test, expect } from '@playwright/test';

test.describe('Sprint 00-A: Canonical ZX Reference Gallery', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/docs/examples/index.html');
    await page.waitForLoadState('domcontentloaded');
  });

  test('0A-E2E-01: Renders all 12 reference fixture cards', async ({ page }) => {
    const cards = page.locator('[data-diagram-id]');
    await expect(cards).toHaveCount(12);

    const titles = (await cards.locator('h3').allTextContents()).map(t => t.trim());
    expect(titles).toContain('Spider Fusion (Z & X Spiders)');
    expect(titles).toContain('CNOT Gate (Controlled-NOT)');
    expect(titles).toContain('Quantum Teleportation Protocol');
    expect(titles).toContain('Entanglement Swapping Protocol');
  });

  test('0A-E2E-02: Validates SVG markup and layer groups', async ({ page }) => {
    const svgs = page.locator('img[src$=".svg"]');
    await expect(svgs).toHaveCount(12);

    for (let i = 0; i < 12; i++) {
      const svg = svgs.nth(i);
      await svg.scrollIntoViewIfNeeded();
      await expect(svg).toBeVisible();
      const naturalWidth = await svg.evaluate((el: HTMLImageElement) => el.naturalWidth);
      expect(naturalWidth).toBeGreaterThan(0);
    }
  });

  test('0A-E2E-03: Dark/Light mode theme toggle visual stability', async ({ page }, testInfo) => {
    const themeBtn = page.locator('#theme-toggle-btn');
    await expect(themeBtn).toBeVisible();

    // Initial theme is dark
    await expect(page.locator('html')).toHaveClass(/dark/);

    // Toggle to light
    await themeBtn.click();
    await expect(page.locator('html')).toHaveClass(/light/);

    // Visual snapshot comparison
    if (testInfo.project.name === 'chromium') {
      await expect(page).toHaveScreenshot('gallery-theme-toggle.png', { maxDiffPixelRatio: 0.01 });
    }

    // Toggle back to dark
    await themeBtn.click();
    await expect(page.locator('html')).toHaveClass(/dark/);
  });

  test('0A-E2E-04: Code inspection modal displays valid TikZ source', async ({ page }) => {
    const firstCard = page.locator('[data-diagram-id="01_spider_fusion"]');
    await firstCard.locator('button:has-text("View TikZ")').click();

    const modal = page.locator('#code-modal');
    await expect(modal).toBeVisible();
    await expect(modal.locator('pre code')).toContainText(String.raw`\begin{tikzpicture}`);
    await expect(modal.locator('pre code')).toContainText('nodelayer');
    await expect(modal.locator('pre code')).toContainText('edgelayer');

    await modal.locator('button:has-text("Close")').click();
    await expect(modal).toBeHidden();
  });

  test('0A-E2E-05: Responsive layout across viewports', async ({ page }) => {
    for (const viewport of [
      { width: 1920, height: 1080 },
      { width: 768, height: 1024 },
      { width: 375, height: 812 }
    ]) {
      await page.setViewportSize(viewport);
      const grid = page.locator('#diagrams-grid');
      await expect(grid).toBeVisible();
      const cards = grid.locator('[data-diagram-id]');
      await expect(cards).toHaveCount(12);
    }
  });
});
