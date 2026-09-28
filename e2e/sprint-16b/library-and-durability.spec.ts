import { expect, test } from '@playwright/test';

const spiderHandle = 'zx:examples:01_spider_fusion';

async function ready(page: import('@playwright/test').Page) {
  await page.goto('/');
  await expect(page.getByTestId(`corpus-entry-${spiderHandle}`)).toBeVisible({ timeout: 30000 });
}

test.describe('Sprint 16B: Diagram Library Management & Session Durability', () => {
  test('16B-AC-01: Rename diagram updates Explorer, tab, and title chip, and survives reload', async ({ page }) => {
    await ready(page);

    // 1. Create and save a new diagram
    await page.getByTestId('btn-new-diagram').click();
    const sourceEditor = page.getByTestId('tikz-source-editor');
    await sourceEditor.fill('\\begin{tikzpicture}\n\\node [style=none] (0) at (0, 0) {NodeA};\n\\end{tikzpicture}\n');
    await page.keyboard.press(process.platform === 'darwin' ? 'Meta+s' : 'Control+s');
    await expect(page.getByTestId('doc-type-badge')).toHaveText('Diagram', { timeout: 10000 });
    await expect(page.getByTestId('doc-save-status')).toContainText('saved · v1');

    // 2. Locate the user diagram entry and click overflow actions menu
    const actionBtn = page.locator('button[data-testid^="entry-actions-zx:diagrams:"]').first();
    await expect(actionBtn).toBeVisible();
    await actionBtn.click();

    // 3. Click Rename action and enter new title
    const renameAction = page.getByTestId('action-rename');
    await expect(renameAction).toBeVisible();
    await renameAction.click();

    const renameInput = page.getByTestId('input-rename-diagram');
    await expect(renameInput).toBeVisible();
    await renameInput.fill('Renamed Bell Circuit');
    await renameInput.press('Enter');

    // 4. Verify title updates in tab and Explorer
    await expect(page.getByTestId('doc-tab-title')).toContainText('Renamed Bell Circuit');
    const userEntry = page.locator('[data-testid^="corpus-entry-zx:diagrams:"]').first();
    await expect(userEntry).toContainText('Renamed Bell Circuit');

    // 5. Reload page and verify persistence across reload
    await page.reload();
    await expect(page.getByTestId(`corpus-entry-${spiderHandle}`)).toBeVisible({ timeout: 30000 });

    const persistedEntry = page.locator('[data-testid^="corpus-entry-zx:diagrams:"]').first();
    await expect(persistedEntry).toContainText('Renamed Bell Circuit');
    await persistedEntry.click();
    await expect(page.getByTestId('doc-tab-title')).toContainText('Renamed Bell Circuit');
  });

  test('16B-AC-02: Archive hides diagram from default list, Show archived reveals it with badge, Un-archive restores it', async ({ page }) => {
    await ready(page);

    // 1. Create and save a new diagram
    await page.getByTestId('btn-new-diagram').click();
    const sourceEditor = page.getByTestId('tikz-source-editor');
    await sourceEditor.fill('\\begin{tikzpicture}\n\\node [style=none] (0) at (0, 0) {ArchiveMe};\n\\end{tikzpicture}\n');
    await page.keyboard.press(process.platform === 'darwin' ? 'Meta+s' : 'Control+s');
    await expect(page.getByTestId('doc-type-badge')).toHaveText('Diagram', { timeout: 10000 });
    await expect(page.getByTestId('doc-save-status')).toContainText('saved · v1');

    // 2. Open overflow menu and click Archive
    const actionBtn = page.locator('button[data-testid^="entry-actions-zx:diagrams:"]').first();
    await actionBtn.click();
    const archiveAction = page.getByTestId('action-archive');
    await expect(archiveAction).toBeVisible();
    await archiveAction.click();

    // 3. Verify entry is hidden from default Explorer list
    await expect(page.locator('[data-testid^="corpus-entry-zx:diagrams:"]')).toHaveCount(0);

    // 4. Toggle "Show archived"
    const showArchivedToggle = page.getByTestId('toggle-show-archived');
    await expect(showArchivedToggle).toBeVisible();
    await showArchivedToggle.check();

    // 5. Verify archived entry appears dimmed with badge-archived
    const archivedEntry = page.locator('[data-testid^="corpus-entry-zx:diagrams:"]').first();
    await expect(archivedEntry).toBeVisible();
    await expect(archivedEntry.getByTestId('badge-archived')).toHaveText('Archived');

    // 6. Open overflow menu and click Un-archive
    const archivedActionBtn = page.locator('button[data-testid^="entry-actions-zx:diagrams:"]').first();
    await archivedActionBtn.click();
    const unarchiveAction = page.getByTestId('action-unarchive');
    await expect(unarchiveAction).toBeVisible();
    await unarchiveAction.click();

    // 7. Uncheck "Show archived" and verify entry remains visible in default list
    await showArchivedToggle.uncheck();
    await expect(page.locator('[data-testid^="corpus-entry-zx:diagrams:"]')).toHaveCount(1);
    await expect(page.getByTestId('badge-archived')).toHaveCount(0);
  });

  test('16B-AC-03: Duplicate creates independent copy with (Copy) title and separate edits', async ({ page }) => {
    await ready(page);

    // 1. Create and save initial diagram
    await page.getByTestId('btn-new-diagram').click();
    const sourceEditor = page.getByTestId('tikz-source-editor');
    const originalContent = '\\begin{tikzpicture}\n\\node [style=none] (0) at (0, 0) {Original};\n\\end{tikzpicture}\n';
    await sourceEditor.fill(originalContent);
    await page.keyboard.press(process.platform === 'darwin' ? 'Meta+s' : 'Control+s');
    await expect(page.getByTestId('doc-type-badge')).toHaveText('Diagram', { timeout: 10000 });
    await expect(page.getByTestId('doc-save-status')).toContainText('saved · v1');

    // 2. Open overflow menu and duplicate
    const actionBtn = page.locator('button[data-testid^="entry-actions-zx:diagrams:"]').first();
    await actionBtn.click();
    const duplicateAction = page.getByTestId('action-duplicate');
    await expect(duplicateAction).toBeVisible();
    await duplicateAction.click();

    // 3. Verify two user diagram entries exist in Explorer and active tab has (Copy)
    const userEntries = page.locator('[data-testid^="corpus-entry-zx:diagrams:"]');
    await expect(userEntries).toHaveCount(2);
    await expect(page.getByTestId('doc-tab-title')).toContainText('(Copy)');

    // 4. Modify duplicated diagram and save
    const duplicateContent = '\\begin{tikzpicture}\n\\node [style=none] (0) at (1, 1) {ModifiedDuplicate};\n\\end{tikzpicture}\n';
    await sourceEditor.fill(duplicateContent);
    await page.keyboard.press(process.platform === 'darwin' ? 'Meta+s' : 'Control+s');
    await expect(page.getByTestId('doc-save-status')).toContainText('saved');

    // 5. Switch back to original diagram and verify its content remains untouched
    const originalEntry = userEntries.filter({ hasNotText: '(Copy)' }).first();
    await originalEntry.click();
    await expect(sourceEditor).toHaveValue(originalContent);
  });

  test('16B-AC-04: Session durability recovers dirty buffers on reload with recovery banner and discard option', async ({ page }) => {
    await ready(page);

    // 1. Create and save a diagram
    await page.getByTestId('btn-new-diagram').click();
    const sourceEditor = page.getByTestId('tikz-source-editor');
    const savedContent = '\\begin{tikzpicture}\n\\node [style=none] (0) at (0, 0) {StableNode};\n\\end{tikzpicture}\n';
    await sourceEditor.fill(savedContent);
    await page.keyboard.press(process.platform === 'darwin' ? 'Meta+s' : 'Control+s');
    await expect(page.getByTestId('doc-type-badge')).toHaveText('Diagram', { timeout: 10000 });
    await expect(page.getByTestId('doc-save-status')).toContainText('saved · v1');

    // 2. Make an in-flight dirty edit without saving
    const inFlightDirty = `${savedContent}% in-flight dirty line\n`;
    await sourceEditor.fill(inFlightDirty);
    await expect(page.getByTestId('doc-tab-title')).toContainText('*');

    // 3. Wait for 350ms to exceed 300ms debounce of session state persistence
    await page.waitForTimeout(350);

    // 4. Reload page
    await page.reload();
    await expect(page.getByTestId(`corpus-entry-${spiderHandle}`)).toBeVisible({ timeout: 30000 });

    // 5. Verify recovery banner appears and dirty buffer is restored
    const recoveryBanner = page.getByTestId('recovery-banner');
    await expect(recoveryBanner).toBeVisible();
    await expect(recoveryBanner).toContainText('Recovered unsaved edits in 1 diagram');
    await expect(page.getByTestId('live-announcer')).toContainText('Recovered unsaved edits');
    await expect(sourceEditor).toHaveValue(inFlightDirty);
    await expect(page.getByTestId('doc-tab-title')).toContainText('*');

    // 6. Test Discard all button
    const discardBtn = page.getByTestId('btn-recovery-discard');
    await expect(discardBtn).toBeVisible();
    await discardBtn.click();

    // 7. Verify banner disappears and content reverts to head
    await expect(recoveryBanner).toHaveCount(0);
    await expect(sourceEditor).toHaveValue(savedContent);
  });

  test('16B-AC-05: Tab close safety prompts for dirty tabs and closing last tab opens fresh draft', async ({ page }) => {
    await ready(page);

    // Initial state has 01_spider_fusion open. Close it first so there's only 1 tab.
    // 01_spider_fusion is clean, so clicking close tab closes it and opens a fresh draft (since it's the last tab).
    const closeTabBtn = page.getByTestId('btn-close-tab');
    await expect(closeTabBtn).toBeVisible();
    await closeTabBtn.click();

    // Now a fresh draft is open: verify draft badge
    await expect(page.getByTestId('doc-type-badge')).toHaveText('Draft');
    const sourceEditor = page.getByTestId('tikz-source-editor');
    await sourceEditor.fill('\\begin{tikzpicture}\n\\node [style=none] (0) at (0, 0) {DirtyDraft};\n\\end{tikzpicture}\n');

    // 2. Click close tab button on the dirty draft
    await closeTabBtn.click();

    // 3. CloseTabDialog appears
    const dialog = page.getByTestId('close-dirty-dialog');
    await expect(dialog).toBeVisible();

    // 4. Click Cancel -> dialog closes, tab remains open
    await page.getByTestId('btn-close-cancel').click();
    await expect(dialog).toHaveCount(0);
    await expect(page.getByTestId('doc-tab-title')).toContainText('Untitled diagram');

    // 5. Click close tab again -> click Discard
    await closeTabBtn.click();
    await expect(dialog).toBeVisible();
    await page.getByTestId('btn-close-discard').click();
    await expect(dialog).toHaveCount(0);

    // 6. Verify that closing the last tab opens a fresh draft
    await expect(page.getByTestId('doc-type-badge')).toHaveText('Draft');
    await expect(page.getByTestId('doc-save-status')).toContainText('unsaved');
  });

  test('16B-AC-06: Idempotent legacy import preserves localStorage and imports with badge-imported', async ({ page }) => {
    // 1. Seed legacy document in localStorage before loading
    await page.addInitScript(() => {
      window.localStorage.setItem(
        'tikzit:doc-index',
        JSON.stringify([
          'legacy-doc-123',
        ])
      );
      window.localStorage.setItem(
        'tikzit:doc:legacy-doc-123',
        JSON.stringify({
          id: 'legacy-doc-123',
          title: 'Legacy Teleportation Circuit',
          content: '\\begin{tikzpicture}\n\\node [style=none] (0) at (0, 0) {LegacyQubit};\n\\end{tikzpicture}\n',
          updatedAt: Date.now() - 50000,
        })
      );
    });

    await ready(page);

    // 2. Verify imported entry in Explorer with badge-imported
    const importedEntry = page.locator('[data-testid^="corpus-entry-zx:diagrams:"]').filter({
      hasText: 'Legacy Teleportation Circuit',
    });
    await expect(importedEntry).toBeVisible();
    await expect(importedEntry.getByTestId('badge-imported')).toHaveText('Imported');

    // 3. Verify localStorage data was NOT modified or deleted
    const indexInStorage = await page.evaluate(() => window.localStorage.getItem('tikzit:doc-index'));
    expect(indexInStorage).toContain('legacy-doc-123');

    // 4. Open the imported diagram: badge-imported should clear
    await importedEntry.click();
    const sourceEditor = page.getByTestId('tikz-source-editor');
    await expect(sourceEditor).toHaveValue(/LegacyQubit/);
    await expect(importedEntry.getByTestId('badge-imported')).toHaveCount(0);

    // 5. Reload page: idempotent import does not duplicate the entry
    await page.reload();
    await expect(page.getByTestId(`corpus-entry-${spiderHandle}`)).toBeVisible({ timeout: 30000 });
    const countAfterReload = await page
      .locator('[data-testid^="corpus-entry-zx:diagrams:"]')
      .filter({ hasText: 'Legacy Teleportation Circuit' })
      .count();
    expect(countAfterReload).toBe(1);
  });
});
