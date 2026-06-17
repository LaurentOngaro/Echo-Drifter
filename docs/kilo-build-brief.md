# Echo Drifter — Kilo Build Brief

## Trigger

ECHO_DRIFTER_KILO_BUILD

## Mandatory first step

Before writing code:

1. Read `docs/echo-drifter-master-brief.md`.
2. Summarize constraints and main pillars.
3. Propose a phased MVP implementation plan.
4. Wait for approval before large architectural changes.

If a file containing `ECHO_DRIFTER_MASTER_CONTEXT` exists, treat it as the source of truth.

## Project goal

Build a playable browser prototype of Echo Drifter:

- fluid drifting in a rounded retrofuturistic space;
- cosy but active exploration;
- collectible-driven progression;
- adaptive synthwave soundtrack;
- dissonant anomalies as gameplay threats;
- music growth as the primary reward loop.

## Tech stack

Use:

- TypeScript
- Vite
- Three.js
- Web Audio API

Avoid heavy frameworks unless clearly justified.

## Non-goals

Do NOT:

- build backend services;
- add accounts or networking;
- recreate copyrighted music;
- add unnecessary ECS complexity;
- overbuild content pipelines;
- add aggressive combat systems that undermine the cosy-active tone.

## Core architecture requirements

Keep the code portable to Godot/GDScript and Odin+raylib later.

That means:

- gameplay logic must not depend directly on Three.js objects where avoidable;
- audio state logic must be separate from playback implementation;
- tuning values must live in config/data files;
- systems must communicate through state and events.

## Required folder structure

Use a structure close to:

src/
core/
gameplay/
audio/
presentation/
content/
ui/
types/

docs/
echo-drifter-master-brief.md
kilo-build-brief.md
echo-drifter-concept.md

Suggested file examples:

- core/gameLoop.ts
- core/events.ts
- gameplay/playerController.ts
- gameplay/collectibleSystem.ts
- gameplay/anomalySystem.ts
- audio/audioDirector.ts
- audio/musicStateMachine.ts
- audio/layerController.ts
- presentation/scene.ts
- presentation/cameraRig.ts
- presentation/vfx.ts
- content/tuning.ts
- ui/hud.ts

## Gameplay constraints

The MVP must include:

- one fluid drift controller;
- one explorable open space;
- visible floating collectibles;
- one guidance system toward targets;
- one anomaly hazard type;
- temporary dissonance/disruption effect on contact;
- reactive music state changes;
- minimal HUD;
- restart/reset loop.

## Movement direction

Movement must feel:

- soft;
- rounded;
- floaty;
- slightly inertial;
- readable;
- pleasant even in low-intensity moments.

Avoid:

- twitch shooter feel;
- harsh collision-heavy design;
- angular motion language;
- aggressive jerky acceleration.

## Visual direction

Target visuals:

- rounded silhouettes;
- soft neon glow;
- pulsative waves and halos;
- synthwave palette;
- no sharp spikes in the default environment;
- elegant particles and motion trails.

## Audio direction

Audio is a primary system.

Implement at least:

- ambient synth pad base layer;
- pulse / beat layer;
- collectible feedback tones;
- unlockable musical layers;
- anomaly warning / disruption sound;
- recovery transition.

Music should be original and system-driven.
If real assets are unavailable, use simple synth placeholders, generated tones, or procedural layers.

## Progressive music design

The MVP should already support the concept that the player gradually enriches the soundtrack by unlocking compatible elements.

Minimal progression example:

- start with drone + pulse;
- unlock bass motif;
- unlock pad harmony;
- unlock arpeggio;
- unlock lead fragment.

## Phases

### Phase 1 — Skeleton

- scaffold project;
- renderer, scene, camera, resize handling;
- base loop;
- folder structure;
- basic docs;
- verify project runs.

### Phase 2 — Movement

- implement drift controller;
- add camera rig;
- expose tuning values;
- validate movement feel.

### Phase 3 — World and collectibles

- create open-space field;
- spawn collectibles;
- implement guidance;
- add collection feedback.

### Phase 4 — Anomaly system

- implement one hazard type;
- detect contact;
- apply disruption effect;
- add visual/audio response.

### Phase 5 — Audio growth

- implement audio director;
- add reactive state transitions;
- map progression to music layers;
- add disruption and recovery behavior.

### Phase 6 — MVP polish

- minimal HUD;
- restart flow;
- README;
- code cleanup;
- expose tuning variables.

## Required agent behavior

For each phase:

1. Explain intended file changes.
2. Make the changes.
3. Verify build or type status.
4. Summarize unfinished risks, assumptions, and next steps.

Do not silently refactor unrelated files.

## Acceptance criteria

The MVP is successful when:

- it launches locally without manual patching;
- the player can drift smoothly through space;
- collectibles are visible and meaningful;
- progression audibly enriches the soundtrack;
- anomalies introduce disruption;
- the whole prototype communicates a cosy-active synthwave identity.

## Missing information rule

If a detail is unknown:

- choose the simplest plausible implementation;
- document it as an assumption;
- keep the parameter easy to tune later.
