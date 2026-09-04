'use client';

import Image from 'next/image';
import { useEffect, useRef, useState } from 'react';
import gsap from 'gsap';
import * as THREE from 'three';

import Cursor from './Cursor';
import DebugPanel, { type DebugMetrics } from './DebugPanel';
import LoadingRing from './LoadingRing';
import PlayButton from './PlayButton';
import { readRuntimeConfig, type RuntimeConfig } from '@/lib/features';
import { PIECE } from '@/lib/piece.config';
import { createAudioComposer, type AudioComposer } from '@/lib/engine/audio-composer';
import { retryAudioIfNotRunning } from '@/lib/engine/audio-gesture';
import { NOTE_STRIKE_EVENT, type NoteStrikeDetail } from '@/lib/engine/note-strike-event';
import { createRenderer } from '@/lib/viewer/renderer';
import { applyPointerDrift, createCamera } from '@/lib/viewer/camera';
import { createPost } from '@/lib/viewer/post';
import { createDemoMorph } from '@/lib/content/example-morph';
import type { ContentModule } from '@/lib/content/types';

// ─────────────────────────────────────────────────────────────────────────
// THE ART SEAM: `Piece` is the marriage of viewer, audio, and content.
// It owns the loop, the input, and the loader ceremony. A new piece
// usually starts by replacing the demo content module below and then
// growing this file — the viewer modules underneath it rarely change.
// ─────────────────────────────────────────────────────────────────────────

