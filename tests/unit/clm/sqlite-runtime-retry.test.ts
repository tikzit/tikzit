import { describe, expect, it, vi } from 'vitest';
import initSqlJs from 'sql.js';

vi.mock('sql.js', async (importOriginal) => {
  const actual = await importOriginal<typeof import('sql.js')>();
  return { ...actual, default: vi.fn(actual.default) };
});

vi.mock('sql.js/dist/sql-wasm.wasm?url', () => ({ default: 'sql-wasm.wasm' }));

import { createSqlJsTriDatabase } from '../../../src/services/clm/sqliteRuntime';

describe('sql.js initialization resilience', () => {
  it('does not cache a rejected WASM initialization promise forever', async () => {
    const init = vi.mocked(initSqlJs);
    init.mockRejectedValueOnce(new Error('wasm fetch failed'));

    await expect(createSqlJsTriDatabase()).rejects.toThrow('wasm fetch failed');

    const runtime = await createSqlJsTriDatabase();
    expect(runtime.backends).toHaveLength(3);
    expect(init).toHaveBeenCalledTimes(2);
    runtime.close();
  });
});
