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
   * Generates a circular horizontal elbow centerline in the XZ plane.
   * Arc center at origin (0, 0, 0) or offset by radius.
   */
  static createHorizontalElbow(
    fromPort: string,
    toPort: string,
    radiusMm: number,
    angleDeg: number,
    numSamples: number = 20
  ): CenterlineRouteDefinition {
    const angleRad = (angleDeg * Math.PI) / 180;
    const samples: Array<[number, number, number]> = [];

    for (let i = 0; i <= numSamples; i++) {
      const t = i / numSamples;
      const currentAngle = t * angleRad;
      // Along X = R * cos(a), Z = -R * sin(a)
      const x = radiusMm * Math.cos(currentAngle);
      const z = -radiusMm * Math.sin(currentAngle);
      samples.push([x, 0, z]);
    }

    return {
      id: `ROUTE_${fromPort}_${toPort}`,
      fromPort,
      toPort,
      type: 'ARC_XZ',
      analyticLength: AnalyticLength.circularArc(radiusMm, angleDeg),
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
      analyticLength: AnalyticLength.reducer(lengthMm),
      samplePoints: samples,
    };
  }
}
