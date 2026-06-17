// src/content/scale.ts

const ROOT_MIDI = 57;

const SCALE_INTERVALS = [0, 3, 5, 7, 10];

export function noteHz(midi: number): number {
  return 440 * Math.pow(2, (midi - 69) / 12);
}

export function scaleNoteAt(index: number): number {
  const octave = Math.floor(index / SCALE_INTERVALS.length);
  const within = ((index % SCALE_INTERVALS.length) + SCALE_INTERVALS.length) % SCALE_INTERVALS.length;
  const midi = ROOT_MIDI + octave * 12 + SCALE_INTERVALS[within];
  return midi;
}

export function scaleHz(index: number): number {
  return noteHz(scaleNoteAt(index));
}

export const droneRoot = scaleHz(0);
export const droneFifth = scaleHz(2);

export const bassPattern = [0, 0, 2, 3].map(scaleHz);
export const arpPattern = [0, 1, 2, 3, 4, 3, 2, 1].map((i) => scaleHz(i + 7));
export const leadPattern = [4, 3, 2, 4, 3, 2, 0, 2].map((i) => scaleHz(i + 7));

export const padNotes = [0, 2, 4].map(scaleHz);
