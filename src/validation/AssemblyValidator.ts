/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import * as THREE from 'three';
import type { ComponentInstance } from '../core/Instance.ts';
import type { WorldPortDefinition } from '../core/Schema.ts';
import { Transforms } from '../core/Transforms.ts';
import { ConnectionValidator, type ConnectionValidationResult } from './ConnectionValidator.ts';

/**
 * Physical assembly validation for mated tray components (connection-plane invariant).
 *
 * Port-point coincidence alone does not prove a valid assembly. For a joint between
 * instance A (port pa) and instance B (port pb) this validator also checks, on the real meshes:
 *
 *  1. Separation — every body vertex of A lies behind A's port plane and every body vertex of
 *     B lies behind B's port plane. Because the two planes coincide with opposite normals, the
 *     bodies cannot interpenetrate across the joint (half-spaces are convex, so vertex checks are
 *     exact for triangle meshes).
 *  2. Termination / no gap — each body actually reaches its port plane (max signed distance = 0).
 *  3. Face match — the body section lying on the plane has the envelope declared by the port's
 *     `connectionFace`, and A's and B's sections coincide (no step, no rotated / sideways part).
 *  4. Centerline continuity — the routes of A and B meet at the joint.
 *
 * Small accessories (meshes with userData.isAccessory) are excluded: they are not tray body.
 */

export interface MeasuredFace {
  /** Extents of the body section on the joint plane, in port A's frame (mm). */
  minRight: number;
  maxRight: number;
  minUp: number;
  maxUp: number;
  vertexCount: number;
}

export interface JointCheckResult {
  instanceA: string;
  portA: string;
  instanceB: string;
  portB: string;
  connection: ConnectionValidationResult;
  portGapMm: number;
  directionDot: number;
  upDot: number;
  /**
   * Signed distances measured against ONE joint plane (A's port plane, normal pointing from A to B):
   * planeOffsetAMm = how far A's body reaches past the plane into B's side,
   * planeOffsetBMm = how far B's body reaches past the plane into A's side.
   * > 0 = interpenetration, < 0 = the body stops short of the plane (gap), 0 = flush contact.
   */
  planeOffsetAMm: number;
  planeOffsetBMm: number;
  faceA: MeasuredFace | null;
  faceB: MeasuredFace | null;
  /** Max deviation between measured faces and the declared face envelope (mm). */
  faceMismatchMm: number;
  centerlineGapMm: number;
  passed: boolean;
  issues: string[];
}

export interface JointCheckTolerances {
  positionMm?: number;
  planeMm?: number;
  faceMm?: number;
  dot?: number;
}

function bodyVerticesWorldMm(inst: ComponentInstance): THREE.Vector3[] {
  const root = inst.getThreeMesh();
  root.updateMatrixWorld(true);
  const out: THREE.Vector3[] = [];
  root.traverse((obj) => {
    const mesh = obj as THREE.Mesh;
    if (!mesh.isMesh || !mesh.geometry) return;
    if (mesh.userData?.isAccessory) return;
    const pos = mesh.geometry.getAttribute('position');
    if (!pos) return;
    const v = new THREE.Vector3();
    for (let i = 0; i < pos.count; i++) {
      v.fromBufferAttribute(pos, i).applyMatrix4(mesh.matrixWorld).multiplyScalar(1000);
      out.push(v.clone());
    }
  });
  return out;
}

interface PlaneFrame {
  origin: THREE.Vector3;
  normal: THREE.Vector3;
  up: THREE.Vector3;
  right: THREE.Vector3;
}

function frameOf(port: WorldPortDefinition): PlaneFrame {
  const normal = new THREE.Vector3(...port.worldDirection).normalize();
  const upRaw = new THREE.Vector3(...port.worldUp).normalize();
  const right = new THREE.Vector3().crossVectors(upRaw, normal).normalize();
  const up = new THREE.Vector3().crossVectors(normal, right).normalize();
  return { origin: new THREE.Vector3(...port.worldPosition), normal, up, right };
}

/**
 * Measures a body against a plane. `side` = +1: the body must stay behind the plane (normal points
 * away from it); -1: the body must stay in front of it. Returns the max signed intrusion past the
 * plane and the envelope of the body section lying on the plane.
 */
