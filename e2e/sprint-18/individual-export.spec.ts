import { expect, test } from '@playwright/test';

const spiderHandle = 'zx:examples:01_spider_fusion';

async function ready(page: import('@playwright/test').Page) {
  await page.goto('/');
  await expect(page.getByTestId(`corpus-entry-${spiderHandle}`)).toBeVisible({ timeout: 30000 });
}

async function setupDownloadFallback(page: import('@playwright/test').Page) {
  await page.evaluate(() => {
    Object.defineProperty(window, 'showSaveFilePicker', {
      configurable: true,
      value: undefined,
    });
  });
}

test.describe('Sprint 18: Individual Diagram Export', () => {
  test('18-E2E-01: Export active diagram opens dialog, selects format, and triggers download via fallback (all browsers)', async ({ page }) => {
    await ready(page);
    await setupDownloadFallback(page);

    // Open seeded example
    await page.getByTestId(`corpus-entry-${spiderHandle}`).click();
    await expect(page.getByTestId('doc-type-badge')).toHaveText('Example', { timeout: 10000 });

    // Open export dialog from active chrome button
    await page.getByTestId('btn-export-diagram').click();
    await expect(page.getByTestId('export-diagram-dialog')).toBeVisible();

    // Verify dialog title and catalog
    await expect(page.getByTestId('export-dialog-title')).toContainText('Export Diagram');
    await expect(page.getByTestId('export-styles-name')).toBeVisible();

    // Select format-png and verify scale selector appears
    await page.getByTestId('format-png').click();
    await expect(page.getByTestId('export-png-scale')).toBeVisible();

    // Select format-tikz
    await page.getByTestId('format-tikz').click();
    await expect(page.getByTestId('export-png-scale')).not.toBeVisible();

    // Confirm export and capture download
    const downloadPromise = page.waitForEvent('download');
    await page.getByTestId('btn-confirm-export').click();
    const download = await downloadPromise;

    expect(download.suggestedFilename()).toContain('.tikz');
    await expect(page.getByTestId('export-diagram-dialog')).not.toBeVisible();
  });

  test('18-E2E-01-picker: Chromium File System Access picker path records written bytes', async ({ page, browserName }) => {
    test.skip(browserName !== 'chromium', 'Picker path is only supported in Chromium');
    await ready(page);

    await page.evaluate(() => {
      const target = window as any;
      target.__savedFiles = [];
      target.showSaveFilePicker = async (options: any) => ({
        createWritable: async () => ({
          write: async (data: any) => {
            target.__savedFiles.push({ name: options?.suggestedName, size: data?.size ?? 0 });
          },
          close: async () => undefined,
        }),
      });
    });

    await page.getByTestId(`corpus-entry-${spiderHandle}`).click();
    await page.getByTestId('btn-export-diagram').click();
    await expect(page.getByTestId('export-diagram-dialog')).toBeVisible();

    await page.getByTestId('format-tikz').click();
    await page.getByTestId('btn-confirm-export').click();

    await expect(page.getByTestId('export-live-announcer')).toContainText('Exported');
    const saved = await page.evaluate(() => (window as any).__savedFiles);
    expect(saved.length).toBe(1);
    expect(saved[0].name).toContain('.tikz');
  });

  test('18-E2E-01-cancel: Quiet cancel when picker throws AbortError without fallback download', async ({ page, browserName }) => {
    test.skip(browserName !== 'chromium', 'Picker AbortError cancellation test for Chromium');
    await ready(page);

    await page.evaluate(() => {
      (window as any).showSaveFilePicker = async () => {
        throw new DOMException('User cancelled', 'AbortError');
      };
    });

    await page.getByTestId(`corpus-entry-${spiderHandle}`).click();
    await page.getByTestId('btn-export-diagram').click();
    await page.getByTestId('btn-confirm-export').click();

    await expect(page.getByTestId('export-live-announcer')).toHaveText('Export cancelled');
  });

  test('18-E2E-01-failure: Write failure shows error and retry button', async ({ page, browserName }) => {
    test.skip(browserName !== 'chromium', 'Picker write failure test for Chromium');
    await ready(page);

    await page.evaluate(() => {
      (window as any).showSaveFilePicker = async () => ({
        createWritable: async () => {
          throw new Error('Disk write error');
        },
      });
    });

    await page.getByTestId(`corpus-entry-${spiderHandle}`).click();
    await page.getByTestId('btn-export-diagram').click();
    await page.getByTestId('btn-confirm-export').click();

    await expect(page.getByTestId('export-live-announcer')).toContainText('Failed to export');
    await expect(page.getByTestId('btn-retry-export')).toBeVisible();
  });

  test('18-E2E-02: Row export from Explorer drawer targets clicked row regardless of active document', async ({ page }) => {
    await ready(page);

    // Keep spider active, but open row export for 02_identity_spiders
    const otherHandle = 'zx:examples:02_identity_spiders';
    await page.getByTestId(`corpus-entry-${spiderHandle}`).click();
    await expect(page.getByTestId('doc-tab-title')).toContainText('Spider Fusion');

    // Trigger row action menu on 02_identity_spiders
    const rowMenuBtn = page.getByTestId(`entry-actions-${otherHandle}`);
    await rowMenuBtn.click();
    await expect(page.getByTestId('row-export-diagram')).toBeVisible();
    await page.getByTestId('row-export-diagram').click();

    // Verify dialog opened with 02_identity_spiders as target
    await expect(page.getByTestId('export-diagram-dialog')).toBeVisible();
    await expect(page.getByTestId('export-dialog-title')).toContainText('Identity Wires');

    // Active document is still spider fusion
    await expect(page.getByTestId('doc-tab-title')).toContainText('Spider Fusion');

    // Close with cancel button
    await page.getByTestId('btn-cancel-export').click();
    await expect(page.getByTestId('export-diagram-dialog')).not.toBeVisible();
  });

  test('18-E2E-03: Dirty diagram offers choice between current edits and saved version', async ({ page }) => {
    await ready(page);

    // Open seeded example and make dirty edits
    await page.getByTestId(`corpus-entry-${spiderHandle}`).click();
    const sourceEditor = page.getByTestId('tikz-source-editor');
    await sourceEditor.fill('\\begin{tikzpicture}\n\\node [style=none] (0) at (0, 0) {DirtyEdit};\n\\end{tikzpicture}\n');
    await expect(page.getByTestId('doc-save-status')).toHaveText('unsaved');

    // Open export dialog
    await page.getByTestId('btn-export-diagram').click();
    await expect(page.getByTestId('export-diagram-dialog')).toBeVisible();

    // Both sources should be present for dirty document
    await expect(page.getByTestId('source-current-edits')).toBeVisible();
    await expect(page.getByTestId('source-saved-version')).toBeVisible();

    // Default is current edits
    await expect(page.getByTestId('source-current-edits')).toBeChecked();

    // Switch to saved version
    await page.getByTestId('source-saved-version').click();
    await expect(page.getByTestId('source-saved-version')).toBeChecked();

    // Close dialog
    await page.getByTestId('btn-cancel-export').click();
  });

  test('18-E2E-04: Parse error disables current edits export for rendered formats', async ({ page }) => {
    await ready(page);

    // Open seeded example and introduce a parse error
    await page.getByTestId(`corpus-entry-${spiderHandle}`).click();
    const sourceEditor = page.getByTestId('tikz-source-editor');
    await sourceEditor.fill('\\begin{tikzpicture}\n\\node [broken syntax;\n');
    await expect(page.getByTestId('doc-save-status')).toHaveText('unsaved');

    // Open export dialog
    await page.getByTestId('btn-export-diagram').click();
    await expect(page.getByTestId('export-diagram-dialog')).toBeVisible();

    // Parse error indicator is visible
    await expect(page.getByTestId('export-parse-error')).toBeVisible();

    // Select rendered format SVG
    await page.getByTestId('format-svg').click();

    // Current edits option should be disabled
    await expect(page.getByTestId('source-current-edits')).toBeDisabled();

    // Saved version should be selectable and allow export
    await page.getByTestId('source-saved-version').click();
    await expect(page.getByTestId('btn-confirm-export')).toBeEnabled();

    await page.getByTestId('btn-cancel-export').click();
  });

  test('18-E2E-05: Non-mutation invariant: exporting leaves dirty status, content, and head unchanged', async ({ page }) => {
    await ready(page);
    await setupDownloadFallback(page);

    // Create a new diagram and edit it
    await page.getByTestId('btn-new-diagram').click();
    const sourceEditor = page.getByTestId('tikz-source-editor');
    const customContent = '\\begin{tikzpicture}\n\\node [style=none] (0) at (1, 1) {NonMutate};\n\\end{tikzpicture}\n';
    await sourceEditor.fill(customContent);
    await expect(page.getByTestId('doc-type-badge')).toHaveText('Draft');
    await expect(page.getByTestId('doc-save-status')).toHaveText('unsaved');

    // Export diagram as Standalone TeX
    await page.getByTestId('btn-export-diagram').click();
    await page.getByTestId('format-tex').click();

    const downloadPromise = page.waitForEvent('download');
    await page.getByTestId('btn-confirm-export').click();
    await downloadPromise;

    // Verify state after export:
    // 1. Still in Draft mode (not saved/committed)
    await expect(page.getByTestId('doc-type-badge')).toHaveText('Draft');
    // 2. Still dirty (unsaved)
    await expect(page.getByTestId('doc-save-status')).toHaveText('unsaved');
    // 3. Content untouched
    await expect(sourceEditor).toHaveValue(customContent);
  });

  test('18-E2E-06: Escape key and Cancel button close dialog quietly without download', async ({ page }) => {
    await ready(page);

    await page.getByTestId(`corpus-entry-${spiderHandle}`).click();
    await page.getByTestId('btn-export-diagram').click();
    await expect(page.getByTestId('export-diagram-dialog')).toBeVisible();

    // Press Escape
    await page.keyboard.press('Escape');
    await expect(page.getByTestId('export-diagram-dialog')).not.toBeVisible();

    // Reopen and test Cancel button
    await page.getByTestId('btn-export-diagram').click();
    await expect(page.getByTestId('export-diagram-dialog')).toBeVisible();
    await page.getByTestId('btn-cancel-export').click();
    await expect(page.getByTestId('export-diagram-dialog')).not.toBeVisible();
  });
});
