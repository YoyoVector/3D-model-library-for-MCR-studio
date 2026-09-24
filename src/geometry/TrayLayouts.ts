/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import type {
  ConnectionPortDefinition,
  CenterlineRouteDefinition,
  ComponentBoundsDefinition,
} from '../core/Schema.ts';
import {
  type Vec3,
  type TurtlePath,
  type PathFrame,
  type SectionRect,
  vec,
  samplePath,
  pathEndFrame,
  pathLength,
  frameAtLength,
  sectionPoint,
  sideOf,
  BoundsAccumulator,
} from './SweepPath.ts';

/**
 * ============================================================================
 * Tray Engineering Layouts — the single engineering formula layer.
 * ============================================================================
 *
 * Every cable tray / fitting is resolved ONCE from its effective parameters into a
 * `TrayLayout`. Ports, centerline routes, bounds and the 3D mesh are all read from that
 * same object, so Geometry / Ports / Centerline / Bounds cannot drift apart.
 *
 * Parameter semantics (vendor catalog "鋁製電纜線槽", PDF pages 4–47):
 *   width  (W) : nominal tray width — the dimension line the catalog calls W.
 *   depth  (H) : side rail height (catalog H).
 *   radius (R) : catalog bend radius R = INNER radius of the bend
 *                - horizontal bends / tee / cross: to the inner side rail (p.5 chain "W | R | 125", cover "R−19")
 *                - vertical inside bends: to the rail-top / cover side (p.11 cover "R−2")
 *                - vertical outside bends: to the tray bottom (p.13 chain "125 | R | H")
 *   tangentLength (T): straight extension at each fitting end (catalog 125 mm; reducers 200 mm).
 *
 * Derived radii (one derivation, used everywhere):
 *   horizontal: centerlineRadius = R + W/2, outerRailRadius = R + W
 *   vertical:   centerlineRadius = R + H/2, outerRadius     = R + H
 *
 * Port convention: a TRAY_END port sits on the connection face at the centre of the tray
 * section (mid-width, mid-height); `localDirection` points outward, `localUp` points from the
 * tray bottom toward the open / cover side. All body geometry lies behind every port plane.
 * ============================================================================
 */

export type TrayStyle = 'LADDER' | 'VENTILATED_THROUGH';

export type TrayFamily = 'STRAIGHT' | 'HORIZONTAL_BEND' | 'VERTICAL_BEND' | 'TEE' | 'CROSS' | 'REDUCER';

export type ReducerType = 'CONCENTRIC' | 'LEFT' | 'RIGHT';

/** Rectangle of a rail section relative to the rail reference line: `out` > 0 = away from tray interior. */
export interface RailRect {
  out: [number, number];
  up: [number, number];
  role: 'WEB' | 'FLANGE' | 'WALL' | 'LIP';
}

export interface TraySection {
  style: TrayStyle;
  width: number;
  height: number;
  railRects: RailRect[];
  /** Ventilated-through floor plate (absent for ladder). */
  floor?: { up: [number, number] };
  /** Ladder rung (absent for ventilated). */
  rung?: { thickness: number; up: [number, number]; spacing: number };
  /** Rail inner face inset from the reference line (rung / divider stop). */
  innerInset: number;
  /** Body extent beyond the W reference line (ladder 13 mm → overall W+26). */
  outerOverhang: number;
}

export interface RungSpec {
  position: Vec3;
  tangent: Vec3;
  up: Vec3;
  /** Extent along the frame side axis, relative to `position`. */
  side: [number, number];
  /** Extent along the frame up axis, relative to `position`. */
  upRange: [number, number];
  thickness: number;
}

export interface SweepSpec {
  path: TurtlePath;
  rects: SectionRect[];
  part: 'RAIL' | 'FLOOR' | 'DIVIDER' | 'ACCESSORY';
}

export interface FloorSpec {
  /** Closed plan outline, (x, z) pairs in mm. */
  outline: Array<[number, number]>;
  y: [number, number];
}

export interface TrayLayout {
  family: TrayFamily;
  section: TraySection;
  /** Resolved engineering dimensions (mm / deg) — shown in the viewer and used by tests. */
  dims: Record<string, number | string>;
  ports: ConnectionPortDefinition[];
  routes: CenterlineRouteDefinition[];
  sweeps: SweepSpec[];
  rungs: RungSpec[];
  floors: FloorSpec[];
  /** Small accessories (splice plates). Visual only: excluded from bounds and connection checks. */
  accessories: SweepSpec[];
  bounds: ComponentBoundsDefinition;
}

// ---------------------------------------------------------------------------
// Section constants (vendor catalog)
// ---------------------------------------------------------------------------

/**
 * Ladder side rail (PDF p.4 Detail A): I-profile, web 4.0t, flange 30, overall tray width W+26.
 * The flange extends 13 mm outward of the W line (W+26 overall; cover W+38 overhangs 6 mm, which
 * also matches the elbow cover inner edge R−19 = R−13−6). Web position inside the flange is
 * ENGINEERING_DERIVED (visual only; not a routing dimension).
 * Rung (p.4 RUNG): 50 wide × 25 high, pitch 250, first rung 125 from the tray end.
 */
