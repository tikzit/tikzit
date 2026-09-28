import * as THREE from 'three';
import type { NodeData, TikzStyle } from '../../core/domain/types';
import { getProperty } from '../../core/domain/types';
import { parsePGFColor } from '../../core/styles/TikzStyleModel';

export interface NodeVisualConfig {
  shape: 'circle' | 'rectangle' | 'diamond' | 'ellipse' | 'none';
  fillColor: string;
  strokeColor: string;
  radius: number;
  width: number;
  height: number;
  isDot: boolean;
}

// Canonical PQP Palette Defaults
export const DEFAULT_STYLE_MAP: Record<string, Partial<NodeVisualConfig>> = {
  Z: { shape: 'circle', fillColor: '#5AD25A', strokeColor: '#000000', radius: 0.22, isDot: false },
  X: { shape: 'circle', fillColor: '#EB4B4B', strokeColor: '#000000', radius: 0.22, isDot: false },
  'Z dot': { shape: 'circle', fillColor: '#5AD25A', strokeColor: '#000000', radius: 0.12, isDot: true },
  'X dot': { shape: 'circle', fillColor: '#EB4B4B', strokeColor: '#000000', radius: 0.12, isDot: true },
  H: { shape: 'rectangle', fillColor: '#FFDC46', strokeColor: '#000000', width: 0.36, height: 0.36, isDot: false },
  none: { shape: 'none', fillColor: 'transparent', strokeColor: 'transparent', radius: 0, isDot: false },
};

export class NodeRenderer {
  public nodeGroup: THREE.Group;
  public labelGroup: THREE.Group;

  // Track created Three.js objects per node ID
  private nodeMeshes: Map<string, THREE.Object3D> = new Map();
  private labelSprites: Map<string, THREE.Sprite> = new Map();
  private selectionRings: Map<string, THREE.LineLoop> = new Map();

  // Shared reusable geometries
  private circleGeom: THREE.CircleGeometry;
  private circleBorderGeom: THREE.BufferGeometry;
  private rectGeom: THREE.PlaneGeometry;
  private rectBorderGeom: THREE.BufferGeometry;
  private diamondGeom: THREE.BufferGeometry;
  private diamondBorderGeom: THREE.BufferGeometry;
  private selectRingGeom: THREE.BufferGeometry;

  private selectMaterial: THREE.LineBasicMaterial;

  constructor() {
    this.nodeGroup = new THREE.Group();
    this.nodeGroup.position.z = 10;
    this.labelGroup = new THREE.Group();
    this.labelGroup.position.z = 20;

    // Unit circle (radius = 1)
    this.circleGeom = new THREE.CircleGeometry(1, 32);
    const circlePoints: THREE.Vector3[] = [];
    for (let i = 0; i <= 32; i++) {
      const theta = (i / 32) * Math.PI * 2;
      circlePoints.push(new THREE.Vector3(Math.cos(theta), Math.sin(theta), 0));
    }
    this.circleBorderGeom = new THREE.BufferGeometry().setFromPoints(circlePoints);

    // Unit rectangle (1x1)
    this.rectGeom = new THREE.PlaneGeometry(1, 1);
    const rectPoints = [
      new THREE.Vector3(-0.5, -0.5, 0),
      new THREE.Vector3(0.5, -0.5, 0),
      new THREE.Vector3(0.5, 0.5, 0),
      new THREE.Vector3(-0.5, 0.5, 0),
    ];
    this.rectBorderGeom = new THREE.BufferGeometry().setFromPoints(rectPoints);

    // Unit diamond (vertices at (0, 0.5), (0.5, 0), (0, -0.5), (-0.5, 0))
    const diamondPoints = [
      new THREE.Vector3(0, 0.5, 0),
      new THREE.Vector3(0.5, 0, 0),
      new THREE.Vector3(0, -0.5, 0),
      new THREE.Vector3(-0.5, 0, 0),
    ];
    this.diamondBorderGeom = new THREE.BufferGeometry().setFromPoints(diamondPoints);

    const diamondVertices = new Float32Array([
      -0.5, 0, 0,   0.5, 0, 0,   0, 0.5, 0,
      -0.5, 0, 0,   0, -0.5, 0,  0.5, 0, 0,
    ]);
    this.diamondGeom = new THREE.BufferGeometry();
    this.diamondGeom.setAttribute('position', new THREE.BufferAttribute(diamondVertices, 3));

    // Selection highlight ring
    const selPoints: THREE.Vector3[] = [];
    for (let i = 0; i <= 32; i++) {
      const theta = (i / 32) * Math.PI * 2;
      selPoints.push(new THREE.Vector3(Math.cos(theta) * 1.35, Math.sin(theta) * 1.35, 0));
    }
    this.selectRingGeom = new THREE.BufferGeometry().setFromPoints(selPoints);
    this.selectMaterial = new THREE.LineBasicMaterial({ color: 0x388bfd, linewidth: 2, depthTest: false });
  }

