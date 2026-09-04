export type FeatureFlags = {
  bokeh: boolean
  antialias: boolean
  murk: boolean
}

const DEFAULTS: FeatureFlags = {
  bokeh: true,
  antialias: true,
  murk: true,
}

export const FEATURE_KEYS = Object.keys(DEFAULTS) as (keyof FeatureFlags)[]

export type DevicePreset = {
  id: string
  label: string
  features: Partial<FeatureFlags>
  pixelRatioCap?: number
  fpsCap?: number
}

export const DEVICE_PRESETS: DevicePreset[] = [
  { id: 'top-shelf', label: 'Top-shelf (everything on)', features: {} },
  { id: 'middle-tier', label: 'Middle-tier (bokeh off)', features: { bokeh: false } },
  {
    id: 'pi',
    label: 'Pi (lite)',
    features: { bokeh: false, murk: false },
    pixelRatioCap: 1,
  },
]

export type RuntimeConfig = {
  features: FeatureFlags
  pixelRatioCap: number | null
  fpsCap: number | null
  debugPanel: boolean
  preset: string
}

export function readRuntimeConfig(): RuntimeConfig {
  if (typeof window === 'undefined') {
    return { features: { ...DEFAULTS }, pixelRatioCap: null, fpsCap: null, debugPanel: false, preset: 'top-shelf' }
  }

  const params = new URLSearchParams(window.location.search)
  const preset = DEVICE_PRESETS.find((p) => p.id === params.get('device'))

  const features = { ...DEFAULTS, ...(preset?.features ?? {}) }
  const rawFf = params.get('ff')
  if (rawFf) {
    for (const pair of rawFf.split(',')) {
      const [key, value] = pair.split(':')
      if (!key || !(key in features)) continue
      features[key as keyof FeatureFlags] = value !== '0'
    }
  }

  const prParam = params.get('pr')
  const pixelRatioCap = prParam ? Number(prParam) : (preset?.pixelRatioCap ?? null)

  const fpsCapParam = params.get('fpscap')
  const fpsCap = fpsCapParam ? Number(fpsCapParam) : (preset?.fpsCap ?? null)

  return {
    features,
    pixelRatioCap: pixelRatioCap && Number.isFinite(pixelRatioCap) ? pixelRatioCap : null,
    fpsCap: fpsCap && Number.isFinite(fpsCap) ? fpsCap : null,
    debugPanel: params.get('debug') === '1',
    preset: preset?.id ?? 'top-shelf',
  }
}
