import { expect, test } from '@playwright/test';

const spiderHandle = 'zx:examples:01_spider_fusion';

async function ready(page: import('@playwright/test').Page) {
  await page.goto('/');
  await expect(page.getByTestId(`corpus-entry-${spiderHandle}`)).toBeVisible({ timeout: 30000 });
}

test.describe('Sprint 17: MCard Version History & Restore', () => {
  test('17-AC-01: History popover opens, shows version count, position, timestamp, and head hash', async ({ page }) => {
    await ready(page);

    // Open seeded example
    await page.getByTestId(`corpus-entry-${spiderHandle}`).click();
    await expect(page.getByTestId('doc-type-badge')).toHaveText('Example', { timeout: 10000 });

    // Open history popover
    await page.getByTestId('btn-version-history').click();
    await expect(page.getByTestId('version-popover')).toBeVisible();

    // Check header and head hash
    await expect(page.getByTestId('history-version-count')).toHaveText('1 version');
    await expect(page.getByTestId('history-head-hash')).toBeVisible();

    // Check timeline row
    await expect(page.getByTestId('version-position').first()).toHaveText('v1');
    await expect(page.getByTestId('badge-current-version')).toBeVisible();
    await expect(page.getByTestId('version-timestamp').first()).toBeVisible();
    await expect(page.getByTestId('version-hash').first()).toBeVisible();

    // Copy hash button
    await page.getByTestId('btn-copy-head-hash').click();

    // Close with close button
    await page.getByTestId('btn-close-history').click();
    await expect(page.getByTestId('version-popover')).not.toBeVisible();
  });

  test('17-AC-08 & 17-AC-01: User diagram version history with labels persists across reload', async ({ page }) => {
    await ready(page);

    // 1. Create a diagram and save v1
    await page.getByTestId('btn-new-diagram').click();
    const sourceEditor = page.getByTestId('tikz-source-editor');
    await sourceEditor.fill('\\begin{tikzpicture}\n\\node [style=none] (0) at (0, 0) {Alpha};\n\\end{tikzpicture}\n');
    await page.keyboard.press(process.platform === 'darwin' ? 'Meta+s' : 'Control+s');
    await expect(page.getByTestId('doc-type-badge')).toHaveText('Diagram', { timeout: 10000 });
    await expect(page.getByTestId('doc-save-status')).toContainText('saved · v1');

    // 2. Open History popover and save v2 with a label
    await page.getByTestId('btn-version-history').click();
    await expect(page.getByTestId('version-popover')).toBeVisible();

    await sourceEditor.fill('\\begin{tikzpicture}\n\\node [style=none] (0) at (0, 0) {Beta};\n\\end{tikzpicture}\n');
    const labelInput = page.getByTestId('savepoint-input');
    await labelInput.fill('Phase 2 Beta Update');
    await page.getByTestId('btn-create-savepoint').click();

    // Wait for history to refresh and show v2
    await expect(page.getByTestId('history-version-count')).toHaveText('2 versions', { timeout: 10000 });
    await expect(page.locator('[data-testid="version-row-2"]')).toBeVisible();
    await expect(page.locator('[data-testid="version-row-2"]').getByTestId('version-label')).toHaveText('Phase 2 Beta Update');
    await expect(page.locator('[data-testid="version-row-2"]').getByTestId('badge-current-version')).toBeVisible();

    // 3. Reload page and verify labeled version persists in history
    await page.reload();
    await expect(page.getByTestId(`corpus-entry-${spiderHandle}`)).toBeVisible({ timeout: 30000 });

    const userEntry = page.locator('[data-testid^="corpus-entry-zx:diagrams:"]').first();
    await userEntry.click();

    await page.getByTestId('btn-version-history').click();
    await expect(page.getByTestId('version-popover')).toBeVisible();
    await expect(page.getByTestId('history-version-count')).toHaveText('2 versions');
    await expect(page.locator('[data-testid="version-row-2"]').getByTestId('version-label')).toHaveText('Phase 2 Beta Update');
  });

  test('17-AC-04: Preview and Compare do not mutate active buffer or dirty flag', async ({ page }) => {
    await ready(page);

    // Create diagram and save 2 versions
    await page.getByTestId('btn-new-diagram').click();
    const sourceEditor = page.getByTestId('tikz-source-editor');
    await sourceEditor.fill('\\begin{tikzpicture}\n\\node [style=none] (0) at (0, 0) {FirstNode};\n\\end{tikzpicture}\n');
    await page.keyboard.press(process.platform === 'darwin' ? 'Meta+s' : 'Control+s');
    await expect(page.getByTestId('doc-save-status')).toContainText('saved · v1');

    await sourceEditor.fill('\\begin{tikzpicture}\n\\node [style=none] (0) at (0, 0) {FirstNode};\n\\node [style=none] (1) at (1, 1) {SecondNode};\n\\end{tikzpicture}\n');
    await page.keyboard.press(process.platform === 'darwin' ? 'Meta+s' : 'Control+s');
    await expect(page.getByTestId('doc-save-status')).toContainText('saved · v2');

    // Open history popover
    await page.getByTestId('btn-version-history').click();
    await expect(page.getByTestId('version-popover')).toBeVisible();

    // Preview v1
    const v1Row = page.locator('[data-testid="version-row-1"]');
    await v1Row.getByTestId('btn-preview-version').click();
    await expect(page.getByTestId('history-preview-panel')).toBeVisible();
    await expect(page.getByTestId('preview-source-code')).toContainText('FirstNode');
    await expect(page.getByTestId('preview-source-code')).not.toContainText('SecondNode');

    // Verify active source editor is unchanged and clean
    await expect(sourceEditor).toContainText('SecondNode');
    await expect(page.getByTestId('doc-tab-title')).not.toContainText('*');

    // Close preview
    await page.getByTestId('btn-close-preview').click();
    await expect(page.getByTestId('history-preview-panel')).not.toBeVisible();

    // Compare v1 with current
    await v1Row.getByTestId('btn-compare-version').click();
    await expect(page.getByTestId('history-compare-panel')).toBeVisible();
    await expect(page.getByTestId('compare-stat-deltas')).toContainText('Nodes: 1 → 2 (+1)');
    await expect(page.getByTestId('compare-diff-view')).toBeVisible();

    // Verify active source editor is unchanged and clean
    await expect(sourceEditor).toContainText('SecondNode');
    await expect(page.getByTestId('doc-tab-title')).not.toContainText('*');

    // Close compare
    await page.getByTestId('btn-close-compare').click();
    await expect(page.getByTestId('history-compare-panel')).not.toBeVisible();
  });

  test('17-AC-05 & 17-AC-06: Restore with clean buffer, already-current detection, and dirty buffer guard', async ({ page }) => {
    await ready(page);

    // 1. Create diagram: v1 (Initial) and v2 (Updated)
    await page.getByTestId('btn-new-diagram').click();
    const sourceEditor = page.getByTestId('tikz-source-editor');
    await sourceEditor.fill('\\begin{tikzpicture}\n\\node [style=none] (0) at (0, 0) {VersionOne};\n\\end{tikzpicture}\n');
    await page.keyboard.press(process.platform === 'darwin' ? 'Meta+s' : 'Control+s');
    await expect(page.getByTestId('doc-save-status')).toContainText('saved · v1');

    await sourceEditor.fill('\\begin{tikzpicture}\n\\node [style=none] (0) at (1, 1) {VersionTwo};\n\\end{tikzpicture}\n');
    await page.keyboard.press(process.platform === 'darwin' ? 'Meta+s' : 'Control+s');
    await expect(page.getByTestId('doc-save-status')).toContainText('saved · v2');

    // 2. Open history and restore v1 with clean buffer
    await page.getByTestId('btn-version-history').click();
    await expect(page.getByTestId('version-popover')).toBeVisible();

    const v1Row = page.locator('[data-testid="version-row-1"]');
    await v1Row.getByTestId('btn-restore-version').click();

    // Confirmation dialog appears
    await expect(page.getByTestId('restore-confirm-dialog')).toBeVisible();
    await page.getByTestId('btn-confirm-restore').click();

    // Editor content is now VersionOne and clean
    await expect(sourceEditor).toContainText('VersionOne');
    await expect(sourceEditor).not.toContainText('VersionTwo');
    await expect(page.getByTestId('doc-tab-title')).not.toContainText('*');

    // History now has 3 versions: v3 is current
    await expect(page.getByTestId('history-version-count')).toHaveText('3 versions');
    await expect(page.locator('[data-testid="version-row-3"]').getByTestId('badge-current-version')).toBeVisible();

    // 3. Already current check: restoring current head shows already-current banner
    await page.locator('[data-testid="version-row-1"]').getByTestId('btn-restore-version').click();
    await expect(page.getByTestId('history-already-current')).toBeVisible();

    // 4. Dirty buffer guard: make an edit to make buffer dirty
    await page.getByTestId('btn-close-history').click();
    await sourceEditor.fill('\\begin{tikzpicture}\n\\node [style=none] (0) at (2, 2) {UnsavedEdit};\n\\end{tikzpicture}\n');
    await expect(page.getByTestId('doc-tab-title')).toContainText('*');

    // Open history and click restore on v2
    await page.getByTestId('btn-version-history').click();
    await expect(page.getByTestId('version-popover')).toBeVisible();

    await page.locator('[data-testid="version-row-2"]').getByTestId('btn-restore-version').click();
    await expect(page.getByTestId('restore-dirty-dialog')).toBeVisible();

    // Click discard edits
    await page.getByTestId('btn-restore-discard').click();

    // Editor now has VersionTwo and is clean
    await expect(sourceEditor).toContainText('VersionTwo');
    await expect(page.getByTestId('doc-tab-title')).not.toContainText('*');
  });

  test('17-AC-02 & 17-AC-09: Switching documents re-scopes history, and Escape dismisses popover', async ({ page }) => {
    await ready(page);

    // Open spider diagram and open history
    await page.getByTestId(`corpus-entry-${spiderHandle}`).click();
    await page.getByTestId('btn-version-history').click();
    await expect(page.getByTestId('version-popover')).toBeVisible();
    await expect(page.getByTestId('version-popover')).toContainText('Spider Fusion');

    // Create a new diagram while history is open
    await page.getByTestId('btn-new-diagram').click();

    // Verify popover re-scopes to new diagram (or shows draft state)
    await expect(page.getByTestId('version-popover')).toContainText('Untitled diagram');

    // Press Escape to dismiss
    await page.keyboard.press('Escape');
    await expect(page.getByTestId('version-popover')).not.toBeVisible();
  });
});
