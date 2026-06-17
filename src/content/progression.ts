// src/content/progression.ts
import type { MusicLayerId } from '../types/index.ts';

export interface ProgressionEntry {
  order: number;
  layer: MusicLayerId;
  label: string;
}

export const progression: ProgressionEntry[] = [
  { order: 1, layer: 'bass', label: 'Bass motif' },
  { order: 2, layer: 'pad', label: 'Pad harmony' },
  { order: 3, layer: 'arp', label: 'Arpeggio texture' },
  { order: 4, layer: 'lead', label: 'Lead fragment' },
];

export function layerByOrder(order: number): MusicLayerId | null {
  const entry = progression.find((p) => p.order === order);
  return entry ? entry.layer : null;
}
