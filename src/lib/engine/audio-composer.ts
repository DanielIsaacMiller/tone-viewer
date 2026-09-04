import * as Tone from 'tone'

import { resumeAudio } from './audio-gesture'
import { createMasterClock } from './master-clock'
import { MIXER, createMixer } from './mixer'
import { onceAsync } from './once'
import { PIECE } from '../piece.config'
import { createChordVoice } from '../instrument/chord-synth'
import { createSequenceVoice } from '../instrument/sequence-synth'
import { createTouchSynth, type TouchSynth } from '../instrument/touch-synth'

const ORIGINAL_WARN = console.warn.bind(console)
Tone.debug.setLogger({
  log: (...args: unknown[]) => console.log(...args),
  warn: (...args: unknown[]) => {
    const [message] = args
    if (typeof message === 'string' && message.includes('Invoke Tone.start() from a user action')) {
      return
    }
    ORIGINAL_WARN(...args)
  },
} as Parameters<typeof Tone.debug.setLogger>[0])

export type AudioComposer = {
  ready: Promise<void>
  start(): void
  touch: TouchSynth
  dispose(): void
}

// The fixed topology: three voices on their own channels, each dialing
// into the shared reverb + delay aux space, all summed into the master
// bus. Swap a voice by editing `instrument/` — never this wiring.
export function createAudioComposer(): AudioComposer {
  const mixer = createMixer()
  const masterClock = createMasterClock(PIECE.audio.bpm)

  const touchChannel = mixer.channel()
  const sequenceChannel = mixer.channel()
  const chordChannel = mixer.channel()

  const touch = createTouchSynth(touchChannel)
  const sequence = createSequenceVoice(sequenceChannel, masterClock)
  const chord = createChordVoice(chordChannel, masterClock)

  mixer.sendTo(touchChannel, mixer.aux.reverb, MIXER.sends.touch.reverb)
  mixer.sendTo(touchChannel, mixer.aux.delay, MIXER.sends.touch.delay)
  mixer.sendTo(sequenceChannel, mixer.aux.reverb, MIXER.sends.sequence.reverb)
  mixer.sendTo(sequenceChannel, mixer.aux.delay, MIXER.sends.sequence.delay)
  mixer.sendTo(chordChannel, mixer.aux.reverb, MIXER.sends.chord.reverb)
  mixer.sendTo(chordChannel, mixer.aux.delay, MIXER.sends.chord.delay)

  const start = onceAsync(async () => {
    await resumeAudio()
    masterClock.start()
    mixer.start()
  })

  return {
    ready: Promise.all([touch.ready, sequence.ready, chord.ready]).then(() => undefined),
    start() {
      start()
      touch.start().catch(() => {})
      sequence.start().catch(() => {})
      chord.start().catch(() => {})
    },
    touch,
    dispose() {
      touch.dispose()
      sequence.dispose()
      chord.dispose()
      mixer.dispose()
      masterClock.dispose()
    },
  }
}
