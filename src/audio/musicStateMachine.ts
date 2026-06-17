// src/audio/musicStateMachine.ts
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

export interface MusicStateMachine {
  init(): void;
  start(): void;
  unlock(layer: MusicLayerId): void;
  setDissonance(amount: number): void;
  stop(): void;
  resume(): Promise<void>;
  isReady(): boolean;
  getActiveLayerIds(): MusicLayerId[];
  playCollectTone(freq: number): void;
}

export function createMusicStateMachine(): MusicStateMachine {
  let ctx: AudioContext | null = null;
  let masterGain: GainNode | null = null;
  let warningDelay: DelayNode | null = null;
  let warningDelayFb: GainNode | null = null;
  let warningTimer: ReturnType<typeof setInterval> | null = null;
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

    warningDelay = ctx.createDelay(1.0);
    warningDelay.delayTime.setValueAtTime(
      audioCfg.warning.delayMs / 1000,
      ctx.currentTime,
    );
    warningDelayFb = ctx.createGain();
    warningDelayFb.gain.setValueAtTime(
      audioCfg.warning.delayFeedback,
      ctx.currentTime,
    );
    warningDelay.connect(warningDelayFb);
    warningDelayFb.connect(warningDelay);
    warningDelay.connect(masterGain);

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

  function start() {
    if (!ctx) return;
    const now = ctx.currentTime;
    const drone = layers.get('drone');
    if (drone) {
      drone.start(now + audioCfg.drone.startDelaySec);
      active.add('drone');
    }
    const pulse = layers.get('pulse');
    if (pulse) {
      pulse.start(now + audioCfg.pulse.startDelaySec);
      active.add('pulse');
    }
  }

  function unlock(layer: MusicLayerId) {
    if (!ctx) return;
    if (active.has(layer)) return;
    const instance = layers.get(layer);
    if (!instance) return;
    const t = ctx.currentTime + 0.05;
    instance.start(t);
    active.add(layer);
  }

  function setDissonance(amount: number) {
    if (!ctx || !masterGain) return;
    const t = ctx.currentTime;

    for (const id of active) {
      const layer = layers.get(id);
      if (!layer) continue;
      layer.setDissonance(amount, t);
    }

    if (masterGain) {
      const target = audioCfg.masterGain * (1 - amount * (1 - audioCfg.dissonance.masterGainFactor));
      masterGain.gain.cancelScheduledValues(t);
      masterGain.gain.setValueAtTime(masterGain.gain.value, t);
      masterGain.gain.linearRampToValueAtTime(
        target,
        t + audioCfg.dissonance.recoverSec * 0.4,
      );
    }

    if (amount > 0.15) {
      startWarning();
    } else {
      stopWarning();
    }
  }

  function startWarning() {
    if (!ctx || !warningDelay || !masterGain) return;
    if (warningTimer) return;
    warningTimer = setInterval(() => {
      if (!ctx || !warningDelay) return;
      const t = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(audioCfg.warning.sineHz, t);
      const dur = audioCfg.warning.durationMs / 1000;
      gain.gain.setValueAtTime(0, t);
      gain.gain.linearRampToValueAtTime(audioCfg.warning.peakGain, t + 0.005);
      gain.gain.exponentialRampToValueAtTime(0.0001, t + dur);
      osc.connect(gain);
      gain.connect(warningDelay);
      osc.start(t);
      osc.stop(t + dur + 0.02);
    }, audioCfg.warning.intervalMs);
  }

  function stopWarning() {
    if (warningTimer) {
      clearInterval(warningTimer);
      warningTimer = null;
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
    stopWarning();
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
    gain.gain.setValueAtTime(0, t);
    gain.gain.linearRampToValueAtTime(0.35, t + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.25);
    osc.connect(gain);
    gain.connect(masterGain);
    osc.start(t);
    osc.stop(t + 0.3);
  }

  return {
    init,
    start,
    unlock,
    setDissonance,
    stop,
    resume,
    isReady,
    getActiveLayerIds,
    playCollectTone,
  };
}
