'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import gsap from 'gsap'
import { Play } from 'lucide-react'

// Light charm pink — the ripple's landing shade.
const CHARM_PINK = '#ffb7d5'

const MAGNETIC = { circleMax: 12, iconMax: 5 } as const

export type PlayButtonProps = {
  onPlay?: () => void
}

// The play button: a magnetic 48px circle that leans toward the cursor,
// and on click becomes the ripple itself — growing to 256px, turning charm
// pink, and fading away.
export default function PlayButton({ onPlay }: PlayButtonProps) {
  const buttonRef = useRef<HTMLButtonElement | null>(null)
  const iconRef = useRef<SVGSVGElement | null>(null)
  const [gone, setGone] = useState(false)

  // Magnetic pull, hover-only: the circle leans toward the cursor while it is
  // over the button, and snaps back with elastic physics on the way out.
  useEffect(() => {
    const circle = buttonRef.current
    const icon = iconRef.current
    if (!circle || !icon) return

    const leanToward = (
      target: HTMLElement | SVGSVGElement,
      dx: number,
      dy: number,
      max: number,
    ) => {
      let x = dx * 0.35
      let y = dy * 0.35
      const magnitude = Math.hypot(x, y)
      if (magnitude > max) {
        x = (x / magnitude) * max
        y = (y / magnitude) * max
      }
      gsap.to(target, { x, y, duration: 0.7, ease: 'power3', overwrite: 'auto' })
    }

    const snapBack = () => {
      gsap.to(circle, {
        x: 0,
        y: 0,
        duration: 1.6,
        ease: 'elastic.out(1, 0.5)',
        overwrite: 'auto',
      })
      gsap.to(icon, {
        x: 0,
        y: 0,
        duration: 1.6,
        ease: 'elastic.out(1, 0.5)',
        overwrite: 'auto',
      })
    }

    const handleHoverMove = (event: PointerEvent) => {
      const rect = circle.getBoundingClientRect()
      const currentX = Number(gsap.getProperty(circle, 'x')) || 0
      const currentY = Number(gsap.getProperty(circle, 'y')) || 0
      const centerX = rect.left + rect.width / 2 - currentX
      const centerY = rect.top + rect.height / 2 - currentY
      leanToward(
        circle,
        event.clientX - centerX,
        event.clientY - centerY,
        MAGNETIC.circleMax,
      )
      leanToward(
        icon,
        event.clientX - centerX,
        event.clientY - centerY,
        MAGNETIC.iconMax,
      )
    }

    circle.addEventListener('pointermove', handleHoverMove)
    circle.addEventListener('pointerleave', snapBack)
    return () => {
      circle.removeEventListener('pointermove', handleHoverMove)
      circle.removeEventListener('pointerleave', snapBack)
    }
  }, [])

  const handlePlay = useCallback(() => {
    onPlay?.()

    // One circle: the button itself becomes the ripple — grows to 256px,
    // turns charm pink, and fades to zero.
    gsap.fromTo(
      buttonRef.current,
      { scale: 1, opacity: 0.9, borderColor: '#151515', borderWidth: 1.6 },
      {
        // 5.33x growth would fatten the border 5.33x — thinning it in
        // proportion keeps the on-screen line at a constant 1.6px.
        scale: 5.33,
        borderWidth: 1.6 / 5.33,
        opacity: 0,
        duration: 0.6,
        ease: 'power2.out',
        onComplete: () => setGone(true),
      },
    )
    // The color flips to pink almost immediately — a quick snap, not a drift.
    gsap.fromTo(
      buttonRef.current,
      { borderColor: '#151515' },
      { borderColor: CHARM_PINK, duration: 0.35, ease: 'power2.out' },
    )
    gsap.to(iconRef.current, { opacity: 0, duration: 0.5 })
  }, [onPlay])

  if (gone) return null

  return (
    <div className="pointer-events-none absolute inset-0 grid place-items-center">
      <button
        ref={buttonRef}
        type="button"
        onClick={handlePlay}
        aria-label="Play"
        className="group pointer-events-auto relative col-start-1 row-start-1 flex h-12 w-12 cursor-pointer items-center justify-center rounded-full border-[1.6px] border-[#151515] transition-colors duration-[250ms] hover:bg-[#ffb7d5]"
      >
        <Play
          ref={iconRef}
          className="h-5 w-5 fill-[#151515] text-[#151515] transition-colors duration-[250ms]"
          strokeWidth={0}
        />
      </button>
    </div>
  )
}
