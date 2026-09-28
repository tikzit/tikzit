import { expect, test } from '@playwright/test';

const spiderHandle = 'zx:examples:01_spider_fusion';

async function ready(page: import('@playwright/test').Page) {
  await page.goto('/');
  await expect(page.getByTestId(`corpus-entry-${spiderHandle}`)).toBeVisible({ timeout: 30000 });
}

test.describe('Sprint 17B: Prominent Draft-to-MCard Save Affordance & Mode Transition', () => {
  test('T01 [17B-AC-01, 17B-AC-03]: Header btn-save-draft saves empty draft, transitions to Diagram, shows success pill then v1 status', async ({ page }) => {
    await ready(page);

    // 1. Create a new draft diagram
    await page.getByTestId('btn-new-diagram').click();
    await expect(page.getByTestId('doc-type-badge')).toHaveText('Draft', { timeout: 10000 });
    await expect(page.getByTestId('btn-save-draft')).toBeVisible();
    await expect(page.getByTestId('btn-save-draft')).toContainText('Save to MCard');

    // 2. Click Header Save to MCard button
    await page.getByTestId('btn-save-draft').click();

    // 3. Verify immediate first-save success pill appearance and badge transition
    await expect(page.getByTestId('doc-type-badge')).toHaveText('Diagram', { timeout: 10000 });
    await expect(page.getByTestId('draft-save-success-pill')).toBeVisible();
    await expect(page.getByTestId('draft-save-success-pill')).toContainText('Saved to MCard');

    // 4. After success pill elapses (~1.8s), standard saved v1 status is displayed
    await expect(page.getByTestId('doc-save-status')).toContainText('saved · v1', { timeout: 5000 });
    await expect(page.getByTestId('btn-save-draft')).not.toBeVisible();
    await expect(page.getByTestId('btn-save-diagram')).not.toBeVisible();

    // 5. Open history and verify v1 exists
    await page.getByTestId('btn-version-history').click();
    await expect(page.getByTestId('version-popover')).toBeVisible();
    await expect(page.getByTestId('history-version-count')).toHaveText('1 version');
    await expect(page.locator('[data-testid="version-row-1"]')).toBeVisible();
  });

  test('T02 [17B-AC-02, 17B-AC-03]: Canvas callout appears on draft, saves to MCard on click and disappears', async ({ page }) => {
    await ready(page);

    // Create a new draft
    await page.getByTestId('btn-new-diagram').click();
    await expect(page.getByTestId('doc-type-badge')).toHaveText('Draft', { timeout: 10000 });

    // Verify canvas notice is visible
    await expect(page.getByTestId('draft-canvas-callout')).toBeVisible();
    await expect(page.getByTestId('draft-canvas-callout')).toContainText('Draft diagram · Not yet saved to MCard history');
    await expect(page.getByTestId('btn-canvas-save-draft')).toBeVisible();
    await expect(page.getByTestId('btn-dismiss-draft-callout')).toBeVisible();

    // Click canvas save
    await page.getByTestId('btn-canvas-save-draft').click();

    // Callout should disappear, doc transitions to Diagram
    await expect(page.getByTestId('doc-type-badge')).toHaveText('Diagram', { timeout: 10000 });
    await expect(page.getByTestId('draft-canvas-callout')).not.toBeVisible();
    await expect(page.getByTestId('doc-save-status')).toContainText('saved · v1');
  });

  test('T05 [17B-AC-05]: Edits on committed diagram show btn-save-diagram (Save), subsequent save creates v2', async ({ page }) => {
    await ready(page);

    // Create and save v1
    await page.getByTestId('btn-new-diagram').click();
    await page.getByTestId('btn-save-draft').click();
    await expect(page.getByTestId('doc-type-badge')).toHaveText('Diagram', { timeout: 10000 });

    // Edit in source panel
    const sourceEditor = page.getByTestId('tikz-source-editor');
    await sourceEditor.fill('\\begin{tikzpicture}\n\\node [style=none] (a) at (0, 0) {NodeA};\n\\end{tikzpicture}\n');

    // Button should now be btn-save-diagram with label "Save"
    await expect(page.getByTestId('btn-save-diagram')).toBeVisible();
    await expect(page.getByTestId('btn-save-diagram')).toContainText('Save');
    await expect(page.getByTestId('btn-save-draft')).not.toBeVisible();

    // Click Save
    await page.getByTestId('btn-save-diagram').click();

    // Clean status, no save button
    await expect(page.getByTestId('doc-save-status')).toContainText('saved · v2', { timeout: 10000 });
    await expect(page.getByTestId('btn-save-diagram')).not.toBeVisible();
    await expect(page.getByTestId('btn-save-draft')).not.toBeVisible();
  });

  test('T06 [17B-AC-06]: Dismissing draft callout on draft A does not dismiss it on draft B', async ({ page }) => {
    await ready(page);

    // Draft A
    await page.getByTestId('btn-new-diagram').click();
    await expect(page.getByTestId('doc-type-badge')).toHaveText('Draft', { timeout: 10000 });
    await expect(page.getByTestId('draft-canvas-callout')).toBeVisible();

    // Dismiss callout on Draft A
    await page.getByTestId('btn-dismiss-draft-callout').click();
    await expect(page.getByTestId('draft-canvas-callout')).not.toBeVisible();

    // Header btn-save-draft remains available on Draft A
    await expect(page.getByTestId('btn-save-draft')).toBeVisible();

    // Create Draft B
    await page.getByTestId('btn-new-diagram').click();
    await expect(page.getByTestId('doc-type-badge')).toHaveText('Draft', { timeout: 10000 });

    // Draft B callout MUST be visible!
    await expect(page.getByTestId('draft-canvas-callout')).toBeVisible();
  });

  test('T09 [17B-AC-07]: Keyboard shortcut Meta+S / Control+S saves draft diagram with identical outcome', async ({ page }) => {
    await ready(page);

    await page.getByTestId('btn-new-diagram').click();
    await expect(page.getByTestId('doc-type-badge')).toHaveText('Draft', { timeout: 10000 });

    // Press save shortcut
    await page.keyboard.press(process.platform === 'darwin' ? 'Meta+s' : 'Control+s');

    await expect(page.getByTestId('doc-type-badge')).toHaveText('Diagram', { timeout: 10000 });
    await expect(page.getByTestId('doc-save-status')).toContainText('saved · v1');
  });

  test('T03 [17B-AC-02, 17B-AC-03, 17B-AC-14]: Canvas drawing gestures synchronize to workspace and survive save', async ({ page }) => {
    await ready(page);

    await page.getByTestId('btn-new-diagram').click();
    await expect(page.getByTestId('doc-type-badge')).toHaveText('Draft', { timeout: 10000 });

    // Select vertex tool
    await page.getByTestId('tool-vertex').click();

    // Click on canvas to place a node
    const canvas = page.getByTestId('panel-canvas');
    const box = await canvas.boundingBox();
    if (box) {
      await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2);
    }

    // Save via canvas callout button
    await expect(page.getByTestId('btn-canvas-save-draft')).toBeVisible();
    await page.getByTestId('btn-canvas-save-draft').click();

    // Verify mode transition
    await expect(page.getByTestId('doc-type-badge')).toHaveText('Diagram', { timeout: 10000 });
    await expect(page.getByTestId('doc-save-status')).toContainText('saved · v1');

    // Verify source editor has the placed node
    const sourceEditor = page.getByTestId('tikz-source-editor');
    await expect(sourceEditor).toContainText('\\node');
  });
});
