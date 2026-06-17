// src/audio/layers.ts
import { GainLayerBase, type MusicLayer } from './layerController.ts';
import {
  secondsPerBeat,
  kickEnvelope,
  hatEnvelope,
  createNoiseBuffer,
} from './synth.ts';
import { audio as audioCfg } from '../content/tuning.ts';

export class DroneLayer extends GainLayerBase {
  private osc1: OscillatorNode;
  private osc2: OscillatorNode;
  private filter: BiquadFilterNode;
  private ampLfo: OscillatorNode;
  private ampLfoGain: GainNode;

  constructor(ctx: AudioContext, destination: AudioNode) {
    super('drone', ctx, destination, {
      fadeInSec: audioCfg.drone.fadeInSec,
      fadeOutSec: audioCfg.drone.fadeOutSec,
    });
    this.targetLevel = audioCfg.drone.layerGain;
    const t0 = ctx.currentTime;

    this.osc1 = ctx.createOscillator();
    this.osc1.type = 'sine';
    this.osc1.frequency.setValueAtTime(audioCfg.drone.rootHz, t0);

    this.osc2 = ctx.createOscillator();
    this.osc2.type = 'sine';
    this.osc2.frequency.setValueAtTime(audioCfg.drone.fifthHz, t0);
    this.osc2.detune.setValueAtTime(audioCfg.drone.detuneCents, t0);

    this.filter = ctx.createBiquadFilter();
    this.filter.type = 'lowpass';
    this.filter.frequency.setValueAtTime(audioCfg.drone.filterHz, t0);
    this.filter.Q.setValueAtTime(audioCfg.drone.filterQ, t0);

    this.ampLfo = ctx.createOscillator();
    this.ampLfo.type = 'sine';
    this.ampLfo.frequency.setValueAtTime(audioCfg.drone.ampLfoHz, t0);
    this.ampLfoGain = ctx.createGain();
    this.ampLfoGain.gain.setValueAtTime(audioCfg.drone.ampLfoDepth, t0);
    this.ampLfo.connect(this.ampLfoGain);
    this.ampLfoGain.connect(this.gainNode.gain);

    this.osc1.connect(this.filter);
    this.osc2.connect(this.filter);
    this.filter.connect(this.gainNode);

    this.osc1.start();
    this.osc2.start();
    this.ampLfo.start();
  }

  override setDissonance(amount: number, when: number): void {
    super.setDissonance(amount, when);
    const cents = amount * audioCfg.dissonance.detuneCents;
    this.osc1.detune.linearRampToValueAtTime(cents, when + 0.3);
    this.osc2.detune.linearRampToValueAtTime(
      cents + audioCfg.drone.detuneCents,
      when + 0.3,
    );
  }
}

export class PulseLayer extends GainLayerBase {
  private ctx: AudioContext;
  private nextTickTime: number;
  private tickIndex = 0;
  private scheduler: ReturnType<typeof setInterval> | null = null;
  private noiseBuffer: AudioBuffer;
  private readonly beatDuration: number;
  private readonly tickDuration: number;

  constructor(ctx: AudioContext, destination: AudioNode) {
    super('pulse', ctx, destination, {
      fadeInSec: audioCfg.pulse.fadeInSec,
      fadeOutSec: audioCfg.pulse.fadeOutSec,
    });
    this.targetLevel = audioCfg.pulse.layerGain;
    this.ctx = ctx;
    this.beatDuration = secondsPerBeat(audioCfg.bpm);
    this.tickDuration = this.beatDuration / 2;
    this.nextTickTime = ctx.currentTime + 0.1;
    this.noiseBuffer = createNoiseBuffer(ctx, audioCfg.pulse.hat.durationMs + 5);
  }

  override start(when: number): void {
    super.start(when);
    if (this.scheduler) return;
    this.scheduler = setInterval(() => this.scheduleAhead(), 25);
  }

  override stop(when: number): void {
    super.stop(when);
    if (this.scheduler) {
      clearInterval(this.scheduler);
      this.scheduler = null;
    }
  }

  private scheduleAhead() {
    const horizon = this.ctx.currentTime + 0.25;
    while (this.nextTickTime < horizon) {
      const positionInBar = this.tickIndex % 8;
      if (positionInBar === 0 || positionInBar === 4) {
        kickEnvelope(
          this.ctx,
          this.gainNode,
          audioCfg.pulse.kick.startHz,
          audioCfg.pulse.kick.endHz,
          audioCfg.pulse.kick.durationMs,
          audioCfg.pulse.kick.peakGain,
          this.nextTickTime,
        );
      } else if (positionInBar === 2 || positionInBar === 6) {
        hatEnvelope(
          this.ctx,
          this.gainNode,
          this.noiseBuffer,
          audioCfg.pulse.hat.filterHz,
          audioCfg.pulse.hat.durationMs,
          audioCfg.pulse.hat.peakGain,
          this.nextTickTime,
        );
      }
      this.nextTickTime += this.tickDuration;
      this.tickIndex++;
    }
  }
}

