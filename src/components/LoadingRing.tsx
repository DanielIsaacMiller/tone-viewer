const SIZE = 48
const STROKE_WIDTH = 1.6
const RADIUS = (SIZE - STROKE_WIDTH) / 2
const CIRCUMFERENCE = 2 * Math.PI * RADIUS
const PLAY_SIZE = 20

export type LoadingRingProps = {
  progress: number
  ready?: boolean
  onPlay?: () => void
}

export default function LoadingRing({ progress, ready = false, onPlay }: LoadingRingProps) {
  const clamped = Math.min(1, Math.max(0, progress))
  const offset = CIRCUMFERENCE * (1 - clamped)

  const ring = (
    <svg
      width={SIZE}
      height={SIZE}
      viewBox={`0 0 ${SIZE} ${SIZE}`}
      className={ready ? undefined : 'loading-ring'}
    >
      <circle
        cx={SIZE / 2}
        cy={SIZE / 2}
        r={RADIUS}
        fill="none"
        stroke="#151515"
        strokeOpacity={0.15}
        strokeWidth={STROKE_WIDTH}
      />
      <circle
        cx={SIZE / 2}
        cy={SIZE / 2}
        r={RADIUS}
        fill="none"
        stroke="#151515"
        strokeWidth={STROKE_WIDTH}
        strokeLinecap="round"
        strokeDasharray={CIRCUMFERENCE}
        strokeDashoffset={offset}
        transform={`rotate(-90 ${SIZE / 2} ${SIZE / 2})`}
      />
      {ready && (
        <polygon
          points={`${SIZE / 2 - PLAY_SIZE / 2 + 3},${SIZE / 2 - PLAY_SIZE / 2} ${SIZE / 2 - PLAY_SIZE / 2 + 3},${SIZE / 2 + PLAY_SIZE / 2} ${SIZE / 2 + PLAY_SIZE / 2},${SIZE / 2}`}
        />
      )}
    </svg>
  )

  return (
    <div className="relative" style={{ width: SIZE, height: SIZE }}>
      {ready ? (
        <button
          type="button"
          onClick={onPlay}
          aria-label="Play"
          className="pointer-events-auto block transition-transform duration-200 hover:scale-105"
        >
          {ring}
        </button>
      ) : (
        ring
      )}
      {!ready && (
        <p className="pointer-events-none absolute inset-0 flex items-center justify-center text-sm tabular-nums text-[#151515] opacity-60">
          {Math.round(clamped * 100)}%
        </p>
      )}
    </div>
  )
}
