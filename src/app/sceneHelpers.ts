/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import * as THREE from 'three';
import { Units, type ComponentInstance, type WorldPortDefinition, type JointCheckResult } from '../index.ts';

const m = (v: [number, number, number]) => new THREE.Vector3(Units.mmToM(v[0]), Units.mmToM(v[1]), Units.mmToM(v[2]));

function portBasis(p: WorldPortDefinition) {
  const dir = new THREE.Vector3(...p.worldDirection).normalize();
  const upRaw = new THREE.Vector3(...p.worldUp).normalize();
  const right = new THREE.Vector3().crossVectors(upRaw, dir).normalize();
  const up = new THREE.Vector3().crossVectors(dir, right).normalize();
  return { dir, up, right, origin: m(p.worldPosition) };
}

/** Rectangle of a port's connection face (physical section envelope) in world space. */
function faceOutline(p: WorldPortDefinition, color: number, opacity = 1): THREE.LineLoop {
  const { up, right, origin } = portBasis(p);
  const f = p.connectionFace ?? { halfWidth: p.width / 2, minUp: -p.depth / 2, maxUp: p.depth / 2 };
  const hw = Units.mmToM(f.halfWidth);
  const lo = Units.mmToM(f.minUp);
  const hi = Units.mmToM(f.maxUp);
  const pts = [
    origin.clone().addScaledVector(right, -hw).addScaledVector(up, lo),
    origin.clone().addScaledVector(right, hw).addScaledVector(up, lo),
    origin.clone().addScaledVector(right, hw).addScaledVector(up, hi),
    origin.clone().addScaledVector(right, -hw).addScaledVector(up, hi),
  ];
  const geo = new THREE.BufferGeometry().setFromPoints(pts);
  return new THREE.LineLoop(geo, new THREE.LineBasicMaterial({ color, transparent: opacity < 1, opacity, depthTest: false }));
}

/** Connection faces + direction / up arrows for every port of the instances. */
export function portMarkers(instances: ComponentInstance[], colors: { port: number; up: number }): THREE.Object3D[] {
  const out: THREE.Object3D[] = [];
  instances.forEach((inst) =>
    inst.getWorldPorts().forEach((p) => {
      const { dir, up, origin } = portBasis(p);
      const size = Units.mmToM(Math.max(120, Math.min(400, p.width * 0.6)));
      out.push(faceOutline(p, colors.port));
      out.push(new THREE.ArrowHelper(dir, origin, size, colors.port, size * 0.28, size * 0.14));
      out.push(new THREE.ArrowHelper(up, origin, size * 0.55, colors.up, size * 0.18, size * 0.1));
    })
  );
  out.forEach((o) => (o.renderOrder = 10));
  return out;
}

/** Routing centerlines as thin tubes. */
export function centerlineTubes(instances: ComponentInstance[], color: number): THREE.Object3D[] {
  const mat = new THREE.MeshBasicMaterial({ color, depthTest: true });
  const out: THREE.Object3D[] = [];
  instances.forEach((inst) => {
    inst.getCenterlines().forEach((route) => {
      if (route.samplePoints.length < 2) return;
      const group = new THREE.Group();
      const pts = route.samplePoints.map((pt) => m(pt));
      const curve = new THREE.CurvePath<THREE.Vector3>();
      for (let i = 1; i < pts.length; i++) curve.add(new THREE.LineCurve3(pts[i - 1], pts[i]));
      group.add(new THREE.Mesh(new THREE.TubeGeometry(curve as any, Math.max(8, pts.length * 2), 0.007, 6, false), mat));
      // Place into world with the instance placement.
      const c = inst.getThreeMesh();
      group.position.copy(c.position);
      group.quaternion.copy(c.quaternion);
      out.push(group);
    });
  });
  return out;
}

/** Engineering bounds (getBounds) drawn as a box in the instance frame. */
export function boundsBoxes(instances: ComponentInstance[], color: number): THREE.Object3D[] {
  return instances.map((inst) => {
    const b = inst.getBounds();
    const size = new THREE.Vector3(b.max[0] - b.min[0], b.max[1] - b.min[1], b.max[2] - b.min[2]).multiplyScalar(0.001);
    const center = new THREE.Vector3((b.max[0] + b.min[0]) / 2, (b.max[1] + b.min[1]) / 2, (b.max[2] + b.min[2]) / 2).multiplyScalar(0.001);
    const box = new THREE.LineSegments(
      new THREE.EdgesGeometry(new THREE.BoxGeometry(size.x, size.y, size.z)),
      new THREE.LineBasicMaterial({ color, transparent: true, opacity: 0.8 })
    );
    const group = new THREE.Group();
    box.position.copy(center);
    group.add(box);
    const c = inst.getThreeMesh();
    group.position.copy(c.position);
    group.quaternion.copy(c.quaternion);
    return group;
  });
}

/** Joint markers: connection face outline green (pass) or red (fail). */
export function jointMarkers(instances: ComponentInstance[], joints: JointCheckResult[]): THREE.Object3D[] {
  const out: THREE.Object3D[] = [];
  joints.forEach((j) => {
    const inst = instances.find((i) => i.instanceId === j.instanceA);
    const port = inst?.getWorldPorts().find((p) => p.id === j.portA);
    if (!port) return;
    const outline = faceOutline(port, j.passed ? 0x22c55e : 0xef4444);
    outline.renderOrder = 11;
    out.push(outline);
  });
  return out;
}
