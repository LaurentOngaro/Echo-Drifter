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

  collectTone: {
    fifthHzRatio: 1.5,
    echoDelayMs: 120,
    echoFeedback: 0.15,
    secondOscGain: 0.08,
    secondOscDurationMs: 180,
  },

  layerUnlock: {
    rootHz: 110,
    thirdHz: 131,
    fifthHz: 165,
    noteDurationMs: 120,
    noteSpacingMs: 80,
    noteGain: 0.15,
    filterHz: 1200,
    attackSec: 0.005,
    releaseSec: 0.2,
  },

  anomalyProximity: {
    lfoHz: 4,
    sineHz: 80,
    maxGain: 0.12,
    fadeInSec: 0.5,
    fadeOutSec: 0.8,
    lfoDepth: 0.5,
  },

  fadeInMinSec: 0.8,
  fadeOutMinSec: 1.2,
} as const;

export const visual = {
  background: 0x0a0612,

  camera: {
    fov: 55,
    near: 0.1,
    far: 100,
    fixedHeight: 8,
    damping: 0.88,
    maxLookAhead: 0.8,
    orthographic: true,
    viewSize: 10,
    viewSizeMin: 5,
    viewSizeMax: 20,
    viewSizeStep: 1,
  },

  lights: {
    ambient: { color: 0x1a0a2e, intensity: 0.8 },
    point: { color: 0x6644aa, intensity: 1.2, position: [2, 3, 5], distance: 30 },
    accent: { color: 0x3fd6ff, intensity: 0.6, distance: 8 },
  },

  palette: {
    player: 0x3fd6ff,
    playerGlow: 0x8aeeff,
    collectible: 0xff80bf,
    collectibleGlow: 0xffb3d9,
    anomaly: 0xc44040,
    hudText: 0xe8e0f0,
  },

  orb: {
    pulseHz: 0.8,
    pulseAmplitude: 0.04,
    playerRotationZMax: 0.15,
    collectibleRotationY: 0.2,
  },

  ripple: {
    maxConcurrent: 5,
    durationMs: 600,
    startScale: 0.0,
    endScale: 2.5,
    tubeRadius: 0.05,
  },

  trail: {
    poolSize: 8,
    sphereRadius: 0.12,
    updateIntervalSec: 0.05,
    velocityThreshold: 0.05,
    headOpacity: 0.5,
  },

  collect: {
    radius: 1.6,
  },

  ground: {
    radius: 60,
    opacity: 0.12,
    color: 0x0a0612,
  },

  shake: {
    collectIntensity: 0.06,
    collectDurationMs: 200,
    collectNoiseFreq: 50,
    anomalyIntensity: 0.04,
    anomalyFreq: 3,
    anomalyFadeOutSec: 0.8,
  },

  flash: {
    durationMs: 250,
    peakMs: 80,
    startIntensity: 0.5,
    peakIntensity: 1.8,
    endIntensity: 0.5,
    sphereRadius: 0.3,
  },

  burst: {
    poolSize: 12,
    activePerBurst: 6,
    sphereRadius: 0.06,
    initialSpeed: 2.5,
    frictionPerFrame: 0.85,
    durationMs: 400,
  },
} as const;