export const LADDER_SECTION_CONSTANTS = {
  webThickness: 4,
  flangeWidth: 30,
  flangeThickness: 4,
  outerOverhang: 13,
  rungWidth: 50,
  rungHeight: 25,
  rungPitch: 250,
} as const;

/**
 * Ventilated-through channel (PDF p.30 / p.41): formed 2.0 mm sheet, W is the outer width,
 * inward top return lip 10 mm (100W×50H, p.30) / 15 mm (300W×100H, p.41).
 */
export const VENTILATED_SECTION_CONSTANTS = {
  sheetThickness: 2,
  lipSmall: 10,
  lipLarge: 15,
} as const;

// ---------------------------------------------------------------------------
// Parameter helpers
// ---------------------------------------------------------------------------

function toNumber(v: unknown): number | undefined {
  if (typeof v === 'number' && Number.isFinite(v)) return v;
  if (typeof v === 'string' && v.trim() !== '' && Number.isFinite(Number(v))) return Number(v);
  return undefined;
}

function positive(v: unknown, def: number): number {
  const n = toNumber(v);
  return n !== undefined && n > 0 ? n : def;
}

function nonNegative(v: unknown, def: number): number {
  const n = toNumber(v);
  return n !== undefined && n >= 0 ? n : def;
}

function finiteOr(v: unknown, def: number): number {
  const n = toNumber(v);
  return n !== undefined ? n : def;
}

/**
 * Catalog inner radius R from the `radius` parameter. Migration aid: legacy callers that passed a
 * CENTERLINE radius can set `radiusReference: 'CENTERLINE'`; R is then radius − halfSection
 * (W/2 for horizontal bends / tee / cross, H/2 for vertical bends). Default: catalog inner radius.
 */
function catalogInnerRadius(params: Record<string, any>, halfSection: number): number {
  const r = positive(params.radius, 300);
  if (params.radiusReference === 'CENTERLINE') return Math.max(1, r - halfSection);
  return r;
}

export function normalizeTrayStyle(v: unknown): TrayStyle {
  if (typeof v === 'string' && v.toUpperCase().startsWith('VENTILATED')) return 'VENTILATED_THROUGH';
  return 'LADDER';
}

export function resolveTraySection(params: Record<string, any>, widthOverride?: number): TraySection {
  const style = normalizeTrayStyle(params.trayStyle);
  const width = widthOverride ?? positive(params.width, 600);
  const height = positive(params.depth, 100);
  const h2 = height / 2;

  if (style === 'VENTILATED_THROUGH') {
    const t = VENTILATED_SECTION_CONSTANTS.sheetThickness;
    const lip = positive(
      params.lipWidth,
      height >= 100 ? VENTILATED_SECTION_CONSTANTS.lipLarge : VENTILATED_SECTION_CONSTANTS.lipSmall
    );
    return {
      style,
      width,
      height,
      railRects: [
        { out: [-t, 0], up: [-h2 + t, h2], role: 'WALL' },
        { out: [-lip, -t], up: [h2 - t, h2], role: 'LIP' },
      ],
      floor: { up: [-h2, -h2 + t] },
      innerInset: t,
      outerOverhang: 0,
    };
  }

  const c = LADDER_SECTION_CONSTANTS;
  const webOut: [number, number] = [c.outerOverhang - c.flangeWidth / 2 - c.webThickness / 2, c.outerOverhang - c.flangeWidth / 2 + c.webThickness / 2];
  const flangeOut: [number, number] = [c.outerOverhang - c.flangeWidth, c.outerOverhang];
  return {
    style,
    width,
    height,
    railRects: [
      { out: flangeOut, up: [-h2, -h2 + c.flangeThickness], role: 'FLANGE' },
      { out: webOut, up: [-h2 + c.flangeThickness, h2 - c.flangeThickness], role: 'WEB' },
      { out: flangeOut, up: [h2 - c.flangeThickness, h2], role: 'FLANGE' },
    ],
    rung: {
      thickness: c.rungWidth,
      up: [-h2 + c.flangeThickness, -h2 + c.flangeThickness + c.rungHeight],
      spacing: positive(params.rungSpacing, c.rungPitch),
    },
    innerInset: -webOut[0],
    outerOverhang: c.outerOverhang,
  };
}

/** Physical face envelope of a tray end in port (right, up) coordinates. */
export function faceOf(section: TraySection, width: number) {
  return {
    style: section.style,
    halfWidth: width / 2 + section.outerOverhang,
    minUp: -section.height / 2,
    maxUp: section.height / 2,
  };
}

// ---------------------------------------------------------------------------
// Builders shared by all families
// ---------------------------------------------------------------------------

function portFromFrame(
  id: string,
  name: string,
  frame: PathFrame,
  atPathStart: boolean,
  width: number,
  section: TraySection
): ConnectionPortDefinition {
  const dir = atPathStart ? vec.scale(frame.tangent, -1) : frame.tangent;
  return {
    id,
    name,
    localPosition: vec.clean(frame.position),
    localDirection: vec.clean(vec.normalize(dir)),
    localUp: vec.clean(vec.normalize(frame.up)),
    width,
    depth: section.height,
    connectionType: 'TRAY_END',
    connectionFace: faceOf(section, width),
  };
}

