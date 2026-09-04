import * as Tone from 'tone'

export type WobblyDelayChannelConfig = {
  source: Tone.ToneAudioNode
  delayTime: number
  wobbleDepth: number
  wobbleRate: number
  rateDrift?: { depth: number; rate: number }
  randomizePhase?: boolean
  erosionFrequency: number
  feedback: number
  pan: number
  destination: Tone.ToneAudioNode
  reverbSend?: Tone.ToneAudioNode
}

export type WobblyDelayChannel = {
  start(): void
  dispose(): void
}

export function createWobblyDelayChannel(config: WobblyDelayChannelConfig): WobblyDelayChannel {
  const delay = new Tone.Delay(config.delayTime, 2)
  const erosionFilter = new Tone.Filter(config.erosionFrequency, 'lowpass')
  const feedbackGain = new Tone.Gain(config.feedback)
  const wobble = new Tone.LFO(config.wobbleRate, config.delayTime - config.wobbleDepth, config.delayTime + config.wobbleDepth)
  const panner = new Tone.Panner(config.pan)

  let wobbleRateDrift: Tone.LFO | null = null
  if (config.rateDrift) {
    wobbleRateDrift = new Tone.LFO(config.rateDrift.rate, -config.rateDrift.depth, config.rateDrift.depth)
    wobbleRateDrift.connect(wobble.frequency)
  }

  if (config.randomizePhase) {
    wobble.phase = Math.random() * 360
    if (wobbleRateDrift) wobbleRateDrift.phase = Math.random() * 360
  }

  config.source.connect(delay)
  delay.connect(erosionFilter)
  erosionFilter.connect(feedbackGain)
  feedbackGain.connect(delay)
  erosionFilter.connect(panner)
  panner.connect(config.destination)
  if (config.reverbSend) erosionFilter.connect(config.reverbSend)
  wobble.connect(delay.delayTime)

  return {
    start() {
      wobble.start()
      wobbleRateDrift?.start()
    },
    dispose() {
      delay.dispose()
      erosionFilter.dispose()
      feedbackGain.dispose()
      wobble.dispose()
      wobbleRateDrift?.dispose()
      panner.dispose()
    },
  }
}
