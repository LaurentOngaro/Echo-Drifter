// src/types/index.ts

export interface Vec3 {
  x: number;
  y: number;
  z: number;
}

export function vec3(x: number, y: number, z: number): Vec3 {
  return { x, y, z };
}

export function addVec(a: Vec3, b: Vec3): Vec3 {
  return { x: a.x + b.x, y: a.y + b.y, z: a.z + b.z };
}

export function scaleVec(a: Vec3, s: number): Vec3 {
  return { x: a.x * s, y: a.y * s, z: a.z * s };
}

export function lengthVec(a: Vec3): number {
  return Math.sqrt(a.x * a.x + a.y * a.y + a.z * a.z);
}

export function normalizeVec(a: Vec3): Vec3 {
  const len = lengthVec(a);
  if (len < 1e-6) return { x: 0, y: 0, z: 0 };
  return { x: a.x / len, y: a.y / len, z: a.z / len };
}

export interface Updatable {
  update(dt: number): void;
}

export type MusicLayerId =
  | 'drone'
  | 'pulse'
  | 'bass'
  | 'pad'
  | 'arp'
  | 'lead';

export interface MusicLayerInfo {
  id: MusicLayerId;
  label: string;
  order: number;
}

export interface InputState {
  forward: number;
  right: number;
}

export const ZERO_VEC: Vec3 = { x: 0, y: 0, z: 0 };