function routeFromPath(
  id: string,
  fromPort: string,
  toPort: string,
  path: TurtlePath,
  type: CenterlineRouteDefinition['type']
): CenterlineRouteDefinition {
  const samples = samplePath(path, { maxLineStep: 250, maxArcStepRad: (3 * Math.PI) / 180 });
  return {
    id,
    fromPort,
    toPort,
    type,
    analyticLength: pathLength(path),
    samplePoints: samples.map((s) => vec.clean(s.position)),
  };
}

/** Rail rects of a rail whose reference line is the path itself; outward = k * side. */
function railRectsOnPath(section: TraySection, k: 1 | -1, offset = 0): SectionRect[] {
  return section.railRects.map((r) => {
    const a = offset + k * r.out[0];
    const b = offset + k * r.out[1];
    return { side: [Math.min(a, b), Math.max(a, b)] as [number, number], up: r.up };
  });
}

/** Full tray section (both rails + ventilated floor) swept along a centerline path. */
function centerlineSweeps(path: TurtlePath, section: TraySection): SweepSpec[] {
  const w2 = section.width / 2;
  const rails = [...railRectsOnPath(section, 1, w2), ...railRectsOnPath(section, -1, -w2)];
  const sweeps: SweepSpec[] = [{ path, rects: rails, part: 'RAIL' }];
  if (section.floor) {
    sweeps.push({ path, rects: [{ side: [-w2, w2], up: section.floor.up }], part: 'FLOOR' });
  }
  return sweeps;
}

function rungAtFrame(frame: PathFrame, side: [number, number], section: TraySection): RungSpec {
  return {
    position: frame.position,
    tangent: vec.normalize(frame.tangent),
    up: vec.normalize(frame.up),
    side,
    upRange: section.rung!.up,
    thickness: section.rung!.thickness,
  };
}

/** Evenly spaced stations in [a, b] with spacing <= pitch (at least one station). */
function evenStations(a: number, b: number, pitch: number): number[] {
  if (b - a <= 1e-6) return [(a + b) / 2];
  const n = Math.max(1, Math.round((b - a) / pitch));
  return Array.from({ length: n + 1 }, (_, i) => a + ((b - a) * i) / n);
}

/**
 * End margin for rungs on a fitting centerline so the rung body stays behind the port plane.
 * On a tangent: rung centred in the tangent (catalog 125 → 62.5). On an arc (short tangent):
 * the rung's innermost corner must clear the port plane.
 */
function rungEndMargin(tangent: number, thickness: number, arcRc: number, rMin: number): number {
  const half = thickness / 2;
  if (tangent / 2 >= half + 1) return Math.min(tangent / 2, 62.5);
  const arcMargin = rMin > 0 ? 1 + (half * arcRc) / rMin : half + 1;
  return Math.max(half + 1, arcMargin);
}

function computeBounds(sweeps: SweepSpec[], rungs: RungSpec[], floors: FloorSpec[]): ComponentBoundsDefinition {
  const acc = new BoundsAccumulator();
  sweeps.forEach((sw) => {
    const stations = samplePath(sw.path);
    stations.forEach((st) => {
      sw.rects.forEach((r) => {
        acc.add(sectionPoint(st, r.side[0], r.up[0]));
        acc.add(sectionPoint(st, r.side[1], r.up[0]));
        acc.add(sectionPoint(st, r.side[0], r.up[1]));
        acc.add(sectionPoint(st, r.side[1], r.up[1]));
      });
    });
  });
  rungs.forEach((r) => rungCorners(r).forEach((p) => acc.add(p)));
  floors.forEach((f) =>
    f.outline.forEach(([x, z]) => {
      acc.add([x, f.y[0], z]);
      acc.add([x, f.y[1], z]);
    })
  );
  const b = acc.result();
  return { min: b.min, max: b.max };
}

/** 8 corners of a rung box. */
export function rungCorners(r: RungSpec): Vec3[] {
  const side = sideOf({ tangent: r.tangent, up: r.up });
  const out: Vec3[] = [];
  for (const t of [-r.thickness / 2, r.thickness / 2]) {
    for (const s of r.side) {
      for (const u of r.upRange) {
        out.push(vec.combine([r.position, 1], [r.tangent, t], [side, s], [r.up, u]));
      }
    }
  }
  return out;
}

function planOutline(path: TurtlePath, reverse = false): Array<[number, number]> {
  const pts = samplePath(path).map((s) => [s.position[0], s.position[2]] as [number, number]);
  return reverse ? pts.reverse() : pts;
}

