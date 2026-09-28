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

test.describe('Sprint 19: Complete MCard Diagram Collection Export', () => {
  test('19-E2E-01: Dialog scope, counts, exclusions, and destination filename presentation', async ({ page }) => {
    await ready(page);

    // Open export dialog from drawer action row
    await page.getByTestId('btn-export-collection').click();
    await expect(page.getByTestId('export-collection-dialog')).toBeVisible();

    // Verify dialog title and scope
    await expect(page.getByTestId('collection-export-title')).toHaveText('Export Diagram Collection');
    const scopeInfo = page.getByTestId('collection-scope-info');
    await expect(scopeInfo).toBeVisible();
    await expect(scopeInfo).toContainText('Scope: All diagrams (12), including 0 archived');

    // Verify record counts
    await expect(page.getByTestId('collection-counts-diagrams')).toContainText('12');
    await expect(page.getByTestId('collection-counts-versions')).toContainText('12');
    await expect(page.getByTestId('collection-counts-cards')).toContainText('12');

    // Verify excluded records disclosure (Decision D3)
    await expect(page.getByTestId('collection-excluded-orphans')).toContainText('0 unrelated cards not included');
    await expect(page.getByTestId('collection-excluded-receipts')).toContainText('execution receipts excluded');
    await expect(page.getByTestId('collection-excluded-knowledge')).toContainText('knowledge records excluded');

    // Verify default destination filename
    const filenameInput = page.getByTestId('collection-destination-filename');
    const val = await filenameInput.inputValue();
    expect(val).toMatch(/^tikzit-diagrams-\d{8}\.db$/);

    // Cancel closes dialog without exporting
    await page.getByTestId('btn-cancel-collection-export').click();
    await expect(page.getByTestId('export-collection-dialog')).not.toBeVisible();
  });

  test('19-E2E-02: Chromium File System Access Picker export produces verified SQLite database', async ({ page, browserName }) => {
    test.skip(browserName !== 'chromium', 'Picker path is only supported in Chromium');
    await ready(page);

    await page.evaluate(() => {
      const target = window as Window & { __exportBytes?: number[]; showSaveFilePicker?: (options: unknown) => Promise<unknown> };
      target.showSaveFilePicker = async () => ({
        createWritable: async () => ({
          write: async (blob: Blob) => {
            target.__exportBytes = Array.from(new Uint8Array(await blob.arrayBuffer()));
          },
          close: async () => undefined,
        }),
      });
    });

    await page.getByTestId('btn-export-collection').click();
    await expect(page.getByTestId('export-collection-dialog')).toBeVisible();

    await page.getByTestId('btn-confirm-collection-export').click();
    await expect(page.getByTestId('collection-export-success')).toBeVisible({ timeout: 15000 });

    const bytes = await page.evaluate(() => (window as Window & { __exportBytes?: number[] }).__exportBytes ?? []);
    expect(bytes.length).toBeGreaterThanOrEqual(16);
    expect(bytes.slice(0, 16)).toEqual(Array.from(new TextEncoder().encode('SQLite format 3\0')));
  });

  test('19-E2E-03: User aborting the picker reports cancellation cleanly without crashing', async ({ page, browserName }) => {
    test.skip(browserName !== 'chromium', 'Picker path is only supported in Chromium');
    await ready(page);

    await page.evaluate(() => {
      const target = window as Window & { showSaveFilePicker?: () => Promise<never> };
      target.showSaveFilePicker = async () => {
        throw Object.assign(new Error('User cancelled'), { name: 'AbortError' });
      };
    });

    await page.getByTestId('btn-export-collection').click();
    await expect(page.getByTestId('export-collection-dialog')).toBeVisible();

    await page.getByTestId('btn-confirm-collection-export').click();

    // Dialog stays open, reports cancellation, no red error banner
    await expect(page.getByTestId('collection-export-cancelled')).toBeVisible();
    await expect(page.getByTestId('collection-export-error')).not.toBeVisible();
    await expect(page.getByTestId('btn-confirm-collection-export')).toBeEnabled();
  });

  test('19-E2E-04: Fallback download triggers Blob download and revokes URL (all browsers)', async ({ page }) => {
    await ready(page);
    await setupDownloadFallback(page);

    await page.evaluate(() => {
      const target = window as Window & { __revokedUrls?: string[] };
      const revoked: string[] = [];
      const originalCreate = URL.createObjectURL.bind(URL);
      const originalRevoke = URL.revokeObjectURL.bind(URL);
      URL.createObjectURL = (blob) => originalCreate(blob);
      URL.revokeObjectURL = (url) => {
        revoked.push(url);
        originalRevoke(url);
      };
      target.__revokedUrls = revoked;
    });

    await page.getByTestId('btn-export-collection').click();
    await expect(page.getByTestId('export-collection-dialog')).toBeVisible();

    const downloadPromise = page.waitForEvent('download');
    await page.getByTestId('btn-confirm-collection-export').click();
    const download = await downloadPromise;

    expect(download.suggestedFilename()).toMatch(/^tikzit-diagrams-\d{8}\.db$/);
    await expect(page.getByTestId('collection-export-success')).toBeVisible();

    // Verify object URL was revoked
    await page.waitForFunction(() => ((window as Window & { __revokedUrls?: string[] }).__revokedUrls?.length ?? 0) > 0);
  });

  test('19-E2E-05: Non-mutation invariant of active document and dirty buffers', async ({ page }) => {
    await ready(page);
    await setupDownloadFallback(page);

    // Open spider fusion diagram
    await page.getByTestId(`corpus-entry-${spiderHandle}`).click();
    const sourceEditor = page.getByTestId('tikz-source-editor');
    const originalText = await sourceEditor.inputValue();
    const dirtyText = `${originalText}% Unsaved E2E Dirty Buffer Test\n`;

    // Make active document dirty
    await sourceEditor.fill(dirtyText);
    await expect(sourceEditor).toHaveValue(dirtyText);

    // Export collection via fallback
    await page.getByTestId('btn-export-collection').click();
    await expect(page.getByTestId('export-collection-dialog')).toBeVisible();

    const downloadPromise = page.waitForEvent('download');
    await page.getByTestId('btn-confirm-collection-export').click();
    await downloadPromise;

    await expect(page.getByTestId('collection-export-success')).toBeVisible();
    await page.getByTestId('btn-cancel-collection-export').click(); // Button text is "Close" when done

    // Verify non-mutation invariant
    await expect(page.getByTestId('export-collection-dialog')).not.toBeVisible();
    await expect(page.getByTestId('tikz-source-editor')).toHaveValue(dirtyText);
    await expect(page.getByTestId('source-doc-title')).toContainText('Spider Fusion');
  });
});
