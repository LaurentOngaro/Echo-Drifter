// src/presentation/meshes.ts
import * as THREE from 'three';
import { palette } from '../content/tuning.ts';

export function createPlayerOrb(): THREE.Mesh {
  const geo = new THREE.SphereGeometry(0.55, 48, 48);
  const mat = new THREE.MeshStandardMaterial({
    color: palette.cyan,
    emissive: palette.cyan,
    emissiveIntensity: 1.2,
    roughness: 0.25,
    metalness: 0.0,
  });
  const mesh = new THREE.Mesh(geo, mat);
  return mesh;
}

export function createHalo(size: number, color: number): THREE.Mesh {
  const geo = new THREE.RingGeometry(size * 0.85, size, 64);
  const mat = new THREE.MeshBasicMaterial({
    color,
    transparent: true,
    opacity: 0.35,
    side: THREE.DoubleSide,
  });
  const mesh = new THREE.Mesh(geo, mat);
  mesh.rotation.x = -Math.PI / 2;
  return mesh;
}

export function createFragmentOrb(color: number): THREE.Mesh {
  const geo = new THREE.SphereGeometry(0.32, 32, 32);
  const mat = new THREE.MeshStandardMaterial({
    color,
    emissive: color,
    emissiveIntensity: 1.4,
    roughness: 0.2,
  });
  return new THREE.Mesh(geo, mat);
}

export function createAnomalyBloom(color: number): THREE.Mesh {
  const geo = new THREE.SphereGeometry(1.2, 48, 48);
  const mat = new THREE.MeshStandardMaterial({
    color,
    emissive: color,
    emissiveIntensity: 0.9,
    transparent: true,
    opacity: 0.55,
    roughness: 0.5,
  });
  return new THREE.Mesh(geo, mat);
}

export function createRipple(position: THREE.Vector3, color: number): THREE.Mesh {
  const geo = new THREE.RingGeometry(0.1, 0.18, 64);
  const mat = new THREE.MeshBasicMaterial({
    color,
    transparent: true,
    opacity: 0.9,
    side: THREE.DoubleSide,
  });
  const mesh = new THREE.Mesh(geo, mat);
  mesh.position.copy(position);
  mesh.rotation.x = -Math.PI / 2;
  return mesh;
}

export function createGround(): THREE.Mesh {
  const geo = new THREE.CircleGeometry(60, 96);
  const mat = new THREE.MeshBasicMaterial({
    color: palette.background,
    transparent: true,
    opacity: 0.6,
  });
  const mesh = new THREE.Mesh(geo, mat);
  mesh.rotation.x = -Math.PI / 2;
  mesh.position.y = -2;
  return mesh;
}
