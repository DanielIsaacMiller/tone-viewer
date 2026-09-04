import * as Tone from 'tone'

export type MasterClock = {
  start(): void
  stop(): void
  scheduleOnce(callback: (time: number) => void, time: number): number
  position(): number
  clear(id: number): void
  dispose(): void
}

export function createMasterClock(bpm: number): MasterClock {
  const transport = Tone.getTransport()
  transport.bpm.value = bpm
  let started = false

  return {
    start() {
      if (started) return
      started = true
      transport.start()
    },
    stop() {
      if (!started) return
      started = false
      transport.stop()
    },
    scheduleOnce(callback, time) {
      return transport.scheduleOnce(callback, time)
    },
    position() {
      return transport.seconds
    },
    clear(id) {
      transport.clear(id)
    },
    dispose() {
      started = false
      transport.stop()
      transport.cancel()
    },
  }
}
