// src/audio/layers.ts
import { GainLayerBase, type MusicLayer } from './layerController.ts';
import { secondsPerBeat } from './synth.ts';
import {
  droneRoot,
  droneFifth,
  bassPattern,
  arpPattern,
  leadPattern,
  padNotes,
} from '../content/scale.ts';
import { audio as audioCfg } from '../content/tuning.ts';

export class DroneLayer extends GainLayerBase {
  private osc1: OscillatorNode;
  private osc2: OscillatorNode;
  private filter: BiquadFilterNode;
  private lfo: OscillatorNode;
  private lfoGain: GainNode;

  constructor(ctx: AudioContext, destination: AudioNode) {
    super('drone', ctx, destination);
    const t0 = ctx.currentTime;
    this.osc1 = ctx.createOscillator();
    this.osc1.type = 'sawtooth';
    this.osc1.frequency.setValueAtTime(droneRoot, t0);

    this.osc2 = ctx.createOscillator();
    this.osc2.type = 'sawtooth';
    this.osc2.frequency.setValueAtTime(droneFifth, t0);

    this.filter = ctx.createBiquadFilter();
    this.filter.type = 'lowpass';
    this.filter.frequency.setValueAtTime(600, t0);
    this.filter.Q.setValueAtTime(1.5, t0);

    this.lfo = ctx.createOscillator();
    this.lfo.type = 'sine';
    this.lfo.frequency.setValueAtTime(0.18, t0);
    this.lfoGain = ctx.createGain();
    this.lfoGain.gain.setValueAtTime(220, t0);
    this.lfo.connect(this.lfoGain);
    this.lfoGain.connect(this.filter.frequency);

    this.osc1.connect(this.filter);
    this.osc2.connect(this.filter);
    this.filter.connect(this.gainNode);

    this.osc1.start();
    this.osc2.start();
    this.lfo.start();
  }

  override setDissonance(amount: number, when: number): void {
    super.setDissonance(amount, when);
    const detune = amount * 60;
    this.osc1.detune.linearRampToValueAtTime(detune, when + 0.3);
    this.osc2.detune.linearRampToValueAtTime(-detune, when + 0.3);
    const cutoff = 600 + amount * 1200;
    this.filter.frequency.linearRampToValueAtTime(cutoff, when + 0.5);
  }
}

export class PulseLayer extends GainLayerBase {
  private ctx: AudioContext;
  private nextNoteTime: number;
  private beatIndex = 0;
  private scheduler: ReturnType<typeof setInterval> | null = null;
  private bpm: number;
  private readonly beatDuration: number;

  constructor(ctx: AudioContext, destination: AudioNode) {
    super('pulse', ctx, destination);
    this.ctx = ctx;
    this.bpm = audioCfg.bpm;
    this.beatDuration = secondsPerBeat(this.bpm);
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
    const horizon = this.ctx.currentTime + 0.25;
    while (this.nextNoteTime < horizon) {
      this.playKick(this.nextNoteTime, this.beatIndex % 4 === 1 || this.beatIndex % 4 === 3);
      this.nextNoteTime += this.beatDuration / 2;
      this.beatIndex++;
    }
  }

  private playKick(time: number, accent: boolean) {
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(120, time);
    osc.frequency.exponentialRampToValueAtTime(45, time + 0.18);
    const peak = accent ? 0.7 : 0.45;
    gain.gain.setValueAtTime(0, time);
    gain.gain.linearRampToValueAtTime(peak, time + 0.005);
    gain.gain.exponentialRampToValueAtTime(0.0001, time + 0.32);
    osc.connect(gain);
    gain.connect(this.gainNode);
    osc.start(time);
    osc.stop(time + 0.35);
  }

  override setDissonance(amount: number, when: number): void {
    super.setDissonance(amount, when);
    this.bpm = audioCfg.bpm + amount * 18;
    const newBeat = secondsPerBeat(this.bpm);
    const drift = (newBeat - this.beatDuration) / this.beatDuration;
    void drift;
  }
}

abstract class StepLayer extends GainLayerBase {
  protected ctx: AudioContext;
  protected nextStepTime: number;
  protected stepIndex = 0;
  protected stepsPerBeat = 1;
  protected scheduler: ReturnType<typeof setInterval> | null = null;
  protected bpm: number;
  protected beatDuration: number;

