/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { type Vec3, vec } from '../geometry/SweepPath.ts';

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

const M = 1000;

/**
 * Drawing / PDF page convention: x to the right, y DOWN the page, z elevation up, metres.
 * World = (x, z, y) × 1000. As a triple this plan frame is left-handed; the world frame shows
 * the drawing un-mirrored (page-right = +X, page-down = +Z, seen from above).
 */
const PAGE_Y_DOWN_METRES: PlanFrame = {
  id: 'PAGE_Y_DOWN_METRES',
  description: 'Plan x right, plan y down the page, z elevation; metres',
  toWorld: (p) => [p.x * M, p.z * M, p.y * M],
  toPlan: (v) => ({ x: v[0] / M, y: v[2] / M, z: v[1] / M }),
};

/**
 * Survey convention: x east, y north (up the page), z elevation up, metres (right-handed).
 * World = (x, z, −y) × 1000.
 */
const NORTH_UP_METRES: PlanFrame = {
  id: 'NORTH_UP_METRES',
  description: 'Plan x east, plan y north (up the page), z elevation; metres',
  toWorld: (p) => [p.x * M, p.z * M, -p.y * M],
  toPlan: (v) => ({ x: v[0] / M, y: -v[2] / M, z: v[1] / M }),
};

export const PlanFrames = {
  PAGE_Y_DOWN_METRES,
  NORTH_UP_METRES,
} as const;

/** World up (+Y). */
export const WORLD_UP: Vec3 = [0, 1, 0];

/** The traveller's left on a level tray moving along `dir` (world frame): up × dir. */
export function leftOfTravel(dir: Vec3): Vec3 {
  return vec.normalize(vec.cross(WORLD_UP, dir));
}