function measure(
  verts: THREE.Vector3[],
  plane: PlaneFrame,
  measureFrame: PlaneFrame,
  planeTol: number,
  side: 1 | -1 = 1
): { offset: number; face: MeasuredFace | null } {
  let offset = -Infinity;
  const face: MeasuredFace = { minRight: Infinity, maxRight: -Infinity, minUp: Infinity, maxUp: -Infinity, vertexCount: 0 };
  const d = new THREE.Vector3();
  for (const v of verts) {
    d.subVectors(v, plane.origin);
    const s = d.dot(plane.normal);
    if (side * s > offset) offset = side * s;
    if (Math.abs(s) <= planeTol) {
      d.subVectors(v, measureFrame.origin);
      const r = d.dot(measureFrame.right);
      const u = d.dot(measureFrame.up);
      face.minRight = Math.min(face.minRight, r);
      face.maxRight = Math.max(face.maxRight, r);
      face.minUp = Math.min(face.minUp, u);
      face.maxUp = Math.max(face.maxUp, u);
      face.vertexCount++;
    }
  }
  return { offset, face: face.vertexCount > 0 ? face : null };
}

function routeEndAtPort(inst: ComponentInstance, portId: string): [number, number, number] | null {
  for (const r of inst.getCenterlines()) {
    if (r.samplePoints.length < 2) continue;
    if (r.fromPort === portId) return Transforms.transformPoint(r.samplePoints[0], inst.placement);
    if (r.toPort === portId) return Transforms.transformPoint(r.samplePoints[r.samplePoints.length - 1], inst.placement);
  }
  return null;
}

