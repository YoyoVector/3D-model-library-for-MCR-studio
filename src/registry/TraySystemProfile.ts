/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { ComponentRegistry } from './ComponentRegistry.ts';
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
export function printedPageOf(source: TraySystemProfileSource, pdfPage: number): number {
  return pdfPage - (source.printedPageOffset ?? 0);
}

/**
 * How far a component's library geometry is backed by the vendor drawing.
 * - CATALOG_VERIFIED: routing dimensions (W, H, R, tangents, spans, ports) read from the catalog
 *   table + drawing dimension chain and checked by golden fixtures.
 * - ENGINEERING_DERIVED: derived from the drawing by documented reasoning (not printed directly).
 * - VISUAL_APPROXIMATION: appearance only (e.g. perforation pattern, rung layout details).
 * - GENERIC: library default, not a vendor value.
 * - UNVERIFIED: no catalog backing.
 */
export type CatalogValidationStatus =
  | 'CATALOG_VERIFIED'
  | 'ENGINEERING_DERIVED'
  | 'VISUAL_APPROXIMATION'
  | 'GENERIC'
  | 'UNVERIFIED';

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
  coverWidthFormula: string; // e.g. "W + 6" or "W + 38"
  coverWidth: number; // evaluated for the default width (mm)
  overallWidth: number; // evaluated for the default width (mm)
  /** How the catalog R is measured — single definition used by TrayLayouts. */
  radiusSemantics: string;
  source: TraySystemProfileSource;
  /** Components available in this series, with catalog pages and validation status. */
  components: ProfileComponentSupport[];
}

const RADIUS_SEMANTICS =
  'R = inner radius of the bend (inner side rail for horizontal bends / tee / cross; ' +
  'rail-top side for vertical inside bends; tray bottom for vertical outside bends). ' +
  'Routing centerline radius = R + W/2 (horizontal) or R + H/2 (vertical).';

const LADDER_WIDTHS = [100, 200, 300, 400, 500, 600, 700, 800, 900, 1000];
const POWDER_COAT = 'Polyester powder coating #67 light grey, ≥ 50 µm';

/**
 * Vendor catalog presets (PDF `CABLE TRAY CATALOGS_Code 1.pdf`, page indices):
 * - LADDER_PROFILE_STANDARD: Aluminum ladder tray, p.1–26 (W 100–1000, H 150, R 300/600/900)
 * - VENTILATED_PROFILE_A:    Aluminum ventilated-through tray, p.27–37 (100W × 50H, R 300)
 * - VENTILATED_PROFILE_B:    Aluminum ventilated-through tray, p.38–47 (300W × 100H, R 300)
 */
