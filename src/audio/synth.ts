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

export function centsToRatio(cents: number): number {
  return Math.pow(2, cents / 1200);
}

export function kickEnvelope(
  ctx: AudioContext,
  destination: AudioNode,
  startHz: number,
  endHz: number,
  durationMs: number,
  peak: number,
  startTime: number,
): void {
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = 'sine';
  osc.frequency.setValueAtTime(startHz, startTime);
  osc.frequency.exponentialRampToValueAtTime(endHz, startTime + durationMs / 1000);
  const dur = durationMs / 1000;
  gain.gain.setValueAtTime(0, startTime);
  gain.gain.linearRampToValueAtTime(peak, startTime + 0.005);
  gain.gain.exponentialRampToValueAtTime(0.0001, startTime + dur);
  osc.connect(gain);
  gain.connect(destination);
  osc.start(startTime);
  osc.stop(startTime + dur + 0.02);
}

export function createNoiseBuffer(ctx: AudioContext, durationMs: number): AudioBuffer {
  const sampleRate = ctx.sampleRate;
  const length = Math.max(1, Math.floor((durationMs / 1000) * sampleRate));
  const buffer = ctx.createBuffer(1, length, sampleRate);
  const data = buffer.getChannelData(0);
  let seed = 0x6d2b79f5;
  for (let i = 0; i < length; i++) {
    seed = (seed + 0x6d2b79f5) | 0;
    let t = seed;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    t = (t ^ (t >>> 14)) >>> 0;
    data[i] = ((t / 0xffffffff) * 2) - 1;
  }
  return buffer;
}

export function hatEnvelope(
  ctx: AudioContext,
  destination: AudioNode,
  noiseBuffer: AudioBuffer,
  filterHz: number,
  durationMs: number,
  peak: number,
  startTime: number,
): void {
  const src = ctx.createBufferSource();
  src.buffer = noiseBuffer;
  const filter = ctx.createBiquadFilter();
  filter.type = 'highpass';
  filter.frequency.setValueAtTime(filterHz, startTime);
  const gain = ctx.createGain();
  const dur = durationMs / 1000;
  gain.gain.setValueAtTime(0, startTime);
  gain.gain.linearRampToValueAtTime(peak, startTime + 0.002);
  gain.gain.exponentialRampToValueAtTime(0.0001, startTime + dur);
  src.connect(filter);
  filter.connect(gain);
  gain.connect(destination);
  src.start(startTime);
  src.stop(startTime + dur + 0.02);
}
