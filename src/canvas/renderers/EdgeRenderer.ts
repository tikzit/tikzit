import * as THREE from 'three';
import type { EdgeData, NodeData, TikzStyle, Point2D } from '../../core/domain/types';
import { getProperty, hasAtom, hasProperty } from '../../core/domain/types';
import {
  computeEdgeControls,
  evaluateCubicBezier,
} from '../bezier';

export class EdgeRenderer {
  public edgeGroup: THREE.Group;

  private edgeLines: Map<string, THREE.Object3D> = new Map();
  private arrowheads: Map<string, THREE.Mesh[]> = new Map();
  private currentTheme: 'dark' | 'light' = 'dark';

  // Unit arrowhead geometry pointing in +X direction (0 angle)
  private arrowGeom: THREE.BufferGeometry;

  constructor() {
    this.edgeGroup = new THREE.Group();
    this.edgeGroup.position.z = 0;

    // Stealth / triangular arrowhead pointing along +X
    // Tip at (0, 0), wings at (-0.14, 0.06) and (-0.14, -0.06), base notch at (-0.10, 0)
    const arrowVertices = new Float32Array([
      0, 0, 0,
      -0.14, 0.06, 0,
      -0.10, 0, 0,

      0, 0, 0,
      -0.10, 0, 0,
      -0.14, -0.06, 0,
    ]);
    this.arrowGeom = new THREE.BufferGeometry();
    this.arrowGeom.setAttribute('position', new THREE.BufferAttribute(arrowVertices, 3));
  }

  public setTheme(theme: 'dark' | 'light'): void {
    this.currentTheme = theme;
  }

