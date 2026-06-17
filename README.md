# Echo Drifter

Echo Drifter is a cosy-active retrofuturistic exploration prototype where the player drifts through a rounded synthwave space and progressively enriches the soundtrack through discovery, collection, and stabilization.

This repository is set up as a minimal Vite + TypeScript + Three.js project so the game can be iterated quickly in VS Code with Kilo Code while keeping gameplay, audio, and presentation separated for future portability.

## Goals

The current goal is to build a focused MVP with:

- fluid drifting movement;
- one explorable field;
- visible collectibles;
- one anomaly hazard;
- a reactive layered synthwave audio loop;
- a minimal HUD and restart flow.

The project should preserve these design constraints:

- rounded, organic, pulsative visual language (violet + cyan dreamy palette);
- cosy but active exploration;
- music as a gameplay system, not just background;
- architecture that can later map to Godot or Odin + raylib.

## Stack

- Vite for fast local iteration and simple project scaffolding.
- TypeScript for type safety and cleaner modular code structure.
- Three.js for rendering the spatial scene in the browser.
- Web Audio API for adaptive audio and prototype-friendly music systems.

## Project structure

```text
echo-drifter/
├─ _Helpers/docs/                 # design source-of-truth + iteration notes
│  ├─ echo-drifter-master-brief.md
│  ├─ kilo-build-brief.md
│  ├─ echo-drifter-concept.md
│  ├─ perplexity_space-instructions.md
│  ├─ ACTIONS_PLAN.md
│  └─ Iterations/                 # per-version retrospective & decisions
│     ├─ vx.x.x_file1.
│     ├─ vx.x.x_file2.md
│     ├─ v0.1.0_screenshot_main.gif
│     └─ etc...
├─ .kilo/
│  └─ plans/
│     └─ v0.1.0-mvp-phases.md   # Kilo-implementation plan
├─ public/                            # static assets (currently empty)
├─ src/
│  ├─ audio/                      # Web Audio façade: director + 6 procedural layers
│  │  ├─ audioDirector.ts
│  │  ├─ layerController.ts           # MusicLayer interface + GainLayerBase
│  │  ├─ layers.ts                    # Drone, Pulse, Bass, Pad, Arp, Lead
│  │  └─ synth.ts                     # noteHz, ADSR, secondsPerBeat
│  ├─ content/                    # tunables + music content
│  │  ├─ tuning.ts                    # palette, drift, camera, field, vfx, anomaly, audio
│  │  ├─ scale.ts                     # A-minor pentatonic + per-layer patterns
│  │  └─ progression.ts               # fragment order → MusicLayerId
│  ├─ core/                           # engine-agnostic
│  │  ├─ gameLoop.ts
│  │  ├─ events.ts                    # typed event bus
│  │  ├─ world.ts                     # pure logical state
│  │  └─ stateMachine.ts
│  ├─ gameplay/                 # pure logic, no THREE
│  │  ├─ playerController.ts          # inertial drift + disruption jitter
│  │  ├─ input.ts                     # keyboard source
│  │  ├─ collectibleSystem.ts         # seeded spawn + collision
│  │  ├─ guidanceSystem.ts            # nearest uncollected + color blend
│  │  └─ anomalySystem.ts             # spawn, proximity, dissonance fill/decay
│  ├─ presentation/             # Three.js side only
│  │  ├─ scene.ts
│  │  ├─ cameraRig.ts                 # damping follow + look-ahead
│  │  ├─ meshes.ts                    # rounded factory: player, fragment, halo, bloom, ripple, ground
│  │  └─ vfx.ts                       # ripple pool + dissonance-driven dim
│  ├─ types/
│  │  └─ index.ts                     # Vec3, Updatable, MusicLayerId, InputState
│  ├─ ui/
│  │  └─ hud.ts                       # DOM HUD: layers, dissonance meter, restart
│  ├─ style.css
│  └─ main.ts                         # wiring only (systems + event subscriptions)
├─ .vscode/
├─ .gitignore
├─ AGENTS.md
├─ CHANGELOG.md
├─ TODO.md
├─ index.html
├─ package.json
├─ package-lock.json
├─ tsconfig.json
└─ README.md
```

### Portability rules

- `core/`, `gameplay/`, and the audio state module never import `three`.
- `audio/` exposes a `MusicLayer` interface; the Web Audio implementation in `layers.ts` is one of several possible backends.
- All tunable values live in `src/content/tuning.ts`.
- Systems communicate via the event bus (`src/core/events.ts`) plus the world state (`src/core/world.ts`).

## Setup

```bash
npm install
npm run dev      # start the dev server
npm run build    # type-check + production build
npm run preview  # serve the production build locally
```

## How to play

1. Click anywhere or press any key to start (browser autoplay policy).
2. Drift with **WASD** or the **arrow keys**.
3. Move close to a glowing amber orb to collect a harmonic fragment.
4. Each fragment unlocks a new musical layer: drone + pulse → bass → pad → arp → lead.
5. Avoid the pink anomaly blooms: they inject dissonance and disturb the harmony.
6. The dissonance meter (top right) shows how destabilized the mix is.
7. Press **R** or the **Restart** button to start over.

## Implementation phases

| Phase | Focus                                | Key files                                                                            |
| ----- | ------------------------------------ | ------------------------------------------------------------------------------------ |
| 1     | Skeleton, event bus, world state     | `core/`, `types/`, `presentation/scene.ts`                                           |
| 2     | Drift controller + camera rig        | `gameplay/playerController.ts`, `presentation/cameraRig.ts`                          |
| 3     | Collectibles, guidance, ripple VFX   | `gameplay/collectibleSystem.ts`, `gameplay/guidanceSystem.ts`, `presentation/vfx.ts` |
| 4     | Anomalies + dissonance               | `gameplay/anomalySystem.ts`                                                          |
| 5     | Audio director + 6 procedural layers | `audio/audioDirector.ts`, `audio/layers.ts`, `content/scale.ts`                      |
| 6     | HUD, restart, polish                 | `ui/hud.ts`, `src/style.css`, `CHANGELOG.md`                                         |

## Kilo workflow

The MVP plan lives at `.kilo/plans/v0.1.0-mvp-phases.md`. For each subsequent phase, ask Kilo to "Implement only Phase N", then review the changed files.

Design sources live under `_Helpers/docs/`:

- `_Helpers/docs/echo-drifter-master-brief.md` — pillars and constraints.
- `_Helpers/docs/kilo-build-brief.md` — Kilo-specific build rules.
- `_Helpers/docs/echo-drifter-concept.md` — concept doc.
- `_Helpers/docs/Iterations/` — per-version retrospective notes.

## Development rules

- Keep facts, assumptions, and design choices clearly separated.
- Prefer simple modules over premature abstractions.
- Keep gameplay logic decoupled from rendering when possible.
- Keep audio state logic decoupled from playback implementation.
- Put tunable values in `content/`, not hardcoded magic numbers.
- Do not introduce extra frameworks without a concrete need.
- Never commit secrets or copyrighted assets.

## Known assumptions

- Input is keyboard only (no gamepad).
- Audio is 100% procedural (oscillators + envelopes + filters). No samples.
- Spawn positions use a seeded RNG for reproducibility.
- No persistence: restart = in-memory reset.
- Disruption is cosmetic (input jitter + audible detune/filter sweep); no health or death.
- Music layers unlock in fixed order; the order is a single tunable array.