export const VENDOR_PROFILES: Record<string, TraySystemProfile> = {
  LADDER_PROFILE_STANDARD: {
    id: 'LADDER_PROFILE_STANDARD',
    vendor: 'SECXXX',
    trayType: 'LADDER',
    name: 'Aluminum Ladder Tray (600W × 150H)',
    nameZh: '鋁製梯型電纜線槽 (600W × 150H)',
    width: 600,
    allowedWidths: LADDER_WIDTHS,
    height: 150,
    standardLength: 3000,
    // Catalog offers 300 / 600 / 900; R = 300 is the size highlighted for this project (p.5, 7, 8, 11, 15).
    defaultRadius: 300,
    allowedRadii: [300, 600, 900],
    allowedAngles: [30, 45, 60, 90],
    allowedHorizontalAngles: [30, 45, 60, 90],
    allowedVerticalAngles: [30, 45, 60, 90],
    tangentLength: 125,
    reducerLength: 600,
    reducerTangentLength: 200,
    material: 'ALUMINUM_6063_T5 (4.0t)',
    fittingMaterial: 'ALUMINUM_6063_T5 (4.0t)',
    wallThicknessMm: 4.0,
    coverMaterial: 'ALUMINUM_5052 (2.0t)',
    coverThicknessMm: 2.0,
    rungSpacingMm: 250,
    finish: POWDER_COAT,
    coverWidthFormula: 'W + 38 (W = 1000: W + 48)',
    coverWidth: 638,
    overallWidth: 626, // W + 26
    radiusSemantics: RADIUS_SEMANTICS,
    source: {
      document: '鋁製梯型電纜線槽 (Aluminum Ladder Type Cable Tray)',
      pages: Array.from({ length: 26 }, (_, i) => i + 1),
      printedPageOffset: 2,
    },
    components: [
      { definitionId: 'TRAY_STRAIGHT', pages: [4], status: 'CATALOG_VERIFIED' },
      {
        definitionId: 'TRAY_STRAIGHT_DIVIDER',
        pages: [4, 25],
        status: 'ENGINEERING_DERIVED',
        notes: 'Straight tray + separator plate (p.25); plate position is an assumption.',
      },
      { definitionId: 'FITTING_ELBOW_90', pages: [5], status: 'CATALOG_VERIFIED' },
      { definitionId: 'FITTING_ELBOW_60', pages: [6], status: 'CATALOG_VERIFIED' },
      { definitionId: 'FITTING_ELBOW_45', pages: [7], status: 'CATALOG_VERIFIED' },
      { definitionId: 'FITTING_ELBOW_30', pages: [8], status: 'CATALOG_VERIFIED' },
      {
        definitionId: 'FITTING_TEE',
        pages: [9],
        status: 'CATALOG_VERIFIED',
        notes: 'Routing geometry verified (125 | R | W | R | 125, W | R | 125); rung layout in the junction is a visual approximation.',
      },
      {
        definitionId: 'FITTING_CROSS',
        pages: [10],
        status: 'CATALOG_VERIFIED',
        notes: 'Routing geometry verified (125 | R | W | R | 125 on both axes); rung layout in the junction is a visual approximation.',
      },
      { definitionId: 'FITTING_RISER_IN_90', pages: [11], status: 'CATALOG_VERIFIED' },
      { definitionId: 'FITTING_RISER_IN_60', pages: [12], status: 'CATALOG_VERIFIED' },
      { definitionId: 'FITTING_RISER_IN_45', pages: [13], status: 'CATALOG_VERIFIED' },
      { definitionId: 'FITTING_RISER_IN_30', pages: [14], status: 'CATALOG_VERIFIED' },
      { definitionId: 'FITTING_RISER_OUT_90', pages: [15], status: 'CATALOG_VERIFIED' },
      { definitionId: 'FITTING_RISER_OUT_60', pages: [16], status: 'CATALOG_VERIFIED' },
      { definitionId: 'FITTING_RISER_OUT_45', pages: [17], status: 'CATALOG_VERIFIED' },
      { definitionId: 'FITTING_RISER_OUT_30', pages: [18], status: 'CATALOG_VERIFIED' },
      { definitionId: 'FITTING_REDUCER_CENTER', pages: [19], status: 'CATALOG_VERIFIED' },
      { definitionId: 'FITTING_REDUCER_LEFT', pages: [20], status: 'CATALOG_VERIFIED' },
      { definitionId: 'FITTING_REDUCER_RIGHT', pages: [21], status: 'CATALOG_VERIFIED' },
    ],
  },

  VENTILATED_PROFILE_A: {
    id: 'VENTILATED_PROFILE_A',
    vendor: 'SECXXX',
    trayType: 'VENTILATED_THROUGH',
    name: 'Aluminum Ventilated-Through Tray A (100W × 50H)',
    nameZh: '鋁製密閉沖底型線槽 A (100W × 50H)',
    width: 100,
    allowedWidths: [100],
    height: 50,
    standardLength: 3000,
    defaultRadius: 300,
    allowedRadii: [300],
    allowedAngles: [45, 90],
    allowedHorizontalAngles: [45, 90],
    allowedVerticalAngles: [90],
    tangentLength: 125,
    reducerLength: 0,
    reducerTangentLength: 0,
    material: 'ALUMINUM_6063_T5 (2.0t)',
    fittingMaterial: 'ALUMINUM_5052_H32 (2.0t)',
    wallThicknessMm: 2.0,
    coverMaterial: 'ALUMINUM_5052_H32 (2.0t)',
    coverThicknessMm: 2.0,
    lipWidthMm: 10,
    finish: POWDER_COAT,
    coverWidthFormula: 'W + 6',
    coverWidth: 106,
    overallWidth: 100,
    radiusSemantics: RADIUS_SEMANTICS,
    source: {
      document: '鋁製密閉沖底型電纜線槽 (Aluminum Ventilated Through Type Cable Tray) — 100W × 50H',
      pages: [27, 28, 29, 30, 31, 32, 33, 34, 35, 36, 37],
      printedPageOffset: 28,
    },
    components: [
      { definitionId: 'TRAY_STRAIGHT', pages: [30], status: 'CATALOG_VERIFIED', notes: 'Floor slot pattern is a visual approximation (solid floor plate).' },
      { definitionId: 'FITTING_ELBOW_90', pages: [31], status: 'CATALOG_VERIFIED' },
      { definitionId: 'FITTING_ELBOW_45', pages: [32], status: 'CATALOG_VERIFIED' },
      { definitionId: 'FITTING_TEE', pages: [33], status: 'CATALOG_VERIFIED' },
      { definitionId: 'FITTING_RISER_IN_90', pages: [34], status: 'CATALOG_VERIFIED' },
      { definitionId: 'FITTING_RISER_OUT_90', pages: [35], status: 'CATALOG_VERIFIED' },
    ],
  },

  VENTILATED_PROFILE_B: {
    id: 'VENTILATED_PROFILE_B',
    vendor: 'SECXXX',
    trayType: 'VENTILATED_THROUGH',
    name: 'Aluminum Ventilated-Through Tray B (300W × 100H)',
    nameZh: '鋁製密閉沖底型線槽 B (300W × 100H)',
    width: 300,
    allowedWidths: [300],
    height: 100,
    standardLength: 3000,
    defaultRadius: 300,
    allowedRadii: [300],
    allowedAngles: [30, 90],
    allowedHorizontalAngles: [30, 90],
    allowedVerticalAngles: [90],
    tangentLength: 125,
    reducerLength: 0,
    reducerTangentLength: 0,
    material: 'ALUMINUM_5052_H32 (2.0t)',
    fittingMaterial: 'ALUMINUM_5052_H32 (2.0t)',
    wallThicknessMm: 2.0,
    coverMaterial: 'ALUMINUM_5052_H32 (2.0t)',
    coverThicknessMm: 2.0,
    lipWidthMm: 15,
    finish: POWDER_COAT,
    coverWidthFormula: 'W + 6',
    coverWidth: 306,
    overallWidth: 300,
    radiusSemantics: RADIUS_SEMANTICS,
    source: {
      document: '鋁製密閉沖底型電纜線槽 (Aluminum Ventilated Through Type Cable Tray) — 300W × 100H',
      pages: [38, 39, 40, 41, 42, 43, 44, 45, 46, 47],
      printedPageOffset: 39,
    },
    components: [
      { definitionId: 'TRAY_STRAIGHT', pages: [41], status: 'CATALOG_VERIFIED', notes: 'Floor slot pattern is a visual approximation (solid floor plate).' },
      { definitionId: 'FITTING_ELBOW_90', pages: [42], status: 'CATALOG_VERIFIED' },
      { definitionId: 'FITTING_ELBOW_30', pages: [43], status: 'CATALOG_VERIFIED' },
      { definitionId: 'FITTING_RISER_IN_90', pages: [44], status: 'CATALOG_VERIFIED' },
      { definitionId: 'FITTING_RISER_OUT_90', pages: [45], status: 'CATALOG_VERIFIED' },
    ],
  },
};

