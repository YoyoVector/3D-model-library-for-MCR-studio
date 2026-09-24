/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import * as THREE from 'three';
import { type Vec3, vec } from '../geometry/SweepPath.ts';
import { ComponentInstance } from '../core/Instance.ts';
import type { EngineeringPlacement, WorldPortDefinition } from '../core/Schema.ts';
import { Transforms } from '../core/Transforms.ts';
import { ComponentRegistry } from '../registry/ComponentRegistry.ts';
import { resolveProfileParameters, TraySystemProfiles, type TraySystemProfile } from '../registry/TraySystemProfile.ts';
import { BomManager, type BomLineItem } from '../bom/BomManager.ts';
import { type PlanFrame, type PlanPoint, WORLD_UP } from './PlanFrames.ts';

/**
 * ============================================================================
 * Tray Network → catalog fittings
 * ============================================================================
 *
 * A host application describes its tray network the way a plan drawing does: nodes and straight
 * centerline segments between them. This module turns that network into a physical, catalog-true
 * installation in the library world frame (right-handed, +Y up, mm):
 *
 *   normalizeTrayNetwork()  catalog sizes; a vertical tee (not in the catalog) becomes a
 *                           horizontal tee + horizontal stub + vertical bend. Returns the changes
 *                           so the host can apply them to its own project data.
 *   resolveTrayNetwork()    one catalog fitting per junction / bend, reducers where the width
 *                           changes, straight trays between them, and issues where the catalog
 *                           cannot build the network as drawn.
 *
 * Single source of truth: a fitting is placed on its node by its own ports; how far it reaches
 * along each segment ("trim") is measured from those placed ports. Straight lengths, centerline
 * lengths and the BOM all derive from that one placement.
 * ============================================================================
 */

export interface TrayNetworkNode {
  id: string;
  /** Library world position (mm): centre of the tray section (mid-width, mid-height). */
  position: Vec3;
}

export interface TrayNetworkSegment {
  id: string;
  from: string;
  to: string;
  /** Nominal width W (mm). */
  width: number;
  /** Side rail height H (mm); defaults to the profile height. */
  height?: number;
}

export interface TrayNetwork {
  nodes: TrayNetworkNode[];
  segments: TrayNetworkSegment[];
}

export type NetworkIssueCode =
  | 'INVALID_NETWORK'
  | 'WIDTH_ADJUSTED'
  | 'HEIGHT_ADJUSTED'
  | 'HEIGHT_NOT_IN_CATALOG'
  | 'WIDTH_NOT_IN_CATALOG'
  | 'VERTICAL_TEE_REPLACED'
  | 'VERTICAL_TEE_UNRESOLVED'
  | 'ANGLE_NOT_IN_CATALOG'
  | 'JUNCTION_NOT_IN_CATALOG'
  | 'FITTING_NOT_OFFERED'
  | 'SEGMENT_TOO_SHORT'
  | 'VERTICAL_RUN_TWISTED'
  | 'FITTING_MISALIGNED'
  | 'OVERRIDE_INVALID'
  | 'OVERRIDE_UNUSED';

export interface NetworkIssue {
  severity: 'ERROR' | 'WARNING';
  code: NetworkIssueCode;
  message: string;
  nodeId?: string;
  segmentId?: string;
  values?: Record<string, number | string>;
}

export type NetworkChange =
  | { kind: 'SEGMENT_WIDTH'; segmentId: string; from: number; to: number; reason: string }
  | { kind: 'SEGMENT_HEIGHT'; segmentId: string; from: number; to: number; reason: string }
  | { kind: 'NODE_ADDED'; nodeId: string; position: Vec3; reason: string }
  | { kind: 'NODE_MOVED'; nodeId: string; from: Vec3; to: Vec3; reason: string }
  | { kind: 'SEGMENT_ADDED'; segmentId: string; from: string; to: string; width: number; reason: string }
  | { kind: 'SEGMENT_RECONNECTED'; segmentId: string; before: { from: string; to: string }; after: { from: string; to: string }; reason: string };

export interface TrayNetworkOptions {
  /** Tolerance for "collinear", "perpendicular", "level" and catalog angles (default 0.5°). */
  angleToleranceDeg?: number;
  /**
   * Side of the horizontal stub that replaces a vertical tee, relative to up × main direction
   * (main direction = from the lower-sorting main segment toward the node). Default: the side
   * with more clearance to the rest of the network.
   */
  verticalTeeSide?: (nodeId: string) => 1 | -1 | undefined;
  /** Prefix for instance ids (default 'net:'). */
  idPrefix?: string;
  /**
   * Width of a bend (horizontal elbow or vertical bend) whose two legs differ in width:
   * - 'WIDEST_LEG' (default): the bend takes the wider width; the reducer sits on the narrower leg
   *   after the bend.
   * - 'NARROWEST_LEG': reduce first — the reducer sits on the wider leg before the bend, and the
   *   bend takes the narrower (smaller, cheaper) width.
   * Tees and crosses always take the widest leg unless a node override says otherwise.
   */
  bendWidth?: 'WIDEST_LEG' | 'NARROWEST_LEG';
  /**
   * Manual fitting choices per node (e.g. edited by a designer in the host). Everything else —
   * reducers, straight lengths, centerline lengths, BOM and meshes — follows from the choice.
   */
  nodeOverrides?: Record<string, FittingOverride>;
}

/** Manual choice for the fitting on one node. Invalid choices are reported and ignored. */
export interface FittingOverride {
  /**
   * Fitting width W: a catalog width between the narrowest and widest leg. Legs narrower than W
   * get a reducer after the fitting; legs wider than W get a reducer before it.
   */
  width?: number;
  /** Catalog bend radius R (profile.allowedRadii, e.g. 300 / 600 / 900). */
  radius?: number;
}

/** What a host can offer a designer for the fitting on a node. */
export interface FittingChoices {
  nodeId: string;
  definitionId: string;
  width: number;
  /** Catalog widths between the narrowest and widest leg. */
  widthChoices: number[];
  radius: number;
  radiusChoices: number[];
  /** Override currently applied to this node (as given by the host). */
  override?: FittingOverride;
}

// ---------------------------------------------------------------------------
// Plan input
// ---------------------------------------------------------------------------

/** Builds a world-frame network from host plan coordinates through ONE PlanFrame. */
export function trayNetworkFromPlan(
  nodes: Array<PlanPoint & { id: string }>,
  segments: TrayNetworkSegment[],
  frame: PlanFrame
): TrayNetwork {
  return {
    nodes: nodes.map((n) => ({ id: n.id, position: frame.toWorld(n) })),
    segments: segments.map((s) => ({ ...s })),
  };
}

// ---------------------------------------------------------------------------
// Small geometry helpers
// ---------------------------------------------------------------------------

const toV3 = (v: Vec3) => new THREE.Vector3(v[0], v[1], v[2]);
const fromV3 = (v: THREE.Vector3): Vec3 => [v.x, v.y, v.z];

function applyQ(q: THREE.Quaternion, v: Vec3): Vec3 {
  return fromV3(toV3(v).applyQuaternion(q));
}

