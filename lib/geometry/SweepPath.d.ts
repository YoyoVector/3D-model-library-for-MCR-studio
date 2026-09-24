/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */
/**
 * Pure-math "turtle" paths used by every tray / fitting layout.
 *
 * A path starts from a frame (position, travel tangent, tray up) and is advanced by
 * LINE / ARC / TURN commands. The same path object is sampled for:
 *   - centerline route sample points and analytic length,
 *   - port positions / directions (path end frames),
 *   - analytic bounds of swept tray sections,
 *   - the swept mesh itself (GeometryGenerators).
 *
 * Arc sampling always includes the angles at which the radial vector is parallel to a
 * world axis, so swept section corners hit their exact axis extremes. Bounds computed from
 * the samples are therefore exact (not chord approximations) and identical to the mesh bounds.
 *
 * Units: millimetres. No Three.js dependency.
 */
export type Vec3 = [number, number, number];
export declare const vec: {
    add: (a: Vec3, b: Vec3) => Vec3;
    sub: (a: Vec3, b: Vec3) => Vec3;
    scale: (a: Vec3, s: number) => Vec3;
    dot: (a: Vec3, b: Vec3) => number;
    cross: (a: Vec3, b: Vec3) => Vec3;
    length: (a: Vec3) => number;
    normalize: (a: Vec3) => Vec3;
    /** Linear combination sum(v_i * s_i). */
    combine: (...terms: Array<[Vec3, number]>) => Vec3;
    /** Rodrigues rotation of v about unit axis a by angle (rad). */
    rotate: (v: Vec3, a: Vec3, angle: number) => Vec3;
    /** Removes floating noise (|x| < 1e-9 -> 0) for stable, readable port coordinates. */
    clean: (a: Vec3) => Vec3;
};
/**
 * Local moving frame. `tangent` is the travel direction, `up` the tray-up direction
 * (from tray bottom toward the open / cover side). `side` = up x tangent, matching the
 * PortFrame "right" convention (right = up x direction).
 */
export interface PathFrame {
    position: Vec3;
    tangent: Vec3;
    up: Vec3;
}
export type PathSegment = {
    kind: 'LINE';
    length: number;
}
/**
 * Circular arc: the frame rotates about its local UP axis (horizontal bend) or its local
 * SIDE axis (vertical bend) by a signed angle. Positive angle turns the tangent toward
 * (axis x tangent); the turn centre lies `radius` away in that direction.
 */
 | {
    kind: 'ARC';
    axis: 'UP' | 'SIDE';
    angleRad: number;
    radius: number;
}
/** Zero-radius kink about the local UP axis (mitred corner, e.g. reducer taper). */
 | {
    kind: 'TURN';
    angleRad: number;
};
export interface TurtlePath {
    start: PathFrame;
    segments: PathSegment[];
}
export interface PathStation {
    position: Vec3;
    tangent: Vec3;
    up: Vec3;
    side: Vec3;
    /**
     * Present at mitred kinks and at plane-cut path ends: vector used instead of `side` for section
     * offsets, so the section lies in the mitre / cut plane.
     */
    miterSide?: Vec3;
    /** Normal of the end-cap plane when it differs from the tangent (plane-cut ends). */
    capNormal?: Vec3;
    /** Arc length from path start (mm). */
    s: number;
}
export interface SampleOptions {
    /** Maximum arc step (radians). Default 3 degrees. */
    maxArcStepRad?: number;
    /** Maximum straight-line step (mm). Default: only segment end points. */
    maxLineStep?: number;
}
export declare function sideOf(frame: {
    tangent: Vec3;
    up: Vec3;
}): Vec3;
/** Centre of an ARC segment starting at `frame`. */
export declare function arcCenter(frame: PathFrame, seg: {
    axis: 'UP' | 'SIDE';
    angleRad: number;
    radius: number;
}): Vec3;
/** Applies one segment to a frame (returns a new frame). */
export declare function advanceFrame(frame: PathFrame, seg: PathSegment): PathFrame;
/** End frame of the whole path. */
export declare function pathEndFrame(path: TurtlePath): PathFrame;
/** Exact analytic length of the path (arcs use radius * |angle|; TURN adds 0). */
export declare function pathLength(path: TurtlePath): number;
/**
 * Samples a path into stations. Guarantees:
 *  - first station = path start, last station = path end,
 *  - arcs include axis-extreme angles (exact bounds),
 *  - TURN kinks produce a single mitred station.
 */
export declare function samplePath(path: TurtlePath, opts?: SampleOptions): PathStation[];
/** Frame (position/tangent/up) at an arc-length station along the path. */
export declare function frameAtLength(path: TurtlePath, target: number): PathFrame;
/** A rectangle of the tray section in (side, up) coordinates of the moving frame. */
export interface SectionRect {
    side: [number, number];
    up: [number, number];
}
/** Section corner position at a station. */
export declare function sectionPoint(st: PathStation, sideOffset: number, upOffset: number): Vec3;
/** Axis-aligned bounding box accumulator (mm). */
export declare class BoundsAccumulator {
    min: Vec3;
    max: Vec3;
    add(p: Vec3): void;
    get isEmpty(): boolean;
    result(): {
        min: Vec3;
        max: Vec3;
    };
}
