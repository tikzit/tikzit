import { expect, test } from '@playwright/test';

const bialgebraHandle = 'zx:examples:05_bialgebra_law';
const spiderHandle = 'zx:examples:01_spider_fusion';

async function ready(page: import('@playwright/test').Page) {
  await page.goto('/');
  await expect(page.getByTestId(`corpus-entry-${spiderHandle}`)).toBeVisible({ timeout: 30000 });
}

test('searches, opens exact source, gates save, and restores the committed head after reload', async ({ page }) => {
  await ready(page);
  await expect(page.locator('[data-testid^="corpus-entry-zx:examples:"]')).toHaveCount(12);
  await page.getByTestId('corpus-search-input').fill('  BIALGEBRA ');
  const row = page.getByTestId(`corpus-entry-${bialgebraHandle}`);
  await expect(row).toBeVisible();
  await expect(page.locator('[data-testid^="corpus-entry-zx:examples:"]')).toHaveCount(1);
  await row.click();

  // Activation projects the opened head: current row + real CID, no fabricated text.
  await expect(row).toHaveAttribute('aria-current', 'page');
  const statusCid = page.getByTestId('status-cid');
  await expect(statusCid).toHaveText(/CID: blake3:[0-9a-f]{11}…/);
  await expect(statusCid).toHaveAttribute('title', /^blake3:[0-9a-f]{64}$/);

  const source = page.getByTestId('tikz-source-editor');
  const original = await source.inputValue();
  const initialCid = await statusCid.textContent();
  expect(original).toContain('\\node [style=X dot]');
  await source.fill(`${original}% Sprint 15 persisted edit\n`);
  await page.keyboard.press('Control+s');
  await expect(page.getByTestId('source-doc-title')).toHaveText('The Bialgebra Interaction Law');
  await expect(page.getByTestId('status-cid')).not.toHaveText(initialCid ?? '');
  await expect(page.getByTestId('corpus-persistence-state')).toHaveText('Saved locally');

  await page.reload();
  await expect(page.getByTestId(`corpus-entry-${spiderHandle}`)).toBeVisible({ timeout: 30000 });
  await page.getByTestId('corpus-search-input').fill('bialgebra');
  await page.getByTestId(`corpus-entry-${bialgebraHandle}`).click();
  await expect(page.getByTestId('source-doc-title')).toHaveText('The Bialgebra Interaction Law', { timeout: 15000 });
  await expect(source).toHaveValue(/Sprint 15 persisted edit/, { timeout: 15000 });
});

test('replaces canvas geometry when switching between corpus entries', async ({ page }) => {
  await ready(page);

  const snapshot = () =>
    page.evaluate(() => {
      const app = (window as Window & { TikzitApp?: any }).TikzitApp;
      const ast = app.getGraph();
      return {
        astNodeIds: ast.nodes.map((n: any) => String(n.id)).sort(),
        renderedNodes: app.stage.nodeRenderer.nodeGroup.children.length,
        renderedEdges: app.stage.edgeRenderer.edgeGroup.children.length,
        edgeCount: ast.edges.length,
      };
    });

  await page.getByTestId(`corpus-entry-${spiderHandle}`).click();
  await expect(page.getByTestId('tikz-source-editor')).not.toHaveValue('');
  await page.waitForFunction(() => {
    const app = (window as Window & { TikzitApp?: any }).TikzitApp;
    return app?.stage?.nodeRenderer?.nodeGroup.children.length === app?.getGraph().nodes.length;
  });
  const first = await snapshot();
  expect(first.renderedNodes).toBe(first.astNodeIds.length);
  expect(first.renderedEdges).toBe(first.edgeCount);

  await page.getByTestId(`corpus-entry-${bialgebraHandle}`).click();
  await page.waitForFunction(() => {
    const app = (window as Window & { TikzitApp?: any }).TikzitApp;
    return app?.stage?.nodeRenderer?.nodeGroup.children.length === app?.getGraph().nodes.length;
  });
  const second = await snapshot();
  expect(second.renderedNodes).toBe(second.astNodeIds.length);
  expect(second.renderedEdges).toBe(second.edgeCount);
  expect(second.astNodeIds.length).toBeGreaterThan(0);

  const staleIds = await page.evaluate((previousIds: string[]) => {
    const app = (window as Window & { TikzitApp?: any }).TikzitApp;
    const currentIds = new Set(app.getGraph().nodes.map((n: any) => String(n.id)));
    return previousIds.filter((id) => !currentIds.has(id) && app.stage.nodeRenderer.getNodeMesh(id));
  }, first.astNodeIds);
  expect(staleIds).toEqual([]);
});

