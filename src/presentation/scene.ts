// src/presentation/scene.ts
import * as THREE from 'three';
import type { Updatable } from '../types/index.ts';
import { visual } from '../content/tuning.ts';
import { createGround } from './meshes.ts';

export interface EchoScene {
  renderer: THREE.WebGLRenderer;
  camera: THREE.OrthographicCamera;
  cameraGroup: THREE.Group;
  scene: THREE.Scene;
  resize: () => void;
  setViewSize(newSize: number): void;
  getViewSize(): number;
  updatables: Updatable[];
}

function createStarField(): THREE.Points {
  let seed = 42;
  function nextFloat() {
    seed = (seed * 1664525 + 1013904223) & 0xffffffff;
    return (seed >>> 0) / 0xffffffff;
  }

  const count = 60;
  const positions = new Float32Array(count * 3);
  for (let i = 0; i < count; i++) {
    const x = -30 + nextFloat() * 60;
    const y = -20 + nextFloat() * 40;
    const z = -5;
    positions[i * 3 + 0] = x;
    positions[i * 3 + 1] = y;
    positions[i * 3 + 2] = z;
  }

  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));

  const mat = new THREE.PointsMaterial({
    color: 0xe8e0f0,
    size: 0.04,
    transparent: true,
    opacity: 0.4,
    sizeAttenuation: false,
  });

  return new THREE.Points(geo, mat);
}

export function createEchoScene(canvas: HTMLCanvasElement): EchoScene {
  const renderer = new THREE.WebGLRenderer({
    canvas,
    antialias: true,
  });
  renderer.setPixelRatio(window.devicePixelRatio);
  renderer.setClearColor(visual.background, 1);

  const scene = new THREE.Scene();

  const aspect = window.innerWidth / window.innerHeight;
  let currentViewSize: number = visual.camera.viewSize;
  const camera = new THREE.OrthographicCamera(
    (-currentViewSize * aspect) / 2,
    (currentViewSize * aspect) / 2,
    currentViewSize / 2,
    -currentViewSize / 2,
    visual.camera.near,
    visual.camera.far,
  );
  camera.position.set(0, visual.camera.fixedHeight, 0);
  camera.up.set(0, 0, -1);
  camera.lookAt(0, 0, 0);

  const cameraGroup = new THREE.Group();
  cameraGroup.add(camera);
  scene.add(cameraGroup);

  const ambient = new THREE.AmbientLight(
    visual.lights.ambient.color,
    visual.lights.ambient.intensity,
  );
  scene.add(ambient);

  const point = new THREE.PointLight(
    visual.lights.point.color,
    visual.lights.point.intensity,
    visual.lights.point.distance,
  );
  point.position.set(
    visual.lights.point.position[0],
    visual.lights.point.position[1],
    visual.lights.point.position[2],
  );
  scene.add(point);

  const accent = new THREE.PointLight(
    visual.lights.accent.color,
    visual.lights.accent.intensity,
    visual.lights.accent.distance,
  );
  accent.position.set(-2, 1, 2);
  scene.add(accent);

  const stars = createStarField();
  scene.add(stars);

  const ground = createGround();
  scene.add(ground);

  const updatables: Updatable[] = [];

  function applyViewSize() {
    const a = window.innerWidth / window.innerHeight;
    camera.left = (-currentViewSize * a) / 2;
    camera.right = (currentViewSize * a) / 2;
    camera.top = currentViewSize / 2;
    camera.bottom = -currentViewSize / 2;
    camera.updateProjectionMatrix();
  }

  function resize() {
    const width = window.innerWidth;
    const height = window.innerHeight;
    renderer.setSize(width, height);
    applyViewSize();
  }

  function setViewSize(newSize: number) {
    const min = visual.camera.viewSizeMin;
    const max = visual.camera.viewSizeMax;
    currentViewSize = Math.max(min, Math.min(max, newSize));
    applyViewSize();
  }

  function getViewSize(): number {
    return currentViewSize;
  }

  resize();

  return {
    renderer,
    camera,
    cameraGroup,
    scene,
    resize,
    setViewSize,
    getViewSize,
    updatables,
  };
}
