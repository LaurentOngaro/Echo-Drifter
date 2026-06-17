// src/audio/layerController.ts
import type { MusicLayerId } from '../types/index.ts';
import { audio as audioCfg } from '../content/tuning.ts';

export interface MusicLayer {
  readonly id: MusicLayerId;
  start(when: number): void;
  stop(when: number): void;
  setLevel(level: number, when: number): void;
  setDissonance(amount: number, when: number): void;
  getOutputNode(): AudioNode;
}

export interface LayerFade {
  fadeInSec: number;
  fadeOutSec: number;
}

export class GainLayerBase implements MusicLayer {
  readonly id: MusicLayerId;
  protected gainNode: GainNode;
  protected targetLevel = 0.5;
  protected dissonance = 0;
  protected playing = false;
  protected readonly fadeInSec: number;
  protected readonly fadeOutSec: number;

  constructor(
    id: MusicLayerId,
    ctx: AudioContext,
    destination: AudioNode,
    fades: LayerFade = {
      fadeInSec: audioCfg.fadeInMinSec,
      fadeOutSec: audioCfg.fadeOutMinSec,
    },
  ) {
    this.id = id;
    this.fadeInSec = Math.max(fades.fadeInSec, audioCfg.fadeInMinSec);
    this.fadeOutSec = Math.max(fades.fadeOutSec, audioCfg.fadeOutMinSec);
    this.gainNode = ctx.createGain();
    this.gainNode.gain.setValueAtTime(0, ctx.currentTime);
    this.gainNode.connect(destination);
  }

  start(when: number): void {
    this.playing = true;
    this.gainNode.gain.cancelScheduledValues(when);
    this.gainNode.gain.setValueAtTime(this.gainNode.gain.value, when);
    this.gainNode.gain.linearRampToValueAtTime(this.targetLevel, when + this.fadeInSec);
  }

  stop(when: number): void {
    this.playing = false;
    this.gainNode.gain.cancelScheduledValues(when);
    this.gainNode.gain.setValueAtTime(this.gainNode.gain.value, when);
    this.gainNode.gain.linearRampToValueAtTime(0, when + this.fadeOutSec);
  }

  setLevel(level: number, when: number): void {
    this.targetLevel = level;
    if (this.playing) {
      this.gainNode.gain.cancelScheduledValues(when);
      this.gainNode.gain.setValueAtTime(this.gainNode.gain.value, when);
      this.gainNode.gain.linearRampToValueAtTime(level, when + 0.4);
    }
  }

  setDissonance(amount: number, _when: number): void {
    this.dissonance = amount;
  }

  getOutputNode(): AudioNode {
    return this.gainNode;
  }
}
