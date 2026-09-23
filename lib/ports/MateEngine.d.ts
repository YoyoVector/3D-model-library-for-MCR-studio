import { ComponentInstance } from '../core/Instance.ts';
import { EngineeringPlacement } from '../core/Schema.ts';
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
export declare class MateEngine {
    /**
     * Computes the required placement of instanceB such that portB mates with instanceA's portA.
     *
     * @param instanceA The reference/stationary instance
     * @param portIdA The mating port ID on instance A
     * @param instanceB The target instance to be transformed
     * @param portIdB The mating port ID on instance B
     * @param toleranceMm Maximum allowable mating tolerance in mm (default 0.5mm)
     */
    static computeMateTransform(instanceA: ComponentInstance, portIdA: string, instanceB: ComponentInstance, portIdB: string, toleranceMm?: number): MateResult;
    /**
     * Convenience method to compute and return placement directly.
     */
    static computePlacement(instanceA: ComponentInstance, portIdA: string, instanceB: ComponentInstance, portIdB: string, toleranceMm?: number): EngineeringPlacement;
    /**
     * Directly sets the placement of instanceB to mate portB with instanceA's portA.
     */
    static placeComponentByPort(instanceA: ComponentInstance, portIdA: string, instanceB: ComponentInstance, portIdB: string, toleranceMm?: number): MateResult;
}
