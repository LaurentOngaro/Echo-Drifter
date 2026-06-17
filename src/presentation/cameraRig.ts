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
      const targetY = t.y;
      cam.position.x += (targetX - cam.position.x) * k;
      cam.position.y += (targetY - cam.position.y) * k;
      cam.position.z = cfg.fixedZ;

      const lookX = t.x + v.x * cfg.maxLookAhead;
      const lookY = t.y;
      const lookZ = 0;
      lookAt.set(lookX, lookY, lookZ);
      cam.lookAt(lookAt);
    },
  };
}
