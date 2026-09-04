# tone-viewer

The template for the Tone.js + Three.js pieces. Every new piece starts
here: `gh repo create <name> --template DanielIsaacMiller/tone-viewer`.

Same stack as Sakuramochi and hydrangea — Next.js 16, React 19, three,
gsap, Tone 15, Tailwind 4 — with a camera, a post-processing layer, the
shared Tone.js engine, and a decoupled content contract. It ships with a
working demo (a morphing icosahedron married to the touch voice) so a
new piece boots with sound and motion already connected.

## The four moves

### 1. Tune `src/lib/piece.config.ts`
Palette, camera drift, BPM, every register, interval set, effect and
send value. This is the only file that should hold numbers — the synth
and engine structures around it are frozen.

### 2. Build `src/lib/content/`
Anything the piece shows is a `ContentModule` (`content/types.ts`):
an `object` for the scene graph, an optional `update(t, dt)`, an
optional `reveal()` fired by the play button, and `dispose()`.
Point clouds, procedural meshes, instanced fields, loaded GLBs — all
just content. Async loads go through `content/loaders.ts`
(`loadGLB`, `loadJSON`). Delete `content/example-morph.ts` when the
real thing lands, and point `Piece.tsx` at it.

### 3. Swap or add a voice in `src/lib/instrument/`
The engine (`src/lib/engine/`) is frozen — mixer topology, clock,
sequencer, gesture guard, FM voice primitives. The instrument layer is
the piece's: the three voices (touch / sequence / chord) read every
number from `piece.config.ts`. To add a voice (say, a vocal synth),
copy `chord-synth.ts` as the scaffold, tune it in `piece.config.ts`,
and wire it into `engine/audio-composer.ts` — that file is the one
frozen file you're allowed to edit, because its whole job is wiring.

### 4. Test on the Pi
`./pi/deploy.sh` builds, rsyncs, and restarts the kiosk. The lite
preset is `?device=pi` (bokeh off, murk off, DPR 1). Pieces heavier
than the preset allows stay web-only — that's a feature, not a bug.

## Debug & flags

`?debug=1` opens the perf panel (fps / frame ms / draw calls, presets,
DPR + fps caps, per-feature toggles). `?ff=bokeh:0,murk:0` toggles
flags, `?pr=1` caps pixel ratio, `?fpscap=30` throttles renders.
Pieces add their own flags to `FeatureFlags` — the panel picks them up
automatically.

## Layers, in dependency order

```
src/app/          shell: layout (title from piece.config), globals, icon
src/components/   chrome: Piece (the marriage), PlayButton, LoadingRing,
                  Cursor, DebugPanel — frozen
src/lib/viewer/   renderer, camera + drift, post chain — frozen
src/lib/content/  ★ the art seam: ContentModule contract + the piece's stuff
src/lib/engine/   Tone.js engine + wiring — frozen (audio-composer = wiring)
src/lib/instrument/  the voices — frozen structure, tuned via piece.config
src/lib/piece.config.ts   ★ the tuning seam
pi/               hardware deployment
```
