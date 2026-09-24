/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import type * as THREE from 'three';

/**
 * Parameter Assumption Level classification according to Engineering Data rules.
 * Prototype values without actual vendor source artifacts must be DEMO_DEFAULT or UNVERIFIED.
 */
export const AssumptionLevel = {
  VERIFIED_PROJECT_REQUIREMENT: 'VERIFIED_PROJECT_REQUIREMENT', // Requires verified project spec reference
  VERIFIED_VENDOR_CATALOG: 'VERIFIED_VENDOR_CATALOG',           // Requires verified vendor catalog reference
  ENGINEERING_DERIVED: 'ENGINEERING_DERIVED',                   // Derived from a catalog drawing by documented reasoning, not printed directly
  DEMO_DEFAULT: 'DEMO_DEFAULT',                                 // Industrial common dimensions, prototype defaults
  PLACEHOLDER: 'PLACEHOLDER',                                   // Stand-in placeholder value
  UNVERIFIED: 'UNVERIFIED',                                     // Engineering estimate not yet verified
} as const;

export type AssumptionLevelType = (typeof AssumptionLevel)[keyof typeof AssumptionLevel];

/**
 * BOM Scope classification according to Canonical Implementation Plan.
 */
export const BomScope = {
  MCR_CABLE_TRAY_BOM: 'MCR_CABLE_TRAY_BOM',   // Primary cable tray raceways and fittings
  MCR_TERMINATION_BOM: 'MCR_TERMINATION_BOM', // Cabinets, JBs, MCTs, Glands
  STRUCTURAL_REF: 'STRUCTURAL_REF',           // Pipe rack columns, beams, stringers, piers
  PROCESS_PIPING_REF: 'PROCESS_PIPING_REF',   // Process pipes, steam pipes, hazard exclusion zones
  VISUAL_ONLY: 'VISUAL_ONLY',                 // Dynamic animated cables, helper visuals
} as const;

export type BomScopeType = (typeof BomScope)[keyof typeof BomScope];

/**
 * Origin taxonomy defining asset source and regression testing path.
 */
export const ComponentOrigin = {
  LEGACY_FITTING_LIBRARY: 'LEGACY_FITTING_LIBRARY', // Visual regression against fitting prototype
  LEGACY_MCR_PROTOTYPE: 'LEGACY_MCR_PROTOTYPE',     // Visual/functional regression against MCR prototype
  NEW_COMPONENT: 'NEW_COMPONENT',                   // Geometry and engineering validation
  DERIVED_ASSEMBLY: 'DERIVED_ASSEMBLY',             // Assembly hierarchy & BOM deduplication
} as const;

export type ComponentOriginType = (typeof ComponentOrigin)[keyof typeof ComponentOrigin];

/**
 * Engineering component role.
 */
export const ComponentRole = {
  TRAY: 'TRAY',
  FITTING: 'FITTING',
  SUPPORT: 'SUPPORT',
  EQUIPMENT: 'EQUIPMENT',
  STRUCTURE: 'STRUCTURE',
  OBSTACLE: 'OBSTACLE',
  PENETRATION: 'PENETRATION',
  VISUAL: 'VISUAL',
} as const;

export type ComponentRoleType = (typeof ComponentRole)[keyof typeof ComponentRole];

/**
 * Single canonical representation of spatial placement.
 * Quaternion is the sole Source of Truth for rotation.
 */
export interface EngineeringPlacement {
  position: [number, number, number]; // [x, y, z] in mm
  quaternion: [number, number, number, number]; // [x, y, z, w]
}

/**
 * Physical connection face of a port: the body section that must coincide with the mating
 * component's face. Expressed in the port frame (right = up x direction, up = localUp),
 * relative to the port point. The component body must terminate on the port plane with
 * exactly this envelope.
 */
export interface ConnectionFaceDefinition {
  /** Tray style at the face ('LADDER' | 'VENTILATED_THROUGH'); mating faces must share it. */
  style?: string;
  /** Half of the overall body width along the port right axis (mm). */
  halfWidth: number;
  /** Lowest body extent along the port up axis (mm, relative to the port point). */
  minUp: number;
  /** Highest body extent along the port up axis (mm, relative to the port point). */
  maxUp: number;
}