  public renderNode(
    node: NodeData,
    styles?: Record<string, TikzStyle>,
    isSelected = false
  ): void {
    this.removeNode(node.id);

    const config = this.resolveNodeConfig(node, styles);
    if (config.shape === 'none') {
      // Desktop TikZiT Parity (nodeitem.cpp:72-86): Render visible junction glyph (center dot + dashed boundary ring)
      const container = new THREE.Group();
      container.position.set(node.position.x, node.position.y, 0);

      // 1. Center dot (QColor(180,180,200) -> #b4b4c8)
      const dotMat = new THREE.MeshBasicMaterial({ color: 0xb4b4c8 });
      const dotMesh = new THREE.Mesh(this.circleGeom, dotMat);
      dotMesh.scale.set(0.04, 0.04, 1);
      container.add(dotMesh);

      // 2. Visible dashed junction boundary ring (radius 0.20, QColor(180,180,220) -> #b4b4dc, width 2.0)
      // Dash pattern: 0.05 dash / 0.10 gap in TikZ units (pen [1.0, 2.0] at widthF 2.0; nodeitem.cpp:172)
      const junctionMat = new THREE.LineDashedMaterial({
        color: 0xb4b4dc,
        dashSize: 0.05,
        gapSize: 0.10,
        linewidth: 2,
      });
      const junctionRing = new THREE.LineLoop(this.circleBorderGeom, junctionMat);
      junctionRing.computeLineDistances();
      junctionRing.scale.set(0.20, 0.20, 1);
      container.add(junctionRing);

      if (isSelected) {
        // Desktop TikZiT Parity (nodeitem.cpp:133-140): QColor(150, 200, 255, 100) halo
        const haloMat = new THREE.LineBasicMaterial({
          color: 0x96c8ff,
          transparent: true,
          opacity: 0.39,
          linewidth: 2,
        });
        const selRing = new THREE.LineLoop(this.circleBorderGeom, haloMat);
        selRing.position.set(0, 0, 1);
        selRing.scale.set(0.25, 0.25, 1);
        container.add(selRing);
        this.selectionRings.set(node.id, selRing);
      }

      this.nodeGroup.add(container);
      this.nodeMeshes.set(node.id, container);
      if (node.label && node.label.trim().length > 0) {
        const sprite = this.createLabelSprite(node.label, '#b4b4dc');
        sprite.position.set(node.position.x, node.position.y, 0);
        this.labelGroup.add(sprite);
        this.labelSprites.set(node.id, sprite);
      }
      return;
    }

    const container = new THREE.Group();
    container.position.set(node.position.x, node.position.y, 0);

    const fillMat = new THREE.MeshBasicMaterial({
      color: new THREE.Color(config.fillColor),
      side: THREE.DoubleSide,
    });
    const strokeMat = new THREE.LineBasicMaterial({
      color: new THREE.Color(config.strokeColor),
      linewidth: 1.5,
    });

    if (config.shape === 'rectangle') {
      const mesh = new THREE.Mesh(this.rectGeom, fillMat);
      mesh.scale.set(config.width, config.height, 1);
      container.add(mesh);

      const border = new THREE.LineLoop(this.rectBorderGeom, strokeMat);
      border.scale.set(config.width, config.height, 1);
      container.add(border);
    } else if (config.shape === 'diamond') {
      const mesh = new THREE.Mesh(this.diamondGeom, fillMat);
      mesh.scale.set(config.width, config.height, 1);
      container.add(mesh);

      const border = new THREE.LineLoop(this.diamondBorderGeom, strokeMat);
      border.scale.set(config.width, config.height, 1);
      container.add(border);
    } else {
      // Circle or ellipse
      const r = config.radius;
      const mesh = new THREE.Mesh(this.circleGeom, fillMat);
      mesh.scale.set(r, r, 1);
      container.add(mesh);

      const border = new THREE.LineLoop(this.circleBorderGeom, strokeMat);
      border.scale.set(r, r, 1);
      container.add(border);
    }

    // Selection outline matching the exact node shape (nodeitem.cpp:78-140) at z = 1 with depthTest: false
    if (isSelected) {
      let selOutline: THREE.LineLoop;
      if (config.shape === 'rectangle') {
        selOutline = new THREE.LineLoop(this.rectBorderGeom, this.selectMaterial);
        selOutline.scale.set(config.width + 0.08, config.height + 0.08, 1);
      } else if (config.shape === 'diamond') {
        selOutline = new THREE.LineLoop(this.diamondBorderGeom, this.selectMaterial);
        selOutline.scale.set(config.width + 0.08, config.height + 0.08, 1);
      } else {
        const r = config.radius + 0.05;
        selOutline = new THREE.LineLoop(this.circleBorderGeom, this.selectMaterial);
        selOutline.scale.set(r, r, 1);
      }
      selOutline.position.set(0, 0, 1);
      container.add(selOutline);
      this.selectionRings.set(node.id, selOutline);
    }

    this.nodeGroup.add(container);
    this.nodeMeshes.set(node.id, container);

    // Label
    if (node.label && node.label.trim().length > 0 && !config.isDot) {
      const sprite = this.createLabelSprite(node.label, config.fillColor);
      sprite.position.set(node.position.x, node.position.y, 0);
      this.labelGroup.add(sprite);
      this.labelSprites.set(node.id, sprite);
    }
  }

