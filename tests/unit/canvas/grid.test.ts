import { describe, it, expect } from 'vitest';
import {
  createGridMaterial,
  updateGridUniforms,
  GRID_THEMES,
} from '../../../src/canvas/shaders/gridShader';

describe('Procedural Grid Shader Uniforms', () => {
  it('creates material with default dark theme uniforms', () => {
    const mat = createGridMaterial('dark');

    expect(mat.uniforms.uResolution.value.x).toBe(800);
    expect(mat.uniforms.uResolution.value.y).toBe(600);
    expect(mat.uniforms.uCameraOffset.value.x).toBe(0);
    expect(mat.uniforms.uCameraOffset.value.y).toBe(0);
    expect(mat.uniforms.uZoom.value).toBe(50.0);

    const darkBgHex = mat.uniforms.uBgColor.value.getHexString().toLowerCase();
    expect(darkBgHex).toBe('0d1117');
  });

  it('updates uniforms dynamically on pan and zoom', () => {
    const mat = createGridMaterial('dark');
    updateGridUniforms(mat, 1920, 1080, 2.5, -1.5, 120.0);

    expect(mat.uniforms.uResolution.value.x).toBe(1920);
    expect(mat.uniforms.uResolution.value.y).toBe(1080);
    expect(mat.uniforms.uCameraOffset.value.x).toBe(2.5);
    expect(mat.uniforms.uCameraOffset.value.y).toBe(-1.5);
    expect(mat.uniforms.uZoom.value).toBe(120.0);
  });

  it('toggles between dark and light themes seamlessly', () => {
    const mat = createGridMaterial('dark');
    expect(mat.uniforms.uBgColor.value.getHexString().toLowerCase()).toBe('0d1117');

    updateGridUniforms(mat, 800, 600, 0, 0, 50, 'light');
    expect(mat.uniforms.uBgColor.value.getHexString().toLowerCase()).toBe('f6f8fa');
    expect(mat.uniforms.uAxisColor.value.getHexString().toLowerCase()).toBe('0969da');

    updateGridUniforms(mat, 800, 600, 0, 0, 50, 'dark');
    expect(mat.uniforms.uBgColor.value.getHexString().toLowerCase()).toBe('0d1117');
    expect(mat.uniforms.uAxisColor.value.getHexString().toLowerCase()).toBe('388bfd');
  });
});
