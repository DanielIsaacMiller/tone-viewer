import * as Tone from 'tone'

import { onceAsync } from './once'

export const resumeAudio = onceAsync(() => Tone.start())

export function isAudioRunning(): boolean {
  return Tone.getContext().state === 'running'
}

export function retryAudioIfNotRunning(): void {
  if (isAudioRunning()) return
  Tone.start().catch(() => {})
}
