// src/core/gameLoop.ts

export type UpdateCallback = (deltaSeconds: number) => void;

export interface GameLoop {
  start: () => void;
  stop: () => void;
  onUpdate: (cb: UpdateCallback) => void;
}

export function createGameLoop(): GameLoop {
  let lastTime = 0;
  let running = false;
  let updateCallback: UpdateCallback | null = null;

  function frame(timestamp: number) {
    if (!running) return;

    if (!lastTime) {
      lastTime = timestamp;
    }

    const deltaMs = timestamp - lastTime;
    const deltaSeconds = deltaMs / 1000;
    lastTime = timestamp;

    if (updateCallback) {
      updateCallback(deltaSeconds);
    }

    requestAnimationFrame(frame);
  }

  return {
    start() {
      if (running) return;
      running = true;
      lastTime = 0;
      requestAnimationFrame(frame);
    },
    stop() {
      running = false;
    },
    onUpdate(cb: UpdateCallback) {
      updateCallback = cb;
    },
  };
}
