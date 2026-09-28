import { describe, it, expect } from 'vitest';
import { MCard } from 'clm-kernel';
import { createWorkbenchRuntime } from '../../../src/services/createWorkbenchRuntime';

describe('Gated Document Commit & CLM Verification Pipeline (Sprint 02B)', () => {
  const validTikz =
    '\\begin{tikzpicture}\n' +
    '\t\\begin{pgfonlayer}{nodelayer}\n' +
    '\t\t\\node [style=none] (0) at (0, 0) {$\\alpha$};\n' +
    '\t\t\\node [style=none] (1) at (1, 1) {$\\beta$};\n' +
    '\t\\end{pgfonlayer}\n' +
    '\t\\begin{pgfonlayer}{edgelayer}\n' +
    '\t\t\\draw (0) to (1);\n' +
    '\t\\end{pgfonlayer}\n' +
    '\\end{tikzpicture}\n';

  const invalidTikz =
    '\\begin{tikzpicture}\n' +
    '\t\\node (unclosed) at (0, 0)\n' +
    '\\end{tikzpicture}\n';

  it('passes valid TikZ markup through BooleanPCard and records audit receipt in executionLog', () => {
    const runtime = createWorkbenchRuntime();

    const result = runtime.ctx.documentCommit.saveDocumentWithGate({
      handle: 'zx:test_diagram',
      sourceText: validTikz,
    });

    // 1. Gated result success
    expect(result.success).toBe(true);
    expect(result.hash).toBeDefined();
    expect(result.receiptHash).toBeDefined();

    // 2. Handle registered in mcard collection
    const resolvedCard = runtime.ctx.documentCommit.resolveDocument('zx:test_diagram');
    expect(resolvedCard).toBeDefined();
    expect(resolvedCard!.hash.asHex()).toBe(result.hash);
    expect(resolvedCard!.payload.kind).toBe('text');
    if (resolvedCard!.payload.kind === 'text') {
      expect(resolvedCard!.payload.value).toBe(validTikz);
    }

    // 3. Receipt exists in executionLog pillar
    const receipts = runtime.triDb.executionLog.list();
    expect(receipts.length).toBe(1);
    expect(receipts[0].hash.asHex()).toBe(result.receiptHash);

    const receiptPayload = (receipts[0].payload as any).value;
    expect(receiptPayload.verdict).toBe('pass');
    expect(receiptPayload.handle).toBe('zx:test_diagram');
    expect(receiptPayload.candidateHash).toBe(result.hash);
    expect(receiptPayload.nodeCount).toBe(2);
    expect(receiptPayload.edgeCount).toBe(1);
    const serializedReceipt = JSON.stringify(receipts[0].toJSON());
    const restoredReceipt = MCard.fromJSON(JSON.parse(serializedReceipt));
    expect(MCard.create(restoredReceipt.uri, restoredReceipt.payload, restoredReceipt.author, restoredReceipt.sequence).hash)
      .toEqual(restoredReceipt.hash);

    // 4. Nanostores $documentHead projection was updated
    expect(runtime.stores.$documentHead.get().handle).toBe('zx:test_diagram');
    expect(runtime.stores.$documentHead.get().hash).toBe(result.hash);
    expect(runtime.stores.$documentHead.get().isValid).toBe(true);

    runtime.dispose();
  });

  it('bails on malformed TikZ markup, preserving previous handle and recording bail receipt', () => {
    const runtime = createWorkbenchRuntime();

    // 1. Initial valid commit
    const initialResult = runtime.ctx.documentCommit.saveDocumentWithGate({
      handle: 'zx:test_diagram',
      sourceText: validTikz,
    });
    expect(initialResult.success).toBe(true);
    const initialHash = initialResult.hash;

    // 2. Attempt invalid commit
    let diagnosticEmitted: any = null;
    runtime.ctx.on('tikzit/diagnostics:emit', (diag) => {
      diagnosticEmitted = diag;
    });

    const bailResult = runtime.ctx.documentCommit.saveDocumentWithGate({
      handle: 'zx:test_diagram',
      sourceText: invalidTikz,
    });

    // 3. Validation bailed
    expect(bailResult.success).toBe(false);
    expect(bailResult.reason).toBeDefined();
    expect(bailResult.receiptHash).toBeDefined();
    expect(diagnosticEmitted).toBeDefined();

    // 4. Handle still points to previous valid hash
    const currentCard = runtime.ctx.documentCommit.resolveDocument('zx:test_diagram');
    expect(currentCard).toBeDefined();
    expect(currentCard!.hash.asHex()).toBe(initialHash);

    // 5. Execution log contains both receipts (pass and bail)
    const receipts = runtime.triDb.executionLog.list();
    expect(receipts.length).toBe(2);

    const bailReceipt = receipts.find((r) => (r.payload as any).value.verdict === 'bail');
    expect(bailReceipt).toBeDefined();
    const bailVal = (bailReceipt!.payload as any).value;
    expect(bailVal.handle).toBe('zx:test_diagram');
    expect(bailVal.reason).toBeDefined();

    // 6. Knowledge pillar is not contaminated
    const knowledgeCards = runtime.triDb.knowledge.list();
    for (const card of knowledgeCards) {
      expect(card.uri.startsWith('tikzit://receipt/')).toBe(false);
    }

    runtime.dispose();
  });

  it('allows committing a syntactically valid empty diagram (Sprint 16 D1)', () => {
    const runtime = createWorkbenchRuntime();
    const result = runtime.ctx.documentCommit.saveDocumentWithGate({
      handle: 'zx:empty_diagram',
      sourceText: '\\begin{tikzpicture}\n\\end{tikzpicture}\n',
    });

    expect(result.success).toBe(true);
    expect(runtime.mcardCollection.resolveHandle('zx:empty_diagram')).toBeDefined();
    expect(runtime.triDb.executionLog.list()).toHaveLength(1);
    runtime.dispose();
  });

  it('bails on invalid TikZ syntax', () => {
    const runtime = createWorkbenchRuntime();
    const result = runtime.ctx.documentCommit.saveDocumentWithGate({
      handle: 'zx:bad_diagram',
      sourceText: '\\begin{tikzpicture}\n\\invalid [syntax;\n',
    });

    expect(result.success).toBe(false);
    expect(result.reason).toBeDefined();
    expect(runtime.mcardCollection.resolveHandle('zx:bad_diagram')).toBeUndefined();
    runtime.dispose();
  });

  it('preserves full version lineage over consecutive document edits', () => {
    const runtime = createWorkbenchRuntime();

    const v1Text = validTikz;
    const v2Text = validTikz + '% Version 2 modification\n';
    const v3Text = validTikz + '% Version 3 modification\n';

    const res1 = runtime.ctx.documentCommit.saveDocumentWithGate({
      handle: 'zx:lineage_doc',
      sourceText: v1Text,
    });
    const res2 = runtime.ctx.documentCommit.saveDocumentWithGate({
      handle: 'zx:lineage_doc',
      sourceText: v2Text,
    });
    const res3 = runtime.ctx.documentCommit.saveDocumentWithGate({
      handle: 'zx:lineage_doc',
      sourceText: v3Text,
    });

    expect(res1.success).toBe(true);
    expect(res2.success).toBe(true);
    expect(res3.success).toBe(true);

    // Verify all 3 hashes are distinct
    expect(new Set([res1.hash, res2.hash, res3.hash]).size).toBe(3);

    // Verify handle resolves to latest v3 hash
    const latest = runtime.ctx.documentCommit.resolveDocument('zx:lineage_doc');
    expect(latest?.hash.asHex()).toBe(res3.hash);

    // Verify history returns all 3 hashes in chronological order
    const history = runtime.ctx.documentCommit.getDocumentHistory('zx:lineage_doc');
    expect(history.length).toBe(3);
    expect(history[0].asHex()).toBe(res1.hash);
    expect(history[1].asHex()).toBe(res2.hash);
    expect(history[2].asHex()).toBe(res3.hash);

    runtime.dispose();
  });
});
