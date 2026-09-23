import { CenterlineRouteDefinition } from '../core/Schema.ts';
export declare class RouteGenerator {
    /**
     * Generates a straight centerline route along the Z axis.
     */
    static createStraight(fromPort: string, toPort: string, lengthMm: number, numSamples?: number): CenterlineRouteDefinition;
    static createStraightZ(fromPort: string, toPort: string, lengthMm: number, numSamples?: number): CenterlineRouteDefinition;
    /**
     * Generates a circular horizontal elbow centerline in the XZ plane.
     * Arc center at origin (0, 0, 0) or offset by radius.
     */
    static createHorizontalElbow(fromPort: string, toPort: string, radiusMm: number, angleDeg: number, numSamples?: number): CenterlineRouteDefinition;
    /**
     * Generates a vertical riser centerline in the XY or YZ plane.
     */
    static createVerticalRiser(fromPort: string, toPort: string, radiusMm: number, angleDeg: number, isOutside?: boolean, numSamples?: number): CenterlineRouteDefinition;
    /**
     * Generates a linear reducer transition centerline.
     */
    static createReducer(fromPort: string, toPort: string, lengthMm: number, offsetXMm?: number, numSamples?: number): CenterlineRouteDefinition;
}
