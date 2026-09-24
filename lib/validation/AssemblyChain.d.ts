import { ComponentInstance } from '../core/Instance.ts';
import { EngineeringPlacement } from '../core/Schema.ts';
import { TraySystemProfile } from '../registry/TraySystemProfile.ts';
import { JointCheckResult } from './AssemblyValidator.ts';
/**
 * One component of an assembly. Every step after the first is mated by its own `port` onto
 * `attachPort` of an earlier step (`attachTo`, default: the previous step).
 */
export interface AssemblyStep {
    definitionId: string;
    overrides?: Record<string, any>;
    /** Own port mated onto the existing assembly (ignored for the first step). */
    port?: string;
    /** Index of the step to attach to (default: previous step). */
    attachTo?: number;
    /** Port on the attached step (default: 'PORT_B'). */
    attachPort?: string;
    instanceId?: string;
}
export interface AssemblyBuildResult {
    instances: ComponentInstance[];
    joints: JointCheckResult[];
    passed: boolean;
    issues: string[];
}
/**
 * Builds a mated assembly (chain or tree) with MateEngine and validates every joint physically
 * (AssemblyValidator: separation, termination, face match, centerline continuity).
 * When a profile is given, every step receives the profile's catalog parameters.
 */
export declare function buildMatedAssembly(steps: AssemblyStep[], options?: {
    profile?: TraySystemProfile;
    basePlacement?: EngineeringPlacement;
}): AssemblyBuildResult;
/** Built-in assembly demos (used by the viewer and by the regression suite). */
export declare const ASSEMBLY_DEMOS: Record<string, {
    name: string;
    nameZh: string;
    steps: AssemblyStep[];
}>;
