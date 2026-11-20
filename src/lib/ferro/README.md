# ferro

The 3D ferrofluid renderer, ported unchanged from `../ferrofluid-lab/src/app/ferro`
(MIT, see ferrofluid-lab/LICENSE.md). Only `ferro-audio.ts` is trimmed to the
types the renderer needs; Flux OS drives it from `components/os/ferro-stage.tsx`
with three fixed presets and an orbit camera, no sliders.

Keep these files in sync with ferrofluid-lab rather than editing them here.
