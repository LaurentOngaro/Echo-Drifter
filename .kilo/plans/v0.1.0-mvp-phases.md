# Echo Drifter - MVP Implementation Plan

## 1. Contraintes (synthèse)

### Piliers design

- Exploration cosy-active (doux, mais jamais passive).
- Musique = système de progression principal (drone → bass → pad → arp → lead).
- Identité visuelle ronde / organique / pulsative. **Aucun spike, aucune forme angulaire agressive.**
- Menaces = perturbations harmoniques (dissonance, désync, mute de layers), pas des ennemis classiques.

### Stack & non-goals

- TypeScript + Vite + Three.js + Web Audio API. Aucun framework lourd, pas de backend, pas de réseau.
- Assets audio générés par Web Audio (oscillateurs, noise, envelopes). Pas de samples copyrighted.

### Portabilité (Godot / Odin+raylib)

- Gameplay découplé du rendu → la simulation ne référence pas `THREE.Object3D`.
- État audio (data) séparé du playback (façade).
- Tuning dans `src/content/*.ts` (constantes nommées, jamais magic numbers en dur).
- Communication par événements (`src/core/events.ts`) + state machine.

### État actuel du repo

- ✅ Vite + TS + Three.js installés (`package.json`).
- ✅ Boucle de jeu (`src/core/gameLoop.ts`).
- ✅ Scène de base avec un orbe pulsatif (`src/presentation/scene.ts`), mais :
  - hack `(renderer as any).updateScene` → à remplacer par un contrat propre (interface `Updatable`).
  - dossiers manquants : `audio/`, `gameplay/`, `content/`, `types/`, `ui/`.
- ✅ `index.html`, `src/style.css`, `README.md`, `AGENTS.md` présents.
- ❌ Pas encore de controller, ni de système de collecte, ni d'audio.

---

## 2. Architecture cible (référence pour toutes les phases)

```
src/
├─ core/
│  ├─ events.ts          # bus d'événements typé (Collected, AnomalyHit, MusicUnlock, ...)
│  ├─ gameLoop.ts        # (existe) + scheduler fixed-timestep optionnel
│  ├─ stateMachine.ts    # MusicStateMachine pure (états + transitions)
│  └─ world.ts           # conteneur logique: positions player/collectibles/anomalies (pas de THREE)
├─ gameplay/
│  ├─ playerController.ts # drift input → velocity (pur data, expose Vector3-like)
│  ├─ collectibleSystem.ts
│  ├─ guidanceSystem.ts
│  └─ anomalySystem.ts
├─ audio/
│  ├─ audioDirector.ts   # façade Web Audio (init, ctx, master gain)
│  ├─ musicStateMachine.ts # utilise core/stateMachine.ts
│  ├─ layerController.ts   # gère une couche: oscillator/noise → gain → filter → master
│  └─ synth.ts           # helpers: note Hz, envelopes, ADSR, scale
├─ presentation/
│  ├─ scene.ts           # (refactor: retourne aussi un registre d'Updatable)
│  ├─ cameraRig.ts       # follow doux avec damping
│  ├─ vfx.ts             # halos, ripples, trails (pool de meshes ronds)
│  └─ meshes.ts          # factory: orb, ring, pulse (geometries rondes uniquement)
├─ content/
│  ├─ tuning.ts          # toutes les constantes gameplay/mouvement
│  ├─ scale.ts           # gamme synthwave (ex: A minor pentatonic)
│  └─ progression.ts     # table: fragment id → music layer à débloquer
├─ ui/
│  └─ hud.ts             # overlays DOM: layer count, dissonance meter, restart
├─ types/
│  └─ index.ts           # Vec3, GameEvent, MusicLayerId, ...
└─ main.ts               # wiring: crée systems + connecte events → presentation/audio
```

**Règle de dépendance** : `core`/`gameplay`/`audio-state` n'importent **jamais** `three`. Seul `presentation/`, `audio/playback` et `main.ts` touchent à Three.js / Web Audio concret.

