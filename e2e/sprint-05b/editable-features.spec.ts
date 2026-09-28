import { test, expect } from '@playwright/test';

test.describe('Sprint 05B: Editable Canvas Interaction & Tool Integration', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('canvas#webgl-stage');
    await page.waitForFunction(() => typeof (window as any).TikzitApp !== 'undefined');

    // Clean baseline diagram
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
  });

  test('05B-E2E-01: Toolbar Vertex button switches tool, updates cursor to crosshair, and places vertex', async ({ page }) => {
    const canvas = page.locator('canvas#webgl-stage');
    await expect(canvas).toBeVisible();

    // Click Vertex button on toolbar
    const vertexBtn = page.locator('[data-tool="vertex"]');
    await expect(vertexBtn).toBeVisible();
    await vertexBtn.click();

    // Cursor should update to crosshair
    await expect(canvas).toHaveCSS('cursor', 'crosshair');

    // Click canvas to place node at (0, 0)
    const box = await canvas.boundingBox();
    if (!box) throw new Error('Canvas not found');

    const initialCount = await page.evaluate(() => (window as any).TikzitApp.getGraph().nodes.length);
    expect(initialCount).toBe(2);

    await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2);

    // Verify node placed in AST
    const updatedCount = await page.evaluate(() => (window as any).TikzitApp.getGraph().nodes.length);
    expect(updatedCount).toBe(3);
  });

  test('05B-E2E-02: Placing vertex uses active style from Style Palette', async ({ page }) => {
    const canvas = page.locator('canvas#webgl-stage');
    const box = await canvas.boundingBox();
    if (!box) throw new Error('Canvas not found');

    // Select 'Z' style from Style Palette
    const zSwatch = page.locator('button[data-style-name="Z"]');
    await expect(zSwatch).toBeVisible();
    await zSwatch.click();

    // Activate Vertex tool
    const vertexBtn = page.locator('[data-tool="vertex"]');
    await vertexBtn.click();

    // Click canvas
    await page.mouse.click(box.x + box.width / 2 + 50, box.y + box.height / 2 + 50);

    // Check newly added node style in AST
    const graph = await page.evaluate(() => (window as any).TikzitApp.getGraph());
    const latestNode = graph.nodes[graph.nodes.length - 1];
    expect(latestNode).toBeDefined();

    const styleProp = latestNode.data.find((p: any) => p.key === 'style');
    expect(styleProp).toBeDefined();
    expect(styleProp.value).toBe('Z');
  });

  test('05B-E2E-03: Edge tool connects two nodes with wire', async ({ page }) => {
    const canvas = page.locator('canvas#webgl-stage');

    // Ensure baseline diagram with 2 nodes and 0 edges is firmly set
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

    // Click Edge tool button
    const edgeBtn = page.locator('[data-tool="edge"]');
    await edgeBtn.click();
    await expect(canvas).toHaveCSS('cursor', 'crosshair');

    // Use precise screen positions of the nodes from stage
    const node0Pos = await page.evaluate(() => (window as any).TikzitApp.getNodeScreenPos('0'));
    const node1Pos = await page.evaluate(() => (window as any).TikzitApp.getNodeScreenPos('1'));
    expect(node0Pos).not.toBeNull();
    expect(node1Pos).not.toBeNull();

    await page.mouse.move(node0Pos.x, node0Pos.y);
    await page.mouse.down();
    await page.mouse.move(node1Pos.x, node1Pos.y, { steps: 5 });
    await page.mouse.up();

    // Check edge created
    const edgeCount = await page.evaluate(() => (window as any).TikzitApp.getGraph().edges.length);
    expect(edgeCount).toBe(1);

    const edge = await page.evaluate(() => (window as any).TikzitApp.getGraph().edges[0]);
    expect(edge.sourceId).toBe('0');
    expect(edge.targetId).toBe('1');
  });

  test('05B-E2E-04: Canvas additions synchronize live to SourcePanel TikZ code', async ({ page }) => {
    const canvas = page.locator('canvas#webgl-stage');
    const box = await canvas.boundingBox();
    if (!box) throw new Error('Canvas not found');

    // Click Vertex tool
    await page.locator('[data-tool="vertex"]').click();

    // Click to add a vertex
    await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2);

    // Source panel textarea should contain the new node
    const sourceArea = page.locator('textarea[data-testid="tikz-source-editor"]');
    await expect(sourceArea).toBeVisible();

    const text = await sourceArea.inputValue();
    expect(text).toContain('\\begin{tikzpicture}');
    expect(text).toContain('\\node');
  });

  test('05B-E2E-05: Select tool restores default cursor and allows selection', async ({ page }) => {
    const canvas = page.locator('canvas#webgl-stage');

    // Click Vertex tool -> crosshair
    await page.locator('[data-tool="vertex"]').click();
    await expect(canvas).toHaveCSS('cursor', 'crosshair');

    // Click Select tool -> default
    await page.locator('[data-tool="select"]').click();
    await expect(canvas).toHaveCSS('cursor', 'default');
  });
  test('05B-E2E-06: Clicking the same node twice with Edge tool creates an upward teardrop self-loop', async ({ page }) => {
    const canvas = page.locator('canvas#webgl-stage');

    await page.evaluate(() => {
      (window as any).TikzitApp.loadTikz(`\\begin{tikzpicture}
\\begin{pgfonlayer}{nodelayer}
\\node [style=none] (0) at (0, 0) {};
\\end{pgfonlayer}
\\end{tikzpicture}`);
    });
    await page.waitForFunction(
      () => (window as any).TikzitApp.getGraph().nodes.length === 1
    );

    // Switch to Edge tool
    await page.locator('[data-tool="edge"]').click();
    await expect(canvas).toHaveCSS('cursor', 'crosshair');

    const nodePos = await page.evaluate(() => (window as any).TikzitApp.getNodeScreenPos('0'));
    expect(nodePos).not.toBeNull();

    // First click on node 0
    await page.mouse.click(nodePos.x, nodePos.y);

    // Second click on node 0 -> creates self-loop
    await page.mouse.click(nodePos.x, nodePos.y);

    // Verify self-loop created
    await page.waitForFunction(
      () => (window as any).TikzitApp.getGraph().edges.length === 1
    );
    const loop = await page.evaluate(() => (window as any).TikzitApp.getGraph().edges[0]);
    expect(loop.sourceId).toBe('0');
    expect(loop.targetId).toBe('0');
    expect(loop.inAngle).toBe(135);
    expect(loop.outAngle).toBe(45);
  });
});
