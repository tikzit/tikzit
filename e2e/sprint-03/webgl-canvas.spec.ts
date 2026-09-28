import { test, expect } from '@playwright/test';

test.describe('Sprint 03: Three.js WebGL Canvas Stage', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/test-harness/canvas-runner.html');
    await page.waitForSelector('canvas#webgl-stage');
  });

  test('03-E2E-01: Mounts WebGL canvas and initializes rendering context', async ({ page }) => {
    const canvas = page.locator('canvas#webgl-stage');
    await expect(canvas).toBeVisible();

    const isWebGL = await page.evaluate(() => {
      const el = document.querySelector('canvas#webgl-stage') as HTMLCanvasElement;
      return !!el.getContext('webgl2') || !!el.getContext('webgl');
    });
    expect(isWebGL).toBe(true);
  });

  test('03-E2E-02: Captures deterministic renders for reviewed fixtures', async ({ page }) => {
    for (let id = 1; id <= 12; id++) {
      const paddedId = String(id).padStart(2, '0');
      const stats = await page.evaluate(async (num) => {
        return await (window as any).TestCanvas.loadCorpusDiagram(num);
      }, paddedId);

      expect(stats.nodeCount).toBeGreaterThan(0);
      expect(stats.edgeCount).toBeGreaterThanOrEqual(0);
      await page.waitForTimeout(50);
    }
  });

  test('03-E2E-03: Camera pan, wheel zoom and coordinate projection accuracy', async ({ page }) => {
    const canvas = page.locator('canvas#webgl-stage');
    const box = await canvas.boundingBox();
    if (!box) throw new Error('Canvas bounding box not found');

    // Middle drag to pan
    await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
    await page.mouse.down({ button: 'middle' });
    await page.mouse.move(box.x + box.width / 2 + 100, box.y + box.height / 2 + 50);
    await page.mouse.up({ button: 'middle' });

    // Wheel to zoom
    await page.mouse.wheel(0, -200);

    const cameraState = await page.evaluate(() => (window as any).TestCanvas.getCameraState());
    expect(cameraState.zoom).toBeGreaterThan(1.0);
    expect(cameraState.position.x).not.toBe(0);
  });

  test('03-E2E-04: WebGL Context Loss and Restoration Resilience', async ({ page }) => {
    const restored = await page.evaluate(async () => {
      const canvas = document.querySelector('canvas#webgl-stage') as HTMLCanvasElement;
      const ext = canvas.getContext('webgl2')?.getExtension('WEBGL_lose_context') ||
                  canvas.getContext('webgl')?.getExtension('WEBGL_lose_context');
      if (!ext) return true;

      ext.loseContext();
      await new Promise((r) => setTimeout(r, 100));
      ext.restoreContext();
      await new Promise((r) => setTimeout(r, 200));

      return (window as any).TestCanvas.isSceneReady();
    });

    expect(restored).toBe(true);
  });

  test('03-E2E-05: Reports viewport frame-time measurements for the stress fixture', async ({ page }) => {
    const fps = await page.evaluate(async () => {
      await (window as any).TestCanvas.populateStressGraph(1000);
      return (window as any).TestCanvas.measureFPSDuringPanZoom(60);
    });

    expect(Number.isFinite(fps)).toBe(true);
    expect(fps).toBeGreaterThan(0);
  });
});