export class BassLayer extends GainLayerBase {
  private ctx: AudioContext;
  private scheduler: ReturnType<typeof setInterval> | null = null;
  private nextNoteTime: number;
  private readonly noteDurationSec: number;
  private readonly beatDuration: number;
  private noteIndex = 0;

  constructor(ctx: AudioContext, destination: AudioNode) {
    super('bass', ctx, destination, {
      fadeInSec: audioCfg.bass.fadeInSec,
      fadeOutSec: audioCfg.bass.fadeOutSec,
    });
    this.targetLevel = audioCfg.bass.layerGain;
    this.ctx = ctx;
    this.beatDuration = secondsPerBeat(audioCfg.bpm);
    this.noteDurationSec = audioCfg.bass.noteDurationMs / 1000;
    this.nextNoteTime = ctx.currentTime + 0.2;
  }

  override start(when: number): void {
    super.start(when);
    if (this.scheduler) return;
    this.scheduler = setInterval(() => this.scheduleAhead(), 25);
  }

  override stop(when: number): void {
    super.stop(when);
    if (this.scheduler) {
      clearInterval(this.scheduler);
      this.scheduler = null;
    }
  }

  private scheduleAhead() {
    const horizon = this.ctx.currentTime + 0.3;
    while (this.nextNoteTime < horizon) {
      this.playNote(this.nextNoteTime);
      this.nextNoteTime += this.beatDuration * 4;
      this.noteIndex++;
      void this.noteIndex;
    }
  }

  private playNote(time: number): void {
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(audioCfg.bass.filterHz, time);
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(audioCfg.bass.noteHz, time);
    gain.gain.setValueAtTime(0, time);
    gain.gain.linearRampToValueAtTime(1, time + 0.005);
    gain.gain.linearRampToValueAtTime(0.4, time + 0.05);
    gain.gain.exponentialRampToValueAtTime(0.001, time + 0.3);
    gain.gain.exponentialRampToValueAtTime(0.0001, time + this.noteDurationSec);
    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.gainNode);
    osc.start(time);
    osc.stop(time + this.noteDurationSec + 0.05);
  }
}

export class PadLayer extends GainLayerBase {
  private ctx: AudioContext;
  private filter: BiquadFilterNode;
  private scheduler: ReturnType<typeof setInterval> | null = null;
  private nextNoteTime: number;
  private noteIndex = 0;

  constructor(ctx: AudioContext, destination: AudioNode) {
    super('pad', ctx, destination, {
      fadeInSec: audioCfg.pad.fadeInSec,
      fadeOutSec: audioCfg.pad.fadeOutSec,
    });
    this.targetLevel = audioCfg.pad.layerGain;
    this.ctx = ctx;
    this.filter = ctx.createBiquadFilter();
    this.filter.type = 'lowpass';
    this.filter.frequency.setValueAtTime(audioCfg.pad.filterHz, ctx.currentTime);
    this.filter.connect(this.gainNode);
    this.nextNoteTime = ctx.currentTime + 0.2;
  }

  override start(when: number): void {
    super.start(when);
    if (this.scheduler) return;
    this.scheduler = setInterval(() => this.scheduleAhead(), 50);
  }

  override stop(when: number): void {
    super.stop(when);
    if (this.scheduler) {
      clearInterval(this.scheduler);
      this.scheduler = null;
    }
  }

  private scheduleAhead() {
    const horizon = this.ctx.currentTime + 0.4;
    while (this.nextNoteTime < horizon) {
      this.playNote(this.nextNoteTime);
      this.nextNoteTime += audioCfg.pad.noteIntervalSec;
      this.noteIndex++;
    }
  }

  private playNote(time: number): void {
    const seq = audioCfg.pad.noteSequenceHz;
    const freq = seq[this.noteIndex % seq.length];
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(freq, time);
    const dur = audioCfg.pad.noteDurationSec;
    const a = audioCfg.pad.attackSec;
    const d = audioCfg.pad.decaySec;
    const s = audioCfg.pad.sustainLevel;
    const r = audioCfg.pad.releaseSec;
    gain.gain.setValueAtTime(0, time);
    gain.gain.linearRampToValueAtTime(1, time + a);
    gain.gain.linearRampToValueAtTime(s, time + a + d);
    gain.gain.setValueAtTime(s, time + a + d + 0.001);
    gain.gain.linearRampToValueAtTime(0, time + a + d + 0.001 + r);
    osc.connect(gain);
    gain.connect(this.filter);
    osc.start(time);
    osc.stop(time + dur + r + 0.05);
  }
}