  public getNodeMesh(id: string): THREE.Object3D | undefined {
    return this.nodeMeshes.get(id);
  }

  public removeNode(id: string): void {
    const mesh = this.nodeMeshes.get(id);
    if (mesh) {
      this.nodeGroup.remove(mesh);
      mesh.traverse((child) => {
        if ((child as THREE.Mesh).material) {
          const mat = (child as THREE.Mesh).material;
          if (Array.isArray(mat)) mat.forEach((m) => m.dispose());
          else mat.dispose();
        }
      });
      this.nodeMeshes.delete(id);
    }

    const sprite = this.labelSprites.get(id);
    if (sprite) {
      this.labelGroup.remove(sprite);
      if (sprite.material.map) sprite.material.map.dispose();
      sprite.material.dispose();
      this.labelSprites.delete(id);
    }

    this.selectionRings.delete(id);
  }

  public clear(): void {
    const ids = Array.from(this.nodeMeshes.keys());
    for (const id of ids) {
      this.removeNode(id);
    }
  }

  public dispose(): void {
    this.clear();
    this.circleGeom.dispose();
    this.circleBorderGeom.dispose();
    this.rectGeom.dispose();
    this.rectBorderGeom.dispose();
    this.diamondGeom.dispose();
    this.diamondBorderGeom.dispose();
    this.selectRingGeom.dispose();
    this.selectMaterial.dispose();
  }

  private resolveNodeConfig(
    node: NodeData,
    styles?: Record<string, TikzStyle>
  ): NodeVisualConfig {
    const styleName = getProperty(node.data, 'style') ?? 'none';
    const preset = DEFAULT_STYLE_MAP[styleName] || {};

    let fillColor = preset.fillColor ?? '#5AD25A';
    let strokeColor = preset.strokeColor ?? '#000000';
    let shape = preset.shape ?? 'circle';
    let radius = preset.radius ?? 0.22;
    let width = preset.width ?? 0.36;
    let height = preset.height ?? 0.36;
    let isDot = preset.isDot ?? false;

    // Check parsed TikzStyle override
    if (styles && styles[styleName]) {
      const s = styles[styleName];
      const fillProp = getProperty(s.data, 'fill');
      const drawProp = getProperty(s.data, 'draw');
      const shapeProp = getProperty(s.data, 'shape');

      if (fillProp) fillColor = parsePGFColor(fillProp);
      if (drawProp) strokeColor = parsePGFColor(drawProp);
      if (shapeProp) {
        if (shapeProp === 'rectangle') shape = 'rectangle';
        else if (shapeProp === 'diamond') shape = 'diamond';
        else if (shapeProp === 'none') shape = 'none';
        else shape = 'circle';
      }
    }

    return { shape, fillColor, strokeColor, radius, width, height, isDot };
  }

  private createLabelSprite(text: string, bgColor: string): THREE.Sprite {
    if (typeof document === 'undefined') {
      const sprite = new THREE.Sprite(new THREE.SpriteMaterial({ depthTest: false }));
      sprite.scale.set(0.35, 0.35, 1);
      return sprite;
    }

    const canvas = document.createElement('canvas');
    canvas.width = 128;
    canvas.height = 128;
    const ctx = canvas.getContext('2d');

    if (ctx) {
      ctx.clearRect(0, 0, 128, 128);
      ctx.font = 'bold 56px "Times New Roman", "Cambria Math", serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';

      ctx.fillStyle = '#FFFFFF';
      if (bgColor.toLowerCase() === '#ffdc46' || bgColor.toLowerCase() === '#ffffff') {
        ctx.fillStyle = '#000000';
      }

      const cleanText = text.replace(/^\$+|\$+$/g, '').trim();
      ctx.fillText(cleanText, 64, 64);
    }

    const texture = new THREE.CanvasTexture(canvas);
    texture.minFilter = THREE.LinearFilter;
    const spriteMaterial = new THREE.SpriteMaterial({ map: texture, depthTest: false });
    const sprite = new THREE.Sprite(spriteMaterial);
    sprite.scale.set(0.35, 0.35, 1);
    return sprite;
  }
}
