/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import * as THREE from 'three';
import { Materials } from './Materials.ts';
import { type Vec3, type PathStation, vec, samplePath, sectionPoint, sideOf } from './SweepPath.ts';
import type { TrayLayout, SweepSpec, RungSpec, FloorSpec } from './TrayLayouts.ts';
import type { GeometryBuildOptions } from '../core/Schema.ts';

/**
 * Converts a TrayLayout (mm, engineering description) into Three.js meshes (metres).
 * Uses the same path sampler as the analytic bounds, so mesh bounds equal layout bounds.
 */

class MeshAccumulator {
  private positions: number[] = [];
  private normals: number[] = [];
  private indices: number[] = [];

  get isEmpty(): boolean {
    return this.indices.length === 0;
  }

  private addVertex(p: Vec3, n: Vec3): number {
    this.positions.push(p[0], p[1], p[2]);
    this.normals.push(n[0], n[1], n[2]);
    return this.positions.length / 3 - 1;
  }

  private pos(i: number): Vec3 {
    return [this.positions[i * 3], this.positions[i * 3 + 1], this.positions[i * 3 + 2]];
  }

  /** Adds a triangle wound so that its geometric normal agrees with `outward`. */
  private addTriangle(a: number, b: number, c: number, outward: Vec3): void {
    const pa = this.pos(a);
    const n = vec.cross(vec.sub(this.pos(b), pa), vec.sub(this.pos(c), pa));
    if (vec.dot(n, outward) < 0) this.indices.push(a, c, b);
    else this.indices.push(a, b, c);
  }

  /** Planar quad (a, b, c, d in ring order) with a flat outward normal. */
  addQuad(a: Vec3, b: Vec3, c: Vec3, d: Vec3, outward: Vec3): void {
    const n = vec.normalize(outward);
    const ia = this.addVertex(a, n);
    const ib = this.addVertex(b, n);
    const ic = this.addVertex(c, n);
    const id = this.addVertex(d, n);
    this.addTriangle(ia, ib, ic, n);
    this.addTriangle(ia, ic, id, n);
  }

  /** Swept rectangle: 4 smooth side strips + 2 flat caps. */
  addSweep(stations: PathStation[], rect: { side: [number, number]; up: [number, number] }): void {
    if (stations.length < 2) return;
    const corners: Array<[number, number]> = [
      [rect.side[0], rect.up[0]],
      [rect.side[1], rect.up[0]],
      [rect.side[1], rect.up[1]],
      [rect.side[0], rect.up[1]],
    ];
    const faceNormal = (st: PathStation, k: number): Vec3 => {
      const side = vec.normalize(st.miterSide ?? st.side);
      if (k === 0) return vec.scale(st.up, -1);
      if (k === 1) return side;
      if (k === 2) return st.up;
      return vec.scale(side, -1);
    };

    for (let k = 0; k < 4; k++) {
      const c0 = corners[k];
      const c1 = corners[(k + 1) % 4];
      const a: number[] = [];
      const b: number[] = [];
      stations.forEach((st) => {
        const n = faceNormal(st, k);
        a.push(this.addVertex(sectionPoint(st, c0[0], c0[1]), n));
        b.push(this.addVertex(sectionPoint(st, c1[0], c1[1]), n));
      });
      for (let i = 0; i < stations.length - 1; i++) {
        const n = vec.normalize(vec.add(faceNormal(stations[i], k), faceNormal(stations[i + 1], k)));
        this.addTriangle(a[i], a[i + 1], b[i + 1], n);
        this.addTriangle(a[i], b[i + 1], b[i], n);
      }
    }

    const first = stations[0];
    const last = stations[stations.length - 1];
    const ring = (st: PathStation) => corners.map(([s, u]) => sectionPoint(st, s, u));
    const r0 = ring(first);
    const r1 = ring(last);
    this.addQuad(r0[0], r0[1], r0[2], r0[3], vec.scale(first.capNormal ?? first.tangent, -1));
    this.addQuad(r1[0], r1[1], r1[2], r1[3], last.capNormal ?? last.tangent);
  }

  addBox(r: RungSpec): void {
    const t = r.tangent;
    const s = sideOf({ tangent: r.tangent, up: r.up });
    const u = r.up;
    const p = (tt: number, ss: number, uu: number): Vec3 => vec.combine([r.position, 1], [t, tt], [s, ss], [u, uu]);
    const t0 = -r.thickness / 2;
    const t1 = r.thickness / 2;
    const [s0, s1] = r.side;
    const [u0, u1] = r.upRange;
    this.addQuad(p(t0, s0, u0), p(t0, s1, u0), p(t0, s1, u1), p(t0, s0, u1), vec.scale(t, -1));
    this.addQuad(p(t1, s0, u0), p(t1, s1, u0), p(t1, s1, u1), p(t1, s0, u1), t);
    this.addQuad(p(t0, s0, u0), p(t1, s0, u0), p(t1, s0, u1), p(t0, s0, u1), vec.scale(s, -1));
    this.addQuad(p(t0, s1, u0), p(t1, s1, u0), p(t1, s1, u1), p(t0, s1, u1), s);
    this.addQuad(p(t0, s0, u0), p(t1, s0, u0), p(t1, s1, u0), p(t0, s1, u0), vec.scale(u, -1));
    this.addQuad(p(t0, s0, u1), p(t1, s0, u1), p(t1, s1, u1), p(t0, s1, u1), u);
  }

