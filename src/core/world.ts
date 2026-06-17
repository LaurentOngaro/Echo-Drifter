// src/core/world.ts
import type { MusicLayerId, Vec3 } from '../types/index.ts';

export interface Fragment {
  id: string;
  position: Vec3;
  collected: boolean;
  unlocks: MusicLayerId;
}

export interface Anomaly {
  id: string;
  position: Vec3;
  radius: number;
  phase: number;
}

export interface World {
  playerPosition: Vec3;
  playerVelocity: Vec3;
  fragments: Fragment[];
  anomalies: Anomaly[];
  unlockedLayers: Set<MusicLayerId>;
  dissonance: number;
  fragmentsCollected: number;
}

export function createWorld(): World {
  return {
    playerPosition: { x: 0, y: 0, z: 0 },
    playerVelocity: { x: 0, y: 0, z: 0 },
    fragments: [],
    anomalies: [],
    unlockedLayers: new Set<MusicLayerId>(['drone', 'pulse']),
    dissonance: 0,
    fragmentsCollected: 0,
  };
}

export function resetWorld(world: World): void {
  world.playerPosition = { x: 0, y: 0, z: 0 };
  world.playerVelocity = { x: 0, y: 0, z: 0 };
  world.unlockedLayers = new Set<MusicLayerId>(['drone', 'pulse']);
  world.dissonance = 0;
  world.fragmentsCollected = 0;
  for (const f of world.fragments) {
    f.collected = false;
  }
}
