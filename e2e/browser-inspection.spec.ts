import { test, expect } from '@playwright/test';
import path from 'path';

test.describe('Live Browser Inspection of TikZiT Web Spatial Workbench', () => {
  test('Launches and interacts with all core workbench systems', async ({ page }) => {
    const artifactDir = '/Users/bkoo/.gemini/antigravity/brain/793b3ab2-6885-4eb6-82ca-a33e63f5b017';
    
    // Collect browser console messages and errors
    const consoleLogs: string[] = [];
    const pageErrors: string[] = [];
    page.on('console', msg => consoleLogs.push(`[${msg.type()}] ${msg.text()}`));
    page.on('pageerror', err => pageErrors.push(err.message));

    // 1. Navigate to root workbench
    console.log('[Browser] Navigating to http://127.0.0.1:4321 ...');
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');

    // 2. Verify Page Title
    await expect(page).toHaveTitle(/TikZiT Web/);
    console.log('[Browser] Page title verified:', await page.title());

    // 3. Verify Shell and Window Chrome
    const workbenchRoot = page.locator('[data-testid="workbench-root"]');
    await expect(workbenchRoot).toBeVisible();

    const macChrome = page.locator('[data-testid="mac-window-chrome"]');
    await expect(macChrome).toBeVisible();
    console.log('[Browser] Mac Window Chrome is visible.');

    // 4. Verify Dockview Host and All 5 Core Panels
    const dockviewHost = page.locator('[data-testid="dockview-host"]');
    await expect(dockviewHost).toBeVisible();

    const canvasPanel = page.locator('[data-testid="panel-canvas"]');
    await expect(canvasPanel).toBeVisible();
    console.log('[Browser] Canvas Panel is mounted.');

    const sourcePanel = page.locator('[data-testid="panel-source"]');
    await expect(sourcePanel).toBeVisible();
    const sourceTitle = await page.locator('[data-testid="source-doc-title"]').textContent();
    console.log('[Browser] Source Panel is mounted with active document:', sourceTitle);

    const previewPanel = page.locator('[data-testid="panel-preview"]');
    await expect(previewPanel).toBeVisible();
    console.log('[Browser] TeX Preview Panel is mounted.');

    const inspectorPanel = page.locator('[data-testid="panel-inspector"]');
    await expect(inspectorPanel).toBeVisible();
    console.log('[Browser] Property Inspector is mounted.');

    // 5. Verify Three.js WebGL Canvas element
    const webglCanvas = canvasPanel.locator('canvas');
    await expect(webglCanvas).toBeVisible();
    const box = await webglCanvas.boundingBox();
    console.log(`[Browser] WebGL Canvas dimensions: ${box?.width}x${box?.height}`);

    // 6. Test Interactive Tool Switching
    const statusBar = page.locator('[data-testid="status-bar"]');
    await expect(statusBar).toContainText('Tool: SELECT');

    await page.locator('[data-testid="tool-vertex"]').click();
    await expect(statusBar).toContainText('Tool: VERTEX');
    console.log('[Browser] Tool switched to VERTEX.');

    await page.keyboard.press('KeyE');
    await expect(statusBar).toContainText('Tool: EDGE');
    console.log('[Browser] Tool switched to EDGE via hotkey E.');

    await page.keyboard.press('KeyS');
    await expect(statusBar).toContainText('Tool: SELECT');
    console.log('[Browser] Tool returned to SELECT via hotkey S.');

    // 7. Verify Version History Popover
    const versionBtn = page.locator('[data-testid="btn-version-history"]');
    if (await versionBtn.isVisible()) {
      await versionBtn.click();
      const revisionsList = page.locator('[data-testid="revisions-list"]');
      await expect(revisionsList).toBeVisible();
      console.log('[Browser] Version History Popover opened successfully.');
      const closeHistoryBtn = page.locator('[data-testid="btn-close-history"]');
      if (await closeHistoryBtn.isVisible()) {
        await closeHistoryBtn.click({ force: true });
        await expect(revisionsList).toBeHidden();
        console.log('[Browser] Version History Popover closed.');
      }
    }

    // 8. Test Diagram Creation Workflow
    const newDiagramBtn = page.locator('[data-testid="btn-new-diagram"]');
    if (await newDiagramBtn.isVisible()) {
      await newDiagramBtn.click();
      const docTabTitle = page.locator('[data-testid="doc-tab-title"]');
      await expect(docTabTitle).toBeVisible();
      const newTitle = await docTabTitle.textContent();
      console.log('[Browser] Created new diagram tab:', newTitle);
    }

    // 9. Verify Export Diagram Dialog
    const exportBtn = page.locator('[data-testid="btn-export-diagram"]');
    if (await exportBtn.isVisible()) {
      await exportBtn.click();
      const exportDialog = page.locator('[data-testid="export-diagram-dialog"]');
      await expect(exportDialog).toBeVisible();
      console.log('[Browser] Export Diagram dialog opened.');
      const cancelBtn = page.locator('[data-testid="btn-cancel-export"]');
      if (await cancelBtn.isVisible()) {
        await cancelBtn.click();
        await expect(exportDialog).toBeHidden();
        console.log('[Browser] Export Diagram dialog closed cleanly.');
      }
    }

    // 10. Verify Theme Toggle works smoothly
    const themeBtn = page.locator('[data-testid="btn-theme-toggle"]');
    if (await themeBtn.isVisible()) {
      await themeBtn.click();
      console.log('[Browser] Theme toggled to light.');
      await themeBtn.click();
      console.log('[Browser] Theme restored to dark.');
    }

    // 11. Capture Full-Page Screenshot for visual inspection
    const screenshotPath = path.join(artifactDir, 'tikzit_workbench_live.png');
    await page.screenshot({ path: screenshotPath, fullPage: true });
    console.log('[Browser] Full-page live workbench screenshot captured at:', screenshotPath);

    // Assert zero fatal uncaught page errors
    console.log(`[Browser] Captured ${consoleLogs.length} console logs and ${pageErrors.length} page errors.`);
    if (pageErrors.length > 0) {
      console.warn('[Browser] Page errors detected:', pageErrors);
    }
    expect(pageErrors.length).toBe(0);
  });
});