test('keeps a dirty corpus buffer when opening a different entry', async ({ page }) => {
  await ready(page);
  await page.getByTestId(`corpus-entry-${spiderHandle}`).click();
  const source = page.getByTestId('tikz-source-editor');
  const dirtyText = `${await source.inputValue()}% unsaved buffer\n`;
  await source.fill(dirtyText);
  await page.getByTestId(`corpus-entry-${bialgebraHandle}`).click();
  await page.getByTestId(`corpus-entry-${spiderHandle}`).click();
  await expect(source).toHaveValue(dirtyText);
});

test('keeps the prior head, dirty flag, and bail receipt when a corpus save is gated', async ({ page }) => {
  await ready(page);
  await page.getByTestId(`corpus-entry-${spiderHandle}`).click();
  const source = page.getByTestId('tikz-source-editor');
  await expect(source).not.toHaveValue('');
  const cidBefore = await page.getByTestId('status-cid').getAttribute('title');
  const receiptsBefore = await page.evaluate(
    () => ((window as Window & { TikzitApp?: any }).TikzitApp?.getReceipts?.() ?? []).length
  );

  // Syntactically invalid TikZ: the commit gate must bail without moving the head.
  await source.fill('\\begin{tikzpicture}\n\\node (\n');
  await page.keyboard.press('Control+s');

  await expect(page.getByTestId('source-doc-title')).toContainText('*');
  await expect(page.getByTestId('status-cid')).toHaveAttribute('title', cidBefore ?? '');
  await expect(page.getByTestId('sync-diagnostics-banner')).toBeVisible();
  await page.waitForFunction(
    (before) =>
      (((window as Window & { TikzitApp?: any }).TikzitApp?.getReceipts?.() ?? []).length) > before,
    receiptsBefore
  );
  const receipts = await page.evaluate(
    () => (window as Window & { TikzitApp?: any }).TikzitApp?.getReceipts?.() ?? []
  );
  expect(receipts.at(-1)?.verdict).toBe('bail');
  await expect(page.getByTestId('corpus-persistence-state')).toHaveText('Saved locally');
});

test('shows non-persistent status when IndexedDB is unavailable', async ({ page }) => {
  await page.addInitScript(() => Object.defineProperty(window, 'indexedDB', { configurable: true, value: undefined }));
  await page.goto('/');
  await expect(page.getByTestId(`corpus-entry-${spiderHandle}`)).toBeVisible({ timeout: 30000 });
  await expect(page.getByTestId('corpus-persistence-state')).toHaveText('Not persisted');
  await expect(page.getByText(/Session storage is unavailable/)).toBeVisible();
});

test('reports a failed sql.js WASM request instead of leaving the workbench in an infinite loader', async ({ page }) => {
  await page.route('**/sql-wasm*.wasm', (route) => route.abort());
  await page.goto('/');
  await expect(page.getByText(/Workbench startup failed/)).toBeVisible({ timeout: 30000 });
  await expect(page.getByTestId('temporary-session-btn')).toHaveCount(0);
});

test('offers a temporary session when the IndexedDB open request fails', async ({ page }) => {
  await page.addInitScript(() => {
    Object.defineProperty(window, 'indexedDB', {
      configurable: true,
      value: {
        open: () => {
          const request: Record<string, unknown> = {};
          request.error = new DOMException('Could not open IndexedDB', 'UnknownError');
          setTimeout(() => (request as any).onerror?.(new Event('error')), 0);
          return request;
        },
      },
    });
  });
  await page.goto('/');
  await expect(page.getByText(/Workbench startup failed/)).toBeVisible({ timeout: 30000 });
  await expect(page.getByTestId('temporary-session-btn')).toBeVisible();
  await page.getByTestId('temporary-session-btn').click();
  await expect(page.getByTestId(`corpus-entry-${spiderHandle}`)).toBeVisible({ timeout: 30000 });
  await expect(page.getByTestId('corpus-persistence-state')).toHaveText('Not persisted');
});

