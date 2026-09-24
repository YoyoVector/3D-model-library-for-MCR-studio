/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  ComponentRegistry,
  TraySystemProfiles,
  resolveProfileParameters,
  trayFamilyOf,
  printedPageOf,
  getComponentSubCategory,
  SUB_CATEGORY_NAMES,
  type ComponentDefinition,
  type ComponentSubCategory,
  type TraySystemProfile,
  type CatalogValidationStatus,
} from '../index.ts';

/** Active profile of the viewer: one of the vendor profiles or the generic library. */
export type ProfileKey = 'LADDER_PROFILE_STANDARD' | 'VENTILATED_PROFILE_A' | 'VENTILATED_PROFILE_B' | 'GENERIC';

export const PROFILE_KEYS: ProfileKey[] = ['LADDER_PROFILE_STANDARD', 'VENTILATED_PROFILE_A', 'VENTILATED_PROFILE_B', 'GENERIC'];

export function profileOf(key: ProfileKey): TraySystemProfile | undefined {
  return key === 'GENERIC' ? undefined : TraySystemProfiles.get(key);
}

export function profileShortName(key: ProfileKey): string {
  switch (key) {
    case 'LADDER_PROFILE_STANDARD':
      return 'Ladder';
    case 'VENTILATED_PROFILE_A':
      return 'Ventilated A';
    case 'VENTILATED_PROFILE_B':
      return 'Ventilated B';
    default:
      return 'Generic';
  }
}

export function profileShortNameZh(key: ProfileKey): string {
  switch (key) {
    case 'LADDER_PROFILE_STANDARD':
      return '梯型';
    case 'VENTILATED_PROFILE_A':
      return '沖底型 A';
    case 'VENTILATED_PROFILE_B':
      return '沖底型 B';
    default:
      return '通用參數';
  }
}

/** "SECXXX / Ladder / 600W × 150H" — uses the effective width / height when given. */
export function profileHeadline(key: ProfileKey, width?: number, height?: number): string {
  const p = profileOf(key);
  if (!p) return 'GENERIC LIBRARY (not a vendor profile)';
  return `${p.vendor} / ${profileShortName(key)} / ${width ?? p.width}W × ${height ?? p.height}H`;
}

export interface ComponentGroup {
  key: ComponentSubCategory;
  title: string;
  items: ComponentDefinition[];
}

/** Components offered under a profile, grouped by engineering type. */
export function componentGroupsFor(key: ProfileKey): ComponentGroup[] {
  const p = profileOf(key);
  const defs = ComponentRegistry.getAll().filter((d) => (p ? TraySystemProfiles.supports(p, d.id) : true));
  const order: ComponentSubCategory[] = ['STRAIGHT', 'ELBOW', 'BRANCH', 'RISER', 'REDUCER', 'ACCESSORY', 'STRUCTURAL', 'EQUIPMENT', 'OBSTACLE'];
  return order
    .map((k) => ({ key: k, title: SUB_CATEGORY_NAMES[k], items: defs.filter((d) => getComponentSubCategory(d.id) === k) }))
    .filter((g) => g.items.length > 0);
}

/** Initial effective parameters of a component under a profile. */
export function initialParams(defId: string, key: ProfileKey): Record<string, any> {
  const def = ComponentRegistry.get(defId);
  if (!def) return {};
  const p = profileOf(key);
  if (!p || !TraySystemProfiles.supports(p, defId)) return { ...def.defaultParameters };
  return { ...def.defaultParameters, ...resolveProfileParameters(defId, p) };
}

export type DisplayStatus = CatalogValidationStatus | 'NOT_IN_CATALOG';

export interface ValidationInfo {
  status: DisplayStatus;
  label: string;
  /** 'ok' | 'info' | 'warn' | 'bad' | 'neutral' — colour tone of the badge. */
  tone: 'ok' | 'info' | 'warn' | 'bad' | 'neutral';
  vendor?: string;
  document?: string;
  pdfPages?: number[];
  printedPages?: number[];
  notes: string[];
}

const STATUS_LABEL: Record<DisplayStatus, string> = {
  CATALOG_VERIFIED: 'CATALOG VERIFIED',
  ENGINEERING_DERIVED: 'ENGINEERING DERIVED',
  VISUAL_APPROXIMATION: 'VISUAL APPROXIMATION',
  GENERIC: 'GENERIC',
  UNVERIFIED: 'UNVERIFIED',
  NOT_IN_CATALOG: 'NOT IN CATALOG',
};

const STATUS_TONE: Record<DisplayStatus, ValidationInfo['tone']> = {
  CATALOG_VERIFIED: 'ok',
  ENGINEERING_DERIVED: 'info',
  VISUAL_APPROXIMATION: 'warn',
  GENERIC: 'neutral',
  UNVERIFIED: 'warn',
  NOT_IN_CATALOG: 'bad',
};

function info(status: DisplayStatus, extra: Partial<ValidationInfo> = {}): ValidationInfo {
  return { status, label: STATUS_LABEL[status], tone: STATUS_TONE[status], notes: [], ...extra };
}

/**
 * Validation status of the component as currently parameterised. Vendor status is only kept
 * while every catalog-controlled parameter still has a catalog value.
 */
