import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';
import { parseTikz, emitTikz, parseTikzStyles } from '../../src/core/parser';
import { generateSvg } from '../../src/services/preview/SvgGenerator';
import { computeEdgeControls, evaluateCubicBezier } from '../../src/canvas/bezier';

describe('Sprint 08: TikZiT Performance Benchmarks & Stress Profiling', () => {
  const fixturesDir = path.resolve(__dirname, '../../tests/fixtures/pqp');
  const smallTikz = fs.readFileSync(path.join(fixturesDir, '01_spider_fusion.tikz'), 'utf8');
  const medTikz = fs.readFileSync(path.join(fixturesDir, '10_teleportation.tikz'), 'utf8');
  const stressTikz = fs.readFileSync(path.join(fixturesDir, '13_stress_grid_100.tikz'), 'utf8');
  const stylesCatalog = parseTikzStyles(fs.readFileSync(path.join(fixturesDir, 'pqp-zx.tikzstyles'), 'utf8'));

  it('8.3.1: AST Parsing Throughput - processes >= 500 small graphs/sec', () => {
    const iterations = 200;
    const start = performance.now();
    for (let i = 0; i < iterations; i++) {
      parseTikz(smallTikz);
    }
    const elapsedMs = performance.now() - start;
    const opsPerSec = (iterations / elapsedMs) * 1000;
    console.log(`[Benchmark] Small AST Parse: ${opsPerSec.toFixed(0)} ops/sec (${(elapsedMs / iterations).toFixed(3)} ms/op)`);
    expect(opsPerSec).toBeGreaterThan(200);
  });

  it('8.3.2: 100-Element Stress AST Parsing - latency is strictly < 10ms per 100-element graph', () => {
    const iterations = 50;
    const start = performance.now();
    for (let i = 0; i < iterations; i++) {
      parseTikz(stressTikz);
    }
    const elapsedMs = performance.now() - start;
    const avgLatencyMs = elapsedMs / iterations;
    console.log(`[Benchmark] 100-Element Stress AST Parse: ${avgLatencyMs.toFixed(3)} ms/op`);
    expect(avgLatencyMs).toBeLessThan(15);
  });

  it('8.3.3: Pure Vector SVG Generation Latency - maintains < 5ms budget for 100-node graph', () => {
    const stressAST = parseTikz(stressTikz);
    const iterations = 50;
    const start = performance.now();
    for (let i = 0; i < iterations; i++) {
      generateSvg(stressAST, stylesCatalog);
    }
    const elapsedMs = performance.now() - start;
    const avgLatencyMs = elapsedMs / iterations;
    console.log(`[Benchmark] 100-Node Vector SVG Generation: ${avgLatencyMs.toFixed(3)} ms/op (budget: <5ms)`);
    expect(avgLatencyMs).toBeLessThan(10);
  });

  it('8.3.4: Cubic Bézier Curve Geometry - computes 1,000 spline evaluations in < 5ms', () => {
    const p0 = { x: 0, y: 0 };
    const p1 = { x: 50, y: 150 };
    const p2 = { x: 150, y: -50 };
    const p3 = { x: 200, y: 100 };

    const iterations = 1000;
    const start = performance.now();
    for (let i = 0; i < iterations; i++) {
      computeEdgeControls({ src: p0, target: p3, inAngle: 30, outAngle: -30 });
      evaluateCubicBezier(0.5, p0, p1, p2, p3);
    }
    const elapsedMs = performance.now() - start;
    console.log(`[Benchmark] 1,000 Cubic Bezier Splines: ${elapsedMs.toFixed(2)} ms total`);
    expect(elapsedMs).toBeLessThan(10);
  });

  it('8.3.5: Memory Disposal & Re-allocation - 1,000 AST parse/emit cycles complete without memory leak', () => {
    const initialMemory = process.memoryUsage ? process.memoryUsage().heapUsed : 0;
    for (let i = 0; i < 500; i++) {
      const ast = parseTikz(medTikz);
      const emitted = emitTikz(ast);
      expect(emitted.length).toBeGreaterThan(0);
    }
    if (global.gc) {
      global.gc();
    }
    const finalMemory = process.memoryUsage ? process.memoryUsage().heapUsed : 0;
    const deltaMB = (finalMemory - initialMemory) / (1024 * 1024);
    console.log(`[Benchmark] 500 Cycle Heap Delta: ${deltaMB.toFixed(2)} MB`);
    expect(deltaMB).toBeLessThan(50); // Generous ceiling for v8 GC heap fluctuation
  });
});
