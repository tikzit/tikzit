import { describe, it, expect } from 'vitest';
import { CameraController } from '../../../src/canvas/CameraController';

describe('CameraController & Coordinate Projections', () => {
  it('initializes with default state at origin', () => {
    const controller = new CameraController({ baseScale: 50 });
    controller.setSize(800, 600);

    const state = controller.getState();
    expect(state.position.x).toBe(0);
    expect(state.position.y).toBe(0);
    expect(state.zoom).toBe(1.0);
    expect(state.pixelsPerUnit).toBe(50);
  });

  it('transforms screen to world and world to screen accurately', () => {
    const controller = new CameraController({ baseScale: 50 });
    controller.setSize(800, 600);

    // Center of screen (400, 300) should project to world origin (0, 0)
    const originWorld = controller.screenToWorld(400, 300);
    expect(originWorld.x).toBeCloseTo(0, 5);
    expect(originWorld.y).toBeCloseTo(0, 5);

    // World origin should project back to (400, 300)
    const originScreen = controller.worldToScreen(0, 0);
    expect(originScreen.x).toBeCloseTo(400, 5);
    expect(originScreen.y).toBeCloseTo(300, 5);

    // 1 TikZ unit right (50 px right) -> screen (450, 300)
    const rightWorld = controller.screenToWorld(450, 300);
    expect(rightWorld.x).toBeCloseTo(1, 5);
    expect(rightWorld.y).toBeCloseTo(0, 5);

    // 1 TikZ unit up (+Y is up in world, but down in screen) -> screen (400, 250)
    const upWorld = controller.screenToWorld(400, 250);
    expect(upWorld.x).toBeCloseTo(0, 5);
    expect(upWorld.y).toBeCloseTo(1, 5);
  });

  it('preserves world point under cursor during zoomAt', () => {
    const controller = new CameraController({ baseScale: 50 });
    controller.setSize(800, 600);

    // Point at screen (500, 200)
    const screenX = 500;
    const screenY = 200;
    const worldBefore = controller.screenToWorld(screenX, screenY);

    // Zoom in
    controller.zoomAt(screenX, screenY, -100);

    const worldAfter = controller.screenToWorld(screenX, screenY);
    expect(worldAfter.x).toBeCloseTo(worldBefore.x, 4);
    expect(worldAfter.y).toBeCloseTo(worldBefore.y, 4);
  });

  it('pans by screen delta correctly', () => {
    const controller = new CameraController({ baseScale: 50 });
    controller.setSize(800, 600);

    // Pan right by 100px (2 TikZ units)
    controller.panBy(100, 0);
    const state = controller.getState();
    expect(state.position.x).toBeCloseTo(-2, 5);
    expect(state.position.y).toBeCloseTo(0, 5);
  });
});
