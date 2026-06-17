# Echo Drifter - Master Brief

## Trigger

ECHO_DRIFTER_MASTER_CONTEXT

## Project goal

Build a playable prototype inspired by the sensory strengths of the Geodrift video segment, while transforming the concept into a clearly original game identity centered on synthwave exploration, adaptive music, and harmonic progression.

The target is not to reproduce the original prototype as a commercial base. The target is to create a new project whose core differentiator is that the player gradually reconstructs and enriches a musical world through exploration, collection, and survival.

## Source inspiration

Reference source:

- YouTube video: `https://www.youtube.com/watch?v=vS-gfLhxYDg`
- Relevant segment: 124s to 382s

The source prototype establishes several high-level qualities that are worth keeping as inspiration only:

- ethereal drifting movement;
- futuristic atmosphere;
- cosy but active exploration;
- strong bond between gameplay and sound;
- collectible-driven progression;
- disruption hazards affecting player control and perception.

These elements should be treated as inspiration, not as a blueprint for literal reproduction.

## Original project direction

The new project is now called **Echo Drifter** as a working title.

The concept should evolve away from a simple ambient drift prototype and toward a stronger original identity:

- retrofuturistic / synthwave tone;
- rounded, organic, pulsative visual language;
- no angular, spiky, aggressive geometric forms in the core art direction;
- music as an active gameplay system;
- progression that unlocks notes, chords, loops, textures, and layers;
- light educational dimension around harmony, consonance, tension, and resolution.

## Core fantasy

The player pilots a fluid drifting entity through a luminous, rounded, retrofuturistic space and gradually restores or composes a living synthwave track.

Exploration is cosy but not passive:

- discover harmonic fragments;
- unlock musical building blocks;
- maintain the coherence of the evolving soundscape;
- avoid or cleanse dissonant anomalies that threaten the current composition.

## Core pillars

### 1. Fluid exploration

Movement should feel soft, inertial, readable, and enjoyable even without combat pressure.

### 2. Musical progression

The player does not just collect points or resources; the player unlocks musical capability: notes, chord colors, bass movement, pads, motifs, and loops.

### 3. Harmonic tension

Threats should interfere with harmony, rhythm, or musical completeness rather than only reducing health. This makes danger emotionally meaningful.

### 4. Sensory reward

The game should constantly reward the player with a richer audiovisual state: fuller music, brighter pulses, smoother motion, and more coherent ambience.

## Distinction from Geodrift

Echo Drifter must not be framed as “Geodrift but commercial.”

It becomes a distinct concept through:

- synthwave identity instead of pure ethereal abstraction;
- musical layering and harmonic progression as the main system;
- dissonant anomalies as musical antagonists;
- optional educational framing around harmony;
- rounded organic pulse-based visuals instead of abstract neutral drifting.

## Observed facts from the source prototype

The original segment visibly or explicitly suggested:

- free drifting movement in open space;
- collectible targets / relics;
- directional guidance;
- a shockwave-like hazard;
- temporary disorientation with inverted controls;
- sound and music strongly tied to the experience.

## Reusable inspiration rules

Safe inspiration areas:

- movement mood;
- overall sensory intent;
- the idea that sound is central;
- gentle exploration with meaningful hazards.

Must be redesigned originally:

- title and branding;
- visual identity;
- exact UI;
- exact obstacle implementation;
- exact progression logic;
- all music, SFX, art, shaders, and code.

## Recommended implementation target

Primary implementation target:

- TypeScript
- Three.js
- Web Audio API
- local browser-playable project

Rationale:

- close to the reference look and feel for a lightweight 3D / pseudo-3D sensory prototype;
- easy to run in a browser;
- well suited to AI-assisted coding workflows;
- still portable if gameplay/audio logic stays decoupled.

## Portability requirement

The design specification must remain portable to:

- Godot / GDScript;
- Odin + raylib.

That means:

- gameplay systems separated from rendering systems;
- audio state logic separated from playback implementation;
- explicit events and tunable config values;
- no engine-specific assumptions in the core design.

## Visual direction

The art direction should emphasize:

- rounded and circular silhouettes;
- soft glowing orbs, waves, halos, ripples, and pulses;
- fluid trajectories and motion trails;
- organic neon synthwave atmosphere;
- no hard spikes, no sawtooth shapes, no hostile angular silhouettes in the default environment.

Hostile entities can still feel threatening, but through instability, interference, distortion, flicker, phase drift, or dissonant pulse patterns rather than “sharpness.”

## Audio direction

Audio is a core gameplay system.

The player should progressively unlock:

- scale notes;
- chords or chord colors;
- bassline variations;
- pads;
- arpeggios;
- melodic motifs;
- additional loops or arrangement layers.

The music system should combine:

- vertical remixing: adding/removing compatible layers over time;
- horizontal resequencing: moving between loop sections or states based on gameplay.

## Educational layer

The game may include a light music-learning layer, but it must remain optional and non-academic in tone.

The intended outcome is experiential understanding of:

- stable vs unstable sound;
- consonance vs dissonance;
- tension and release;
- chord identity and harmonic color.

This should be taught mainly through feel, feedback, naming, and progression-not through lectures.

## Hazard philosophy

Hazards should act as harmonic disruptors, for example:

- entities that inject out-of-key notes;
- rhythm parasites that disturb pulse regularity;
- zones that mute layers;
- anomalies that corrupt the active loop;
- impacts that temporarily desaturate or destabilize the mix.

## Deliverables expected from future agents

1. Portable design specification.
2. Gameplay systems architecture.
3. Audio system design.
4. MVP implementation plan.
5. Kilo Code build brief.
6. Godot mapping notes.
7. Odin+raylib mapping notes.

## Validation behavior for future agents

At the start of any substantive task, the agent must:

1. Confirm that `ECHO_DRIFTER_MASTER_CONTEXT` was read.
2. Summarize the project pillars.
3. Explicitly separate facts, assumptions, and design choices.
4. Avoid inventing details without labeling them as assumptions.
