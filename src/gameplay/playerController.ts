// src/gameplay/playerController.ts
import type { InputState, Vec3 } from '../types/index.ts';
import { drift } from '../content/tuning.ts';

export interface ControllerResult {
  position: Vec3;
  velocity: Vec3;
}

export function updateDrift(
  current: ControllerResult,
  input: InputState,
  dt: number,
  disruption: number,
): ControllerResult {
  const eased = easeInput(input);
  const targetAccel = {
    x: eased.right * drift.accel,
    y: 0,
    z: -eased.forward * drift.accel,
  };

  const dragFactor = Math.exp(-drift.dragPerSecond * dt);

  const vx = (current.velocity.x + targetAccel.x * dt) * dragFactor;
  const vy = current.velocity.y;
  const vz = (current.velocity.z + targetAccel.z * dt) * dragFactor;

  let velocity = { x: vx, y: vy, z: vz };

  if (disruption > 0) {
    const jitter = drift.jitterWhileDisrupted * disruption;
    velocity = {
      x: velocity.x + (Math.random() * 2 - 1) * jitter * dt * 8,
      y: velocity.y,
      z: velocity.z + (Math.random() * 2 - 1) * jitter * dt * 8,
    };
  }

  const speed = Math.sqrt(velocity.x * velocity.x + velocity.z * velocity.z);
  if (speed > drift.maxSpeed) {
    const k = drift.maxSpeed / speed;
    velocity = { x: velocity.x * k, y: velocity.y, z: velocity.z * k };
  }

  const position = {
    x: current.position.x + velocity.x * dt,
    y: current.position.y,
    z: current.position.z + velocity.z * dt,
  };

  return { position, velocity };
}

function easeInput(input: InputState): InputState {
  const len = Math.sqrt(input.right * input.right + input.forward * input.forward);
  if (len <= 1) return input;
  return { right: input.right / len, forward: input.forward / len };
}
