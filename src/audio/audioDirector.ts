// src/audio/audioDirector.ts
import type { MusicLayerId } from '../types/index.ts';
import type { MusicLayer } from './layerController.ts';
import {
  DroneLayer,
  PulseLayer,
  BassLayer,
  PadLayer,
  ArpLayer,
  LeadLayer,
} from './layers.ts';
import { audio as audioCfg } from '../content/tuning.ts';

export interface AudioDirector {
  init(): void;
  startBaseLayers(): void;
  unlock(layer: MusicLayerId): void;
  setDissonance(amount: number): void;
  stop(): void;
  resume(): Promise<void>;
  isReady(): boolean;
  getActiveLayerIds(): MusicLayerId[];
  playCollectTone(freq: number): void;
  playAnomalyWarning(): void;
}

export function createAudioDirector(): AudioDirector {
  let ctx: AudioContext | null = null;
  let masterGain: GainNode | null = null;
  let ready = false;

  const layers = new Map<MusicLayerId, MusicLayer>();
  const active = new Set<MusicLayerId>();

  function init() {
    if (ctx) return;
    const AudioCtor = (window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext })
        .webkitAudioContext) as typeof AudioContext;
    ctx = new AudioCtor();
    masterGain = ctx.createGain();
    masterGain.gain.setValueAtTime(audioCfg.masterGain, ctx.currentTime);
    masterGain.connect(ctx.destination);

    const drone = new DroneLayer(ctx, masterGain);
    const pulse = new PulseLayer(ctx, masterGain);
    const bass = new BassLayer(ctx, masterGain);
    const pad = new PadLayer(ctx, masterGain);
    const arp = new ArpLayer(ctx, masterGain);
    const lead = new LeadLayer(ctx, masterGain);

    layers.set('drone', drone);
    layers.set('pulse', pulse);
    layers.set('bass', bass);
    layers.set('pad', pad);
    layers.set('arp', arp);
    layers.set('lead', lead);

    ready = true;
  }

  function startBaseLayers() {
    if (!ctx) return;
    const t = ctx.currentTime + 0.1;
    const drone = layers.get('drone');
    const pulse = layers.get('pulse');
    if (drone) {
      drone.start(t);
      active.add('drone');
    }
    if (pulse) {
      pulse.start(t);
      active.add('pulse');
    }
  }

  function unlock(layer: MusicLayerId) {
    if (!ctx) return;
    if (active.has(layer)) return;
    const instance = layers.get(layer);
    if (!instance) return;
    const t = ctx.currentTime + 0.1;
    instance.start(t);
    active.add(layer);
  }

  function setDissonance(amount: number) {
    if (!ctx) return;
    const t = ctx.currentTime;
    const loss = amount * audioCfg.dissonanceMaxGainLoss;
    for (const id of active) {
      const layer = layers.get(id);
      if (!layer) continue;
      layer.setDissonance(amount, t);
      layer.setLevel(0.55 * (1 - loss), t);
    }
    if (masterGain) {
      const globalAttenuation = 1 - amount * 0.2;
      masterGain.gain.linearRampToValueAtTime(
        audioCfg.masterGain * globalAttenuation,
        t + 0.4,
      );
    }
    if (amount > 0.15) {
      playAnomalyWarning();
    } else {
      _clearWarning();
    }
  }

  function stop() {
    if (!ctx) return;
    const t = ctx.currentTime + 0.05;
    for (const id of active) {
      const layer = layers.get(id);
      if (layer) layer.stop(t);
    }
    active.clear();
  }

  async function resume() {
    if (!ctx) return;
    if (ctx.state === 'suspended') {
      await ctx.resume();
    }
  }

  function isReady(): boolean {
    return ready;
  }

  function getActiveLayerIds(): MusicLayerId[] {
    return Array.from(active);
  }

  function playCollectTone(freq: number) {
    if (!ctx || !masterGain) return;
    const t = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(freq, t);
    osc.frequency.exponentialRampToValueAtTime(freq * 1.5, t + 0.18);
    gain.gain.setValueAtTime(0, t);
    gain.gain.linearRampToValueAtTime(0.35, t + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.45);
    osc.connect(gain);
    gain.connect(masterGain);
    osc.start(t);
    osc.stop(t + 0.5);
  }

  let warningTimer: ReturnType<typeof setInterval> | null = null;
  function playAnomalyWarning() {
    if (!ctx || !masterGain) return;
    if (warningTimer) return;
    warningTimer = setInterval(() => {
      if (!ctx || !masterGain) return;
      const t = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'square';
      osc.frequency.setValueAtTime(220, t);
      gain.gain.setValueAtTime(0, t);
      gain.gain.linearRampToValueAtTime(0.12, t + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.2);
      osc.connect(gain);
      gain.connect(masterGain);
      osc.start(t);
      osc.stop(t + 0.25);
    }, 600);
  }

  function _clearWarning() {
    if (warningTimer) {
      clearInterval(warningTimer);
      warningTimer = null;
    }
  }

  return {
    init,
    startBaseLayers,
    unlock,
    setDissonance,
    stop,
    resume,
    isReady,
    getActiveLayerIds,
    playCollectTone,
    playAnomalyWarning,
  };
}
