// ═══════════════════════════════════════════════════════════════════════
// THE TUNING SEAM — everything a new piece should touch first.
//
// This file is the single source of truth for palette, camera feel, and
// every musical value in the instrument. The engine and synth structures
// around it are frozen; changing the piece means changing this file and
// the scene content in `src/lib/content/`.
// ═══════════════════════════════════════════════════════════════════════

export const PIECE = {
  title: 'Tone Viewer',
  description: 'A generative piece — graphics and sound',

  palette: {
    // Scene clear color + page background (hex pair kept in lockstep).
    background: 0xfffff0,
    pageBackground: '#FFFFF0',
    ink: '#151515',
    accent: '#ffb7d5',
    ivory: '#FFFFF0',
  },

  camera: {
    fov: 60,
    z: 6,
    // The camera leans toward the pointer, so the content appears to
    // drift away from it — opposite, on both axes.
    drift: { x: 0.22, y: 0.14, ease: 0.03 },
  },

  audio: {
    bpm: 80,
    // The loader ring creeps here while voices prep, then completes when
    // they're ready — never hanging longer than the timeout.
    creepTo: 0.9,
    creepDuration: 1.6,
    readyTimeoutMs: 8000,
  },

  // Where a tap lands in the scene, in normalized pointer units, before
  // mapping onto the touch voice's note height and timbre width.
  touchPlane: { height: 2.1, width: 1 },

  sends: {
    touch: { reverb: 0.2, delay: 0.15 },
    sequence: { reverb: 0.22, delay: 0.16 },
    chord: { reverb: 0.55, delay: 0.4 },
  },

  touch: {
    // The touch voice's own register, in absolute MIDI numbers.
    noteRange: [36, 56] as const,
    harmonicityOptions: [0.5, 1, 1.5, 2],
    modulationIndex: 8,
    modulationIndexRange: 6,
    detune: 0,
    detuneRange: 55,
    detuneWobbleRate: 0.7,
    detuneWobbleDepth: 16,
    distortion: 0.55,
    noteDuration: 0.8,
    envelope: { attack: 0.25, decay: 1.4, sustain: 0.7, release: 2.4 },
    modulationEnvelope: { attack: 0.5, decay: 1, sustain: 0.4, release: 1.5 },
    filterFrequency: 700,
    filterOpenFrequency: 2900,
    reverbDecay: 5,
    reverbWet: 0.38,
    reverbFilterFrequency: 1600,
    volume: -14,
    glide: 0.06,
    delaySend: 0.5,
    delayTimeL: 0.28,
    delayTimeR: 0.35,
    delayTimeWobbleL: 0.02,
    delayTimeWobbleR: 0.03,
    delayWobbleRateL: 0.11,
    delayWobbleRateR: 0.17,
    delayWobbleRateDriftL: 0.06,
    delayWobbleRateDriftR: 0.09,
    delayWobbleDriftRateL: 0.019,
    delayWobbleDriftRateR: 0.027,
    delayFeedback: 0.42,
    delayErosionFrequencyL: 3000,
    delayErosionFrequencyR: 2200,
    delayPan: 0.75,
    heightSpan: 0.09,
    widthSpan: 0.12,
    phaserFrequency: 0.6,
    phaserOctaves: 5,
    phaserBaseFrequency: 350,
    phaserStages: 8,
    phaserQ: 12,
    roomReverbDecay: 1.1,
    roomReverbFilterFrequency: 1000,
    roomReverbPreDelay: 0.01,
    wetVolumeBoost: 3,
    wetVolumeBoostStart: 0.7,
  },

  sequence: {
    // The sequence's own register, in absolute MIDI numbers. Deliberately
    // NOT derived from any other voice — when those change register, this
    // stays put.
    register: { low: 60, high: 91 } as const,
    barsMin: 2,
    barsMax: 4,
    motifLength: 3,
    noteDuration: '8n' as const,
    echoTime: 0.64,
    echoFeedback: 0.45,
    echoWet: 0.55,
    harmonicity: 4,
    modulationIndex: 1.8,
    envelope: { attack: 0.001, decay: 0.32, sustain: 0, release: 0.06 },
    attackWalkRange: 0.015,
    attackWalkStep: 0.004,
    modulationEnvelope: { attack: 0.001, decay: 0.05, sustain: 0, release: 0.05 },
    filterFrequency: 1400,
    reverbDecay: 3.5,
    wetMix: 0.5,
    reverbFilterFrequency: 1400,
    reverbLfoFrequency: 0.08,
    reverbLfoWetDepth: 0.18,
    reverbLfoFilterDepth: 400,
    volume: -13,
  },

  chord: {
    noteRange: [48, 79] as const,
    minBars: 6,
    maxBars: 10,
    duration: '1m' as const,
    envelope: { attack: 1.2, decay: 0.6, sustain: 0.7, release: 4.5 },
    chorusFrequency: 0.3,
    chorusDelayTime: 7,
    chorusDepth: 0.92,
    chorusSpread: 180,
    chorusWet: 1,
    filterFrequency: 1400,
    reverbDecay: 15,
    reverbWet: 0.94,
    volume: -36,
    delaySend: 0.45,
    delayTimeL: 0.55,
    delayTimeR: 0.71,
    delayTimeWobbleL: 0.04,
    delayTimeWobbleR: 0.06,
    delayWobbleRateL: 0.05,
    delayWobbleRateR: 0.08,
    delayFeedback: 0.63,
    delayErosionFrequencyL: 1800,
    delayErosionFrequencyR: 1200,
    delayPan: 0.6,
  },
}
