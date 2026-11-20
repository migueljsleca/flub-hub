// Three.js scene for Ferrofluid Lab. Authored as JS with ferro-scene.d.ts and
// imports Three through ./three-untyped so the Toolcraft source-boundary type
// walker never traverses the recursive Object3D type graph (the walker
// overflows the stack on Object3D.children: Object3D[]).
import { ACESFilmicToneMapping, BackSide, BoxGeometry, BufferAttribute, BufferGeometry, CanvasTexture, Color, DataTexture, RGBAFormat, DoubleSide, Group, InstancedMesh, Matrix4, Mesh, MeshBasicMaterial, MeshPhysicalMaterial, PerspectiveCamera, Plane, PlaneGeometry, PMREMGenerator, Quaternion, Scene, SphereGeometry, SRGBColorSpace, Vector3, WebGLRenderer, } from "./three-untyped";
import { FERRO_MAX_LOBES, ferroBeginNormal, ferroBeginVertex, ferroFragmentClip, ferroFragmentFilm, ferroFragmentGrain, ferroFragmentPars, ferroFragmentSatin, ferroShapeBeginVertex, ferroVertexPars, } from "./ferro-shader";
import { FERRO_BASE_SHAPE_INDEX } from "./ferro-base-shape";
import { buildMeltGeometry, buildThornGeometry, buildWrapGeometry } from "./ferro-shapes";
import { FERRO_FRAME_FILL, getFerroBlobCamera, getFerroDroplets, getFerroExtentRadius, getFerroPoolHeight, getFerroSurfaceState, } from "./ferro-bounds";
// Pure framing helpers live in ferro-bounds (shared with the product scene rect).
export { FERRO_FRAME_FILL, FERRO_LOBE_AMPLITUDE, getFerroExtentRadius, getFerroFitDistance, getFerroPoolHeight, } from "./ferro-bounds";
/** Fixed mesh resolution: spike sharpness depends on it, so it never drops. */
export const FERRO_BLOB_SEGMENTS = 240;
export const FERRO_POOL_SEGMENTS = 440;
export const FERRO_MAX_DROPLETS = 12;
function hash(n) {
    const s = Math.sin(n * 127.1 + 311.7) * 43758.5453123;
    return s - Math.floor(s);
}
function createUniforms() {
    return {
        uFreq: { value: 1 },
        uGrain: { value: 0 },
        uGrainSeed: { value: 0 },
        uLobeCount: { value: 0 },
        uLobes: {
            value: Array.from({ length: FERRO_MAX_LOBES }, () => [0, 1, 0, 0]).flat(),
        },
        uMagnet: { value: new Vector3(1, 0, 0) },
        uMode: { value: 0 },
        uMorph: { value: 1 },
        uOctaves: { value: 3 },
        uPhase: { value: 0 },
        uPulse: { value: 1 },
        uShapeBlend: { value: 1 },
        uShapeKind: { value: 0 },
        uShapeRound: { value: 0.35 },
        uSize: { value: 1 },
        uSpikeCount: { value: 300 },
        uSpikeCoverage: { value: 1 },
        uSpikeGrowth: { value: 0 },
        uSpikeHeight: { value: 0.3 },
        uSpikeJitter: { value: 0 },
        uSpikeMotion: { value: 0 },
        uSpikeSharp: { value: 0.5 },
        uSpikeSoft: { value: 0.5 },
        uWobble: { value: 0.3 },
    };
}
function createFluidMaterial(uniforms, kind) {
    const displaced = kind === "surface";
    const material = new MeshPhysicalMaterial({
        clearcoat: 1,
        clearcoatRoughness: 0.03,
        color: new Color("#0A0A0C"),
        metalness: 0,
        roughness: 0.35,
        // The base layer only adds a soft milky sheen; the crisp highlights come
        // from the clearcoat, so keep the base specular low for a deep black.
        specularIntensity: 0.12,
    });
    material.onBeforeCompile = (shader) => {
        Object.assign(shader.uniforms, uniforms);
        if (displaced) {
            shader.vertexShader = shader.vertexShader
                .replace("#include <common>", `#include <common>\n${ferroVertexPars}`)
                .replace("#include <beginnormal_vertex>", ferroBeginNormal)
                .replace("#include <begin_vertex>", ferroBeginVertex);
            shader.fragmentShader = shader.fragmentShader
                .replace("#include <common>", `#include <common>\n${ferroFragmentPars}`)
                .replace("#include <clipping_planes_fragment>", ferroFragmentClip)
                .replace("#include <lights_physical_fragment>", ferroFragmentSatin)
                .replace("#include <dithering_fragment>", ferroFragmentGrain);
        }
        else if (kind === "shape") {
            shader.vertexShader = shader.vertexShader
                .replace("#include <common>", `#include <common>\n${ferroVertexPars}`)
                .replace("#include <begin_vertex>", ferroShapeBeginVertex);
            shader.fragmentShader = shader.fragmentShader
                .replace("#include <common>", `#include <common>\n${ferroFragmentPars}`)
                .replace("#include <lights_physical_fragment>", `#include <lights_physical_fragment>\n${ferroFragmentFilm}`)
                .replace("#include <dithering_fragment>", ferroFragmentGrain);
        }
        else {
            shader.vertexShader = shader.vertexShader
                .replace("#include <common>", "#include <common>\nvarying float vFerroPool;\nvarying float vFerroSpike;")
                .replace("#include <begin_vertex>", "#include <begin_vertex>\nvFerroPool = 0.0;\nvFerroSpike = 0.0;");
            shader.fragmentShader = shader.fragmentShader
                .replace("#include <common>", `#include <common>\n${ferroFragmentPars}`)
                .replace("#include <lights_physical_fragment>", `#include <lights_physical_fragment>\n${ferroFragmentFilm}`)
                .replace("#include <dithering_fragment>", ferroFragmentGrain);
        }
    };
    material.customProgramCacheKey = () => `ferrofluid-${kind}-v4`;
    return material;
}
function environmentKey(params) {
    const metal = params.finish === "chrome" || params.finish === "iridescent";
    return `${metal ? "metal" : "fluid"}|${params.keyLight.toFixed(3)}|${params.rimLight.toFixed(3)}|${params.rimColor}`;
}
/**
 * Bright product-chrome studio for the Chrome and Iridescent finishes: a light
 * grey/white sweep with big soft white cards, plus dark bands so the mirror
 * surface shows crisp light/dark banding (refs 11, 13, 14, 15).
 */
