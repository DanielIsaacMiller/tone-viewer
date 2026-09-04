import * as Tone from 'tone'

export type TrackEffect = {
  input: Tone.ToneAudioNode
  output: Tone.ToneAudioNode
  ready?: Promise<void>
  start?(): void
  dispose(): void
}
