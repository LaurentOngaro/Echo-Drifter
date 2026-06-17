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
  createPlayerGlow,
  createCollectibleOrb,
  createCollectibleGlow,
  createCollectibleHalo,
  createAnomalyBloom,
  createAnomalyGlow,
  createBillboardRegistry,
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
import { drift, visual } from './content/tuning.ts';
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
  const billboards = createBillboardRegistry();
  billboards.setCamera(echoScene.camera);

  spawnFragments(world);
  spawnAnomalies(world);

  const playerGroup = new THREE.Group();
  const playerOrb = createPlayerOrb();
  const playerGlow = createPlayerGlow();
  playerGroup.add(playerOrb);
  playerGroup.add(playerGlow);
  billboards.register(playerGlow);
  echoScene.scene.add(playerGroup);

  interface FragmentEntry {
    group: THREE.Group;
    orb: THREE.Mesh;
    halo: THREE.Mesh;
    glow: THREE.Mesh;
    baseScale: number;
  }
  interface AnomalyEntry {
    group: THREE.Group;
    bloom: THREE.Mesh;
    glow: THREE.Mesh;
  }
  const fragmentEntries = new Map<string, FragmentEntry>();
  const anomalyEntries = new Map<string, AnomalyEntry>();

  function populateWorldMeshes() {
    for (const f of world.fragments) {
      const group = new THREE.Group();
      const orb = createCollectibleOrb();
      const halo = createCollectibleHalo();
      const glow = createCollectibleGlow();
      group.add(orb);
      group.add(halo);
      group.add(glow);
      group.position.set(f.position.x, f.position.y, f.position.z);
      echoScene.scene.add(group);
      billboards.register(glow);
      fragmentEntries.set(f.id, {
        group,
        orb,
        halo,
        glow,
        baseScale: orb.scale.x,
      });
    }
    for (const a of world.anomalies) {
      const group = new THREE.Group();
      const bloom = createAnomalyBloom();
      const glow = createAnomalyGlow();
      group.add(bloom);
      group.add(glow);
      group.position.set(a.position.x, a.position.y, a.position.z);
      group.scale.setScalar(a.radius);
      echoScene.scene.add(group);
      billboards.register(glow);
      anomalyEntries.set(a.id, { group, bloom, glow });
    }
  }

  function clearWorldMeshes() {
    for (const e of fragmentEntries.values()) {
      echoScene.scene.remove(e.group);
      e.orb.geometry.dispose();
      (e.orb.material as THREE.Material).dispose();
      e.halo.geometry.dispose();
      (e.halo.material as THREE.Material).dispose();
      e.glow.geometry.dispose();
      (e.glow.material as THREE.Material).dispose();
    }
    fragmentEntries.clear();
    for (const e of anomalyEntries.values()) {
      echoScene.scene.remove(e.group);
      e.bloom.geometry.dispose();
      (e.bloom.material as THREE.Material).dispose();
      e.glow.geometry.dispose();
      (e.glow.material as THREE.Material).dispose();
    }
    anomalyEntries.clear();
  }

  populateWorldMeshes();

  bus.on('MUSIC_LAYER_UNLOCKED', (e) => {
    audio.unlock(e.layer);
    bus.emit({ type: 'MUSIC_STATE_CHANGED', state: e.layer });
  });

  bus.on('DISSONANCE_CHANGED', (e) => {
    audio.setDissonance(e.amount);
  });

  bus.on('COLLECTED', () => {
    audio.playCollectTone(scaleHz(7 + (world.fragmentsCollected % 4)));
  });

  const rig = createCameraRig({
    camera: echoScene.camera,
    getTarget: () => world.playerPosition,
    getVelocity: () => world.playerVelocity,
  });

  let totalTime = 0;

  const playerSync: Updatable = {
    update(dt: number) {
      totalTime += dt;
      playerGroup.position.set(
        world.playerPosition.x,
        world.playerPosition.y,
        world.playerPosition.z,
      );
      vfx.setPlayerPosition(world.playerPosition);
      vfx.setPlayerVelocity(world.playerVelocity);
      const speed = Math.hypot(
        world.playerVelocity.x,
        world.playerVelocity.y,
        world.playerVelocity.z,
      );
      const speedNorm = Math.min(1, speed / drift.maxSpeed);
      const pulse = 1 + visual.orb.pulseAmplitude * Math.sin(totalTime * 2 * Math.PI * visual.orb.pulseHz);
      playerOrb.scale.setScalar(pulse);
      playerOrb.rotation.z += speedNorm * visual.orb.playerRotationZMax * dt;
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
      vfx.spawnRipple(pos, visual.palette.collectible);
      const entry = fragmentEntries.get(collected.id);
      if (entry) entry.group.visible = false;
      bus.emit({ type: 'COLLECTED', id: collected.id, position: pos });
      bus.emit({ type: 'MUSIC_LAYER_UNLOCKED', layer: collected.unlocks });
    },
  };

  const guidanceVisual: Updatable = {
    update(t: number) {
      const nearest = findNearestUncollected(world);
      for (const [id, entry] of fragmentEntries) {
        const frag = world.fragments.find((f) => f.id === id);
        if (!frag || frag.collected) continue;
        const isNearest = nearest && nearest.fragment.id === id;
        const targetScale = entry.baseScale * (1 + (isNearest ? 0.2 * Math.sin(t * 4) : 0));
        entry.orb.scale.lerp(new THREE.Vector3(targetScale, targetScale, targetScale), 0.1);
        const haloMat = entry.halo.material as THREE.MeshBasicMaterial;
        const glowMat = entry.glow.material as THREE.MeshBasicMaterial;
        const targetHaloOpacity = isNearest ? 0.5 : 0.25;
        const targetGlowOpacity = isNearest ? 0.55 : 0.4;
        haloMat.opacity = THREE.MathUtils.lerp(haloMat.opacity, targetHaloOpacity, 0.1);
        glowMat.opacity = THREE.MathUtils.lerp(glowMat.opacity, targetGlowOpacity, 0.1);
      }
    },
  };

  const fragmentRotation: Updatable = {
    update(dt: number) {
      for (const entry of fragmentEntries.values()) {
        entry.orb.rotation.y += visual.orb.collectibleRotationY * dt;
      }
    },
  };

  const anomalyUpdater: Updatable = {
    update(dt: number) {
      updateAnomalies(world, dt, bus);
      vfx.setDissonance(world.dissonance);
      for (const a of world.anomalies) {
        const entry = anomalyEntries.get(a.id);
        if (!entry) continue;
        const pulse = 1 + 0.15 * Math.sin(a.phase);
        const dissonanceScale = 1 + 0.25 * world.dissonance;
        const target = a.radius * pulse * dissonanceScale;
        entry.group.scale.lerp(new THREE.Vector3(target, target, target), 0.1);
        const mat = entry.bloom.material as THREE.MeshStandardMaterial;
        const targetOpacity = 0.55 + 0.25 * Math.sin(a.phase * 1.4);
        mat.opacity = THREE.MathUtils.lerp(mat.opacity, targetOpacity, 0.1);
        const targetEmissive = 0.4 + 0.4 * world.dissonance;
        mat.emissiveIntensity = THREE.MathUtils.lerp(mat.emissiveIntensity, targetEmissive, 0.1);
      }
    },
  };

  echoScene.updatables.push(
    playerUpdater,
    playerSync,
    rig,
    billboards.updatable,
    vfx.updatable,
    collectionSystem,
    guidanceVisual,
    fragmentRotation,
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
      <h1>ECHO DRIFTER</h1>
      <p class="lead">Drift through a synthwave space and rebuild a living track.</p>
      <ul>
        <li>WASD or arrow keys to drift</li>
        <li>Collect the glowing fragments to unlock musical layers</li>
        <li>Avoid the red blooms - they break the harmony</li>
        <li>Press R to restart</li>
      </ul>
      <p class="cta">Click to begin</p>
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