function splicePlateAccessories(path: TurtlePath, section: TraySection, length: number): SweepSpec[] {
  // Catalog p.22 straight tray connector: 160 long, H−10 high, 4.0t, bolted to the outer web face.
  const plateLen = 160;
  const plateT = 4;
  const w2 = section.width / 2;
  const outerWebFace = section.style === 'LADDER' ? section.railRects.find((r) => r.role === 'WEB')!.out[1] : 0;
  const hh = (section.height - 10) / 2;
  const end = pathEndFrame(path);
  const start: PathFrame = {
    position: vec.add(end.position, vec.scale(end.tangent, -plateLen / 2)),
    tangent: end.tangent,
    up: end.up,
  };
  const p: TurtlePath = { start, segments: [{ kind: 'LINE', length: Math.min(plateLen, length + plateLen / 2) }] };
  const a = w2 + outerWebFace;
  return [
    {
      path: p,
      rects: [
        { side: [a, a + plateT], up: [-hh, hh] },
        { side: [-a - plateT, -a], up: [-hh, hh] },
      ],
      part: 'ACCESSORY',
    },
  ];
}

function finish(
  family: TrayFamily,
  section: TraySection,
  dims: TrayLayout['dims'],
  ports: ConnectionPortDefinition[],
  routes: CenterlineRouteDefinition[],
  sweeps: SweepSpec[],
  rungs: RungSpec[],
  floors: FloorSpec[],
  accessories: SweepSpec[] = []
): TrayLayout {
  return {
    family,
    section,
    dims,
    ports,
    routes,
    sweeps,
    rungs,
    floors,
    accessories,
    bounds: computeBounds(sweeps, rungs, floors),
  };
}

// ---------------------------------------------------------------------------
// STRAIGHT (PDF p.4 ladder, p.30 / p.41 ventilated)
// ---------------------------------------------------------------------------

export function straightLayout(params: Record<string, any>): TrayLayout {
  const section = resolveTraySection(params);
  const W = section.width;
  const L = positive(params.length, 3000);
  const path: TurtlePath = {
    start: { position: [0, 0, -L / 2], tangent: [0, 0, 1], up: [0, 1, 0] },
    segments: [{ kind: 'LINE', length: L }],
  };
  const sweeps = centerlineSweeps(path, section);

  if (params.hasDivider) {
    // Catalog p.25 separator plate, 4.0t, standing on the rungs / floor.
    const base = section.rung ? section.rung.up[1] : section.floor!.up[1];
    const h = Math.max(1, Math.min(positive(params.dividerHeight, 80), section.height / 2 - base));
    sweeps.push({ path, rects: [{ side: [-2, 2], up: [base, base + h] }], part: 'DIVIDER' });
  }

  const rungs: RungSpec[] = [];
  if (section.rung) {
    const pitch = section.rung.spacing;
    const half = section.rung.thickness / 2;
    const first = Math.min(pitch / 2, L / 2);
    const inner = W / 2 - section.innerInset;
    for (let s = first; s <= L - half - 0.5 + 1e-9; s += pitch) {
      rungs.push(rungAtFrame(frameAtLength(path, s), [-inner, inner], section));
    }
  }

  const accessories = params.hasSplicePlates === true ? splicePlateAccessories(path, section, L) : [];
  const ports = [
    portFromFrame('PORT_A', 'Inlet Port A', path.start, true, W, section),
    portFromFrame('PORT_B', 'Outlet Port B', pathEndFrame(path), false, W, section),
  ];
  const routes = [routeFromPath('ROUTE_PORT_A_PORT_B', 'PORT_A', 'PORT_B', path, 'STRAIGHT')];
  const dims = {
    style: section.style,
    width: W,
    height: section.height,
    length: L,
    overallWidth: W + 2 * section.outerOverhang,
    rungPitch: section.rung?.spacing ?? 0,
    routeLength: L,
  };
  return finish('STRAIGHT', section, dims, ports, routes, sweeps, rungs, [], accessories);
}

// ---------------------------------------------------------------------------
// HORIZONTAL BEND 30/45/60/90 (PDF p.5–8 ladder, p.31–32, p.42–43 ventilated)
// ---------------------------------------------------------------------------

export function horizontalBendLayout(params: Record<string, any>, defaultAngleDeg: number): TrayLayout {
  const section = resolveTraySection(params);
  const W = section.width;
  const R = catalogInnerRadius(params, W / 2);
  const T = nonNegative(params.tangentLength, 0);
  const angleDeg = finiteOr(params.angleDeg, defaultAngleDeg);
  const theta = (angleDeg * Math.PI) / 180;
  const Rc = R + W / 2;

  const path: TurtlePath = {
    start: { position: [Rc, 0, T], tangent: [0, 0, -1], up: [0, 1, 0] },
    segments: [
      { kind: 'LINE', length: T },
      { kind: 'ARC', axis: 'UP', angleRad: theta, radius: Rc },
      { kind: 'LINE', length: T },
    ],
  };
  const sweeps = centerlineSweeps(path, section);
  const Lc = pathLength(path);

  const rungs: RungSpec[] = [];
  if (section.rung) {
    const inner = W / 2 - section.innerInset;
    const m = rungEndMargin(T, section.rung.thickness, Rc, R + section.innerInset);
    evenStations(m, Lc - m, section.rung.spacing).forEach((s) =>
      rungs.push(rungAtFrame(frameAtLength(path, s), [-inner, inner], section))
    );
  }

  const ports = [
    portFromFrame('PORT_A', 'Inlet Port A', path.start, true, W, section),
    portFromFrame('PORT_B', 'Outlet Port B', pathEndFrame(path), false, W, section),
  ];
  const routes = [routeFromPath('ROUTE_PORT_A_PORT_B', 'PORT_A', 'PORT_B', path, 'ARC_XZ')];
  const dims = {
    style: section.style,
    width: W,
    height: section.height,
    angleDeg,
    catalogRadius: R,
    centerlineRadius: Rc,
    innerRailRadius: R,
    outerRailRadius: R + W,
    tangentLength: T,
    routeLength: Lc,
  };
  return finish('HORIZONTAL_BEND', section, dims, ports, routes, sweeps, rungs, []);
}

