import { Context, Service } from 'cordis';
import {
  MCard,
  textPayload,
  structuredPayload,
  BooleanPCard,
  type BooleanPCardOptions,
  evaluateVCard,
  AgentDid,
  TriDatabaseManager,
  MCardCollection,
  ContentHash,
  type BailVerdict,
} from 'clm-kernel';
import { safeParse } from '../../core/parser/parser';
import type { GraphAST, ParseDiagnostic } from '../../core/domain/types';

declare module 'cordis' {
  interface Context {
    documentCommit: DocumentCommitService;
  }
}

export class PredicateBooleanPCard extends BooleanPCard {
  public predicate: (card: MCard) => boolean | BailVerdict;

  constructor(
    options: BooleanPCardOptions,
    predicate: (card: MCard) => boolean | BailVerdict
  ) {
    super(options);
    this.predicate = predicate;
  }
}

export interface CommitDocumentOptions {
  handle: string;
  sourceText: string;
  uri?: string;
  authorDid?: AgentDid;
  sequence?: number;
  activate?: boolean;
  message?: string;
}

export interface CommitDocumentResult {
  success: boolean;
  hash?: string;
  sequence?: number;
  reason?: string;
  receiptHash: string;
  ast?: GraphAST;
  diagnostics?: ParseDiagnostic[];
}

export interface HistoryRow {
  position: number;
  hash: string;
  changedAt: string;
  authorDid?: string;
  label?: string;
  unavailable?: boolean;
  isHead?: boolean;
}

export interface DocumentHistoryResult {
  handle: string;
  head?: string;
  rows: HistoryRow[];
  error?: string;
}

export interface RestoreVersionOptions {
  handle: string;
  targetHash: string;
  expectedHeadHash?: string;
}

export type RestoreVersionResult =
  | { status: 'success'; hash: string; content: string; ast: GraphAST }
  | { status: 'already-current' }
  | { status: 'conflict'; currentHead: string; expectedHead: string }
  | { status: 'missing-card'; hash: string }
  | { status: 'invalid-card'; reason: string }
  | { status: 'failure'; error: string };

export interface SqlDatabaseQueryable {
  exec(sql: string, params?: any): Array<{ columns?: string[]; values: any[][] }>;
}

/**
 * Cordis Service that coordinates gated document persistence.
 * Validates AST syntax and invariants via BooleanPCard & evaluateVCard.
 * Success advances the handle in mcard pillar; bails preserve prior handle state.
 * All audit receipts route exclusively to executionLog.
 */
export class DocumentCommitService extends Service {
  private triDb: TriDatabaseManager;
  private collection: MCardCollection;
  private defaultAuthorDid: AgentDid;
  private historyDb?: SqlDatabaseQueryable;
  private inMemoryTransitions = new Map<string, Array<{ hash: string; changedAt: string }>>();

  constructor(
    ctx: Context,
    triDb: TriDatabaseManager,
    collection: MCardCollection,
    defaultAuthorDid: AgentDid,
    options?: { historyDb?: SqlDatabaseQueryable }
  ) {
    super(ctx, 'documentCommit');
    this.triDb = triDb;
    this.collection = collection;
    this.defaultAuthorDid = defaultAuthorDid;
    this.historyDb = options?.historyDb;
  }

