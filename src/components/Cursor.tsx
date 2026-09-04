'use client'

import { useEffect, useRef } from 'react'

import { createCursor } from '../lib/engine/cursor'
import { NOTE_STRIKE_EVENT, type NoteStrikeDetail } from '../lib/engine/note-strike-event'

const CURSOR_COLOR = '#ffb7d5'
const CURSOR_SIZE = 8

const PULSE = {
  startSize: 8,
  endSize: 32,
  duration: 600,
  strokeWidth: 1,
}

export default function Cursor() {
  const svgRef = useRef<SVGSVGElement>(null)
  const dotRef = useRef<SVGCircleElement>(null)

  useEffect(() => {
    const svg = svgRef.current
    const dot = dotRef.current
    if (!svg || !dot) return

    const cursor = createCursor(svg, dot, {
      color: CURSOR_COLOR,
      pulseStartSize: PULSE.startSize,
      pulseEndSize: PULSE.endSize,
      pulseDuration: PULSE.duration,
      pulseStrokeWidth: PULSE.strokeWidth,
    })

    // Over interactive controls the custom dot hides and the native
    // pointer cursor takes over.
    const isOverControl = (event: PointerEvent) =>
      event.target instanceof Element && event.target.closest("button, a") !== null

    const onPointerMove = (event: PointerEvent) => {
      cursor.moveTo(event.clientX, event.clientY)
      if (event.pointerType !== 'touch') cursor.setVisible(!isOverControl(event))
    }

    const onPointerDown = (event: PointerEvent) => {
      cursor.moveTo(event.clientX, event.clientY)
      if (isOverControl(event)) return
      cursor.setVisible(true)
      cursor.pulse(event.clientX, event.clientY)
    }

    const onPointerUp = (event: PointerEvent) => {
      if (event.pointerType === 'touch') cursor.setVisible(false)
    }

    const onLeaveViewport = () => cursor.setVisible(false)

    const onNoteStrike = (event: Event) => {
      const { x, y } = (event as CustomEvent<NoteStrikeDetail>).detail
      cursor.pulse(x, y)
    }

    window.addEventListener('pointermove', onPointerMove)
    window.addEventListener('pointerdown', onPointerDown)
    window.addEventListener('pointerup', onPointerUp)
    window.addEventListener('pointercancel', onPointerUp)
    document.documentElement.addEventListener('pointerleave', onLeaveViewport)
    window.addEventListener(NOTE_STRIKE_EVENT, onNoteStrike)

    return () => {
      window.removeEventListener('pointermove', onPointerMove)
      window.removeEventListener('pointerdown', onPointerDown)
      window.removeEventListener('pointerup', onPointerUp)
      window.removeEventListener('pointercancel', onPointerUp)
      document.documentElement.removeEventListener('pointerleave', onLeaveViewport)
      window.removeEventListener(NOTE_STRIKE_EVENT, onNoteStrike)
      cursor.destroy()
    }
  }, [])

  return (
    <svg
      ref={svgRef}
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 z-50 h-full w-full"
    >
      <circle
        ref={dotRef}
        data-cursor-dot
        r={CURSOR_SIZE / 2}
        fill={CURSOR_COLOR}
        cx={-100}
        cy={-100}
        className="opacity-0"
      />
    </svg>
  )
}
