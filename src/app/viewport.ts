/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import { Materials } from '../index.ts';
import type { ThemePreset } from './themes.ts';

export type CameraView = 'ISO' | 'TOP' | 'FRONT' | 'SIDE';

/** Library defaults of the shared tray material, restored by themes without an override. */
const TRAY_MATERIAL_DEFAULT = {
  color: Materials.Tray.color.getHex(),
  metalness: Materials.Tray.metalness,
  roughness: Materials.Tray.roughness,
};

function disposeTree(root: THREE.Object3D, withMaterials: boolean): void {
  root.traverse((o) => {
    const mesh = o as THREE.Mesh;
    mesh.geometry?.dispose?.();
    if (withMaterials && mesh.material) {
      (Array.isArray(mesh.material) ? mesh.material : [mesh.material]).forEach((m) => m.dispose());
    }
  });
}

const VIEW_DIRECTIONS: Record<CameraView, THREE.Vector3> = {
  ISO: new THREE.Vector3(1, 0.78, 1.18).normalize(),
  TOP: new THREE.Vector3(0, 1, 0.0001).normalize(),
  FRONT: new THREE.Vector3(0, 0.12, 1).normalize(),
  SIDE: new THREE.Vector3(1, 0.12, 0).normalize(),
};

interface Rect {
  x: number;
  y: number;
  w: number;
  h: number;
}

/** Gap kept between the framed content and an overlay panel (px). */
const OVERLAY_PADDING = 8;
/** Share of the free rectangle the framed content may fill. */
const FRAME_FILL = 0.86;

/** Maximal rectangles of `c` not covered by `o` (c itself when they do not overlap). */
function subtractRect(c: Rect, o: Rect): Rect[] {
  if (o.x >= c.x + c.w || o.x + o.w <= c.x || o.y >= c.y + c.h || o.y + o.h <= c.y) return [c];
  const parts: Rect[] = [
    { x: c.x, y: c.y, w: o.x - c.x, h: c.h },
    { x: o.x + o.w, y: c.y, w: c.x + c.w - (o.x + o.w), h: c.h },
    { x: c.x, y: c.y, w: c.w, h: o.y - c.y },
    { x: c.x, y: o.y + o.h, w: c.w, h: c.y + c.h - (o.y + o.h) },
  ];
  return parts.filter((p) => p.w >= 1 && p.h >= 1);
}

/**
 * Owns the Three.js renderer / scene / camera for the demo viewer.
 * Presentation only: it renders whatever engineering meshes it is given and never modifies them.
 */
export class ViewportController {
  public readonly scene = new THREE.Scene();
  public readonly camera = new THREE.PerspectiveCamera(38, 1, 0.01, 2000);
  public readonly renderer: THREE.WebGLRenderer;
  public readonly controls: OrbitControls;

  private readonly content = new THREE.Group();
  private readonly helpers = new THREE.Group();
  private readonly edges = new THREE.Group();
  private readonly ambient = new THREE.AmbientLight(0xffffff, 0.5);
  private readonly key = new THREE.DirectionalLight(0xffffff, 2);
  private readonly fill = new THREE.DirectionalLight(0xffffff, 0.5);
  private readonly ground: THREE.Mesh;
  private grid: THREE.GridHelper | null = null;
  private envTexture: THREE.Texture | null = null;
  private theme: ThemePreset | null = null;
  private edgesEnabled = false;
  private frameHooks: Array<() => void> = [];
  private animationId = 0;
  private resizeObserver: ResizeObserver;
  private contentRadius = 1;
  private contentCenter = new THREE.Vector3();
  private contentBox = new THREE.Box3(new THREE.Vector3(-1, -1, -1), new THREE.Vector3(1, 1, 1));
  private overlayProvider: () => Element[] = () => [];

