import { expect, test } from '@playwright/test';

const spiderHandle = 'zx:examples:01_spider_fusion';

async function ready(page: import('@playwright/test').Page) {
  await page.goto('/');
  await expect(page.getByTestId(`corpus-entry-${spiderHandle}`)).toBeVisible({ timeout: 30000 });
}

test.describe('Sprint 16: Diagram Creation & Unified Lifecycle', () => {
  test('creates new diagram from header +, shows draft badge, saves and persists across reload', async ({ page }) => {
    await ready(page);

    // 1. Click header + button
    const newBtn = page.getByTestId('btn-new-diagram');
    await expect(newBtn).toBeVisible();
    await newBtn.click();

    // Verify title and badges
    const titleTab = page.getByTestId('doc-tab-title');
    await expect(titleTab).toContainText('Untitled diagram 1');
    const typeBadge = page.getByTestId('doc-type-badge');
    await expect(typeBadge).toHaveText('Draft');
    const saveStatus = page.getByTestId('doc-save-status');
    await expect(saveStatus).toContainText('unsaved');

    // Verify Explorer shows draft entry
    await expect(page.getByTestId('badge-draft')).toBeVisible();

    // 2. Edit diagram source
    const sourceEditor = page.getByTestId('tikz-source-editor');
    await expect(sourceEditor).toBeVisible();
    const newContent = '\\begin{tikzpicture}\n\\node [style=none] (0) at (0, 0) {UserNode};\n\\end{tikzpicture}\n';
    await sourceEditor.fill(newContent);

    // 3. Save via keyboard shortcut Cmd+S / Ctrl+S
    await page.keyboard.press(process.platform === 'darwin' ? 'Meta+s' : 'Control+s');

    // Badge transitions from Draft to Diagram
    await expect(typeBadge).toHaveText('Diagram', { timeout: 10000 });
    await expect(saveStatus).toContainText('saved · v1');

    // Status bar shows CID and saved state
    await expect(page.getByTestId('status-cid')).not.toHaveText('CID: —');
    await expect(page.getByTestId('status-save-state')).toContainText('saved · v1');

    // 4. Reload page and verify diagram is restored in Explorer
    await page.reload();
    await expect(page.getByTestId(`corpus-entry-${spiderHandle}`)).toBeVisible({ timeout: 30000 });

    // Look for user diagram in Explorer
    const userRow = page.locator('button[data-testid^="corpus-entry-zx:diagrams:"]');
    await expect(userRow).toBeVisible();
    await expect(userRow).toContainText('Untitled diagram 1');
    await expect(userRow.getByTestId('badge-diagram')).toHaveText('Diagram');

    // Open user diagram
    await userRow.click();
    await expect(titleTab).toContainText('Untitled diagram 1');
    await expect(sourceEditor).toHaveValue(newContent);
  });

  test('creates new diagram from Explorer action button', async ({ page }) => {
    await ready(page);

    const explorerNewBtn = page.getByTestId('btn-explorer-new-diagram');
    await expect(explorerNewBtn).toBeVisible();
    await explorerNewBtn.click();

    const titleTab = page.getByTestId('doc-tab-title');
    await expect(titleTab).toContainText('Untitled diagram 1');
    await expect(page.getByTestId('doc-type-badge')).toHaveText('Draft');
  });

  test('switching between documents preserves dirty buffer and does not overwrite AST', async ({ page }) => {
    await ready(page);

    // Open first example
    await page.getByTestId(`corpus-entry-${spiderHandle}`).click();
    const sourceEditor = page.getByTestId('tikz-source-editor');
    const original = await sourceEditor.inputValue();

    // Type a dirty edit
    const dirtyText = `${original}% dirty in-flight edit\n`;
    await sourceEditor.fill(dirtyText);
    await expect(page.getByTestId('doc-tab-title')).toContainText('*');

    // Create a new diagram
    await page.getByTestId('btn-new-diagram').click();
    await expect(page.getByTestId('doc-tab-title')).toContainText('Untitled diagram 1');

    // Switch back to the dirty example by clicking it in the Explorer
    await page.getByTestId(`corpus-entry-${spiderHandle}`).click();
    await expect(sourceEditor).toHaveValue(dirtyText);
    await expect(page.getByTestId('doc-tab-title')).toContainText('*');
  });
});
