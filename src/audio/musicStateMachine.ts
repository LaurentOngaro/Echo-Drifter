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

  let echoDelay: DelayNode | null = null;
  let echoFb: GainNode | null = null;

  let proxSine: OscillatorNode | null = null;
  let proxTremolo: GainNode | null = null;
  let proxLfo: OscillatorNode | null = null;
  let proxLfoScale: GainNode | null = null;
  let proxEnv: GainNode | null = null;
  let prevDissonance = 0;

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

    echoDelay = ctx.createDelay(1.0);
    echoDelay.delayTime.setValueAtTime(
      audioCfg.collectTone.echoDelayMs / 1000,
      ctx.currentTime,
    );
    echoFb = ctx.createGain();
    echoFb.gain.setValueAtTime(
      audioCfg.collectTone.echoFeedback,
      ctx.currentTime,
    );
    echoDelay.connect(echoFb);
    echoFb.connect(echoDelay);
    echoDelay.connect(masterGain);

    const t0 = ctx.currentTime;
    proxSine = ctx.createOscillator();
    proxSine.type = 'sine';
    proxSine.frequency.setValueAtTime(audioCfg.anomalyProximity.sineHz, t0);
    proxTremolo = ctx.createGain();
    proxTremolo.gain.setValueAtTime(1.0, t0);
    proxSine.connect(proxTremolo);
    proxLfo = ctx.createOscillator();
    proxLfo.type = 'sine';
    proxLfo.frequency.setValueAtTime(audioCfg.anomalyProximity.lfoHz, t0);
    proxLfoScale = ctx.createGain();
    proxLfoScale.gain.setValueAtTime(audioCfg.anomalyProximity.lfoDepth, t0);
    proxLfo.connect(proxLfoScale);
    proxLfoScale.connect(proxTremolo.gain);
    proxEnv = ctx.createGain();
    proxEnv.gain.setValueAtTime(0, t0);
    proxTremolo.connect(proxEnv);
    proxEnv.connect(masterGain);
    proxSine.start(t0);
    proxLfo.start(t0);

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

  function playLayerUnlock() {
    if (!ctx || !masterGain) return;
    const t0 = ctx.currentTime;
    const cfg = audioCfg.layerUnlock;
    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(cfg.filterHz, t0);
    filter.connect(masterGain);

    const freqs = [cfg.rootHz, cfg.thirdHz, cfg.fifthHz];
    for (let i = 0; i < freqs.length; i++) {
      const t = t0 + (i * cfg.noteSpacingMs) / 1000;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freqs[i], t);
      const dur = cfg.noteDurationMs / 1000;
      const release = cfg.releaseSec;
      const total = dur + release;
      gain.gain.setValueAtTime(0, t);
      gain.gain.linearRampToValueAtTime(cfg.noteGain, t + cfg.attackSec);
      gain.gain.setValueAtTime(cfg.noteGain, t + dur);
      gain.gain.linearRampToValueAtTime(0, t + dur + release);
      osc.connect(gain);
      gain.connect(filter);
      osc.start(t);
      osc.stop(t + total + 0.05);
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
    playLayerUnlock();
  }

  function updateProximityEnvelope(amount: number) {
    if (!ctx || !proxEnv) return;
    const t = ctx.currentTime;
    const target = amount > 0 ? amount * audioCfg.anomalyProximity.maxGain : 0;
    const duration =
      amount > prevDissonance
        ? audioCfg.anomalyProximity.fadeInSec
        : audioCfg.anomalyProximity.fadeOutSec;
    proxEnv.gain.cancelScheduledValues(t);
    proxEnv.gain.setValueAtTime(proxEnv.gain.value, t);
    proxEnv.gain.linearRampToValueAtTime(target, t + duration);
    prevDissonance = amount;
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
      const target =
        audioCfg.masterGain *
        (1 - amount * (1 - audioCfg.dissonance.masterGainFactor));
      masterGain.gain.cancelScheduledValues(t);
      masterGain.gain.setValueAtTime(masterGain.gain.value, t);
      masterGain.gain.linearRampToValueAtTime(
        target,
        t + audioCfg.dissonance.recoverSec * 0.4,
      );
    }

    updateProximityEnvelope(amount);

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
    if (proxEnv) {
      proxEnv.gain.cancelScheduledValues(t);
      proxEnv.gain.setValueAtTime(proxEnv.gain.value, t);
      proxEnv.gain.linearRampToValueAtTime(0, t + audioCfg.anomalyProximity.fadeOutSec);
    }
    prevDissonance = 0;
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
    if (!ctx || !masterGain || !echoDelay) return;
    const t = ctx.currentTime;
    const cfg = audioCfg.collectTone;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(freq, t);
    gain.gain.setValueAtTime(0, t);
    gain.gain.linearRampToValueAtTime(0.35, t + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.25);
    osc.connect(gain);
    gain.connect(echoDelay);
    osc.start(t);
    osc.stop(t + 0.3);

    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();
    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(freq * cfg.fifthHzRatio, t);
    const secondDur = cfg.secondOscDurationMs / 1000;
    gain2.gain.setValueAtTime(0, t);
    gain2.gain.linearRampToValueAtTime(cfg.secondOscGain, t + 0.01);
    gain2.gain.exponentialRampToValueAtTime(0.0001, t + secondDur);
    osc2.connect(gain2);
    gain2.connect(echoDelay);
    osc2.start(t);
    osc2.stop(t + secondDur + 0.05);
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
