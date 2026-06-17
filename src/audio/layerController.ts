// src/audio/layerController.ts
import type { MusicLayerId } from '../types/index.ts';

export interface MusicLayer {
  readonly id: MusicLayerId;
  start(when: number): void;
  stop(when: number): void;
  setLevel(level: number, when: number): void;
  setDissonance(amount: number, when: number): void;
}

export class GainLayerBase implements MusicLayer {
  readonly id: MusicLayerId;
  protected gainNode: GainNode;
  protected targetLevel = 0.5;
  protected currentLevel = 0;
  protected dissonance = 0;
  protected playing = false;

  constructor(id: MusicLayerId, ctx: AudioContext, destination: AudioNode) {
    this.id = id;
    this.gainNode = ctx.createGain();
    this.gainNode.gain.setValueAtTime(0, ctx.currentTime);
    this.gainNode.connect(destination);
  }

  start(_when: number): void {
    this.playing = true;
    this.gainNode.gain.cancelScheduledValues(0);
    this.gainNode.gain.linearRampToValueAtTime(this.targetLevel, _when + 0.8);
  }

  stop(when: number): void {
    this.playing = false;
    this.gainNode.gain.cancelScheduledValues(when);
    this.gainNode.gain.setValueAtTime(this.gainNode.gain.value, when);
    this.gainNode.gain.linearRampToValueAtTime(0, when + 0.6);
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

  get output(): AudioNode {
    return this.gainNode;
  }
}
