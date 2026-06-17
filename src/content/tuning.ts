// src/content/tuning.ts

export const palette = {
  background: 0x0a0612,
  violet: 0x6b3fff,
  cyan: 0x3fd6ff,
  warmAccent: 0xffb066,
  hostile: 0xff4f9f,
} as const;

export const drift = {
  accel: 18,
  dragPerSecond: 1.6,
  maxSpeed: 6,
  inputEase: 0.18,
  jitterWhileDisrupted: 0.4,
} as const;

export const camera = {
  followLerp: 0.08,
  lookAheadLerp: 0.05,
  distance: 7,
  height: 2.5,
  lookAheadDistance: 1.2,
} as const;

export const field = {
  radius: 28,
  collectibleCount: 8,
  anomalyCount: 2,
  collectRadius: 1.6,
  anomalyRadius: 2.4,
  seed: 1337,
} as const;

export const vfx = {
  rippleDurationMs: 700,
  rippleStartScale: 0.2,
  rippleEndScale: 3.5,
  flickerAmount: 0.08,
} as const;

export const anomaly = {
  disruptDecayPerSecond: 0.7,
  disruptFillPerSecond: 1.2,
  maxDissonance: 1.0,
  pulseSpeed: 1.3,
  minDistanceFromCenter: 6,
  minDistanceFromFragment: 4,
} as const;

export const audio = {
  bpm: 84,
  masterGain: 0.55,
  dissonanceMaxGainLoss: 0.35,
} as const;
