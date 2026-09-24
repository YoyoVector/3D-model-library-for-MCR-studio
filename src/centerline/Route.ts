/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { AnalyticLength } from './AnalyticLength.ts';
import type { CenterlineRouteDefinition } from '../core/Schema.ts';

export class RouteGenerator {
  /**
   * Generates a straight centerline route along the Z axis.
   */
  static createStraight(
    fromPort: string,
    toPort: string,
    lengthMm: number,
    numSamples: number = 10
  ): CenterlineRouteDefinition {
    return this.createStraightZ(fromPort, toPort, lengthMm, numSamples);
  }

  static createStraightZ(
    fromPort: string,
    toPort: string,
    lengthMm: number,
    numSamples: number = 10
  ): CenterlineRouteDefinition {
    const halfL = lengthMm / 2;
    const samples: Array<[number, number, number]> = [];
    for (let i = 0; i <= numSamples; i++) {
      const t = i / numSamples;
      const z = -halfL + lengthMm * t;
      samples.push([0, 0, z]);
    }

    return {
      id: `ROUTE_${fromPort}_${toPort}`,
      fromPort,
      toPort,
      type: 'STRAIGHT',
      analyticLength: AnalyticLength.straight(lengthMm),
      samplePoints: samples,
    };
  }

  /**
   * Generates a straight centerline route along the X axis.
   */
  static createStraightX(
    fromPort: string,
    toPort: string,
    lengthMm: number,
    numSamples: number = 10
  ): CenterlineRouteDefinition {
    const halfL = lengthMm / 2;
    const samples: Array<[number, number, number]> = [];
    for (let i = 0; i <= numSamples; i++) {
      const t = i / numSamples;
      const x = -halfL + lengthMm * t;
      samples.push([x, 0, 0]);
    }

    return {
      id: `ROUTE_${fromPort}_${toPort}`,
      fromPort,
      toPort,
      type: 'STRAIGHT',
      analyticLength: AnalyticLength.straight(lengthMm),
      samplePoints: samples,
    };
  }

  /**
   * Generates a circular horizontal elbow centerline in the XZ plane.
   * Arc center at origin (0, 0, 0) with optional straight tangent extensions.
   */
  static createHorizontalElbow(
    fromPort: string,
    toPort: string,
    radiusMm: number,
    angleDeg: number,
    numSamples: number = 20,
    tangentLengthMm: number = 0
  ): CenterlineRouteDefinition {
    const angleRad = (angleDeg * Math.PI) / 180;
    const samples: Array<[number, number, number]> = [];

    // Optional inlet tangent along +Z towards (radiusMm, 0, 0)
    if (tangentLengthMm > 0) {
      const tanSamples = Math.max(3, Math.floor(numSamples / 4));
      for (let i = 0; i < tanSamples; i++) {
        const t = i / tanSamples;
        const z = tangentLengthMm * (1 - t);
        samples.push([radiusMm, 0, z]);
      }
    }

    // Circular arc
    for (let i = 0; i <= numSamples; i++) {
      const t = i / numSamples;
      const currentAngle = t * angleRad;
      const x = radiusMm * Math.cos(currentAngle);
      const z = -radiusMm * Math.sin(currentAngle);
      samples.push([x, 0, z]);
    }

    // Optional outlet tangent extending along tangent direction at exit
    if (tangentLengthMm > 0) {
      const tanSamples = Math.max(3, Math.floor(numSamples / 4));
      const endArcX = radiusMm * Math.cos(angleRad);
      const endArcZ = -radiusMm * Math.sin(angleRad);
      const dirX = -Math.sin(angleRad);
      const dirZ = -Math.cos(angleRad);

      for (let i = 1; i <= tanSamples; i++) {
        const t = i / tanSamples;
        const dist = t * tangentLengthMm;
        samples.push([endArcX + dirX * dist, 0, endArcZ + dirZ * dist]);
      }
    }

    return {
      id: `ROUTE_${fromPort}_${toPort}`,
      fromPort,
      toPort,
      type: 'ARC_XZ',
      analyticLength: tangentLengthMm > 0
        ? AnalyticLength.arcWithTangents(radiusMm, angleDeg, tangentLengthMm)
        : AnalyticLength.circularArc(radiusMm, angleDeg),
      samplePoints: samples,
    };
  }

