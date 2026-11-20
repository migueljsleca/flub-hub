/*
 * Opaque declarations for the Three.js members used by ferro-scene.js.
 *
 * The Toolcraft code-health/product-boundary type walker recurses without
 * bound through Three's Object3D type graph (Object3D.children: Object3D[])
 * and crashes with "Maximum call stack size exceeded". Exposing Three to the
 * product program through these opaque declarations keeps the boundary
 * checker usable; the public FerroScene API stays typed in ferro-scene.d.ts.
 */
type ThreeClass = new (...args: never[]) => object;

export declare const ACESFilmicToneMapping: string | number;
export declare const BackSide: string | number;
export declare const BoxGeometry: ThreeClass;
export declare const BufferAttribute: ThreeClass;
export declare const BufferGeometry: ThreeClass;
export declare const CanvasTexture: ThreeClass;
export declare const Color: ThreeClass;
export declare const DataTexture: ThreeClass;
export declare const RGBAFormat: string | number;
export declare const DoubleSide: string | number;
export declare const Group: ThreeClass;
export declare const InstancedMesh: ThreeClass;
export declare const Matrix4: ThreeClass;
export declare const Mesh: ThreeClass;
export declare const MeshBasicMaterial: ThreeClass;
export declare const MeshPhysicalMaterial: ThreeClass;
export declare const PerspectiveCamera: ThreeClass;
export declare const Plane: ThreeClass;
export declare const PlaneGeometry: ThreeClass;
export declare const PMREMGenerator: ThreeClass;
export declare const Quaternion: ThreeClass;
export declare const Scene: ThreeClass;
export declare const SphereGeometry: ThreeClass;
export declare const SRGBColorSpace: string | number;
export declare const Vector3: ThreeClass;
export declare const WebGLRenderer: ThreeClass;
