import { renderToString } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { TikzitSpatialWorkbench } from '../../../src/components/workbench/TikzitSpatialWorkbench';
import { createWorkbenchRuntimeAsync } from '../../../src/services/createWorkbenchRuntime';

describe('Workbench startup', () => {
  it('renders a loading shell without touching browser storage during SSR', () => {
    expect(typeof window).toBe('undefined');
    const html = renderToString(<TikzitSpatialWorkbench />);
    expect(html).toContain('data-testid="runtime-loading"');
  });

  it('refuses browser runtime initialization without window before loading sql.js', async () => {
    await expect(createWorkbenchRuntimeAsync()).rejects.toThrow(/only start in a browser/i);
  });
});
