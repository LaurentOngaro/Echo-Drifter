# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.4.1] - 2026-06-18

Targeted patch on v0.4.0: anomaly size correction, background star field, and orthographic zoom control.

### ✨ Added

- **Background star field** in `src/presentation/scene.ts` — 60 deterministic points (`THREE.BufferGeometry` + `THREE.Points` + `PointsMaterial(0xe8e0f0, size 0.04, opacity 0.4, sizeAttenuation false)`) at z = -5 (behind the gameplay plane). Positions generated with the LCG seeder (seed = 42) over x ∈ [-30, 30], y ∈ [-20, 20]. Static: no animation, no update loop.
- **Orthographic zoom** — `visual.camera.viewSizeMin: 5`, `viewSizeMax: 20`, `viewSizeStep: 1` in `src/content/tuning.ts`; `setViewSize(newSize)` and `getViewSize()` exposed on the `EchoScene` interface; `window.addEventListener('wheel', ...)` in `src/main.ts` calls `setViewSize(current ± step)` based on `deltaY` sign.

### 🔧 Changed

- `src/presentation/meshes.ts` — `createAnomalyBloom()` sphere radius `1.2 → 0.45` (all other parameters unchanged). The anomaly group is still scaled by `a.radius * pulse * dissonanceScale` in `anomalyUpdater`, so the in-world footprint of the anomaly zone is unaffected; only the visual bloom mesh is smaller.
- `src/presentation/scene.ts` — `resize()` now delegates to a shared `applyViewSize()` that reads a closure-local `currentViewSize: number` (initialised from `visual.camera.viewSize`); the wheel zoom persists across window resizes.

### 🐛 Fixed

- Anomaly blooms were visually overwhelming the scene (1.2 radius on top of the `a.radius` group scale). Reduced to 0.45 so the desaturated red is present but no longer dominates the frame.

### ✅ Tests

- `npm run build` passes with zero TS errors.
- `currentViewSize` is explicitly typed `: number` to avoid the `as const` literal-type inference that previously rejected assignment of the wheel-derived value.

## [0.4.0] - 2026-06-18

Polish pass: fix P0 (glow billboard square), fix P1 (quasi-2D orthographic view), visual juice (collect flash, particle burst, screen shake), and 3 contact sounds (enriched collect tone, layer-unlock arpeggio, anomaly-proximity hum).

### ✨ Added

