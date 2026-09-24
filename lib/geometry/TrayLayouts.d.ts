import { ConnectionPortDefinition, CenterlineRouteDefinition, ComponentBoundsDefinition } from '../core/Schema.ts';
import { Vec3, TurtlePath, SectionRect } from './SweepPath.ts';
/**
 * ============================================================================
 * Tray Engineering Layouts — the single engineering formula layer.
 * ============================================================================
 *
 * Every cable tray / fitting is resolved ONCE from its effective parameters into a
 * `TrayLayout`. Ports, centerline routes, bounds and the 3D mesh are all read from that
 * same object, so Geometry / Ports / Centerline / Bounds cannot drift apart.
 *
 * Parameter semantics (vendor catalog "鋁製電纜線槽", PDF pages 4–47):
 *   width  (W) : nominal tray width — the dimension line the catalog calls W.
 *   depth  (H) : side rail height (catalog H).
 *   radius (R) : catalog bend radius R = INNER radius of the bend
 *                - horizontal bends / tee / cross: to the inner side rail (p.5 chain "W | R | 125", cover "R−19")
 *                - vertical inside bends: to the rail-top / cover side (p.11 cover "R−2")
 *                - vertical outside bends: to the tray bottom (p.13 chain "125 | R | H")
 *   tangentLength (T): straight extension at each fitting end (catalog 125 mm; reducers 200 mm).
 *
 * Derived radii (one derivation, used everywhere):
 *   horizontal: centerlineRadius = R + W/2, outerRailRadius = R + W
 *   vertical:   centerlineRadius = R + H/2, outerRadius     = R + H
 *
 * Port convention: a TRAY_END port sits on the connection face at the centre of the tray
 * section (mid-width, mid-height); `localDirection` points outward, `localUp` points from the
 * tray bottom toward the open / cover side. All body geometry lies behind every port plane.
 * ============================================================================
 */
export type TrayStyle = 'LADDER' | 'VENTILATED_THROUGH';
export type TrayFamily = 'STRAIGHT' | 'HORIZONTAL_BEND' | 'VERTICAL_BEND' | 'TEE' | 'CROSS' | 'REDUCER';
export type ReducerType = 'CONCENTRIC' | 'LEFT' | 'RIGHT';
/** Rectangle of a rail section relative to the rail reference line: `out` > 0 = away from tray interior. */
export interface RailRect {
    out: [number, number];
    up: [number, number];
    role: 'WEB' | 'FLANGE' | 'WALL' | 'LIP';
}
export interface TraySection {
    style: TrayStyle;
    width: number;
    height: number;
    railRects: RailRect[];
    /** Ventilated-through floor plate (absent for ladder). */
    floor?: {
        up: [number, number];
    };
    /** Ladder rung (absent for ventilated). */
    rung?: {
        thickness: number;
        up: [number, number];
        spacing: number;
    };
    /** Rail inner face inset from the reference line (rung / divider stop). */
    innerInset: number;
    /** Body extent beyond the W reference line (ladder 13 mm → overall W+26). */
    outerOverhang: number;
}
export interface RungSpec {
    position: Vec3;
    tangent: Vec3;
    up: Vec3;
    /** Extent along the frame side axis, relative to `position`. */
    side: [number, number];
    /** Extent along the frame up axis, relative to `position`. */
    upRange: [number, number];
    thickness: number;
}
export interface SweepSpec {
    path: TurtlePath;
    rects: SectionRect[];
    part: 'RAIL' | 'FLOOR' | 'DIVIDER' | 'ACCESSORY';
}
export interface FloorSpec {
    /** Closed plan outline, (x, z) pairs in mm. */
    outline: Array<[number, number]>;
    y: [number, number];
}
export interface TrayLayout {
    family: TrayFamily;
    section: TraySection;
    /** Resolved engineering dimensions (mm / deg) — shown in the viewer and used by tests. */
    dims: Record<string, number | string>;
    ports: ConnectionPortDefinition[];
    routes: CenterlineRouteDefinition[];
    sweeps: SweepSpec[];
    rungs: RungSpec[];
    floors: FloorSpec[];
    /** Small accessories (splice plates). Visual only: excluded from bounds and connection checks. */
    accessories: SweepSpec[];
    bounds: ComponentBoundsDefinition;
}
/**
 * Ladder side rail (PDF p.4 Detail A): I-profile, web 4.0t, flange 30, overall tray width W+26.
 * The flange extends 13 mm outward of the W line (W+26 overall; cover W+38 overhangs 6 mm, which
 * also matches the elbow cover inner edge R−19 = R−13−6). Web position inside the flange is
 * ENGINEERING_DERIVED (visual only; not a routing dimension).
 * Rung (p.4 RUNG): 50 wide × 25 high, pitch 250, first rung 125 from the tray end.
 */
export declare const LADDER_SECTION_CONSTANTS: {
    readonly webThickness: 4;
    readonly flangeWidth: 30;
    readonly flangeThickness: 4;
    readonly outerOverhang: 13;
    readonly rungWidth: 50;
    readonly rungHeight: 25;
    readonly rungPitch: 250;
};
/**
 * Ventilated-through channel (PDF p.30 / p.41): formed 2.0 mm sheet, W is the outer width,
 * inward top return lip 10 mm (100W×50H, p.30) / 15 mm (300W×100H, p.41).
 */
export declare const VENTILATED_SECTION_CONSTANTS: {
    readonly sheetThickness: 2;
    readonly lipSmall: 10;
    readonly lipLarge: 15;
};
export declare function normalizeTrayStyle(v: unknown): TrayStyle;
export declare function resolveTraySection(params: Record<string, any>, widthOverride?: number): TraySection;
/** Physical face envelope of a tray end in port (right, up) coordinates. */
export declare function faceOf(section: TraySection, width: number): {
    style: TrayStyle;
    halfWidth: number;
    minUp: number;
    maxUp: number;
};
/** 8 corners of a rung box. */
export declare function rungCorners(r: RungSpec): Vec3[];
export declare function straightLayout(params: Record<string, any>): TrayLayout;
export declare function horizontalBendLayout(params: Record<string, any>, defaultAngleDeg: number): TrayLayout;
export declare function verticalBendLayout(params: Record<string, any>, defaultAngleDeg: number, isOutside: boolean): TrayLayout;
export declare function teeLayout(params: Record<string, any>): TrayLayout;
export declare function crossLayout(params: Record<string, any>): TrayLayout;
/**
 * Travel +Z from the wide end (PORT_A, W1) to the narrow end (PORT_B, W2), tray up +Y.
 * Traveller's left = up × travel = +X. Vendor p.20 LEFT reducer keeps the LEFT rail straight;
 * p.21 RIGHT keeps the right rail straight; p.19 CENTER tapers both rails symmetrically.
 * Catalog shape: T (200) straight at W1 → taper over L − 2T (200) → T (200) straight at W2; L = 600.
 */
export declare function reducerLayout(params: Record<string, any>, type: ReducerType): TrayLayout;
