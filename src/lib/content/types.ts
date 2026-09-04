import type * as THREE from 'three'

// ─────────────────────────────────────────────────────────────────────────
// The content contract: anything a piece shows lives behind this interface.
// A content module owns one or more THREE objects, optionally updates them
// each frame, optionally reveals them when the play button fires, and
// always cleans up after itself. Nothing here assumes point clouds,
// meshes, or any one concept — the last two projects' ingredients
// (procedural morphs, point clouds, instanced fields) all fit through it.
// ─────────────────────────────────────────────────────────────────────────

export type ContentContext = {
  scene: THREE.Scene
  camera: THREE.PerspectiveCamera
}

export type ContentModule = {
  /** What gets added to the scene (a mesh, points, a group…). */
  object: THREE.Object3D
  /** Per-frame update, called only while the piece renders. */
  update?(elapsedSeconds: number, deltaSeconds: number): void
  /** The curtain-up moment — fire when the play button is pressed. */
  reveal?(): void
  dispose(): void
}