/** Rotation taking the local frame (dir, up) onto the world frame (dir, up). */
function rotationFromFrames(localDir: Vec3, localUp: Vec3, worldDir: Vec3, worldUp: Vec3): THREE.Quaternion | null {
  const basis = (d: Vec3, u: Vec3): [Vec3, Vec3, Vec3] | null => {
    const e1 = vec.normalize(d);
    const t = vec.sub(u, vec.scale(e1, vec.dot(u, e1)));
    if (vec.length(t) < 1e-9) return null;
    const e2 = vec.normalize(t);
    return [e1, e2, vec.cross(e1, e2)];
  };
  const E = basis(localDir, localUp);
  const F = basis(worldDir, worldUp);
  if (!E || !F) return null;
  const mE = new THREE.Matrix4().makeBasis(toV3(E[0]), toV3(E[1]), toV3(E[2]));
  const mF = new THREE.Matrix4().makeBasis(toV3(F[0]), toV3(F[1]), toV3(F[2]));
  const r = mF.multiply(mE.transpose());
  return new THREE.Quaternion().setFromRotationMatrix(r).normalize();
}

/** Midpoint of the closest points of two lines (null when parallel). */
function closestPointOfLines(p1: Vec3, d1: Vec3, p2: Vec3, d2: Vec3): Vec3 | null {
  const w0 = vec.sub(p1, p2);
  const a = vec.dot(d1, d1);
  const b = vec.dot(d1, d2);
  const c = vec.dot(d2, d2);
  const d = vec.dot(d1, w0);
  const e = vec.dot(d2, w0);
  const den = a * c - b * b;
  if (Math.abs(den) < 1e-9) return null;
  const t = (b * e - c * d) / den;
  const s = (a * e - b * d) / den;
  return vec.scale(vec.add(vec.add(p1, vec.scale(d1, t)), vec.add(p2, vec.scale(d2, s))), 0.5);
}

/** Deterministic tray up for a non-level run without a fitting to take it from. */
function defaultUp(dir: Vec3): Vec3 {
  if (Math.abs(dir[1]) < 1e-6) return WORLD_UP;
  const cand: Vec3 = Math.abs(dir[0]) < 0.9 ? [1, 0, 0] : [0, 0, 1];
  return vec.normalize(vec.sub(cand, vec.scale(dir, vec.dot(cand, dir))));
}

function placementOf(q: THREE.Quaternion, position: Vec3): EngineeringPlacement {
  return { position: vec.clean(position), quaternion: [q.x, q.y, q.z, q.w] };
}

// ---------------------------------------------------------------------------
// Graph
// ---------------------------------------------------------------------------

interface Leg {
  segment: TrayNetworkSegment;
  /** Unit direction from the node along the segment. */
  dir: Vec3;
  otherId: string;
  length: number;
  level: boolean;
}

interface Graph {
  nodes: Map<string, TrayNetworkNode>;
  legs: Map<string, Leg[]>;
  issues: NetworkIssue[];
}

function buildGraph(network: TrayNetwork, sinTol: number): Graph {
  const nodes = new Map(network.nodes.map((n) => [n.id, n]));
  const legs = new Map<string, Leg[]>();
  const issues: NetworkIssue[] = [];
  network.nodes.forEach((n) => legs.set(n.id, []));
  const seen = new Set<string>();
  for (const s of network.segments) {
    if (seen.has(s.id)) {
      issues.push({ severity: 'ERROR', code: 'INVALID_NETWORK', segmentId: s.id, message: `Duplicate segment id ${s.id}.` });
      continue;
    }
    seen.add(s.id);
    const a = nodes.get(s.from);
    const b = nodes.get(s.to);
    if (!a || !b || s.from === s.to) {
      issues.push({ severity: 'ERROR', code: 'INVALID_NETWORK', segmentId: s.id, message: `Segment ${s.id} does not join two existing nodes.` });
      continue;
    }
    const d = vec.sub(b.position, a.position);
    const length = vec.length(d);
    if (length < 1) {
      issues.push({ severity: 'ERROR', code: 'INVALID_NETWORK', segmentId: s.id, message: `Segment ${s.id} has no length.` });
      continue;
    }
    const dir = vec.scale(d, 1 / length);
    const level = Math.abs(dir[1]) < sinTol;
    legs.get(s.from)!.push({ segment: s, dir, otherId: s.to, length, level });
    legs.get(s.to)!.push({ segment: s, dir: vec.scale(dir, -1), otherId: s.from, length, level });
  }
  legs.forEach((list) => list.sort((x, y) => (x.segment.id < y.segment.id ? -1 : x.segment.id > y.segment.id ? 1 : 0)));
  return { nodes, legs, issues };
}

// ---------------------------------------------------------------------------
// Node classification
// ---------------------------------------------------------------------------

type NodePlan =
  | { kind: 'END' }
  | { kind: 'PASS' }
  | { kind: 'INLINE_REDUCER'; wide: Leg; narrow: Leg }
  | { kind: 'FITTING'; definitionId: string; width: number; ports: string[]; legs: Leg[] }
  | { kind: 'UNRESOLVED' };

interface Tolerances {
  sin: number;
  cos: number;
  deg: number;
}

function catalogAngle(turnDeg: number, allowed: number[], tolDeg: number): number | undefined {
  return allowed.find((a) => Math.abs(a - turnDeg) <= tolDeg);
}

