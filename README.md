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

- rounded, organic, pulsative visual language;
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
├─ docs/
│  ├─ echo-drifter-master-brief.md
│  ├─ kilo-build-brief.md
│  └─ echo-drifter-concept.md
├─ public/
├─ src/
│  ├─ audio/
│  ├─ content/
│  ├─ core/
│  ├─ gameplay/
│  ├─ presentation/
│  ├─ types/
│  └─ ui/
├─ AGENTS.md
├─ index.html
├─ kilo.jsonc
├─ package.json
├─ tsconfig.json
└─ README.md
```

This structure intentionally separates engine loop, gameplay systems, audio systems, rendering, and content tuning so AI-assisted changes stay easier to control.

## Setup

1. Create the Vite TypeScript project scaffold:

   ```bash
   npm create vite@latest echo-drifter -- --template vanilla-ts
   ```

2. Enter the project folder:

   ```bash
   cd echo-drifter
   ```

3. Install dependencies:

   ```bash
   npm install
   npm install three
   npm install --save-dev @types/three
   ```

4. Start the dev server:

   ```bash
   npm run dev

   ```

This matches the standard minimal setup commonly used for Vite + Three.js + TypeScript projects.

## First coding phases

Recommended order:

1. Skeleton: renderer, scene, camera, resize handling, game loop.
2. Movement: drift controller and camera follow feel.
3. Collectibles: spawn, collection, feedback.
4. Anomaly: one dissonant hazard and disruption effect.
5. Audio: base loop plus progression layers.
6. Polish: minimal HUD, reset flow, tuning cleanup.

## Kilo workflow

Suggested first prompt:

> Read `docs/echo-drifter-master-brief.md`, `docs/kilo-build-brief.md`, and `docs/echo-drifter-concept.md`. Summarize the constraints, propose the MVP architecture, and do not write code until the plan is approved.

Then continue phase by phase, for example:

> Implement only Phase 1 skeleton and Phase 2 movement. List changed files and assumptions.

This approach fits Kilo's project-specific rules model and keeps agent behavior easier to steer.

## Development rules

- Keep facts, assumptions, and design choices clearly separated.
- Prefer simple modules over premature abstractions.
- Keep gameplay logic decoupled from rendering when possible.
- Keep audio state logic decoupled from playback implementation.
- Put tunable values in content/config files, not hardcoded magic numbers.
- Do not introduce extra frameworks without a concrete need.

## Immediate next step

The immediate next step is to copy the generated project docs into `docs/`, put `kilo.jsonc` and `AGENTS.md` at the root, scaffold Vite, and let Kilo propose the MVP architecture before writing production code.
