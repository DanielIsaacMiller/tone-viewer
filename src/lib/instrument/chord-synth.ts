import * as Tone from 'tone'

import { PIECE } from '../piece.config'
import { resumeAudio } from '../engine/audio-gesture'
import type { MasterClock } from '../engine/master-clock'
import { onceAsync } from '../engine/once'
import { buildScaleNotes } from './scale'
import { createSequencer } from '../engine/sequencer'
import { createWobblyDelayChannel } from '../engine/wobbly-delay-channel'

const CHORD = PIECE.chord

const CHORD_NOTES = buildScaleNotes(CHORD.noteRange[0], CHORD.noteRange[1])

export type ChordVoice = {
  ready: Promise<void>
  start(): Promise<void>
  dispose(): void
}

export function createChordVoice(
  destination: Tone.ToneAudioNode,
  clock: MasterClock,
): ChordVoice {
  const chorus = new Tone.Chorus({
    frequency: CHORD.chorusFrequency,
    delayTime: CHORD.chorusDelayTime,
    depth: CHORD.chorusDepth,
    spread: CHORD.chorusSpread,
    wet: CHORD.chorusWet,
  })
  const filter = new Tone.Filter(CHORD.filterFrequency, 'lowpass')
  const reverb = new Tone.Reverb(CHORD.reverbDecay)
  reverb.wet.value = CHORD.reverbWet
  const volume = new Tone.Volume(CHORD.volume)

  const synth = new Tone.PolySynth(Tone.Synth, {
    oscillator: { type: 'triangle' },
    envelope: CHORD.envelope,
  })
  synth.chain(chorus, filter, reverb, volume, destination)

  const delaySend = new Tone.Gain(CHORD.delaySend)
  filter.connect(delaySend)

  const delayLeft = createWobblyDelayChannel({
    source: delaySend,
    delayTime: CHORD.delayTimeL,
    wobbleDepth: CHORD.delayTimeWobbleL,
    wobbleRate: CHORD.delayWobbleRateL,
    erosionFrequency: CHORD.delayErosionFrequencyL,
    feedback: CHORD.delayFeedback,
    pan: -CHORD.delayPan,
    destination: volume,
    reverbSend: reverb,
  })
  const delayRight = createWobblyDelayChannel({
    source: delaySend,
    delayTime: CHORD.delayTimeR,
    wobbleDepth: CHORD.delayTimeWobbleR,
    wobbleRate: CHORD.delayWobbleRateR,
    erosionFrequency: CHORD.delayErosionFrequencyR,
    feedback: CHORD.delayFeedback,
    pan: CHORD.delayPan,
    destination: volume,
    reverbSend: reverb,
  })

  // Melancholic voicings: minor-7th pads (root, b3, 5, b7) rooted low in
  // the register — the pentatonic degrees spell out a sighing minor chord.
  const chordFor = (): number[] => {
    const maxRootIndex = Math.max(1, CHORD_NOTES.length - 7)
    const rootIndex = Math.floor(Math.random() * maxRootIndex)
    return [
      CHORD_NOTES[rootIndex],
      CHORD_NOTES[rootIndex + 2],
      CHORD_NOTES[rootIndex + 4],
      CHORD_NOTES[rootIndex + 6],
    ]
  }

  const sequencer = createSequencer({
    clock,
    nextInterval: () => {
      const bars = CHORD.minBars + Math.floor(Math.random() * (CHORD.maxBars - CHORD.minBars + 1))
      return `${bars}m`
    },
    onTrigger: (time) => {
      // Plucked low to high in eighth notes — each note sustains its full
      // length, so the chord assembles itself into a drifting pad.
      const eighth = Tone.Time('8n').toSeconds()
      const chord = chordFor().map((note) => Tone.Frequency(note, 'midi').toFrequency())
      for (let step = 0; step < chord.length; step += 1) {
        synth.triggerAttackRelease(chord[step], CHORD.duration, time + step * eighth)
      }
    },
  })

  const start = onceAsync(async () => {
    await Promise.all([resumeAudio(), reverb.ready])
    chorus.start()
    delayLeft.start()
    delayRight.start()
    sequencer.start()
  })

  return {
    ready: reverb.ready,
    start,
    dispose() {
      sequencer.dispose()
      synth.dispose()
      chorus.dispose()
      filter.dispose()
      reverb.dispose()
      volume.dispose()
      delaySend.dispose()
      delayLeft.dispose()
      delayRight.dispose()
    },
  }
}