function classifyNode(nodeId: string, legs: Leg[], profile: TraySystemProfile, tol: Tolerances, issues: NetworkIssue[]): NodePlan {
  const widths = legs.map((l) => l.segment.width);
  const W = Math.max(...widths);
  const err = (code: NetworkIssueCode, message: string, values?: NetworkIssue['values']): NodePlan => {
    issues.push({ severity: 'ERROR', code, nodeId, message, values });
    return { kind: 'UNRESOLVED' };
  };
  const collinear = (a: Leg, b: Leg) => vec.dot(a.dir, b.dir) < -tol.cos;
  const perpendicular = (a: Leg, b: Leg) => Math.abs(vec.dot(a.dir, b.dir)) < tol.sin;

  if (legs.length === 0 || legs.length === 1) return { kind: 'END' };

  if (legs.length === 2) {
    const [a, b] = legs;
    if (collinear(a, b)) {
      if (a.segment.width === b.segment.width) return { kind: 'PASS' };
      const [wide, narrow] = a.segment.width > b.segment.width ? [a, b] : [b, a];
      return { kind: 'INLINE_REDUCER', wide, narrow };
    }
    const turn = 180 - (Math.acos(Math.max(-1, Math.min(1, vec.dot(a.dir, b.dir)))) * 180) / Math.PI;
    if (a.level && b.level) {
      const angle = catalogAngle(turn, profile.allowedHorizontalAngles, tol.deg);
      if (angle === undefined) {
        return err('ANGLE_NOT_IN_CATALOG', `Horizontal turn of ${turn.toFixed(1)}° at ${nodeId}; the catalog offers ${profile.allowedHorizontalAngles.join(' / ')}°.`, { turnDeg: +turn.toFixed(2) });
      }
      return { kind: 'FITTING', definitionId: `FITTING_ELBOW_${angle}`, width: W, ports: ['PORT_A', 'PORT_B'], legs: [a, b] };
    }
    if (a.level !== b.level) {
      const h = a.level ? a : b;
      const v = a.level ? b : a;
      const vh: Vec3 = [v.dir[0], 0, v.dir[2]];
      if (vec.length(vh) > tol.sin && Math.abs(vec.dot(vec.normalize(vh), h.dir)) < tol.cos) {
        return err('JUNCTION_NOT_IN_CATALOG', `Bend at ${nodeId} turns both horizontally and vertically; the catalog has no compound bend.`);
      }
      const angle = catalogAngle(turn, profile.allowedVerticalAngles, tol.deg);
      if (angle === undefined) {
        return err('ANGLE_NOT_IN_CATALOG', `Vertical bend of ${turn.toFixed(1)}° at ${nodeId}; the catalog offers ${profile.allowedVerticalAngles.join(' / ')}°.`, { turnDeg: +turn.toFixed(2) });
      }
      const id = `FITTING_RISER_${v.dir[1] > 0 ? 'IN' : 'OUT'}_${angle}`;
      return { kind: 'FITTING', definitionId: id, width: W, ports: ['PORT_A', 'PORT_B'], legs: [h, v] };
    }
    return err('JUNCTION_NOT_IN_CATALOG', `Bend at ${nodeId} joins two non-level runs; the catalog vertical bends start from a level tray.`);
  }

  if (legs.length === 3) {
    for (let i = 0; i < 3; i++) {
      for (let j = i + 1; j < 3; j++) {
        if (!collinear(legs[i], legs[j])) continue;
        const branch = legs[3 - i - j];
        const main = [legs[i], legs[j]];
        if (main.every((l) => l.level) && !branch.level) {
          return err('VERTICAL_TEE_UNRESOLVED', `Vertical tee at ${nodeId} is not in the catalog; normalizeTrayNetwork() replaces it with a horizontal tee, stub and vertical bend.`);
        }
        if (main.every((l) => l.level) && branch.level && perpendicular(branch, main[0])) {
          return { kind: 'FITTING', definitionId: 'FITTING_TEE', width: W, ports: ['PORT_A', 'PORT_B', 'PORT_C'], legs: [main[0], main[1], branch] };
        }
      }
    }
    return err('JUNCTION_NOT_IN_CATALOG', `Three-way junction at ${nodeId} is not a catalog tee (level main run with a perpendicular level branch).`);
  }

  if (legs.length === 4 && legs.every((l) => l.level)) {
    const others = legs.slice(1);
    const k = others.findIndex((l) => collinear(legs[0], l));
    if (k >= 0) {
      const m2 = others[k];
      const rest = others.filter((_, i) => i !== k);
      if (collinear(rest[0], rest[1]) && perpendicular(rest[0], legs[0])) {
        return { kind: 'FITTING', definitionId: 'FITTING_CROSS', width: W, ports: ['PORT_A', 'PORT_B', 'PORT_C', 'PORT_D'], legs: [legs[0], m2, rest[0], rest[1]] };
      }
    }
  }
  return err('JUNCTION_NOT_IN_CATALOG', `${legs.length}-way junction at ${nodeId} is not a catalog cross (two level runs crossing at 90°).`);
}

// ---------------------------------------------------------------------------
// Fitting placement (ports → world)
// ---------------------------------------------------------------------------

interface Placed {
  instance: ComponentInstance;
  /** port id → leg */
  portLegs: Map<string, Leg>;
}

/**
 * Places a fitting on its node so that each assigned port faces along its leg with the tray
 * upright on every level leg. Tries every assignment of legs to ports; returns the first that
 * fits the catalog part without mirroring or turning it upside down.
 */
function placeFittingOnNode(
  instanceId: string,
  definitionId: string,
  params: Record<string, any>,
  node: Vec3,
  portIds: string[],
  legs: Leg[],
  tol: Tolerances
): Placed | null {
  const def = ComponentRegistry.get(definitionId);
  if (!def) return null;
  const local = new Map(def.getLocalPorts(params).map((p) => [p.id, p]));
  const permutations = (arr: Leg[]): Leg[][] =>
    arr.length <= 1 ? [arr] : arr.flatMap((x, i) => permutations(arr.filter((_, j) => j !== i)).map((rest) => [x, ...rest]));

  for (const order of permutations(legs)) {
    const ref = portIds.findIndex((_, i) => order[i].level);
    if (ref < 0) continue;
    const refPort = local.get(portIds[ref])!;
    const q = rotationFromFrames(refPort.localDirection, refPort.localUp, order[ref].dir, WORLD_UP);
    if (!q) continue;
    const ok = portIds.every((pid, i) => {
      const lp = local.get(pid)!;
      if (vec.dot(applyQ(q, lp.localDirection), order[i].dir) < tol.cos) return false;
      return !order[i].level || vec.dot(applyQ(q, lp.localUp), WORLD_UP) > tol.cos;
    });
    if (!ok) continue;

    // Anchor: the intersection of two non-parallel port axes sits on the node.
    let pi: Vec3 | null = null;
    for (let i = 0; i < portIds.length && !pi; i++) {
      for (let j = i + 1; j < portIds.length && !pi; j++) {
        const a = local.get(portIds[i])!;
        const b = local.get(portIds[j])!;
        pi = closestPointOfLines(a.localPosition, a.localDirection, b.localPosition, b.localDirection);
      }
    }
    if (!pi) continue;
    const position = vec.sub(node, applyQ(q, pi));
    const instance = new ComponentInstance(instanceId, def, params, placementOf(q, position));
    return { instance, portLegs: new Map(portIds.map((pid, i) => [pid, order[i]])) };
  }
  return null;
}

/**
 * Places a reducer on a leg with `innerPort` at `at`, facing back along `-dir` (toward the node);
 * the other port continues along `dir`. PORT_A is the wide end, PORT_B the narrow end.
 */
function placeReducer(
  instanceId: string,
  definitionId: string,
  params: Record<string, any>,
  innerPort: 'PORT_A' | 'PORT_B',
  at: Vec3,
  dir: Vec3,
  up: Vec3
): ComponentInstance | null {
  const def = ComponentRegistry.get(definitionId);
  if (!def) return null;
  const port = def.getLocalPorts(params).find((p) => p.id === innerPort)!;
  const q = rotationFromFrames(port.localDirection, port.localUp, vec.scale(dir, -1), up);
  if (!q) return null;
  const position = vec.sub(at, applyQ(q, port.localPosition));
  return new ComponentInstance(instanceId, def, params, placementOf(q, position));
}

function worldPort(inst: ComponentInstance, portId: string): WorldPortDefinition {
  return inst.getWorldPorts().find((p) => p.id === portId)!;
}

// ---------------------------------------------------------------------------
// Results
// ---------------------------------------------------------------------------

export interface PlacedFitting {
  id: string;
  nodeId: string;
  role: 'FITTING' | 'REDUCER';
  definitionId: string;
  instance: ComponentInstance;
  /** Which segment each port connects to. */
  legs: Array<{ segmentId: string; portId: string }>;
}

