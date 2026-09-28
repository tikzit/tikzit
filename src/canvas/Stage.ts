import * as THREE from 'three';
import type { GraphAST, NodeData, EdgeData, TikzStyle, Point2D } from '../core/domain/types';
import { CameraController, type CameraState } from './CameraController';
import {
  createGridMaterial,
  createGridMesh,
  updateGridUniforms,
} from './shaders/gridShader';
import { NodeRenderer } from './renderers/NodeRenderer';
import { EdgeRenderer } from './renderers/EdgeRenderer';
import { GizmoRenderer } from './renderers/GizmoRenderer';
import { Raycaster } from './input/Raycaster';
import { computeEdgeControls } from './bezier';

export interface StageOptions {
  container: HTMLElement;
  theme?: 'dark' | 'light';
  baseScale?: number;
  onCameraChange?: (state: CameraState) => void;
}

export class Stage {
  public container: HTMLElement;
  public canvas: HTMLCanvasElement;
  public renderer: THREE.WebGLRenderer;
  public scene: THREE.Scene;
  public cameraController: CameraController;
  public raycaster: Raycaster;

  private gridMaterial: THREE.ShaderMaterial;
  private gridMesh: THREE.Mesh;
  public nodeRenderer: NodeRenderer;
  public edgeRenderer: EdgeRenderer;
  public gizmoRenderer: GizmoRenderer;

  private resizeObserver: ResizeObserver | null = null;
  private isDisposed = false;
  private isContextLost = false;
  private currentTheme: 'dark' | 'light';
  public currentAST: GraphAST | null = null;
  public currentStyles?: Record<string, TikzStyle>;
  public selectedNodeIds: Set<string> = new Set();
  public selectedEdgeIds: Set<string> = new Set();

