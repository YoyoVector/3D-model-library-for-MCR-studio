import { CenterlineRouteDefinition } from '../core/Schema.ts';
export declare class RouteGenerator {
    /**
     * Generates a straight centerline route along the Z axis.
     */
    static createStraight(fromPort: string, toPort: string, lengthMm: number, numSamples?: number): CenterlineRouteDefinition;
    static createStraightZ(fromPort: string, toPort: string, lengthMm: number, numSamples?: number): CenterlineRouteDefinition;
    /**
     * Generates a straight centerline route along the X axis.
     */
    static createStraightX(fromPort: string, toPort: string, lengthMm: number, numSamples?: number): CenterlineRouteDefinition;
    /**
     * Generates a circular horizontal elbow centerline in the XZ plane.
     * Arc center at origin (0, 0, 0) with optional straight tangent extensions.
     */
    static createHorizontalElbow(fromPort: string, toPort: string, radiusMm: number, angleDeg: number, numSamples?: number, tangentLengthMm?: number): CenterlineRouteDefinition;
    /**
     * Generates a 90-degree corner branch route for Horizontal Cross fittings (Straight + Arc + Straight).
     */
    static createCrossCornerRoute(fromPort: string, toPort: string, spanMm: number, radiusMm: number, signX: number, signZ: number, numSamples?: number): CenterlineRouteDefinition;
    /**
     * Generates a vertical riser centerline in the XY or YZ plane.
     */
    static createVerticalRiser(fromPort: string, toPort: string, radiusMm: number, angleDeg: number, isOutside?: boolean, numSamples?: number): CenterlineRouteDefinition;
    /**
     * Generates a linear reducer transition centerline.
     */
    static createReducer(fromPort: string, toPort: string, lengthMm: number, offsetXMm?: number, numSamples?: number): CenterlineRouteDefinition;
}
