import * as THREE from 'three';
import type { Point2D } from './bezier';

export interface CameraState {
  position: Point2D;
  zoom: number;
  pixelsPerUnit: number;
}

export interface CameraControllerOptions {
  baseScale?: number;      // Base pixels per TikZ unit (default 50)
  minZoom?: number;        // Minimum zoom (default 0.1 = 10%)
  maxZoom?: number;        // Maximum zoom (default 50.0 = 5000%)
  onCameraChange?: (state: CameraState) => void;
}

export class CameraController {
  public camera: THREE.OrthographicCamera;
  public cameraX = 0;
  public cameraY = 0;
  public zoom = 1.0;
  public baseScale: number;
  public minZoom: number;
  public maxZoom: number;

  private width = 800;
  private height = 600;
  private isPanning = false;
  private panStartScreen: Point2D = { x: 0, y: 0 };
  private panStartCamera: Point2D = { x: 0, y: 0 };
  private spacePressed = false;
  private container: HTMLElement | null = null;
  private onCameraChange?: (state: CameraState) => void;

  // Bound event listeners for cleanup
  private onMouseDownBound: (e: MouseEvent) => void;
  private onMouseMoveBound: (e: MouseEvent) => void;
  private onMouseUpBound: (e: MouseEvent) => void;
  private onWheelBound: (e: WheelEvent) => void;
  private onKeyDownBound: (e: KeyboardEvent) => void;
  private onKeyUpBound: (e: KeyboardEvent) => void;
  private onContextMenuBound: (e: MouseEvent) => void;

  constructor(options: CameraControllerOptions = {}) {
    this.baseScale = options.baseScale ?? 50;
    this.minZoom = options.minZoom ?? 0.1;
    this.maxZoom = options.maxZoom ?? 50.0;
    this.onCameraChange = options.onCameraChange;

    this.camera = new THREE.OrthographicCamera(-400, 400, 300, -300, 0.1, 1000);
    this.camera.position.set(0, 0, 100);
    this.camera.lookAt(0, 0, 0);

    this.onMouseDownBound = this.handleMouseDown.bind(this);
    this.onMouseMoveBound = this.handleMouseMove.bind(this);
    this.onMouseUpBound = this.handleMouseUp.bind(this);
    this.onWheelBound = this.handleWheel.bind(this);
    this.onKeyDownBound = this.handleKeyDown.bind(this);
    this.onKeyUpBound = this.handleKeyUp.bind(this);
    this.onContextMenuBound = (e) => {
      if (this.isPanning) e.preventDefault();
    };
  }

  public attach(container: HTMLElement): void {
    this.container = container;
    this.width = container.clientWidth || 800;
    this.height = container.clientHeight || 600;
    this.updateProjection();

    container.addEventListener('mousedown', this.onMouseDownBound);
    window.addEventListener('mousemove', this.onMouseMoveBound);
    window.addEventListener('mouseup', this.onMouseUpBound);
    container.addEventListener('wheel', this.onWheelBound, { passive: false });
    window.addEventListener('keydown', this.onKeyDownBound);
    window.addEventListener('keyup', this.onKeyUpBound);
    container.addEventListener('contextmenu', this.onContextMenuBound);
  }

  public detach(): void {
    if (this.container) {
      this.container.removeEventListener('mousedown', this.onMouseDownBound);
      this.container.removeEventListener('wheel', this.onWheelBound);
      this.container.removeEventListener('contextmenu', this.onContextMenuBound);
    }
    window.removeEventListener('mousemove', this.onMouseMoveBound);
    window.removeEventListener('mouseup', this.onMouseUpBound);
    window.removeEventListener('keydown', this.onKeyDownBound);
    window.removeEventListener('keyup', this.onKeyUpBound);
    this.container = null;
  }

  public resize(width: number, height: number): void {
    this.setSize(width, height);
  }

  public setSize(width: number, height: number): void {
    this.width = width;
    this.height = height;
    this.updateProjection();
  }

  public setCamera(x: number, y: number, zoom?: number): void {
    this.cameraX = x;
    this.cameraY = y;
    if (zoom !== undefined) {
      this.zoom = THREE.MathUtils.clamp(zoom, this.minZoom, this.maxZoom);
    }
    this.updateProjection();
    this.notifyChange();
  }

