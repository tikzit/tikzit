import { describe, it, expect } from 'vitest';
import * as THREE from 'three';
import { GRID_THEMES, createGridMaterial } from '../../../src/canvas/shaders/gridShader';
import { computeEdgeControls } from '../../../src/canvas/bezier';
import { emitTikz } from '../../../src/core/parser/emitter';
import type { GraphAST, NodeData, EdgeData } from '../../../src/core/domain/types';

describe('Sprint 10: Canvas Stage Visual Parity & Teardrop Self-Loop Engine', () => {
  describe('10.1: Grid Shader Calibration', () => {
    it('calibrates desktop grid theme to exact C++ TikzView hex codes', () => {
      const desktop = GRID_THEMES.desktop;
      expect(desktop).toBeDefined();

      // Background: pure white paper canvas (#FFFFFF, tikzview.cpp:32)
      expect(desktop.bg.getHexString().toLowerCase()).toBe('ffffff');

      // Minor grid: QColor(250, 250, 255) -> #FAFAFF
      expect(desktop.minor.getHexString().toLowerCase()).toBe('fafaff');

      // Major grid: QColor(240, 240, 250) -> #F0F0FA
      expect(desktop.major.getHexString().toLowerCase()).toBe('f0f0fa');

      // Coordinate axes: QColor(220, 220, 240) -> #DCDCF0
      expect(desktop.axis.getHexString().toLowerCase()).toBe('dcdcf0');
    });

    it('creates grid material defaulting to desktop paper canvas and 100 px/unit zoom', () => {
      const mat = createGridMaterial('desktop');
      expect(mat.uniforms.uZoom.value).toBe(100.0);
      expect(mat.uniforms.uBgColor.value.getHexString().toLowerCase()).toBe('ffffff');
      expect(mat.uniforms.uAxisColor.value.getHexString().toLowerCase()).toBe('dcdcf0');
    });
  });

  describe('10.2: Teardrop Self-Loop Mathematical Geometry', () => {
    it('evaluates self-loops strictly by node identity (sourceId === targetId)', () => {
      const p1 = { x: 2.0, y: 3.0 };
      const p2 = { x: 2.0, y: 3.0 }; // Coincident coordinates

      // Different node IDs -> NOT a self-loop
      const controlsDiff = computeEdgeControls({
        src: p1,
        target: p2,
        sourceId: 'node_A',
        targetId: 'node_B',
      });
      expect(controlsDiff.isSelfLoop).toBe(false);

      // Same node ID -> self-loop
      const controlsSame = computeEdgeControls({
        src: p1,
        target: p2,
        sourceId: 'node_A',
        targetId: 'node_A',
      });
      expect(controlsSame.isSelfLoop).toBe(true);
    });

    it('computes upward teardrop angles and control points (in=135, out=45, weight=1.0)', () => {
      const center = { x: 0.0, y: 0.0 };
      const controls = computeEdgeControls({
        src: center,
        target: center,
        sourceId: 'v0',
        targetId: 'v0',
      });

      expect(controls.isSelfLoop).toBe(true);
      expect(controls.outAngle).toBe(45);
      expect(controls.inAngle).toBe(135);
      expect(controls.cpDist).toBe(1.0);

      // cp1 = src + 1.0 * (cos 45, sin 45) -> ~ (0.707, 0.707)
      const cos45 = Math.cos((45 * Math.PI) / 180);
      const sin45 = Math.sin((45 * Math.PI) / 180);
      expect(controls.cp1.x).toBeCloseTo(cos45, 4);
      expect(controls.cp1.y).toBeCloseTo(sin45, 4);

      // cp2 = target + 1.0 * (cos 135, sin 135) -> ~ (-0.707, 0.707)
      const cos135 = Math.cos((135 * Math.PI) / 180);
      const sin135 = Math.sin((135 * Math.PI) / 180);
      expect(controls.cp2.x).toBeCloseTo(cos135, 4);
      expect(controls.cp2.y).toBeCloseTo(sin135, 4);

      // Vertex apex midpoint at t=0.5 should be purely positive Y
      expect(controls.mid.y).toBeGreaterThan(0.5);
      expect(controls.mid.x).toBeCloseTo(0.0, 4);
    });
  });

  describe('10.3: AST Self-Loop TikZ Normalization', () => {
    it('normalizes unstyled self-loop omitting style=none with empty target ()', () => {
      const ast: GraphAST = {
        data: [],
        paths: [],
        nodes: [
          { id: 'v0', name: 'v0', label: '', position: { x: 0, y: 0 }, data: [{ key: 'style', value: 'none' }] },
        ],
        edges: [
          {
            id: 'e0',
            sourceId: 'v0',
            targetId: 'v0',
            data: [
              { key: 'style', value: 'none' },
              { key: 'in', value: '135' },
              { key: 'out', value: '45' },
              { key: 'loop' },
            ],
            inAngle: 135,
            outAngle: 45,
            weight: 1.0,
          },
        ],
      };

      const emitted = emitTikz(ast);
      // Canonical format: \draw [in=135, out=45, loop] (v0) to ();
      expect(emitted).toContain('\\draw [in=135, out=45, loop] (v0) to ();');
      expect(emitted).not.toContain('\\draw [style=none');
    });

    it('preserves non-none styles in canonical order [style=<name>, in=135, out=45, loop]', () => {
      const ast: GraphAST = {
        data: [],
        paths: [],
        nodes: [
          { id: 'u', name: 'u', label: '1', position: { x: 1, y: 1 }, data: [] },
        ],
        edges: [
          {
            id: 'e1',
            sourceId: 'u',
            targetId: 'u',
            data: [
              { key: 'style', value: 'green wire' },
              { key: 'in', value: '135' },
              { key: 'out', value: '45' },
              { key: 'loop' },
            ],
            inAngle: 135,
            outAngle: 45,
            weight: 1.0,
          },
        ],
      };

      const emitted = emitTikz(ast);
      expect(emitted).toContain('\\draw [style=green wire, in=135, out=45, loop] (u) to ();');
    });
  });
});
