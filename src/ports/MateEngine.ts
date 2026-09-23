/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import * as THREE from 'three';
import { ComponentInstance } from '../core/Instance.ts';
import { PortFrame } from './PortFrame.ts';
import type { EngineeringPlacement, WorldPortDefinition } from '../core/Schema.ts';

export interface MateResult {
  success: boolean;
  placement: EngineeringPlacement;
  positionErrorMm: number;
  alignmentDotProduct: number;
  message: string;
}

/**
 * Deterministic Mate & Placement Engine.
 * Computes rigid body transformation so Port B mates seamlessly with Port A.
 */
export class MateEngine {
  /**
   * Computes the required placement of instanceB such that portB mates with instanceA's portA.
   *
   * @param instanceA The reference/stationary instance
   * @param portIdA The mating port ID on instance A
   * @param instanceB The target instance to be transformed
   * @param portIdB The mating port ID on instance B
   * @param toleranceMm Maximum allowable mating tolerance in mm (default 0.5mm)
   */
  static computeMateTransform(
    instanceA: ComponentInstance,
    portIdA: string,
    instanceB: ComponentInstance,
    portIdB: string,
    toleranceMm: number = 0.5
  ): MateResult {
    // 1. Get world port of A
    const worldPortsA = instanceA.getWorldPorts();
    const portA = worldPortsA.find((p) => p.id === portIdA);
    if (!portA) {
      return {
        success: false,
        placement: { position: [0, 0, 0], quaternion: [0, 0, 0, 1] },
        positionErrorMm: Infinity,
        alignmentDotProduct: 0,
        message: `Port ${portIdA} not found on instance ${instanceA.instanceId}`,
      };
    }

    // 2. Get local port definition of B
    const localPortsB = instanceB.definition.getLocalPorts(instanceB.effectiveParameters);
    const portB = localPortsB.find((p) => p.id === portIdB);
    if (!portB) {
      return {
        success: false,
        placement: { position: [0, 0, 0], quaternion: [0, 0, 0, 1] },
        positionErrorMm: Infinity,
        alignmentDotProduct: 0,
        message: `Port ${portIdB} not found on instance ${instanceB.instanceId}`,
      };
    }

    // 3. Orthonormal frame of Port A in World
    const frameA = new PortFrame(portA.worldPosition, portA.worldDirection, portA.worldUp);

    // Target frame for Port B in World:
    // Direction must point into Port A -> opposite to portA.worldDirection
    const targetDirB = frameA.direction.clone().negate().normalize();
    // Up vector aligns with portA.worldUp
    const targetUpB = frameA.up.clone().normalize();
    const targetRightB = new THREE.Vector3().crossVectors(targetDirB, targetUpB).normalize();
    const correctedTargetUpB = new THREE.Vector3().crossVectors(targetRightB, targetDirB).normalize();

    // Target matrix of Port B in world space: [right, up, dir]
    const mTargetB = new THREE.Matrix4();
    mTargetB.makeBasis(targetRightB, correctedTargetUpB, targetDirB);

    // Local frame of Port B on instance B:
    const frameLocalB = new PortFrame(portB.localPosition, portB.localDirection, portB.localUp);
    const mLocalB = new THREE.Matrix4();
    mLocalB.makeBasis(frameLocalB.right, frameLocalB.up, frameLocalB.direction);

    // Rotation of instance B in world: R_instance = M_targetB * (M_localB)^T
    const mLocalB_inv = mLocalB.clone().transpose();
    const rInstanceB = new THREE.Matrix4().multiplyMatrices(mTargetB, mLocalB_inv);

    const qInstanceB = new THREE.Quaternion().setFromRotationMatrix(rInstanceB);

    // Translation of instance B:
    // P_portB_world = P_instanceB + R_instanceB * P_portB_local
    // Target is P_portB_world = P_portA_world
    // => P_instanceB = P_portA_world - R_instanceB * P_portB_local
    const rotatedLocalPosB = frameLocalB.position.clone().applyQuaternion(qInstanceB);
    const posInstanceB = frameA.position.clone().sub(rotatedLocalPosB);

    const computedPlacement: EngineeringPlacement = {
      position: [posInstanceB.x, posInstanceB.y, posInstanceB.z],
      quaternion: [qInstanceB.x, qInstanceB.y, qInstanceB.z, qInstanceB.w],
    };

    // Verification check:
    const testPosB = frameLocalB.position.clone().applyQuaternion(qInstanceB).add(posInstanceB);
    const testDirB = frameLocalB.direction.clone().applyQuaternion(qInstanceB).normalize();

    const posError = testPosB.distanceTo(frameA.position);
    const alignDot = testDirB.dot(frameA.direction); // should be <= -0.999 (opposite directions)

    const isAligned = posError <= toleranceMm && alignDot <= -0.99;

    return {
      success: isAligned,
      placement: computedPlacement,
      positionErrorMm: posError,
      alignmentDotProduct: alignDot,
      message: isAligned
        ? `Mated successfully. Position error: ${posError.toFixed(4)} mm, alignment dot: ${alignDot.toFixed(4)}`
        : `Mating out of tolerance. Error: ${posError.toFixed(4)} mm, dot: ${alignDot.toFixed(4)}`,
    };
  }

  /**
   * Directly sets the placement of instanceB to mate portB with instanceA's portA.
   */
  static placeComponentByPort(
    instanceA: ComponentInstance,
    portIdA: string,
    instanceB: ComponentInstance,
    portIdB: string,
    toleranceMm: number = 0.5
  ): MateResult {
    const result = this.computeMateTransform(instanceA, portIdA, instanceB, portIdB, toleranceMm);
    if (result.success) {
      instanceB.setPlacement(result.placement);
    }
    return result;
  }
}
