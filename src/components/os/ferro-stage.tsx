"use client";

import { useEffect, useRef, type CSSProperties, type PointerEvent as ReactPointerEvent } from "react";
import { FERRO_SILENT } from "@/lib/ferro/ferro-audio";
import { FERRO_QUALITY, type FerroParams } from "@/lib/ferro/ferro-params";
import { FerroScene } from "@/lib/ferro/ferro-scene";
import { FERRO_PRESETS, FERRO_PRESET_VIEW, type FerroPresetId } from "@/lib/ferro-presets";
import { cn } from "@/lib/utils";

const LOOP_SECONDS = 12; // one full morph cycle of the fluid surface
const CAMERA_DISTANCE = 5; // only the direction matters: the scene auto-fits
const DRAG_SPEED = 0.008; // radians per CSS pixel
const PITCH_LIMIT = 1.35; // don't flip over the poles
const FRICTION = 0.93; // inertia decay per frame after a flick
const IDLE_SPIN = 0.0016; // radians per 60fps-frame when nobody is dragging
const MAX_BACKING = 1300; // cap on the drawing buffer's long side, in pixels
const IDLE_FPS = 30; // the fluid moves slowly: 30fps idle, full rate while dragging

type Orbit = {
  yaw: number;
  pitch: number;
  vYaw: number;
  vPitch: number;
  dragging: boolean;
  lastX: number;
  lastY: number;
};

/**
 * The 3D ferrofluid in the middle of the desktop, rendered live with the
 * ferrofluid-lab engine. No sliders: drag to orbit the camera (with a little
 * inertia), and `preset` picks one of three looks.
 */
export function FerroStage({ preset, className }: { preset: FerroPresetId; className?: string }) {
  return <FerroCanvas look={FERRO_PRESETS[preset]} view={FERRO_PRESET_VIEW[preset]} className={className} />;
}

/** A fixed look, or one that changes over time (seconds since the canvas mounted). */
export type FerroLook = FerroParams | ((seconds: number) => FerroParams);

type FerroCanvasProps = {
  look: FerroLook;
  /** Starting camera angle; changing it resets the camera. */
  view: { yaw: number; pitch: number };
  /** Radians per 60fps-frame of slow turning while nobody drags. */
  idleSpin?: number;
  className?: string;
  style?: CSSProperties;
};

/**
 * Any live ferrofluid: a transparent WebGL canvas showing `look`, drag to
 * orbit. It draws at 30fps when idle and stops while the tab is hidden.
 */