/**
 * Definition of a connection port in local component coordinates.
 */
export interface ConnectionPortDefinition {
  id: string; // e.g. 'PORT_A', 'PORT_B', 'PORT_C'
  name: string; // e.g. 'Inlet', 'Outlet', 'Branch'
  localPosition: [number, number, number]; // in mm
  localDirection: [number, number, number]; // Unit vector pointing OUTWARD from component
  localUp: [number, number, number]; // Unit vector defining UP orientation (orthogonal to direction)
  width: number; // in mm
  depth: number; // in mm
  connectionType: 'TRAY_END' | 'CONDUIT' | 'GLAND' | 'FLANGE' | 'STRUCTURAL';
  gender?: 'MALE' | 'FEMALE' | 'NEUTRAL';
  /** Physical connection face (tray ends). Optional for non-tray ports. */
  connectionFace?: ConnectionFaceDefinition;
}

/**
 * Runtime derived world port state.
 */
export interface WorldPortDefinition {
  id: string;
  instanceId: string;
  name: string;
  worldPosition: [number, number, number]; // in mm
  worldDirection: [number, number, number]; // Outward unit vector in world space
  worldUp: [number, number, number]; // Up unit vector in world space
  width: number; // in mm
  depth: number; // in mm
  connectionType: 'TRAY_END' | 'CONDUIT' | 'GLAND' | 'FLANGE' | 'STRUCTURAL';
  connectionFace?: ConnectionFaceDefinition;
}

/**
 * Centerline route between a pair of ports.
 */
export interface CenterlineRouteDefinition {
  id: string; // e.g. 'ROUTE_A_B'
  fromPort: string;
  toPort: string;
  type: 'STRAIGHT' | 'ARC_XY' | 'ARC_XZ' | 'ARC_YZ' | 'SPLINE';
  analyticLength: number; // in mm, exact mathematical calculation
  samplePoints: Array<[number, number, number]>; // Sampled points in local mm
}

/**
 * Component bounding box and clearance envelope.
 */
export interface ComponentBoundsDefinition {
  min: [number, number, number]; // local mm
  max: [number, number, number]; // local mm
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
  isPurchasedSeparately?: boolean; // if false, included in assembly kit (not double-counted)
}

/**
 * Host-supplied materials for `buildGeometry` / `ComponentInstance.getThreeMesh`.
 *
 * The library owns geometry; a host application that styles trays by engineering state
 * (selection, fill failure, active route, dimming) and disposes its own materials passes them
 * here. Meshes built without a host material use the shared library `Materials` and carry
 * `userData.sharedMaterial = true`: hosts must not dispose those.
 */
export interface GeometryBuildOptions {
  materials?: {
    /** Tray / fitting body: rails, rungs, ventilated floor. */
    body?: THREE.Material;
    /** Separator plate. Defaults to `body` when a body material is given. */
    divider?: THREE.Material;
    /** Optional small accessories (splice plates). Defaults to `body` when a body material is given. */
    accessory?: THREE.Material;
  };
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

  // BOM metadata according to Implementation Plan
  hasBomMetadata?: boolean;
  bomScope?: BomScopeType;
  includedInMcrBom?: boolean;

  // Dynamic derive functions: all data MUST be derived from effectiveParameters
  getLocalPorts: (params: Record<string, any>) => ConnectionPortDefinition[];
  getCenterlineRoutes: (params: Record<string, any>) => CenterlineRouteDefinition[];
  getBounds: (params: Record<string, any>) => ComponentBoundsDefinition;
  buildGeometry: (params: Record<string, any>, options?: GeometryBuildOptions) => THREE.Group;

  /**
   * Optional: resolved engineering dimensions (e.g. catalogRadius, centerlineRadius, mainSpan)
   * from the same formula that drives ports / routes / bounds / geometry. Used for display and tests.
   */
  getEngineeringDimensions?: (params: Record<string, any>) => Record<string, number | string>;

  // Optional assembly definition
  subComponents?: SubComponentReference[];
}
