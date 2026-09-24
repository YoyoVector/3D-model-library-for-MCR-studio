import { ComponentInstance } from '../core/Instance.ts';
import { ConnectionValidationResult } from './ConnectionValidator.ts';
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
export declare class AssemblyValidator {
    /**
     * Checks one mated joint (A.portA ↔ B.portB) in world space, on the real meshes.
     */
    static checkJoint(instA: ComponentInstance, portIdA: string, instB: ComponentInstance, portIdB: string, tolerances?: JointCheckTolerances): JointCheckResult;
    /**
     * Checks that a single component's body terminates exactly on every TRAY_END port plane with
     * the declared face envelope (no overhang past the port, no recess short of it).
     */
    static checkPortTermination(inst: ComponentInstance, tolerances?: JointCheckTolerances): Array<{
        portId: string;
        planeOffsetMm: number;
        face: MeasuredFace | null;
        faceMismatchMm: number;
        passed: boolean;
    }>;
}
