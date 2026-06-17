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
  bpm: 90,
  masterGain: 0.55,

  drone: {
    rootHz: 110,
    fifthHz: 165,
    detuneCents: 3,
    filterHz: 400,
    filterQ: 1,
    layerGain: 0.4,
    ampLfoHz: 0.2,
    ampLfoDepth: 0.05,
    startDelaySec: 0.0,
    fadeInSec: 0.8,
    fadeOutSec: 1.2,
  },

  pulse: {
    kick: {
      startHz: 80,
      endHz: 30,
      durationMs: 80,
      peakGain: 0.8,
    },
    hat: {
      filterHz: 6000,
      durationMs: 30,
      peakGain: 0.15,
    },
    layerGain: 0.45,
    startDelaySec: 2.0,
    fadeInSec: 1.0,
    fadeOutSec: 1.2,
  },

  bass: {
    noteHz: 110,
    noteDurationMs: 300,
    filterHz: 200,
    layerGain: 0.35,
    fadeInSec: 0.8,
    fadeOutSec: 1.2,
    stepPerMeasure: 1,
  },

  pad: {
    noteSequenceHz: [110, 131, 165],
    noteIntervalSec: 2.0,
    noteDurationSec: 1.8,
    attackSec: 1.5,
    decaySec: 0.3,
    sustainLevel: 0.7,
    releaseSec: 2.0,
    filterHz: 800,
    layerGain: 0.25,
    fadeInSec: 0.8,
    fadeOutSec: 1.2,
  },

  arp: {
    noteSequenceHz: [165, 196, 220, 262],
    noteIntervalSec: 2.0,
    noteDurationSec: 1.5,
    delayMs: 200,
    delayFeedback: 0.3,
    layerGain: 0.2,
    fadeInSec: 0.8,
    fadeOutSec: 1.2,
  },

  lead: {
    noteSequenceHz: [220, 262, 330, 220],
    noteDurationSec: 0.8,
    phrasePauseSec: 1.6,
    layerGain: 0.18,
    fadeInSec: 0.8,
    fadeOutSec: 1.2,
  },

  dissonance: {
    detuneCents: 20,
    masterGainFactor: 0.8,
    recoverSec: 1.5,
    applyToLayerId: 'drone',
  },

  warning: {
    enabled: true,
    sineHz: 80,
    durationMs: 30,
    peakGain: 0.05,
    intervalMs: 600,
    delayMs: 80,
    delayFeedback: 0.2,
  },

  fadeInMinSec: 0.8,
  fadeOutMinSec: 1.2,
} as const;