/**
 * Registry and query manager for Tray System Profiles.
 */
export class TraySystemProfiles {
  public static getAll(): TraySystemProfile[] {
    return Object.values(VENDOR_PROFILES);
  }

  public static get(id: string): TraySystemProfile | undefined {
    return VENDOR_PROFILES[id];
  }

  /** Catalog support entry of a component in a profile (undefined = not offered by the vendor series). */
  public static getSupport(profile: TraySystemProfile, definitionId: string): ProfileComponentSupport | undefined {
    return profile.components.find((c) => c.definitionId === definitionId);
  }

  public static supports(profile: TraySystemProfile, definitionId: string): boolean {
    return !!this.getSupport(profile, definitionId);
  }
}

export type TrayFamilyKind = 'STRAIGHT' | 'H_BEND' | 'V_BEND' | 'TEE' | 'CROSS' | 'REDUCER' | 'OTHER';

/** Tray family of a definition id (used for profile parameter propagation). */
export function trayFamilyOf(definitionId: string): TrayFamilyKind {
  if (definitionId.startsWith('TRAY_STRAIGHT')) return 'STRAIGHT';
  if (definitionId.startsWith('FITTING_ELBOW')) return 'H_BEND';
  if (definitionId.startsWith('FITTING_RISER')) return 'V_BEND';
  if (definitionId === 'FITTING_TEE') return 'TEE';
  if (definitionId === 'FITTING_CROSS') return 'CROSS';
  if (definitionId.startsWith('FITTING_REDUCER')) return 'REDUCER';
  return 'OTHER';
}

