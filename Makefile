# TikZiT Root Unified Makefile
# Bridges Native Qt6/C++ (CMake/Ninja) and Web Spatial Workbench (Astro/Vite/TS)
# Authored, do not regenerate with qmake

SHELL := /bin/bash
.DEFAULT_GOAL := all

# Build directories
BUILD_DIR_CPP ?= build          # CMake app build (tikzit binary only — no test target exists)
BUILD_DIR_TEST ?= build-test    # qmake testcase build (UnitTests) — matches `npm run test:native`
BUILD_DIR_QMAKE ?= build-qmake  # qmake app build, kept shadowed so `qmake` never clobbers this Makefile
DIST_DIR_WEB ?= dist

QMAKE ?= qmake
UNITTESTS ?= $(BUILD_DIR_TEST)/UnitTests.app/Contents/MacOS/UnitTests

.PHONY: all build build-web build-cpp build-qmake build-test-cpp \
        test test-web test-cpp test-e2e verify-corpus clean clean-web clean-cpp lint check-independence check-conformance

all: build test

## --- Build Targets ---

build: build-web build-cpp

build-web:
	npm run build

build-cpp:
	@command -v cmake >/dev/null 2>&1 || { echo "SKIP: cmake/Qt toolchain not installed"; exit 0; }
	cmake -B $(BUILD_DIR_CPP) -S . -GNinja -DCMAKE_BUILD_TYPE=Release
	cmake --build $(BUILD_DIR_CPP)

build-qmake:
	@mkdir -p $(BUILD_DIR_QMAKE)
	cd $(BUILD_DIR_QMAKE) && $(QMAKE) ../tikzit.pro && $(MAKE)

# Native test binary: qmake testcase config (tikzit.pro `test { CONFIG += testcase; TARGET = UnitTests }`).
# There is intentionally no CMake test target — see D20.
build-test-cpp:
	@command -v $(QMAKE) >/dev/null 2>&1 || { echo "SKIP: qmake not installed"; exit 0; }
	@mkdir -p $(BUILD_DIR_TEST)
	cd $(BUILD_DIR_TEST) && $(QMAKE) ../tikzit.pro "CONFIG+=test" && $(MAKE)

## --- Test & Verification Targets ---

test: test-web test-cpp

test-web:
	npm run test

test-cpp: build-test-cpp
	@if [ -f "$(UNITTESTS)" ]; then \
		$(UNITTESTS); \
	elif [ -f "$(BUILD_DIR_TEST)/UnitTests" ]; then \
		./$(BUILD_DIR_TEST)/UnitTests; \
	else \
		echo "SKIP: UnitTests binary not found (Qt not installed?)"; \
	fi

test-e2e:
	npm run test:e2e

verify-corpus:
	npm run verify:corpus

check-independence:
	@echo "Checking browser runtime independence (zero native C++ bindings in web bundle)..."
	@node scripts/verify-browser-independence.mjs

check-conformance:
	@echo "Checking dual-system protocol conformance across 12 canonical ZX diagrams..."
	@npx tsx scripts/verify-protocol-conformance.mjs

## --- Hygiene & Lint Targets ---

lint:
	npx tsc --noEmit

clean: clean-web clean-cpp

clean-web:
	rm -rf $(DIST_DIR_WEB) .astro .tmp

clean-cpp:
	rm -rf $(BUILD_DIR_CPP) $(BUILD_DIR_QMAKE) $(BUILD_DIR_TEST)