- **`createGlowTexture(color, size=128)`** in `src/presentation/meshes.ts` — procedural radial-gradient canvas texture used by all billboard glows; centre 100% → mid 53% → edge 0% alpha. Removes the visible square border around player/collectible/anomaly orbs.
- **`visual.camera.orthographic: true` + `visual.camera.viewSize: 10`** — switches the scene to a quasi-2D orthographic frustum tuned for global drift visibility.
- **Camera group** in `src/presentation/scene.ts` — the camera is parented under a `THREE.Group` so the shake offset can be applied to the group without disturbing the camera's local position managed by the rig.
- **Collect flash** (`vfx.spawnCollectFlash(position, color)`) — temporary `MeshStandardMaterial` sphere at the collect point; `emissiveIntensity` triangle 0.5 → 1.8 → 0.5 over 250 ms (peak at 80 ms); then disposed.
- **Collect burst** (`vfx.spawnBurst(position, color)`) — pool of 12 additive spheres; 6 ejected at 60° intervals in the XZ plane, speed 2.5 u/s, friction 0.85/frame, scale + opacity 1 → 0 over 400 ms.
- **Screen shake** (`vfx.triggerShake(intensity, durationMs)` + `vfx.getShakeOffset()`) — collect: intensity 0.06, 200 ms, exp decay × sin(50 Hz) noise. Anomaly: intensity 0.04, continuous pulse at 3 Hz while dissonance > 0, 0.8 s fade-out on exit. Offset written to `cameraGroup.position` (not the camera itself, so no accumulation with the rig's lerp).
- **`audio.collectTone`** tuning — `fifthHzRatio: 1.5`, `echoDelayMs: 120`, `echoFeedback: 0.15`, `secondOscGain: 0.08`, `secondOscDurationMs: 180`.
- **`audio.layerUnlock`** tuning — `rootHz: 110`, `thirdHz: 131`, `fifthHz: 165`, `noteDurationMs: 120`, `noteSpacingMs: 80`, `noteGain: 0.15`, `filterHz: 1200`, `attackSec: 0.005`, `releaseSec: 0.2`.
- **`audio.anomalyProximity`** tuning — `lfoHz: 4`, `sineHz: 80`, `maxGain: 0.12`, `fadeInSec: 0.5`, `fadeOutSec: 0.8`, `lfoDepth: 0.5`.
- **Enriched `playCollectTone`** — second `sine` oscillator at `freq * 1.5` (gain 0.08, 180 ms) plus a shared `DelayNode` (120 ms, feedback 0.15) wired into the master gain for a light echo.
- **`playLayerUnlock`** (internal) — 3-note arpeggio (A2 / C3 / E3) with shared 1200 Hz lowpass, 80 ms apart, 200 ms release, automatically called from `unlock(id)`.
- **Anomaly-proximity voice** (internal) — persistent `sine` at 80 Hz with a 4 Hz LFO modulating a tremolo gain; envelope ramps to `amount * 0.12` with 0.5 s fade-in / 0.8 s fade-out, managed inside `setDissonance(amount)`.

### 🔧 Changed

- `src/presentation/meshes.ts` — `createPlayerGlow` / `createCollectibleGlow` / `createAnomalyGlow` now use `MeshBasicMaterial({ map: createGlowTexture(color), opacity: 1.0, ... })` (colour lives in the texture, gradient handles the edge alpha).
- `src/presentation/scene.ts` — `PerspectiveCamera` replaced by `OrthographicCamera`; `resize()` recomputes left/right/top/bottom from `visual.camera.viewSize` and the current aspect every resize; camera parented under `cameraGroup` (returned on the `EchoScene` interface).
- `src/presentation/vfx.ts` — `createVfxSystem(scene, cameraGroup)` now takes the camera group; flash/burst pools; shake state machine; shake offset written to `cameraGroup.position` (not `camera.position`) to avoid fighting the rig's lerp.
- `src/audio/musicStateMachine.ts` — `init()` builds the shared `echoDelay`/`echoFb` loop and the persistent `proxSine`/`proxLfo`/`proxTremolo`/`proxEnv` voice; `playCollectTone` routes through the echo; `unlock()` calls `playLayerUnlock()`; `setDissonance()` drives the proximity envelope with directional fade-in/fade-out; `stop()` also fades the proximity voice to 0.
- `src/main.ts` — passes `echoScene.cameraGroup` to `createVfxSystem`; on collect, calls `spawnRipple` + `spawnCollectFlash` + `spawnBurst` + `triggerShake(0.06, 200)`; casts `echoScene.camera` to `PerspectiveCamera` for the (unchanged) cameraRig interface.

### 🐛 Fixed

- **P0 — Square border around glow orbs**: replaced the flat-colour `MeshBasicMaterial` plane with a radial-gradient `CanvasTexture`; the transparent edges of the plane no longer show a hard square.
- **P1 — Perspective foreshortening**: the scene now uses an `OrthographicCamera` (viewSize = 10 world units vertical) so the drift field is fully visible without perspective distortion. The gameplay coordinates are unchanged; only the camera changed.
- **Screen-shake / rig interaction**: the shake is applied to a parent `cameraGroup` instead of the camera's own position, so the rig's X/Y lerp doesn't absorb the shake over time and there is no permanent drift.

### ✅ Tests

- `npm run build` passes with zero TS errors.
- `Math.random` in `src/audio/`: 0 matches (contact-sound frequencies are all hard-coded from `audioCfg.*`).

## [0.3.0] - 2026-06-17

Presentation layer rewrite to match the v0.1.0 visual brief exactly: rounded-only geometries, brief-specified materials/lights, fixed-camera quasi-orthographic view, deterministic 0.8 Hz pulses, lerped transitions, pure-DOM HUD with Orbitron + monospace stack.

### ✨ Added

- New `visual` export in `src/content/tuning.ts` — single source of truth for every visual constant (camera, lights, palette, orb pulse, ripple, trail, collect, ground).
- `createBillboardRegistry()` in `src/presentation/meshes.ts` — single updater that calls `mesh.quaternion.copy(camera.quaternion)` every frame for every registered glow (player, collectibles, anomalies), so billboards track the camera even as it lerps.
- Player pulse (0.8 Hz sine, ±4%), Z-rotation driven by speed/maxSpeed × 0.15 rad/s, with parented glow plane.
- Player motion trail: pool of 8 spheres, snake update at 20 Hz, head opacity 0.5 → 0 along tail, freeze + 200 ms alpha-fade below 0.05 velocity threshold.
- Collectible pulse on nearest fragment (sin t × 4 lerped over 0.1 toward target opacity and scale).
- Ripple pool: 5 concurrent, ease-out cubic scale 0 → 2.5 over 600 ms, opacity 1 → 0, dissonance-coupling opacity dim.
- Anomaly bloom + red glow billboard, group scale and emissive intensity lerped at 0.1 per frame.
- HUD: title "ECHO DRIFTER" (uppercase, letter-spacing 0.3em), 5 pills in order DRONE / BASS / PAD / ARP / LEAD (pulse is internal to audio and not a separate indicator), dissonance bar whose `background-color` lerps cyan → red via inline `rgb(...)` style.
- `index.html`: Google Fonts `<link>` for Orbitron 400/600 + Share Tech Mono, `<meta name="color-scheme" content="dark">`, `<div id="hud">` skeleton.
- `src/style.css`: `@import` Orbitron, body bg `#0a0612` + text `#e8e0f0`, sober start-overlay (no gradient, no heavy shadow), all transitions `0.3s ease`.

### 🔧 Changed

- `src/presentation/scene.ts` — full rewrite: `setClearColor(0x0a0612, 1)`, no fog, single AmbientLight 0x1a0a2e @ 0.8, single PointLight 0x6644aa @ 1.2 (dist 30) + small accent 0x3fd6ff @ 0.6 (dist 8), FOV 55°, camera Z locked at 8 (X/Y driven by the rig).
- `src/presentation/cameraRig.ts` — full rewrite: Z clamped to `visual.camera.fixedZ`; X/Y damped toward target via `(1 - damping) * dt * 60` with `Math.min(dt, 1/30)` cap to prevent tab-pause snap; optional micro-anticipation `target.x + vx * maxLookAhead`.
- `src/presentation/meshes.ts` — full rewrite. Allowed geometries: `SphereGeometry`, `TorusGeometry`, `PlaneGeometry`, `CircleGeometry` only. No `RingGeometry`, no `Box`/`Cone`/`Cylinder`/`Icosahedron`/`Octahedron`, no wireframes. Halos = `TorusGeometry(0.6, 0.03, 8, 48)` flat on XZ (rotation.x = -π/2). Ripples = `TorusGeometry(0.5, 0.05, 8, 48)`. Ground = `CircleGeometry(60, 96)` at y=-2, opacity 0.12, color = background.
- `src/presentation/vfx.ts` — full rewrite: pre-allocated pool of 5 ripples, recyclable on overflow (oldest age); per-frame ease-out cubic scale + linear opacity. Trail updater with velocity gate and head/tail opacity decay.
- `src/ui/hud.ts` — full rewrite. Pure DOM, no shadow DOM, no Three.js imports. RESET handler iterates `LAYER_PILLS` to light DRONE by default and clear the others.
- `src/main.ts` — wiring only: replaces `createFragmentOrb(0xffe1a8)` / `createHalo(0.6, 0xffe1a8)` / `createAnomalyBloom(0xff4f9f)` with palette-driven `createCollectibleOrb()` / `createCollectibleHalo()` / `createAnomalyBloom()`. Each fragment/anomaly is a `THREE.Group` containing the orb + halo + glow (billboard registered globally). Player and anomaly updaters lerp scale / opacity / emissiveIntensity at 0.1 per frame instead of `setScalar`/`=`-set instant changes.
- Emissive intensities lowered to brief values: player 0.6, collectible 0.5, anomaly 0.4 (was 1.2 / 1.4 / 0.9).
- Pulse player scale is the deterministic `1 + 0.04 * sin(t * 2π * 0.8)` sine (no more `Math.random()` flicker).
- `index.html` title set to "ECHO DRIFTER".

### 🐛 Fixed

- Removed `(renderer as any).updateScene` legacy path; remains a typed `Updatable[]` registry.
- Removed the second (cyan) point light and the `FogExp2` background; fixed-camera quasi-orthographic view is the only depth cue.
- Removed instant `mesh.scale.setScalar(...)` and `mat.opacity =` assignments on per-frame state changes; replaced with `Vector3.lerp` / `MathUtils.lerp` toward a target.
- Removed `Math.random()` from `presentation/playerSync` (was used to flicker the player scale on dissonance).
- Removed `RingGeometry` use in `meshes.ts` (was used for both halos and ripples); replaced with `TorusGeometry` per brief §8.

### ✅ Tests

- `npm run build` passes with zero TS errors.
- Grep verification: 0 occurrences of `BoxGeometry | ConeGeometry | CylinderGeometry | IcosahedronGeometry | OctahedronGeometry | RingGeometry | wireframe` in `src/presentation/`.
- Grep verification: 0 occurrences of `MeshPhongMaterial | MeshToonMaterial` in `src/presentation/`.
- Grep verification: every `mesh.rotation.x =` in `src/presentation/` is `-Math.PI / 2` (flat layout for halo/ripple/ground) — no other X-axis rotation in the visual layer.
- Visual smoke: dark violet `#0a0612` clear, no fog, Orbitron HUD title, 5 pills in order DRONE / BASS / PAD / ARP / LEAD, dissonance bar lerps cyan → red.

## [0.2.0] - 2026-06-17

Audio subsystem rewrite to match the v0.1.0 brief exactly: single in-scale tonality, deterministic frequencies, per-layer timbres as specified, removed harsh warning, and a 4/4 grid pulse layer with kick + hat.

### ✨ Added

- New `src/audio/musicStateMachine.ts` owning the `AudioContext`, master gain, the six layer instances, and the warning delay chain.
- New `kickEnvelope`, `hatEnvelope`, `createNoiseBuffer` (deterministic PRNG, no `Math.random`), and `centsToRatio` helpers in `src/audio/synth.ts`.
- New `MusicLayer.getOutputNode()` accessor for chaining and inspection.
- Per-layer fade-in/out durations clamped to `audioCfg.fadeInMinSec` / `fadeOutMinSec` (0.8 s / 1.2 s minimums).
- Drone: 2 sine oscillators (root 110 Hz + fifth 165 Hz with +3¢), 400 Hz/Q=1 lowpass, 0.2 Hz amp-LFO ±5%.
- Pulse: 4/4 grid at 90 BPM with kick on beats 1 & 3 and hat on beats 2 & 4 (kick: sine 80→30 Hz over 80 ms, peak 0.8; hat: 30 ms white-noise burst highpassed at 6 kHz, peak 0.15).
- Bass: sawtooth 200 Hz lowpass, A2 (110 Hz), 300 ms, one note per measure on beat 1.
- Pad: triangle per note, A2 → C3 → E3 every 2 s, full ADSR (1.5/0.3/0.7/2.0 s), 800 Hz lowpass, 1.8 s note duration (slight overlap).
- Arp: sine per note, E3 → G3 → A3 → C4 at 0.5 notes/s, shared 200 ms delay with 0.3 feedback.
- Lead: sine per note, A3 → C4 → E4 → A3, 0.8 s per note, 1.6 s pause between phrases.
- Soft anomaly warning: 80 Hz sine 30 ms + 80 ms delay (fb 0.2), replayed every 600 ms while dissonance > 0.15.

### 🔧 Changed

- `src/content/tuning.ts`: replaced the `audio` export with the full brief table (`bpm: 90`, `masterGain: 0.55`, `drone`, `pulse`, `bass`, `pad`, `arp`, `lead`, `dissonance`, `warning`, `fadeInMinSec`, `fadeOutMinSec`).
- `src/audio/audioDirector.ts`: reduced to a thin façade re-exporting the state machine's public methods.
- `src/audio/layers.ts`: full rewrite of all six layers to match the brief literally.
- `src/audio/layerController.ts`: `GainLayerBase` now accepts per-layer `LayerFade` and exposes `getOutputNode()`.
- Dissonance: detune is now applied to the drone only (0 → +20 cents), master gain ramps to `×0.8`, recovery over 1.5 s.
- `playAnomalyWarning` removed from the public `AudioDirector` API; warning is self-triggered inside `setDissonance`.

### 🐛 Fixed

- Removed the harsh 220 Hz square-wave anomaly warning; replaced with the soft 80 Hz sine + delay chain.
- Removed BPM drift under dissonance in the pulse layer (no procedural tempo variation).
- Removed all `Math.random()` calls from `src/audio/`; noise generation now uses a deterministic Mulberry32 PRNG.
- Removed all `'square'` oscillator types from `src/audio/` (drone/pad/lead now use sine/triangle as specified).
- Removed the continuous-noise `setInterval` warning loop; the new warning is a 30 ms one-shot buffer replay.

### ✅ Tests

- `npm run build` passes with zero TS errors.
- Grep verification: 0 occurrences of `Math.random` in `src/audio/`; 0 occurrences of `'square'` oscillator type in `src/audio/`.
- Grep verification (post-patch, 0.2.0): 0 orphan references to `playAnomalyWarning` in `src/` (method removed from `AudioDirector` public surface in 0.2.0; no caller left over).

## [0.1.0] - 2026-06-17

First release of the playable prototype.

### ✨ Added

- Vite + TypeScript + Three.js project scaffold with strict `tsconfig`.
- Typed event bus (`src/core/events.ts`) and pure world state (`src/core/world.ts`).
- Inertial drift controller with eased input and max-speed clamp (`gameplay/playerController.ts`).
- Camera rig with damping follow and velocity look-ahead (`presentation/cameraRig.ts`).
- Seeded collectible field (8 fragments) with proximity collision and mark-collected logic.
- Guidance system: nearest uncollected fragment pulses and brightens its halo.
- Ripple VFX pool on collect.
- Seeded anomaly blooms with proximity detection, dissonance fill/decay, and visual feedback.
- Procedural Web Audio director with 6 layers (drone, pulse, bass, pad, arp, lead) and a layered unlock progression.
- Dissonance-driven audio response: detune, lowpass sweep, gain drop, repeated warning pulse.
- Collect-tone feedback on fragment pickup.
- Minimal HUD: layer pills, dissonance meter, restart hint, Restart button.
- Start overlay (click/key) to satisfy browser autoplay policy.
- Restart flow on `R` key or HUD button.
- Violet + cyan dreamy synthwave palette enforced in `content/tuning.ts`.
- All tunables centralized in `src/content/tuning.ts`.

### 🐛 Fixed

- Replaced `(renderer as any).updateScene` hack with a typed `Updatable[]` registry.
- Replaced all direct `AudioParam.value =` assignments with `setValueAtTime` (getter-only on modern browsers).
- Fixed `<style src=...>` in `index.html` to a proper `<link rel="stylesheet">`.

### ✅ Tests

- `npm run build` (tsc strict + vite build) passes with no type or build errors.
- Dev server returns HTTP 200 on smoke test.

### 🔧 Changed

- N/A (initial release).
