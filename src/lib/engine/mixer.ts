import * as Tone from 'tone'

import { PIECE } from '../piece.config'

export const MIXER = {
  masterBus: {
    threshold: -30,
    ratio: 3.5,
    knee: 24,
    attack: 0.03,
    release: 0.3,
    makeupGain: 12,
    limiterThreshold: -1,
  },
  auxReverb: {
    wet: 0.85,
    delayTimeL: 0.029,
    delayTimeR: 0.037,
    feedback: 0.4,
    feedbackLfoDepth: 0.08,
    lfoFrequencyMin: 0.08,
    lfoFrequencyMax: 0.2,
    damping: 2600,
    pan: 0.9,
  },
  auxDelay: {
    wet: 0.85,
    timeL: 0.32,
    timeR: 0.44,
    timeLfoDepth: 0.05,
    lfoFrequencyMin: 0.06,
    lfoFrequencyMax: 0.18,
    feedback: 0.32,
    pan: 0.85,
  },
  // Per-piece send levels live in the tuning seam.
  sends: PIECE.sends,
}

export type Mixer = {
  channel(): Tone.Gain
  aux: {
    reverb: Tone.ToneAudioNode
    delay: Tone.ToneAudioNode
  }
  sendTo(source: Tone.ToneAudioNode, aux: Tone.ToneAudioNode, amount: number): void
  start(): void
  dispose(): void
}

function randomLfoFrequency(min: number, max: number): number {
  return min + Math.random() * (max - min)
}

type TrackEffectLike = {
  input: Tone.ToneAudioNode
  output: Tone.ToneAudioNode
  start(): void
  dispose(): void
}

function createAuxReverb(): TrackEffectLike {
  const input = new Tone.Gain(1)
  const output = new Tone.Gain(1)
  const wetGain = new Tone.Gain(MIXER.auxReverb.wet)

  const makeChannel = (delayTime: number, pan: number) => {
    const delay = new Tone.Delay(delayTime, 0.1)
    const damping = new Tone.Filter(MIXER.auxReverb.damping, 'lowpass')
    const feedbackGain = new Tone.Gain(0)
    const lfo = new Tone.LFO(
      randomLfoFrequency(MIXER.auxReverb.lfoFrequencyMin, MIXER.auxReverb.lfoFrequencyMax),
      MIXER.auxReverb.feedback - MIXER.auxReverb.feedbackLfoDepth,
      MIXER.auxReverb.feedback + MIXER.auxReverb.feedbackLfoDepth,
    )
    lfo.phase = Math.random() * 360
    lfo.connect(feedbackGain.gain)
    const panner = new Tone.Panner(pan)

    input.connect(delay)
    delay.connect(damping)
    damping.connect(feedbackGain)
    feedbackGain.connect(delay)
    damping.connect(panner)
    panner.connect(wetGain)

    return { delay, damping, feedbackGain, lfo, panner }
  }

  const left = makeChannel(MIXER.auxReverb.delayTimeL, -MIXER.auxReverb.pan)
  const right = makeChannel(MIXER.auxReverb.delayTimeR, MIXER.auxReverb.pan)
  wetGain.connect(output)

  return {
    input,
    output,
    start() {
      left.lfo.start()
      right.lfo.start()
    },
    dispose() {
      input.dispose()
      output.dispose()
      wetGain.dispose()
      for (const channel of [left, right]) {
        channel.delay.dispose()
        channel.damping.dispose()
        channel.feedbackGain.dispose()
        channel.lfo.dispose()
        channel.panner.dispose()
      }
    },
  }
}

function createAuxDelay(): TrackEffectLike {
  const input = new Tone.Gain(1)
  const output = new Tone.Gain(1)
  const wetGain = new Tone.Gain(MIXER.auxDelay.wet)

  const makeChannel = (delayTime: number, pan: number) => {
    const delay = new Tone.Delay(0, 1)
    const feedbackGain = new Tone.Gain(MIXER.auxDelay.feedback)
    const lfo = new Tone.LFO(
      randomLfoFrequency(MIXER.auxDelay.lfoFrequencyMin, MIXER.auxDelay.lfoFrequencyMax),
      delayTime - MIXER.auxDelay.timeLfoDepth,
      delayTime + MIXER.auxDelay.timeLfoDepth,
    )
    lfo.phase = Math.random() * 360
    lfo.connect(delay.delayTime)
    const panner = new Tone.Panner(pan)

    input.connect(delay)
    delay.connect(feedbackGain)
    feedbackGain.connect(delay)
    delay.connect(panner)
    panner.connect(wetGain)

    return { delay, feedbackGain, lfo, panner }
  }

  const left = makeChannel(MIXER.auxDelay.timeL, -MIXER.auxDelay.pan)
  const right = makeChannel(MIXER.auxDelay.timeR, MIXER.auxDelay.pan)
  wetGain.connect(output)

  return {
    input,
    output,
    start() {
      left.lfo.start()
      right.lfo.start()
    },
    dispose() {
      input.dispose()
      output.dispose()
      wetGain.dispose()
      for (const channel of [left, right]) {
        channel.delay.dispose()
        channel.feedbackGain.dispose()
        channel.lfo.dispose()
        channel.panner.dispose()
      }
    },
  }
}

export function createMixer(): Mixer {
  const masterBus = new Tone.Gain(1)
  const compressor = new Tone.Compressor({
    threshold: MIXER.masterBus.threshold,
    ratio: MIXER.masterBus.ratio,
    knee: MIXER.masterBus.knee,
    attack: MIXER.masterBus.attack,
    release: MIXER.masterBus.release,
  })
  const makeup = new Tone.Gain(Tone.dbToGain(MIXER.masterBus.makeupGain))
  const limiter = new Tone.Limiter(MIXER.masterBus.limiterThreshold)
  masterBus.chain(compressor, makeup, limiter, Tone.getDestination())

  const auxReverb = createAuxReverb()
  auxReverb.output.connect(masterBus)

  const auxDelay = createAuxDelay()
  auxDelay.output.connect(masterBus)

  const channels: Tone.Gain[] = []
  const sendGains: Tone.Gain[] = []

  return {
    channel() {
      const channel = new Tone.Gain(1)
      channel.connect(masterBus)
      channels.push(channel)
      return channel
    },
    aux: { reverb: auxReverb.input, delay: auxDelay.input },
    sendTo(source, aux, amount) {
      const send = new Tone.Gain(amount)
      source.connect(send)
      send.connect(aux)
      sendGains.push(send)
    },
    start() {
      auxReverb.start()
      auxDelay.start()
    },
    dispose() {
      masterBus.dispose()
      compressor.dispose()
      makeup.dispose()
      limiter.dispose()
      auxReverb.dispose()
      auxDelay.dispose()
      for (const channel of channels) channel.dispose()
      for (const send of sendGains) send.dispose()
    },
  }
}
