# Sprint 07: Bidirectional State Synchronization & MCard Storage
**Directory:** `docs/sprints/sync/07-state-sync-and-mcard-storage`

## Status: Graduated (2026-09-28)

### Summary of Accomplishments
1. **Transactional Undo/Redo Engine (`src/core/history/TransactionManager.ts`)**:
   - Command pattern with `ASTSnapshotCommand` and drag-coalescing `MoveNodesCommand`.
   - Managing 100-step undo/redo stack with accurate dirty tracking (`isDirty`).
   - Global keyboard shortcuts (`Cmd+Z`, `Cmd+Shift+Z`, `Ctrl+Z`, `Ctrl+Y`).
   - 50-step undo/redo torture test passing with zero state drift.

2. **Bidirectional Sync Controller (`src/services/sync/SyncController.ts`)**:
   - Real-time synchronization between Three.js Canvas AST and Code Editor.
   - Echo suppression preventing infinite cycles.
   - Debounced syntax validation reporting non-fatal diagnostics banner while preserving canvas scene graph.

3. **DocumentStore & MCard Persistence (`src/services/storage/DocumentStore.ts`)**:
   - Deterministic content hashing and revision lineage.
   - Dual-layer storage (IndexedDB/localStorage with in-memory fallback).
   - Revisions browsing and point-in-time restore.

4. **Multi-Document Workspace Manager (`src/services/workspace/WorkspaceManager.ts`)**:
   - Multi-tab diagram management, new diagram creation (`+`), active document switching, dirty tracking.

5. **File Drop Zone & Ingestion (`src/components/workspace/FileDropZone.tsx`)**:
   - Window drag-and-drop overlay for `.tikz`, `.tex`, and `.md` files with instant parsing and tab opening.

6. **Version Popover UI (`src/components/workbench/panels/VersionPopover.tsx`)**:
   - Dropdown modal for creating manual savepoints and viewing revision history.

### Verification
- **Unit Tests:** 161/161 passed (31 test files).
- **Playwright E2E:** 5/5 passed in `e2e/sprint-07/sync-mcard.spec.ts`.
- **TypeScript:** 0 errors via `npx tsc --noEmit`.
