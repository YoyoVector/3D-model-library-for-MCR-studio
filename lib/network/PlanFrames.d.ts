import { Vec3 } from '../geometry/SweepPath.ts';
/**
 * ============================================================================
 * Library world frame — the ONE engineering frame
 * ============================================================================
 *
 * Right-handed, +Y up (elevation), X / Z horizontal. Engineering data (ports, placements,
 * layouts, network nodes) are millimetres; Three.js meshes use the same axes in metres.
 * Seen from above (+Y), with −Z pointing up the screen, +X points right: a physical plan.
 *
 * Every orientation decision — which way a fitting turns, which side a tee branch leaves on,
 * LEFT vs RIGHT reducer, which rail is the traveller's left — is made in this frame only.
 * A traveller moving along `dir` on a level tray has the left rail at `up × dir`.
 *
 * Host applications keep their drawing coordinates and convert through ONE PlanFrame. Page
 * coordinates with y running down the sheet and z as elevation form a LEFT-handed triple:
 * cross products, "left of travel" or rotation angles computed in them are mirrored. Never make
 * orientation decisions in host plan coordinates; convert to the world frame first.
 * ============================================================================
 */
/** A point in host plan coordinates: x / y on the drawing, z elevation. */
export interface PlanPoint {
    x: number;
    y: number;
    z: number;
}
export interface PlanFrame {
    id: string;
    description: string;
    /** Host plan point → library world point (mm). */
    toWorld(p: PlanPoint): Vec3;
    /** Library world point (mm) → host plan point. */
    toPlan(v: Vec3): PlanPoint;
}
export declare const PlanFrames: {
    readonly PAGE_Y_DOWN_METRES: PlanFrame;
    readonly NORTH_UP_METRES: PlanFrame;
};
/** World up (+Y). */
export declare const WORLD_UP: Vec3;
/** The traveller's left on a level tray moving along `dir` (world frame): up × dir. */
export declare function leftOfTravel(dir: Vec3): Vec3;