/** Catalog default outlet width of a reducer: largest listed width ≤ W1/2, else the next narrower width. */
function defaultReducerOutlet(profile: TraySystemProfile, w1: number): number {
  const narrower = profile.allowedWidths.filter((w) => w < w1);
  const half = narrower.filter((w) => w <= w1 / 2);
  if (half.length > 0) return half[half.length - 1];
  if (narrower.length > 0) return narrower[0];
  return Math.max(100, w1 / 2);
}

/**
 * Resolves the catalog-true parameters a profile imposes on a component (before overrides).
 * Width / height / style / radius / tangents propagate to every fitting of the series, so users
 * never re-enter W and H per fitting. Explicit overrides always win.
 */
export function resolveProfileParameters(
  definitionId: string,
  profile: TraySystemProfile,
  overrides: Record<string, any> = {}
): Record<string, any> {
  const params: Record<string, any> = {
    width: profile.width,
    depth: profile.height, // catalog H (side rail height) → library depth
    trayStyle: profile.trayType,
    profileId: profile.id,
  };
  if (profile.lipWidthMm) params.lipWidth = profile.lipWidthMm;

  switch (trayFamilyOf(definitionId)) {
    case 'STRAIGHT':
      params.length = profile.standardLength;
      if (profile.rungSpacingMm) params.rungSpacing = profile.rungSpacingMm;
      break;
    case 'H_BEND':
    case 'V_BEND':
    case 'TEE':
    case 'CROSS':
      // Tee / cross spans are DERIVED (W + 2R + 2T): only R and T are set, never length / branchLength.
      params.radius = profile.defaultRadius;
      params.tangentLength = profile.tangentLength;
      break;
    case 'REDUCER': {
      const w1 = overrides.inletWidth ?? overrides.width ?? profile.width;
      params.inletWidth = w1;
      params.outletWidth = defaultReducerOutlet(profile, w1);
      params.length = profile.reducerLength || 600;
      params.tangentLength = profile.reducerTangentLength || 200;
      break;
    }
    default:
      break;
  }

  return { ...params, ...overrides };
}

/**
 * Convenient Factory: instantiates a component with parameters derived from a TraySystemProfile.
 *
 * @param definitionId ID of the component (e.g. 'TRAY_STRAIGHT', 'FITTING_ELBOW_90', 'FITTING_TEE')
 * @param profile Active project TraySystemProfile
 * @param overrides Optional component-specific overrides (e.g. radius, outletWidth, width)
 * @param instanceId Optional instance ID (auto-generated if omitted)
 */
export function createComponentFromProfile(
  definitionId: string,
  profile: TraySystemProfile,
  overrides: Record<string, any> = {},
  instanceId?: string
): ComponentInstance {
  const def = ComponentRegistry.get(definitionId);
  if (!def) {
    throw new Error(`Component definition '${definitionId}' not found in ComponentRegistry`);
  }
  const instId = instanceId || `${definitionId.toLowerCase()}_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
  return new ComponentInstance(instId, def, resolveProfileParameters(definitionId, profile, overrides));
}