export interface PlacedStraight {
  id: string;
  segmentId: string;
  /** World end points of the straight tray (mm), after the fittings' reach is removed. */
  start: Vec3;
  end: Vec3;
  lengthMm: number;
  up: Vec3;
  instance: ComponentInstance;
}

/** What occupies a segment end at a node: its reach along the segment and the tray up there. */
export interface SegmentEnd {
  nodeId: string;
  segmentId: string;
  /** Distance along the segment from the node to where the straight tray starts (mm). */
  reachMm: number;
  up: Vec3 | null;
  /** Fitting on the node and the port facing this segment. */
  fitting?: { id: string; portId: string };
  /** Reducer between the fitting (or node) and the straight. */
  reducer?: {
    id: string;
    /** Reducer port facing the node / fitting, and the one facing the straight tray. */
    innerPort: 'PORT_A' | 'PORT_B';
    outerPort: 'PORT_A' | 'PORT_B';
  };
}

export interface PathCenterline {
  /** Physical centerline length along straights, fittings and reducers (mm). */
  lengthMm: number;
  /** Sum of node-to-node segment lengths (the drawing polyline), for comparison (mm). */
  polylineMm: number;
  ok: boolean;
  issues: string[];
}

export interface StraightBomLine {
  spec: string;
  style: string;
  width: number;
  height: number;
  standardLengthMm: number;
  totalLengthMm: number;
  /** Standard lengths to order: each continuous run is cut from ⌈run / standard⌉ pieces. */
  pieces: number;
  runs: number;
}

export interface TrayNetworkBom {
  fittings: BomLineItem[];
  straights: StraightBomLine[];
}

export interface TrayNetworkLayout {
  profileId: string;
  network: TrayNetwork;
  fittings: PlacedFitting[];
  straights: PlacedStraight[];
  segmentEnds: Record<string, SegmentEnd>;
  issues: NetworkIssue[];
  /** True when no ERROR issue was found. */
  ok: boolean;
  /** Every placed component instance (fittings, reducers, straights). */
  instances(): ComponentInstance[];
  /** Physical centerline length of a route given as consecutive segment ids. */
  pathCenterline(segmentIds: string[]): PathCenterline;
  /**
   * World points (mm) along the physical centerline of a route — straights, reducers and the
   * fitting routes, in travel order. For drawing cables along the tray as built.
   */
  pathPoints(segmentIds: string[]): Vec3[];
  /** The fitting on a node and the choices a designer may make for it (undefined: no fitting). */
  fittingChoices(nodeId: string): FittingChoices | undefined;
  bom(): TrayNetworkBom;
}

const endKey = (segmentId: string, nodeId: string) => `${segmentId}@${nodeId}`;

function tolerances(options: TrayNetworkOptions): Tolerances {
  const deg = options.angleToleranceDeg ?? 0.5;
  const rad = (deg * Math.PI) / 180;
  return { deg, sin: Math.sin(rad), cos: Math.cos(rad) };
}

// ---------------------------------------------------------------------------
// Resolve
// ---------------------------------------------------------------------------

/**
 * Resolves a catalog-true installation for a tray network. The network should first pass
 * through normalizeTrayNetwork(); anything the catalog cannot build is reported as an ERROR
 * issue instead of being approximated.
 */
