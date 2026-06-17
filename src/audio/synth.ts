// src/audio/synth.ts

export function midiToHz(midi: number): number {
  return 440 * Math.pow(2, (midi - 69) / 12);
}

export function adsr(
  param: AudioParam,
  startTime: number,
  attack: number,
  decay: number,
  sustain: number,
  release: number,
  peak: number,
) {
  param.setValueAtTime(0, startTime);
  param.linearRampToValueAtTime(peak, startTime + attack);
  param.linearRampToValueAtTime(peak * sustain, startTime + attack + decay);
  param.setValueAtTime(peak * sustain, startTime + attack + decay + 0.001);
  param.linearRampToValueAtTime(0, startTime + attack + decay + 0.001 + release);
}

export function now(ctx: AudioContext): number {
  return ctx.currentTime;
}

export function secondsPerBeat(bpm: number): number {
  return 60 / bpm;
}
