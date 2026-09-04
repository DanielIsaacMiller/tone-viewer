import * as Tone from 'tone'

import { PIECE } from '../piece.config'
import { resumeAudio } from '../engine/audio-gesture'
import { createFMVoice } from '../engine/fm-voice'
import type { MasterClock } from '../engine/master-clock'
import { onceAsync } from '../engine/once'
import { buildScaleNotes } from './scale'
import { createSequencer } from '../engine/sequencer'
import type { TrackEffect } from '../engine/track-effect'

const SEQUENCE = PIECE.sequence

export type SequenceVoice = {
  ready: Promise<void>
  start(): Promise<void>
  dispose(): void
}

function createDarkReverbEffect(): TrackEffect {
  const input = new Tone.Gain(1)
  const output = new Tone.Gain(1)

  const reverb = new Tone.Reverb(SEQUENCE.reverbDecay)
  const darkFilter = new Tone.Filter(0, 'lowpass')
  const mix = new Tone.CrossFade(0)

  input.connect(mix.a)
  input.connect(reverb)
  reverb.connect(darkFilter)
  darkFilter.connect(mix.b)
  mix.connect(output)

  const wetLfo = new Tone.LFO(
    SEQUENCE.reverbLfoFrequency,
    SEQUENCE.wetMix - SEQUENCE.reverbLfoWetDepth,
    SEQUENCE.wetMix + SEQUENCE.reverbLfoWetDepth,
  )
  wetLfo.connect(mix.fade)

  const filterLfo = new Tone.LFO(
    SEQUENCE.reverbLfoFrequency,
    SEQUENCE.reverbFilterFrequency - SEQUENCE.reverbLfoFilterDepth,
    SEQUENCE.reverbFilterFrequency + SEQUENCE.reverbLfoFilterDepth,
  )
  filterLfo.connect(darkFilter.frequency)

  return {
    input,
    output,
    ready: reverb.ready,
    start() {
      wetLfo.start()
      filterLfo.start()
    },
    dispose() {
      input.dispose()
      output.dispose()
      reverb.dispose()
      darkFilter.dispose()
      mix.dispose()
      wetLfo.dispose()
      filterLfo.dispose()
    },
  }
}

export function createSequenceVoice(
  destination: Tone.ToneAudioNode,
  clock: MasterClock,
): SequenceVoice {
  const darkReverb = createDarkReverbEffect()
  // The echo: each motif's plucks trail off into a few seconds of repeats.
  const echo = new Tone.FeedbackDelay({
    delayTime: SEQUENCE.echoTime,
    feedback: SEQUENCE.echoFeedback,
    wet: SEQUENCE.echoWet,
  })

  const voice = createFMVoice(destination, {
    harmonicity: SEQUENCE.harmonicity,
    modulationIndex: SEQUENCE.modulationIndex,
    envelope: SEQUENCE.envelope,
    modulationEnvelope: SEQUENCE.modulationEnvelope,
    filterFrequency: SEQUENCE.filterFrequency,
    volume: SEQUENCE.volume,
    trackEffects: [darkReverb, { input: echo, output: echo, dispose: () => echo.dispose() }],
  })

  let currentAttack = SEQUENCE.envelope.attack
  const nextAttack = (): number => {
    const step = (Math.random() * 2 - 1) * SEQUENCE.attackWalkStep
    const min = Math.max(0, SEQUENCE.envelope.attack - SEQUENCE.attackWalkRange)
    const max = SEQUENCE.envelope.attack + SEQUENCE.attackWalkRange
    currentAttack = Math.min(max, Math.max(min, currentAttack + step))
    return currentAttack
  }

  const SEQUENCE_NOTES = buildScaleNotes(
    SEQUENCE.register.low,
    SEQUENCE.register.high,
  )
  let lastStruckNote = -1

  // A short descending sigh in eighth notes — the classic melancholic motif —
  // every few bars, with the echo trailing it out. The three steps always
  // land on distinct scale notes, and the motif never repeats the note that
  // ended the previous one.

  const sequencer = createSequencer({
    clock,
    nextInterval: () => {
      const bars = SEQUENCE.barsMin + Math.floor(Math.random() * (SEQUENCE.barsMax - SEQUENCE.barsMin + 1))
      return `${bars}m`
    },
    onTrigger: (time) => {
      const eighth = Tone.Time('8n').toSeconds()
      const lowestStart = SEQUENCE.motifLength - 1
      let startIndex =
        lowestStart +
        Math.floor(Math.random() * (SEQUENCE_NOTES.length - lowestStart))
      if (SEQUENCE_NOTES[startIndex] === lastStruckNote) {
        startIndex = Math.max(lowestStart, startIndex - 1)
      }

      for (let step = 0; step < SEQUENCE.motifLength; step += 1) {
        const note = SEQUENCE_NOTES[startIndex - step]
        const frequency = Tone.Frequency(note, 'midi').toFrequency()
        voice.synth.envelope.attack = nextAttack()
        voice.synth.triggerAttackRelease(frequency, SEQUENCE.noteDuration, time + step * eighth)
        lastStruckNote = note
      }
    },
  })

  const start = onceAsync(async () => {
    await Promise.all([resumeAudio(), darkReverb.ready])
    darkReverb.start?.()
    sequencer.start()
  })

  return {
    ready: darkReverb.ready ?? Promise.resolve(),
    start,
    dispose() {
      sequencer.dispose()
      voice.dispose()
    },
  }
}
