# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

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