  constructor(private readonly container: HTMLDivElement) {
    this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.setClearColor(0x000000, 0);
    container.replaceChildren(this.renderer.domElement);
    this.renderer.domElement.style.display = 'block';

    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.08;

    const pmrem = new THREE.PMREMGenerator(this.renderer);
    this.envTexture = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
    pmrem.dispose();

    this.key.castShadow = true;
    this.key.shadow.mapSize.set(2048, 2048);
    this.key.shadow.bias = -0.0004;
    this.key.shadow.normalBias = 0.02;
    this.scene.add(this.ambient, this.key, this.key.target, this.fill);

    this.ground = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), new THREE.ShadowMaterial({ opacity: 0.3 }));
    this.ground.rotation.x = -Math.PI / 2;
    this.ground.receiveShadow = true;
    this.scene.add(this.ground, this.content, this.helpers, this.edges);

    this.resizeObserver = new ResizeObserver(() => this.resize());
    this.resizeObserver.observe(container);
    this.resize();

    const loop = () => {
      this.animationId = requestAnimationFrame(loop);
      this.controls.update();
      this.frameHooks.forEach((h) => h());
      this.renderer.render(this.scene, this.camera);
    };
    this.animationId = requestAnimationFrame(loop);
  }

  public onFrame(hook: () => void): () => void {
    this.frameHooks.push(hook);
    return () => {
      this.frameHooks = this.frameHooks.filter((h) => h !== hook);
    };
  }

  private resize(): void {
    const w = Math.max(1, this.container.clientWidth);
    const h = Math.max(1, this.container.clientHeight);
    this.renderer.setSize(w, h, false);
    this.renderer.domElement.style.width = '100%';
    this.renderer.domElement.style.height = '100%';
    this.camera.aspect = w / h;
    this.applyViewOffset(w, h);
  }

  /** Panels drawn over the viewport; framing keeps the content in the area they leave free. */
  public setOverlayProvider(provider: () => Element[]): void {
    this.overlayProvider = provider;
  }

  /** Largest rectangle of the viewport (by inscribed square, then area) not covered by an overlay. */
  private freeRect(w: number, h: number): Rect {
    const base = this.container.getBoundingClientRect();
    let free: Rect[] = [{ x: 0, y: 0, w, h }];
    this.overlayProvider().forEach((el) => {
      const r = el.getBoundingClientRect();
      if (r.width === 0 || r.height === 0) return;
      const o: Rect = {
        x: r.left - base.left - OVERLAY_PADDING,
        y: r.top - base.top - OVERLAY_PADDING,
        w: r.width + 2 * OVERLAY_PADDING,
        h: r.height + 2 * OVERLAY_PADDING,
      };
      free = free.flatMap((c) => subtractRect(c, o));
    });
    if (free.length === 0) return { x: 0, y: 0, w, h };
    const score = (r: Rect) => Math.min(r.w, r.h) * 1e6 + r.w * r.h;
    return free.reduce((best, r) => (score(r) > score(best) ? r : best));
  }

  /** Shifts the projection so the content centre lands in the middle of the free rectangle. */
  private applyViewOffset(w: number, h: number): void {
    const r = this.freeRect(w, h);
    const ox = r.x + r.w / 2 - w / 2;
    const oy = r.y + r.h / 2 - h / 2;
    if (Math.abs(ox) < 0.5 && Math.abs(oy) < 0.5) this.camera.clearViewOffset();
    else this.camera.setViewOffset(w, h, -ox, -oy, w, h);
    this.camera.updateProjectionMatrix();
  }

  public applyTheme(theme: ThemePreset): void {
    this.theme = theme;
    this.container.style.background = theme.viewportCss;
    this.renderer.toneMappingExposure = theme.exposure;
    this.scene.environment = theme.environment > 0 ? this.envTexture : null;
    this.scene.environmentIntensity = theme.environment;
    this.ambient.color.setHex(theme.ambient.color);
    this.ambient.intensity = theme.ambient.intensity;
    this.key.color.setHex(theme.key.color);
    this.key.intensity = theme.key.intensity;
    this.fill.color.setHex(theme.fill.color);
    this.fill.intensity = theme.fill.intensity;
    const tm = theme.trayMaterial ?? TRAY_MATERIAL_DEFAULT;
    Materials.Tray.color.setHex(tm.color);
    Materials.Tray.metalness = tm.metalness;
    Materials.Tray.roughness = tm.roughness;
    (this.ground.material as THREE.ShadowMaterial).opacity = theme.shadowOpacity;
    this.ground.visible = theme.shadowOpacity > 0;
    this.rebuildGrid();
    this.rebuildEdges();
  }

  /** Replaces the displayed engineering content. */
  public setContent(objects: THREE.Object3D[], options: { frame?: boolean; view?: CameraView } = {}): void {
    // Dispose geometry of content that is no longer shown (materials are shared library materials).
    const keep = new Set(objects);
    this.content.children.filter((c) => !keep.has(c)).forEach((c) => disposeTree(c, false));
    this.content.clear();
    objects.forEach((o) => this.content.add(o));
    this.content.updateMatrixWorld(true);

    const box = new THREE.Box3().setFromObject(this.content);
    if (box.isEmpty()) box.set(new THREE.Vector3(-1, -1, -1), new THREE.Vector3(1, 1, 1));
    const sphere = box.getBoundingSphere(new THREE.Sphere());
    this.contentRadius = Math.max(0.2, sphere.radius);
    this.contentCenter.copy(sphere.center);
    this.contentBox.copy(box);

    // Ground + grid just below the content; shadow frustum sized to it.
    const r = this.contentRadius;
    const groundY = box.min.y - 0.002;
    this.ground.position.set(sphere.center.x, groundY, sphere.center.z);
    this.ground.scale.set(r * 10, r * 10, 1);
    this.key.position.set(sphere.center.x + r * 1.1, sphere.center.y + r * 2.2, sphere.center.z + r * 0.8);
    this.key.target.position.copy(sphere.center);
    const cam = this.key.shadow.camera as THREE.OrthographicCamera;
    cam.left = -r * 1.6;
    cam.right = r * 1.6;
    cam.top = r * 1.6;
    cam.bottom = -r * 1.6;
    cam.near = 0.01;
    cam.far = r * 6;
    cam.updateProjectionMatrix();
    this.fill.position.set(sphere.center.x - r * 1.5, sphere.center.y + r * 0.6, sphere.center.z - r);
    this.rebuildGrid(groundY);
    this.rebuildEdges();
    if (options.frame !== false) this.frame(options.view ?? 'ISO');
  }

  public setHelpers(objects: THREE.Object3D[]): void {
    this.helpers.children.forEach((c) => disposeTree(c, true));
    this.helpers.clear();
    objects.forEach((o) => this.helpers.add(o));
  }

  public setEdgesEnabled(enabled: boolean): void {
    this.edgesEnabled = enabled;
    this.rebuildEdges();
  }

  /**
   * Frames the content box so its projection fills the free rectangle (viewport minus overlay
   * panels): every box corner is projected and the camera distance is the smallest that keeps
   * all of them inside FRAME_FILL of that rectangle.
   */
  public frame(view: CameraView = 'ISO'): void {
    const w = Math.max(1, this.container.clientWidth);
    const h = Math.max(1, this.container.clientHeight);
    const rect = this.freeRect(w, h);
    const tanV = Math.tan((this.camera.fov * Math.PI) / 360);
    const dir = VIEW_DIRECTIONS[view];
    const up = view === 'TOP' ? new THREE.Vector3(0, 0, -1) : new THREE.Vector3(0, 1, 0);
    const right = new THREE.Vector3().crossVectors(up, dir).normalize();
    const camUp = new THREE.Vector3().crossVectors(dir, right).normalize();

    const b = this.contentBox;
    let dist = 0;
    for (const x of [b.min.x, b.max.x]) {
      for (const y of [b.min.y, b.max.y]) {
        for (const z of [b.min.z, b.max.z]) {
          const q = new THREE.Vector3(x, y, z).sub(this.contentCenter);
          const toward = q.dot(dir);
          dist = Math.max(
            dist,
            toward + (Math.abs(q.dot(right)) * h) / (rect.w * FRAME_FILL * tanV),
            toward + (Math.abs(q.dot(camUp)) * h) / (rect.h * FRAME_FILL * tanV)
          );
        }
      }
    }
    dist = Math.max(dist, this.contentRadius * 1.05);

    this.camera.up.copy(up);
    this.camera.position.copy(this.contentCenter).addScaledVector(dir, dist);
    this.camera.near = Math.max(0.005, dist / 200);
    this.camera.far = (dist + this.contentRadius) * 20;
    this.applyViewOffset(w, h);
    this.controls.target.copy(this.contentCenter);
    this.controls.update();
  }

  public setAutoRotate(enabled: boolean): void {
    this.controls.autoRotate = enabled;
    this.controls.autoRotateSpeed = 1.2;
  }

  private rebuildGrid(y?: number): void {
    if (!this.theme) return;
    const prevY = this.grid?.position.y ?? 0;
    if (this.grid) {
      this.scene.remove(this.grid);
      this.grid.geometry.dispose();
      (this.grid.material as THREE.Material).dispose();
    }
    const size = Math.max(4, Math.ceil(this.contentRadius * 6));
    const grid = new THREE.GridHelper(size, Math.min(200, size * 2), this.theme.grid.center, this.theme.grid.lines);
    const mat = grid.material as THREE.LineBasicMaterial;
    mat.transparent = true;
    mat.opacity = this.theme.grid.opacity;
    mat.depthWrite = false;
    grid.position.set(this.contentCenter.x, (y ?? prevY) - 0.001, this.contentCenter.z);
    this.grid = grid;
    this.scene.add(grid);
  }

  private rebuildEdges(): void {
    this.edges.children.forEach((c) => (c as THREE.LineSegments).geometry?.dispose());
    this.edges.clear();
    if (!this.edgesEnabled || !this.theme) return;
    const mat = new THREE.LineBasicMaterial({ color: this.theme.edgeColor, transparent: true, opacity: this.theme.edgeOpacity });
    this.content.updateMatrixWorld(true);
    this.content.traverse((o) => {
      const m = o as THREE.Mesh;
      if (!m.isMesh || !m.geometry) return;
      const line = new THREE.LineSegments(new THREE.EdgesGeometry(m.geometry, 30), mat);
      line.matrixAutoUpdate = false;
      line.matrix.copy(m.matrixWorld);
      this.edges.add(line);
    });
  }

  public dispose(): void {
    cancelAnimationFrame(this.animationId);
    this.resizeObserver.disconnect();
    this.controls.dispose();
    this.renderer.dispose();
    this.envTexture?.dispose();
  }
}