  /**
   * Generates a 90-degree corner branch route for Horizontal Cross fittings (Straight + Arc + Straight).
   */
  static createCrossCornerRoute(
    fromPort: string,
    toPort: string,
    spanMm: number,
    radiusMm: number,
    signX: number,
    signZ: number,
    numSamples: number = 20
  ): CenterlineRouteDefinition {
    const halfSpan = spanMm / 2;
    const r = Math.min(radiusMm, halfSpan * 0.85);
    const samples: Array<[number, number, number]> = [];

    // 1. Arm 1: Straight along X from signX * halfSpan to signX * r
    const arm1Samples = Math.max(3, Math.floor(numSamples / 3));
    for (let i = 0; i <= arm1Samples; i++) {
      const t = i / arm1Samples;
      const x = signX * halfSpan + t * (signX * r - signX * halfSpan);
      samples.push([x, 0, 0]);
    }

    // 2. Arc: 90° circular fillet from [signX * r, 0, 0] to [0, 0, signZ * r]
    const arcSamples = Math.max(5, Math.floor(numSamples / 3));
    for (let i = 1; i <= arcSamples; i++) {
      const t = i / arcSamples;
      const angle = (t * Math.PI) / 2;
      const x = signX * r * (1 - Math.sin(angle));
      const z = signZ * r * (1 - Math.cos(angle));
      samples.push([x, 0, z]);
    }

    // 3. Arm 2: Straight along Z from [0, 0, signZ * r] to [0, 0, signZ * halfSpan]
    const arm2Samples = Math.max(3, Math.floor(numSamples / 3));
    for (let i = 1; i <= arm2Samples; i++) {
      const t = i / arm2Samples;
      const z = signZ * r + t * (signZ * halfSpan - signZ * r);
      samples.push([0, 0, z]);
    }

    const armLength = halfSpan - r;
    const arcLength = (r * Math.PI) / 2;
    const analyticLength = 2 * armLength + arcLength;

    return {
      id: `ROUTE_${fromPort}_${toPort}`,
      fromPort,
      toPort,
      type: 'ARC_XZ',
      analyticLength,
      samplePoints: samples,
    };
  }

  /**
   * Generates a vertical riser centerline in the XY or YZ plane.
   */
  static createVerticalRiser(
    fromPort: string,
    toPort: string,
    radiusMm: number,
    angleDeg: number,
    isOutside: boolean = false,
    numSamples: number = 20
  ): CenterlineRouteDefinition {
    const angleRad = (angleDeg * Math.PI) / 180;
    const samples: Array<[number, number, number]> = [];

    for (let i = 0; i <= numSamples; i++) {
      const t = i / numSamples;
      const currentAngle = t * angleRad;
      const x = radiusMm * Math.cos(currentAngle);
      const y = (isOutside ? -1 : 1) * radiusMm * Math.sin(currentAngle);
      samples.push([x, y, 0]);
    }

    return {
      id: `ROUTE_${fromPort}_${toPort}`,
      fromPort,
      toPort,
      type: 'ARC_XY',
      analyticLength: AnalyticLength.circularArc(radiusMm, angleDeg),
      samplePoints: samples,
    };
  }

  /**
   * Generates a linear reducer transition centerline.
   */
  static createReducer(
    fromPort: string,
    toPort: string,
    lengthMm: number,
    offsetXMm: number = 0,
    numSamples: number = 10
  ): CenterlineRouteDefinition {
    const halfL = lengthMm / 2;
    const samples: Array<[number, number, number]> = [];

    for (let i = 0; i <= numSamples; i++) {
      const t = i / numSamples;
      const z = -halfL + lengthMm * t;
      const x = offsetXMm * t;
      samples.push([x, 0, z]);
    }

    return {
      id: `ROUTE_${fromPort}_${toPort}`,
      fromPort,
      toPort,
      type: 'STRAIGHT',
      analyticLength: AnalyticLength.reducer(lengthMm, offsetXMm),
      samplePoints: samples,
    };
  }
}
