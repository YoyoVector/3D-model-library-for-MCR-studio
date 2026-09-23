/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */
import type * as THREE from 'three';
/**
 * Parameter Assumption Level classification according to Engineering Data rules.
 * Prototype values without actual vendor source artifacts must be DEMO_DEFAULT or UNVERIFIED.
 */
export declare const AssumptionLevel: {
    readonly VERIFIED_PROJECT_REQUIREMENT: "VERIFIED_PROJECT_REQUIREMENT";
    readonly VERIFIED_VENDOR_CATALOG: "VERIFIED_VENDOR_CATALOG";
    readonly DEMO_DEFAULT: "DEMO_DEFAULT";
    readonly PLACEHOLDER: "PLACEHOLDER";
    readonly UNVERIFIED: "UNVERIFIED";
};
export type AssumptionLevelType = (typeof AssumptionLevel)[keyof typeof AssumptionLevel];
/**
 * BOM Scope classification according to Canonical Implementation Plan.
 */
export declare const BomScope: {
    readonly MCR_CABLE_TRAY_BOM: "MCR_CABLE_TRAY_BOM";
    readonly MCR_TERMINATION_BOM: "MCR_TERMINATION_BOM";
    readonly STRUCTURAL_REF: "STRUCTURAL_REF";
    readonly PROCESS_PIPING_REF: "PROCESS_PIPING_REF";
    readonly VISUAL_ONLY: "VISUAL_ONLY";
};
export type BomScopeType = (typeof BomScope)[keyof typeof BomScope];
/**
 * Origin taxonomy defining asset source and regression testing path.
 */
export declare const ComponentOrigin: {
    readonly LEGACY_FITTING_LIBRARY: "LEGACY_FITTING_LIBRARY";
    readonly LEGACY_MCR_PROTOTYPE: "LEGACY_MCR_PROTOTYPE";
    readonly NEW_COMPONENT: "NEW_COMPONENT";
    readonly DERIVED_ASSEMBLY: "DERIVED_ASSEMBLY";
};
export type ComponentOriginType = (typeof ComponentOrigin)[keyof typeof ComponentOrigin];
/**
 * Engineering component role.
 */
export declare const ComponentRole: {
    readonly TRAY: "TRAY";
    readonly FITTING: "FITTING";
    readonly SUPPORT: "SUPPORT";
    readonly EQUIPMENT: "EQUIPMENT";
    readonly STRUCTURE: "STRUCTURE";
    readonly OBSTACLE: "OBSTACLE";
    readonly PENETRATION: "PENETRATION";
    readonly VISUAL: "VISUAL";
};
export type ComponentRoleType = (typeof ComponentRole)[keyof typeof ComponentRole];
/**
 * Single canonical representation of spatial placement.
 * Quaternion is the sole Source of Truth for rotation.
 */
export interface EngineeringPlacement {
    position: [number, number, number];
    quaternion: [number, number, number, number];
}
/**
 * Definition of a connection port in local component coordinates.
 */
export interface ConnectionPortDefinition {
    id: string;
    name: string;
    localPosition: [number, number, number];
    localDirection: [number, number, number];
    localUp: [number, number, number];
    width: number;
    depth: number;
    connectionType: 'TRAY_END' | 'CONDUIT' | 'GLAND' | 'FLANGE' | 'STRUCTURAL';
    gender?: 'MALE' | 'FEMALE' | 'NEUTRAL';
}
/**
 * Runtime derived world port state.
 */
export interface WorldPortDefinition {
    id: string;
    instanceId: string;
    name: string;
    worldPosition: [number, number, number];
    worldDirection: [number, number, number];
    worldUp: [number, number, number];
    width: number;
    depth: number;
    connectionType: 'TRAY_END' | 'CONDUIT' | 'GLAND' | 'FLANGE' | 'STRUCTURAL';
}
/**
 * Centerline route between a pair of ports.
 */
export interface CenterlineRouteDefinition {
    id: string;
    fromPort: string;
    toPort: string;
    type: 'STRAIGHT' | 'ARC_XY' | 'ARC_XZ' | 'ARC_YZ' | 'SPLINE';
    analyticLength: number;
    samplePoints: Array<[number, number, number]>;
}
/**
 * Component bounding box and clearance envelope.
 */
export interface ComponentBoundsDefinition {
    min: [number, number, number];
    max: [number, number, number];
    clearanceEnvelope?: {
        min: [number, number, number];
        max: [number, number, number];
        reason: string;
        bufferMm: number;
    };
}
/**
 * Provenance tracking for each parameter.
 */
export interface ParameterProvenance {
    source: string;
    assumptionLevel: AssumptionLevelType;
    notes: string;
}
/**
 * Child component reference inside a derived assembly.
 */
export interface SubComponentReference {
    definitionId: string;
    instanceSuffix: string;
    relativePlacement: EngineeringPlacement;
    parameterOverrides?: Record<string, any>;
    isPurchasedSeparately?: boolean;
}
/**
 * Canonical Component Definition.
 * Pure blueprint with dynamic derive functions (Single Source of Truth).
 */
export interface ComponentDefinition {
    schemaVersion: '2.0.0';
    componentVersion: string;
    id: string;
    name: string;
    nameZh: string;
    family: string;
    origin: ComponentOriginType;
    role: ComponentRoleType;
    description: string;
    defaultParameters: Record<string, any>;
    provenance: Record<string, ParameterProvenance>;
    hasBomMetadata?: boolean;
    bomScope?: BomScopeType;
    includedInMcrBom?: boolean;
    getLocalPorts: (params: Record<string, any>) => ConnectionPortDefinition[];
    getCenterlineRoutes: (params: Record<string, any>) => CenterlineRouteDefinition[];
    getBounds: (params: Record<string, any>) => ComponentBoundsDefinition;
    buildGeometry: (params: Record<string, any>) => THREE.Group;
    subComponents?: SubComponentReference[];
}