export function resolveTrayNetwork(network: TrayNetwork, profile: TraySystemProfile, options: TrayNetworkOptions = {}): TrayNetworkLayout {
  const tol = tolerances(options);
  const prefix = options.idPrefix ?? 'net:';
  const graph = buildGraph(network, tol.sin);
  const issues: NetworkIssue[] = [...graph.issues];
  const fittings: PlacedFitting[] = [];
  const ends = new Map<string, SegmentEnd>();
  const plans = new Map<string, NodePlan>();

  for (const s of network.segments) {
    if (!profile.allowedWidths.includes(s.width)) {
      issues.push({ severity: 'ERROR', code: 'WIDTH_NOT_IN_CATALOG', segmentId: s.id, message: `Segment ${s.id} W=${s.width} is not a catalog width (${profile.allowedWidths.join(', ')}).` });
    }
    if (s.height !== undefined && s.height !== profile.height) {
      issues.push({ severity: 'ERROR', code: 'HEIGHT_NOT_IN_CATALOG', segmentId: s.id, message: `Segment ${s.id} H=${s.height}; ${profile.name} is H=${profile.height}.` });
    }
  }

  const offered = (definitionId: string, nodeId: string): boolean => {
    if (TraySystemProfiles.supports(profile, definitionId)) return true;
    issues.push({ severity: 'ERROR', code: 'FITTING_NOT_OFFERED', nodeId, message: `${definitionId} needed at ${nodeId} is not offered in ${profile.name}.`, values: { definitionId } });
    return false;
  };
  const params = (definitionId: string, overrides: Record<string, any>) => resolveProfileParameters(definitionId, profile, overrides);

  /**
   * Reducer between the fitting (width `innerWidth`, port at `at`) and the leg's straight tray.
   * Leg narrower than the fitting: wide end (PORT_A) at the fitting — reduce after it.
   * Leg wider than the fitting: narrow end (PORT_B) at the fitting — reduce before it.
   */
  const reducerOnLeg = (
    nodeId: string,
    innerWidth: number,
    leg: Leg,
    at: Vec3,
    up: Vec3
  ): { ref: NonNullable<SegmentEnd['reducer']>; outerPoint: Vec3 } | undefined => {
    const w = leg.segment.width;
    if (w === innerWidth) return undefined;
    if (!offered('FITTING_REDUCER_CENTER', nodeId)) return undefined;
    const narrower = w < innerWidth;
    const innerPort = narrower ? 'PORT_A' : 'PORT_B';
    const outerPort = narrower ? 'PORT_B' : 'PORT_A';
    const id = `${prefix}${nodeId}:${leg.segment.id}:REDUCER`;
    const p = params('FITTING_REDUCER_CENTER', { inletWidth: Math.max(w, innerWidth), outletWidth: Math.min(w, innerWidth) });
    const inst = placeReducer(id, 'FITTING_REDUCER_CENTER', p, innerPort, at, leg.dir, up);
    if (!inst) return undefined;
    fittings.push({ id, nodeId, role: 'REDUCER', definitionId: 'FITTING_REDUCER_CENTER', instance: inst, legs: [{ segmentId: leg.segment.id, portId: outerPort }] });
    return { ref: { id, innerPort, outerPort }, outerPoint: worldPort(inst, outerPort).worldPosition };
  };

  /** Fitting width and radius on a node: rule (bendWidth) first, then the designer's override. */
  const choices = new Map<string, FittingChoices>();
  const fittingParams = (nodeId: string, plan: Extract<NodePlan, { kind: 'FITTING' }>): Record<string, any> => {
    const widths = plan.legs.map((l) => l.segment.width);
    const min = Math.min(...widths);
    const max = Math.max(...widths);
    let width = plan.legs.length === 2 && options.bendWidth === 'NARROWEST_LEG' ? min : max;
    const extra: Record<string, any> = {};
    const ov = options.nodeOverrides?.[nodeId];
    if (ov?.width !== undefined) {
      if (profile.allowedWidths.includes(ov.width) && ov.width >= min && ov.width <= max) width = ov.width;
      else {
        issues.push({
          severity: 'ERROR',
          code: 'OVERRIDE_INVALID',
          nodeId,
          message: `W=${ov.width} is not possible for ${plan.definitionId} at ${nodeId}: choose a catalog width from ${min} to ${max}.`,
          values: { width: ov.width },
        });
      }
    }
    if (ov?.radius !== undefined) {
      if (profile.allowedRadii.includes(ov.radius)) extra.radius = ov.radius;
      else {
        issues.push({
          severity: 'ERROR',
          code: 'OVERRIDE_INVALID',
          nodeId,
          message: `R=${ov.radius} at ${nodeId} is not a catalog radius (${profile.allowedRadii.join(' / ')}).`,
          values: { radius: ov.radius },
        });
      }
    }
    const p = params(plan.definitionId, { width, ...extra });
    choices.set(nodeId, {
      nodeId,
      definitionId: plan.definitionId,
      width,
      widthChoices: profile.allowedWidths.filter((w) => w >= min && w <= max),
      radius: p.radius,
      radiusChoices: [...profile.allowedRadii],
      ...(ov ? { override: { ...ov } } : {}),
    });
    return p;
  };

  const reachOf = (nodePos: Vec3, leg: Leg, point: Vec3, nodeId: string, what: string): number => {
    const rel = vec.sub(point, nodePos);
    const along = vec.dot(rel, leg.dir);
    const off = vec.length(vec.sub(rel, vec.scale(leg.dir, along)));
    if (off > 1 || along < -1e-6) {
      issues.push({ severity: 'ERROR', code: 'FITTING_MISALIGNED', nodeId, segmentId: leg.segment.id, message: `${what} at ${nodeId} is ${off.toFixed(1)} mm off segment ${leg.segment.id}.`, values: { offsetMm: +off.toFixed(3) } });
    }
    return Math.max(0, along);
  };

  // 1. Junction / bend fittings
  for (const [nodeId, legs] of graph.legs) {
    const node = graph.nodes.get(nodeId)!;
    const plan = classifyNode(nodeId, legs, profile, tol, issues);
    plans.set(nodeId, plan);
    if (plan.kind !== 'FITTING' || !offered(plan.definitionId, nodeId)) continue;
    const id = `${prefix}${nodeId}:${plan.definitionId}`;
    const fp = fittingParams(nodeId, plan);
    const placed = placeFittingOnNode(id, plan.definitionId, fp, node.position, plan.ports, plan.legs, tol);
    if (!placed) {
      issues.push({ severity: 'ERROR', code: 'JUNCTION_NOT_IN_CATALOG', nodeId, message: `${plan.definitionId} cannot be oriented to the segments at ${nodeId}.` });
      continue;
    }
    fittings.push({
      id,
      nodeId,
      role: 'FITTING',
      definitionId: plan.definitionId,
      instance: placed.instance,
      legs: [...placed.portLegs].map(([portId, leg]) => ({ segmentId: leg.segment.id, portId })),
    });
    for (const [portId, leg] of placed.portLegs) {
      const wp = worldPort(placed.instance, portId);
      const reducer = reducerOnLeg(nodeId, fp.width, leg, wp.worldPosition, wp.worldUp);
      const reach = reducer
        ? reachOf(node.position, leg, reducer.outerPoint, nodeId, 'Reducer')
        : reachOf(node.position, leg, wp.worldPosition, nodeId, plan.definitionId);
      ends.set(endKey(leg.segment.id, nodeId), { nodeId, segmentId: leg.segment.id, reachMm: reach, up: wp.worldUp, fitting: { id, portId }, reducer: reducer?.ref });
    }
  }

  for (const nodeId of Object.keys(options.nodeOverrides ?? {})) {
    if (!choices.has(nodeId)) {
      issues.push({ severity: 'WARNING', code: 'OVERRIDE_UNUSED', nodeId, message: `Fitting choice for ${nodeId} is ignored: there is no bend, tee or cross on that node.` });
    }
  }

  // 2. Collinear chains (through PASS / inline-reducer nodes) share one tray up.
  const parent = new Map(network.segments.map((s) => [s.id, s.id]));
  const find = (x: string): string => (parent.get(x) === x ? x : (parent.set(x, find(parent.get(x)!)), parent.get(x)!));
  for (const [nodeId, plan] of plans) {
    if (plan.kind !== 'PASS' && plan.kind !== 'INLINE_REDUCER') continue;
    const [a, b] = graph.legs.get(nodeId)!;
    parent.set(find(a.segment.id), find(b.segment.id));
  }
  const chainUp = new Map<string, Vec3>();
  for (const e of ends.values()) {
    if (!e.up) continue;
    const root = find(e.segmentId);
    const prev = chainUp.get(root);
    if (!prev) chainUp.set(root, e.up);
    else if (vec.dot(prev, e.up) < tol.cos) {
      issues.push({ severity: 'ERROR', code: 'VERTICAL_RUN_TWISTED', segmentId: e.segmentId, nodeId: e.nodeId, message: `The fittings at both ends of the run through ${e.segmentId} need different tray orientations; a tray cannot twist.` });
    }
  }
  const segmentDir = (s: TrayNetworkSegment) => vec.normalize(vec.sub(graph.nodes.get(s.to)!.position, graph.nodes.get(s.from)!.position));
  const upOfSegment = (s: TrayNetworkSegment): Vec3 => chainUp.get(find(s.id)) ?? defaultUp(segmentDir(s));

  // 3. Inline reducers and plain ends
  for (const [nodeId, plan] of plans) {
    const node = graph.nodes.get(nodeId)!;
    if (plan.kind === 'INLINE_REDUCER') {
      ends.set(endKey(plan.wide.segment.id, nodeId), { nodeId, segmentId: plan.wide.segment.id, reachMm: 0, up: null });
      const reducer = reducerOnLeg(nodeId, plan.wide.segment.width, plan.narrow, node.position, upOfSegment(plan.narrow.segment));
      const reach = reducer ? reachOf(node.position, plan.narrow, reducer.outerPoint, nodeId, 'Reducer') : 0;
      ends.set(endKey(plan.narrow.segment.id, nodeId), { nodeId, segmentId: plan.narrow.segment.id, reachMm: reach, up: null, reducer: reducer?.ref });
    }
    // Ends, unresolved junctions and fittings that could not be placed: the straight runs to the
    // node (the ERROR issue already reports what the catalog cannot build there).
    for (const leg of graph.legs.get(nodeId)!) {
      if (!ends.has(endKey(leg.segment.id, nodeId))) ends.set(endKey(leg.segment.id, nodeId), { nodeId, segmentId: leg.segment.id, reachMm: 0, up: null });
    }
  }

  // 4. Straight trays between the fittings' reach
  const straights: PlacedStraight[] = [];
  const straightDef = ComponentRegistry.get('TRAY_STRAIGHT')!;
  for (const s of network.segments) {
    const a = graph.nodes.get(s.from);
    const b = graph.nodes.get(s.to);
    const ea = ends.get(endKey(s.id, s.from));
    const eb = ends.get(endKey(s.id, s.to));
    if (!a || !b || !ea || !eb) continue;
    const d = vec.sub(b.position, a.position);
    const L = vec.length(d);
    const dir = vec.scale(d, 1 / L);
    const len = L - ea.reachMm - eb.reachMm;
    if (len < -0.5) {
      issues.push({
        severity: 'ERROR',
        code: 'SEGMENT_TOO_SHORT',
        segmentId: s.id,
        message: `Segment ${s.id} is ${(L / 1000).toFixed(3)} m; the fittings at its ends need ${((ea.reachMm + eb.reachMm) / 1000).toFixed(3)} m.`,
        values: { lengthMm: +L.toFixed(1), requiredMm: +(ea.reachMm + eb.reachMm).toFixed(1) },
      });
      continue;
    }
    if (len <= 0.5) continue;
    const start = vec.add(a.position, vec.scale(dir, ea.reachMm));
    const end = vec.sub(b.position, vec.scale(dir, eb.reachMm));
    const up = upOfSegment(s);
    const q = rotationFromFrames([0, 0, 1], [0, 1, 0], dir, up)!;
    const id = `${prefix}${s.id}:STRAIGHT`;
    const inst = new ComponentInstance(id, straightDef, params('TRAY_STRAIGHT', { width: s.width, length: len }), placementOf(q, vec.scale(vec.add(start, end), 0.5)));
    straights.push({ id, segmentId: s.id, start, end, lengthMm: len, up, instance: inst });
  }

  const ok = !issues.some((i) => i.severity === 'ERROR');
  const segmentEnds = Object.fromEntries(ends);
  const byId = new Map(fittings.map((f) => [f.id, f]));
  const straightOf = new Map(straights.map((s) => [s.segmentId, s]));
  const segById = new Map(network.segments.map((s) => [s.id, s]));

  const routeLength = (fittingId: string, p1: string, p2: string): number | undefined => {
    const f = byId.get(fittingId);
    const r = f?.instance.getCenterlines().find((x) => (x.fromPort === p1 && x.toPort === p2) || (x.fromPort === p2 && x.toPort === p1));
    return r?.analyticLength;
  };
  const reducerLength = (e: SegmentEnd | undefined) => (e?.reducer ? routeLength(e.reducer.id, 'PORT_A', 'PORT_B') ?? 0 : 0);

  const pathCenterline = (segmentIds: string[]): PathCenterline => {
    const out: PathCenterline = { lengthMm: 0, polylineMm: 0, ok: true, issues: [] };
    const fail = (msg: string) => {
      out.ok = false;
      out.issues.push(msg);
    };
    if (segmentIds.length === 0) return out;
    const segs = segmentIds.map((id) => segById.get(id));
    if (segs.some((s) => !s)) {
      fail('Unknown segment in path.');
      return out;
    }
    const shared = (x: TrayNetworkSegment, y: TrayNetworkSegment) => [x.from, x.to].find((n) => n === y.from || n === y.to);
    let current = segs.length > 1 ? (shared(segs[0]!, segs[1]!) === segs[0]!.from ? segs[0]!.to : segs[0]!.from) : segs[0]!.from;
    const startNode = current;
    segs.forEach((s, i) => {
      const next = s!.from === current ? s!.to : s!.to === current ? s!.from : undefined;
      if (!next) {
        fail(`Segment ${s!.id} does not continue the path at ${current}.`);
        return;
      }
      const a = graph.nodes.get(s!.from)!.position;
      const b = graph.nodes.get(s!.to)!.position;
      out.polylineMm += vec.length(vec.sub(b, a));
      const st = straightOf.get(s!.id);
      out.lengthMm += st ? st.lengthMm : 0;
      if (!st && (ends.get(endKey(s!.id, s!.from))?.reachMm ?? 0) + (ends.get(endKey(s!.id, s!.to))?.reachMm ?? 0) > vec.length(vec.sub(b, a)) + 0.5) {
        fail(`Segment ${s!.id} is too short for its fittings.`);
      }
      if (i < segs.length - 1) {
        const eIn = ends.get(endKey(s!.id, next));
        const eOut = ends.get(endKey(segs[i + 1]!.id, next));
        out.lengthMm += reducerLength(eIn) + reducerLength(eOut);
        if (eIn?.fitting && eOut?.fitting && eIn.fitting.id === eOut.fitting.id) {
          const r = routeLength(eIn.fitting.id, eIn.fitting.portId, eOut.fitting.portId);
          if (r === undefined) fail(`No route through ${eIn.fitting.id} from ${eIn.fitting.portId} to ${eOut.fitting.portId}.`);
          else out.lengthMm += r;
        } else if (eIn?.fitting || eOut?.fitting) {
          fail(`Path changes segment at ${next} without passing through its fitting.`);
        }
      }
      current = next;
    });
    // A route that starts or ends inside a fitting: count the straight reach to the node.
    for (const [nodeId, seg] of [
      [startNode, segs[0]!],
      [current, segs[segs.length - 1]!],
    ] as const) {
      const e = ends.get(endKey(seg.id, nodeId));
      if (e?.fitting || e?.reducer) out.lengthMm += e.reachMm;
    }
    return out;
  };

  const routePoints = (inst: ComponentInstance, from: string, to: string): Vec3[] => {
    const r = inst.getCenterlines().find((x) => (x.fromPort === from && x.toPort === to) || (x.fromPort === to && x.toPort === from));
    if (!r) return [];
    const pts = r.samplePoints.map((p) => Transforms.transformPoint(p as Vec3, inst.placement) as Vec3);
    return r.fromPort === from ? pts : pts.reverse();
  };

  const pathPoints = (segmentIds: string[]): Vec3[] => {
    const out: Vec3[] = [];
    const push = (pts: Vec3[]) =>
      pts.forEach((p) => {
        if (out.length === 0 || vec.length(vec.sub(p, out[out.length - 1])) > 1e-6) out.push(p);
      });
    const segs = segmentIds.map((id) => segById.get(id));
    if (segs.length === 0 || segs.some((s) => !s)) return out;
    const shared = (x: TrayNetworkSegment, y: TrayNetworkSegment) => [x.from, x.to].find((n) => n === y.from || n === y.to);
    let current = segs.length > 1 ? (shared(segs[0]!, segs[1]!) === segs[0]!.from ? segs[0]!.to : segs[0]!.from) : segs[0]!.from;
    // A route that starts or ends inside a fitting runs straight to the node (as pathCenterline counts it).
    const insideFitting = (seg: TrayNetworkSegment, nodeId: string) => {
      const e = ends.get(endKey(seg.id, nodeId));
      return !!(e?.fitting || e?.reducer);
    };
    if (insideFitting(segs[0]!, current)) push([graph.nodes.get(current)!.position]);
    for (let i = 0; i < segs.length; i++) {
      const s = segs[i]!;
      const next = s.from === current ? s.to : s.to === current ? s.from : undefined;
      if (!next) break;
      const st = straightOf.get(s.id);
      if (st) push(routePoints(st.instance, s.from === current ? 'PORT_A' : 'PORT_B', s.from === current ? 'PORT_B' : 'PORT_A'));
      if (i < segs.length - 1) {
        const eIn = ends.get(endKey(s.id, next));
        const eOut = ends.get(endKey(segs[i + 1]!.id, next));
        if (eIn?.reducer) push(routePoints(byId.get(eIn.reducer.id)!.instance, eIn.reducer.outerPort, eIn.reducer.innerPort));
        if (eIn?.fitting && eOut?.fitting && eIn.fitting.id === eOut.fitting.id) {
          push(routePoints(byId.get(eIn.fitting.id)!.instance, eIn.fitting.portId, eOut.fitting.portId));
        }
        if (eOut?.reducer) push(routePoints(byId.get(eOut.reducer.id)!.instance, eOut.reducer.innerPort, eOut.reducer.outerPort));
      }
      current = next;
    }
    if (insideFitting(segs[segs.length - 1]!, current)) push([graph.nodes.get(current)!.position]);
    return out;
  };

  const bom = (): TrayNetworkBom => {
    const fittingBom = BomManager.generateBom(fittings.map((f) => f.instance)).items;
    // Continuous straight runs: segments joined through PASS nodes are cut from the same stock.
    const runParent = new Map(network.segments.map((s) => [s.id, s.id]));
    const rf = (x: string): string => (runParent.get(x) === x ? x : (runParent.set(x, rf(runParent.get(x)!)), runParent.get(x)!));
    for (const [nodeId, plan] of plans) {
      if (plan.kind !== 'PASS') continue;
      const [a, b] = graph.legs.get(nodeId)!;
      runParent.set(rf(a.segment.id), rf(b.segment.id));
    }
    const runs = new Map<string, { width: number; height: number; length: number }>();
    for (const st of straights) {
      const s = segById.get(st.segmentId)!;
      const root = rf(s.id);
      const r = runs.get(root) ?? { width: s.width, height: s.height ?? profile.height, length: 0 };
      r.length += st.lengthMm;
      runs.set(root, r);
    }
    const style = profile.trayType === 'VENTILATED_THROUGH' ? 'Ventilated' : 'Ladder';
    const lines = new Map<string, StraightBomLine>();
    for (const r of runs.values()) {
      const spec = `${style} W=${r.width}mm H=${r.height}mm L=${profile.standardLength / 1000}m`;
      const line = lines.get(spec) ?? { spec, style, width: r.width, height: r.height, standardLengthMm: profile.standardLength, totalLengthMm: 0, pieces: 0, runs: 0 };
      line.totalLengthMm += r.length;
      line.pieces += Math.ceil(r.length / profile.standardLength - 1e-9);
      line.runs += 1;
      lines.set(spec, line);
    }
    return { fittings: fittingBom, straights: [...lines.values()].sort((x, y) => x.width - y.width) };
  };

  return {
    profileId: profile.id,
    network,
    fittings,
    straights,
    segmentEnds,
    issues,
    ok,
    instances: () => [...fittings.map((f) => f.instance), ...straights.map((s) => s.instance)],
    pathCenterline,
    pathPoints,
    fittingChoices: (nodeId: string) => choices.get(nodeId),
    bom,
  };
}