export class ArpLayer extends GainLayerBase {
  private ctx: AudioContext;
  private delay: DelayNode;
  private delayFeedback: GainNode;
  private scheduler: ReturnType<typeof setInterval> | null = null;
  private nextNoteTime: number;
  private noteIndex = 0;
  private readonly noteDurationSec: number;

  constructor(ctx: AudioContext, destination: AudioNode) {
    super('arp', ctx, destination, {
      fadeInSec: audioCfg.arp.fadeInSec,
      fadeOutSec: audioCfg.arp.fadeOutSec,
    });
    this.targetLevel = audioCfg.arp.layerGain;
    this.ctx = ctx;
    this.noteDurationSec = audioCfg.arp.noteDurationSec;
    this.delay = ctx.createDelay(1.0);
    this.delay.delayTime.setValueAtTime(audioCfg.arp.delayMs / 1000, ctx.currentTime);
    this.delayFeedback = ctx.createGain();
    this.delayFeedback.gain.setValueAtTime(
      audioCfg.arp.delayFeedback,
      ctx.currentTime,
    );
    this.delay.connect(this.delayFeedback);
    this.delayFeedback.connect(this.delay);
    this.delay.connect(this.gainNode);
    this.nextNoteTime = ctx.currentTime + 0.2;
  }

  override start(when: number): void {
    super.start(when);
    if (this.scheduler) return;
    this.scheduler = setInterval(() => this.scheduleAhead(), 25);
  }

  override stop(when: number): void {
    super.stop(when);
    if (this.scheduler) {
      clearInterval(this.scheduler);
      this.scheduler = null;
    }
  }

  private scheduleAhead() {
    const horizon = this.ctx.currentTime + 0.4;
    while (this.nextNoteTime < horizon) {
      this.playNote(this.nextNoteTime);
      this.nextNoteTime += audioCfg.arp.noteIntervalSec;
      this.noteIndex++;
    }
  }

  private playNote(time: number): void {
    const seq = audioCfg.arp.noteSequenceHz;
    const freq = seq[this.noteIndex % seq.length];
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq, time);
    const dur = this.noteDurationSec;
    gain.gain.setValueAtTime(0, time);
    gain.gain.linearRampToValueAtTime(1, time + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.001, time + dur);
    osc.connect(gain);
    gain.connect(this.delay);
    osc.start(time);
    osc.stop(time + dur + 0.05);
  }
}

export class LeadLayer extends GainLayerBase {
  private ctx: AudioContext;
  private scheduler: ReturnType<typeof setInterval> | null = null;
  private nextNoteTime: number;
  private noteIndex = 0;

  constructor(ctx: AudioContext, destination: AudioNode) {
    super('lead', ctx, destination, {
      fadeInSec: audioCfg.lead.fadeInSec,
      fadeOutSec: audioCfg.lead.fadeOutSec,
    });
    this.targetLevel = audioCfg.lead.layerGain;
    this.ctx = ctx;
    this.nextNoteTime = ctx.currentTime + 0.2;
  }

  override start(when: number): void {
    super.start(when);
    if (this.scheduler) return;
    this.scheduler = setInterval(() => this.scheduleAhead(), 50);
  }

  override stop(when: number): void {
    super.stop(when);
    if (this.scheduler) {
      clearInterval(this.scheduler);
      this.scheduler = null;
    }
  }

  private scheduleAhead() {
    const horizon = this.ctx.currentTime + 0.4;
    const phraseLen = audioCfg.lead.noteSequenceHz.length;
    while (this.nextNoteTime < horizon) {
      this.playNote(this.nextNoteTime);
      this.noteIndex++;
      const inPhrase = this.noteIndex % (phraseLen + 1);
      if (inPhrase < phraseLen) {
        this.nextNoteTime += audioCfg.lead.noteDurationSec;
      } else {
        this.nextNoteTime += audioCfg.lead.phrasePauseSec;
      }
    }
  }

  private playNote(time: number): void {
    const seq = audioCfg.lead.noteSequenceHz;
    const phraseLen = seq.length;
    const idx = this.noteIndex % (phraseLen + 1);
    if (idx >= phraseLen) return;
    const freq = seq[idx];
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq, time);
    const dur = audioCfg.lead.noteDurationSec;
    gain.gain.setValueAtTime(0, time);
    gain.gain.linearRampToValueAtTime(1, time + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.001, time + dur);
    osc.connect(gain);
    gain.connect(this.gainNode);
    osc.start(time);
    osc.stop(time + dur + 0.05);
  }
}

export type AnyLayer = MusicLayer;
