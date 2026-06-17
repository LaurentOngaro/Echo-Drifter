// src/presentation/vfx.ts
import * as THREE from 'three';
import type { Updatable, Vec3 } from '../types/index.ts';
import { visual } from '../content/tuning.ts';
import { createRipple, createTrailSphere } from './meshes.ts';

interface RippleInstance {
  mesh: THREE.Mesh;
  ageMs: number;
  active: boolean;
}

interface TrailSphereInstance {
  mesh: THREE.Mesh;
  position: THREE.Vector3;
  opacity: number;
}

export interface VfxSystem {
  updatable: Updatable;
  spawnRipple(position: Vec3, color: number): void;
  setDissonance(amount: number): void;
  trailGroup: THREE.Group;
  setPlayerPosition(position: Vec3): void;
  setPlayerVelocity(velocity: Vec3): void;
}

function easeOutCubic(t: number): number {
  return 1 - Math.pow(1 - t, 3);
}

function lerpScalar(a: number, b: number, k: number): number {
  return a + (b - a) * k;
}

export function createVfxSystem(scene: THREE.Scene): VfxSystem {
  const pool: RippleInstance[] = [];
  for (let i = 0; i < visual.ripple.maxConcurrent; i++) {
    const mesh = createRipple(visual.palette.collectible);
    mesh.visible = false;
    pool.push({ mesh, ageMs: 0, active: false });
  }

  const trailGroup = new THREE.Group();
  scene.add(trailGroup);

  const trail: TrailSphereInstance[] = [];
  for (let i = 0; i < visual.trail.poolSize; i++) {
    const mesh = createTrailSphere();
    mesh.visible = false;
    trailGroup.add(mesh);
    trail.push({
      mesh,
      position: new THREE.Vector3(),
      opacity: 0,
    });
  }

  const playerPosition = new THREE.Vector3();
  const playerVelocity = new THREE.Vector3();
  let lastTrailWrite = 0;
  let lastPlayerWritePos = new THREE.Vector3();
  let trailInitialized = false;
  let dissonance = 0;

  function spawnRipple(position: Vec3, color: number) {
    let slot = pool.find((r) => !r.active);
    if (!slot) {
      let oldestIdx = 0;
      let oldestAge = -1;
      for (let i = 0; i < pool.length; i++) {
        if (pool[i].ageMs > oldestAge) {
          oldestAge = pool[i].ageMs;
          oldestIdx = i;
        }
      }
      slot = pool[oldestIdx];
    }
    slot.active = true;
    slot.ageMs = 0;
    slot.mesh.visible = true;
    slot.mesh.position.set(position.x, position.y - 0.2, position.z);
    slot.mesh.scale.setScalar(visual.ripple.startScale);
    (slot.mesh.material as THREE.MeshBasicMaterial).color.setHex(color);
    (slot.mesh.material as THREE.MeshBasicMaterial).opacity = 1;
    if (!slot.mesh.parent) scene.add(slot.mesh);
  }

  function setDissonance(amount: number) {
    dissonance = Math.max(0, Math.min(1, amount));
  }

  function setPlayerPosition(position: Vec3) {
    playerPosition.set(position.x, position.y, position.z);
  }

  function setPlayerVelocity(velocity: Vec3) {
    playerVelocity.set(velocity.x, velocity.y, velocity.z);
  }

  const updatable: Updatable = {
    update(dt: number) {
      const dtMs = dt * 1000;

      for (const r of pool) {
        if (!r.active) continue;
        r.ageMs += dtMs;
        const t = r.ageMs / visual.ripple.durationMs;
        if (t >= 1) {
          r.active = false;
          r.mesh.visible = false;
          if (r.mesh.parent) scene.remove(r.mesh);
          continue;
        }
        const eased = easeOutCubic(t);
        const scale = lerpScalar(
          visual.ripple.startScale,
          visual.ripple.endScale,
          eased,
        );
        r.mesh.scale.setScalar(scale);
        const dissonanceShift = 1 - dissonance * 0.4;
        (r.mesh.material as THREE.MeshBasicMaterial).opacity =
          (1 - t) * dissonanceShift;
      }

      const speed = playerVelocity.length();
      const trailActive = speed >= visual.trail.velocityThreshold;

      if (trailActive) {
        if (!trailInitialized) {
          lastPlayerWritePos.copy(playerPosition);
          for (const t of trail) t.position.copy(playerPosition);
          trailInitialized = true;
          lastTrailWrite = visual.trail.updateIntervalSec * 1000;
        }
        lastTrailWrite += dtMs;
        if (lastTrailWrite >= visual.trail.updateIntervalSec * 1000) {
          for (let i = trail.length - 1; i > 0; i--) {
            trail[i].position.copy(trail[i - 1].position);
          }
          trail[0].position.copy(lastPlayerWritePos);
          lastPlayerWritePos.copy(playerPosition);
          lastTrailWrite = 0;
        }
      } else {
        trailInitialized = false;
      }

      const calmHead = visual.trail.headOpacity;
      const anomalyHead = 0.25;
      const headOpacity = lerpScalar(calmHead, anomalyHead, dissonance);

      for (let i = 0; i < trail.length; i++) {
        const t = trail[i];
        if (!trailActive && t.opacity > 0) {
          t.opacity = Math.max(0, t.opacity - dt / 0.2);
        } else if (trailActive) {
          const target = headOpacity * (1 - i / trail.length);
          t.opacity = lerpScalar(t.opacity, target, 0.1);
        }
        if (t.opacity > 0.01) {
          t.mesh.visible = true;
          t.mesh.position.copy(t.position);
          (t.mesh.material as THREE.MeshBasicMaterial).opacity = t.opacity;
        } else {
          t.mesh.visible = false;
        }
      }
    },
  };

  return {
    updatable,
    spawnRipple,
    setDissonance,
    trailGroup,
    setPlayerPosition,
    setPlayerVelocity,
  };
}