// ---------------------------------------------------------------------------
// Normalize
// ---------------------------------------------------------------------------

export interface NormalizedTrayNetwork {
  network: TrayNetwork;
  changes: NetworkChange[];
  issues: NetworkIssue[];
}

/**
 * Reach of the fittings on a vertical-tee replacement stub, measured by resolving a canonical
 * layout with the same resolver (tee branch + optional reducer, and the vertical bend).
 */
function stubLength(
  profile: TraySystemProfile,
  mainWidth: number,
  branchWidth: number,
  goesUp: boolean,
  options: TrayNetworkOptions,
  teeNodeId: string,
  bendNodeId: string
): number {
  const far = 100000;
  const canonical: TrayNetwork = {
    nodes: [
      { id: 'A', position: [-far, 0, 0] },
      { id: 'N', position: [0, 0, 0] },
      { id: 'B', position: [far, 0, 0] },
      { id: 'S', position: [0, 0, far] },
      { id: 'V', position: [0, goesUp ? far : -far, far] },
    ],
    segments: [
      { id: 'a', from: 'A', to: 'N', width: mainWidth },
      { id: 'b', from: 'N', to: 'B', width: mainWidth },
      { id: 's', from: 'N', to: 'S', width: branchWidth },
      { id: 'v', from: 'S', to: 'V', width: branchWidth },
    ],
  };
  // The designer's choices for the tee and the bend node apply to the canonical copy as well.
  const nodeOverrides: Record<string, FittingOverride> = {};
  if (options.nodeOverrides?.[teeNodeId]) nodeOverrides.N = options.nodeOverrides[teeNodeId];
  if (options.nodeOverrides?.[bendNodeId]) nodeOverrides.S = options.nodeOverrides[bendNodeId];
  const r = resolveTrayNetwork(canonical, profile, { ...options, nodeOverrides });
  return (r.segmentEnds[endKey('s', 'N')]?.reachMm ?? 0) + (r.segmentEnds[endKey('s', 'S')]?.reachMm ?? 0);
}

