/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import type * as THREE from 'three';

/**
 * Parameter Assumption Level classification according to Engineering Data rules.
 */
export const AssumptionLevel = {
  VERIFIED_PROJECT_REQUIREMENT: 'VERIFIED_PROJECT_REQUIREMENT', // e.g., PIP PNC00001 (Tier EL +6.4m / +7.2m)
  VERIFIED_VENDOR_CATALOG: 'VERIFIED_VENDOR_CATALOG',           // e.g., Roxtec RG M6x1 catalog
  DEMO_DEFAULT: 'DEMO_DEFAULT',                                 // Industrial common dimensions, prototype defaults
  PLACEHOLDER: 'PLACEHOLDER',                                   // Stand-in placeholder value
  UNVERIFIED: 'UNVERIFIED',                                     // Engineering estimate not yet verified (e.g. thermal buffer)
} as const;

export type AssumptionLevelType = (typeof AssumptionLevel)[keyof typeof AssumptionLevel];

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

  // Dynamic derive functions: all data MUST be derived from effectiveParameters
  getLocalPorts: (params: Record<string, any>) => ConnectionPortDefinition[];
  getCenterlineRoutes: (params: Record<string, any>) => CenterlineRouteDefinition[];
  getBounds: (params: Record<string, any>) => ComponentBoundsDefinition;
  buildGeometry: (params: Record<string, any>) => THREE.Group;

  // Optional assembly definition
  subComponents?: SubComponentReference[];
}
