import { ComponentInstance } from '../core/Instance.ts';
/**
 * Provenance tracking for catalog specification.
 */
export interface TraySystemProfileSource {
    document: string;
    revision?: string;
    pages: number[];
}
/**
 * Tray System Profile schema according to Vendor Reality Check & Canonical Presets.
 * Allows project-wide sizing presets without duplicating 3D geometry generator code.
 */
export interface TraySystemProfile {
    id: string;
    vendor: string;
    trayType: 'LADDER' | 'VENTILATED_THROUGH';
    name: string;
    nameZh: string;
    width: number;
    height: number;
    standardLength: number;
    defaultRadius: number;
    allowedRadii: number[];
    allowedAngles: number[];
    tangentLength: number;
    material: string;
    wallThicknessMm: number;
    rungSpacingMm?: number;
    coverWidthFormula: string;
    coverWidth: number;
    overallWidth: number;
    source: TraySystemProfileSource;
}
/**
 * Pre-configured Vendor Catalog Presets directly extracted from the engineering catalog:
 * - Profile A: Ventilated Through Type (Page 27–37, 100W x 50H)
 * - Profile B: Ventilated Through Type (Page 38–47, 300W x 100H)
 * - Profile Standard: Heavy Ladder Type (Page 4–26, 600W x 150H)
 */
export declare const VENDOR_PROFILES: Record<string, TraySystemProfile>;
/**
 * Registry and query manager for Tray System Profiles.
 */
export declare class TraySystemProfiles {
    static getAll(): TraySystemProfile[];
    static get(id: string): TraySystemProfile | undefined;
}
/**
 * Convenient Factory: Instantiates a ComponentDefinition using parameters derived from a project TraySystemProfile.
 * Ensures consistent width and height/depth are automatically propagated to all downstream fittings,
 * preventing users from having to manually re-enter width and height for every fitting.
 *
 * @param definitionId ID of the component (e.g. 'TRAY_STRAIGHT', 'FITTING_ELBOW_90', 'FITTING_TEE', 'FITTING_CROSS', 'FITTING_REDUCER_LEFT')
 * @param profile Active project TraySystemProfile
 * @param overrides Optional component-specific overrides (e.g. angleDeg, radius, outletWidth)
 * @param instanceId Optional instance ID (auto-generated if omitted)
 */
export declare function createComponentFromProfile(definitionId: string, profile: TraySystemProfile, overrides?: Record<string, any>, instanceId?: string): ComponentInstance;
