// src/presentation/meshes.ts
import * as THREE from 'three';
import type { Updatable } from '../types/index.ts';
import { visual } from '../content/tuning.ts';

export function createPlayerOrb(): THREE.Mesh {
  const geo = new THREE.SphereGeometry(0.55, 48, 48);
  const mat = new THREE.MeshStandardMaterial({
    color: visual.palette.player,
    emissive: visual.palette.player,
    emissiveIntensity: 0.6,
    roughness: 0.4,
    metalness: 0,
  });
  const mesh = new THREE.Mesh(geo, mat);
  mesh.userData.pulseBaseScale = 1.0;
  mesh.userData.rotationZMax = visual.orb.playerRotationZMax;
  return mesh;
}

export function createPlayerGlow(): THREE.Mesh {
  const geo = new THREE.PlaneGeometry(1.6, 1.6);
  const mat = new THREE.MeshBasicMaterial({
    color: visual.palette.playerGlow,
    transparent: true,
    opacity: 0.35,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  });
  const mesh = new THREE.Mesh(geo, mat);
  mesh.userData.isBillboard = true;
  return mesh;
}

export function createCollectibleOrb(): THREE.Mesh {
  const geo = new THREE.SphereGeometry(0.32, 32, 32);
  const mat = new THREE.MeshStandardMaterial({
    color: visual.palette.collectible,
    emissive: visual.palette.collectible,
    emissiveIntensity: 0.5,
    roughness: 0.5,
    metalness: 0,
  });
  const mesh = new THREE.Mesh(geo, mat);
  mesh.userData.pulseBaseScale = 1.0;
  mesh.userData.rotationY = visual.orb.collectibleRotationY;
  return mesh;
}

export function createCollectibleGlow(): THREE.Mesh {
  const geo = new THREE.PlaneGeometry(1.0, 1.0);
  const mat = new THREE.MeshBasicMaterial({
    color: visual.palette.collectibleGlow,
    transparent: true,
    opacity: 0.4,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  });
  const mesh = new THREE.Mesh(geo, mat);
  mesh.userData.isBillboard = true;
  return mesh;
}

export function createCollectibleHalo(): THREE.Mesh {
  const geo = new THREE.TorusGeometry(0.6, 0.03, 8, 48);
  const mat = new THREE.MeshBasicMaterial({
    color: visual.palette.collectible,
    transparent: true,
    opacity: 0.35,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  });
  const mesh = new THREE.Mesh(geo, mat);
  mesh.rotation.x = -Math.PI / 2;
  mesh.position.y = -0.5;
  return mesh;
}

export function createAnomalyBloom(): THREE.Mesh {
  const geo = new THREE.SphereGeometry(1.2, 48, 48);
  const mat = new THREE.MeshStandardMaterial({
    color: visual.palette.anomaly,
    emissive: visual.palette.anomaly,
    emissiveIntensity: 0.4,
    roughness: 0.6,
    metalness: 0,
    transparent: true,
    opacity: 0.8,
  });
  return new THREE.Mesh(geo, mat);
}

export function createAnomalyGlow(): THREE.Mesh {
  const geo = new THREE.PlaneGeometry(3.0, 3.0);
  const mat = new THREE.MeshBasicMaterial({
    color: visual.palette.anomaly,
    transparent: true,
    opacity: 0.2,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  });
  const mesh = new THREE.Mesh(geo, mat);
  mesh.userData.isBillboard = true;
  return mesh;
}

export function createRipple(color: number): THREE.Mesh {
  const geo = new THREE.TorusGeometry(0.5, visual.ripple.tubeRadius, 8, 48);
  const mat = new THREE.MeshBasicMaterial({
    color,
    transparent: true,
    opacity: 1,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  });
  const mesh = new THREE.Mesh(geo, mat);
  mesh.rotation.x = -Math.PI / 2;
  return mesh;
}

export function createTrailSphere(): THREE.Mesh {
  const geo = new THREE.SphereGeometry(visual.trail.sphereRadius, 8, 8);
  const mat = new THREE.MeshBasicMaterial({
    color: visual.palette.player,
    transparent: true,
    opacity: 0,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  });
  const mesh = new THREE.Mesh(geo, mat);
  return mesh;
}

export function createGround(): THREE.Mesh {
  const geo = new THREE.CircleGeometry(visual.ground.radius, 96);
  const mat = new THREE.MeshBasicMaterial({
    color: visual.ground.color,
    transparent: true,
    opacity: visual.ground.opacity,
  });
  const mesh = new THREE.Mesh(geo, mat);
  mesh.rotation.x = -Math.PI / 2;
  mesh.position.y = -2;
  return mesh;
}

export function createBillboardRegistry(): {
  register(mesh: THREE.Mesh): void;
  setCamera(c: THREE.Camera): void;
  updatable: Updatable;
} {
  const billboards: THREE.Mesh[] = [];
  let camera: THREE.Camera | null = null;
  return {
    register(mesh: THREE.Mesh) {
      billboards.push(mesh);
    },
    setCamera(c: THREE.Camera) {
      camera = c;
    },
    updatable: {
      update(_dt: number) {
        if (!camera) return;
        for (const mesh of billboards) {
          mesh.quaternion.copy(camera.quaternion);
        }
      },
    },
  };
}
