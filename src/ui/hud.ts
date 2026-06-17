// src/ui/hud.ts
import type { EventBus } from '../core/events.ts';
import type { World } from '../core/world.ts';
import { progression } from '../content/progression.ts';
import type { AudioDirector } from '../audio/audioDirector.ts';

export interface HudHandle {
  update(): void;
  dispose(): void;
}

export function createHud(
  world: World,
  bus: EventBus,
  audio: AudioDirector,
  onReset: () => void,
): HudHandle {
  const root = document.createElement('div');
  root.id = 'hud';
  root.innerHTML = `
    <div class="hud-top">
      <div class="hud-title">Echo Drifter</div>
      <button id="hud-restart" class="hud-btn" type="button">Restart (R)</button>
    </div>
    <div class="hud-layers">
      <div class="hud-label">Layers</div>
      <div class="hud-layer-row">
        <span class="layer-pill on">drone</span>
        <span class="layer-pill on">pulse</span>
        <span class="layer-pill" data-layer="bass">bass</span>
        <span class="layer-pill" data-layer="pad">pad</span>
        <span class="layer-pill" data-layer="arp">arp</span>
        <span class="layer-pill" data-layer="lead">lead</span>
      </div>
    </div>
    <div class="hud-meter">
      <div class="hud-label">Dissonance</div>
      <div class="meter-track">
        <div class="meter-fill" id="dissonance-fill"></div>
      </div>
    </div>
    <div class="hud-foot">
      <span id="hint-text">Drift toward a glowing fragment to unlock a layer.</span>
    </div>
  `;
  document.body.appendChild(root);

  const dissonanceFill = root.querySelector<HTMLDivElement>('#dissonance-fill');
  const restartBtn = root.querySelector<HTMLButtonElement>('#hud-restart');
  const hint = root.querySelector<HTMLSpanElement>('#hint-text');

  restartBtn?.addEventListener('click', () => onReset());

  const layerPills = new Map<string, HTMLSpanElement>();
  root.querySelectorAll<HTMLSpanElement>('.layer-pill').forEach((el) => {
    const id = el.dataset.layer ?? el.textContent ?? '';
    layerPills.set(id, el);
  });

  bus.on('MUSIC_LAYER_UNLOCKED', (e) => {
    const pill = layerPills.get(e.layer);
    if (pill) pill.classList.add('on');
    if (hint) {
      const entry = progression.find((p) => p.layer === e.layer);
      hint.textContent = entry ? `Unlocked: ${entry.label}` : `Unlocked: ${e.layer}`;
    }
  });

  bus.on('ANOMALY_ENTER', () => {
    if (hint) hint.textContent = 'Dissonance detected - ease out of the bloom.';
  });

  bus.on('ANOMALY_EXIT', () => {
    if (hint) hint.textContent = 'Harmony returning…';
  });

  bus.on('RESET', () => {
    layerPills.forEach((el, id) => {
      if (id === 'drone' || id === 'pulse') {
        el.classList.add('on');
      } else {
        el.classList.remove('on');
      }
    });
    if (hint) hint.textContent = 'Drift toward a glowing fragment to unlock a layer.';
  });

  function update() {
    if (dissonanceFill) {
      dissonanceFill.style.width = `${Math.round(world.dissonance * 100)}%`;
    }
    void audio;
  }

  function dispose() {
    root.remove();
  }

  return { update, dispose };
}