function buildChromeStudioScene(params) {
    const studio = new Scene();
    const sweepGeometry = new SphereGeometry(30, 64, 32);
    const positions = sweepGeometry.getAttribute("position");
    const colors = new Float32Array(positions.count * 3);
    for (let i = 0; i < positions.count; i += 1) {
        const y = positions.getY(i) / 30;
        // Bright ceiling, light grey walls, a darker floor for a horizon line.
        const level = y > 0 ? 0.55 + 0.45 * Math.pow(y, 0.7) : 0.08 + 0.37 * Math.pow(1 + y, 4);
        colors[i * 3] = level;
        colors[i * 3 + 1] = level;
        colors[i * 3 + 2] = level * 1.03;
    }
    sweepGeometry.setAttribute("color", new BufferAttribute(colors, 3));
    studio.add(new Mesh(sweepGeometry, new MeshBasicMaterial({ side: BackSide, vertexColors: true })));
    const card = (color, intensity, width, height, position) => {
        const mesh = new Mesh(new PlaneGeometry(width, height), new MeshBasicMaterial({
            color: color.clone().multiplyScalar(intensity),
            side: DoubleSide,
        }));
        mesh.position.set(...position);
        mesh.lookAt(0, 0, 0);
        studio.add(mesh);
    };
    const white = new Color(1, 1, 1);
    const black = new Color(0, 0, 0);
    const key = Math.max(0.2, params.keyLight);
    card(white, 3.2 * key, 24, 14, [0, 13, 4]);
    card(white, 4 * key, 10, 14, [-11, 3, 8]);
    card(white, 3 * key, 8, 12, [11, 1, 7]);
    card(white, 2.4 * key, 16, 6, [0, 2, 14]);
    // Dark bands for contrast. They must never cross each other: a crossing
    // pair reflects as a small dark "+" on convex chrome (ferro-017). So the
    // front and back bands are horizontal only, and the vertical bands sit
    // at the sides, outside the horizontal bands' angular span.
    card(black, 1, 30, 3.2, [0, -3.5, 12]);
    card(black, 1, 30, 3, [0, 4, -14]);
    card(black, 1, 3, 20, [-15, 2, 1]);
    card(black, 1, 3, 20, [15, 2, -2]);
    const rim = new Color(params.rimColor).convertSRGBToLinear();
    card(rim, 3 * params.rimLight, 3, 13, [8, 2, -10]);
    return studio;
}
/**
 * A procedural photo studio: a dim sweep with a large softbox key, a top strip,
 * a front fill card and a coloured rim strip behind the subject. Prefiltered
 * through PMREM so clearcoat reflections read as crisp softbox highlights.
 */
