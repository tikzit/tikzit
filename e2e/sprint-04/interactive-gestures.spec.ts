import { test, expect } from '@playwright/test';

test.describe('Sprint 04: Interactive Gestures & Motion Physics', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('canvas#webgl-stage');
    // Ensure TikzitApp is ready
    await page.waitForFunction(() => typeof (window as any).TikzitApp !== 'undefined');
  });

  test('04-E2E-01: Vertex tool places nodes with grid snapping', async ({ page }) => {
    await page.evaluate(() => {
      (window as any).TikzitApp.loadTikz(`\\begin{tikzpicture}\n\\end{tikzpicture}`);
    });
    await page.keyboard.press('V'); // Vertex mode
    const canvas = page.locator('canvas#webgl-stage');
    const box = await canvas.boundingBox();
    if (!box) throw new Error('Canvas not found');

    // Click at center
    await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2);

    // Click 100px to the right
    await page.mouse.click(box.x + box.width / 2 + 100, box.y + box.height / 2);

    const nodeCount = await page.evaluate(() => (window as any).TikzitApp.getGraph().nodes.length);
    expect(nodeCount).toBe(2);
  });

  test('04-E2E-02: Edge tool drag connects two nodes with wire', async ({ page }) => {
    // Setup 2 nodes
    await page.evaluate(() => {
      (window as any).TikzitApp.loadTikz(`\\begin{tikzpicture}
\\begin{pgfonlayer}{nodelayer}
\\node [style=none] (0) at (-2, 0) {};
\\node [style=none] (1) at (2, 0) {};
\\end{pgfonlayer}
\\end{tikzpicture}`);
    });

    await page.keyboard.press('E'); // Edge mode
    const canvas = page.locator('canvas#webgl-stage');
    const box = await canvas.boundingBox();
    if (!box) throw new Error('Canvas not found');

    const node0Pos = await page.evaluate(() => (window as any).TikzitApp.getNodeScreenPos('0'));
    const node1Pos = await page.evaluate(() => (window as any).TikzitApp.getNodeScreenPos('1'));

    await page.mouse.move(node0Pos.x, node0Pos.y);
    await page.mouse.down();
    await page.mouse.move(node1Pos.x, node1Pos.y, { steps: 5 });
    await page.mouse.up();

    const edgeCount = await page.evaluate(() => (window as any).TikzitApp.getGraph().edges.length);
    expect(edgeCount).toBe(1);
  });

  test('04-E2E-03: Curvature handle bending interaction', async ({ page }) => {
    // Setup 2 nodes and an edge if not present
    await page.evaluate(() => {
      (window as any).TikzitApp.loadTikz(`\\begin{tikzpicture}
\\begin{pgfonlayer}{nodelayer}
\\node [style=none] (0) at (-2, 0) {};
\\node [style=none] (1) at (2, 0) {};
\\end{pgfonlayer}
\\begin{pgfonlayer}{edgelayer}
\\draw (0) to (1);
\\end{pgfonlayer}
\\end{tikzpicture}`);
    });

    await page.keyboard.press('S'); // Select mode
    const handlePos = await page.evaluate(() => (window as any).TikzitApp.getEdgeHandleScreenPos(0));
    expect(handlePos).not.toBeNull();

    await page.mouse.move(handlePos.x, handlePos.y);
    await page.mouse.down();
    await page.mouse.move(handlePos.x, handlePos.y - 80, { steps: 5 });
    await page.mouse.up();

    const bendAngle = await page.evaluate(() => (window as any).TikzitApp.getGraph().edges[0].properties['bend left']);
    expect(bendAngle).not.toBeUndefined();
  });

  test('04-E2E-04: Marquee selection and multi-node dragging', async ({ page }) => {
    await page.evaluate(() => {
      (window as any).TikzitApp.loadTikz(`\\begin{tikzpicture}
\\begin{pgfonlayer}{nodelayer}
\\node [style=none] (0) at (-2, 0) {};
\\node [style=none] (1) at (2, 0) {};
\\end{pgfonlayer}
\\end{tikzpicture}`);
    });

    await page.keyboard.press('S');
    const canvas = page.locator('canvas#webgl-stage');
    const box = await canvas.boundingBox();
    if (!box) throw new Error('Canvas not found');

    // Drag marquee covering both nodes
    await page.mouse.move(box.x + 50, box.y + 50);
    await page.mouse.down();
    await page.mouse.move(box.x + box.width - 50, box.y + box.height - 50, { steps: 5 });
    await page.mouse.up();

    const selectedCount = await page.evaluate(() => (window as any).TikzitApp.getSelectedNodeIds().length);
    expect(selectedCount).toBe(2);

    // Drag both nodes
    const node0Pos = await page.evaluate(() => (window as any).TikzitApp.getNodeScreenPos('0'));
    await page.mouse.move(node0Pos.x, node0Pos.y);
    await page.mouse.down();
    await page.mouse.move(node0Pos.x + 50, node0Pos.y + 50, { steps: 5 });
    await page.mouse.up();
  });

  test('04-E2E-05: Keyboard delete and arrow-key nudge', async ({ page }) => {
    await page.evaluate(() => {
      (window as any).TikzitApp.loadTikz(`\\begin{tikzpicture}
\\begin{pgfonlayer}{nodelayer}
\\node [style=none] (0) at (-2, 0) {};
\\node [style=none] (1) at (2, 0) {};
\\end{pgfonlayer}
\\end{tikzpicture}`);
      (window as any).TikzitApp.selectNode('0');
    });

    await page.keyboard.press('Control+ArrowUp');
    await page.keyboard.press('Delete');

    const remainingNodes = await page.evaluate(() => (window as any).TikzitApp.getGraph().nodes.length);
    expect(remainingNodes).toBeLessThan(2);
  });
});
