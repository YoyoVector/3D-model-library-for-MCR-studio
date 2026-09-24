/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  AssumptionLevel,
  BomScope,
  ComponentOrigin,
  ComponentRole,
  type ComponentDefinition,
  type ComponentOriginType,
  type ParameterProvenance,
} from '../core/Schema.ts';
import {
  straightLayout,
  horizontalBendLayout,
  verticalBendLayout,
  teeLayout,
  crossLayout,
  reducerLayout,
  type TrayLayout,
  type ReducerType,
} from '../geometry/TrayLayouts.ts';
import { buildTrayLayoutGroup } from '../geometry/TrayMeshBuilder.ts';

/**
 * Cable tray & fitting component families.
 *
 * Each family is ONE layout function (TrayLayouts.ts). The ComponentDefinition's
 * getLocalPorts / getCenterlineRoutes / getBounds / buildGeometry all read the same layout,
 * so the four can never disagree.
 *
 * Default parameters here are GENERIC library defaults (DEMO_DEFAULT) — they are not vendor
 * values. Catalog-true dimensions come from TraySystemProfiles via createComponentFromProfile().
 */

interface TrayMeta {
  id: string;
  name: string;
  nameZh: string;
  family: 'TRAY' | 'FITTING';
  origin: ComponentOriginType;
  description: string;
}

const GENERIC_NOTE = 'Generic library default, not a vendor value. Apply a TraySystemProfile for catalog-true dimensions.';

function generic(source: string, notes = GENERIC_NOTE): ParameterProvenance {
  return { source, assumptionLevel: AssumptionLevel.DEMO_DEFAULT, notes };
}

const COMMON_PROVENANCE: Record<string, ParameterProvenance> = {
  width: generic('Generic nominal width W'),
  depth: generic('Generic side rail height H (vendor ladder catalog H = 150 mm, PDF p.4)'),
  trayStyle: generic('Tray style (LADDER | VENTILATED_THROUGH)'),
};

const RADIUS_PROVENANCE: ParameterProvenance = {
  source: 'Vendor catalog radius definition (PDF p.5 dimension chain "W | R | 125", p.11 cover "R−2", p.13 chain "125 | R | H")',
  assumptionLevel: AssumptionLevel.DEMO_DEFAULT,
  notes:
    'Value is a generic default. SEMANTICS (verified): radius = catalog inner radius R. ' +
    'Horizontal centerline radius = R + W/2; vertical centerline radius = R + H/2.',
};

const TANGENT_PROVENANCE: ParameterProvenance = {
  source: 'Vendor catalog 125 mm tangent at every bend / tee / cross end (PDF p.5–18)',
  assumptionLevel: AssumptionLevel.DEMO_DEFAULT,
  notes: 'Generic default 0 keeps the legacy pure-arc shape; vendor profiles set 125 mm.',
};

function withDefaults(defaults: Record<string, any>, params: Record<string, any>): Record<string, any> {
  return { ...defaults, ...params };
}

function defineTrayComponent(
  meta: TrayMeta,
  defaultParameters: Record<string, any>,
  provenance: Record<string, ParameterProvenance>,
  layoutOf: (params: Record<string, any>) => TrayLayout
): ComponentDefinition {
  const resolve = (params: Record<string, any>) => layoutOf(withDefaults(defaultParameters, params));
  return {
    schemaVersion: '2.0.0',
    componentVersion: '2.0.0',
    id: meta.id,
    name: meta.name,
    nameZh: meta.nameZh,
    family: meta.family,
    origin: meta.origin,
    role: meta.family === 'TRAY' ? ComponentRole.TRAY : ComponentRole.FITTING,
    description: meta.description,
    hasBomMetadata: true,
    bomScope: BomScope.MCR_CABLE_TRAY_BOM,
    includedInMcrBom: true,
    defaultParameters,
    provenance: { ...COMMON_PROVENANCE, ...provenance },
    getLocalPorts: (params) => resolve(params).ports,
    getCenterlineRoutes: (params) => resolve(params).routes,
    getBounds: (params) => resolve(params).bounds,
    buildGeometry: (params, options) => {
      const p = withDefaults(defaultParameters, params);
      return buildTrayLayoutGroup(layoutOf(p), { ...options, isIS: !!p.isIS });
    },
    getEngineeringDimensions: (params) => resolve(params).dims,
  };
}

