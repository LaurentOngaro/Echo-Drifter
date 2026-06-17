// src/gameplay/anomalySystem.ts
import type { Anomaly, World } from '../core/world.ts';
import type { Vec3 } from '../types/index.ts';
import { anomaly as cfg, field } from '../content/tuning.ts';
import type { EventBus } from '../core/events.ts';

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

export function spawnAnomalies(world: World): void {
  world.anomalies = [];
  const rng = mulberry32(field.seed + 99);
  let placed = 0;
  let attempts = 0;
  while (placed < field.anomalyCount && attempts < 200) {
    attempts++;
    const angle = rng() * Math.PI * 2;
    const radius = cfg.minDistanceFromCenter + rng() * (field.radius - 8);
    const candidate: Vec3 = {
      x: Math.cos(angle) * radius,
      y: 0,
      z: Math.sin(angle) * radius,
    };
    if (Math.hypot(candidate.x, candidate.z) < cfg.minDistanceFromCenter) continue;
    let ok = true;
    for (const f of world.fragments) {
      const dx = candidate.x - f.position.x;
      const dz = candidate.z - f.position.z;
      if (dx * dx + dz * dz < cfg.minDistanceFromFragment * cfg.minDistanceFromFragment) {
        ok = false;
        break;
      }
    }
    if (!ok) continue;
    const anomaly: Anomaly = {
      id: `anom_${placed}`,
      position: candidate,
      radius: field.anomalyRadius,
      phase: rng() * Math.PI * 2,
    };
    world.anomalies.push(anomaly);
    placed++;
  }
}

export interface AnomalyUpdate {
  entered: Anomaly[];
  exited: Anomaly[];
}

let lastDissonanceEmitted = -1;
const DISSONANCE_EMIT_EPSILON = 0.02;

export function updateAnomalies(world: World, dt: number, eventBus: EventBus): AnomalyUpdate {
  const result: AnomalyUpdate = { entered: [], exited: [] };
  const enteredIds = new Set<string>();

  for (const a of world.anomalies) {
    const dx = world.playerPosition.x - a.position.x;
    const dz = world.playerPosition.z - a.position.z;
    const distSq = dx * dx + dz * dz;
    const inZone = distSq <= a.radius * a.radius;
    a.phase += dt * cfg.pulseSpeed;
    const wasInside = (a as AnomalyWithFlag).playerInside === true;
    if (inZone) {
      world.dissonance = Math.min(
        cfg.maxDissonance,
        world.dissonance + cfg.disruptFillPerSecond * dt,
      );
      enteredIds.add(a.id);
      if (!wasInside) {
        result.entered.push(a);
        eventBus.emit({ type: 'ANOMALY_ENTER', id: a.id, position: a.position });
      }
      (a as AnomalyWithFlag).playerInside = true;
    } else {
      if (wasInside) {
        result.exited.push(a);
        eventBus.emit({ type: 'ANOMALY_EXIT', id: a.id });
      }
      (a as AnomalyWithFlag).playerInside = false;
    }
  }

  if (enteredIds.size === 0) {
    world.dissonance = Math.max(
      0,
      world.dissonance - cfg.disruptDecayPerSecond * dt,
    );
  }

  if (Math.abs(world.dissonance - lastDissonanceEmitted) > DISSONANCE_EMIT_EPSILON) {
    lastDissonanceEmitted = world.dissonance;
    eventBus.emit({ type: 'DISSONANCE_CHANGED', amount: world.dissonance });
  }
  return result;
}

interface AnomalyWithFlag extends Anomaly {
  playerInside?: boolean;
}

export function resetWorldAnomalies(world: World): void {
  world.anomalies = [];
  world.dissonance = 0;
}