// ---------------------------------------------------------------------------
// VERTICAL BEND inside (rising, p.11–14) / outside (falling, p.15–18)
// ---------------------------------------------------------------------------

export function verticalBendLayout(params: Record<string, any>, defaultAngleDeg: number, isOutside: boolean): TrayLayout {
  const section = resolveTraySection(params);
  const W = section.width;
  const H = section.height;
  const R = catalogInnerRadius(params, H / 2);
  const T = nonNegative(params.tangentLength, 0);
  const angleDeg = finiteOr(params.angleDeg, defaultAngleDeg);
  const theta = (angleDeg * Math.PI) / 180;
  const Rc = R + H / 2;

  // Arc centre at the local origin. Inside bend: centre above the inlet (cover side inward).
  // Outside bend: centre below the inlet (tray bottom inward).
  const path: TurtlePath = {
    start: { position: [-T, isOutside ? Rc : -Rc, 0], tangent: [1, 0, 0], up: [0, 1, 0] },
    segments: [
      { kind: 'LINE', length: T },
      { kind: 'ARC', axis: 'SIDE', angleRad: isOutside ? theta : -theta, radius: Rc },
      { kind: 'LINE', length: T },
    ],
  };
  const sweeps = centerlineSweeps(path, section);
  const Lc = pathLength(path);

  const rungs: RungSpec[] = [];
  if (section.rung) {
    const inner = W / 2 - section.innerInset;
    // Rung radius range: inside bends carry the bottom on the outer radius.
    const rMin = isOutside ? Rc + section.rung.up[0] : Rc - section.rung.up[1];
    const m = rungEndMargin(T, section.rung.thickness, Rc, rMin);
    evenStations(m, Lc - m, section.rung.spacing).forEach((s) =>
      rungs.push(rungAtFrame(frameAtLength(path, s), [-inner, inner], section))
    );
  }

  const ports = [
    portFromFrame('PORT_A', isOutside ? 'Upper Horizontal Inlet' : 'Lower Horizontal Inlet', path.start, true, W, section),
    portFromFrame('PORT_B', isOutside ? 'Lower Outlet' : 'Upper Outlet', pathEndFrame(path), false, W, section),
  ];
  const routes = [routeFromPath('ROUTE_PORT_A_PORT_B', 'PORT_A', 'PORT_B', path, 'ARC_XY')];
  const dims = {
    style: section.style,
    width: W,
    height: H,
    angleDeg,
    catalogRadius: R,
    centerlineRadius: Rc,
    innerRadius: R,
    outerRadius: R + H,
    bottomRadius: isOutside ? R : R + H,
    coverSideRadius: isOutside ? R + H : R,
    tangentLength: T,
    routeLength: Lc,
  };
  return finish('VERTICAL_BEND', section, dims, ports, routes, sweeps, rungs, []);
}

// ---------------------------------------------------------------------------
// TEE (PDF p.9 ladder, p.33 ventilated) and CROSS (PDF p.10)
// ---------------------------------------------------------------------------

/**
 * Corner rail of a branch fitting in quadrant (sx, sz): tangent along the X arm at z = sz·W/2,
 * radius-R arc about (sx(W/2+R), sz(W/2+R)), tangent along the Z arm at x = sx·W/2.
 */
function cornerRailPath(W: number, R: number, armX: number, armZ: number, sx: number, sz: number): TurtlePath {
  const tx = armX - (W / 2 + R);
  const tz = armZ - (W / 2 + R);
  return {
    start: { position: [sx * armX, 0, (sz * W) / 2], tangent: [-sx, 0, 0], up: [0, 1, 0] },
    segments: [
      { kind: 'LINE', length: tx },
      { kind: 'ARC', axis: 'UP', angleRad: (Math.PI / 2) * sx * sz, radius: R },
      { kind: 'LINE', length: tz },
    ],
  };
}

/** Turning centerline route from the X arm (sx) to the Z arm (sz), concentric with the corner rail. */
function cornerRoutePath(W: number, R: number, armX: number, armZ: number, sx: number, sz: number): TurtlePath {
  return {
    start: { position: [sx * armX, 0, 0], tangent: [-sx, 0, 0], up: [0, 1, 0] },
    segments: [
      { kind: 'LINE', length: armX - (W / 2 + R) },
      { kind: 'ARC', axis: 'UP', angleRad: (Math.PI / 2) * sx * sz, radius: R + W / 2 },
      { kind: 'LINE', length: armZ - (W / 2 + R) },
    ],
  };
}

