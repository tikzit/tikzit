import { test, expect } from '@playwright/test';

test.describe('Sprint 10: Canvas Stage Visual Parity & Teardrop Self-Loop Engine', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('canvas#webgl-stage');
    await page.waitForFunction(() => typeof (window as any).TikzitApp !== 'undefined');

    // Baseline diagram with 2 junction nodes
    await page.evaluate(() => {
      (window as any).TikzitApp.loadTikz(`\\begin{tikzpicture}
\\begin{pgfonlayer}{nodelayer}
\\node [style=none] (0) at (-2, 0) {};
\\node [style=none] (1) at (2, 0) {};
\\end{pgfonlayer}
\\end{tikzpicture}`);
    });
    await page.waitForFunction(
      () =>
        (window as any).TikzitApp.getGraph().nodes.length === 2 &&
        (window as any).TikzitApp.getGraph().edges.length === 0
    );
    await page.evaluate(() => {
      (window as any).TikzitApp.setActiveStyle('none');
    });
  });

  test('10-E2E-01: Mounts WebGL stage canvas inside canvas dock panel', async ({ page }) => {
    const canvas = page.locator('canvas#webgl-stage');
    await expect(canvas).toBeVisible();

    const canvasPanel = page.locator('[data-panel="canvas"]');
    await expect(canvasPanel).toBeVisible();
  });

  test('10-E2E-02: Self-loop creation via two-click on same node creates upward teardrop loop', async ({ page }) => {
    const canvas = page.locator('canvas#webgl-stage');

    // Switch to Edge tool
    const edgeBtn = page.locator('[data-tool="edge"]');
    await edgeBtn.click();
    await expect(canvas).toHaveCSS('cursor', 'crosshair');

    // Retrieve screen coordinate of node 0
    const node0Pos = await page.evaluate(() => (window as any).TikzitApp.getNodeScreenPos('0'));
    expect(node0Pos).not.toBeNull();

    // First click on node 0
    await page.mouse.click(node0Pos.x, node0Pos.y);

    // Second click on the same node 0
    await page.mouse.click(node0Pos.x, node0Pos.y);

    // Verify self-loop edge created
    const edgeCount = await page.evaluate(() => (window as any).TikzitApp.getGraph().edges.length);
    expect(edgeCount).toBe(1);

    const edge = await page.evaluate(() => (window as any).TikzitApp.getGraph().edges[0]);
    expect(edge.sourceId).toBe('0');
    expect(edge.targetId).toBe('0');
    expect(edge.inAngle).toBe(135);
    expect(edge.outAngle).toBe(45);
    expect(edge.weight).toBe(1.0);

    // Verify emitted TikZ syntax contains canonical self-loop format \draw [in=135, out=45, loop] (0) to ();
    const tikzCode = await page.evaluate(() => (window as any).TikzitApp.getTikzCode());
    expect(tikzCode).toContain('[in=135, out=45, loop] (0) to ();');
    expect(tikzCode).not.toContain('style=none] (0) to');
  });

  test('10-E2E-03: Self-loop creation via drag-and-drop back to source node', async ({ page }) => {
    const canvas = page.locator('canvas#webgl-stage');

    // Switch to Edge tool
    const edgeBtn = page.locator('[data-tool="edge"]');
    await edgeBtn.click();

    // Node 1 position
    const node1Pos = await page.evaluate(() => (window as any).TikzitApp.getNodeScreenPos('1'));
    expect(node1Pos).not.toBeNull();

    // Drag from node 1 up and back to node 1
    await page.mouse.move(node1Pos.x, node1Pos.y);
    await page.mouse.down();
    await page.mouse.move(node1Pos.x, node1Pos.y - 40, { steps: 3 });
    await page.mouse.move(node1Pos.x, node1Pos.y, { steps: 3 });
    await page.mouse.up();

    // Check edge created
    const edgeCount = await page.evaluate(() => (window as any).TikzitApp.getGraph().edges.length);
    expect(edgeCount).toBe(1);

    const edge = await page.evaluate(() => (window as any).TikzitApp.getGraph().edges[0]);
    expect(edge.sourceId).toBe('1');
    expect(edge.targetId).toBe('1');
    expect(edge.inAngle).toBe(135);
    expect(edge.outAngle).toBe(45);

    const tikzCode = await page.evaluate(() => (window as any).TikzitApp.getTikzCode());
    expect(tikzCode).toContain('[in=135, out=45, loop] (1) to ();');
  });

  test('10-E2E-04: Connecting two distinct nodes creates standard edge without loop property', async ({ page }) => {
    const edgeBtn = page.locator('[data-tool="edge"]');
    await edgeBtn.click();

    const node0Pos = await page.evaluate(() => (window as any).TikzitApp.getNodeScreenPos('0'));
    const node1Pos = await page.evaluate(() => (window as any).TikzitApp.getNodeScreenPos('1'));

    await page.mouse.move(node0Pos.x, node0Pos.y);
    await page.mouse.down();
    await page.mouse.move(node1Pos.x, node1Pos.y, { steps: 5 });
    await page.mouse.up();

    const edge = await page.evaluate(() => (window as any).TikzitApp.getGraph().edges[0]);
    expect(edge.sourceId).toBe('0');
    expect(edge.targetId).toBe('1');
    expect(edge.inAngle).toBeUndefined();
    expect(edge.outAngle).toBeUndefined();

    const tikzCode = await page.evaluate(() => (window as any).TikzitApp.getTikzCode());
    expect(tikzCode).not.toContain('loop');
    expect(tikzCode).toContain('(0) to (1);');
  });
});
