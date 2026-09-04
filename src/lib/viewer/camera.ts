import * as THREE from 'three'

import { PIECE } from '../piece.config'

export function createCamera(): THREE.PerspectiveCamera {
  const camera = new THREE.PerspectiveCamera(
    PIECE.camera.fov,
    window.innerWidth / window.innerHeight,
    0.1,
    100,
  )
  camera.position.z = PIECE.camera.z
  return camera
}

// The camera leans toward the pointer, so the content appears to drift
// away from it — opposite, on both axes. Exponential ease, frame-rate
// independent enough for a gentle drift.
export function applyPointerDrift(
  camera: THREE.PerspectiveCamera,
  pointerNdc: THREE.Vector2,
) {
  const targetX = pointerNdc.x * PIECE.camera.drift.x
  const targetY = pointerNdc.y * PIECE.camera.drift.y
  camera.position.x += (targetX - camera.position.x) * PIECE.camera.drift.ease
  camera.position.y += (targetY - camera.position.y) * PIECE.camera.drift.ease
}