export class AssemblyValidator {
  /**
   * Checks one mated joint (A.portA ↔ B.portB) in world space, on the real meshes.
   */
  public static checkJoint(
    instA: ComponentInstance,
    portIdA: string,
    instB: ComponentInstance,
    portIdB: string,
    tolerances: JointCheckTolerances = {}
  ): JointCheckResult {
    const tolPos = tolerances.positionMm ?? 0.01;
    const tolPlane = tolerances.planeMm ?? 0.05;
    const tolFace = tolerances.faceMm ?? 0.05;
    const tolDot = tolerances.dot ?? 1e-6;
    const issues: string[] = [];

    const connection = ConnectionValidator.validateConnection(instA, portIdA, instB, portIdB);
    const pa = instA.getWorldPorts().find((p) => p.id === portIdA);
    const pb = instB.getWorldPorts().find((p) => p.id === portIdB);

    const empty: JointCheckResult = {
      instanceA: instA.instanceId,
      portA: portIdA,
      instanceB: instB.instanceId,
      portB: portIdB,
      connection,
      portGapMm: Infinity,
      directionDot: 0,
      upDot: 0,
      planeOffsetAMm: NaN,
      planeOffsetBMm: NaN,
      faceA: null,
      faceB: null,
      faceMismatchMm: Infinity,
      centerlineGapMm: Infinity,
      passed: false,
      issues: ['Port not found'],
    };
    if (!pa || !pb) return empty;

    const fa = frameOf(pa);
    const fb = frameOf(pb);
    const portGapMm = fa.origin.distanceTo(fb.origin);
    const directionDot = fa.normal.dot(fb.normal);
    const upDot = fa.up.dot(fb.up);

    // Both bodies are measured against the SAME joint plane (A's port plane): A must stay behind it,
    // B in front of it. Together this proves the two bodies are separated by the plane.
    const ma = measure(bodyVerticesWorldMm(instA), fa, fa, tolPlane, 1);
    const mb = measure(bodyVerticesWorldMm(instB), fa, fa, tolPlane, -1);

    let faceMismatchMm = 0;
    const declared = pa.connectionFace;
    const compare = (m: MeasuredFace | null, label: string) => {
      if (!m) {
        issues.push(`${label}: no body geometry on the connection plane`);
        faceMismatchMm = Infinity;
        return;
      }
      if (declared) {
        faceMismatchMm = Math.max(
          faceMismatchMm,
          Math.abs(m.minRight + declared.halfWidth),
          Math.abs(m.maxRight - declared.halfWidth),
          Math.abs(m.minUp - declared.minUp),
          Math.abs(m.maxUp - declared.maxUp)
        );
      }
    };
    compare(ma.face, `A(${instA.instanceId}.${portIdA})`);
    compare(mb.face, `B(${instB.instanceId}.${portIdB})`);
    if (ma.face && mb.face) {
      faceMismatchMm = Math.max(
        faceMismatchMm,
        Math.abs(ma.face.minRight - mb.face.minRight),
        Math.abs(ma.face.maxRight - mb.face.maxRight),
        Math.abs(ma.face.minUp - mb.face.minUp),
        Math.abs(ma.face.maxUp - mb.face.maxUp)
      );
    }

    const ca = routeEndAtPort(instA, portIdA);
    const cb = routeEndAtPort(instB, portIdB);
    const centerlineGapMm = ca && cb ? Transforms.distance(ca, cb) : Infinity;

    if (!connection.valid) issues.push(`Connection rejected: ${connection.code}`);
    if (portGapMm > tolPos) issues.push(`Port gap ${portGapMm.toFixed(3)} mm`);
    if (directionDot > -1 + tolDot) issues.push(`Port directions not opposite (dot ${directionDot.toFixed(6)})`);
    if (upDot < 1 - tolDot) issues.push(`Up vectors not aligned (dot ${upDot.toFixed(6)})`);
    if (ma.offset > tolPlane) issues.push(`A body penetrates ${ma.offset.toFixed(2)} mm past the joint plane`);
    if (mb.offset > tolPlane) issues.push(`B body penetrates ${mb.offset.toFixed(2)} mm past the joint plane`);
    if (ma.offset < -tolPlane) issues.push(`A body stops ${(-ma.offset).toFixed(2)} mm short of the joint plane (gap)`);
    if (mb.offset < -tolPlane) issues.push(`B body stops ${(-mb.offset).toFixed(2)} mm short of the joint plane (gap)`);
    if (faceMismatchMm > tolFace && Number.isFinite(faceMismatchMm)) {
      issues.push(`Connection faces differ by ${faceMismatchMm.toFixed(2)} mm (step / rotated section)`);
    }
    if (centerlineGapMm > tolPos) issues.push(`Centerline discontinuity ${centerlineGapMm.toFixed(3)} mm`);

    return {
      instanceA: instA.instanceId,
      portA: portIdA,
      instanceB: instB.instanceId,
      portB: portIdB,
      connection,
      portGapMm,
      directionDot,
      upDot,
      planeOffsetAMm: ma.offset,
      planeOffsetBMm: mb.offset,
      faceA: ma.face,
      faceB: mb.face,
      faceMismatchMm,
      centerlineGapMm,
      passed: issues.length === 0,
      issues,
    };
  }

  /**
   * Checks that a single component's body terminates exactly on every TRAY_END port plane with
   * the declared face envelope (no overhang past the port, no recess short of it).
   */
  public static checkPortTermination(
    inst: ComponentInstance,
    tolerances: JointCheckTolerances = {}
  ): Array<{ portId: string; planeOffsetMm: number; face: MeasuredFace | null; faceMismatchMm: number; passed: boolean }> {
    const tolPlane = tolerances.planeMm ?? 0.05;
    const tolFace = tolerances.faceMm ?? 0.05;
    const verts = bodyVerticesWorldMm(inst);
    return inst
      .getWorldPorts()
      .filter((p) => p.connectionType === 'TRAY_END')
      .map((p) => {
        const f = frameOf(p);
        const m = measure(verts, f, f, tolPlane);
        let mismatch = Infinity;
        if (m.face && p.connectionFace) {
          mismatch = Math.max(
            Math.abs(m.face.minRight + p.connectionFace.halfWidth),
            Math.abs(m.face.maxRight - p.connectionFace.halfWidth),
            Math.abs(m.face.minUp - p.connectionFace.minUp),
            Math.abs(m.face.maxUp - p.connectionFace.maxUp)
          );
        }
        return {
          portId: p.id,
          planeOffsetMm: m.offset,
          face: m.face,
          faceMismatchMm: mismatch,
          passed: Math.abs(m.offset) <= tolPlane && mismatch <= tolFace,
        };
      });
  }
}
