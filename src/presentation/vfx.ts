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

interface FlashInstance {
  mesh: THREE.Mesh;
  ageSec: number;
  durationSec: number;
}

interface BurstParticle {
  mesh: THREE.Mesh;
  velocity: THREE.Vector3;
  ageSec: number;
  active: boolean;
}

export interface VfxSystem {
  updatable: Updatable;
  spawnRipple(position: Vec3, color: number): void;
  spawnCollectFlash(position: Vec3, color: number): void;
  spawnBurst(position: Vec3, color: number): void;
  triggerShake(intensity: number, durationMs: number): void;
  setDissonance(amount: number): void;
  getShakeOffset(): THREE.Vector2;
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

function flashIntensityAt(ageSec: number): number {
  const peak = visual.flash.peakMs / 1000;
  const dur = visual.flash.durationMs / 1000;
  if (ageSec < 0 || ageSec > dur) return visual.flash.endIntensity;
  if (ageSec < peak) {
    const t = ageSec / peak;
    return (
      visual.flash.startIntensity +
      (visual.flash.peakIntensity - visual.flash.startIntensity) * t
    );
  }
  const t = (ageSec - peak) / (dur - peak);
  return (
    visual.flash.peakIntensity +
    (visual.flash.endIntensity - visual.flash.peakIntensity) * t
  );
}

export function createVfxSystem(
  scene: THREE.Scene,
  cameraGroup: THREE.Object3D,
): VfxSystem {
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

  const flashGeo = new THREE.SphereGeometry(visual.flash.sphereRadius, 16, 16);
  const flashes: FlashInstance[] = [];

  const burstGeo = new THREE.SphereGeometry(visual.burst.sphereRadius, 6, 6);
  const burst: BurstParticle[] = [];
  for (let i = 0; i < visual.burst.poolSize; i++) {
    const mat = new THREE.MeshBasicMaterial({
      color: visual.palette.collectible,
      transparent: true,
      opacity: 0,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });
    const mesh = new THREE.Mesh(burstGeo, mat);
    mesh.visible = false;
    scene.add(mesh);
    burst.push({
      mesh,
      velocity: new THREE.Vector3(),
      ageSec: 0,
      active: false,
    });
  }

  const playerPosition = new THREE.Vector3();
  const playerVelocity = new THREE.Vector3();
  let lastTrailWrite = 0;
  let lastPlayerWritePos = new THREE.Vector3();
  let trailInitialized = false;
  let dissonance = 0;
  let totalTime = 0;

  const shakeOffset = new THREE.Vector2(0, 0);
  const collectShake = { intensity: 0, time: 0, duration: 0, active: false };
  const anomalyShake = {
    intensity: visual.shake.anomalyIntensity,
    active: false,
    fadeTime: 0,
  };

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

  function spawnCollectFlash(position: Vec3, color: number) {
    const mat = new THREE.MeshStandardMaterial({
      color,
      emissive: color,
      emissiveIntensity: visual.flash.startIntensity,
      transparent: true,
      opacity: 1,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });
    const mesh = new THREE.Mesh(flashGeo, mat);
    mesh.position.set(position.x, position.y, position.z);
    scene.add(mesh);
    flashes.push({
      mesh,
      ageSec: 0,
      durationSec: visual.flash.durationMs / 1000,
    });
  }

  function spawnBurst(position: Vec3, color: number) {
    let activated = 0;
    for (let i = 0; i < burst.length && activated < visual.burst.activePerBurst; i++) {
      if (burst[i].active) continue;
      const p = burst[i];
      p.active = true;
      p.ageSec = 0;
      const angle = (activated * Math.PI) / 3;
      p.velocity.set(
        Math.cos(angle) * visual.burst.initialSpeed,
        0,
        Math.sin(angle) * visual.burst.initialSpeed,
      );
      p.mesh.position.set(position.x, position.y, position.z);
      p.mesh.visible = true;
      p.mesh.scale.setScalar(1);
      (p.mesh.material as THREE.MeshBasicMaterial).color.setHex(color);
      (p.mesh.material as THREE.MeshBasicMaterial).opacity = 1;
      activated++;
    }
  }

  function triggerShake(intensity: number, durationMs: number) {
    collectShake.intensity = intensity;
    collectShake.time = 0;
    collectShake.duration = durationMs / 1000;
    collectShake.active = true;
  }

  function setDissonance(amount: number) {
    dissonance = Math.max(0, Math.min(1, amount));
    if (dissonance > 0) {
      anomalyShake.active = true;
      anomalyShake.intensity = visual.shake.anomalyIntensity;
      anomalyShake.fadeTime = 0;
    }
  }

  function getShakeOffset(): THREE.Vector2 {
    return shakeOffset.clone();
  }

  function setPlayerPosition(position: Vec3) {
    playerPosition.set(position.x, position.y, position.z);
  }

  function setPlayerVelocity(velocity: Vec3) {
    playerVelocity.set(velocity.x, velocity.y, velocity.z);
  }

  const updatable: Updatable = {
    update(dt: number) {
      totalTime += dt;
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

      for (let i = flashes.length - 1; i >= 0; i--) {
        const f = flashes[i];
        f.ageSec += dt;
        if (f.ageSec >= f.durationSec) {
          scene.remove(f.mesh);
          (f.mesh.material as THREE.Material).dispose();
          flashes.splice(i, 1);
          continue;
        }
        (f.mesh.material as THREE.MeshStandardMaterial).emissiveIntensity =
          flashIntensityAt(f.ageSec);
      }

      for (const p of burst) {
        if (!p.active) continue;
        p.ageSec += dt;
        const t = p.ageSec / (visual.burst.durationMs / 1000);
        if (t >= 1) {
          p.active = false;
          p.mesh.visible = false;
          continue;
        }
        p.mesh.position.x += p.velocity.x * dt;
        p.mesh.position.z += p.velocity.z * dt;
        p.velocity.multiplyScalar(visual.burst.frictionPerFrame);
        const k = 1 - t;
        p.mesh.scale.setScalar(k);
        (p.mesh.material as THREE.MeshBasicMaterial).opacity = k;
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

      let offX = 0;
      let offY = 0;

      if (collectShake.active) {
        collectShake.time += dt;
        if (collectShake.time >= collectShake.duration) {
          collectShake.active = false;
        } else {
          const decay = Math.exp(-collectShake.time / collectShake.duration);
          const noise = Math.sin(collectShake.time * visual.shake.collectNoiseFreq);
          const amp = collectShake.intensity * decay;
          offX += amp * noise;
          offY += amp * Math.cos(collectShake.time * visual.shake.collectNoiseFreq);
        }
      }

      if (anomalyShake.active) {
        if (dissonance > 0) {
          const phase = totalTime * 2 * Math.PI * visual.shake.anomalyFreq;
          offX += anomalyShake.intensity * Math.sin(phase);
          offY += anomalyShake.intensity * Math.cos(phase);
        } else {
          anomalyShake.fadeTime += dt;
          const fade = Math.max(
            0,
            1 - anomalyShake.fadeTime / visual.shake.anomalyFadeOutSec,
          );
          if (fade <= 0) {
            anomalyShake.active = false;
          } else {
            const phase = totalTime * 2 * Math.PI * visual.shake.anomalyFreq;
            offX += anomalyShake.intensity * fade * Math.sin(phase);
            offY += anomalyShake.intensity * fade * Math.cos(phase);
          }
        }
      }

      shakeOffset.set(offX, offY);
      cameraGroup.position.x = shakeOffset.x;
      cameraGroup.position.y = shakeOffset.y;
    },
  };

  return {
    updatable,
    spawnRipple,
    spawnCollectFlash,
    spawnBurst,
    triggerShake,
    setDissonance,
    getShakeOffset,
    trailGroup,
    setPlayerPosition,
    setPlayerVelocity,
  };
}