  public renderEdge(
    edge: EdgeData,
    nodesMap: Map<string, NodeData>,
    styles?: Record<string, TikzStyle>,
    isSelected = false
  ): void {
    this.removeEdge(edge.id);

    const srcNode = nodesMap.get(edge.sourceId);
    const targetNode = nodesMap.get(edge.targetId);
    if (!srcNode || !targetNode) return;

    const styleName = getProperty(edge.data, 'style') ?? '';
    const styleObj = styles ? styles[styleName] : undefined;

    // Parse edge attributes
    const isDashed =
      hasAtom(edge.data, 'dashed') ||
      hasProperty(edge.data, 'dashed') ||
      (styleObj && hasAtom(styleObj.data, 'dashed'));

    const isDotted =
      hasAtom(edge.data, 'dotted') ||
      hasProperty(edge.data, 'dotted') ||
      (styleObj && hasAtom(styleObj.data, 'dotted'));

    const isDirected =
      styleName === 'diredge' ||
      hasAtom(edge.data, '->') ||
      hasProperty(edge.data, '->') ||
      (styleObj && hasAtom(styleObj.data, '->'));

    const srcStyle = getProperty(srcNode.data, 'style');
    const targetStyle = getProperty(targetNode.data, 'style');

    const controls = computeEdgeControls({
      src: srcNode.position,
      target: targetNode.position,
      sourceId: edge.sourceId,
      targetId: edge.targetId,
      srcStyle,
      targetStyle,
      bend: edge.bend,
      inAngle: edge.inAngle,
      outAngle: edge.outAngle,
      weight: edge.weight,
      data: edge.data,
    });

    // Desktop TikZiT Parity (style.cpp:51-77, 170-172):
    // Edges default to solid black (#000000) with bold 2.0px stroke
    let strokeColorHex: number;
    if (isSelected) {
      strokeColorHex = 0x388bfd;
    } else {
      const explicitDraw =
        getProperty(edge.data, 'draw') ||
        (styleObj ? getProperty(styleObj.data, 'draw') : undefined);
      if (explicitDraw && explicitDraw !== 'none') {
        try {
          strokeColorHex = new THREE.Color(explicitDraw).getHex();
        } catch {
          strokeColorHex = 0x000000;
        }
      } else {
        // Desktop TikZiT Parity (style.cpp:51-77): unstyled edges always solid black (#000000) on white paper
        strokeColorHex = 0x000000;
      }
    }

    // Sample cubic Bézier (32 segments)
    const segments = 32;
    const sampledPoints: Point2D[] = [];
    for (let i = 0; i <= segments; i++) {
      const t = i / segments;
      sampledPoints.push(
        evaluateCubicBezier(t, controls.tail, controls.cp1, controls.cp2, controls.head)
      );
    }

    if (isDashed || isDotted) {
      const points = sampledPoints.map((pt) => new THREE.Vector3(pt.x, pt.y, 0));
      const geometry = new THREE.BufferGeometry().setFromPoints(points);
      const material = new THREE.LineDashedMaterial({
        color: strokeColorHex,
        dashSize: isDotted ? 0.03 : 0.08,
        gapSize: isDotted ? 0.04 : 0.06,
        linewidth: isSelected ? 2.5 : 1.5,
      });
      const line = new THREE.Line(geometry, material);
      line.computeLineDistances();
      this.edgeGroup.add(line);
      this.edgeLines.set(edge.id, line);
    } else {
      // Bold solid ribbon mesh (>= 2px visual stroke width, immune to WebGL 1px hairline limit)
      const halfWidth = isSelected ? 0.035 : 0.025;
      const ribbonVerts: number[] = [];
      for (let i = 0; i < segments; i++) {
        const p0 = sampledPoints[i];
        const p1 = sampledPoints[i + 1];
        const dx = p1.x - p0.x;
        const dy = p1.y - p0.y;
        const len = Math.hypot(dx, dy) || 1e-4;
        const nx = (-dy / len) * halfWidth;
        const ny = (dx / len) * halfWidth;

        const p0L = [p0.x + nx, p0.y + ny, 0];
        const p0R = [p0.x - nx, p0.y - ny, 0];
        const p1L = [p1.x + nx, p1.y + ny, 0];
        const p1R = [p1.x - nx, p1.y - ny, 0];

        ribbonVerts.push(
          p0L[0], p0L[1], 0,
          p0R[0], p0R[1], 0,
          p1L[0], p1L[1], 0,

          p0R[0], p0R[1], 0,
          p1R[0], p1R[1], 0,
          p1L[0], p1L[1], 0
        );
      }

      const geometry = new THREE.BufferGeometry();
      geometry.setAttribute('position', new THREE.BufferAttribute(new Float32Array(ribbonVerts), 3));
      const material = new THREE.MeshBasicMaterial({
        color: strokeColorHex,
        side: THREE.DoubleSide,
      });
      const ribbonMesh = new THREE.Mesh(geometry, material);
      this.edgeGroup.add(ribbonMesh);
      this.edgeLines.set(edge.id, ribbonMesh);
    }

    // Arrowhead at head
    const arrows: THREE.Mesh[] = [];
    if (isDirected) {
      const arrowMat = new THREE.MeshBasicMaterial({
        color: strokeColorHex,
        side: THREE.DoubleSide,
      });
      const arrowMesh = new THREE.Mesh(this.arrowGeom, arrowMat);
      arrowMesh.position.set(controls.head.x, controls.head.y, 1);
      arrowMesh.rotation.z = controls.headTangent;
      this.edgeGroup.add(arrowMesh);
      arrows.push(arrowMesh);
    }

    if (arrows.length > 0) {
      this.arrowheads.set(edge.id, arrows);
    }
  }

  public removeEdge(id: string): void {
    const line = this.edgeLines.get(id);
    if (line) {
      this.edgeGroup.remove(line);
      if ('geometry' in line && line.geometry) {
        (line.geometry as THREE.BufferGeometry).dispose();
      }
      if ('material' in line && line.material) {
        const mat = line.material;
        if (Array.isArray(mat)) mat.forEach((m) => m.dispose());
        else (mat as THREE.Material).dispose();
      }
      this.edgeLines.delete(id);
    }

    const arrows = this.arrowheads.get(id);
    if (arrows) {
      for (const arrow of arrows) {
        this.edgeGroup.remove(arrow);
        if (Array.isArray(arrow.material)) arrow.material.forEach((m) => m.dispose());
        else arrow.material.dispose();
      }
      this.arrowheads.delete(id);
    }
  }

  public clear(): void {
    const ids = Array.from(this.edgeLines.keys());
    for (const id of ids) {
      this.removeEdge(id);
    }
  }

  public dispose(): void {
    this.clear();
    this.arrowGeom.dispose();
  }
}