export function FerroCanvas({ look, view, idleSpin = IDLE_SPIN, className, style }: FerroCanvasProps) {
  const boxRef = useRef<HTMLDivElement>(null);
  const lookRef = useRef(look);
  const spinRef = useRef(idleSpin);
  const orbit = useRef<Orbit>({ ...view, vYaw: 0, vPitch: 0, dragging: false, lastX: 0, lastY: 0 });

  useEffect(() => {
    lookRef.current = look;
    spinRef.current = idleSpin;
  }, [look, idleSpin]);

  // New starting angle: reset the camera to it.
  useEffect(() => {
    Object.assign(orbit.current, { yaw: view.yaw, pitch: view.pitch, vYaw: 0, vPitch: 0 });
  }, [view.yaw, view.pitch]);

  // One WebGL scene for the lifetime of the component, drawn every frame.
  useEffect(() => {
    const box = boxRef.current;
    if (!box) return;
    // A fresh canvas per mount: its context is released on unmount, and a
    // released context can't be reused (React mounts twice in development).
    const canvas = document.createElement("canvas");
    canvas.className = "block size-full";
    box.append(canvas);
    let scene: FerroScene;
    try {
      scene = new FerroScene({ antialias: true, canvas });
    } catch {
      canvas.remove();
      return; // no WebGL: the desktop simply has no ferrofluid
    }
    const quality = FERRO_QUALITY.balanced;
    scene.setMeshDetail(quality.blobSegments, quality.poolSegments);
    const start = performance.now();
    let frame = 0;
    let last = 0;

    const draw = (now: number) => {
      frame = requestAnimationFrame(draw);
      if (document.hidden) return;
      const o = orbit.current;
      const coasting = Math.abs(o.vYaw) + Math.abs(o.vPitch) > 0.0005;
      // Idle: skip frames down to IDLE_FPS. Dragging or coasting: every frame.
      if (!o.dragging && !coasting && now - last < 1000 / IDLE_FPS - 2) return;
      const steps = last ? Math.min((now - last) / (1000 / 60), 4) : 1; // frame-rate independent motion
      last = now;
      if (!o.dragging) {
        o.yaw += (o.vYaw + spinRef.current) * steps;
        o.pitch = clampPitch(o.pitch + o.vPitch * steps);
        o.vYaw *= FRICTION ** steps;
        o.vPitch *= FRICTION ** steps;
      }
      const cp = Math.cos(o.pitch);
      const current = lookRef.current;
      const seconds = Math.max(0, now - start) / 1000; // the first rAF stamp can predate start
      const params = {
        ...(typeof current === "function" ? current(seconds) : current),
        pose: {
          position: [
            Math.sin(o.yaw) * cp * CAMERA_DISTANCE,
            Math.sin(o.pitch) * CAMERA_DISTANCE,
            Math.cos(o.yaw) * cp * CAMERA_DISTANCE,
          ] as const,
          up: [0, 1, 0] as const,
        },
      };
      // Sharp enough on retina, but never a huge buffer (cost grows with pixels).
      const side = Math.max(canvas.clientWidth, canvas.clientHeight, 1);
      const scale = Math.min(Math.min(window.devicePixelRatio || 1, 2) * quality.pixelScale * 1.25, MAX_BACKING / side);
      const progress = (seconds / LOOP_SECONDS) % 1;
      scene.update(params, { audio: FERRO_SILENT, progress });
      scene.render(canvas.clientWidth * scale, canvas.clientHeight * scale);
    };
    frame = requestAnimationFrame(draw);

    return () => {
      cancelAnimationFrame(frame);
      scene.dispose();
      // Free the GPU context now: browsers cap live contexts (~16) and drop the
      // oldest one (the desktop's) when slides keep creating new ones.
      canvas.getContext("webgl2")?.getExtension("WEBGL_lose_context")?.loseContext();
      canvas.remove();
    };
  }, []);

  const onDown = (e: ReactPointerEvent<HTMLDivElement>) => {
    if (e.button !== 0) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    Object.assign(orbit.current, { dragging: true, lastX: e.clientX, lastY: e.clientY, vYaw: 0, vPitch: 0 });
  };

  const onMove = (e: ReactPointerEvent<HTMLDivElement>) => {
    const o = orbit.current;
    if (!o.dragging) return;
    if ((e.buttons & 1) === 0) return onUp();
    const dYaw = -(e.clientX - o.lastX) * DRAG_SPEED;
    const dPitch = (e.clientY - o.lastY) * DRAG_SPEED;
    o.yaw += dYaw;
    o.pitch = clampPitch(o.pitch + dPitch);
    // remember the last movement so a flick keeps spinning briefly
    o.vYaw = dYaw;
    o.vPitch = dPitch;
    o.lastX = e.clientX;
    o.lastY = e.clientY;
  };

  const onUp = () => {
    orbit.current.dragging = false;
  };

  return (
    <div
      ref={boxRef}
      role="img"
      aria-label="3D ferrofluid — drag to turn it"
      onPointerDown={onDown}
      onPointerMove={onMove}
      onPointerUp={onUp}
      onPointerCancel={onUp}
      onLostPointerCapture={onUp}
      style={style}
      className={cn("cursor-grab touch-none active:cursor-grabbing", className)}
    />
  );
}

function clampPitch(p: number) {
  return Math.max(-PITCH_LIMIT, Math.min(PITCH_LIMIT, p));
}
