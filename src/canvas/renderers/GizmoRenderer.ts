import * as THREE from 'three';
import type { Point2D } from '../../core/domain/types';

export class GizmoRenderer {
  public gizmoGroup: THREE.Group;

  // Marquee
  private marqueeMesh: THREE.Mesh;
  private marqueeBorder: THREE.LineLoop;
  private marqueeMaterial: THREE.MeshBasicMaterial;
  private marqueeBorderMat: THREE.LineBasicMaterial;

  // Rubberband wire
  private rubberbandLine: THREE.Line;
  private rubberbandGeom: THREE.BufferGeometry;
  private rubberbandMat: THREE.LineDashedMaterial;

  // Curvature handle
  private handleMesh: THREE.Mesh;
  private handleBorder: THREE.LineLoop;
  private handleMat: THREE.MeshBasicMaterial;

  // Diagram Bounding Box
  private bboxLine: THREE.LineLoop;
  private bboxGeom: THREE.BufferGeometry;
  private bboxMat: THREE.LineDashedMaterial;

  // Vertex Placement Reticle (Ghost Preview)
  private reticleMesh: THREE.LineLoop;
  private reticleGeom: THREE.BufferGeometry;
  private reticleMat: THREE.LineDashedMaterial;

  constructor() {
    this.gizmoGroup = new THREE.Group();
    this.gizmoGroup.position.z = 30;

    // 1. Marquee
    const unitQuad = new THREE.PlaneGeometry(1, 1);
    this.marqueeMaterial = new THREE.MeshBasicMaterial({
      color: 0x388bfd,
      transparent: true,
      opacity: 0.15,
      depthTest: false,
      side: THREE.DoubleSide,
    });
    this.marqueeMesh = new THREE.Mesh(unitQuad, this.marqueeMaterial);
    this.marqueeMesh.visible = false;
    this.gizmoGroup.add(this.marqueeMesh);

    const quadPoints = [
      new THREE.Vector3(-0.5, -0.5, 0),
      new THREE.Vector3(0.5, -0.5, 0),
      new THREE.Vector3(0.5, 0.5, 0),
      new THREE.Vector3(-0.5, 0.5, 0),
    ];
    const quadBorderGeom = new THREE.BufferGeometry().setFromPoints(quadPoints);
    this.marqueeBorderMat = new THREE.LineBasicMaterial({
      color: 0x388bfd,
      linewidth: 1.5,
      depthTest: false,
    });
    this.marqueeBorder = new THREE.LineLoop(quadBorderGeom, this.marqueeBorderMat);
    this.marqueeBorder.visible = false;
    this.gizmoGroup.add(this.marqueeBorder);

    // 2. Rubberband Wire
    this.rubberbandGeom = new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(0, 0, 0),
      new THREE.Vector3(0, 0, 0),
    ]);
    // Desktop TikZiT Parity (tikzscene.cpp:51-54): Vibrant purple preview wire
    this.rubberbandMat = new THREE.LineDashedMaterial({
      color: 0xa855f7,
      dashSize: 0.1,
      gapSize: 0.04,
      linewidth: 2,
      depthTest: false,
    });
    this.rubberbandLine = new THREE.Line(this.rubberbandGeom, this.rubberbandMat);
    this.rubberbandLine.visible = false;
    this.gizmoGroup.add(this.rubberbandLine);

    // 3. Curvature Handle
    const handleCircle = new THREE.CircleGeometry(0.08, 16);
    this.handleMat = new THREE.MeshBasicMaterial({
      color: 0xeab308,
      depthTest: false,
    });
    this.handleMesh = new THREE.Mesh(handleCircle, this.handleMat);
    this.handleMesh.visible = false;
    this.gizmoGroup.add(this.handleMesh);

    const handleBorderGeom = new THREE.BufferGeometry().setFromPoints(
      Array.from({ length: 17 }, (_, i) => {
        const theta = (i / 16) * Math.PI * 2;
        return new THREE.Vector3(Math.cos(theta) * 0.08, Math.sin(theta) * 0.08, 0);
      })
    );
    this.handleBorder = new THREE.LineLoop(
      handleBorderGeom,
      new THREE.LineBasicMaterial({ color: 0x000000, linewidth: 1.5, depthTest: false })
    );
    this.handleBorder.visible = false;
    this.gizmoGroup.add(this.handleBorder);

    // 4. Bounding Box
    this.bboxGeom = new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(0, 0, 0),
      new THREE.Vector3(0, 0, 0),
      new THREE.Vector3(0, 0, 0),
      new THREE.Vector3(0, 0, 0),
    ]);
    this.bboxMat = new THREE.LineDashedMaterial({
      color: 0x8b949e,
      dashSize: 0.15,
      gapSize: 0.1,
      linewidth: 1.5,
      depthTest: false,
    });
    this.bboxLine = new THREE.LineLoop(this.bboxGeom, this.bboxMat);
    this.bboxLine.visible = false;
    this.gizmoGroup.add(this.bboxLine);

    // 5. Vertex Placement Reticle
    const reticlePoints = Array.from({ length: 17 }, (_, i) => {
      const theta = (i / 16) * Math.PI * 2;
      return new THREE.Vector3(Math.cos(theta) * 0.18, Math.sin(theta) * 0.18, 0);
    });
    this.reticleGeom = new THREE.BufferGeometry().setFromPoints(reticlePoints);
    this.reticleMat = new THREE.LineDashedMaterial({
      color: 0x10b981,
      dashSize: 0.04,
      gapSize: 0.03,
      linewidth: 1.5,
      depthTest: false,
    });
    this.reticleMesh = new THREE.LineLoop(this.reticleGeom, this.reticleMat);
    this.reticleMesh.visible = false;
    this.gizmoGroup.add(this.reticleMesh);
  }

  public updateMarquee(p1: Point2D, p2: Point2D, visible: boolean): void {
    this.marqueeMesh.visible = visible;
    this.marqueeBorder.visible = visible;
    if (!visible) return;

    const minX = Math.min(p1.x, p2.x);
    const maxX = Math.max(p1.x, p2.x);
    const minY = Math.min(p1.y, p2.y);
    const maxY = Math.max(p1.y, p2.y);

    const width = Math.max(maxX - minX, 0.01);
    const height = Math.max(maxY - minY, 0.01);
    const cx = (minX + maxX) / 2;
    const cy = (minY + maxY) / 2;

    this.marqueeMesh.position.set(cx, cy, 0);
    this.marqueeMesh.scale.set(width, height, 1);

    this.marqueeBorder.position.set(cx, cy, 0);
    this.marqueeBorder.scale.set(width, height, 1);
  }

  public updateRubberband(from: Point2D, to: Point2D, visible: boolean): void {
    this.rubberbandLine.visible = visible;
    if (!visible) return;

    const positions = new Float32Array([
      from.x, from.y, 0,
      to.x, to.y, 0,
    ]);
    this.rubberbandGeom.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    this.rubberbandLine.computeLineDistances();
  }

  public updateCurvatureHandle(midpoint: Point2D, visible: boolean): void {
    this.handleMesh.visible = visible;
    this.handleBorder.visible = visible;
    if (!visible) return;

    this.handleMesh.position.set(midpoint.x, midpoint.y, 1);
    this.handleBorder.position.set(midpoint.x, midpoint.y, 1);
  }

  public updateReticle(pos: Point2D, visible: boolean): void {
    this.reticleMesh.visible = visible;
    if (!visible) return;
    this.reticleMesh.position.set(pos.x, pos.y, 1);
    this.reticleMesh.computeLineDistances();
  }

  public updateBBox(min: Point2D, max: Point2D, visible: boolean): void {
    this.bboxLine.visible = visible;
    if (!visible) return;

    const minX = Math.min(min.x, max.x);
    const maxX = Math.max(min.x, max.x);
    const minY = Math.min(min.y, max.y);
    const maxY = Math.max(min.y, max.y);

    const points = [
      new THREE.Vector3(minX, minY, 0),
      new THREE.Vector3(maxX, minY, 0),
      new THREE.Vector3(maxX, maxY, 0),
      new THREE.Vector3(minX, maxY, 0),
    ];
    this.bboxGeom.setFromPoints(points);
    this.bboxLine.computeLineDistances();
  }

  public dispose(): void {
    this.marqueeMesh.geometry.dispose();
    this.marqueeMaterial.dispose();
    this.marqueeBorder.geometry.dispose();
    this.marqueeBorderMat.dispose();

    this.rubberbandGeom.dispose();
    this.rubberbandMat.dispose();

    this.handleMesh.geometry.dispose();
    this.handleMat.dispose();
    this.handleBorder.geometry.dispose();

    this.bboxGeom.dispose();
    this.bboxMat.dispose();

    this.reticleGeom.dispose();
    this.reticleMat.dispose();
  }
}