---

## 3. Phases MVP

### Phase 1 - Squelette propre & bus d'événements

**Objectif** : poser l'ossature portable et corriger le hack `updateScene`.

Fichiers créés / modifiés :

- `src/core/events.ts` - `GameEvent` union, `emit/listen`, helpers typés.
- `src/core/world.ts` - état logique pur : `playerPos`, `collectibles[]`, `anomalies[]`, `unlockedLayers: Set<MusicLayerId>`.
- `src/types/index.ts` - `Vec3`, `Updatable { update(dt) }`, `MusicLayerId`, `GameEvent` types.
- `src/presentation/scene.ts` - **refactor** : retirer `(renderer as any).updateScene` ; retourner `{ renderer, camera, scene, resize, updatables }`.
- `src/main.ts` - wiring minimal : instanciation `world`, scène, loop, et appel `updatables.forEach(u => u.update(dt))`.

Critère de validation : `npm run dev` lance la scène avec l'orbe pulsatif d'origine, **plus aucun cast `as any`**.

### Phase 2 - Drift controller & camera rig

**Objectif** : sensation de vol doux, inertiel, lisible.

Fichiers :

- `src/content/tuning.ts` - `drift.*` (accel, drag, maxSpeed, inputCurve).
- `src/gameplay/playerController.ts` - pure : `update(dt, input) → velocity`. Aucune dépendance à Three.
- `src/presentation/cameraRig.ts` - follow avec damping + léger offset arrière ; expose `Updatable`.
- `src/main.ts` - input clavier (WASD/ZQSD + flèches) ou pointer drag ; applique controller → world.playerPos → mesh player → camera follow.

Réglages clés : courbe d'accélération ease-out, drag 0.92/sec, max speed tunable. Aucun angular motion.

Critère : mouvement "floaty, rounded, readable".

### Phase 3 - Champ ouvert, collectibles, guidance

**Objectif** : un espace, des fragments visibles, feedback de collecte.

Fichiers :

- `src/gameplay/collectibleSystem.ts` - spawn N fragments (positions déterministes seeded), test proximité sphérique.
- `src/gameplay/guidanceSystem.ts` - indique le fragment le plus proche (ex : pulse lumineux lointain + HUD flèche).
- `src/presentation/meshes.ts` - `createOrb(color, size)`, `createRing(...)`, `createPulse(...)` ; uniquement géométries rondes.
- `src/presentation/vfx.ts` - ripple à la collecte (scale 0→1→0, opacity 1→0 sur ~600 ms, pool).
- `src/core/events.ts` - ajout `COLLECTED { id, position }`.
- `src/content/progression.ts` - table : chaque fragment id → `MusicLayerId` qu'il débloque.

Critère : collecter 3+ fragments déclenche ripples + event collecté visible.

### Phase 4 - Anomalies & disruption

**Objectif** : un type de hazard qui casse l'harmonie sans agresser visuellement.

Fichiers :

- `src/gameplay/anomalySystem.ts` - bloom animé (sphère ondulante + phase drift), zone de perturbation sphérique.
- `src/content/tuning.ts` - `anomaly.radius`, `anomaly.disruptDuration`, `anomaly.dissonanceAmount`.
- `src/core/events.ts` - `ANOMALY_ENTER`, `ANOMALY_EXIT`, `DISSONANCE_CHANGED`.
- `src/presentation/vfx.ts` - effet "déstabilisant" : flicker léger, halo inversé, aberration chromatique CSS overlay.
- `src/gameplay/playerController.ts` - option : micro-jitter d'input pendant disruption (option cosmétique, **non punitif**).

Critère : entrer dans un bloom → event émis, vfx subtil, état `dissonance > 0`. Sortie → retour progressif.

### Phase 5 - Audio director & croissance musicale

**Objectif** : audio piloté par état, progression audible.

