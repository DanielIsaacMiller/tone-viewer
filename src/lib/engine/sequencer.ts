import * as Tone from 'tone'

import type { MasterClock } from './master-clock'

export type SequencerConfig = {
  clock: MasterClock
  nextInterval(): string
  onTrigger(time: number): void
}

export type Sequencer = {
  start(): void
  dispose(): void
}

export function createSequencer(config: SequencerConfig): Sequencer {
  let scheduledId: number | null = null
  let started = false
  let nextTime = 0

  const scheduleNext = () => {
    nextTime += Tone.Time(config.nextInterval()).toSeconds()
    scheduledId = config.clock.scheduleOnce((time) => {
      config.onTrigger(time)
      scheduleNext()
    }, nextTime)
  }

  return {
    start() {
      if (started) return
      started = true
      nextTime = config.clock.position()
      scheduleNext()
    },
    dispose() {
      if (scheduledId !== null) config.clock.clear(scheduledId)
    },
  }
}
