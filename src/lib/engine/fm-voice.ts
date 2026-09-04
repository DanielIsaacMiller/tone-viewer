import * as Tone from 'tone'

import type { TrackEffect } from './track-effect'

export type ADSR = {
  attack: number
  decay: number
  sustain: number
  release: number
}

export type FMVoiceConfig = {
  harmonicity: number
  modulationIndex: number
  envelope: ADSR
  modulationEnvelope: ADSR
  filterFrequency: number
  volume: number
  trackEffects?: (TrackEffect | undefined)[]
}

export type FMVoice = {
  synth: Tone.FMSynth
  filter: Tone.Filter
  dispose(): void
}

export function createFMVoice(destination: Tone.ToneAudioNode, config: FMVoiceConfig): FMVoice {
  const filter = new Tone.Filter(config.filterFrequency, 'lowpass')
  const volume = new Tone.Volume(config.volume)

  const synth = new Tone.FMSynth({
    harmonicity: config.harmonicity,
    modulationIndex: config.modulationIndex,
    oscillator: { type: 'sine' },
    modulation: { type: 'sine' },
    envelope: config.envelope,
    modulationEnvelope: config.modulationEnvelope,
  })
  synth.connect(filter)

  const effects = (config.trackEffects ?? []).filter((effect): effect is TrackEffect =>
    Boolean(effect),
  )

  let node: Tone.ToneAudioNode = filter
  for (const effect of effects) {
    node.connect(effect.input)
    node = effect.output
  }
  node.connect(volume)
  volume.connect(destination)

  return {
    synth,
    filter,
    dispose() {
      synth.dispose()
      filter.dispose()
      volume.dispose()
      for (const effect of effects) effect.dispose()
    },
  }
}