function pointSegmentDistance(p: Vec3, a: Vec3, b: Vec3): number {
  const ab = vec.sub(b, a);
  const t = Math.max(0, Math.min(1, vec.dot(vec.sub(p, a), ab) / Math.max(1e-9, vec.dot(ab, ab))));
  return vec.length(vec.sub(p, vec.add(a, vec.scale(ab, t))));
}

/**
 * Brings a network onto the catalog: widths to the next catalog width (never narrower), heights to
 * the profile height, and each vertical tee replaced by a level tee + horizontal stub + vertical
 * bend (the vertical run moves sideways by the stub length; its free end moves with it).
 * The returned changes let the host apply the same edits to its own project data.
 */
export function normalizeTrayNetwork(network: TrayNetwork, profile: TraySystemProfile, options: TrayNetworkOptions = {}): NormalizedTrayNetwork {
  const tol = tolerances(options);
  const changes: NetworkChange[] = [];
  const issues: NetworkIssue[] = [];
  const nodes = network.nodes.map((n) => ({ id: n.id, position: [...n.position] as Vec3 }));
  const segments = network.segments.map((s) => ({ ...s }));
  const maxW = Math.max(...profile.allowedWidths);

  for (const s of segments) {
    if (!profile.allowedWidths.includes(s.width)) {
      const w = profile.allowedWidths.find((x) => x >= s.width);
      if (w === undefined) {
        issues.push({ severity: 'ERROR', code: 'WIDTH_NOT_IN_CATALOG', segmentId: s.id, message: `Segment ${s.id} W=${s.width} exceeds the widest catalog tray (${maxW}); split it into parallel trays.` });
      } else {
        changes.push({ kind: 'SEGMENT_WIDTH', segmentId: s.id, from: s.width, to: w, reason: `W=${s.width} is not a catalog width; next catalog width is ${w}.` });
        issues.push({ severity: 'WARNING', code: 'WIDTH_ADJUSTED', segmentId: s.id, message: `Segment ${s.id} widened from ${s.width} to catalog W=${w}.`, values: { from: s.width, to: w } });
        s.width = w;
      }
    }
    if (s.height !== undefined && s.height !== profile.height) {
      changes.push({ kind: 'SEGMENT_HEIGHT', segmentId: s.id, from: s.height, to: profile.height, reason: `${profile.name} is H=${profile.height}.` });
      issues.push({ severity: 'WARNING', code: 'HEIGHT_ADJUSTED', segmentId: s.id, message: `Segment ${s.id} height set to catalog H=${profile.height}.`, values: { from: s.height, to: profile.height } });
      s.height = profile.height;
    }
  }

  // Vertical tees → level tee + stub + vertical bend.
  const net: TrayNetwork = { nodes, segments };
  const graph = buildGraph(net, tol.sin);
  const prefix = options.idPrefix ?? '';
  for (const [nodeId, legs] of graph.legs) {
    if (legs.length !== 3) continue;
    let main: Leg[] | null = null;
    let vert: Leg | null = null;
    for (let i = 0; i < 3 && !main; i++) {
      for (let j = i + 1; j < 3 && !main; j++) {
        const k = 3 - i - j;
        if (vec.dot(legs[i].dir, legs[j].dir) < -tol.cos && legs[i].level && legs[j].level && !legs[k].level) {
          main = [legs[i], legs[j]];
          vert = legs[k];
        }
      }
    }
    if (!main || !vert) continue;
    const node = graph.nodes.get(nodeId)!;
    const vh = Math.hypot(vert.dir[0], vert.dir[2]);
    const farLegs = graph.legs.get(vert.otherId) ?? [];
    if (vh > tol.sin || farLegs.length !== 1) {
      issues.push({
        severity: 'ERROR',
        code: 'VERTICAL_TEE_UNRESOLVED',
        nodeId,
        segmentId: vert.segment.id,
        message:
          vh > tol.sin
            ? `Vertical tee at ${nodeId}: the branch ${vert.segment.id} is inclined; only a plumb branch can be replaced automatically.`
            : `Vertical tee at ${nodeId}: the far end of ${vert.segment.id} is connected to other trays, so the run cannot be moved; redesign this junction.`,
      });
      continue;
    }
    const mainWidth = Math.max(main[0].segment.width, main[1].segment.width);
    const goesUp = vert.dir[1] > 0;
    const stubNodeId = `${prefix}${nodeId}~VT`;
    const L = stubLength(profile, mainWidth, vert.segment.width, goesUp, options, nodeId, stubNodeId);
    const perp = vec.normalize(vec.cross(WORLD_UP, vec.scale(main[0].dir, -1)));
    const far = graph.nodes.get(vert.otherId)!;
    const clearance = (side: 1 | -1) => {
      const off = vec.scale(perp, side * L);
      const p = vec.add(node.position, off);
      const q = vec.add(far.position, off);
      let m = Infinity;
      for (const s of segments) {
        if (s.id === vert!.segment.id || s.from === nodeId || s.to === nodeId) continue;
        const a = graph.nodes.get(s.from)?.position;
        const b = graph.nodes.get(s.to)?.position;
        if (!a || !b) continue;
        m = Math.min(m, pointSegmentDistance(p, a, b), pointSegmentDistance(q, a, b));
      }
      return m;
    };
    const side = options.verticalTeeSide?.(nodeId) ?? (clearance(1) >= clearance(-1) ? 1 : -1);
    const offset = vec.scale(perp, side * L);
    const stubSegId = `${prefix}${vert.segment.id}~STUB`;
    const stubPos = vec.clean(vec.add(node.position, offset));
    nodes.push({ id: stubNodeId, position: stubPos });
    const farNode = nodes.find((n) => n.id === far.id)!;
    const farTo = vec.clean(vec.add(far.position, offset));
    const seg = segments.find((s) => s.id === vert!.segment.id)!;
    const before = { from: seg.from, to: seg.to };
    if (seg.from === nodeId) seg.from = stubNodeId;
    else seg.to = stubNodeId;
    segments.push({ id: stubSegId, from: nodeId, to: stubNodeId, width: seg.width, height: seg.height });
    changes.push({ kind: 'NODE_ADDED', nodeId: stubNodeId, position: stubPos, reason: `Top of the relocated vertical run (vertical tee at ${nodeId} is not in the catalog).` });
    changes.push({ kind: 'SEGMENT_ADDED', segmentId: stubSegId, from: nodeId, to: stubNodeId, width: seg.width, reason: `Horizontal stub from the tee branch to the vertical bend (${(L / 1000).toFixed(3)} m).` });
    changes.push({ kind: 'SEGMENT_RECONNECTED', segmentId: seg.id, before, after: { from: seg.from, to: seg.to }, reason: 'Vertical run starts at the stub end.' });
    changes.push({ kind: 'NODE_MOVED', nodeId: far.id, from: [...far.position] as Vec3, to: farTo, reason: 'Free end of the vertical run moves with it.' });
    farNode.position = farTo;
    issues.push({
      severity: 'WARNING',
      code: 'VERTICAL_TEE_REPLACED',
      nodeId,
      segmentId: seg.id,
      message: `Vertical tee at ${nodeId} replaced by a level tee, a ${(L / 1000).toFixed(3)} m stub and a vertical bend; ${far.id} moves ${(L / 1000).toFixed(3)} m sideways.`,
      values: { stubMm: +L.toFixed(1), side },
    });
  }

  return { network: { nodes, segments }, changes, issues };
}

