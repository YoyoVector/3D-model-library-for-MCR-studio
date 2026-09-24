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
  width: number; // mm (W)
  height: number; // mm (H, side rail height / depth)
  standardLength: number; // mm (L, typically 3000mm)
  defaultRadius: number; // mm (R)
  allowedRadii: number[];
  allowedAngles: number[];
  tangentLength: number; // mm (standard tangent extension, typically 125mm)
  material: string;
  wallThicknessMm: number;
  rungSpacingMm?: number;
  coverWidthFormula: string; // e.g. "W + 6" or "W + 38"
  coverWidth: number; // evaluated cover width in mm
  overallWidth: number; // evaluated tray overall width in mm
  source: TraySystemProfileSource;
}

/**
 * Pre-configured Vendor Catalog Presets directly extracted from the engineering catalog:
 * - Profile A: Ventilated Through Type (Page 27–37, 100W x 50H)
 * - Profile B: Ventilated Through Type (Page 38–47, 300W x 100H)
 * - Profile Standard: Heavy Ladder Type (Page 4–26, 600W x 150H)
 */
export const VENDOR_PROFILES: Record<string, TraySystemProfile> = {
  // Page 27–37: Aluminum Ventilated Through Type Cable Tray (Profile A)
  VENTILATED_PROFILE_A: {
    id: 'VENTILATED_PROFILE_A',
    vendor: 'CNS/NEMA Aluminum Vendor',
    trayType: 'VENTILATED_THROUGH',
    name: 'Ventilated Through Tray Profile A (100W x 50H)',
    nameZh: '鋁製密閉沖底型線槽 規格 A (100W x 50H)',
    width: 100,
    height: 50,
    standardLength: 3000,
    defaultRadius: 300,
    allowedRadii: [300],
    allowedAngles: [45, 90],
    tangentLength: 125,
    material: 'ALUMINUM_6063_T5',
    wallThicknessMm: 2.0,
    coverWidthFormula: 'W + 6',
    coverWidth: 106,
    overallWidth: 100,
    source: {
      document: '鋁製密閉沖底型電纜線槽 (Aluminum Ventilated Through Type Cable Tray)',
      pages: [27, 28, 29, 30, 31, 32, 33, 34, 35, 36, 37],
    },
  },

  // Page 38–47: Aluminum Ventilated Through Type Cable Tray (Profile B)
  VENTILATED_PROFILE_B: {
    id: 'VENTILATED_PROFILE_B',
    vendor: 'CNS/NEMA Aluminum Vendor',
    trayType: 'VENTILATED_THROUGH',
    name: 'Ventilated Through Tray Profile B (300W x 100H)',
    nameZh: '鋁製密閉沖底型線槽 規格 B (300W x 100H)',
    width: 300,
    height: 100,
    standardLength: 3000,
    defaultRadius: 300,
    allowedRadii: [300],
    allowedAngles: [30, 90],
    tangentLength: 125,
    material: 'ALUMINUM_5052_H32',
    wallThicknessMm: 2.0,
    coverWidthFormula: 'W + 6',
    coverWidth: 306,
    overallWidth: 300,
    source: {
      document: '鋁製密閉沖底型電纜線槽 (Aluminum Ventilated Through Type Cable Tray)',
      pages: [38, 39, 40, 41, 42, 43, 44, 45, 46, 47],
    },
  },

  // Page 4–26: Heavy Duty Industrial Aluminum Ladder Tray
  LADDER_PROFILE_STANDARD: {
    id: 'LADDER_PROFILE_STANDARD',
    vendor: 'CNS/NEMA Aluminum Vendor',
    trayType: 'LADDER',
    name: 'Heavy Duty Aluminum Ladder Tray (600W x 150H)',
    nameZh: '鋁製梯型電纜線槽 重型標準 (600W x 150H)',
    width: 600,
    height: 150,
    standardLength: 3000,
    defaultRadius: 600,
    allowedRadii: [300, 600, 900],
    allowedAngles: [30, 45, 60, 90],
    tangentLength: 125,
    material: 'ALUMINUM_6063_T5',
    wallThicknessMm: 4.0,
    rungSpacingMm: 250,
    coverWidthFormula: 'W + 38',
    coverWidth: 638,
    overallWidth: 626, // W + 26
    source: {
      document: '鋁製梯型電纜線槽 (Aluminum Ladder Type Cable Tray)',
      pages: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21],
    },
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

  // Default derived parameters from profile
  const params: Record<string, any> = {
    width: profile.width,
    depth: profile.height, // Map catalog H (tray side height) to library depth
    trayStyle: profile.trayType,
  };

  // Specific fitting parameter defaults derived from profile
  switch (definitionId) {
    case 'TRAY_STRAIGHT':
    case 'TRAY_STRAIGHT_DIVIDER':
      params.length = overrides.length ?? profile.standardLength;
      if (profile.rungSpacingMm) {
        params.rungSpacing = profile.rungSpacingMm;
      }
      break;

    case 'FITTING_ELBOW_90':
    case 'FITTING_ELBOW_45':
      params.radius = overrides.radius ?? profile.defaultRadius;
      params.angleDeg = overrides.angleDeg ?? (definitionId === 'FITTING_ELBOW_45' ? 45 : 90);
      params.tangentLength = overrides.tangentLength ?? profile.tangentLength;
      break;

    case 'FITTING_RISER_IN_90':
    case 'FITTING_RISER_IN_45':
    case 'FITTING_RISER_OUT_90':
    case 'FITTING_RISER_OUT_45':
      params.radius = overrides.radius ?? profile.defaultRadius;
      params.angleDeg = overrides.angleDeg ?? (definitionId.endsWith('45') ? 45 : 90);
      params.tangentLength = overrides.tangentLength ?? profile.tangentLength;
      break;

    case 'FITTING_TEE': {
      const r = overrides.radius ?? profile.defaultRadius;
      const t = overrides.tangentLength ?? profile.tangentLength;
      params.radius = r;
      params.tangentLength = t;
      // Formula from Catalog Page 9: L = W + 2*R + 2*tangentLength
      params.length = overrides.length ?? (profile.width + 2 * r + 2 * t);
      // Branch projection: BL = W/2 + R + tangentLength
      params.branchLength = overrides.branchLength ?? (profile.width / 2 + r + t);
      break;
    }

    case 'FITTING_CROSS': {
      const r = overrides.radius ?? profile.defaultRadius;
      const t = overrides.tangentLength ?? profile.tangentLength;
      params.radius = r;
      params.tangentLength = t;
      // Formula from Catalog Page 10: Span = W + 2*R + 2*tangentLength
      params.length = overrides.length ?? (profile.width + 2 * r + 2 * t);
      break;
    }

    case 'FITTING_REDUCER_CENTER':
    case 'FITTING_REDUCER_LEFT':
    case 'FITTING_REDUCER_RIGHT': {
      params.inletWidth = overrides.inletWidth ?? profile.width;
      params.outletWidth = overrides.outletWidth ?? Math.max(100, profile.width / 2);
      params.length = overrides.length ?? 600; // Catalog standard 600mm
      params.tangentLength = overrides.tangentLength ?? 200; // Catalog standard 200mm tangent
      break;
    }

    default:
      break;
  }

  // Apply explicit overrides
  Object.assign(params, overrides);

  return new ComponentInstance(instId, def, params);
}
