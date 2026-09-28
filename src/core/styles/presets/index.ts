import type { TikzStylesCatalog } from '../../domain/types';
import { ZX_PRESETS } from './zxPresets';

export { ZX_PRESETS } from './zxPresets';

export function getDefaultStylesCatalog(): TikzStylesCatalog {
  return {
    styles: JSON.parse(JSON.stringify(ZX_PRESETS)),
  };
}
