// src/presentation/vfx.ts
import * as THREE from 'three';
import type { Updatable, Vec3 } from '../types/index.ts';
import { vfx as vfxCfg } from '../content/tuning.ts';
import { createRipple } from './meshes.ts';

interface RippleInstance {
  mesh: THREE.Mesh;
  ageMs: number;
  lifetimeMs: number;
}

export interface VfxSystem {
  updatable: Updatable;
  spawnRipple(position: Vec3, color: number): void;
  setDissonance(amount: number): void;
}

export function createVfxSystem(scene: THREE.Scene): VfxSystem {
  const ripples: RippleInstance[] = [];

  function spawnRipple(position: Vec3, color: number) {
    const mesh = createRipple(new THREE.Vector3(position.x, position.y - 0.2, position.z), color);
    scene.add(mesh);
    ripples.push({ mesh, ageMs: 0, lifetimeMs: vfxCfg.rippleDurationMs });
  }

  let dissonance = 0;

  function setDissonance(amount: number) {
    dissonance = Math.max(0, Math.min(1, amount));
  }

  const updatable: Updatable = {
    update(dt: number) {
      const dtMs = dt * 1000;
      for (let i = ripples.length - 1; i >= 0; i--) {
        const r = ripples[i];
        r.ageMs += dtMs;
        const t = r.ageMs / r.lifetimeMs;
        if (t >= 1) {
          scene.remove(r.mesh);
          (r.mesh.geometry as THREE.BufferGeometry).dispose();
          (r.mesh.material as THREE.Material).dispose();
          ripples.splice(i, 1);
          continue;
        }
        const scale = vfxCfg.rippleStartScale + (vfxCfg.rippleEndScale - vfxCfg.rippleStartScale) * t;
        r.mesh.scale.setScalar(scale);
        const dissonanceShift = 1 - dissonance * 0.4;
        (r.mesh.material as THREE.MeshBasicMaterial).opacity = 0.9 * (1 - t) * dissonanceShift;
      }
    },
  };

  return { updatable, spawnRipple, setDissonance };
}