// ---------------------------------------------------------------------------
// Straight trays
// ---------------------------------------------------------------------------

export function straightTrayDefinition(): ComponentDefinition {
  return defineTrayComponent(
    {
      id: 'TRAY_STRAIGHT',
      name: 'Straight Cable Tray',
      nameZh: '直式線槽 (直通托架)',
      family: 'TRAY',
      origin: ComponentOrigin.LEGACY_FITTING_LIBRARY,
      description: 'Straight ladder / ventilated-through cable tray (vendor PDF p.4, p.30, p.41). Rungs at 125 + 250·k mm.',
    },
    { width: 600, depth: 100, length: 3000, rungSpacing: 250, trayStyle: 'LADDER', hasSplicePlates: false },
    {
      length: generic('Standard 3 m manufactured segment (vendor catalog L = 3000, PDF p.4)'),
      rungSpacing: generic('Rung pitch 250 mm (vendor PDF p.4)'),
      hasSplicePlates: generic('Optional accessory visual; excluded from tray body, bounds and mate checks'),
    },
    straightLayout
  );
}

export function dividedStraightTrayDefinition(): ComponentDefinition {
  return defineTrayComponent(
    {
      id: 'TRAY_STRAIGHT_DIVIDER',
      name: 'Divided Straight Tray (IS & Non-IS)',
      nameZh: '隔板分流直式線槽',
      family: 'TRAY',
      origin: ComponentOrigin.LEGACY_FITTING_LIBRARY,
      description: 'Straight tray with a central separator plate (vendor PDF p.25) isolating IS signal cables from power.',
    },
    { width: 600, depth: 100, length: 3000, rungSpacing: 250, trayStyle: 'LADDER', dividerHeight: 80, hasDivider: true },
    {
      dividerHeight: generic('Separator plate height (vendor p.25 shows 100 mm plate)'),
    },
    straightLayout
  );
}

// ---------------------------------------------------------------------------
// Horizontal elbows
// ---------------------------------------------------------------------------

export function horizontalElbowDefinition(
  id: string,
  angleDeg: number,
  origin: ComponentOriginType,
  pages: string
): ComponentDefinition {
  return defineTrayComponent(
    {
      id,
      name: `Horizontal Elbow ${angleDeg}°`,
      nameZh: `水平 L 形 ${angleDeg}° 彎頭`,
      family: 'FITTING',
      origin,
      description: `Horizontal ${angleDeg}° bend (vendor ${pages}). Catalog R = inner rail radius; centerline radius R + W/2; optional 125 mm tangents.`,
    },
    { width: 600, depth: 100, radius: 300, angleDeg, tangentLength: 0, trayStyle: 'LADDER' },
    {
      radius: RADIUS_PROVENANCE,
      angleDeg: generic(`Nominal ${angleDeg}° sweep (any angle supported)`),
      tangentLength: TANGENT_PROVENANCE,
    },
    (p) => horizontalBendLayout(p, angleDeg)
  );
}

// ---------------------------------------------------------------------------
// Vertical bends
// ---------------------------------------------------------------------------

export function verticalBendDefinition(
  id: string,
  angleDeg: number,
  isOutside: boolean,
  origin: ComponentOriginType,
  pages: string
): ComponentDefinition {
  const kind = isOutside ? 'Outside' : 'Inside';
  return defineTrayComponent(
    {
      id,
      name: `Vertical ${kind} Elbow ${angleDeg}°`,
      nameZh: isOutside ? `垂直下降 ${angleDeg}° 彎頭` : `垂直上升 ${angleDeg}° 彎頭`,
      family: 'FITTING',
      origin,
      description: isOutside
        ? `Vertical outside (falling) ${angleDeg}° bend (vendor ${pages}). Catalog R at the tray bottom; cover side at R + H.`
        : `Vertical inside (rising) ${angleDeg}° bend (vendor ${pages}). Catalog R at the rail-top / cover side; tray bottom at R + H.`,
    },
    { width: 600, depth: 100, radius: 300, angleDeg, tangentLength: 0, trayStyle: 'LADDER' },
    {
      radius: RADIUS_PROVENANCE,
      angleDeg: generic(`Nominal ${angleDeg}° elevation change (any angle supported)`),
      tangentLength: TANGENT_PROVENANCE,
    },
    (p) => verticalBendLayout(p, angleDeg, isOutside)
  );
}