const Piece = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const audioComposerRef = useRef<AudioComposer | null>(null);
  const revealRef = useRef<(() => void) | null>(null);
  const metricsRef = useRef<DebugMetrics>({ fps: 0, frameMs: 0, triangles: 0, calls: 0 });
  const [progress, setProgress] = useState(0);
  const [audioReady, setAudioReady] = useState(false);
  const [debugConfig, setDebugConfig] = useState<RuntimeConfig | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const runtimeConfig = readRuntimeConfig();
    const { features } = runtimeConfig;
    setDebugConfig(runtimeConfig);

    const renderer = createRenderer(canvas, {
      antialias: features.antialias,
      pixelRatioCap: runtimeConfig.pixelRatioCap,
    });
    const scene = new THREE.Scene();
    const camera = createCamera();
    const post = createPost(renderer, scene, camera, {
      bokeh: features.bokeh ? { focus: PIECE.camera.z, aperture: 0.0022, maxblur: 0.009 } : null,
    });

    // ── Content: swap this module for the piece's real one. ──
    const content: ContentModule = createDemoMorph();
    scene.add(content.object);
    revealRef.current = () => content.reveal?.();

    // A simple starting light rig — three-point, tuned for an ivory room.
    scene.add(new THREE.AmbientLight(0xffffff, 0.6));
    const keyLight = new THREE.PointLight(0xffffff, 100);
    keyLight.position.set(6, 6, 8);
    scene.add(keyLight);
    const fillLight = new THREE.PointLight(0xa78bfa, 40);
    fillLight.position.set(-5, 3, 5);
    scene.add(fillLight);
    const rimLight = new THREE.DirectionalLight(0xffd9ec, 2);
    rimLight.position.set(-5, 2, -3);
    scene.add(rimLight);

    const audioComposer = createAudioComposer();
    audioComposer.touch.setHeightSpan(PIECE.touchPlane.height);
    audioComposerRef.current = audioComposer;

    let disposed = false;
    // The ring creeps toward its target while the voices prep, then
    // completes when they're ready — never hanging longer than the timeout.
    const loadState = { v: 0 };
    gsap.to(loadState, {
      v: PIECE.audio.creepTo,
      duration: PIECE.audio.creepDuration,
      ease: 'power1.out',
      onUpdate: () => setProgress(loadState.v),
    });
    audioComposer.ready.catch(() => {});
    Promise.race([
      audioComposer.ready,
      new Promise<void>((resolve) => setTimeout(resolve, PIECE.audio.readyTimeoutMs)),
    ]).then(() => {
      if (disposed) return;
      setProgress(1);
      setAudioReady(true);
    });

    gsap.from(camera.position, { z: PIECE.camera.z + 6, duration: 2, ease: 'power3.out' });

    const pointerNdc = new THREE.Vector2();

    const setNdcFromEvent = (event: PointerEvent) => {
      pointerNdc.set(
        (event.clientX / window.innerWidth) * 2 - 1,
        -(event.clientY / window.innerHeight) * 2 + 1,
      );
    };

    // Tap anywhere: the touch voice speaks, and the strike event fans out
    // to anything listening (the cursor pulse, content reactions).
    const handlePointerDown = (event: PointerEvent) => {
      setNdcFromEvent(event);
      retryAudioIfNotRunning();
      audioComposer.touch.attack({
        x: pointerNdc.x * PIECE.touchPlane.width,
        y: pointerNdc.y * PIECE.touchPlane.height,
      });
      window.dispatchEvent(
        new CustomEvent<NoteStrikeDetail>(NOTE_STRIKE_EVENT, {
          detail: { x: event.clientX, y: event.clientY },
        }),
      );
    };

    canvas.addEventListener('pointerdown', handlePointerDown);
    window.addEventListener('pointermove', setNdcFromEvent);

    let lastRenderGate = 0;
    let frameCount = 0;
    let lastFpsUpdate = 0;
    const elapsed = { seconds: 0 };

    const updateFrame = (time: number, deltaMs: number) => {
      const deltaSeconds = deltaMs / 1000;
      // Scene time always accumulates — only the render is gated.
      elapsed.seconds += deltaSeconds;

      if (runtimeConfig.fpsCap && time - lastRenderGate < 1000 / runtimeConfig.fpsCap) return;
      lastRenderGate = time;
      frameCount += 1;

      if (time - lastFpsUpdate >= 1) {
        metricsRef.current.fps = (frameCount * 1000) / (time - lastFpsUpdate);
        frameCount = 0;
        lastFpsUpdate = time;
      }
      metricsRef.current.frameMs = deltaMs;
      metricsRef.current.triangles = renderer.info.render.triangles;
      metricsRef.current.calls = renderer.info.render.calls;

      content.update?.(elapsed.seconds, deltaSeconds);
      applyPointerDrift(camera, pointerNdc);
      post.render();
    };

    gsap.ticker.add(updateFrame);

    const handleResize = () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
      post.setSize(window.innerWidth, window.innerHeight);
    };

    window.addEventListener('resize', handleResize);

    return () => {
      gsap.ticker.remove(updateFrame);
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('pointermove', setNdcFromEvent);
      canvas.removeEventListener('pointerdown', handlePointerDown);
      disposed = true;
      audioComposerRef.current?.dispose();
      content.dispose();
      post.dispose();
      renderer.dispose();
    };
  }, []);

  return (
    <div
      className="relative h-dvh w-full overflow-hidden"
      style={{ background: PIECE.palette.pageBackground }}
    >
      <canvas ref={canvasRef} className="block h-full w-full" />
      <Cursor />
      {debugConfig?.features.murk !== false && <div className="murk" aria-hidden />}
      <div className="vignette" aria-hidden />

      <div className="pointer-events-none absolute inset-0 grid place-items-center">
        {!audioReady && <LoadingRing progress={progress} />}
        {audioReady && (
          <PlayButton
            onPlay={() => {
              retryAudioIfNotRunning();
              audioComposerRef.current?.start();
              revealRef.current?.();
            }}
          />
        )}
      </div>

      <a
        href="https://danielisaacmiller.com"
        aria-label="Daniel Isaac Miller"
        className="absolute left-8 top-8 z-10 cursor-pointer sm:left-10 sm:top-10"
      >
        <Image src="/DM-Logo-Light.svg" alt="Logo" width={62} height={62} priority />
      </a>
      {debugConfig?.debugPanel && (
        <DebugPanel
          features={debugConfig.features}
          preset={debugConfig.preset}
          pixelRatioCap={debugConfig.pixelRatioCap}
          fpsCap={debugConfig.fpsCap}
          metricsRef={metricsRef}
        />
      )}
    </div>
  );
};

export default Piece;
