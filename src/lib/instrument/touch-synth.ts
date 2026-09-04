import * as Tone from 'tone'

import { PIECE } from '../piece.config'
import { isAudioRunning, resumeAudio } from '../engine/audio-gesture'
import { createFMVoice } from '../engine/fm-voice'
import { onceAsync } from '../engine/once'
import { buildScaleNotes, nearestNote } from './scale'
import type { TrackEffect } from '../engine/track-effect'
import { createWobblyDelayChannel } from '../engine/wobbly-delay-channel'

const TOUCH = PIECE.touch
const TOUCH_SCALE_NOTES = buildScaleNotes(TOUCH.noteRange[0], TOUCH.noteRange[1])

export type TouchUpdate = {
  y: number
  x: number
}

export type TouchSynth = {
  ready: Promise<void>
  start(): Promise<void>
  attack(update: TouchUpdate): boolean
  release(): void
  update(update: TouchUpdate): boolean
  setHeightSpan(span: number): void
  dispose(): void
}

function createChimeDelayEffect(): TrackEffect {
  const input = new Tone.Gain(1)
  const output = new Tone.Gain(1)

  const reverb = new Tone.Reverb(TOUCH.reverbDecay)
  reverb.wet.value = TOUCH.reverbWet
  const reverbFilter = new Tone.Filter(TOUCH.reverbFilterFrequency, 'lowpass')
  input.connect(reverb)
  reverb.connect(reverbFilter)
  reverbFilter.connect(output)

  const delaySend = new Tone.Gain(TOUCH.delaySend)
  input.connect(delaySend)

  const delayLeft = createWobblyDelayChannel({
    source: delaySend,
    delayTime: TOUCH.delayTimeL,
    wobbleDepth: TOUCH.delayTimeWobbleL,
    wobbleRate: TOUCH.delayWobbleRateL,
    rateDrift: { depth: TOUCH.delayWobbleRateDriftL, rate: TOUCH.delayWobbleDriftRateL },
    randomizePhase: true,
    erosionFrequency: TOUCH.delayErosionFrequencyL,
    feedback: TOUCH.delayFeedback,
    pan: -TOUCH.delayPan,
    destination: output,
    reverbSend: reverb,
  })
  const delayRight = createWobblyDelayChannel({
    source: delaySend,
    delayTime: TOUCH.delayTimeR,
    wobbleDepth: TOUCH.delayTimeWobbleR,
    wobbleRate: TOUCH.delayWobbleRateR,
    rateDrift: { depth: TOUCH.delayWobbleRateDriftR, rate: TOUCH.delayWobbleDriftRateR },
    randomizePhase: true,
    erosionFrequency: TOUCH.delayErosionFrequencyR,
    feedback: TOUCH.delayFeedback,
    pan: TOUCH.delayPan,
    destination: output,
    reverbSend: reverb,
  })

  return {
    input,
    output,
    ready: reverb.ready,
    start() {
      delayLeft.start()
      delayRight.start()
    },
    dispose() {
      input.dispose()
      output.dispose()
      reverb.dispose()
      reverbFilter.dispose()
      delaySend.dispose()
      delayLeft.dispose()
      delayRight.dispose()
    },
  }
}

function createRoomReverbEffect(): TrackEffect & { wet: Tone.Signal<'normalRange'> } {
  const input = new Tone.Gain(1)
  const output = new Tone.Gain(1)

  const reverb = new Tone.Reverb({
    decay: TOUCH.roomReverbDecay,
    preDelay: TOUCH.roomReverbPreDelay,
  })
  const darkFilter = new Tone.Filter(TOUCH.roomReverbFilterFrequency, 'lowpass')
  const crossfade = new Tone.CrossFade(1)

  input.connect(crossfade.a)
  input.connect(reverb)
  reverb.connect(darkFilter)
  darkFilter.connect(crossfade.b)
  crossfade.connect(output)

  return {
    input,
    output,
    wet: crossfade.fade,
    ready: reverb.ready,
    dispose() {
      input.dispose()
      output.dispose()
      reverb.dispose()
      darkFilter.dispose()
      crossfade.dispose()
    },
  }
}