Fichiers :

- `src/audio/audioDirector.ts` - `init()` (resume ctx après 1er input), `masterGain`, `setDissonance(amount)`.
- `src/audio/synth.ts` - helpers : `noteHz(midi)`, ADSR, scale A minor pentatonic.
- `src/audio/layerController.ts` - interface `MusicLayer { id, start(), stop(), setLevel(), triggerPulse() }`.
- `src/audio/musicStateMachine.ts` - États : `Drone`, `Pulse`, `Bass`, `Pad`, `Arp`, `Lead`, `Disrupted`, `Recovering`. Transitions sur events (`COLLECTED`, `ANOMALY_ENTER/EXIT`).
- Implémentations concrètes (toutes procédurales) :
  - `DroneLayer` - 2 oscillateurs (root + quinte) + lowpass doux.
  - `PulseLayer` - kick procédural sur grid 4/4 + clock paramétrable.
  - `BassLayer`, `PadLayer`, `ArpLayer`, `LeadLayer` - débloqués successivement.
- `src/core/events.ts` - `MUSIC_LAYER_UNLOCKED`, `MUSIC_STATE_CHANGED`.

Critère : démarrage = drone+pulse ; chaque fragment → couche suivante audible ; disruption → baisse gain + dissonance (oscillator detune + filter sweep), recovery → fondu retour.

### Phase 6 - HUD, restart, polish & tuning

**Objectif** : bouclage MVP complet.

Fichiers :

- `src/ui/hud.ts` - compteurs DOM : `Layers X/5`, `Dissonance`, instructions minimales, bouton restart.
- `src/main.ts` - `R` ou bouton → reset `world`, stop/redémarre layers, repop collectibles.
- `src/content/tuning.ts` - exposition finale + commentaires.
- `README.md` - section "How to play" + mapping des phases → fichiers.

Critère : lancement `npm run dev` → playable loop end-to-end (drift → collect → unlock layer → anomaly → recover → restart).

---

## 4. Règles d'exécution par phase

Pour chaque phase, l'agent doit :

1. Lister les fichiers créés/modifiés **avant** d'éditer.
2. Implémenter.
3. Lancer `npm run build` (tsc + vite) - pas de "ça compile probablement".
4. Résumer : faits, hypothèses, risques restants.
5. Ne **pas** refactorer des fichiers hors scope de la phase.

## 5. Hypothèses explicites

- **Input** : clavier WASD + flèches. (Pas de gamepad au MVP ; ajout trivial ensuite.)
- **Audio** : 100% procédural (oscillateurs + noise + envelopes). Pas de samples.
- **RNG** : seeded pour reproductibilité des spawns.
- **Persistence** : aucune au MVP (restart = reset mémoire).
- **Détermination des layers débloqués** : linéaire (1→2→3→4→5) ; le `progression.ts` rendra l'ordre trivialement modifiable.
- **Disruption control** : cosmétique (jitter input léger), pas de health/death. Cohérent avec le ton cosy-active.

## 6. Décisions validées

- **Démarrage audio** : overlay "Click / press a key to begin" → initialise `AudioContext` au premier input (contrainte autoplay navigateur).
- **Palette** : violet + cyan dreamy (`#6b3fff` / `#3fd6ff` sur fond profond `#0a0612`).
- **Ordre des 5 layers** : `Drone + Pulse → Bass → Pad → Arp → Lead`.
- **Restart** : touche `R` + bouton HUD.
- **Input** : clavier WASD + flèches. (Pas de gamepad au MVP ; ajout trivial ensuite.)
- **Audio** : 100% procédural (oscillateurs + noise + envelopes). Pas de samples.
- **RNG** : seeded pour reproductibilité des spawns.
- **Persistence** : aucune au MVP (restart = reset mémoire).
- **Disruption control** : cosmétique (jitter input léger), pas de health/death. Cohérent avec le ton cosy-active.
