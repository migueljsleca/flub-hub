"use client";

import { useEffect, useRef, type PointerEvent as ReactPointerEvent } from "react";
import { FERRO_SILENT } from "@/lib/ferro/ferro-audio";
import { FERRO_QUALITY } from "@/lib/ferro/ferro-params";
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
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const presetRef = useRef(preset);
  const orbit = useRef<Orbit>({ ...FERRO_PRESET_VIEW[preset], vYaw: 0, vPitch: 0, dragging: false, lastX: 0, lastY: 0 });

  // New preset: swap the look and reset the camera to that preset's angle.
  useEffect(() => {
    presetRef.current = preset;
    Object.assign(orbit.current, FERRO_PRESET_VIEW[preset], { vYaw: 0, vPitch: 0 });
  }, [preset]);

  // One WebGL scene for the lifetime of the component, drawn every frame.
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let scene: FerroScene;
    try {
      scene = new FerroScene({ antialias: true, canvas });
    } catch {
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
        o.yaw += (o.vYaw + IDLE_SPIN) * steps;
        o.pitch = clampPitch(o.pitch + o.vPitch * steps);
        o.vYaw *= FRICTION ** steps;
        o.vPitch *= FRICTION ** steps;
      }
      const cp = Math.cos(o.pitch);
      const params = {
        ...FERRO_PRESETS[presetRef.current],
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
      const progress = ((performance.now() - start) / 1000 / LOOP_SECONDS) % 1;
      scene.update(params, { audio: FERRO_SILENT, progress });
      scene.render(canvas.clientWidth * scale, canvas.clientHeight * scale);
    };
    frame = requestAnimationFrame(draw);

    return () => {
      cancelAnimationFrame(frame);
      scene.dispose();
    };
  }, []);

  const onDown = (e: ReactPointerEvent<HTMLCanvasElement>) => {
    if (e.button !== 0) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    Object.assign(orbit.current, { dragging: true, lastX: e.clientX, lastY: e.clientY, vYaw: 0, vPitch: 0 });
  };

  const onMove = (e: ReactPointerEvent<HTMLCanvasElement>) => {
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
    <canvas
      ref={canvasRef}
      aria-label="3D ferrofluid — drag to turn it"
      onPointerDown={onDown}
      onPointerMove={onMove}
      onPointerUp={onUp}
      onPointerCancel={onUp}
      onLostPointerCapture={onUp}
      className={cn("cursor-grab touch-none active:cursor-grabbing", className)}
    />
  );
}

function clampPitch(p: number) {
  return Math.max(-PITCH_LIMIT, Math.min(PITCH_LIMIT, p));
}
