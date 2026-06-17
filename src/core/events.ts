// src/core/events.ts
import type { MusicLayerId, Vec3 } from '../types/index.ts';

export type GameEvent =
  | { type: 'COLLECTED'; id: string; position: Vec3 }
  | { type: 'ANOMALY_ENTER'; id: string; position: Vec3 }
  | { type: 'ANOMALY_EXIT'; id: string }
  | { type: 'MUSIC_LAYER_UNLOCKED'; layer: MusicLayerId }
  | { type: 'MUSIC_STATE_CHANGED'; state: string }
  | { type: 'DISSONANCE_CHANGED'; amount: number }
  | { type: 'RESET' };

export type GameEventType = GameEvent['type'];
export type GameEventOf<T extends GameEventType> = Extract<GameEvent, { type: T }>;

type Listener<T extends GameEventType> = (event: GameEventOf<T>) => void;

export interface EventBus {
  emit(event: GameEvent): void;
  on<T extends GameEventType>(type: T, listener: Listener<T>): () => void;
}

export function createEventBus(): EventBus {
  const listeners = new Map<GameEventType, Set<Listener<GameEventType>>>();

  function emit(event: GameEvent): void {
    const set = listeners.get(event.type);
    if (!set) return;
    for (const listener of set) {
      (listener as unknown as (e: GameEvent) => void)(event);
    }
  }

  function on<T extends GameEventType>(type: T, listener: Listener<T>): () => void {
    let set = listeners.get(type);
    if (!set) {
      set = new Set();
      listeners.set(type, set);
    }
    (set as unknown as Set<Listener<T>>).add(listener);
    return () => {
      (set as unknown as Set<Listener<T>>).delete(listener);
    };
  }

  return { emit, on };
}
