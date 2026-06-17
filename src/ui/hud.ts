// src/ui/hud.ts
import type { EventBus } from '../core/events.ts';
import type { World } from '../core/world.ts';
import { progression } from '../content/progression.ts';
import type { AudioDirector } from '../audio/audioDirector.ts';
import { palette, visual } from '../content/tuning.ts';

export interface HudHandle {
  update(): void;
  dispose(): void;
}

const LAYER_PILLS: { id: string; label: string; onByDefault: boolean }[] = [
  { id: 'drone', label: 'DRONE', onByDefault: true },
  { id: 'bass', label: 'BASS', onByDefault: false },
  { id: 'pad', label: 'PAD', onByDefault: false },
  { id: 'arp', label: 'ARP', onByDefault: false },
  { id: 'lead', label: 'LEAD', onByDefault: false },
];

function lerpColor(
  a: { r: number; g: number; b: number },
  b: { r: number; g: number; b: number },
  t: number,
) {
  return {
    r: Math.round(a.r + (b.r - a.r) * t),
    g: Math.round(a.g + (b.g - a.g) * t),
    b: Math.round(a.b + (b.b - a.b) * t),
  };
}

function rgbCss(c: { r: number; g: number; b: number }): string {
  return `rgb(${c.r}, ${c.g}, ${c.b})`;
}

export function createHud(
  world: World,
  bus: EventBus,
  audio: AudioDirector,
  onReset: () => void,
): HudHandle {
  const root = document.createElement('div');
  root.id = 'hud';

  const top = document.createElement('div');
  top.className = 'hud-top';

  const title = document.createElement('div');
  title.className = 'hud-title';
  title.textContent = 'ECHO DRIFTER';

  const restartBtn = document.createElement('button');
  restartBtn.id = 'hud-restart';
  restartBtn.className = 'hud-btn';
  restartBtn.type = 'button';
  restartBtn.textContent = 'Restart (R)';
  restartBtn.addEventListener('click', () => onReset());

  top.appendChild(title);
  top.appendChild(restartBtn);

  const layersBlock = document.createElement('div');
  layersBlock.className = 'hud-block';
  const layersLabel = document.createElement('div');
  layersLabel.className = 'hud-label';
  layersLabel.textContent = 'Layers';
  const layerRow = document.createElement('div');
  layerRow.className = 'hud-layer-row';
  for (const p of LAYER_PILLS) {
    const pill = document.createElement('span');
    pill.className = 'layer-pill' + (p.onByDefault ? ' on' : '');
    pill.dataset.layer = p.id;
    pill.textContent = p.label;
    layerRow.appendChild(pill);
  }
  layersBlock.appendChild(layersLabel);
  layersBlock.appendChild(layerRow);

  const meterBlock = document.createElement('div');
  meterBlock.className = 'hud-block';
  const meterLabel = document.createElement('div');
  meterLabel.className = 'hud-label';
  meterLabel.textContent = 'Dissonance';
  const meterTrack = document.createElement('div');
  meterTrack.className = 'meter-track';
  const meterFill = document.createElement('div');
  meterFill.className = 'meter-fill';
  meterFill.id = 'dissonance-fill';
  meterTrack.appendChild(meterFill);
  meterBlock.appendChild(meterLabel);
  meterBlock.appendChild(meterTrack);

  const foot = document.createElement('div');
  foot.className = 'hud-foot';
  const hint = document.createElement('span');
  hint.id = 'hint-text';
  hint.textContent = 'Drift toward a glowing fragment to unlock a layer.';
  foot.appendChild(hint);

  root.appendChild(top);
  root.appendChild(layersBlock);
  root.appendChild(meterBlock);
  root.appendChild(foot);

  document.body.appendChild(root);

  const layerPills = new Map<string, HTMLSpanElement>();
  root.querySelectorAll<HTMLSpanElement>('.layer-pill').forEach((el) => {
    const id = el.dataset.layer ?? el.textContent ?? '';
    layerPills.set(id, el);
  });

  const cyanRgb = {
    r: (visual.palette.player >> 16) & 0xff,
    g: (visual.palette.player >> 8) & 0xff,
    b: visual.palette.player & 0xff,
  };
  const redRgb = {
    r: (visual.palette.anomaly >> 16) & 0xff,
    g: (visual.palette.anomaly >> 8) & 0xff,
    b: visual.palette.anomaly & 0xff,
  };
  void palette;

  bus.on('MUSIC_LAYER_UNLOCKED', (e) => {
    const pill = layerPills.get(e.layer);
    if (pill) pill.classList.add('on');
    const entry = progression.find((p) => p.layer === e.layer);
    hint.textContent = entry
      ? `Unlocked: ${entry.label}`
      : `Unlocked: ${e.layer}`;
  });

  bus.on('ANOMALY_ENTER', () => {
    hint.textContent = 'Dissonance detected - ease out of the bloom.';
  });

  bus.on('ANOMALY_EXIT', () => {
    hint.textContent = 'Harmony returning…';
  });

  bus.on('RESET', () => {
    for (const p of LAYER_PILLS) {
      const el = layerPills.get(p.id);
      if (!el) continue;
      if (p.onByDefault) el.classList.add('on');
      else el.classList.remove('on');
    }
    hint.textContent = 'Drift toward a glowing fragment to unlock a layer.';
  });

  function update() {
    const t = Math.max(0, Math.min(1, world.dissonance));
    meterFill.style.width = `${Math.round(t * 100)}%`;
    meterFill.style.backgroundColor = rgbCss(lerpColor(cyanRgb, redRgb, t));
    void audio;
  }

  function dispose() {
    root.remove();
  }

  return { update, dispose };
}
