import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import { execSync } from 'node:child_process';

describe('Sprint 20: Root Unified Makefile Verification', () => {
  const rootDir = path.resolve(__dirname, '../../../');
  const makefilePath = path.join(rootDir, 'Makefile');

  it('T20-01: test_makefile_syntax_and_phony_targets', () => {
    expect(fs.existsSync(makefilePath)).toBe(true);
    const content = fs.readFileSync(makefilePath, 'utf8');

    // Assert authored marker header
    expect(content).toContain('TikZiT Root Unified Makefile');
    expect(content).toContain('Authored, do not regenerate with qmake');

    // Assert all required .PHONY targets
    const requiredTargets = [
      'all', 'build', 'build-web', 'build-cpp', 'build-qmake', 'build-test-cpp',
      'test', 'test-web', 'test-cpp', 'test-e2e', 'verify-corpus',
      'clean', 'clean-web', 'clean-cpp', 'lint', 'check-independence'
    ];

    const phonyMatch = content.match(/\.PHONY:\s*([^\n\\]*(?:\\\n[^\n\\]*)*)/);
    expect(phonyMatch).not.toBeNull();
    const declaredTargets = phonyMatch![0].replace(/\\\n/g, ' ').split(/\s+/).slice(1);

    for (const target of requiredTargets) {
      expect(declaredTargets).toContain(target);
    }
  });

  it('T20-02: test_makefile_dry_run_syntax', () => {
    // make -n lint should succeed with exit code 0
    const output = execSync('make -n lint', { cwd: rootDir, encoding: 'utf8' });
    expect(output).toContain('npx tsc --noEmit');
  });

  it('T20-03: test_makefile_error_exit_code_propagation', () => {
    // If make is invoked with a non-existent target, it should terminate with non-zero exit code
    expect(() => {
      execSync('make non_existent_target_12345', { cwd: rootDir, stdio: 'pipe' });
    }).toThrow();
  });

  it('T20-04: test_qmake_shadow_directory_isolation', () => {
    const content = fs.readFileSync(makefilePath, 'utf8');
    // Verify qmake builds are shadowed into build-qmake and build-test
    expect(content).toContain('BUILD_DIR_QMAKE ?= build-qmake');
    expect(content).toContain('BUILD_DIR_TEST ?= build-test');
    expect(content).toContain('cd $(BUILD_DIR_QMAKE) && $(QMAKE)');
    expect(content).toContain('cd $(BUILD_DIR_TEST) && $(QMAKE)');
  });

  it('T20-04b: test_native_test_binary_route', () => {
    const content = fs.readFileSync(makefilePath, 'utf8');
    // UnitTests binary must resolve from BUILD_DIR_TEST, not CMake build/
    expect(content).toContain('UNITTESTS ?= $(BUILD_DIR_TEST)/UnitTests');
    expect(content).toContain('test-cpp: build-test-cpp');
  });
});
