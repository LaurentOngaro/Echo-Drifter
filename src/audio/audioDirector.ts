// src/audio/audioDirector.ts
import type { MusicLayerId } from '../types/index.ts';
import { createMusicStateMachine } from './musicStateMachine.ts';

export interface AudioDirector {
  init(): void;
  startBaseLayers(): void;
  unlock(layer: MusicLayerId): void;
  setDissonance(amount: number): void;
  stop(): void;
  resume(): Promise<void>;
  isReady(): boolean;
  getActiveLayerIds(): MusicLayerId[];
  playCollectTone(freq: number): void;
}

export function createAudioDirector(): AudioDirector {
  const sm = createMusicStateMachine();
  return {
    init: () => sm.init(),
    startBaseLayers: () => sm.start(),
    unlock: (id: MusicLayerId) => sm.unlock(id),
    setDissonance: (amount: number) => sm.setDissonance(amount),
    stop: () => sm.stop(),
    resume: () => sm.resume(),
    isReady: () => sm.isReady(),
    getActiveLayerIds: () => sm.getActiveLayerIds(),
    playCollectTone: (freq: number) => sm.playCollectTone(freq),
  };
}
