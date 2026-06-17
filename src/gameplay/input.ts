// src/gameplay/input.ts
import type { InputState } from '../types/index.ts';

export interface InputSource {
  state: InputState;
}

export function createKeyboardInput(target: EventTarget = window): InputSource {
  const state: InputState = { forward: 0, right: 0 };

  const pressed = new Set<string>();

  function recompute() {
    let forward = 0;
    let right = 0;
    if (pressed.has('KeyW') || pressed.has('ArrowUp')) forward += 1;
    if (pressed.has('KeyS') || pressed.has('ArrowDown')) forward -= 1;
    if (pressed.has('KeyD') || pressed.has('ArrowRight')) right += 1;
    if (pressed.has('KeyA') || pressed.has('ArrowLeft')) right -= 1;
    state.forward = forward;
    state.right = right;
  }

  function onKeyDown(e: KeyboardEvent) {
    if (e.code === 'KeyR' || e.code.startsWith('Arrow') || ['KeyW', 'KeyA', 'KeyS', 'KeyD'].includes(e.code)) {
      e.preventDefault();
    }
    pressed.add(e.code);
    recompute();
  }

  function onKeyUp(e: KeyboardEvent) {
    pressed.delete(e.code);
    recompute();
  }

  target.addEventListener('keydown', onKeyDown as EventListener);
  target.addEventListener('keyup', onKeyUp as EventListener);
  target.addEventListener('blur', () => {
    pressed.clear();
    recompute();
  });

  return { state };
}