/**
 * Rung stop (along the rung) against a corner rail: the rail web inner face is the circle of
 * radius R + inset about the corner centre, or the straight rail at W/2 − inset.
 */
function cornerStop(ax: number, W: number, R: number, inset: number): number {
  const c = W / 2 + R;
  if (ax >= c) return W / 2 - inset;
  const dx = ax - c;
  const rr = R + inset;
  if (Math.abs(dx) <= rr) return c - Math.sqrt(rr * rr - dx * dx);
  return c;
}

function stopAcross(x: number, thickness: number, W: number, R: number, inset: number): number {
  let m = Infinity;
  for (let i = 0; i <= 4; i++) {
    const xi = x - thickness / 2 + (thickness * i) / 4;
    m = Math.min(m, cornerStop(Math.abs(xi), W, R, inset));
  }
  return m;
}

function branchTangent(explicitSpan: unknown, W: number, R: number, fallback: number, halfSpan: boolean): number {
  const n = toNumber(explicitSpan);
  if (n === undefined) return fallback;
  const t = halfSpan ? (n - W - 2 * R) / 2 : n - W / 2 - R;
  return Math.max(0, t);
}

export function teeLayout(params: Record<string, any>): TrayLayout {
  const section = resolveTraySection(params);
  const W = section.width;
  const R = catalogInnerRadius(params, W / 2);
  const T = nonNegative(params.tangentLength, 125);
  // Legacy aliases: explicit main-run `length` / `branchLength` fix the respective tangents.
  const Tm = branchTangent(params.length, W, R, T, true);
  const Tb = branchTangent(params.branchLength, W, R, T, false);
  const Lm = W / 2 + R + Tm;
  const Lb = W / 2 + R + Tb;
  const Rc = R + W / 2;

  const back: TurtlePath = {
    start: { position: [-Lm, 0, -W / 2], tangent: [1, 0, 0], up: [0, 1, 0] },
    segments: [{ kind: 'LINE', length: 2 * Lm }],
  };
  const frontLeft = cornerRailPath(W, R, Lm, Lb, -1, 1);
  const frontRight = cornerRailPath(W, R, Lm, Lb, 1, 1);

  const sweeps: SweepSpec[] = [
    { path: back, rects: railRectsOnPath(section, 1), part: 'RAIL' },
    { path: frontLeft, rects: railRectsOnPath(section, -1), part: 'RAIL' },
    { path: frontRight, rects: railRectsOnPath(section, 1), part: 'RAIL' },
  ];

  const floors: FloorSpec[] = [];
  if (section.floor) {
    const outline = [...planOutline(back), ...planOutline(frontRight), ...planOutline(frontLeft, true)];
    floors.push({ outline, y: section.floor.up });
  }

  const rungs: RungSpec[] = [];
  if (section.rung) {
    const th = section.rung.thickness;
    const inset = section.innerInset;
    const mMain = Tm / 2 >= th / 2 + 1 ? Math.min(Tm / 2, 62.5) : th / 2 + 1;
    evenStations(-(Lm - mMain), Lm - mMain, section.rung.spacing).forEach((x) => {
      const zStop = stopAcross(x, th, W, R, inset);
      const z0 = -W / 2 + inset;
      rungs.push(
        rungAtFrame({ position: [x, 0, (z0 + zStop) / 2], tangent: [1, 0, 0], up: [0, 1, 0] }, [-(zStop - z0) / 2, (zStop - z0) / 2], section)
      );
    });
    if (Tb / 2 >= th / 2 + 1) {
      const mB = Math.min(Tb / 2, 62.5);
      const inner = W / 2 - inset;
      evenStations(W / 2 + R + mB, Lb - mB, section.rung.spacing).forEach((z) =>
        rungs.push(rungAtFrame({ position: [0, 0, z], tangent: [0, 0, 1], up: [0, 1, 0] }, [-inner, inner], section))
      );
    }
  }

  const mainPath: TurtlePath = {
    start: { position: [-Lm, 0, 0], tangent: [1, 0, 0], up: [0, 1, 0] },
    segments: [{ kind: 'LINE', length: 2 * Lm }],
  };
  const pathAC = cornerRoutePath(W, R, Lm, Lb, -1, 1);
  const pathBC = cornerRoutePath(W, R, Lm, Lb, 1, 1);

  const ports = [
    portFromFrame('PORT_A', 'Main Run Inlet Port A', mainPath.start, true, W, section),
    portFromFrame('PORT_B', 'Main Run Outlet Port B', pathEndFrame(mainPath), false, W, section),
    portFromFrame('PORT_C', 'Branch Outlet Port C', pathEndFrame(pathAC), false, W, section),
  ];
  const routes = [
    routeFromPath('ROUTE_A_B', 'PORT_A', 'PORT_B', mainPath, 'STRAIGHT'),
    routeFromPath('ROUTE_A_C', 'PORT_A', 'PORT_C', pathAC, 'ARC_XZ'),
    routeFromPath('ROUTE_B_C', 'PORT_B', 'PORT_C', pathBC, 'ARC_XZ'),
  ];
  const dims = {
    style: section.style,
    width: W,
    height: section.height,
    catalogRadius: R,
    centerlineRadius: Rc,
    tangentLength: Tm,
    branchTangentLength: Tb,
    mainSpan: 2 * Lm,
    branchProjection: Lb,
    branchFromBackRail: Lb + W / 2,
    routeLengthMain: 2 * Lm,
    routeLengthBranch: pathLength(pathAC),
  };
  return finish('TEE', section, dims, ports, routes, sweeps, rungs, floors);
}

