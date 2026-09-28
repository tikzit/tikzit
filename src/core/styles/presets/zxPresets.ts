import type { TikzStyle } from '../../domain/types';

export const ZX_PRESETS: TikzStyle[] = [
  {
    name: 'Z',
    category: 'Spiders',
    data: [
      { key: 'fill', value: 'rgb,255: red,90; green,210; blue,90' },
      { key: 'draw', value: 'black' },
      { key: 'shape', value: 'circle' },
      { key: 'tikzit category', value: 'Spiders' },
    ],
  },
  {
    name: 'X',
    category: 'Spiders',
    data: [
      { key: 'fill', value: 'rgb,255: red,235; green,75; blue,75' },
      { key: 'draw', value: 'black' },
      { key: 'shape', value: 'circle' },
      { key: 'tikzit category', value: 'Spiders' },
    ],
  },
  {
    name: 'H',
    category: 'Gates',
    data: [
      { key: 'fill', value: 'rgb,255: red,255; green,220; blue,70' },
      { key: 'draw', value: 'black' },
      { key: 'shape', value: 'rectangle' },
      { key: 'tikzit category', value: 'Gates' },
    ],
  },
  {
    name: 'none',
    category: 'Boundary',
    data: [
      { key: 'fill', value: 'none' },
      { key: 'draw', value: 'none' },
      { key: 'shape', value: 'circle' },
      { key: 'tikzit category', value: 'Boundary' },
    ],
  },
  {
    name: 'wire',
    category: 'Wires',
    data: [
      { key: 'draw', value: 'black' },
      { key: '-' },
      { key: 'tikzit category', value: 'Wires' },
    ],
  },
  {
    name: 'dashed wire',
    category: 'Wires',
    data: [
      { key: 'draw', value: 'black' },
      { key: 'dashed' },
      { key: '-' },
      { key: 'tikzit category', value: 'Wires' },
    ],
  },
];