  saveDocumentWithGate(options: CommitDocumentOptions): CommitDocumentResult {
    const authorDid = options.authorDid ?? this.defaultAuthorDid;
    const history = this.collection.history(options.handle);
    const sequence = options.sequence ?? history.length;
    const uri = options.uri ?? `tikzit://diagram/${options.handle.replace(/^zx:/, '')}`;

    // 1. Create candidate MCard
    const candidateCard = MCard.create(
      uri,
      textPayload(options.sourceText),
      authorDid,
      sequence
    );

    // 2. Parse candidate TikZ text
    const parseResult = safeParse(options.sourceText);

    // 3. Formulate BooleanPCard validation gate
    const validationPCard = new PredicateBooleanPCard(
      {
        id: 'vcard:diagram-validation:v1',
        phase: 'postcondition',
        expression: 'ast_valid',
        targetPattern: 'tikzit://diagram/*',
        coeffects: { requiredServices: ['graph'] },
      },
      (): boolean | BailVerdict => {
        if (!parseResult.success) {
          return {
            verdict: 'bail',
            reason: parseResult.errors.map((e: ParseDiagnostic) => e.message).join('; ') || 'TikZ parse error',
            invariantCode: 'INVALID_TIKZ_SYNTAX',
          };
        }
        if (!parseResult.ast) {
          return {
            verdict: 'bail',
            reason: 'Parser returned null AST',
            invariantCode: 'NULL_AST',
          };
        }
        return { verdict: 'pass' };
      }
    );

    // 4. Evaluate gate through clm-kernel evaluateVCard
    const evalResult = evaluateVCard(validationPCard, candidateCard);
    const isPass = evalResult.verdict === 'pass';
    const reason = 'reason' in evalResult ? evalResult.reason : undefined;

    // 5. Mint audit receipt into executionLog pillar
    const receiptUri = `tikzit://receipt/eval/${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    const receiptValue: Record<string, unknown> = {
      verdict: isPass ? 'pass' : 'bail',
      handle: options.handle,
      candidateHash: candidateCard.hash.asHex(),
      sequence,
      diagnostics: parseResult.errors,
      timestamp: Date.now(),
    };
    if (options.message) {
      receiptValue.message = options.message;
    }
    if (!isPass && reason !== undefined) receiptValue.reason = reason;
    if (parseResult.ast) {
      receiptValue.nodeCount = parseResult.ast.nodes.length;
      receiptValue.edgeCount = parseResult.ast.edges.length;
    }
    const receiptPayload = structuredPayload(receiptValue);

    const receiptCard = MCard.create(receiptUri, receiptPayload, authorDid, 0);
    this.triDb.executionLog.putCard(receiptCard);

    if (!isPass) {
      // Gate bailed: Emit diagnostics, preserve prior handle in mcard pillar
      this.ctx.emit('tikzit/diagnostics:emit', parseResult.errors);
      return {
        success: false,
        sequence,
        reason: reason || 'Document validation bailed',
        receiptHash: receiptCard.hash.asHex(),
        diagnostics: parseResult.errors,
      };
    }

    // Gate passed: Record candidate in mcard pillar under handle
    this.collection.putWithHandle(candidateCard, options.handle);

    const list = this.inMemoryTransitions.get(options.handle) ?? [];
    list.push({ hash: candidateCard.hash.asHex(), changedAt: new Date().toISOString() });
    this.inMemoryTransitions.set(options.handle, list);

    if (options.activate !== false) {
      // Update active working AST on Cordis GraphService
      if (parseResult.ast && this.ctx.graph) {
        this.ctx.graph.setAST(parseResult.ast);
      }

      // Emit typed document change event
      this.ctx.emit('tikzit/document:change', {
        handle: options.handle,
        hash: candidateCard.hash.asHex(),
        sequence: candidateCard.sequence,
      });
    }

    return {
      success: true,
      hash: candidateCard.hash.asHex(),
      sequence: candidateCard.sequence,
      receiptHash: receiptCard.hash.asHex(),
      ast: parseResult.ast ?? undefined,
    };
  }

  getDocumentHistory(handle: string): ContentHash[] {
    return this.collection.history(handle);
  }

  documentHistory(handle: string): DocumentHistoryResult {
    const currentHead = this.collection.resolveHandle(handle);
    if (!currentHead) {
      return { handle, rows: [] };
    }
    const currentHeadHex = currentHead.asHex();

    // Query SQLite database if available
    let rows: HistoryRow[] = [];
    if (this.historyDb) {
      try {
        const regRes = this.historyDb.exec(
          'SELECT current_hash, created_at, updated_at FROM handle_registry WHERE handle = ?',
          [handle]
        );
        const histRes = this.historyDb.exec(
          'SELECT previous_hash, changed_at FROM handle_history WHERE handle = ? ORDER BY id ASC',
          [handle]
        );

        if (regRes.length && regRes[0].values.length) {
          const [regCurrent, createdAt, updatedAt] = regRes[0].values[0];
          const histValues = (histRes[0]?.values ?? []) as Array<[unknown, unknown]>;

          if (histValues.length === 0) {
            rows.push({
              position: 1,
              hash: String(regCurrent),
              changedAt: String(createdAt),
              isHead: true,
            });
          } else {
            // Position 1 was previous_hash of row 0, timestamp from createdAt
            rows.push({
              position: 1,
              hash: String(histValues[0][0]),
              changedAt: String(createdAt),
              isHead: false,
            });

            // Positions 2 .. histValues.length
            for (let i = 1; i < histValues.length; i++) {
              rows.push({
                position: i + 1,
                hash: String(histValues[i][0]),
                changedAt: String(histValues[i - 1][1]),
                isHead: false,
              });
            }

            // Position histValues.length + 1 is current_hash
            rows.push({
              position: histValues.length + 1,
              hash: String(regCurrent),
              changedAt: String(histValues[histValues.length - 1][1] ?? updatedAt),
              isHead: true,
            });
          }
        }
      } catch (err) {
        console.warn('Failed querying SQLite history for handle:', handle, err);
      }
    }

    // Fallback if not populated from SQLite (e.g. MemoryBackend)
    if (rows.length === 0) {
      const inMem = this.inMemoryTransitions.get(handle);
      if (inMem && inMem.length > 0) {
        rows = inMem.map((entry, idx) => ({
          position: idx + 1,
          hash: entry.hash,
          changedAt: entry.changedAt,
          isHead: idx === inMem.length - 1,
        }));
      } else {
        // Fall back to collection.history(handle)
        const hist = this.collection.history(handle);
        if (hist.length > 0) {
          const now = new Date().toISOString();
          rows = hist.map((ch, idx) => ({
            position: idx + 1,
            hash: ch.asHex(),
            changedAt: now,
            isHead: idx === hist.length - 1,
          }));
        } else {
          rows = [{
            position: 1,
            hash: currentHeadHex,
            changedAt: new Date().toISOString(),
            isHead: true,
          }];
        }
      }
    }

    // Check card availability and attach metadata labels
    let labels: Record<string, string> | undefined;
    if (handle.startsWith('zx:diagrams:')) {
      const uuid = handle.slice('zx:diagrams:'.length);
      const metaHandle = `zx:meta:diagrams:${uuid}`;
      const metaHash = this.collection.resolveHandle(metaHandle);
      if (metaHash) {
        const metaCard = this.collection.get(metaHash);
        if (metaCard && metaCard.payload.kind === 'structured') {
          const metaVal = metaCard.payload.value as { labels?: Record<string, string> };
          labels = metaVal.labels;
        }
      }
    }

    for (const row of rows) {
      if (labels && labels[String(row.position)]) {
        row.label = labels[String(row.position)];
      }
      try {
        const card = this.collection.get(ContentHash.fromHex(row.hash));
        if (!card || card.payload.kind !== 'text') {
          row.unavailable = true;
        } else {
          row.authorDid = card.author.asString();
        }
      } catch {
        row.unavailable = true;
      }
    }

    return {
      handle,
      head: currentHeadHex,
      rows,
    };
  }

  async restoreVersion(options: RestoreVersionOptions): Promise<RestoreVersionResult> {
    const currentHead = this.collection.resolveHandle(options.handle);
    if (!currentHead) {
      return { status: 'failure', error: `Handle not registered: ${options.handle}` };
    }
    const currentHeadHex = currentHead.asHex();

    // 1. CAS Check
    if (options.expectedHeadHash && currentHeadHex !== options.expectedHeadHash) {
      return {
        status: 'conflict',
        currentHead: currentHeadHex,
        expectedHead: options.expectedHeadHash,
      };
    }

    // 2. Already current
    if (options.targetHash === currentHeadHex) {
      return { status: 'already-current' };
    }

    // 3. Card retrieval & validation
    let card: MCard | undefined;
    try {
      card = this.collection.get(ContentHash.fromHex(options.targetHash));
    } catch {
      return { status: 'missing-card', hash: options.targetHash };
    }
    if (!card) {
      return { status: 'missing-card', hash: options.targetHash };
    }
    if (card.payload.kind !== 'text') {
      return { status: 'invalid-card', reason: 'Historical card payload is not text' };
    }

    const content = card.payload.value;
    const parsed = safeParse(content);
    if (!parsed.success || !parsed.ast) {
      return { status: 'invalid-card', reason: 'Historical card content failed syntax validation' };
    }

    // 4. Re-register card under handle without creating a new card (True A->B->A)
    this.collection.putWithHandle(card, options.handle);

    // Record transition in memory
    const list = this.inMemoryTransitions.get(options.handle) ?? [];
    list.push({ hash: options.targetHash, changedAt: new Date().toISOString() });
    this.inMemoryTransitions.set(options.handle, list);

    // Emit change event
    this.ctx.emit('tikzit/document:change', {
      handle: options.handle,
      hash: options.targetHash,
      sequence: card.sequence,
    });

    return {
      status: 'success',
      hash: options.targetHash,
      content,
      ast: parsed.ast,
    };
  }

  resolveDocument(handle: string): MCard | undefined {
    const hash = this.collection.resolveHandle(handle);
    if (!hash) return undefined;
    return this.collection.get(hash);
  }
}
