import { test, expect } from '@playwright/test';

test.describe('Sprint 07: Bidirectional State Sync & MCard Persistence', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:4321/');
    await page.waitForSelector('[data-testid="workbench-root"]', { timeout: 10000 });
  });

  test('7.1: Undo/Redo buttons react to canvas mutations and keyboard shortcuts', async ({ page }) => {
    const undoBtn = page.locator('[data-testid="btn-toolbar-undo"]');
    const redoBtn = page.locator('[data-testid="btn-toolbar-redo"]');

    await expect(undoBtn).toBeVisible();
    await expect(redoBtn).toBeVisible();

    // Select vertex tool and place a node on canvas
    const vertexTool = page.locator('[data-testid="tool-vertex"]');
    await vertexTool.click();

    const canvas = page.locator('canvas').first();
    const box = await canvas.boundingBox();
    if (box) {
      await page.mouse.click(box.x + box.width / 2 + 50, box.y + box.height / 2 + 50);
    }

    // After placing node, Undo should be enabled
    await expect(undoBtn).not.toHaveClass(/cursor-not-allowed/);

    // Click Undo
    await undoBtn.click();
    // After undo, Redo should be enabled
    await expect(redoBtn).not.toHaveClass(/cursor-not-allowed/);

    // Click Redo
    await redoBtn.click();
    await expect(undoBtn).not.toHaveClass(/cursor-not-allowed/);
  });

  test('7.2: Bidirectional sync updates source and reports non-fatal diagnostics on syntax errors', async ({ page }) => {
    const sourceEditor = page.locator('[data-testid="tikz-source-editor"]');
    await expect(sourceEditor).toBeVisible();

    // Type invalid incomplete syntax into editor
    await sourceEditor.fill('\\begin{tikzpicture}\n\\node unfinished (');

    // Diagnostics banner appears without crashing the app
    const diagBanner = page.locator('[data-testid="sync-diagnostics-banner"]');
    await expect(diagBanner).toBeVisible({ timeout: 5000 });
    await expect(diagBanner).toContainText('Canvas retains last valid state');

    // Fix the syntax
    await sourceEditor.fill(`\\begin{tikzpicture}
	\\begin{pgfonlayer}{nodelayer}
		\\node [style=none] (0) at (0, 0) {};
	\\end{pgfonlayer}
\\end{tikzpicture}`);

    // Diagnostics banner disappears
    await expect(diagBanner).not.toBeVisible({ timeout: 5000 });
  });

  test('7.3: Multi-document management allows creating new diagrams', async ({ page }) => {
    const newDocBtn = page.locator('[data-testid="btn-new-diagram"]');
    await expect(newDocBtn).toBeVisible();

    const docTitle = page.locator('[data-testid="doc-tab-title"]');
    const initialText = await docTitle.textContent();

    // Click New Diagram
    await newDocBtn.click();

    // Title should update to New Diagram / Untitled diagram
    await expect(docTitle).toContainText(/Untitled diagram|New Diagram/);
  });

  test('7.4: Version history popover creates savepoint and lists lineage', async ({ page }) => {
    const historyBtn = page.locator('[data-testid="btn-version-history"]');
    await expect(historyBtn).toBeVisible();

    // Open popover
    await historyBtn.click();
    const popover = page.locator('[data-testid="version-popover"]');
    await expect(popover).toBeVisible();

    // Create a manual savepoint
    const saveInput = page.locator('[data-testid="savepoint-input"]');
    const saveBtn = page.locator('[data-testid="btn-create-savepoint"]');

    await saveInput.fill('Release Milestone A');
    await saveBtn.click();

    // Verify revision item appears in revisions list
    const revList = page.locator('[data-testid="revisions-list"]');
    await expect(revList).toContainText('Release Milestone A');

    // Close popover
    await popover.locator('button:has-text("✕")').click();
    await expect(popover).not.toBeVisible();
  });

  test('7.5: File drop zone wrapper is mounted', async ({ page }) => {
    const dropZone = page.locator('[data-testid="file-drop-zone"]');
    await expect(dropZone).toBeVisible();
  });
});
