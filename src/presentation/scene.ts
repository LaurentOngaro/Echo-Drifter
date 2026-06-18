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
  updatables: Updatable[];
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
  const vs = visual.camera.viewSize;
  const camera = new THREE.OrthographicCamera(
    (-vs * aspect) / 2,
    (vs * aspect) / 2,
    vs / 2,
    -vs / 2,
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

  const ground = createGround();
  scene.add(ground);

  const updatables: Updatable[] = [];

  function resize() {
    const width = window.innerWidth;
    const height = window.innerHeight;
    renderer.setSize(width, height);
    const a = width / height;
    const v = visual.camera.viewSize;
    camera.left = (-v * a) / 2;
    camera.right = (v * a) / 2;
    camera.top = v / 2;
    camera.bottom = -v / 2;
    camera.updateProjectionMatrix();
  }

  resize();

  return {
    renderer,
    camera,
    cameraGroup,
    scene,
    resize,
    updatables,
  };
}