// ---------------------------------------------------------------------------
// Tee / Cross
// ---------------------------------------------------------------------------

export function teeDefinition(): ComponentDefinition {
  return defineTrayComponent(
    {
      id: 'FITTING_TEE',
      name: 'Horizontal Tee',
      nameZh: '水平 T 形彎頭 (三通)',
      family: 'FITTING',
      origin: ComponentOrigin.LEGACY_FITTING_LIBRARY,
      description:
        'Horizontal tee with radius-R curved transitions into the branch (vendor PDF p.9). ' +
        'Main span W + 2R + 2T, branch projection W/2 + R + T.',
    },
    // Generic defaults reproduce the legacy 1400 mm main run / 700 mm branch (W600, R300, T100).
    { width: 600, depth: 100, radius: 300, tangentLength: 100, trayStyle: 'LADDER' },
    {
      radius: RADIUS_PROVENANCE,
      tangentLength: TANGENT_PROVENANCE,
    },
    teeLayout
  );
}

export function crossDefinition(): ComponentDefinition {
  return defineTrayComponent(
    {
      id: 'FITTING_CROSS',
      name: 'Horizontal Cross',
      nameZh: '水平 X 形彎頭 (四通)',
      family: 'FITTING',
      origin: ComponentOrigin.NEW_COMPONENT,
      description:
        'Horizontal cross with four radius-R curved corners (vendor PDF p.10). Span W + 2R + 2T on both axes; ' +
        'straight routes A↔B, D↔C and turning routes A↔C, A↔D, B↔C, B↔D.',
    },
    { width: 600, depth: 100, radius: 300, tangentLength: 125, trayStyle: 'LADDER' },
    {
      radius: RADIUS_PROVENANCE,
      tangentLength: TANGENT_PROVENANCE,
    },
    crossLayout
  );
}

// ---------------------------------------------------------------------------
// Reducers
// ---------------------------------------------------------------------------

export function reducerDefinition(
  id: string,
  type: ReducerType,
  meta: { name: string; nameZh: string; page: string }
): ComponentDefinition {
  const shape =
    type === 'CONCENTRIC'
      ? 'both rails taper symmetrically'
      : type === 'LEFT'
        ? 'the LEFT rail stays straight (viewed from the wide end toward the narrow end)'
        : 'the RIGHT rail stays straight (viewed from the wide end toward the narrow end)';
  return defineTrayComponent(
    {
      id,
      name: meta.name,
      nameZh: meta.nameZh,
      family: 'FITTING',
      origin: ComponentOrigin.NEW_COMPONENT,
      description: `Reducer from W1 to W2 (vendor ${meta.page}): ${shape}. Catalog shape 200 straight + 200 taper + 200 straight = 600 mm.`,
    },
    // Straight ends are required for a clean connection face (a rail tapering right at the port
    // cannot match a straight tray's face), so the generic default keeps 100 mm straights.
    { inletWidth: 600, outletWidth: 450, depth: 100, length: 500, tangentLength: 100, trayStyle: 'LADDER' },
    {
      inletWidth: generic('Wide end W1'),
      outletWidth: generic('Narrow end W2'),
      length: generic('Generic 500 mm reducer (vendor catalog: 600 mm, PDF p.19–21)'),
      tangentLength: generic('Straight sections at both ends (vendor catalog: 200 mm; 0 = legacy linear taper)'),
    },
    (p) => reducerLayout(p, type)
  );
}
