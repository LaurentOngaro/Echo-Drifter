# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

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