test('preserves a future-version snapshot and allows an explicit temporary session', async ({ page }) => {
  await ready(page);
  await page.evaluate(async () => {
    const db = await new Promise<IDBDatabase>((resolve, reject) => {
      const request = indexedDB.open('tikzit_corpus_db', 1);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
    await new Promise<void>((resolve, reject) => {
      const transaction = db.transaction('snapshots', 'readwrite');
      const store = transaction.objectStore('snapshots');
      const request = store.get('current');
      request.onsuccess = () => store.put({ ...request.result, version: 999 }, 'current');
      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error);
    });
    db.close();
  });
  await page.reload();
  await expect(page.getByText(/Workbench startup failed: Unsupported corpus snapshot version/)).toBeVisible();
  await page.getByTestId('temporary-session-btn').click();
  await expect(page.getByTestId(`corpus-entry-${spiderHandle}`)).toBeVisible({ timeout: 30000 });
  await expect(page.getByTestId('corpus-persistence-state')).toHaveText('Not persisted');
  const storedVersion = await page.evaluate(async () => {
    const db = await new Promise<IDBDatabase>((resolve, reject) => {
      const request = indexedDB.open('tikzit_corpus_db', 1);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
    const version = await new Promise<number>((resolve, reject) => {
      const transaction = db.transaction('snapshots', 'readonly');
      const request = transaction.objectStore('snapshots').get('current');
      request.onsuccess = () => resolve(request.result.version);
      request.onerror = () => reject(request.error);
    });
    db.close();
    return version;
  });
  expect(storedVersion).toBe(999);
});

test('exports a SQLite database through the picker without relying on a Node codec', async ({ page }) => {
  await ready(page);
  await page.getByTestId(`corpus-entry-${bialgebraHandle}`).click();
  const source = page.getByTestId('tikz-source-editor');
  await source.fill(`${await source.inputValue()}% export history\n`);
  await page.keyboard.press('Control+s');
  await expect(page.getByTestId('corpus-persistence-state')).toHaveText('Saved locally');
  await page.evaluate(() => {
    const target = window as Window & { __exportBytes?: number[]; showSaveFilePicker?: (options: unknown) => Promise<unknown> };
    target.showSaveFilePicker = async () => ({
      createWritable: async () => ({
        write: async (blob: Blob) => { target.__exportBytes = Array.from(new Uint8Array(await blob.arrayBuffer())); },
        close: async () => undefined,
      }),
    });
  });
  await page.getByTestId('btn-export-collection').click();
  await expect(page.getByTestId('export-collection-dialog')).toBeVisible();
  await page.getByTestId('btn-confirm-collection-export').click();
  await expect(page.getByTestId('collection-export-success')).toBeVisible();
  const bytes = await page.evaluate(() => (window as Window & { __exportBytes?: number[] }).__exportBytes ?? []);
  expect(bytes.slice(0, 16)).toEqual(Array.from(new TextEncoder().encode('SQLite format 3\0')));
});

test('uses Blob download only when the picker is unavailable and revokes its object URL', async ({ page }) => {
  await ready(page);
  await page.evaluate(() => {
    const target = window as Window & { __revokedUrls?: string[]; showSaveFilePicker?: undefined };
    Object.defineProperty(target, 'showSaveFilePicker', { configurable: true, value: undefined });
    const revoked: string[] = [];
    const originalCreate = URL.createObjectURL.bind(URL);
    const originalRevoke = URL.revokeObjectURL.bind(URL);
    URL.createObjectURL = (blob) => originalCreate(blob);
    URL.revokeObjectURL = (url) => { revoked.push(url); originalRevoke(url); };
    target.__revokedUrls = revoked;
  });
  await page.getByTestId('btn-export-collection').click();
  await expect(page.getByTestId('export-collection-dialog')).toBeVisible();
  const downloadPromise = page.waitForEvent('download');
  await page.getByTestId('btn-confirm-collection-export').click();
  const download = await downloadPromise;
  expect(download.suggestedFilename()).toMatch(/^tikzit-diagrams-\d{8}\.db$/);
  await expect(page.getByTestId('collection-export-success')).toBeVisible();
  await page.waitForFunction(() => ((window as Window & { __revokedUrls?: string[] }).__revokedUrls?.length ?? 0) > 0);
});
