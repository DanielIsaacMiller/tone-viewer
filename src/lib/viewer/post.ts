import * as THREE from 'three'
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js'
import { OutputPass } from 'three/examples/jsm/postprocessing/OutputPass.js'
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js'
import { BokehPass } from 'three/examples/jsm/postprocessing/BokehPass.js'

export type PostConfig = {
  bokeh: { focus: number; aperture: number; maxblur: number } | null
}

export type Post = {
  composer: EffectComposer
  setSize(width: number, height: number): void
  render(): void
  dispose(): void
}

// The post layer: render → per-piece passes → color output. Add passes
// (grain, anamorphic, custom shaders) between the render and output passes
// in `createPost` — or better, in the piece's own post module.
export function createPost(
  renderer: THREE.WebGLRenderer,
  scene: THREE.Scene,
  camera: THREE.PerspectiveCamera,
  config: PostConfig,
): Post {
  const composer = new EffectComposer(renderer)
  composer.addPass(new RenderPass(scene, camera))

  if (config.bokeh) {
    composer.addPass(
      new BokehPass(scene, camera, {
        focus: config.bokeh.focus,
        aperture: config.bokeh.aperture,
        maxblur: config.bokeh.maxblur,
      }),
    )
  }

  composer.addPass(new OutputPass())

  return {
    composer,
    setSize(width, height) {
      composer.setSize(width, height)
    },
    render() {
      composer.render()
    },
    dispose() {
      composer.dispose()
    },
  }
}
