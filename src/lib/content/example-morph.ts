import * as THREE from 'three'
import gsap from 'gsap'
import { mergeVertices } from 'three/examples/jsm/utils/BufferGeometryUtils.js'

import { PIECE } from '../piece.config'
import type { ContentModule } from './types'

// ─────────────────────────────────────────────────────────────────────────
// EXAMPLE CONTENT — a placeholder to be deleted.
//
// A morphing icosahedron with a soft accent material, drifting in a slow
// fluid-like noise. It exists to prove the pipeline end to end: scene
// boots, tap → sound + strike event, camera drifts, play → reveal.
// Replace with the piece's real content.
// ─────────────────────────────────────────────────────────────────────────

const DEMO = {
  amplitude: 0.14,
  speed: 0.5,
  spin: 0.12,
}

// A cheap broad-banded pseudo-noise, summing a few incommensurate sines —
// smooth enough to read as liquid without shipping a noise library.
const wobbleAt = (x: number, y: number, z: number, t: number): number => {
  return (
    Math.sin(x * 1.35 + t * DEMO.speed * 2.1 + z * 0.8) * 0.55 +
    Math.sin(y * 1.9 + t * DEMO.speed * 1.4) * 0.3 +
    Math.sin((x + y + z) * 0.9 - t * DEMO.speed) * 0.15
  )
}

export function createDemoMorph(): ContentModule {
  const geometry = mergeVertices(new THREE.IcosahedronGeometry(1.7, 24))
  const basePositions = new Float32Array(geometry.attributes.position.array)

  const material = new THREE.MeshPhysicalMaterial({
    color: PIECE.palette.accent,
    roughness: 0.28,
    clearcoat: 0.9,
    clearcoatRoughness: 0.25,
  })

  const mesh = new THREE.Mesh(geometry, material)
  // Off-stage until the play button fires — the reveal blooms it in.
  mesh.scale.setScalar(0)
  const position = geometry.attributes.position as THREE.BufferAttribute
  const normals = geometry.attributes.normal as THREE.BufferAttribute

  const applyMorph = (t: number) => {
    for (let i = 0; i < position.count; i += 1) {
      const o = i * 3
      const ox = basePositions[o]
      const oy = basePositions[o + 1]
      const oz = basePositions[o + 2]
      const n = wobbleAt(ox, oy, oz, t) * DEMO.amplitude
      position.setXYZ(i, ox + ox * n, oy + oy * n, oz + oz * n)
    }
    position.needsUpdate = true
    geometry.computeVertexNormals()
    normals.needsUpdate = true
  }

  return {
    object: mesh,
    update(elapsedSeconds, deltaSeconds) {
      applyMorph(elapsedSeconds)
      mesh.rotation.y += deltaSeconds * DEMO.spin
    },
    reveal() {
      gsap.to(mesh.scale, {
        x: 1,
        y: 1,
        z: 1,
        duration: 1.6,
        ease: 'back.out(1.4)',
        delay: 0.4,
      })
    },
    dispose() {
      geometry.dispose()
      material.dispose()
    },
  }
}