export function crossLayout(params: Record<string, any>): TrayLayout {
  const section = resolveTraySection(params);
  const W = section.width;
  const R = catalogInnerRadius(params, W / 2);
  const T0 = nonNegative(params.tangentLength, 125);
  // Legacy alias: explicit full `length` (span) fixes the tangent.
  const T = branchTangent(params.length, W, R, T0, true);
  const L = W / 2 + R + T;
  const Rc = R + W / 2;

  const quadrants: Array<[number, number]> = [
    [1, 1],
    [-1, 1],
    [-1, -1],
    [1, -1],
  ];
  const rails = quadrants.map(([sx, sz]) => ({ sx, sz, path: cornerRailPath(W, R, L, L, sx, sz) }));
  const sweeps: SweepSpec[] = rails.map((r) => ({
    path: r.path,
    rects: railRectsOnPath(section, (r.sx * r.sz) as 1 | -1),
    part: 'RAIL' as const,
  }));

  const floors: FloorSpec[] = [];
  if (section.floor) {
    const outline = [
      ...planOutline(rails[0].path),
      ...planOutline(rails[1].path, true),
      ...planOutline(rails[2].path),
      ...planOutline(rails[3].path, true),
    ];
    floors.push({ outline, y: section.floor.up });
  }

  const rungs: RungSpec[] = [];
  if (section.rung) {
    const th = section.rung.thickness;
    const inset = section.innerInset;
    const m = T / 2 >= th / 2 + 1 ? Math.min(T / 2, 62.5) : th / 2 + 1;
    evenStations(-(L - m), L - m, section.rung.spacing).forEach((x) => {
      const zStop = stopAcross(x, th, W, R, inset);
      rungs.push(rungAtFrame({ position: [x, 0, 0], tangent: [1, 0, 0], up: [0, 1, 0] }, [-zStop, zStop], section));
    });
    if (T / 2 >= th / 2 + 1) {
      const inner = W / 2 - inset;
      [1, -1].forEach((sz) =>
        evenStations(W / 2 + R + m, L - m, section.rung!.spacing).forEach((z) =>
          rungs.push(rungAtFrame({ position: [0, 0, sz * z], tangent: [0, 0, 1], up: [0, 1, 0] }, [-inner, inner], section))
        )
      );
    }
  }

  const pathAB: TurtlePath = {
    start: { position: [-L, 0, 0], tangent: [1, 0, 0], up: [0, 1, 0] },
    segments: [{ kind: 'LINE', length: 2 * L }],
  };
  const pathDC: TurtlePath = {
    start: { position: [0, 0, -L], tangent: [0, 0, 1], up: [0, 1, 0] },
    segments: [{ kind: 'LINE', length: 2 * L }],
  };

  const ports = [
    portFromFrame('PORT_A', 'Inlet Port A (-X)', pathAB.start, true, W, section),
    portFromFrame('PORT_B', 'Outlet Port B (+X)', pathEndFrame(pathAB), false, W, section),
    portFromFrame('PORT_C', 'Branch Port C (+Z)', pathEndFrame(pathDC), false, W, section),
    portFromFrame('PORT_D', 'Branch Port D (-Z)', pathDC.start, true, W, section),
  ];
  const turnPortX: Record<number, string> = { [-1]: 'PORT_A', [1]: 'PORT_B' };
  const turnPortZ: Record<number, string> = { [1]: 'PORT_C', [-1]: 'PORT_D' };
  const turning: Array<[number, number]> = [
    [-1, 1],
    [-1, -1],
    [1, 1],
    [1, -1],
  ];
  const routes = [
    routeFromPath('ROUTE_PORT_A_PORT_B', 'PORT_A', 'PORT_B', pathAB, 'STRAIGHT'),
    routeFromPath('ROUTE_PORT_D_PORT_C', 'PORT_D', 'PORT_C', pathDC, 'STRAIGHT'),
    ...turning.map(([sx, sz]) =>
      routeFromPath(
        `ROUTE_${turnPortX[sx]}_${turnPortZ[sz]}`,
        turnPortX[sx],
        turnPortZ[sz],
        cornerRoutePath(W, R, L, L, sx, sz),
        'ARC_XZ'
      )
    ),
  ];
  const dims = {
    style: section.style,
    width: W,
    height: section.height,
    catalogRadius: R,
    centerlineRadius: Rc,
    tangentLength: T,
    span: 2 * L,
    routeLengthStraight: 2 * L,
    routeLengthTurn: pathLength(cornerRoutePath(W, R, L, L, -1, 1)),
  };
  return finish('CROSS', section, dims, ports, routes, sweeps, rungs, floors);
}