  addFloor(f: FloorSpec): void {
    const shape = new THREE.Shape(f.outline.map(([x, z]) => new THREE.Vector2(x, -z)));
    const geo = new THREE.ExtrudeGeometry(shape, { depth: f.y[1] - f.y[0], bevelEnabled: false, curveSegments: 1 });
    geo.rotateX(-Math.PI / 2);
    geo.translate(0, f.y[0], 0);
    const pos = geo.getAttribute('position');
    const nrm = geo.getAttribute('normal');
    const base = this.positions.length / 3;
    for (let i = 0; i < pos.count; i++) {
      this.positions.push(pos.getX(i), pos.getY(i), pos.getZ(i));
      this.normals.push(nrm.getX(i), nrm.getY(i), nrm.getZ(i));
    }
    const index = geo.getIndex();
    if (index) {
      for (let i = 0; i < index.count; i++) this.indices.push(base + index.getX(i));
    } else {
      for (let i = 0; i < pos.count; i++) this.indices.push(base + i);
    }
    geo.dispose();
  }

  /** Builds a BufferGeometry in metres (engineering mm × 0.001). */
  toGeometry(): THREE.BufferGeometry {
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(this.positions.map((v) => v / 1000), 3));
    g.setAttribute('normal', new THREE.Float32BufferAttribute(this.normals, 3));
    g.setIndex(this.indices);
    g.computeBoundingBox();
    g.computeBoundingSphere();
    return g;
  }
}

function sweepInto(acc: MeshAccumulator, sweeps: SweepSpec[]): void {
  sweeps.forEach((sw) => {
    const stations = samplePath(sw.path);
    sw.rects.forEach((r) => acc.addSweep(stations, r));
  });
}

export interface TrayMeshOptions extends GeometryBuildOptions {
  /** Intrinsically-safe tray colouring (plant scene). */
  isIS?: boolean;
}

/**
 * Builds the Three.js group for a tray layout.
 * Children are tagged with `userData.part` ('RAILS' | 'FLOOR' | 'RUNGS' | 'DIVIDER' | 'ACCESSORY');
 * accessory meshes also carry `userData.isAccessory = true` and are not part of the tray body.
 * Meshes on a shared library material carry `userData.sharedMaterial = true`; meshes on a
 * host material (`options.materials`) belong to the host.
 */
export function buildTrayLayoutGroup(layout: TrayLayout, options: TrayMeshOptions = {}): THREE.Group {
  const group = new THREE.Group();
  group.name = `Tray_${layout.family}`;
  const host = options.materials ?? {};
  const bodyMat = host.body ?? (options.isIS ? Materials.TrayIS : Materials.Tray);
  const dividerMat = host.divider ?? host.body ?? Materials.Divider;
  const accessoryMat = host.accessory ?? host.body ?? Materials.Support;

  const addMesh = (acc: MeshAccumulator, name: string, part: string, mat: THREE.Material, isAccessory = false) => {
    if (acc.isEmpty) return;
    const mesh = new THREE.Mesh(acc.toGeometry(), mat);
    mesh.name = name;
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    mesh.userData = { part, isAccessory, sharedMaterial: !Object.values(host).includes(mat) };
    group.add(mesh);
  };

  const rails = new MeshAccumulator();
  sweepInto(rails, layout.sweeps.filter((s) => s.part === 'RAIL'));
  addMesh(rails, 'Rails', 'RAILS', bodyMat);

  const floor = new MeshAccumulator();
  sweepInto(floor, layout.sweeps.filter((s) => s.part === 'FLOOR'));
  layout.floors.forEach((f) => floor.addFloor(f));
  addMesh(floor, 'Floor', 'FLOOR', bodyMat);

  const rungs = new MeshAccumulator();
  layout.rungs.forEach((r) => rungs.addBox(r));
  addMesh(rungs, 'Rungs', 'RUNGS', bodyMat);

  const divider = new MeshAccumulator();
  sweepInto(divider, layout.sweeps.filter((s) => s.part === 'DIVIDER'));
  addMesh(divider, 'Divider', 'DIVIDER', dividerMat);

  const acc = new MeshAccumulator();
  sweepInto(acc, layout.accessories);
  addMesh(acc, 'SplicePlates', 'ACCESSORY', accessoryMat, true);

  return group;
}
