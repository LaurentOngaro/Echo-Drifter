// src/presentation/scene.ts
import * as THREE from 'three';
import type { Updatable } from '../types/index.ts';
import { palette } from '../content/tuning.ts';
import { createGround } from './meshes.ts';

export interface EchoScene {
  renderer: THREE.WebGLRenderer;
  camera: THREE.PerspectiveCamera;
  scene: THREE.Scene;
  resize: () => void;
  updatables: Updatable[];
}

export function createEchoScene(canvas: HTMLCanvasElement): EchoScene {
  const renderer = new THREE.WebGLRenderer({
    canvas,
    antialias: true,
  });
  renderer.setPixelRatio(window.devicePixelRatio);
  renderer.setClearColor(palette.background, 1);

  const scene = new THREE.Scene();
  scene.fog = new THREE.FogExp2(palette.background, 0.035);

  const camera = new THREE.PerspectiveCamera(
    62,
    window.innerWidth / window.innerHeight,
    0.1,
    200,
  );
  camera.position.set(0, 3, 8);

  const ambient = new THREE.AmbientLight(palette.violet, 0.45);
  scene.add(ambient);

  const pointViolet = new THREE.PointLight(palette.violet, 1.1, 40);
  pointViolet.position.set(-6, 4, -2);
  scene.add(pointViolet);

  const pointCyan = new THREE.PointLight(palette.cyan, 1.1, 40);
  pointCyan.position.set(6, 4, 2);
  scene.add(pointCyan);

  const ground = createGround();
  scene.add(ground);

  const gridUpdatables: Updatable[] = [];

  function resize() {
    const width = window.innerWidth;
    const height = window.innerHeight;
    renderer.setSize(width, height);
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
  }

  resize();

  return {
    renderer,
    camera,
    scene,
    resize,
    updatables: gridUpdatables,
  };
}