function buildStudioScene(params) {
    const studio = new Scene();
    const sweepGeometry = new SphereGeometry(30, 64, 32);
    const positions = sweepGeometry.getAttribute("position");
    const colors = new Float32Array(positions.count * 3);
    for (let i = 0; i < positions.count; i += 1) {
        const y = positions.getY(i) / 30;
        // Product-photo studio: dark walls and floor, a bright ceiling. Upper
        // surfaces catch a broad soft sheen, sides stay deep black.
        const level = y > 0 ? 0.03 + 0.55 * Math.pow(y, 3) : 0.03 * Math.pow(1 + y, 3);
        colors[i * 3] = level;
        colors[i * 3 + 1] = level;
        colors[i * 3 + 2] = level * 1.02;
    }
    sweepGeometry.setAttribute("color", new BufferAttribute(colors, 3));
    const sweep = new Mesh(sweepGeometry, new MeshBasicMaterial({ side: BackSide, vertexColors: true }));
    studio.add(sweep);
    const card = (color, intensity, width, height, position) => {
        if (intensity <= 0)
            return;
        const mesh = new Mesh(new PlaneGeometry(width, height), new MeshBasicMaterial({
            color: color.clone().multiplyScalar(intensity),
            side: DoubleSide,
        }));
        mesh.position.set(...position);
        mesh.lookAt(0, 0, 0);
        studio.add(mesh);
    };
    const white = new Color(1, 1, 1);
    const key = params.keyLight;
    // Large diffused overhead softbox plus a big front-left key, like a
    // product shoot: broad, soft-edged reflections rather than hard panels.
    card(white, 9 * key, 22, 16, [-1, 14, 3]);
    card(white, 14 * key, 12, 9, [-9, 6, 10]);
    card(white, 5 * key, 7, 12, [11, 2, 6]);
    card(white, 1.2 * key, 30, 3, [0, -10, 6]);
    const rim = new Color(params.rimColor).convertSRGBToLinear();
    card(rim, 34 * params.rimLight, 3.4, 13, [7, 2, -10]);
    card(rim, 22 * params.rimLight, 2.6, 11, [-9, 1, -9]);
    return studio;
}
/** Soft elliptical contact shadow (gaussian alpha), like a product-shot floor. */
function createShadowTexture() {
    const width = 128;
    const height = 64;
    const data = new Uint8Array(width * height * 4);
    for (let y = 0; y < height; y += 1) {
        for (let x = 0; x < width; x += 1) {
            const dx = (x + 0.5) / width * 2 - 1;
            const dy = (y + 0.5) / height * 2 - 1;
            const d2 = dx * dx + dy * dy;
            const alpha = Math.max(0, Math.exp(-d2 * 3.2) - Math.exp(-3.2)) / (1 - Math.exp(-3.2));
            const i = (y * width + x) * 4;
            data[i] = 20;
            data[i + 1] = 16;
            data[i + 2] = 14;
            data[i + 3] = Math.round(alpha * 255);
        }
    }
    const texture = new DataTexture(data, width, height, RGBAFormat);
    texture.needsUpdate = true;
    return texture;
}
function disposeScene(scene) {
    scene.traverse((object) => {
        if (object instanceof Mesh) {
            object.geometry.dispose();
            object.material.dispose();
        }
    });
}
function createBlobGeometry(segments) {
    return new BoxGeometry(2, 2, 2, segments, segments, segments);
}
function createPoolGeometry(segments) {
    const geometry = new PlaneGeometry(2, 2, segments, segments);
    geometry.rotateX(-Math.PI / 2);
    return geometry;
}
/**
 * Worst-case radius of everything that can be drawn (surface noise, lobes,
 * spikes incl. audio growth, pulse and droplet orbits). Stable while audio
 * plays, so the auto-fit never "breathes".
 */
