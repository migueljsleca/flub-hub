// Procedural "shape family" geometry for Ferrofluid Lab: Melt (puffy abstract
// liquid stickers, refs 13-15) and Thorns (tapered swirling
// tendrils with side thorns, ref 12). Authored as JS like ferro-scene.js so the
// Toolcraft boundary type walker never traverses Three's recursive types.
import { BufferAttribute, BufferGeometry, Vector3 } from "./three-untyped";

/** Deterministic PRNG (mulberry32) so a seed always rebuilds the same shape. */
function createRandom(seed) {
    let state = (Math.floor(seed) * 2654435761) >>> 0 || 1;
    return () => {
        state = (state + 0x6d2b79f5) >>> 0;
        let t = state;
        t = Math.imul(t ^ (t >>> 15), t | 1);
        t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
}

function finishGeometry(positions, normals, indices) {
    const geometry = new BufferGeometry();
    geometry.setAttribute("position", new BufferAttribute(positions, 3));
    geometry.setAttribute("normal", new BufferAttribute(normals, 3));
    if (indices) geometry.setIndex(new BufferAttribute(indices, 1));
    // Centre on the bounding box so the camera auto-fit frames the shape.
    geometry.computeBoundingBox();
    const center = new Vector3();
    geometry.boundingBox.getCenter(center);
    geometry.translate(-center.x, -center.y, -center.z);
    geometry.computeBoundingSphere();
    return { geometry, offset: center, radius: geometry.boundingSphere.radius };
}

/* ------------------------------------------------------------------------- */
/* Melt: puffy "liquid chrome sticker" shapes (refs 13-15)                    */
/* ------------------------------------------------------------------------- */

/**
 * A piece is a 2D signed-distance field built as a smooth union of tapered
 * capsules (body, branching arms with bulb ends, downward drips), optionally
 * with holes, then inflated into a pillowy front/back surface with rounded rims.
 */
function capsuleDistance(px, py, c) {
    const bx = c.bx - c.ax;
    const by = c.by - c.ay;
    const lengthSq = bx * bx + by * by || 1e-9;
    const t = Math.min(1, Math.max(0, ((px - c.ax) * bx + (py - c.ay) * by) / lengthSq));
    const dx = px - (c.ax + bx * t);
    const dy = py - (c.ay + by * t);
    return Math.hypot(dx, dy) - (c.ra + (c.rb - c.ra) * t);
}

function smoothUnion(a, b, k) {
    const h = Math.max(k - Math.abs(a - b), 0) / k;
    return Math.min(a, b) - h * h * k * 0.25;
}

function smoothSubtract(a, b, k) {
    const h = Math.max(k - Math.abs(-b - a), 0) / k;
    return Math.max(a, -b) + h * h * k * 0.25;
}

function createField(capsules, holes) {
    return (x, y) => {
        let d = Infinity;
        for (const c of capsules) d = d === Infinity ? capsuleDistance(x, y, c) : smoothUnion(d, capsuleDistance(x, y, c), 0.14);
        for (const h of holes) d = smoothSubtract(d, Math.hypot(x - h.x, y - h.y) - h.r, 0.06);
        return d;
    };
}

/** A curved, tapering chain of capsules ending in a round bulb. */
function addArm(capsules, start, angle, length, startRadius, bulb, bend, random) {
    const links = 4;
    let x = start[0];
    let y = start[1];
    let a = angle;
    let r = startRadius;
    for (let i = 0; i < links; i += 1) {
        a += bend * (0.5 + random() * 0.5);
        const nx = x + Math.cos(a) * (length / links);
        const ny = y + Math.sin(a) * (length / links);
        const nr = startRadius * (1 - 0.55 * ((i + 1) / links)) * (0.85 + random() * 0.3);
        capsules.push({ ax: x, ay: y, bx: nx, by: ny, ra: r, rb: nr });
        x = nx;
        y = ny;
        r = nr;
    }
    if (bulb > 0) capsules.push({ ax: x, ay: y, bx: x, by: y, ra: r + bulb, rb: r + bulb });
    return [x, y];
}

const MELT_TYPES = ["bean", "comma", "boomerang", "pebble", "drip", "splat", "squiggle"];

/** Builds the capsule list for one piece of a given type. */
function meltPrimitives(type, settings, random) {
    const { armLength, arms, bulbs, drips, holes, holeSize, irregularity } = settings;
    const capsules = [];
    const wobble = () => 1 + irregularity * (random() - 0.5) * 0.6;
    const bulb = (r) => r * (0.15 + 0.9 * bulbs) * (0.7 + random() * 0.6);
    let bodyRadius = 0.32;
    let center = [0, 0];
    if (type === "pebble") {
        for (let i = 0; i < 3; i += 1) {
            const a = random() * Math.PI * 2;
            capsules.push({ ax: Math.cos(a) * 0.12, ay: Math.sin(a) * 0.1, bx: 0, by: 0, ra: 0.3 * wobble(), rb: 0.34 * wobble() });
        }
        bodyRadius = 0.36;
    }
    else if (type === "boomerang") {
        const spread = 0.9 + random() * 0.6;
        const tilt = -Math.PI / 2 + (random() - 0.5) * 0.8;
        addArm(capsules, [0, 0], tilt + Math.PI / 2 + spread / 2, 0.75 * (0.7 + armLength), 0.24 * wobble(), bulb(0.12), 0.08, random);
        addArm(capsules, [0, 0], tilt + Math.PI / 2 - spread / 2 + Math.PI, 0.75 * (0.7 + armLength), 0.24 * wobble(), bulb(0.12), -0.08, random);
        bodyRadius = 0.24;
    }
    else if (type === "comma" || type === "squiggle") {
        const head = 0.26 * wobble();
        capsules.push({ ax: 0, ay: 0, bx: 0.08, by: 0.04, ra: head, rb: head * 0.95 });
        const bend = type === "comma" ? 0.35 : 0.55;
        const tail = addArm(capsules, [0.05, 0], -0.4 + random() * 0.4, 0.9 * (0.6 + armLength), head * 0.85, type === "squiggle" ? bulb(0.1) : 0, bend, random);
        if (type === "squiggle") addArm(capsules, tail, -1.2, 0.5 * (0.6 + armLength), head * 0.4, bulb(0.1), -0.7, random);
        bodyRadius = head;
    }
    else {
        // bean, drip and splat share a kidney-shaped body.
        const span = 0.28 + random() * 0.2;
        const curve = (random() - 0.5) * 0.3;
        capsules.push({ ax: -span, ay: curve, bx: 0, by: 0, ra: 0.27 * wobble(), rb: 0.33 * wobble() });
        capsules.push({ ax: 0, ay: 0, bx: span, by: -curve * 0.6, ra: 0.33 * wobble(), rb: 0.25 * wobble() });
        center = [0, 0];
    }
    // Branching arms (splats) radiate from the body and end in round bulbs.
    const armCount = type === "splat" ? Math.max(arms, 3) : type === "bean" || type === "drip" ? arms : 0;
    for (let i = 0; i < armCount; i += 1) {
        const angle = (i / Math.max(1, armCount)) * Math.PI * 2 + random() * 0.9;
        const from = [center[0] + Math.cos(angle) * bodyRadius * 0.6, center[1] + Math.sin(angle) * bodyRadius * 0.6];
        addArm(capsules, from, angle, armLength * (0.5 + random() * 0.7), bodyRadius * (0.45 + random() * 0.2), bulb(0.1), (random() - 0.5) * 0.7, random);
    }
    // Drips hang downward with a narrowing neck and a round drop end.
    const dripCount = type === "drip" ? Math.max(drips, 2) : type === "bean" || type === "splat" ? drips : 0;
    for (let i = 0; i < dripCount; i += 1) {
        const x = (dripCount === 1 ? 0 : (i / (dripCount - 1) - 0.5) * 0.85) + (random() - 0.5) * 0.1;
        addArm(capsules, [x, -bodyRadius * 0.3], -Math.PI / 2 + (random() - 0.5) * 0.25, armLength * (0.45 + random() * 0.7), bodyRadius * (0.26 + random() * 0.12), bulb(0.1) + 0.035, (random() - 0.5) * 0.1, random);
    }
    const holeList = [];
    for (let i = 0; i < holes; i += 1) {
        holeList.push({ r: 0.06 + 0.1 * holeSize, x: (i - (holes - 1) / 2) * 0.28, y: 0.02 });
    }
    return { capsules, holes: holeList };
}

/** Inflates a 2D field into a closed pillowy mesh (front + mirrored back). */
/** Separable running-box blur (three passes approximate a gaussian). */
function blurGrid(values, nx, ny, radius) {
    if (radius < 1) return values;
    const w = nx + 1;
    const h = ny + 1;
    let src = values;
    for (let pass = 0; pass < 3; pass += 1) {
        const tmp = new Array(src.length).fill(0);
        for (let j = 0; j < h; j += 1) {
            for (let i = 0; i < w; i += 1) {
                let sum = 0;
                let count = 0;
                for (let k = Math.max(0, i - radius); k <= Math.min(w - 1, i + radius); k += 1) {
                    sum += src[j * w + k];
                    count += 1;
                }
                tmp[j * w + i] = sum / count;
            }
        }
        const next = new Array(src.length).fill(0);
        for (let i = 0; i < w; i += 1) {
            for (let j = 0; j < h; j += 1) {
                let sum = 0;
                let count = 0;
                for (let k = Math.max(0, j - radius); k <= Math.min(h - 1, j + radius); k += 1) {
                    sum += tmp[k * w + i];
                    count += 1;
                }
                next[j * w + i] = sum / count;
            }
        }
        src = next;
    }
    return src;
}

function smoothstep(a, b, x) {
    const t = Math.min(1, Math.max(0, (x - a) / (b - a)));
    return t * t * (3 - 2 * t);
}

function inflateField(field, bounds, cell, puff, out, smoothing) {
    const [minX, minY, maxX, maxY] = bounds;
    const nx = Math.max(8, Math.ceil((maxX - minX) / cell));
    const ny = Math.max(8, Math.ceil((maxY - minY) / cell));
    const w = nx + 1;
    // Pillow profile: a round vertical rim plus a dome. The dome is blurred on
    // the grid so the distance field's medial creases never reach the surface.
    const k = 0.14;
    const rimHeight = (inside) => 0.2 * Math.sqrt(1 - Math.exp((-3 * inside) / k));
    const xs = [];
    const ys = [];
    const ds = [];
    const dome = [];
    for (let j = 0; j <= ny; j += 1) {
        for (let i = 0; i <= nx; i += 1) {
            const x = minX + (i / nx) * (maxX - minX);
            const y = minY + (j / ny) * (maxY - minY);
            const d = field(x, y);
            const inside = Math.max(0, -d);
            xs.push(x);
            ys.push(y);
            ds.push(d);
            dome.push((0.3 * inside * inside) / (inside + 0.12));
        }
    }
    const smoothDome = blurGrid(dome, nx, ny, Math.round(smoothing / cell));
    const heights = ds.map((d, index) => {
        const inside = Math.max(0, -d);
        return inside > 0 ? puff * (rimHeight(inside) + smoothDome[index] * smoothstep(0, 0.1, inside)) : 0;
    });
    const grid = [];
    for (let index = 0; index < ds.length; index += 1) {
        let x = xs[index];
        let y = ys[index];
        const d = ds[index];
        const e = cell * 0.5;
        const gx = (field(x + e, y) - field(x - e, y)) / (2 * e);
        const gy = (field(x, y + e) - field(x, y - e)) / (2 * e);
        const g = Math.hypot(gx, gy) || 1;
        if (d >= 0 && d < cell * 1.5) {
            // Snap near-outside vertices onto the contour for a clean silhouette.
            x -= (gx / g) * d;
            y -= (gy / g) * d;
            grid.push({ gx: gx / g, gy: gy / g, h: 0, index, rim: true, use: true, x, y });
            continue;
        }
        grid.push({ gx: gx / g, gy: gy / g, h: heights[index], index, rim: false, use: d < 0, x, y });
    }
    const heightAt = (i, j) => heights[Math.min(ny, Math.max(0, j)) * w + Math.min(nx, Math.max(0, i))];
    const normalAt = (v, side) => {
        const inside = Math.max(0, -ds[v.index]);
        const rimNormal = [v.gx, v.gy, 0];
        if (v.rim) return rimNormal;
        const i = v.index % w;
        const j = Math.floor(v.index / w);
        const hx = (heightAt(i + 1, j) - heightAt(i - 1, j)) / (2 * cell);
        const hy = (heightAt(i, j + 1) - heightAt(i, j - 1)) / (2 * cell);
        const len = Math.hypot(hx, hy, 1);
        const top = [-hx / len, -hy / len, side / len];
        // Within the first cells of the rim the grid slope is unreliable;
        // blend toward the analytic outward normal there.
        const t = smoothstep(0, cell * 3, inside);
        const n = [rimNormal[0] * (1 - t) + top[0] * t, rimNormal[1] * (1 - t) + top[1] * t, top[2] * t];
        const nl = Math.hypot(n[0], n[1], n[2]) || 1;
        return [n[0] / nl, n[1] / nl, n[2] / nl];
    };
    for (const side of [1, -1]) {
        const base = out.positions.length / 3;
        for (const v of grid) {
            out.positions.push(v.x, v.y, side * v.h);
            const n = normalAt(v, side);
            out.normals.push(n[0], n[1], n[2]);
        }
        for (let j = 0; j < ny; j += 1) {
            for (let i = 0; i < nx; i += 1) {
                const a = j * w + i;
                const b = a + 1;
                const c = a + w;
                const d = c + 1;
                for (const [p, q, r] of [[a, b, d], [a, d, c]]) {
                    if (!grid[p].use || !grid[q].use || !grid[r].use) continue;
                    if (grid[p].rim && grid[q].rim && grid[r].rim) continue;
                    if (side === 1) out.indices.push(base + p, base + q, base + r);
                    else out.indices.push(base + p, base + r, base + q);
                }
            }
        }
    }
}

function scatterLayout(pieces, random) {
    if (pieces === 1) return [{ rotation: 0, scale: 1, type: null, x: 0, y: 0 }];
    // Varied sizes over the whole frame with breathing room (refs 13 and 15).
    const scales = [];
    for (let i = 0; i < pieces; i += 1) {
        scales.push(i === 0 ? 1.25 : i < 3 ? 0.8 + random() * 0.2 : i === pieces - 1 ? 0.14 : 0.4 + 0.3 * random());
    }
    const width = 4.6;
    const height = 2.6;
    const placed = [];
    for (let i = 0; i < pieces; i += 1) {
        const scale = scales[i];
        const radius = 0.62 * scale;
        let best = null;
        let bestGap = -Infinity;
        for (let attempt = 0; attempt < 120; attempt += 1) {
            const x = (random() - 0.5) * width;
            const y = (random() - 0.5) * height;
            let gap = Infinity;
            for (const other of placed) {
                gap = Math.min(gap, Math.hypot(x - other.x, y - other.y) - (radius + other.radius));
            }
            if (gap > bestGap) {
                bestGap = gap;
                best = { x, y };
            }
            if (gap > 0.16) break;
        }
        const type = scale < 0.15 ? "droplet" : MELT_TYPES[Math.floor(random() * MELT_TYPES.length)];
        placed.push({ radius, rotation: type === "drip" ? 0 : (random() - 0.5) * Math.PI * 1.2, scale, type, x: best.x, y: best.y });
    }
    return placed;
}

/**
 * Builds 1-12 puffy abstract melt pieces. A single piece follows the controls
 * (a kidney body with arms, bulbs and drips); scattered pieces each pick their
 * own shape type (bean, comma, boomerang, pebble, drip, splat, squiggle).
 */
export function buildMeltGeometry({ armLength, arms, bulbs, drips, holeSize, holes, irregularity, pieces, seed, thickness }) {
    const random = createRandom(seed * 97 + 13);
    const layout = scatterLayout(pieces, random);
    const out = { indices: [], normals: [], positions: [] };
    for (const place of layout) {
        const type = place.type ?? (drips > 0 && arms === 0 ? "drip" : arms >= 3 ? "splat" : "bean");
        const single = pieces === 1;
        const settings = {
            armLength,
            arms: single ? arms : Math.round(arms * random()),
            bulbs,
            drips: single ? drips : Math.round(drips * random()),
            holeSize,
            holes: single || random() < 0.25 ? holes : 0,
            irregularity,
        };
        const primitives = type === "droplet"
            ? { capsules: [{ ax: 0, ay: 0, bx: 0, by: 0, ra: 0.3, rb: 0.3 }], holes: [] }
            : meltPrimitives(type, settings, random);
        const cos = Math.cos(place.rotation);
        const sin = Math.sin(place.rotation);
        const capsules = primitives.capsules.map((c) => ({
            ax: (c.ax * cos - c.ay * sin) * place.scale + place.x,
            ay: (c.ax * sin + c.ay * cos) * place.scale + place.y,
            bx: (c.bx * cos - c.by * sin) * place.scale + place.x,
            by: (c.bx * sin + c.by * cos) * place.scale + place.y,
            ra: c.ra * place.scale,
            rb: c.rb * place.scale,
        }));
        const holesPlaced = primitives.holes.map((h) => ({
            r: h.r * place.scale,
            x: (h.x * cos - h.y * sin) * place.scale + place.x,
            y: (h.x * sin + h.y * cos) * place.scale + place.y,
        }));
        let minX = Infinity;
        let minY = Infinity;
        let maxX = -Infinity;
        let maxY = -Infinity;
        for (const c of capsules) {
            const r = Math.max(c.ra, c.rb) + 0.05;
            minX = Math.min(minX, c.ax - r, c.bx - r);
            maxX = Math.max(maxX, c.ax + r, c.bx + r);
            minY = Math.min(minY, c.ay - r, c.by - r);
            maxY = Math.max(maxY, c.ay + r, c.by + r);
        }
        const cell = single ? 0.01 : Math.max(0.009, 0.016 * place.scale + 0.005);
        inflateField(createField(capsules, holesPlaced), [minX, minY, maxX, maxY], cell, thickness * place.scale ** 0.25, out, 0.07 * Math.sqrt(place.scale));
    }
    return finishGeometry(new Float32Array(out.positions), new Float32Array(out.normals), new Uint32Array(out.indices));
}

/* ------------------------------------------------------------------------- */
/* Thorns                                                                     */
/* ------------------------------------------------------------------------- */


const STROKE_SAMPLES = 280;

/**
 * Integrates a planar stroke whose curvature varies continuously (long S and C
 * sweeps) and curls into hooks at both ends, then bends it gently out of plane.
 */
function sweepCurve({ start, heading, length, curl, random }) {
    const k1 = (random() < 0.5 ? -1 : 1) * (0.45 + random() * 0.5);
    const k2 = (random() - 0.5) * 0.9;
    const bends = 1.6 + random() * 1.2;
    const phase = random() * Math.PI * 2;
    const hookEnd = (random() < 0.5 ? -1 : 1) * (2.5 + 3 * random());
    const hookStart = (random() < 0.5 ? -1 : 1) * (1.5 + 2.5 * random());
    const lift = (random() - 0.5) * 0.6;
    const points = [];
    let angle = heading;
    let x = start[0];
    let y = start[1];
    const step = length / (STROKE_SAMPLES - 1);
    for (let i = 0; i < STROKE_SAMPLES; i += 1) {
        const t = i / (STROKE_SAMPLES - 1);
        points.push([x, y, start[2] + lift * Math.sin(Math.PI * t) * length * 0.3]);
        // Several S-bends and loops along a long, continuous ribbon.
        const sweep = k1 * Math.sin(Math.PI * t * bends + phase) + k2 * Math.cos(Math.PI * t * bends * 0.53 + phase * 0.7);
        const hooks = hookEnd * Math.pow(Math.max(0, (t - 0.7) / 0.3), 2) + hookStart * Math.pow(Math.max(0, (0.22 - t) / 0.22), 2);
        angle += (sweep * (0.6 + curl * 1.2) + hooks * (0.4 + curl)) * step;
        x += Math.cos(angle) * step;
        y += Math.sin(angle) * step;
    }
    return points;
}

/** Burst: long tribal strokes radiating from an off-centre point. */
function burstStroke(index, strokes, options, random, origin) {
    const spread = (index / strokes) * Math.PI * 2 + (random() - 0.5) * 0.9;
    const startOffset = 0.15 + random() * 0.35;
    const length = options.length * (4.2 + random() * 2.2);
    return sweepCurve({
        curl: options.curl,
        heading: spread + (random() - 0.5) * 0.8,
        length,
        random,
        start: [origin[0] + Math.cos(spread) * startOffset, origin[1] + Math.sin(spread) * startOffset, (random() - 0.5) * 0.4],
    });
}

/**
 * Swirl: each stroke is one continuous ribbon looping 1-1.5 turns around an
 * open vertical centre while it undulates up and down and in and out, so the
 * strokes cross in front of and behind each other as one cohesive swirl.
 */
function swirlStroke(index, strokes, options, random) {
    const radius = 1.0 + random() * 0.45;
    const height = 2.6 * options.length;
    const turns = (1 + random() * 0.5 + options.curl * 0.3) * (index % 2 === 0 ? 1 : -1);
    const theta0 = (index / strokes) * Math.PI * 2 + random() * 0.8;
    const y0 = (random() - 0.5) * height * 0.35;
    const rise = (random() < 0.5 ? -1 : 1) * height * (0.35 + random() * 0.35);
    const wave = 0.25 + random() * 0.35;
    const waves = 1.5 + random() * 1.5;
    const phase = random() * Math.PI * 2;
    // A side stream (seeded from values already drawn) so the shared random
    // sequence, and therefore Thorn Burst, stays unchanged.
    const side = createRandom(Math.floor(phase * 1e6) + index * 7919);
    const cx = (side() - 0.5) * 0.7;
    const cy = (side() - 0.5) * 0.5;
    const squash = 0.7 + side() * 0.6;
    const tilt = (side() - 0.5) * 1.2;
    const drift = (side() < 0.5 ? -1 : 1) * (0.6 + side() * 0.8);
    const points = [];
    for (let i = 0; i < STROKE_SAMPLES; i += 1) {
        const t = i / (STROKE_SAMPLES - 1);
        const sc = options.scribble;
        const theta = theta0 + turns * Math.PI * 2 * t + (0.35 + 0.25 * sc) * Math.sin(Math.PI * 2 * t * waves + phase);
        // Ends flick outward into hooks.
        const flick = options.curl * 0.7 * (Math.pow(Math.max(0, (t - 0.85) / 0.15), 2) + Math.pow(Math.max(0, (0.12 - t) / 0.12), 2));
        const r = radius * (1 + 0.32 * Math.sin(Math.PI * 2 * t * (waves * 0.7) + phase * 1.3)) + flick;
        // Loops face the camera (around z) so the open centre stays visible;
        // depth undulates so strokes weave in front of and behind each other.
        const z = (y0 + rise * (t - 0.5)) * 0.25 + wave * Math.sin(Math.PI * 2 * t * waves + phase);
        // Scribble 0: thick loops around the open centre (Thorn Swirl).
        // Scribble 1: elliptical, tilted loops drifting vertically (Thorn Scribble).
        const lx = Math.cos(theta) * r * 1.15;
        const ly = Math.sin(theta) * r * 0.9;
        const ex = Math.cos(theta) * r * 1.1;
        const ey = Math.sin(theta) * r * squash * 1.15;
        const sx = cx + ex * Math.cos(tilt) - ey * Math.sin(tilt);
        const sy = cy + ex * Math.sin(tilt) + ey * Math.cos(tilt) + drift * (t - 0.5) + 0.25 * Math.sin(Math.PI * 3 * t + phase);
        points.push([lx + (sx - lx) * sc, ly + (sy - ly) * sc, z]);
    }
    return points;
}

/** One main stroke: a blend of the burst sweep and the column swirl. */
function strokePath(index, strokes, options, random, origin) {
    const burst = burstStroke(index, strokes, options, random, origin);
    const swirl = swirlStroke(index, strokes, options, random);
    const w = options.wrap;
    return burst.map((p, i) => new Vector3(
        p[0] + (swirl[i][0] - p[0]) * w,
        p[1] + (swirl[i][1] - p[1]) * w,
        p[2] + (swirl[i][2] - p[2]) * w,
    ));
}

/** Parallel-transport frames along a polyline. */
function frames(points) {
    const tangents = points.map((p, i) => {
        const a = points[Math.max(0, i - 1)];
        const b = points[Math.min(points.length - 1, i + 1)];
        return b.clone().sub(a).normalize();
    });
    const helper = Math.abs(tangents[0].y) < 0.9 ? new Vector3(0, 1, 0) : new Vector3(1, 0, 0);
    let normal = new Vector3().crossVectors(tangents[0], helper).normalize();
    const normals = [];
    const binormals = [];
    for (let i = 0; i < points.length; i += 1) {
        if (i > 0) {
            const axis = new Vector3().crossVectors(tangents[i - 1], tangents[i]);
            const s = axis.length();
            if (s > 1e-6) {
                const angle = Math.acos(Math.min(1, Math.max(-1, tangents[i - 1].dot(tangents[i]))));
                normal.applyAxisAngle(axis.divideScalar(s), angle);
            }
        }
        normals.push(normal.clone());
        binormals.push(new Vector3().crossVectors(tangents[i], normal).normalize());
    }
    return { binormals, normals, tangents };
}

/**
 * Sweeps a circular (or, with `flatten`, elliptical) cross-section along
 * `points`. `flatten.dirs[i]` is squashed by `flatten.factor`, giving a ribbon.
 */
function appendTube(target, points, radii, radialSegments, flatten = null) {
    const { binormals, normals } = frames(points);
    const start = target.positions.length / 3;
    for (let i = 0; i < points.length; i += 1) {
        for (let j = 0; j <= radialSegments; j += 1) {
            const a = (j / radialSegments) * Math.PI * 2;
            const n = normals[i].clone().multiplyScalar(Math.cos(a)).addScaledVector(binormals[i], Math.sin(a));
            let offset = n;
            let normal = n;
            if (flatten) {
                const d = flatten.dirs[i];
                const along = n.dot(d);
                offset = n.clone().addScaledVector(d, along * (flatten.factor - 1));
                normal = n.clone().addScaledVector(d, along * (1 / flatten.factor - 1)).normalize();
            }
            const p = points[i].clone().addScaledVector(offset, radii[i]);
            target.positions.push(p.x, p.y, p.z);
            target.normals.push(normal.x, normal.y, normal.z);
        }
    }
    const ring = radialSegments + 1;
    for (let i = 0; i < points.length - 1; i += 1) {
        for (let j = 0; j < radialSegments; j += 1) {
            const a = start + i * ring + j;
            const b = start + (i + 1) * ring + j;
            // Counter-clockwise seen from outside so front faces point outward.
            target.indices.push(a, a + 1, b, b, a + 1, b + 1);
        }
    }
}

/** Thick in the middle, needle-sharp at both ends (concave taper). */
function thornRadius(t, thickness, sharpness, belly, skew, swells) {
    const shifted = Math.pow(t, skew);
    const body = Math.sin(Math.PI * shifted);
    let profile = 1;
    if (swells) {
        // Thin for most of the length, swelling only in short sections.
        profile = swells.base;
        for (const swell of swells.at) {
            profile += swell.size * Math.exp(-Math.pow((t - swell.t) / swell.width, 2));
        }
    }
    return thickness * belly * profile * Math.pow(Math.max(body, 0), 0.7 + 0.9 * sharpness);
}

/**
 * Builds swirling tendrils with sharp tips and optional side thorns.
 * Returns stroke tips so droplets can float near them.
 */
export function buildThornGeometry({ curl, length, scribble = 0, seed, sharpness, sideThorns, strokes, thickness, wrap }) {
    const random = createRandom(seed * 131 + 7);
    const target = { indices: [], normals: [], positions: [] };
    const tips = [];
    const options = { curl, length, scribble, wrap };
    // Scribble styling only shows on wrapped (swirl) strokes.
    const thin = wrap * scribble;
    const origin = [(random() - 0.5) * 0.9, (random() - 0.5) * 0.6];
    for (let s = 0; s < strokes; s += 1) {
        const points = strokePath(s, strokes, options, random, origin);
        const belly = 0.8 + random() * 0.5;
        const skew = 0.75 + random() * 0.5;
        const body = thickness * (1.7 - 0.65 * wrap);
        // Swell randoms come from a side stream so Burst and Swirl keep their shapes.
        const swellRandom = createRandom(seed * 977 + s * 31 + 1);
        const swellCount = 2 + Math.floor(swellRandom() * 2);
        const swellList = [];
        for (let k = 0; k < swellCount; k += 1) {
            swellList.push({ size: (0.55 + swellRandom() * 0.6) * thin, t: 0.15 + 0.7 * ((k + swellRandom()) / swellCount), width: 0.05 + swellRandom() * 0.05 });
        }
        // Scribble strokes blend toward a thin line with short swells.
        const swells = thin > 0 ? { at: swellList, base: 1 - 0.68 * thin } : null;
        const radii = points.map((_, i) => thornRadius(i / (points.length - 1), body, sharpness, belly, skew, swells));
        appendTube(target, points, radii, 18);
        tips.push(points[points.length - 1].clone(), points[0].clone());
        // Rose-thorn barbs: curved, swept back along the stroke, several sizes.
        const { tangents } = frames(points);
        const sideCount = Math.round(sideThorns * (5 + random() * 4) * (1 + 0.8 * thin));
        let side = random() < 0.5 ? -1 : 1;
        for (let k = 0; k < sideCount; k += 1) {
            const t0 = 0.2 + 0.62 * ((k + 0.3 + random() * 0.4) / Math.max(1, sideCount));
            const at = Math.floor(t0 * (points.length - 1));
            const tangent = tangents[at];
            // Sideways in the stroke's own plane (or along the column surface).
            const planeNormal = new Vector3(0, 0, 1);
            const lateral = new Vector3().crossVectors(planeNormal, tangent).normalize().multiplyScalar(side);
            side = -side;
            const angle = (30 + 25 * random()) * (Math.PI / 180);
            const heading = tangent.clone().multiplyScalar(Math.cos(angle)).addScaledVector(lateral, Math.sin(angle)).normalize();
            const thornLength = length * (0.45 + 0.55 * random()) * (0.5 + sideThorns * 0.7);
            const samples = 40;
            const thorn = [];
            // Start slightly inside the stroke so the barb grows out of it.
            const position = points[at].clone().addScaledVector(lateral, -radii[at] * 0.35);
            const bendSign = random() < 0.5 ? 1 : -1;
            for (let i = 0; i < samples; i += 1) {
                thorn.push(position.clone());
                // Curve back toward the stroke direction, then flick outward.
                heading.lerp(tangent, 0.035).addScaledVector(lateral, 0.01 * bendSign).normalize();
                position.addScaledVector(heading, thornLength / samples);
            }
            const baseRadius = Math.max(radii[at] * 0.7, body * (0.4 - 0.15 * thin));
            const thornRadii = thorn.map((_, i) => {
                const t = i / (samples - 1);
                return baseRadius * Math.pow(1 - t, 0.9 + 0.8 * sharpness);
            });
            appendTube(target, thorn, thornRadii, 12);
            tips.push(thorn[thorn.length - 1].clone());
        }
    }
    const result = finishGeometry(
        new Float32Array(target.positions),
        new Float32Array(target.normals),
        new Uint32Array(target.indices),
    );
    // finishGeometry recentred the mesh; recentre the tips the same way.
    for (const tip of tips) tip.sub(result.offset);
    return { ...result, tips };
}

/* ------------------------------------------------------------------------- */
/* Wrap: tribal tendrils stacked around an open vertical centre (ref 16/12)   */
/* ------------------------------------------------------------------------- */

const WRAP_SAMPLES = 220;

/** Radius profile with a round drop at the end (t in [0,1]); 0 past the drop. */
function withDrop(t, radius, dropRadius, dropSpan) {
    const start = 1 - dropSpan;
    if (t < start - dropSpan) return radius;
    const u = (t - start) / dropSpan;
    const drop = u > -1 ? dropRadius * Math.sqrt(Math.max(0, 1 - u * u)) : 0;
    return t >= 0.999 ? 0 : Math.max(radius, drop);
}

/**
 * Large tribal hook growing out of a stroke: fat base, sweeping outward and
 * upward like a flame, curling back at the tip; some end in a round drop.
 */
function wrapBarb(origin, tangent, radial, length, baseRadius, random) {
    const up = new Vector3(0, 1, 0);
    const lift = random() < 0.75 ? 1 : -1;
    const outward = radial.clone().multiplyScalar(0.9).addScaledVector(up, 0.7 * lift).normalize();
    const angle = (40 + 25 * random()) * (Math.PI / 180);
    const heading = tangent.clone().multiplyScalar(Math.cos(angle)).addScaledVector(outward, Math.sin(angle)).normalize();
    const samples = 48;
    const position = origin.clone();
    const path = [];
    for (let i = 0; i < samples; i += 1) {
        path.push(position.clone());
        const t = i / (samples - 1);
        // Flame sweep: bend toward the outward/up direction, hook back at the tip.
        heading.lerp(t < 0.7 ? outward : tangent, t < 0.7 ? 0.035 : 0.09).normalize();
        position.addScaledVector(heading, length / samples);
    }
    const drop = random() < 0.35;
    const radii = path.map((_, i) => {
        const t = i / (samples - 1);
        const body = baseRadius * Math.pow(1 - t, 1.35);
        return drop ? withDrop(t, body, baseRadius * 0.38, 0.07) : body;
    });
    return { path, radii };
}

/** A drip hanging from a stroke: thin neck, round drop end. */
function wrapDrip(origin, length, neck, bulb) {
    const samples = 40;
    const path = [];
    const radii = [];
    for (let i = 0; i < samples; i += 1) {
        const t = i / (samples - 1);
        path.push(new Vector3(origin.x * (1 + 0.04 * t), origin.y - length * t, origin.z * (1 + 0.04 * t)));
        radii.push(withDrop(t, neck * (1 - 0.5 * Math.sqrt(t)), bulb, Math.min(0.45, bulb / length)));
    }
    return { path, radii };
}

/**
 * One continuous climbing structure: a helix around the vertical axis split
 * into overlapping strokes (one per tier), so each stroke's tail flows past
 * the next tier's head. Strokes have fat muscular bodies with big swells,
 * long whip tails that leave the column (some ending in drops), large flame
 * hooks and drips. The axis stays at x=z=0 so a subject sits inside it.
 */
export function buildWrapGeometry({ barbs, drips, gap, height, radius, seed, thickness, tiers, turns }) {
    const random = createRandom(seed * 173 + 11);
    const target = { indices: [], normals: [], positions: [] };
    const tips = [];
    const strokes = [];
    const sweep = turns * Math.PI * 2;
    const step = sweep * 0.72; // 28% overlap between consecutive strokes
    const totalAngle = step * (tiers - 1) + sweep;
    const theta0 = random() * Math.PI * 2;
    const climb = height / totalAngle;
    for (let k = 0; k < tiers; k += 1) {
        const start = step * k;
        const amp = (height / tiers) * (0.12 + 0.12 * random());
        const waves = 1 + random() * 0.8;
        const phase = random() * Math.PI * 2;
        const phase2 = random() * Math.PI * 2;
        const hookA = (random() < 0.35 ? -1 : 1) * (height / tiers) * (0.3 + 0.4 * random());
        const hookB = (random() < 0.3 ? -1 : 1) * (height / tiers) * (0.35 + 0.45 * random());
        const flickA = radius * (0.35 + 0.45 * random());
        const flickB = radius * (0.55 + 0.6 * random());
        const points = [];
        for (let i = 0; i < WRAP_SAMPLES; i += 1) {
            const t = i / (WRAP_SAMPLES - 1);
            const angle = start + sweep * t;
            const theta = theta0 + angle;
            const swing = 0.72 + 0.28 * Math.sin(Math.PI * 2 * t * waves * 0.7 + phase2);
            const endA = Math.pow(Math.max(0, (0.18 - t) / 0.18), 2);
            const endB = Math.pow(Math.max(0, (t - 0.78) / 0.22), 2);
            // Whip tails leave the column and flick up or down.
            const r = radius * (gap + (1 - gap) * swing) + flickA * endA + flickB * endB;
            const y = -height / 2 + climb * angle + amp * Math.sin(Math.PI * 2 * t * waves + phase) + hookA * endA + hookB * endB;
            points.push(new Vector3(Math.cos(theta) * r, y, Math.sin(theta) * r));
        }
        strokes.push(points);
    }
    for (let k = 0; k < strokes.length; k += 1) {
        const points = strokes[k];
        // Fat body narrowing into long whip tails, with big swells at the turns.
        const swells = [];
        const swellCount = 2 + Math.floor(random() * 2);
        for (let j = 0; j < swellCount; j += 1) {
            swells.push({ size: 0.45 + random() * 0.5, t: 0.22 + 0.5 * ((j + random()) / swellCount), width: 0.07 + random() * 0.06 });
        }
        const dropTail = random() < 0.4;
        const radii = points.map((_, i) => {
            const t = i / (points.length - 1);
            let profile = 0.75;
            for (const swell of swells) profile += swell.size * Math.exp(-Math.pow((t - swell.t) / swell.width, 2));
            const body = thickness * profile * Math.pow(Math.max(0, Math.sin(Math.PI * t)), 1.25);
            return dropTail ? withDrop(t, body, thickness * 0.4, 0.035) : body;
        });
        const radial = points.map((p) => new Vector3(p.x, 0, p.z).normalize());
        appendTube(target, points, radii, 20, { dirs: radial, factor: 0.62 });
        tips.push(points[0].clone(), points[points.length - 1].clone());
        const { tangents } = frames(points);
        const barbCount = Math.max(0, Math.round(barbs * (2 + random() * 2.5)));
        for (let b = 0; b < barbCount; b += 1) {
            const t0 = 0.22 + 0.56 * ((b + 0.2 + random() * 0.6) / Math.max(1, barbCount));
            const at = Math.floor(t0 * (points.length - 1));
            const length = radius * (0.7 + 0.9 * random()) * (0.6 + 0.6 * barbs);
            const base = radii[at] * (0.6 + 0.2 * random());
            const origin = points[at].clone().addScaledVector(radial[at], radii[at] * 0.2);
            const barb = wrapBarb(origin, tangents[at], radial[at], length, base, random);
            appendTube(target, barb.path, barb.radii, 14);
            tips.push(barb.path[barb.path.length - 1].clone());
        }
    }
    for (let d = 0; d < drips; d += 1) {
        const stroke = strokes[Math.floor(random() * strokes.length)];
        const at = Math.floor((0.3 + 0.4 * random()) * (stroke.length - 1));
        const length = (height / tiers) * (0.35 + 0.4 * random());
        const drip = wrapDrip(stroke[at], length, thickness * 0.4, thickness * (0.38 + 0.12 * random()));
        appendTube(target, drip.path, drip.radii, 20);
    }
    const geometry = new BufferGeometry();
    geometry.setAttribute("position", new BufferAttribute(new Float32Array(target.positions), 3));
    geometry.setAttribute("normal", new BufferAttribute(new Float32Array(target.normals), 3));
    geometry.setIndex(new BufferAttribute(new Uint32Array(target.indices), 1));
    // Recentre vertically only: the axis must stay where the subject sits.
    geometry.computeBoundingBox();
    const offset = new Vector3(0, (geometry.boundingBox.min.y + geometry.boundingBox.max.y) / 2, 0);
    geometry.translate(0, -offset.y, 0);
    geometry.computeBoundingBox();
    geometry.computeBoundingSphere();
    for (const tip of tips) tip.sub(offset);
    return { geometry, offset, radius: geometry.boundingSphere.radius, tips };
}