/**
 * Updates a route (consecutive segment ids, e.g. a cable path) for the changes made by
 * normalizeTrayNetwork(): where a route passed from the main run into a replaced vertical tee's
 * vertical run, the new horizontal stub is inserted between them.
 */
export function updateRouteForChanges(segmentIds: string[], normalized: NormalizedTrayNetwork): string[] {
  const segs = new Map(normalized.network.segments.map((s) => [s.id, s]));
  const stubs = normalized.changes
    .filter((c): c is Extract<NetworkChange, { kind: 'SEGMENT_ADDED' }> => c.kind === 'SEGMENT_ADDED')
    .map((added) => {
      const moved = normalized.changes.find(
        (c): c is Extract<NetworkChange, { kind: 'SEGMENT_RECONNECTED' }> =>
          c.kind === 'SEGMENT_RECONNECTED' && (c.after.from === added.to || c.after.to === added.to)
      );
      return moved ? { stub: added.segmentId, junction: added.from, vertical: moved.segmentId } : null;
    })
    .filter((x): x is { stub: string; junction: string; vertical: string } => !!x);
  const touches = (segmentId: string, nodeId: string) => {
    const s = segs.get(segmentId);
    return !!s && (s.from === nodeId || s.to === nodeId);
  };
  const out: string[] = [];
  segmentIds.forEach((id) => {
    const prev = out[out.length - 1];
    const stubBefore = stubs.find((x) => x.vertical === id && prev !== undefined && prev !== x.stub && touches(prev, x.junction));
    const stubAfter = stubs.find((x) => x.vertical === prev && id !== x.stub && touches(id, x.junction));
    if (stubBefore) out.push(stubBefore.stub);
    if (stubAfter) out.push(stubAfter.stub);
    out.push(id);
  });
  return out;
}
