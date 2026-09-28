import { test, expect } from '@playwright/test';

test.describe('Sprint 12: Reference Scenario Automation & Desktop Parity', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('canvas#webgl-stage');
    await page.waitForFunction(() => typeof (window as any).TikzitApp !== 'undefined');
    await page.evaluate(() => {
      (window as any).TikzitApp.setActiveStyle('none');
    });
  });

  test('12-E2E-01: Full reference diagram scenario loads and establishes canonical desktop layout', async ({ page }) => {
    // 1. Load canonical reference diagram: 2 junction nodes (-1, 0) and (1, 0), connecting edge, and 2 self-loops
    const canonicalTikz = String.raw`\begin{tikzpicture}
\begin{pgfonlayer}{nodelayer}
\node [style=none] (0) at (-1, 0) {};
\node [style=none] (1) at (1, 0) {};
\end{pgfonlayer}
\begin{pgfonlayer}{edgelayer}
\draw (0) to (1);
\draw [in=135, out=45, loop] (0) to ();
\draw [in=135, out=45, loop] (1) to ();
\end{pgfonlayer}
\end{tikzpicture}`;

    await page.evaluate((code) => {
      (window as any).TikzitApp.loadTikz(code);
    }, canonicalTikz);

    // Verify graph AST representation
    await page.waitForFunction(
      () =>
        (window as any).TikzitApp.getGraph().nodes.length === 2 &&
        (window as any).TikzitApp.getGraph().edges.length === 3
    );

    const graph = await page.evaluate(() => (window as any).TikzitApp.getGraph());
    expect(graph.nodes).toHaveLength(2);
    expect(graph.edges).toHaveLength(3);

    // Verify node coordinates (-1, 0) and (1, 0)
    const n0 = graph.nodes.find((n: any) => n.id === '0');
    const n1 = graph.nodes.find((n: any) => n.id === '1');
    expect(n0.position.x).toBe(-1);
    expect(n0.position.y).toBe(0);
    expect(n1.position.x).toBe(1);
    expect(n1.position.y).toBe(0);

    // Verify self-loop edges have canonical in=135, out=45, loop geometry
    const loops = graph.edges.filter((e: any) => e.sourceId === e.targetId);
    expect(loops).toHaveLength(2);
    for (const loop of loops) {
      const inVal = loop.inAngle ?? loop.properties?.in ?? loop.data?.find((p: any) => p.key === 'in')?.value;
      const outVal = loop.outAngle ?? loop.properties?.out ?? loop.data?.find((p: any) => p.key === 'out')?.value;
      expect(String(inVal)).toBe('135');
      expect(String(outVal)).toBe('45');
    }

    // Verify standard edge connects 0 to 1
    const connectingEdge = graph.edges.find((e: any) => e.sourceId !== e.targetId);
    expect(connectingEdge).toBeDefined();
    expect(connectingEdge.sourceId).toBe('0');
    expect(connectingEdge.targetId).toBe('1');

    // 2. Select Edge Tool to match canonical screenshot active tool state
    const edgeBtn = page.locator('[data-tool="edge"]');
    await edgeBtn.click();
    await expect(edgeBtn).toHaveAttribute('data-active', 'true');
    await expect(edgeBtn).toHaveCSS('border-color', 'rgb(0, 200, 83)');

    // 3. Verify window chrome displays document title with TikZiT branding
    const title = page.locator('[data-testid="doc-tab-title"]');
    await expect(title).toBeVisible();
    await expect(title).toContainText('TikZiT');
  });

  test('12-E2E-02: Interactive construction of the desktop reference scenario', async ({ page }) => {
    // Start with 2 unstyled nodes at (-1, 0) and (1, 0)
    await page.evaluate(() => {
      (window as any).TikzitApp.setActiveStyle('none');
      (window as any).TikzitApp.loadTikz(String.raw`\begin{tikzpicture}
\begin{pgfonlayer}{nodelayer}
\node [style=none] (0) at (-1, 0) {};
\node [style=none] (1) at (1, 0) {};
\end{pgfonlayer}
\end{tikzpicture}`);
    });

    await page.waitForFunction(
      () =>
        (window as any).TikzitApp.getGraph().nodes.length === 2 &&
        (window as any).TikzitApp.getGraph().edges.length === 0
    );

    // Activate Edge tool
    const edgeBtn = page.locator('[data-tool="edge"]');
    await edgeBtn.click();
    await expect(edgeBtn).toHaveCSS('border-color', 'rgb(0, 200, 83)');

    // 1. Connect node 0 to node 1 via drag
    const p0 = await page.evaluate(() => (window as any).TikzitApp.getNodeScreenPos('0'));
    const p1 = await page.evaluate(() => (window as any).TikzitApp.getNodeScreenPos('1'));
    expect(p0).not.toBeNull();
    expect(p1).not.toBeNull();

    await page.mouse.move(p0.x, p0.y);
    await page.mouse.down();
    await page.mouse.move(p1.x, p1.y, { steps: 5 });
    await page.mouse.up();

    // Verify connecting edge created
    await page.waitForFunction(() => (window as any).TikzitApp.getGraph().edges.length === 1);

    // 2. Add self-loop on node 0 via two successive clicks
    await page.mouse.click(p0.x, p0.y);
    await page.mouse.click(p0.x, p0.y);

    await page.waitForFunction(() => (window as any).TikzitApp.getGraph().edges.length === 2);

    // 3. Add self-loop on node 1 via two successive clicks
    await page.mouse.click(p1.x, p1.y);
    await page.mouse.click(p1.x, p1.y);

    await page.waitForFunction(() => (window as any).TikzitApp.getGraph().edges.length === 3);

    // Verify TikZ serialization matches canonical format
    const tikzCode = await page.evaluate(() => (window as any).TikzitApp.getTikzCode());
    expect(tikzCode).toContain('(0) to (1);');
    expect(tikzCode).toContain('[in=135, out=45, loop] (0) to ();');
    expect(tikzCode).toContain('[in=135, out=45, loop] (1) to ();');
  });

  test('12-E2E-03: Camera positioning and coordinate projection at 100 px/unit', async ({ page }) => {
    // Load 2 nodes spaced exactly 2 units apart
    await page.evaluate(() => {
      (window as any).TikzitApp.loadTikz(String.raw`\begin{tikzpicture}
\begin{pgfonlayer}{nodelayer}
\node [style=none] (0) at (-1, 0) {};
\node [style=none] (1) at (1, 0) {};
\end{pgfonlayer}
\end{tikzpicture}`);
      // Set camera to center (0, 0) at zoom 1.0 (100 px/unit base scale)
      (window as any).TikzitApp.stage.cameraController.setCamera(0, 0, 1.0);
      (window as any).TikzitApp.stage.render();
    });

    await page.waitForFunction(() => (window as any).TikzitApp.getGraph().nodes.length === 2);

    const p0 = await page.evaluate(() => (window as any).TikzitApp.getNodeScreenPos('0'));
    const p1 = await page.evaluate(() => (window as any).TikzitApp.getNodeScreenPos('1'));
    expect(p0).not.toBeNull();
    expect(p1).not.toBeNull();

    // Delta X for 2 TikZ units at 100 px/unit = 200 px
    const deltaX = Math.abs(p1.x - p0.x);
    expect(deltaX).toBeGreaterThanOrEqual(195);
    expect(deltaX).toBeLessThanOrEqual(205);

    // Delta Y should be 0 (both at y=0)
    const deltaY = Math.abs(p1.y - p0.y);
    expect(deltaY).toBeLessThanOrEqual(2);
  });
});