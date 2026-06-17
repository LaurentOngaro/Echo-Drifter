// src/gameplay/collectibleSystem.ts
import type { Fragment, World } from '../core/world.ts';
import type { Vec3 } from '../types/index.ts';
import { field } from '../content/tuning.ts';
import { layerByOrder } from '../content/progression.ts';

function mulberry32(seed: number) {
  let t = seed >>> 0;
  return function () {
    t = (t + 0x6d2b79f5) >>> 0;
    let r = t;
    r = Math.imul(r ^ (r >>> 15), r | 1);
    r ^= r + Math.imul(r ^ (r >>> 7), r | 61);
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
  };
}

export function spawnFragments(world: World): void {
  world.fragments = [];
  const rng = mulberry32(field.seed);
  const minDist = 4;
  let placed = 0;
  let attempts = 0;
  while (placed < field.collectibleCount && attempts < 200) {
    attempts++;
    const angle = rng() * Math.PI * 2;
    const radius = 4 + rng() * (field.radius - 5);
    const candidate: Vec3 = {
      x: Math.cos(angle) * radius,
      y: 0,
      z: Math.sin(angle) * radius,
    };
    let ok = true;
    for (const f of world.fragments) {
      const dx = candidate.x - f.position.x;
      const dz = candidate.z - f.position.z;
      if (dx * dx + dz * dz < minDist * minDist) {
        ok = false;
        break;
      }
    }
    if (!ok) continue;
    const order = placed + 1;
    const layer = layerByOrder(order);
    if (!layer) continue;
    const fragment: Fragment = {
      id: `frag_${order}`,
      position: candidate,
      collected: false,
      unlocks: layer,
    };
    world.fragments.push(fragment);
    placed++;
  }
}

export function checkCollection(world: World): Fragment | null {
  const r2 = field.collectRadius * field.collectRadius;
  for (const f of world.fragments) {
    if (f.collected) continue;
    const dx = world.playerPosition.x - f.position.x;
    const dz = world.playerPosition.z - f.position.z;
    if (dx * dx + dz * dz <= r2) {
      return f;
    }
  }
  return null;
}

export function markCollected(world: World, fragment: Fragment): void {
  fragment.collected = true;
  world.fragmentsCollected++;
  world.unlockedLayers.add(fragment.unlocks);
}
