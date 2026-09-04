// Scales and registers: the music-theory helpers the voices share.
// Frozen structure — per-piece registers live in `piece.config.ts`.

export const SCALE_INTERVALS = [0, 3, 5, 7, 10]

export function buildScaleNotes(
  low: number,
  high: number,
  intervals: readonly number[] = SCALE_INTERVALS,
): number[] {
  const notes: number[] = []
  const firstBase = Math.floor(low / 12) * 12 - 12
  for (let base = firstBase; base <= high; base += 12) {
    for (const interval of intervals) {
      const note = base + interval
      if (note >= low && note <= high) notes.push(note)
    }
  }
  return notes
}

export function nearestNote(target: number, notes: readonly number[]): number {
  let nearest = notes[0]
  let nearestDist = Infinity
  for (const note of notes) {
    const dist = Math.abs(note - target)
    if (dist < nearestDist) {
      nearestDist = dist
      nearest = note
    }
  }
  return nearest
}