  public getState(): CameraState {
    return {
      position: { x: this.cameraX, y: this.cameraY },
      zoom: this.zoom,
      pixelsPerUnit: this.baseScale * this.zoom,
    };
  }

  public screenToWorld(screenX: number, screenY: number): Point2D {
    const effectiveScale = this.baseScale * this.zoom;
    return {
      x: this.cameraX + (screenX - this.width / 2) / effectiveScale,
      y: this.cameraY + (this.height / 2 - screenY) / effectiveScale,
    };
  }

  public worldToScreen(worldX: number, worldY: number): Point2D {
    const effectiveScale = this.baseScale * this.zoom;
    return {
      x: this.width / 2 + (worldX - this.cameraX) * effectiveScale,
      y: this.height / 2 - (worldY - this.cameraY) * effectiveScale,
    };
  }

  public zoomAt(screenX: number, screenY: number, delta: number): void {
    const effectiveScale = this.baseScale * this.zoom;
    const worldBefore = this.screenToWorld(screenX, screenY);

    const zoomFactor = Math.exp(-delta * 0.002);
    const newZoom = THREE.MathUtils.clamp(this.zoom * zoomFactor, this.minZoom, this.maxZoom);
    this.zoom = newZoom;

    const newEffectiveScale = this.baseScale * this.zoom;
    this.cameraX = worldBefore.x - (screenX - this.width / 2) / newEffectiveScale;
    this.cameraY = worldBefore.y - (this.height / 2 - screenY) / newEffectiveScale;

    this.updateProjection();
    this.notifyChange();
  }

  public panBy(deltaScreenX: number, deltaScreenY: number): void {
    const effectiveScale = this.baseScale * this.zoom;
    this.cameraX -= deltaScreenX / effectiveScale;
    this.cameraY += deltaScreenY / effectiveScale;
    this.updateProjection();
    this.notifyChange();
  }

  private updateProjection(): void {
    const effectiveScale = this.baseScale * this.zoom;
    const halfW = (this.width / 2) / effectiveScale;
    const halfH = (this.height / 2) / effectiveScale;

    this.camera.left = -halfW;
    this.camera.right = halfW;
    this.camera.top = halfH;
    this.camera.bottom = -halfH;
    this.camera.position.set(this.cameraX, this.cameraY, 100);
    this.camera.lookAt(this.cameraX, this.cameraY, 0);
    this.camera.updateProjectionMatrix();
  }

  private notifyChange(): void {
    if (this.onCameraChange) {
      this.onCameraChange(this.getState());
    }
  }

  private handleMouseDown(e: MouseEvent): void {
    const isMiddle = e.button === 1;
    const isLeftWithSpace = e.button === 0 && this.spacePressed;

    if (isMiddle || isLeftWithSpace) {
      this.isPanning = true;
      this.panStartScreen = { x: e.clientX, y: e.clientY };
      this.panStartCamera = { x: this.cameraX, y: this.cameraY };
      e.preventDefault();
    }
  }

  private handleMouseMove(e: MouseEvent): void {
    if (!this.isPanning) return;
    const dx = e.clientX - this.panStartScreen.x;
    const dy = e.clientY - this.panStartScreen.y;
    const effectiveScale = this.baseScale * this.zoom;

    this.cameraX = this.panStartCamera.x - dx / effectiveScale;
    this.cameraY = this.panStartCamera.y + dy / effectiveScale;
    this.updateProjection();
    this.notifyChange();
  }

  private handleMouseUp(e: MouseEvent): void {
    if (this.isPanning) {
      this.isPanning = false;
    }
  }

  private handleWheel(e: WheelEvent): void {
    e.preventDefault();
    const rect = this.container?.getBoundingClientRect() ?? { left: 0, top: 0 };
    const screenX = e.clientX - rect.left;
    const screenY = e.clientY - rect.top;
    this.zoomAt(screenX, screenY, e.deltaY);
  }

  private handleKeyDown(e: KeyboardEvent): void {
    if (e.code === 'Space' && !this.spacePressed) {
      // Ignore if typing in input
      const tag = (e.target as HTMLElement)?.tagName?.toLowerCase();
      if (tag === 'input' || tag === 'textarea' || (e.target as HTMLElement)?.isContentEditable) {
        return;
      }
      this.spacePressed = true;
    }
  }

  private handleKeyUp(e: KeyboardEvent): void {
    if (e.code === 'Space') {
      this.spacePressed = false;
      this.isPanning = false;
    }
  }
}
