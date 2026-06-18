// src/presentation/cameraRig.ts
import * as THREE from 'three';
import type { Updatable, Vec3 } from '../types/index.ts';
import { visual } from '../content/tuning.ts';

export interface CameraRigDeps {
  camera: THREE.PerspectiveCamera;
  getTarget: () => Vec3;
  getVelocity: () => Vec3;
}

export function createCameraRig(deps: CameraRigDeps): Updatable {
  const lookAt = new THREE.Vector3();

  return {
    update(dt: number) {
      const t = deps.getTarget();
      const v = deps.getVelocity();
      const cam = deps.camera;
      const cfg = visual.camera;

      const cappedDt = Math.min(dt, 1 / 30);
      const k = (1 - cfg.damping) * cappedDt * 60;

      const targetX = t.x;
      const targetZ = t.z;
      cam.position.x += (targetX - cam.position.x) * k;
      cam.position.z += (targetZ - cam.position.z) * k;
      cam.position.y = cfg.fixedHeight;

      const lookX = t.x + v.x * cfg.maxLookAhead;
      const lookZ = t.z + v.z * cfg.maxLookAhead;
      lookAt.set(lookX, 0, lookZ);
      cam.lookAt(lookAt);
    },
  };
}