export class FerroScene {
    canvas;
    renderer;
    scene;
    camera;
    root;
    uniforms;
    blob;
    pool;
    droplets;
    surfaceMaterial;
    dropletMaterial;
    pmrem;
    environment = null;
    environmentKey = null;
    disposed = false;
    blobSegments = FERRO_BLOB_SEGMENTS;
    poolSegments = FERRO_POOL_SEGMENTS;
    framing = {
        distance: 6.5,
        fov: 30,
        poolHeight: 0,
        pose: { position: [0, 0, 5], up: [0, 1, 0] },
        radius: 1.4,
        targetY: 0,
    };
    scratchMatrix;
    scratchQuat;
    scratchScale;
    scratchPos;
    constructor({ antialias, canvas, preserveDrawingBuffer = false }) {
        this.scene = new Scene();
        this.camera = new PerspectiveCamera(30, 16 / 9, 0.05, 100);
        this.root = new Group();
        this.uniforms = createUniforms();
        this.scratchMatrix = new Matrix4();
        this.scratchQuat = new Quaternion();
        this.scratchScale = new Vector3();
        this.scratchPos = new Vector3();
        this.canvas = canvas;
        this.renderer = new WebGLRenderer({
            alpha: true,
            antialias,
            canvas,
            powerPreference: "high-performance",
            premultipliedAlpha: true,
            preserveDrawingBuffer,
        });
        this.renderer.setPixelRatio(1);
        this.renderer.setClearColor(0x000000, 0);
        this.renderer.outputColorSpace = SRGBColorSpace;
        this.renderer.toneMapping = ACESFilmicToneMapping;
        this.renderer.toneMappingExposure = 1;
        this.pmrem = new PMREMGenerator(this.renderer);
        this.surfaceMaterial = createFluidMaterial(this.uniforms, "surface");
        this.dropletMaterial = createFluidMaterial(this.uniforms, "droplet");
        this.shapeMaterial = createFluidMaterial(this.uniforms, "shape");
        this.shape = new Mesh(new BufferGeometry(), this.shapeMaterial);
        this.shape.frustumCulled = false;
        this.shapeKey = null;
        this.shapeRadius = 1;
        this.shapeTips = [];
        this.blob = new Mesh(createBlobGeometry(this.blobSegments), this.surfaceMaterial);
        this.blob.frustumCulled = false;
        this.pool = new Mesh(createPoolGeometry(this.poolSegments), this.surfaceMaterial);
        this.pool.frustumCulled = false;
        this.droplets = new InstancedMesh(new SphereGeometry(1, 64, 48), this.dropletMaterial, FERRO_MAX_DROPLETS);
        this.droplets.frustumCulled = false;
        this.droplets.count = 0;
        this.root.add(this.blob, this.pool, this.droplets, this.shape);
        this.scene.add(this.root);
        this.shadowTexture = createShadowTexture();
        this.shadow = new Mesh(new PlaneGeometry(1, 1), new MeshBasicMaterial({
            depthTest: false,
            depthWrite: false,
            map: this.shadowTexture,
            opacity: 0.32,
            toneMapped: false,
            transparent: true,
        }));
        this.shadow.renderOrder = -1;
        this.shadow.frustumCulled = false;
        this.shadow.visible = false;
        this.scene.add(this.shadow);
        // Wrap subject: a camera-facing photo plane at the centre of the wrap.
        // Transparent and drawn after the opaque strokes, so front strokes
        // occlude it and it covers the strokes behind it.
        this.subject = new Mesh(new PlaneGeometry(1, 1), new MeshBasicMaterial({
            depthWrite: false,
            side: DoubleSide,
            toneMapped: false,
            transparent: true,
        }));
        this.subject.frustumCulled = false;
        this.subject.visible = false;
        this.subjectKey = null;
        this.subjectAspect = 1;
        this.subjectTexture = null;
        this.scene.add(this.subject);
        // Layer export: one clipping plane through the centre, facing the camera.
        this.renderer.localClippingEnabled = true;
        this.layerPlane = new Plane(new Vector3(0, 0, 1), 0);
        this.layer = "all";
    }
    /** Uploads (or clears) the subject image; cached per transformed source key. */
    setSubject(source) {
        if (this.disposed)
            return;
        const key = source ? source.key : null;
        if (key === this.subjectKey)
            return;
        this.subjectTexture?.dispose();
        this.subjectTexture = null;
        this.subjectKey = key;
        if (source) {
            const texture = new CanvasTexture(source.canvas);
            texture.colorSpace = SRGBColorSpace;
            texture.anisotropy = 4;
            this.subjectTexture = texture;
            this.subjectAspect = source.aspect;
        }
        this.subject.material.map = this.subjectTexture;
        this.subject.material.needsUpdate = true;
    }
    /** Keeps the floor shadow under the blob, facing the camera like a photo. */
    placeShadow() {
        const framing = this.framing;
        if (!framing.shadow) {
            this.shadow.visible = false;
            return;
        }
        const radius = framing.bodyRadius;
        this.shadow.visible = true;
        this.shadow.quaternion.copy(this.camera.quaternion);
        const down = new Vector3(0, -1, 0).applyQuaternion(this.camera.quaternion.clone().invert());
        this.shadow.position.set(0, -radius * 1.08, 0);
        // Fade out when the camera looks from far above or below.
        this.shadow.material.opacity = 0.32 * Math.min(1, Math.max(0, Math.abs(down.y)));
        this.shadow.scale.set(radius * 1.7, radius * 0.32, 1);
    }
    updateEnvironment(params) {
        const key = environmentKey(params);
        if (key === this.environmentKey)
            return;
        const metal = params.finish === "chrome" || params.finish === "iridescent";
        const studio = metal ? buildChromeStudioScene(params) : buildStudioScene(params);
        // A wider prefilter blur softens the softbox edges in the reflections.
        const target = this.pmrem.fromScene(studio, 0.035);
        disposeScene(studio);
        this.environment?.dispose();
        this.environment = target;
        this.environmentKey = key;
        this.scene.environment = target.texture;
    }
    update(params, frame) {
        if (this.disposed)
            return;
        const u = this.uniforms;
        const progress = ((frame.progress % 1) + 1) % 1;
        const phase = progress * Math.PI * 2;
        const audio = frame.audio;
        const growth = Math.min(1.6, params.spikeAmount + audio.bass * 1.0);
        const height = params.spikeHeight * (1 + audio.bass * 0.55);
        const wobble = params.wobble * (1 + audio.mids * 1.6) + audio.mids * 0.08;
        const pulse = 1 + audio.level * 0.07;
        u.uPhase.value = phase;
        u.uMode.value = params.mode === "pool" ? 1 : 0;
        u.uSize.value = params.size;
        u.uShapeKind.value = FERRO_BASE_SHAPE_INDEX[params.baseShape] ?? 0;
        u.uShapeBlend.value = params.shapeBlend;
        u.uShapeRound.value = params.shapeRoundness;
        u.uPulse.value = pulse;
        u.uWobble.value = wobble;
        u.uFreq.value = params.frequency;
        u.uOctaves.value = params.detail;
        u.uMorph.value = params.morph;
        u.uSpikeGrowth.value = growth;
        u.uSpikeCount.value = params.spikeCount;
        u.uSpikeHeight.value = height;
        u.uSpikeSharp.value = params.spikeSharpness;
        u.uSpikeSoft.value = params.spikeSoftness;
        u.uSpikeCoverage.value = params.spikeCoverage;
        u.uSpikeJitter.value = params.spikeJitter;
        u.uSpikeMotion.value = params.spikeMotion;
        u.uGrain.value = params.grain;
        u.uGrainSeed.value = Math.floor(progress * 240);
        const magnetRadians = (params.magnetAngle * Math.PI) / 180;
        u.uMagnet.value.set(Math.cos(magnetRadians), Math.sin(magnetRadians), 0);
        // Lobes and droplets come from the same pure function the product
        // scene rect uses, so the crop always matches what is drawn.
        const surface = getFerroSurfaceState(params, frame.progress, audio);
        u.uLobeCount.value = surface.lobeCount;
        const lobes = u.uLobes.value;
        for (let i = 0; i < FERRO_MAX_LOBES; i += 1) {
            const lobe = surface.lobes[i];
            lobes[i * 4] = lobe[0];
            lobes[i * 4 + 1] = lobe[1];
            lobes[i * 4 + 2] = lobe[2];
            lobes[i * 4 + 3] = lobe[3];
        }
        const shaped = params.mode === "melt" || params.mode === "thorns" || params.mode === "wrap";
        if (shaped) this.updateShape(params);
        // Satellite droplets drift on tilted closed orbits around the blob; in
        // Thorns they float near the stroke tips instead.
        const tipDroplets = params.mode === "thorns" || params.mode === "wrap";
        if (params.mode === "thorns") {
            this.placeThornDroplets(params.thornDroplets, params.thornSeed, params.thornThickness, params, phase, pulse);
        }
        else if (params.mode === "wrap") {
            this.placeThornDroplets(params.wrapDroplets, params.wrapSeed, params.wrapThickness * 0.55, params, phase, pulse);
        }
        const dropletCount = params.mode === "blob" ? params.dropletCount : 0;
        if (!tipDroplets) this.droplets.count = dropletCount;
        const placements = getFerroDroplets(params, phase, pulse);
        for (let i = 0; i < placements.length; i += 1) {
            const placement = placements[i];
            this.scratchPos.set(...placement.position);
            this.scratchScale.set(...placement.scale);
            this.scratchQuat.identity();
            this.scratchMatrix.compose(this.scratchPos, this.scratchQuat, this.scratchScale);
            this.droplets.setMatrixAt(i, this.scratchMatrix);
        }
        this.droplets.instanceMatrix.needsUpdate = true;
        this.blob.visible = params.mode === "blob";
        this.pool.visible = params.mode === "pool";
        this.droplets.visible = tipDroplets ? this.droplets.count > 0 : dropletCount > 0;
        this.shape.visible = shaped;
        const wrap = params.mode === "wrap";
        this.layer = wrap ? params.wrapLayer : "all";
        // The subject shows only in the full composite; Front/Back layers are
        // for sandwiching the user's own photo in another tool.
        this.subject.visible = wrap && this.subjectTexture !== null && this.layer === "all";
        if (this.subject.visible) {
            const h = params.wrapSubjectSize * params.wrapHeight * params.size;
            this.subject.scale.set(h * this.subjectAspect, h, 1);
        }
        const planes = this.layer === "all" ? [] : [this.layerPlane];
        for (const material of [this.shapeMaterial, this.dropletMaterial]) {
            if (material.clippingPlanes?.length !== planes.length) {
                material.clippingPlanes = planes;
                material.needsUpdate = true;
            }
        }
        this.shape.scale.setScalar(params.size);
        this.root.rotation.y = params.autoRotate ? phase * params.spin : 0;
        for (const material of [this.surfaceMaterial, this.dropletMaterial, this.shapeMaterial]) {
            if (params.finish === "chrome" || params.finish === "iridescent") {
                // Polished silver mirror: all reflection, no clearcoat layer.
                // Iridescent adds a thin-film rainbow tint (ref 15).
                const iridescent = params.finish === "iridescent";
                // A lower base reflectance lets the film interference colours read.
                material.color.set(iridescent ? "#B2AEBE" : "#E6E7EB");
                material.metalness = 1;
                material.roughness = 0.02 + 0.2 * (1 - params.gloss);
                material.clearcoat = 0;
                material.envMapIntensity = 1.15;
                // Thin film 200-640 nm, varied across the surface by
                // ferroFragmentFilm: blue/purple/orange bands.
                material.iridescence = iridescent ? 1 : 0;
                material.iridescenceIOR = 2.0;
                material.iridescenceThicknessRange = [200, 640];
                continue;
            }
            material.iridescence = 0;
            material.metalness = 0;
            material.envMapIntensity = 1;
            material.color.set(params.fluidColor);
            material.roughness = 0.6 - 0.3 * params.gloss;
            material.clearcoatRoughness = 0.34 - 0.3 * params.gloss;
            material.clearcoat = 0.35 + 0.65 * params.gloss;
        }
        this.updateEnvironment(params);
        this.lastParams = params;
        this.framing = {
            distance: params.distance,
            fov: params.fov,
            pose: params.pose,
            poolHeight: params.mode === "pool" ? getFerroPoolHeight(params) : 0,
            radius: shaped ? this.getShapeExtent(params) : getFerroExtentRadius(params),
            shapeBox: shaped ? this.getShapeBox(params) : null,
            shapeKind: params.mode,
            targetY: params.mode === "pool" ? getFerroPoolHeight(params) * 0.4 : 0,
            // Floor shadow disabled on request; placeShadow keeps it hidden.
            shadow: false,
            bodyRadius: params.size * (1 + params.wobble * 0.18 + params.spikeAmount * params.spikeHeight * 0.6),
        };
    }
    /** Rebuilds the Melt/Thorns mesh only when its shape parameters change. */
    updateShape(params) {
        const key = params.mode === "wrap"
            ? ["wrap", params.wrapHeight.toFixed(3), params.wrapRadius.toFixed(3), params.wrapTiers, params.wrapTurns.toFixed(3),
                params.wrapBarbs.toFixed(3), params.wrapDrips, params.wrapThickness.toFixed(3), params.wrapGap.toFixed(3),
                params.wrapSeed].join("|")
            : params.mode === "melt"
            ? ["melt", params.meltArms, params.meltArmLength.toFixed(3), params.meltBulbs.toFixed(3), params.meltDrips,
                params.meltHoles, params.meltHoleSize.toFixed(3), params.meltThickness.toFixed(3),
                params.meltIrregularity.toFixed(3), params.meltPieces, params.meltSeed].join("|")
            : ["thorns", params.thornStrokes, params.thornLength.toFixed(3), params.thornCurl.toFixed(3),
                params.thornThickness.toFixed(3), params.thornSharpness.toFixed(3),
                params.thornSideThorns.toFixed(3), params.thornWrap.toFixed(3), params.thornScribble.toFixed(3), params.thornSeed].join("|");
        if (key === this.shapeKey)
            return;
        const built = params.mode === "wrap"
            ? buildWrapGeometry({
                barbs: params.wrapBarbs,
                drips: params.wrapDrips,
                gap: params.wrapGap,
                height: params.wrapHeight,
                radius: params.wrapRadius,
                seed: params.wrapSeed,
                thickness: params.wrapThickness,
                tiers: params.wrapTiers,
                turns: params.wrapTurns,
            })
            : params.mode === "melt"
            ? buildMeltGeometry({
                armLength: params.meltArmLength,
                arms: params.meltArms,
                bulbs: params.meltBulbs,
                drips: params.meltDrips,
                holeSize: params.meltHoleSize,
                holes: params.meltHoles,
                irregularity: params.meltIrregularity,
                pieces: params.meltPieces,
                seed: params.meltSeed,
                thickness: params.meltThickness,
            })
            : buildThornGeometry({
                curl: params.thornCurl,
                length: params.thornLength,
                scribble: params.thornScribble,
                seed: params.thornSeed,
                sharpness: params.thornSharpness,
                sideThorns: params.thornSideThorns,
                strokes: params.thornStrokes,
                thickness: params.thornThickness,
                wrap: params.thornWrap,
            });
        const previous = this.shape.geometry;
        this.shape.geometry = built.geometry;
        previous.dispose();
        this.shapeKey = key;
        this.shapeRadius = built.radius;
        this.shapeTips = built.tips ?? [];
    }
    /** Small droplets hovering just past the thorn tips, bobbing on the loop. */
    placeThornDroplets(requested, seed, thickness, params, phase, pulse) {
        const tips = this.shapeTips;
        const count = tips.length > 0 ? Math.min(requested, FERRO_MAX_DROPLETS) : 0;
        this.droplets.count = count;
        for (let i = 0; i < count; i += 1) {
            const tip = tips[(i * 3 + 1) % tips.length];
            const h1 = hash(i * 4.1 + seed);
            const h2 = hash(i * 6.7 + seed);
            const outward = tip.clone().normalize();
            const bob = params.morph === 0 ? 0 : Math.sin(phase + h1 * Math.PI * 2);
            this.scratchPos
                .copy(tip)
                .addScaledVector(outward, 0.12 + 0.18 * h2 + 0.03 * bob)
                .multiplyScalar(params.size);
            this.scratchPos.y += 0.04 * bob * params.size;
            const scale = thickness * params.size * (0.25 + 0.3 * h2) * pulse;
            this.scratchScale.set(scale, scale, scale);
            this.scratchQuat.identity();
            this.scratchMatrix.compose(this.scratchPos, this.scratchQuat, this.scratchScale);
            this.droplets.setMatrixAt(i, this.scratchMatrix);
        }
        this.droplets.instanceMatrix.needsUpdate = true;
    }
    /** Mesh bounding box for Melt/Thorns, padded for wobble, pulse and droplets. */
    getShapeBox(params) {
        const box = this.shape.geometry.boundingBox;
        if (!box)
            return null;
        const audio = params.audioEnabled ? params.sensitivity : 0;
        const pad = (1 + params.wobble * (1 + 1.6 * audio) * 0.07 + 0.02) * (1 + 0.07 * audio) * params.size;
        const extra = (params.mode === "thorns" && params.thornDroplets > 0) || (params.mode === "wrap" && params.wrapDroplets > 0)
            ? 0.12 * params.size
            : 0;
        if (params.mode === "wrap") {
            // The wrap turns around its own axis, so fit a symmetric column;
            // include the subject plane when one is attached.
            const reach = Math.max(Math.abs(box.min.x), Math.abs(box.max.x), Math.abs(box.min.z), Math.abs(box.max.z)) * pad + extra;
            const subjectHalfH = this.subjectTexture ? (params.wrapSubjectSize * params.wrapHeight * params.size) / 2 : 0;
            const subjectHalfW = subjectHalfH * this.subjectAspect;
            const halfX = Math.max(reach, subjectHalfW);
            const top = Math.max(box.max.y * pad + extra, subjectHalfH);
            const bottom = Math.min(box.min.y * pad - extra, -subjectHalfH);
            // Depth: the far-out tails rarely sit at the top/bottom front
            // corners, so a shallower box keeps the column large in frame.
            const halfZ = halfX * 0.15;
            return { max: [halfX, top, halfZ], min: [-halfX, bottom, -halfZ] };
        }
        if (params.autoRotate) {
            const reach = Math.hypot(Math.max(Math.abs(box.min.x), Math.abs(box.max.x)), Math.max(Math.abs(box.min.z), Math.abs(box.max.z))) * pad + extra;
            return {
                max: [reach, box.max.y * pad + extra, reach],
                min: [-reach, box.min.y * pad - extra, -reach],
            };
        }
        return {
            max: [box.max.x * pad + extra, box.max.y * pad + extra, box.max.z * pad + extra],
            min: [box.min.x * pad - extra, box.min.y * pad - extra, box.min.z * pad - extra],
        };
    }
    /** Fit radius for Melt/Thorns: mesh bounds plus wobble, pulse and droplets. */
    getShapeExtent(params) {
        const audio = params.audioEnabled ? params.sensitivity : 0;
        const wobble = 1 + params.wobble * (1 + 1.6 * audio) * 0.07 + 0.02;
        const pulse = 1 + 0.07 * audio;
        const droplets = (params.mode === "thorns" && params.thornDroplets > 0) || (params.mode === "wrap" && params.wrapDroplets > 0) ? 0.35 : 0;
        return (this.shapeRadius * wobble + droplets) * params.size * pulse;
    }
    placeCamera(aspect) {
        const framing = this.framing;
        const halfVertical = (framing.fov * Math.PI) / 360;
        const halfHorizontal = Math.atan(Math.tan(halfVertical) * aspect);
        let fitDistance;
        if (framing.shapeBox) {
            // Fit the projected bounding-box corners (tighter than a sphere for
            // flat melts and tall swirls) in both frame axes for this view.
            const view = new Vector3(...framing.pose.position).normalize();
            const up = new Vector3(...framing.pose.up);
            const right = new Vector3().crossVectors(up, view).normalize();
            const trueUp = new Vector3().crossVectors(view, right).normalize();
            // Thorn tips taper to nothing, so their visible extent is smaller.
            const fill = FERRO_FRAME_FILL * (framing.shapeKind === "thorns" ? 1.3 : 1.16);
            // Wrap: the column fills ~90% of the height and its whip tails may
            // reach the frame edges (the padded box still never crops).
            const fillH = framing.shapeKind === "wrap" ? 0.98 : fill;
            const fillV = framing.shapeKind === "wrap" ? 0.92 : fill;
            const tanH = Math.tan(halfHorizontal) * fillH;
            const tanV = Math.tan(halfVertical) * fillV;
            const { max, min } = framing.shapeBox;
            fitDistance = 0.5;
            for (let i = 0; i < 8; i += 1) {
                const corner = new Vector3(i & 1 ? max[0] : min[0], i & 2 ? max[1] : min[1], i & 4 ? max[2] : min[2]);
                const x = Math.abs(corner.dot(right));
                const y = Math.abs(corner.dot(trueUp));
                const z = corner.dot(view);
                fitDistance = Math.max(fitDistance, z + x / tanH, z + y / tanV);
            }
        }
        else {
            // Blob/Pool: the shared pure camera (also used for the product
            // scene rect, so "Crop to object" frames exactly what is drawn).
            const placement = getFerroBlobCamera(this.lastParams, aspect);
            this.camera.position.set(...placement.position);
            this.camera.up.set(...placement.up);
            this.camera.fov = placement.fov;
            this.camera.aspect = aspect;
            this.camera.lookAt(...placement.target);
            this.camera.updateProjectionMatrix();
            return;
        }
        // Distance is a framing multiplier: 1 = auto-fit (never cropped),
        // below 1 moves closer on purpose, above 1 moves further away.
        const distance = fitDistance * framing.distance;
        const direction = new Vector3(...framing.pose.position).normalize();
        this.camera.position.copy(direction.multiplyScalar(distance));
        this.camera.position.y += framing.targetY;
        this.camera.up.set(...framing.pose.up).normalize();
        this.camera.fov = framing.fov;
        this.camera.aspect = aspect;
        this.camera.lookAt(0, framing.targetY, 0);
        this.camera.updateProjectionMatrix();
    }
    /** Rebuilds the displaced meshes at a new vertex density (preview quality). */
    setMeshDetail(blobSegments, poolSegments) {
        if (this.disposed || (blobSegments === this.blobSegments && poolSegments === this.poolSegments)) {
            return;
        }
        this.blobSegments = blobSegments;
        this.poolSegments = poolSegments;
        const previousBlob = this.blob.geometry;
        const previousPool = this.pool.geometry;
        this.blob.geometry = createBlobGeometry(blobSegments);
        this.pool.geometry = createPoolGeometry(poolSegments);
        previousBlob.dispose();
        previousPool.dispose();
    }
    /** Largest texture/renderbuffer edge the GPU accepts (export supersampling). */
    get maxTextureSize() {
        return this.renderer.capabilities.maxTextureSize;
    }
    /** Renders into the scene canvas at an exact backing size. */
    /**
     * Renders into the scene canvas at an exact backing size. `view` (world
     * units) renders only a window of the full product frame: the camera is
     * framed for the full frame, then cropped with setViewOffset, so the
     * cropped product rect shows exactly the same pixels at the same scale.
     */
    render(width, height, view = null) {
        if (this.disposed)
            return;
        const w = Math.max(1, Math.round(width));
        const h = Math.max(1, Math.round(height));
        if (this.canvas.width !== w || this.canvas.height !== h) {
            this.renderer.setSize(w, h, false);
            // Browsers silently clamp very large drawing buffers while the
            // renderer keeps the requested viewport (shifted, scaled image).
            // Match the canvas to the buffer actually granted.
            const gl = this.renderer.getContext();
            if (gl.drawingBufferWidth !== w || gl.drawingBufferHeight !== h) {
                this.renderer.setSize(gl.drawingBufferWidth, gl.drawingBufferHeight, false);
            }
        }
        this.placeCamera(view ? view.fullWidth / view.fullHeight : w / h);
        if (view) {
            this.camera.setViewOffset(view.fullWidth, view.fullHeight, view.x, view.y, view.width, view.height);
        }
        else {
            this.camera.clearViewOffset();
        }
        this.placeShadow();
        this.subject.quaternion.copy(this.camera.quaternion);
        if (this.layer !== "all") {
            // Plane through the centre, perpendicular to the view: Front keeps
            // what is nearer the camera than the subject, Back keeps the rest.
            const toCamera = this.camera.position.clone().normalize();
            this.layerPlane.normal.copy(this.layer === "front" ? toCamera : toCamera.negate());
            this.layerPlane.constant = 0;
        }
        this.renderer.render(this.scene, this.camera);
    }
    /** Projects the object's bounding radius to a screen-space hit test. */
    hitTest(normalizedX, normalizedY, params) {
        const center = new Vector3(0, params.mode === "pool" ? 0.1 * params.size : 0, 0);
        const radius = params.mode === "melt" || params.mode === "thorns" || params.mode === "wrap"
            ? this.framing.radius
            : params.mode === "pool"
            ? 1.75 * params.size
            : params.size * (1.25 + params.spikeHeight * params.spikeAmount) +
                (params.dropletCount > 0 ? params.dropletSpread * params.size * 0.6 : 0);
        const projected = center.clone().project(this.camera);
        const edge = center
            .clone()
            .add(new Vector3().setFromMatrixColumn(this.camera.matrixWorld, 0).multiplyScalar(radius))
            .project(this.camera);
        const radiusX = Math.max(1e-4, Math.hypot(edge.x - projected.x, edge.y - projected.y));
        const radiusY = radiusX * this.camera.aspect;
        const dx = (normalizedX - projected.x) / radiusX;
        const dy = (normalizedY - projected.y) / radiusY;
        return Math.hypot(dx, dy) <= 1.05;
    }
    dispose() {
        if (this.disposed)
            return;
        this.disposed = true;
        this.blob.geometry.dispose();
        this.pool.geometry.dispose();
        this.droplets.geometry.dispose();
        this.droplets.dispose();
        this.shadow.geometry.dispose();
        this.shadow.material.dispose();
        this.shadowTexture.dispose();
        this.subject.geometry.dispose();
        this.subject.material.dispose();
        this.subjectTexture?.dispose();
        this.shape.geometry.dispose();
        this.shapeMaterial.dispose();
        this.surfaceMaterial.dispose();
        this.dropletMaterial.dispose();
        this.environment?.dispose();
        this.pmrem.dispose();
        this.renderer.dispose();
    }
}