  constructor(id: MusicLayer['id'], ctx: AudioContext, destination: AudioNode) {
    super(id, ctx, destination);
    this.ctx = ctx;
    this.bpm = audioCfg.bpm;
    this.beatDuration = secondsPerBeat(this.bpm);
    this.nextStepTime = ctx.currentTime + 0.4;
  }

  protected stepDuration(): number {
    return this.beatDuration / this.stepsPerBeat;
  }

  protected abstract pattern(): number[];
  protected abstract noteDuration(): number;
  protected abstract playStep(freq: number, time: number): void;

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
    const pattern = this.pattern();
    while (this.nextStepTime < horizon) {
      const f = pattern[this.stepIndex % pattern.length];
      if (f > 0) this.playStep(f, this.nextStepTime);
      this.nextStepTime += this.stepDuration();
      this.stepIndex++;
    }
  }
}

export class BassLayer extends StepLayer {
  constructor(ctx: AudioContext, destination: AudioNode) {
    super('bass', ctx, destination);
    this.stepsPerBeat = 1;
  }

  protected pattern(): number[] {
    return bassPattern;
  }
  protected noteDuration(): number {
    return 0.45;
  }
  protected playStep(freq: number, time: number): void {
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(280, time);
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(freq / 2, time);
    gain.gain.setValueAtTime(0, time);
    gain.gain.linearRampToValueAtTime(0.55, time + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.001, time + this.noteDuration());
    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.gainNode);
    osc.start(time);
    osc.stop(time + this.noteDuration() + 0.05);
  }
}

export class PadLayer extends GainLayerBase {
  private oscs: OscillatorNode[] = [];
  private filter: BiquadFilterNode;

  constructor(ctx: AudioContext, destination: AudioNode) {
    super('pad', ctx, destination);
    const t0 = ctx.currentTime;
    this.filter = ctx.createBiquadFilter();
    this.filter.type = 'lowpass';
    this.filter.frequency.setValueAtTime(1400, t0);
    this.filter.Q.setValueAtTime(0.6, t0);
    this.filter.connect(this.gainNode);

    for (const f of padNotes) {
      const a = ctx.createOscillator();
      a.type = 'sawtooth';
      a.frequency.setValueAtTime(f, t0);
      const g = ctx.createGain();
      g.gain.setValueAtTime(0.18, t0);
      a.connect(g);
      g.connect(this.filter);
      a.start();
      this.oscs.push(a);
    }
  }

  override setDissonance(amount: number, when: number): void {
    super.setDissonance(amount, when);
    const detune = amount * 25;
    this.oscs[0].detune.linearRampToValueAtTime(detune, when + 0.3);
    if (this.oscs[2]) {
      this.oscs[2].detune.linearRampToValueAtTime(-detune * 1.3, when + 0.3);
    }
    const cutoff = 1400 - amount * 800;
    this.filter.frequency.linearRampToValueAtTime(cutoff, when + 0.6);
  }
}

export class ArpLayer extends StepLayer {
  constructor(ctx: AudioContext, destination: AudioNode) {
    super('arp', ctx, destination);
    this.stepsPerBeat = 2;
  }

  protected pattern(): number[] {
    return arpPattern;
  }
  protected noteDuration(): number {
    return 0.18;
  }
  protected playStep(freq: number, time: number): void {
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'square';
    osc.frequency.setValueAtTime(freq, time);
    gain.gain.setValueAtTime(0, time);
    gain.gain.linearRampToValueAtTime(0.18, time + 0.005);
    gain.gain.exponentialRampToValueAtTime(0.001, time + this.noteDuration());
    osc.connect(gain);
    gain.connect(this.gainNode);
    osc.start(time);
    osc.stop(time + this.noteDuration() + 0.02);
  }
}

export class LeadLayer extends StepLayer {
  constructor(ctx: AudioContext, destination: AudioNode) {
    super('lead', ctx, destination);
    this.stepsPerBeat = 1;
  }

  protected pattern(): number[] {
    return leadPattern;
  }
  protected noteDuration(): number {
    return 0.5;
  }
  protected playStep(freq: number, time: number): void {
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(2400, time);
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(freq, time);
    gain.gain.setValueAtTime(0, time);
    gain.gain.linearRampToValueAtTime(0.22, time + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.001, time + this.noteDuration());
    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.gainNode);
    osc.start(time);
    osc.stop(time + this.noteDuration() + 0.05);
  }
}