  constructor(options: StageOptions) {
    this.container = options.container;
    this.currentTheme = options.theme ?? 'dark';

    // Canvas
    let existingCanvas = this.container.querySelector('canvas#webgl-stage') as HTMLCanvasElement;
    if (!existingCanvas) {
      existingCanvas = document.createElement('canvas');
      existingCanvas.id = 'webgl-stage';
      existingCanvas.style.display = 'block';
      existingCanvas.style.width = '100%';
      existingCanvas.style.height = '100%';
      existingCanvas.style.touchAction = 'none';
      this.container.appendChild(existingCanvas);
    }
    this.canvas = existingCanvas;

    const width = this.container.clientWidth || 800;
    const height = this.container.clientHeight || 600;

    // Renderer
    this.renderer = new THREE.WebGLRenderer({
      canvas: this.canvas,
      antialias: true,
      alpha: false,
      powerPreference: 'high-performance',
    });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    this.renderer.setSize(width, height, false);
    this.renderer.setClearColor(0xffffff, 1.0);

    // Scene
    this.scene = new THREE.Scene();

    // Camera
    this.cameraController = new CameraController({
      baseScale: options.baseScale ?? 100,
      onCameraChange: (state) => {
        this.updateGrid();
        this.render();
        if (options.onCameraChange) options.onCameraChange(state);
      },
    });
    this.cameraController.setSize(width, height);
    this.cameraController.attach(this.canvas);
    this.raycaster = new Raycaster(this.cameraController);

    // Procedural Grid
    this.gridMaterial = createGridMaterial('desktop');
    this.gridMesh = createGridMesh(this.gridMaterial);
    this.scene.add(this.gridMesh);

    // Renderers & Gizmos
    this.nodeRenderer = new NodeRenderer();
    this.edgeRenderer = new EdgeRenderer();
    this.gizmoRenderer = new GizmoRenderer();

    this.scene.add(this.edgeRenderer.edgeGroup);
    this.scene.add(this.nodeRenderer.nodeGroup);
    this.scene.add(this.nodeRenderer.labelGroup);
    this.scene.add(this.gizmoRenderer.gizmoGroup);

    // WebGL Context Loss Handlers
    this.canvas.addEventListener('webglcontextlost', (e) => {
      e.preventDefault();
      this.isContextLost = true;
    });
    this.canvas.addEventListener('webglcontextrestored', () => {
      this.isContextLost = false;
      this.updateGrid();
      if (this.currentAST) {
        this.renderGraph(this.currentAST, this.currentStyles, Array.from(this.selectedNodeIds));
      }
      this.render();
    });

    // ResizeObserver
    this.resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width: w, height: h } = entry.contentRect;
        if (w > 0 && h > 0) {
          this.handleResize(w, h);
        }
      }
    });
    this.resizeObserver.observe(this.container);

    this.updateGrid();
    this.render();
  }

  public handleResize(width: number, height: number): void {
    if (this.isDisposed || this.isContextLost) return;
    this.renderer.setSize(width, height, false);
    this.cameraController.setSize(width, height);
    this.updateGrid();
    this.render();
  }

  public setTheme(theme: 'dark' | 'light'): void {
    this.currentTheme = theme;
    this.edgeRenderer.setTheme(theme);
    this.updateGrid();
    if (this.currentAST) {
      this.renderGraph(this.currentAST, this.currentStyles, {
        nodes: Array.from(this.selectedNodeIds),
        edges: Array.from(this.selectedEdgeIds),
      });
    } else {
      this.render();
    }
  }

  public updateGrid(): void {
    const width = this.canvas.width;
    const height = this.canvas.height;
    const camState = this.cameraController.getState();
    updateGridUniforms(
      this.gridMaterial,
      width,
      height,
      camState.position.x,
      camState.position.y,
      camState.pixelsPerUnit,
      'desktop'
    );
  }

  public renderGraph(
    ast: GraphAST,
    styles?: Record<string, TikzStyle>,
    selectedIds: string[] | { nodes?: string[]; edges?: string[] } = []
  ): void {
    if (this.isDisposed) return;
    this.currentAST = ast;
    this.currentStyles = styles;

    if (Array.isArray(selectedIds)) {
      const nodeIds = new Set(ast.nodes.map((n) => n.id));
      const edgeIds = new Set(ast.edges.map((e) => e.id));
      this.selectedNodeIds = new Set(selectedIds.filter((id) => nodeIds.has(id)));
      this.selectedEdgeIds = new Set(selectedIds.filter((id) => edgeIds.has(id)));
    } else if (selectedIds) {
      this.selectedNodeIds = new Set(selectedIds.nodes || []);
      this.selectedEdgeIds = new Set(selectedIds.edges || []);
    } else {
      this.selectedNodeIds = new Set();
      this.selectedEdgeIds = new Set();
    }

    this.nodeRenderer.clear();
    const nodesMap = new Map<string, NodeData>();
    for (const node of ast.nodes) {
      nodesMap.set(node.id, node);
      if (node.name) {
        nodesMap.set(node.name, node);
      }
      this.nodeRenderer.renderNode(node, styles, this.selectedNodeIds.has(node.id));
    }

    this.edgeRenderer.clear();
    this.edgeRenderer.setTheme(this.currentTheme);
    for (const edge of ast.edges) {
      this.edgeRenderer.renderEdge(edge, nodesMap, styles, this.selectedEdgeIds.has(edge.id));
    }

    // Update diagram bbox if defined
    if (ast.bbox) {
      this.gizmoRenderer.updateBBox(ast.bbox.min, ast.bbox.max, true);
    } else {
      this.gizmoRenderer.updateBBox({ x: 0, y: 0 }, { x: 0, y: 0 }, false);
    }

    this.render();
  }

  public getNodeScreenPos(nameOrId: string): Point2D | null {
    if (!this.currentAST) return null;
    const node = this.currentAST.nodes.find((n) => n.name === nameOrId || n.id === nameOrId);
    if (!node) return null;

    const screenInCanvas = this.cameraController.worldToScreen(node.position.x, node.position.y);
    const rect = this.canvas.getBoundingClientRect();
    return {
      x: rect.left + screenInCanvas.x,
      y: rect.top + screenInCanvas.y,
    };
  }

  public getEdgeHandleScreenPos(indexOrId: number | string): Point2D | null {
    if (!this.currentAST) return null;
    let edge: EdgeData | undefined;
    if (typeof indexOrId === 'number') {
      edge = this.currentAST.edges[indexOrId];
    } else {
      edge = this.currentAST.edges.find((ed) => ed.id === indexOrId);
    }
    if (!edge) return null;

    const nodesMap = new Map<string, NodeData>(this.currentAST.nodes.map((n) => [n.id, n]));
    const src = nodesMap.get(edge.sourceId);
    const targ = nodesMap.get(edge.targetId);
    if (!src || !targ) return null;

    const controls = computeEdgeControls({
      src: src.position,
      target: targ.position,
      bend: edge.bend,
      inAngle: edge.inAngle,
      outAngle: edge.outAngle,
      weight: edge.weight,
      data: edge.data,
    });

    const screenInCanvas = this.cameraController.worldToScreen(controls.mid.x, controls.mid.y);
    const rect = this.canvas.getBoundingClientRect();
    return {
      x: rect.left + screenInCanvas.x,
      y: rect.top + screenInCanvas.y,
    };
  }

  public fitToGraph(padding = 1.0): void {
    if (!this.currentAST || this.currentAST.nodes.length === 0) return;

    let minX = Infinity;
    let maxX = -Infinity;
    let minY = Infinity;
    let maxY = -Infinity;

    for (const node of this.currentAST.nodes) {
      if (node.position.x < minX) minX = node.position.x;
      if (node.position.x > maxX) maxX = node.position.x;
      if (node.position.y < minY) minY = node.position.y;
      if (node.position.y > maxY) maxY = node.position.y;
    }

    const centerX = (minX + maxX) / 2;
    const centerY = (minY + maxY) / 2;
    const graphWidth = maxX - minX + padding * 2;
    const graphHeight = maxY - minY + padding * 2;

    const canvasWidth = this.container.clientWidth || 800;
    const canvasHeight = this.container.clientHeight || 600;

    const zoomX = canvasWidth / (graphWidth * this.cameraController.baseScale);
    const zoomY = canvasHeight / (graphHeight * this.cameraController.baseScale);
    const optimalZoom = THREE.MathUtils.clamp(Math.min(zoomX, zoomY), 0.2, 3.0);

    this.cameraController.setCamera(centerX, centerY, optimalZoom);
    this.updateGrid();
    this.render();
  }

  public populateStressGraph(count: number): void {
    const cols = Math.ceil(Math.sqrt(count));
    const nodes: NodeData[] = [];
    const edges: EdgeData[] = [];

    const styles = ['Z', 'X', 'H', 'Z dot', 'X dot'];

    for (let i = 0; i < count; i++) {
      const col = i % cols;
      const row = Math.floor(i / cols);
      const id = `n_${i}`;
      const style = styles[i % styles.length];
      nodes.push({
        id,
        name: id,
        position: { x: col * 0.8 - (cols * 0.8) / 2, y: row * 0.8 - (cols * 0.8) / 2 },
        data: [{ key: 'style', value: style }],
        label: i % 5 === 0 ? `\$\\alpha_{${i}}\$` : '',
      });

      if (col > 0) {
        edges.push({
          id: `e_h_${i}`,
          sourceId: `n_${i - 1}`,
          targetId: id,
          data: [{ key: 'style', value: 'wire' }],
        });
      }
      if (row > 0) {
        edges.push({
          id: `e_v_${i}`,
          sourceId: `n_${i - cols}`,
          targetId: id,
          data: [{ key: 'style', value: 'wire' }],
        });
      }
    }

    this.renderGraph({ data: [], nodes, edges, paths: [] });
  }

  public async measureFPSDuringPanZoom(frames: number): Promise<number> {
    return new Promise((resolve) => {
      let frameCount = 0;
      const startTime = performance.now();

      const loop = () => {
        if (frameCount >= frames) {
          const elapsed = performance.now() - startTime;
          const fps = (frameCount / elapsed) * 1000;
          resolve(fps);
          return;
        }

        frameCount++;
        this.cameraController.panBy(2, 1);
        const z = 1.0 + Math.sin(frameCount * 0.1) * 0.2;
        this.cameraController.setCamera(
          this.cameraController.cameraX,
          this.cameraController.cameraY,
          z
        );
        this.render();
        requestAnimationFrame(loop);
      };

      requestAnimationFrame(loop);
    });
  }

  public render(): void {
    if (this.isDisposed || this.isContextLost) return;
    this.renderer.render(this.scene, this.cameraController.camera);
  }

  public isSceneReady(): boolean {
    return !this.isDisposed && !this.isContextLost && this.renderer !== null;
  }

  public dispose(): void {
    if (this.isDisposed) return;
    this.isDisposed = true;

    if (this.resizeObserver) {
      this.resizeObserver.disconnect();
      this.resizeObserver = null;
    }

    this.cameraController.detach();
    this.nodeRenderer.dispose();
    this.edgeRenderer.dispose();
    this.gizmoRenderer.dispose();

    this.gridMesh.geometry.dispose();
    this.gridMaterial.dispose();

    this.renderer.dispose();
  }
}