export function createTouchSynth(destination: Tone.ToneAudioNode): TouchSynth {
  const chimeDelay = createChimeDelayEffect()
  const roomReverb = createRoomReverbEffect()

  const phaser = new Tone.Phaser({
    frequency: TOUCH.phaserFrequency,
    octaves: TOUCH.phaserOctaves,
    baseFrequency: TOUCH.phaserBaseFrequency,
    stages: TOUCH.phaserStages,
    Q: TOUCH.phaserQ,
  })
  phaser.wet.value = 1
  const distortion = new Tone.Distortion(TOUCH.distortion)

  const voice = createFMVoice(destination, {
    harmonicity: TOUCH.harmonicityOptions[0],
    modulationIndex: TOUCH.modulationIndex,
    envelope: TOUCH.envelope,
    modulationEnvelope: TOUCH.modulationEnvelope,
    filterFrequency: TOUCH.filterFrequency,
    volume: TOUCH.volume,
    trackEffects: [
      { input: phaser, output: phaser, dispose: () => phaser.dispose() },
      { input: distortion, output: distortion, dispose: () => distortion.dispose() },
      roomReverb,
      chimeDelay,
    ],
  })
  const synth = voice.synth

  // Slow pitch instability — the detune wavers on its own, like the tone
  // can't decide where it sits.
  const detuneWobble = new Tone.LFO(
    TOUCH.detuneWobbleRate,
    -TOUCH.detuneWobbleDepth,
    TOUCH.detuneWobbleDepth,
  )
  detuneWobble.connect(synth.detune)

  let currentNote: number | null = null
  let heightSpan = TOUCH.heightSpan

  const noteFor = (y: number): number => {
    const t = clamp01((y + heightSpan) / (heightSpan * 2))
    const [lowNote, highNote] = TOUCH.noteRange
    const continuous = lowNote + t * (highNote - lowNote)
    return nearestNote(continuous, TOUCH_SCALE_NOTES)
  }

  const modulationIndexFor = (x: number) => {
    const t = clamp01((x + TOUCH.widthSpan) / (TOUCH.widthSpan * 2))
    return TOUCH.modulationIndex + (t - 0.5) * TOUCH.modulationIndexRange
  }

  const detuneFor = (x: number) => {
    const t = clamp01((x + TOUCH.widthSpan) / (TOUCH.widthSpan * 2))
    return TOUCH.detune + (t - 0.5) * TOUCH.detuneRange
  }

  const volumeBoostFor = (x: number) => {
    const t = clamp01((x + TOUCH.widthSpan) / (TOUCH.widthSpan * 2))
    const boostT = clamp01((t - TOUCH.wetVolumeBoostStart) / (1 - TOUCH.wetVolumeBoostStart))
    return boostT * TOUCH.wetVolumeBoost
  }

  const randomHarmonicity = () => {
    const options = TOUCH.harmonicityOptions
    return options[Math.floor(Math.random() * options.length)]
  }

  let lastEventTime = 0
  const nextEventTime = () => {
    const time = Math.max(Tone.now(), lastEventTime + 0.001)
    lastEventTime = time
    return time
  }

  const strike = (note: number, x: number, time: number) => {
    currentNote = note
    synth.harmonicity.value = randomHarmonicity()
    synth.modulationIndex.value = modulationIndexFor(x) * 0.3
    synth.detune.value = detuneFor(x)
    synth.volume.value = volumeBoostFor(x)
    synth.frequency.cancelScheduledValues(time)
    voice.filter.frequency.cancelScheduledValues(time)
    voice.filter.frequency.value = TOUCH.filterFrequency

    synth.triggerAttackRelease(
      Tone.Frequency(note, 'midi').toFrequency(),
      TOUCH.noteDuration,
      time,
    )
    synth.modulationIndex.rampTo(
      modulationIndexFor(x) * 2.2,
      TOUCH.noteDuration * 0.8,
      time,
    )
    voice.filter.frequency.rampTo(
      TOUCH.filterOpenFrequency,
      TOUCH.noteDuration * 0.85,
      time,
    )
  }

  const ready = Promise.all([chimeDelay.ready, roomReverb.ready]).then(() => undefined)

  const start = onceAsync(async () => {
    await Promise.all([resumeAudio(), ready])
    chimeDelay.start?.()
    detuneWobble.start()
  })

  return {
    ready,
    start,
    attack({ y, x }) {
      if (!isAudioRunning()) return false
      strike(noteFor(y), x, nextEventTime())
      return true
    },
    release() {
      if (!isAudioRunning()) return
      synth.triggerRelease(nextEventTime())
      currentNote = null
    },
    update({ y, x }) {
      if (!isAudioRunning()) return false
      const time = nextEventTime()
      const note = noteFor(y)
      if (note !== currentNote) {
        strike(note, x, time)
        return true
      }
      synth.modulationIndex.rampTo(modulationIndexFor(x), TOUCH.glide, time)
      synth.detune.rampTo(detuneFor(x), TOUCH.glide, time)
      synth.volume.rampTo(volumeBoostFor(x), TOUCH.glide, time)
      return false
    },
    setHeightSpan(span) {
      heightSpan = span
    },
    dispose() {
      voice.dispose()
    },
  }
}

function clamp01(v: number): number {
  return v < 0 ? 0 : v > 1 ? 1 : v
}
