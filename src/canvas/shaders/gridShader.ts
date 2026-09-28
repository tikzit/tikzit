import * as THREE from 'three';

export interface GridThemeColors {
  bg: THREE.Color;
  minor: THREE.Color;
  major: THREE.Color;
  axis: THREE.Color;
}

export type GridThemeName = 'desktop' | 'dark' | 'light';

export const GRID_THEMES: Record<GridThemeName, GridThemeColors> = {
  // Desktop TikZiT Parity (tikzview.cpp:66-75, src/tikzit.h:78-82)
  desktop: {
    bg: new THREE.Color('#FFFFFF'),       // Pure white diagram paper
    minor: new THREE.Color('#FAFAFF'),    // QColor(250, 250, 255)
    major: new THREE.Color('#F0F0FA'),    // QColor(240, 240, 250)
    axis: new THREE.Color('#DCDCF0'),     // QColor(220, 220, 240)
  },
  dark: {
    bg: new THREE.Color('#0D1117'),
    minor: new THREE.Color('#161B22'),
    major: new THREE.Color('#30363D'),
    axis: new THREE.Color('#388BFD'),
  },
  light: {
    bg: new THREE.Color('#F6F8FA'),
    minor: new THREE.Color('#E1E4E8'),
    major: new THREE.Color('#D1D5DA'),
    axis: new THREE.Color('#0969DA'),
  },
};

export const gridVertexShader = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = vec4(position.xy, 0.0, 1.0);
  }
`;

export const gridFragmentShader = /* glsl */ `
  precision highp float;

  uniform vec2 uResolution;
  uniform vec2 uCameraOffset;
  uniform float uZoom;
  uniform vec3 uGridColorMajor;
  uniform vec3 uGridColorMinor;
  uniform vec3 uAxisColor;
  uniform vec3 uBgColor;

  float getGridLine(vec2 coord, float spacing, float lineWidthPx) {
    vec2 grid = abs(fract(coord / spacing - 0.5) - 0.5) * spacing;
    vec2 dgrid = fwidth(coord);
    vec2 line = smoothstep(dgrid * lineWidthPx, vec2(0.0), grid);
    return max(line.x, line.y);
  }

  void main() {
    // Transform screen UV to TikZ world coordinates
    vec2 worldCoord = (gl_FragCoord.xy - uResolution * 0.5) / uZoom - uCameraOffset;

    // Minor grid: 0.25 TikZ units (10 scene px at scale 40)
    float minor = getGridLine(worldCoord, 0.25, 1.0);
    // Major grid: 1.0 TikZ units (40 scene px at scale 40)
    float major = getGridLine(worldCoord, 1.0, 1.5);

    // Axis lines at x = 0, y = 0
    vec2 axisDist = abs(worldCoord);
    vec2 dAxis = fwidth(worldCoord);
    vec2 axisLine = smoothstep(dAxis * 2.0, vec2(0.0), axisDist);
    float axis = max(axisLine.x, axisLine.y);

    // Desktop TikZiT Parity (tikzview.cpp:79):
    // Minor grid is gated when _scale > 0.2 (pixelsPerUnit > 8.0)
    float minorOpacity = uZoom > 8.0 ? clamp((uZoom - 8.0) / 12.0, 0.0, 1.0) : 0.0;

    // Composite pure unattenuated hex values with in-line alpha 1.0
    vec3 color = mix(uBgColor, uGridColorMinor, minor * minorOpacity);
    color = mix(color, uGridColorMajor, major * 1.0);
    color = mix(color, uAxisColor, axis * 1.0);

    gl_FragColor = vec4(color, 1.0);
  }
`;

export function createGridMaterial(theme: GridThemeName = 'desktop'): THREE.ShaderMaterial {
  const colors = GRID_THEMES[theme] ?? GRID_THEMES.desktop;
  return new THREE.ShaderMaterial({
    vertexShader: gridVertexShader,
    fragmentShader: gridFragmentShader,
    uniforms: {
      uResolution: { value: new THREE.Vector2(800, 600) },
      uCameraOffset: { value: new THREE.Vector2(0, 0) },
      uZoom: { value: theme === "desktop" ? 100.0 : 50.0 },
      uGridColorMajor: { value: colors.major.clone() },
      uGridColorMinor: { value: colors.minor.clone() },
      uAxisColor: { value: colors.axis.clone() },
      uBgColor: { value: colors.bg.clone() },
    },
    depthWrite: false,
    depthTest: false,
  });
}

export function updateGridUniforms(
  material: THREE.ShaderMaterial,
  width: number,
  height: number,
  cameraX: number,
  cameraY: number,
  zoom: number,
  theme?: GridThemeName
): void {
  material.uniforms.uResolution.value.set(width, height);
  material.uniforms.uCameraOffset.value.set(cameraX, cameraY);
  material.uniforms.uZoom.value = zoom;

  if (theme) {
    const colors = GRID_THEMES[theme] ?? GRID_THEMES.desktop;
    material.uniforms.uGridColorMajor.value.copy(colors.major);
    material.uniforms.uGridColorMinor.value.copy(colors.minor);
    material.uniforms.uAxisColor.value.copy(colors.axis);
    material.uniforms.uBgColor.value.copy(colors.bg);
  }
}

export function createGridMesh(material: THREE.ShaderMaterial): THREE.Mesh {
  // 2x2 clip space plane
  const geometry = new THREE.PlaneGeometry(2, 2);
  const mesh = new THREE.Mesh(geometry, material);
  mesh.frustumCulled = false;
  mesh.position.z = -100;
  return mesh;
}
