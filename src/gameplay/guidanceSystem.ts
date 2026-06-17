// src/gameplay/guidanceSystem.ts
import type { Fragment, World } from '../core/world.ts';
import { palette } from '../content/tuning.ts';
import type { Vec3 } from '../types/index.ts';

export interface NearestTarget {
  fragment: Fragment;
  distance: number;
}

export function findNearestUncollected(world: World): NearestTarget | null {
  let best: NearestTarget | null = null;
  for (const f of world.fragments) {
    if (f.collected) continue;
    const d = distance2D(world.playerPosition, f.position);
    if (!best || d < best.distance) {
      best = { fragment: f, distance: d };
    }
  }
  return best;
}

export function guidanceColor(distance: number): number {
  const t = Math.min(distance / 20, 1);
  const c = blendHex(palette.cyan, palette.violet, t);
  return c;
}

function distance2D(a: Vec3, b: Vec3): number {
  const dx = a.x - b.x;
  const dz = a.z - b.z;
  return Math.sqrt(dx * dx + dz * dz);
}

function blendHex(a: number, b: number, t: number): number {
  const ar = (a >> 16) & 0xff;
  const ag = (a >> 8) & 0xff;
  const ab = a & 0xff;
  const br = (b >> 16) & 0xff;
  const bg = (b >> 8) & 0xff;
  const bb = b & 0xff;
  const r = Math.round(ar + (br - ar) * t);
  const g = Math.round(ag + (bg - ag) * t);
  const bl = Math.round(ab + (bb - ab) * t);
  return (r << 16) | (g << 8) | bl;
}
