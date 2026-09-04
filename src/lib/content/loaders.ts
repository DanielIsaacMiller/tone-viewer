import type * as THREE from 'three'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'

// Generic async loaders for whatever the piece ships with — models,
// point data, textures. Content stays decoupled: load, then wrap in a
// ContentModule (see content/types.ts).

export function loadGLB(url: string): Promise<THREE.Group> {
  return new GLTFLoader().loadAsync(url).then((gltf) => gltf.scene)
}

export async function loadJSON(url: string): Promise<unknown> {
  const response = await fetch(url)
  if (!response.ok) throw new Error(`Failed to load ${url}: ${response.status}`)
  return response.json()
}
