import * as THREE from 'three'

import { PIECE } from '../piece.config'

export type RendererConfig = {
  antialias: boolean
  pixelRatioCap: number | null
}

export function createRenderer(canvas: HTMLCanvasElement, config: RendererConfig) {
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: config.antialias })
  renderer.setClearColor(PIECE.palette.background)
  // iPhones report DPR 3 — rendering a native-res framebuffer is a thermal
  // death sentence. Two is visually indistinguishable and ~2.2x lighter.
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, config.pixelRatioCap ?? 2))
  renderer.setSize(window.innerWidth, window.innerHeight)
  return renderer
}