// ---------------------------------------------------------------------------
// REDUCERS (PDF p.19 centre, p.20 left, p.21 right)
// ---------------------------------------------------------------------------

/**
 * Travel +Z from the wide end (PORT_A, W1) to the narrow end (PORT_B, W2), tray up +Y.
 * Traveller's left = up × travel = +X. Vendor p.20 LEFT reducer keeps the LEFT rail straight;
 * p.21 RIGHT keeps the right rail straight; p.19 CENTER tapers both rails symmetrically.
 * Catalog shape: T (200) straight at W1 → taper over L − 2T (200) → T (200) straight at W2; L = 600.
 */
export function reducerLayout(params: Record<string, any>, type: ReducerType): TrayLayout {
  const W1 = positive(params.inletWidth, 600);
  const W2 = positive(params.outletWidth, 450);
  const section = resolveTraySection(params, W1);
  const L = positive(params.length, 500);
  const T = Math.min(nonNegative(params.tangentLength, 0), Math.max(0, (L - 1) / 2));
  const Lt = L - 2 * T;

  let xL1 = W2 / 2;
  let xR1 = -W2 / 2;
  if (type === 'LEFT') {
    xL1 = W1 / 2;
    xR1 = W1 / 2 - W2;
  } else if (type === 'RIGHT') {
    xR1 = -W1 / 2;
    xL1 = -W1 / 2 + W2;
  }
  const xL0 = W1 / 2;
  const xR0 = -W1 / 2;
  const xc = (xL1 + xR1) / 2;

  const railPath = (x0: number, x1: number): TurtlePath => {
    const dx = x1 - x0;
    const phi = Math.atan2(dx, Lt);
    return {
      start: { position: [x0, 0, -L / 2], tangent: [0, 0, 1], up: [0, 1, 0] },
      segments: [
        { kind: 'LINE', length: T },
        { kind: 'TURN', angleRad: phi },
        { kind: 'LINE', length: Math.hypot(dx, Lt) },
        { kind: 'TURN', angleRad: -phi },
        { kind: 'LINE', length: T },
      ],
    };
  };
  const left = railPath(xL0, xL1);
  const right = railPath(xR0, xR1);
  const center = railPath(0, xc);

  const sweeps: SweepSpec[] = [
    { path: left, rects: railRectsOnPath(section, 1), part: 'RAIL' },
    { path: right, rects: railRectsOnPath(section, -1), part: 'RAIL' },
  ];

  const floors: FloorSpec[] = [];
  if (section.floor) {
    floors.push({ outline: [...planOutline(left), ...planOutline(right, true)], y: section.floor.up });
  }

  const railX = (x0: number, x1: number, z: number) => {
    const zl = z + L / 2;
    if (zl <= T) return x0;
    if (zl >= L - T) return x1;
    return x0 + ((x1 - x0) * (zl - T)) / Lt;
  };

  const rungs: RungSpec[] = [];
  if (section.rung) {
    const th = section.rung.thickness;
    const inset = section.innerInset;
    const m = T / 2 >= th / 2 + 1 ? Math.min(T / 2, 62.5) : th / 2 + 1;
    evenStations(-L / 2 + m, L / 2 - m, section.rung.spacing).forEach((z) => {
      let xl = Infinity;
      let xr = -Infinity;
      for (const dz of [-th / 2, 0, th / 2]) {
        xl = Math.min(xl, railX(xL0, xL1, z + dz));
        xr = Math.max(xr, railX(xR0, xR1, z + dz));
      }
      // Rail web inner faces are measured perpendicular to the (possibly tapered) rail.
      const lo = xr + inset / Math.cos(Math.atan2(xR1 - xR0, Lt));
      const hi = xl - inset / Math.cos(Math.atan2(xL1 - xL0, Lt));
      // Frame side = up × tangent = +X, so side offset s maps to x = xm + s.
      const xm = (lo + hi) / 2;
      rungs.push(rungAtFrame({ position: [xm, 0, z], tangent: [0, 0, 1], up: [0, 1, 0] }, [lo - xm, hi - xm], section));
    });
  }

  const inlet = resolveTraySection(params, W1);
  const outlet = resolveTraySection(params, W2);
  const ports = [
    portFromFrame('PORT_A', 'Wide Inlet Port A', center.start, true, W1, inlet),
    portFromFrame('PORT_B', 'Narrow Outlet Port B', pathEndFrame(center), false, W2, outlet),
  ];
  const routes = [routeFromPath('ROUTE_PORT_A_PORT_B', 'PORT_A', 'PORT_B', center, 'STRAIGHT')];
  const dims = {
    style: section.style,
    reducerType: type,
    inletWidth: W1,
    outletWidth: W2,
    height: section.height,
    length: L,
    tangentLength: T,
    transitionLength: Lt,
    lateralOffset: xc,
    routeLength: pathLength(center),
  };
  return finish('REDUCER', section, dims, ports, routes, sweeps, rungs, floors);
}
