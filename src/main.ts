// src/main.ts
import './style.css';
import * as THREE from 'three';
import { createEchoScene } from './presentation/scene.ts';
import { createGameLoop } from './core/gameLoop.ts';
import { createEventBus } from './core/events.ts';
import { createWorld, resetWorld } from './core/world.ts';
import { createKeyboardInput } from './gameplay/input.ts';
import { updateDrift } from './gameplay/playerController.ts';
import { createCameraRig } from './presentation/cameraRig.ts';
import {
  createPlayerOrb,
  createFragmentOrb,
  createHalo,
  createAnomalyBloom,
} from './presentation/meshes.ts';
import { createVfxSystem } from './presentation/vfx.ts';
import {
  spawnFragments,
  checkCollection,
  markCollected,
} from './gameplay/collectibleSystem.ts';
import { findNearestUncollected } from './gameplay/guidanceSystem.ts';
import { spawnAnomalies, updateAnomalies } from './gameplay/anomalySystem.ts';
import { createAudioDirector } from './audio/audioDirector.ts';
import { scaleHz } from './content/scale.ts';
import { createHud } from './ui/hud.ts';
import { resetWorldAnomalies } from './gameplay/anomalySystem.ts';
import type { Updatable, Vec3 } from './types/index.ts';

function main() {
  const canvas = document.querySelector<HTMLCanvasElement>('#app-canvas');
  if (!canvas) {
    throw new Error('Canvas #app-canvas introuvable');
  }

  const bus = createEventBus();
  const world = createWorld();
  const echoScene = createEchoScene(canvas);
  const loop = createGameLoop();
  const input = createKeyboardInput();
  const vfx = createVfxSystem(echoScene.scene);
  const audio = createAudioDirector();

  spawnFragments(world);
  spawnAnomalies(world);

  const playerMesh = createPlayerOrb();
  echoScene.scene.add(playerMesh);

  const fragmentMeshes = new Map<string, THREE.Mesh>();
  const fragmentHalos = new Map<string, THREE.Mesh>();
  const fragmentBaseScale = new Map<string, number>();
  const anomalyMeshes = new Map<string, THREE.Mesh>();

  function populateWorldMeshes() {
    for (const f of world.fragments) {
      const mesh = createFragmentOrb(0xffe1a8);
      mesh.position.set(f.position.x, f.position.y, f.position.z);
      echoScene.scene.add(mesh);
      fragmentMeshes.set(f.id, mesh);
      fragmentBaseScale.set(f.id, mesh.scale.x);

      const halo = createHalo(0.6, 0xffe1a8);
      halo.position.set(f.position.x, f.position.y - 0.5, f.position.z);
      echoScene.scene.add(halo);
      fragmentHalos.set(f.id, halo);
    }
    for (const a of world.anomalies) {
      const mesh = createAnomalyBloom(0xff4f9f);
      mesh.position.set(a.position.x, a.position.y, a.position.z);
      mesh.scale.setScalar(a.radius);
      echoScene.scene.add(mesh);
      anomalyMeshes.set(a.id, mesh);
    }
  }

  function clearWorldMeshes() {
    for (const m of fragmentMeshes.values()) {
      echoScene.scene.remove(m);
      (m.geometry as THREE.BufferGeometry).dispose();
      (m.material as THREE.Material).dispose();
    }
    fragmentMeshes.clear();
    for (const h of fragmentHalos.values()) {
      echoScene.scene.remove(h);
      (h.geometry as THREE.BufferGeometry).dispose();
      (h.material as THREE.Material).dispose();
    }
    fragmentHalos.clear();
    fragmentBaseScale.clear();
    for (const m of anomalyMeshes.values()) {
      echoScene.scene.remove(m);
      (m.geometry as THREE.BufferGeometry).dispose();
      (m.material as THREE.Material).dispose();
    }
    anomalyMeshes.clear();
  }

  populateWorldMeshes();

  bus.on('MUSIC_LAYER_UNLOCKED', (e) => {
    audio.unlock(e.layer);
    bus.emit({ type: 'MUSIC_STATE_CHANGED', state: e.layer });
  });

  bus.on('DISSONANCE_CHANGED', (e) => {
    audio.setDissonance(e.amount);
  });

  bus.on('COLLECTED', (_e) => {
    audio.playCollectTone(scaleHz(7 + (world.fragmentsCollected % 4)));
  });

  const rig = createCameraRig({
    camera: echoScene.camera,
    getTarget: () => world.playerPosition,
    getVelocity: () => world.playerVelocity,
  });

  const playerSync: Updatable = {
    update(_dt: number) {
      playerMesh.position.set(
        world.playerPosition.x,
        world.playerPosition.y,
        world.playerPosition.z,
      );
      const flick = 1 + (Math.random() - 0.5) * 0.04 * world.dissonance;
      playerMesh.scale.setScalar(flick);
    },
  };

  const playerUpdater: Updatable = {
    update(dt: number) {
      const result = updateDrift(
        { position: world.playerPosition, velocity: world.playerVelocity },
        input.state,
        dt,
        world.dissonance,
      );
      world.playerPosition = result.position;
      world.playerVelocity = result.velocity;
    },
  };

  const collectionSystem: Updatable = {
    update(_dt: number) {
      const collected = checkCollection(world);
      if (!collected) return;
      markCollected(world, collected);
      const pos: Vec3 = { ...collected.position };
      vfx.spawnRipple(pos, 0xffe1a8);
      const mesh = fragmentMeshes.get(collected.id);
      const halo = fragmentHalos.get(collected.id);
      if (mesh) mesh.visible = false;
      if (halo) halo.visible = false;
      bus.emit({ type: 'COLLECTED', id: collected.id, position: pos });
      bus.emit({ type: 'MUSIC_LAYER_UNLOCKED', layer: collected.unlocks });
    },
  };

  const guidanceVisual: Updatable = {
    update(t: number) {
      const nearest = findNearestUncollected(world);
      for (const [id, mesh] of fragmentMeshes) {
        const frag = world.fragments.find((f) => f.id === id);
        if (!frag || frag.collected) continue;
        const halo = fragmentHalos.get(id);
        const baseScale = fragmentBaseScale.get(id) ?? 1;
        const isNearest = nearest && nearest.fragment.id === id;
        if (isNearest) {
          const pulse = 0.18 + 0.18 * Math.sin(t * 4);
          mesh.scale.setScalar(baseScale * (1 + pulse));
          if (halo) {
            halo.scale.setScalar(1 + pulse * 1.5);
            (halo.material as THREE.MeshBasicMaterial).opacity = 0.5 + pulse * 0.3;
          }
        } else {
          mesh.scale.setScalar(baseScale);
          if (halo) {
            halo.scale.setScalar(1);
            (halo.material as THREE.MeshBasicMaterial).opacity = 0.25;
          }
        }
      }
    },
  };

  const anomalyUpdater: Updatable = {
    update(dt: number) {
      updateAnomalies(world, dt, bus);
      vfx.setDissonance(world.dissonance);
      for (const a of world.anomalies) {
        const mesh = anomalyMeshes.get(a.id);
        if (!mesh) continue;
        const pulse = 1 + 0.15 * Math.sin(a.phase);
        const dissonanceScale = 1 + 0.25 * world.dissonance;
        mesh.scale.setScalar(a.radius * pulse * dissonanceScale);
        const mat = mesh.material as THREE.MeshStandardMaterial;
        mat.opacity = 0.45 + 0.25 * Math.sin(a.phase * 1.4);
        mat.emissiveIntensity = 0.7 + 0.5 * world.dissonance;
      }
    },
  };

  echoScene.updatables.push(
    playerUpdater,
    playerSync,
    rig,
    vfx.updatable,
    collectionSystem,
    guidanceVisual,
    anomalyUpdater,
  );

  function resetGame() {
    clearWorldMeshes();
    resetWorld(world);
    resetWorldAnomalies(world);
    spawnFragments(world);
    spawnAnomalies(world);
    populateWorldMeshes();
    audio.stop();
    audio.startBaseLayers();
    bus.emit({ type: 'RESET' });
  }

  window.addEventListener('keydown', (e) => {
    if (e.code === 'KeyR') {
      resetGame();
    }
  });

  loop.onUpdate((dt) => {
    for (const u of echoScene.updatables) {
      u.update(dt);
    }
    echoScene.renderer.render(echoScene.scene, echoScene.camera);
    hud.update();
  });

  window.addEventListener('resize', echoScene.resize);

  const hud = createHud(world, bus, audio, resetGame);

  setupStartOverlay(audio, () => loop.start());
}

function setupStartOverlay(
  audio: ReturnType<typeof createAudioDirector>,
  onStart: () => void,
) {
  const overlay = document.createElement('div');
  overlay.id = 'start-overlay';
  overlay.innerHTML = `
    <div class="start-card">
      <h1>Echo Drifter</h1>
      <p class="lead">Drift through a synthwave space and rebuild a living track.</p>
      <ul>
        <li>WASD or arrow keys to drift</li>
        <li>Collect the glowing fragments to unlock musical layers</li>
        <li>Avoid the pink blooms - they break the harmony</li>
        <li>Press R to restart</li>
      </ul>
      <p class="cta">Click or press any key to begin</p>
    </div>
  `;
  document.body.appendChild(overlay);

  let started = false;

  async function begin() {
    if (started) return;
    started = true;
    overlay.classList.add('fading');
    audio.init();
    await audio.resume();
    audio.startBaseLayers();
    setTimeout(() => overlay.remove(), 600);
    onStart();
  }

  overlay.addEventListener('click', begin, { once: true });
  window.addEventListener(
    'keydown',
    (e) => {
      if (e.code === 'KeyR') return;
      begin();
    },
    { once: true },
  );
}

main();