export function validationOf(defId: string, key: ProfileKey, params: Record<string, any>): ValidationInfo {
  const p = profileOf(key);
  if (!p) {
    return info('GENERIC', { notes: ['Library default parameters — not a vendor value. Select a vendor profile for catalog-true geometry.'] });
  }
  const support = TraySystemProfiles.getSupport(p, defId);
  if (!support) {
    return info('NOT_IN_CATALOG', { vendor: p.vendor, document: p.source.document, notes: [`${defId} is not offered in this vendor series.`] });
  }

  const notes: string[] = support.notes ? [support.notes] : [];
  const deviations: string[] = [];
  const family = trayFamilyOf(defId);
  const num = (v: any) => Number(v);
  if (family === 'REDUCER') {
    if (!p.allowedWidths.includes(num(params.inletWidth))) deviations.push(`W1 ${params.inletWidth}`);
    if (!p.allowedWidths.includes(num(params.outletWidth)) || num(params.outletWidth) >= num(params.inletWidth)) deviations.push(`W2 ${params.outletWidth}`);
    if (num(params.length) !== p.reducerLength) deviations.push(`L ${params.length}`);
    if (num(params.tangentLength) !== p.reducerTangentLength) deviations.push(`T ${params.tangentLength}`);
  } else {
    if (!p.allowedWidths.includes(num(params.width))) deviations.push(`W ${params.width}`);
  }
  if (num(params.depth) !== p.height) deviations.push(`H ${params.depth}`);
  if ((params.trayStyle ?? 'LADDER') !== p.trayType) deviations.push(`style ${params.trayStyle}`);
  if (family === 'H_BEND' || family === 'V_BEND' || family === 'TEE' || family === 'CROSS') {
    if (!p.allowedRadii.includes(num(params.radius))) deviations.push(`R ${params.radius}`);
    if (num(params.tangentLength) !== p.tangentLength) deviations.push(`T ${params.tangentLength}`);
  }
  if (family === 'STRAIGHT' && num(params.length) !== p.standardLength) {
    notes.push(`Field-cut length ${params.length} mm (catalog standard ${p.standardLength} mm).`);
  }

  const base = {
    vendor: p.vendor,
    document: p.source.document,
    pdfPages: support.pages,
    printedPages: support.pages.map((pg) => printedPageOf(p.source, pg)),
  };
  if (deviations.length > 0) {
    return info('ENGINEERING_DERIVED', { ...base, notes: [`Non-catalog value: ${deviations.join(', ')} — geometry follows the catalog formula but the size is not listed.`, ...notes] });
  }
  return info(support.status, { ...base, notes });
}

export interface KeyParam {
  label: string;
  value: string;
  hint?: string;
}

const mm = (v: unknown) => (typeof v === 'number' && Number.isFinite(v) ? `${Number(v.toFixed(1))} mm` : '—');

/** Main engineering parameters for the info card (from the same formula as the geometry). */
export function keyParamsOf(def: ComponentDefinition, params: Record<string, any>): KeyParam[] {
  const d = def.getEngineeringDimensions?.({ ...def.defaultParameters, ...params });
  const family = trayFamilyOf(def.id);
  if (!d) {
    return Object.entries(params)
      .filter(([, v]) => typeof v === 'number')
      .slice(0, 6)
      .map(([k, v]) => ({ label: k, value: String(v) }));
  }
  const style = d.style === 'VENTILATED_THROUGH' ? 'Ventilated-through' : 'Ladder';
  const out: KeyParam[] = [];
  if (family === 'REDUCER') {
    out.push({ label: 'W1 → W2', value: `${d.inletWidth} → ${d.outletWidth} mm` });
    out.push({ label: 'H', value: mm(d.height) });
    out.push({ label: 'Length', value: mm(d.length), hint: `${d.tangentLength} + ${d.transitionLength} + ${d.tangentLength}` });
    out.push({ label: 'Offset', value: mm(d.lateralOffset), hint: String(d.reducerType) });
  } else {
    out.push({ label: 'W', value: mm(d.width) });
    out.push({ label: 'H', value: mm(d.height) });
    if (family === 'STRAIGHT') {
      out.push({ label: 'Length', value: mm(d.length) });
      out.push({ label: 'Overall', value: mm(d.overallWidth), hint: 'W + rail flanges' });
    } else {
      out.push({ label: 'R (inner)', value: mm(d.catalogRadius) });
      if (d.angleDeg !== undefined) out.push({ label: 'Angle', value: `${d.angleDeg}°` });
      out.push({ label: 'Tangent', value: mm(d.tangentLength) });
      out.push({ label: family === 'V_BEND' ? 'CL R (R+H/2)' : 'CL R (R+W/2)', value: mm(d.centerlineRadius) });
      if (family === 'TEE') {
        out.push({ label: 'Main span', value: mm(d.mainSpan) });
        out.push({ label: 'Branch', value: mm(d.branchProjection) });
      }
      if (family === 'CROSS') out.push({ label: 'Span', value: mm(d.span) });
    }
  }
  out.push({ label: 'Style', value: style });
  return out;
}

/** Engineering dimension rows (full list) for the parameter panel. */
export function allDimensionsOf(def: ComponentDefinition, params: Record<string, any>): Array<[string, string]> {
  const d = def.getEngineeringDimensions?.({ ...def.defaultParameters, ...params });
  if (!d) return [];
  return Object.entries(d).map(([k, v]) => [k, typeof v === 'number' ? String(Number(v.toFixed(3))) : String(v)]);
}
