'use client'

import { useEffect, useState } from 'react'
import { DEVICE_PRESETS, FEATURE_KEYS } from '@/lib/features'
import type { FeatureFlags } from '@/lib/features'

export type DebugMetrics = {
  fps: number
  frameMs: number
  triangles: number
  calls: number
}

export type DebugPanelProps = {
  features: FeatureFlags
  preset: string
  pixelRatioCap: number | null
  fpsCap: number | null
  metricsRef: React.RefObject<DebugMetrics>
}

const POLL_MS = 500

export default function DebugPanel({ features, preset, pixelRatioCap, fpsCap, metricsRef }: DebugPanelProps) {
  const [metrics, setMetrics] = useState<DebugMetrics>({ fps: 0, frameMs: 0, triangles: 0, calls: 0 })

  useEffect(() => {
    const id = window.setInterval(() => setMetrics({ ...metricsRef.current }), POLL_MS)
    return () => window.clearInterval(id)
  }, [metricsRef])

  const go = (url: string) => window.location.assign(url)

  const toggleFlag = (key: keyof FeatureFlags, value: boolean) => {
    const params = new URLSearchParams(window.location.search)
    const current = new Map<string, boolean>()
    for (const pair of (params.get('ff') ?? '').split(',')) {
      const [k, v] = pair.split(':')
      if (k) current.set(k, v !== '0')
    }
    current.set(key, value)
    params.set('ff', Array.from(current, ([k, v]) => `${k}:${v ? 1 : 0}`).join(','))
    go(`${window.location.pathname}?${params.toString()}`)
  }

  const selectPreset = (id: string) => {
    const params = new URLSearchParams(window.location.search)
    params.delete('ff')
    if (id === 'top-shelf') params.delete('device')
    else params.set('device', id)
    go(`${window.location.pathname}?${params.toString()}`)
  }

  const setParam = (key: string, value: string | null) => {
    const params = new URLSearchParams(window.location.search)
    if (value === null) params.delete(key)
    else params.set(key, value)
    go(`${window.location.pathname}?${params.toString()}`)
  }

  return (
    <div className="pointer-events-auto absolute bottom-3 left-3 w-64 rounded-lg border border-white/15 bg-black/70 p-3 font-mono text-[11px] text-[#FFFFF0] backdrop-blur-sm">
      <p className="mb-2 text-[10px] uppercase tracking-wide opacity-50">Perf debug</p>

      <div className="mb-3 grid grid-cols-2 gap-x-2 gap-y-0.5 tabular-nums">
        <span className="opacity-60">fps</span>
        <span>{metrics.fps.toFixed(1)}</span>
        <span className="opacity-60">frame</span>
        <span>{metrics.frameMs.toFixed(2)} ms</span>
        <span className="opacity-60">tris</span>
        <span>{metrics.triangles.toLocaleString()}</span>
        <span className="opacity-60">draw calls</span>
        <span>{metrics.calls}</span>
      </div>

      <label className="mb-1 block opacity-60">
        Device preset
        <select
          className="mt-0.5 block w-full rounded border border-white/20 bg-black/60 px-1 py-0.5 text-[#FFFFF0]"
          value={preset}
          onChange={(e) => selectPreset(e.target.value)}
        >
          {DEVICE_PRESETS.map((p) => (
            <option key={p.id} value={p.id}>
              {p.label}
            </option>
          ))}
        </select>
      </label>
      <p className="mb-2 text-[10px] leading-snug opacity-40">
        Presets bundle the settings below — a page can&apos;t throttle real GPU/CPU cycles, so this
        approximates a device via resolution + effects, not true hardware emulation.
      </p>

      <label className="mb-2 block opacity-60">
        Simulated frame cap
        <select
          className="mt-0.5 block w-full rounded border border-white/20 bg-black/60 px-1 py-0.5 text-[#FFFFF0]"
          value={fpsCap ?? 'off'}
          onChange={(e) => setParam('fpscap', e.target.value === 'off' ? null : e.target.value)}
        >
          <option value="off">Off</option>
          <option value="60">60 fps</option>
          <option value="30">30 fps</option>
          <option value="15">15 fps</option>
        </select>
      </label>

      <label className="mb-2 block opacity-60">
        Pixel ratio cap
        <select
          className="mt-0.5 block w-full rounded border border-white/20 bg-black/60 px-1 py-0.5 text-[#FFFFF0]"
          value={pixelRatioCap ?? 'off'}
          onChange={(e) => setParam('pr', e.target.value === 'off' ? null : e.target.value)}
        >
          <option value="off">Off (device default)</option>
          <option value="2">2x</option>
          <option value="1.5">1.5x</option>
          <option value="1">1x</option>
        </select>
      </label>

      <p className="mb-1 opacity-60">Effects</p>
      <div className="grid grid-cols-2 gap-x-2">
        {FEATURE_KEYS.map((key) => (
          <label key={key} className="flex items-center gap-1.5 py-0.5">
            <input
              type="checkbox"
              checked={features[key]}
              onChange={(e) => toggleFlag(key, e.target.checked)}
              className="accent-[#FFFFF0]"
            />
            {key}
          </label>
        ))}
      </div>
    </div>
  )
}
