// src/presentation/cameraRig.ts
import * as THREE from 'three';
import type { Updatable, Vec3 } from '../types/index.ts';
import { camera as camCfg } from '../content/tuning.ts';

export interface CameraRigDeps {
  camera: THREE.PerspectiveCamera;
  getTarget: () => Vec3;
  getVelocity: () => Vec3;
}

export function createCameraRig(deps: CameraRigDeps): Updatable {
  const target = new THREE.Vector3();
  const lookTarget = new THREE.Vector3();
  const currentPos = new THREE.Vector3();
  const currentLook = new THREE.Vector3();

  return {
    update(_dt: number) {
      const t = deps.getTarget();
      const v = deps.getVelocity();

      target.set(
        t.x,
        t.y + camCfg.height,
        t.z + camCfg.distance,
      );

      lookTarget.set(
        t.x + v.x * camCfg.lookAheadDistance,
        t.y,
        t.z + v.z * camCfg.lookAheadDistance,
      );

      if (currentPos.lengthSq() === 0) {
        currentPos.copy(target);
        currentLook.copy(lookTarget);
      }

      currentPos.lerp(target, camCfg.followLerp);
      currentLook.lerp(lookTarget, camCfg.lookAheadLerp);

      deps.camera.position.copy(currentPos);
      deps.camera.lookAt(currentLook);
    },
  };
}
