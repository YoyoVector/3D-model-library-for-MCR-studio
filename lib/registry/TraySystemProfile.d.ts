import { ComponentInstance } from '../core/Instance.ts';
/**
 * Provenance tracking for catalog specification.
 */
export interface TraySystemProfileSource {
    document: string;
    revision?: string;
    /** PDF page indices of `CABLE TRAY CATALOGS_Code 1.pdf`. */
    pages: number[];
    /** Printed catalog page = PDF page − offset (each series restarts its own page numbering). */
    printedPageOffset?: number;
}
/** Printed catalog page number of a PDF page in a profile's document. */
export declare function printedPageOf(source: TraySystemProfileSource, pdfPage: number): number;
/**
 * How far a component's library geometry is backed by the vendor drawing.
 * - CATALOG_VERIFIED: routing dimensions (W, H, R, tangents, spans, ports) read from the catalog
 *   table + drawing dimension chain and checked by golden fixtures.
 * - ENGINEERING_DERIVED: derived from the drawing by documented reasoning (not printed directly).
 * - VISUAL_APPROXIMATION: appearance only (e.g. perforation pattern, rung layout details).
 * - GENERIC: library default, not a vendor value.
 * - UNVERIFIED: no catalog backing.
 */
export type CatalogValidationStatus = 'CATALOG_VERIFIED' | 'ENGINEERING_DERIVED' | 'VISUAL_APPROXIMATION' | 'GENERIC' | 'UNVERIFIED';
export interface ProfileComponentSupport {
    definitionId: string;
    /** PDF page indices of the drawing / table. */
    pages: number[];
    status: CatalogValidationStatus;
    notes?: string;
}
/**
 * Tray System Profile: catalog-true sizing preset for one vendor tray series.
 * One component generator per family + different profiles (never a second geometry path).
 */
export interface TraySystemProfile {
    id: string;
    vendor: string;
    trayType: 'LADDER' | 'VENTILATED_THROUGH';
    name: string;
    nameZh: string;
    /** Default nominal width W (mm). */
    width: number;
    /** Catalog-listed nominal widths (mm). */
    allowedWidths: number[];
    /** Side rail height H (mm) — mapped to the library `depth` parameter. */
    height: number;
    /** Standard straight length L (mm). */
    standardLength: number;
    /** Default catalog inner radius R (mm). */
    defaultRadius: number;
    allowedRadii: number[];
    /** Union of all catalog angles (legacy field). */
    allowedAngles: number[];
    allowedHorizontalAngles: number[];
    allowedVerticalAngles: number[];
    /** Straight tangent at bend / tee / cross ends (mm). */
    tangentLength: number;
    /** Reducer overall length and end straights (mm); 0 when the series has no reducer. */
    reducerLength: number;
    reducerTangentLength: number;
    /** Straight tray material (rails / channel). */
    material: string;
    /** Fitting material (may differ from the straight, e.g. ventilated 100W). */
    fittingMaterial: string;
    wallThicknessMm: number;
    coverMaterial: string;
    coverThicknessMm: number;
    rungSpacingMm?: number;
    /** Ventilated channel inward top lip (mm). */
    lipWidthMm?: number;
    finish: string;
    coverWidthFormula: string;
    coverWidth: number;
    overallWidth: number;
    /** How the catalog R is measured — single definition used by TrayLayouts. */
    radiusSemantics: string;
    source: TraySystemProfileSource;
    /** Components available in this series, with catalog pages and validation status. */
    components: ProfileComponentSupport[];
}
/**
 * Vendor catalog presets (PDF `CABLE TRAY CATALOGS_Code 1.pdf`, page indices):
 * - LADDER_PROFILE_STANDARD: Aluminum ladder tray, p.1–26 (W 100–1000, H 150, R 300/600/900)
 * - VENTILATED_PROFILE_A:    Aluminum ventilated-through tray, p.27–37 (100W × 50H, R 300)
 * - VENTILATED_PROFILE_B:    Aluminum ventilated-through tray, p.38–47 (300W × 100H, R 300)
 */
export declare const VENDOR_PROFILES: Record<string, TraySystemProfile>;
/**
 * Registry and query manager for Tray System Profiles.
 */
export declare class TraySystemProfiles {
    static getAll(): TraySystemProfile[];
    static get(id: string): TraySystemProfile | undefined;
    /** Catalog support entry of a component in a profile (undefined = not offered by the vendor series). */
    static getSupport(profile: TraySystemProfile, definitionId: string): ProfileComponentSupport | undefined;
    static supports(profile: TraySystemProfile, definitionId: string): boolean;
}
export type TrayFamilyKind = 'STRAIGHT' | 'H_BEND' | 'V_BEND' | 'TEE' | 'CROSS' | 'REDUCER' | 'OTHER';
/** Tray family of a definition id (used for profile parameter propagation). */
export declare function trayFamilyOf(definitionId: string): TrayFamilyKind;
/**
 * Resolves the catalog-true parameters a profile imposes on a component (before overrides).
 * Width / height / style / radius / tangents propagate to every fitting of the series, so users
 * never re-enter W and H per fitting. Explicit overrides always win.
 */
export declare function resolveProfileParameters(definitionId: string, profile: TraySystemProfile, overrides?: Record<string, any>): Record<string, any>;
/**
 * Convenient Factory: instantiates a component with parameters derived from a TraySystemProfile.
 *
 * @param definitionId ID of the component (e.g. 'TRAY_STRAIGHT', 'FITTING_ELBOW_90', 'FITTING_TEE')
 * @param profile Active project TraySystemProfile
 * @param overrides Optional component-specific overrides (e.g. radius, outletWidth, width)
 * @param instanceId Optional instance ID (auto-generated if omitted)
 */
export declare function createComponentFromProfile(definitionId: string, profile: TraySystemProfile, overrides?: Record<string, any>, instanceId?: string): ComponentInstance;
