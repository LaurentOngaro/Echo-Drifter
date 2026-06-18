# Perplexity Chat Important Elements

source: [Perplexity](https://www.perplexity.ai/search/5e7e14b8-5aa5-4515-8fdc-190514a9b512)

## suggestions après V0.1.0

```md
## Architecture invariants kept

- `core/`, `gameplay/` never import `three`.
- `audio/state` (`audioDirector.ts` interface) separated from Web Audio implementation.
- All magic numbers live in `src/content/tuning.ts`.
- Systems communicate via `bus` events + `world` state.

## Assumptions & risks

- **Click/key overlay**: required by browser autoplay policy. Not strictly part of the visual design but necessary.
- **Pulse tempo**: hardcoded 84 BPM; `PulseLayer.bpm` self-mutates under dissonance but its scheduler interval is not re-anchored mid-bar - drift is intentional, not glitchy.
- **Collision = sphere distance**. No physics; no occlusion.
- **First spawn layout** is deterministic (seed 1337). Same layout every reload.
- **No persistence**: reload resets everything.

## Next steps you might want

- Add more anomaly types (pulse leech, phase ghost).
- Add a soft camera shake on dissonance peaks.
- Add a 2D minimap or directional arrow HUD pointer.
- Map music state to a richer visualization (spectrum halo behind player).
```

## suggestions après V0.3.0

```md
Ce que je te conseille pour v0.4.0
Deux options selon la priorité :

Option A — Passage en 2D pur (architectural)
Migrer vers OrthographicCamera + gameplay plan XY. C'est le bon choix long terme, mais ça touche gameplay/ et core/.

Option B — Polish visuel + fix glow (v0.4.0 patch)
Garder la camera actuelle, corriger le bug du carré, ajouter le "juice" et les sons de contact. Plus rapide, meilleur retour immédiat.

Je te conseille Option B d'abord pour avoir un proto agréable à montrer, puis Option A en v0.5.0 pour solidifier le gameplay.
```
