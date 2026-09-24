/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Pure-math "turtle" paths used by every tray / fitting layout.
 *
 * A path starts from a frame (position, travel tangent, tray up) and is advanced by
 * LINE / ARC / TURN commands. The same path object is sampled for:
 *   - centerline route sample points and analytic length,
 *   - port positions / directions (path end frames),
 *   - analytic bounds of swept tray sections,
 *   - the swept mesh itself (GeometryGenerators).
 *
 * Arc sampling always includes the angles at which the radial vector is parallel to a
 * world axis, so swept section corners hit their exact axis extremes. Bounds computed from
 * the samples are therefore exact (not chord approximations) and identical to the mesh bounds.
 *
 * Units: millimetres. No Three.js dependency.
 */

export type Vec3 = [number, number, number];

export const vec = {
  add: (a: Vec3, b: Vec3): Vec3 => [a[0] + b[0], a[1] + b[1], a[2] + b[2]],
  sub: (a: Vec3, b: Vec3): Vec3 => [a[0] - b[0], a[1] - b[1], a[2] - b[2]],
  scale: (a: Vec3, s: number): Vec3 => [a[0] * s, a[1] * s, a[2] * s],
  dot: (a: Vec3, b: Vec3): number => a[0] * b[0] + a[1] * b[1] + a[2] * b[2],
  cross: (a: Vec3, b: Vec3): Vec3 => [
    a[1] * b[2] - a[2] * b[1],
    a[2] * b[0] - a[0] * b[2],
    a[0] * b[1] - a[1] * b[0],
  ],
  length: (a: Vec3): number => Math.hypot(a[0], a[1], a[2]),
  normalize: (a: Vec3): Vec3 => {
    const l = Math.hypot(a[0], a[1], a[2]);
    return l === 0 ? [0, 0, 0] : [a[0] / l, a[1] / l, a[2] / l];
  },
  /** Linear combination sum(v_i * s_i). */
  combine: (...terms: Array<[Vec3, number]>): Vec3 => {
    const out: Vec3 = [0, 0, 0];
    for (const [v, s] of terms) {
      out[0] += v[0] * s;
      out[1] += v[1] * s;
      out[2] += v[2] * s;
    }
    return out;
  },
  /** Rodrigues rotation of v about unit axis a by angle (rad). */
  rotate: (v: Vec3, a: Vec3, angle: number): Vec3 => {
    const c = Math.cos(angle);
    const s = Math.sin(angle);
    const axv = vec.cross(a, v);
    const adv = vec.dot(a, v);
    return [
      v[0] * c + axv[0] * s + a[0] * adv * (1 - c),
      v[1] * c + axv[1] * s + a[1] * adv * (1 - c),
      v[2] * c + axv[2] * s + a[2] * adv * (1 - c),
    ];
  },
  /** Removes floating noise (|x| < 1e-9 -> 0) for stable, readable port coordinates. */
  clean: (a: Vec3): Vec3 => [
    Math.abs(a[0]) < 1e-9 ? 0 : a[0],
    Math.abs(a[1]) < 1e-9 ? 0 : a[1],
    Math.abs(a[2]) < 1e-9 ? 0 : a[2],
  ],
};

/**
 * Local moving frame. `tangent` is the travel direction, `up` the tray-up direction
 * (from tray bottom toward the open / cover side). `side` = up x tangent, matching the
 * PortFrame "right" convention (right = up x direction).
 */
export interface PathFrame {
  position: Vec3;
  tangent: Vec3;
  up: Vec3;
}

export type PathSegment =
  | { kind: 'LINE'; length: number }
  /**
   * Circular arc: the frame rotates about its local UP axis (horizontal bend) or its local
   * SIDE axis (vertical bend) by a signed angle. Positive angle turns the tangent toward
   * (axis x tangent); the turn centre lies `radius` away in that direction.
   */
  | { kind: 'ARC'; axis: 'UP' | 'SIDE'; angleRad: number; radius: number }
  /** Zero-radius kink about the local UP axis (mitred corner, e.g. reducer taper). */
  | { kind: 'TURN'; angleRad: number };

export interface TurtlePath {
  start: PathFrame;
  segments: PathSegment[];
}

export interface PathStation {
  position: Vec3;
  tangent: Vec3;
  up: Vec3;
  side: Vec3;
  /**
   * Present at mitred kinks and at plane-cut path ends: vector used instead of `side` for section
   * offsets, so the section lies in the mitre / cut plane.
   */
  miterSide?: Vec3;
  /** Normal of the end-cap plane when it differs from the tangent (plane-cut ends). */
  capNormal?: Vec3;
  /** Arc length from path start (mm). */
  s: number;
}

export interface SampleOptions {
  /** Maximum arc step (radians). Default 3 degrees. */
  maxArcStepRad?: number;
  /** Maximum straight-line step (mm). Default: only segment end points. */
  maxLineStep?: number;
}

const EPS = 1e-9;

export function sideOf(frame: { tangent: Vec3; up: Vec3 }): Vec3 {
  return vec.normalize(vec.cross(frame.up, frame.tangent));
}

function cloneFrame(f: PathFrame): PathFrame {
  return { position: [...f.position] as Vec3, tangent: [...f.tangent] as Vec3, up: [...f.up] as Vec3 };
}

function arcAxis(frame: PathFrame, axis: 'UP' | 'SIDE'): Vec3 {
  return axis === 'UP' ? vec.normalize(frame.up) : sideOf(frame);
}

/** Centre of an ARC segment starting at `frame`. */
export function arcCenter(frame: PathFrame, seg: { axis: 'UP' | 'SIDE'; angleRad: number; radius: number }): Vec3 {
  const a = arcAxis(frame, seg.axis);
  const n = vec.normalize(vec.cross(a, frame.tangent));
  return vec.add(frame.position, vec.scale(n, Math.sign(seg.angleRad) * seg.radius));
}

/** Applies one segment to a frame (returns a new frame). */
export function advanceFrame(frame: PathFrame, seg: PathSegment): PathFrame {
  const f = cloneFrame(frame);
  if (seg.kind === 'LINE') {
    f.position = vec.add(f.position, vec.scale(f.tangent, seg.length));
    return f;
  }
  if (seg.kind === 'TURN') {
    const a = vec.normalize(f.up);
    f.tangent = vec.normalize(vec.rotate(f.tangent, a, seg.angleRad));
    return f;
  }
  const a = arcAxis(f, seg.axis);
  const c = arcCenter(f, seg);
  f.position = vec.add(c, vec.rotate(vec.sub(f.position, c), a, seg.angleRad));
  f.tangent = vec.normalize(vec.rotate(f.tangent, a, seg.angleRad));
  f.up = vec.normalize(vec.rotate(f.up, a, seg.angleRad));
  return f;
}

/** End frame of the whole path. */
export function pathEndFrame(path: TurtlePath): PathFrame {
  return path.segments.reduce((f, s) => advanceFrame(f, s), cloneFrame(path.start));
}

/** Exact analytic length of the path (arcs use radius * |angle|; TURN adds 0). */
export function pathLength(path: TurtlePath): number {
  return path.segments.reduce((sum, s) => {
    if (s.kind === 'LINE') return sum + Math.abs(s.length);
    if (s.kind === 'ARC') return sum + Math.abs(s.radius * s.angleRad);
    return sum;
  }, 0);
}

/** Angles in the open interval (0, sweep) where the radial vector of an arc is axis-extremal. */
function criticalArcAngles(r0: Vec3, axis: Vec3, sweep: number): number[] {
  const w = vec.cross(axis, r0);
  const lo = Math.min(0, sweep);
  const hi = Math.max(0, sweep);
  const out: number[] = [];
  for (let k = 0; k < 3; k++) {
    if (Math.abs(r0[k]) < EPS && Math.abs(w[k]) < EPS) continue;
    const base = Math.atan2(w[k], r0[k]);
    for (let n = -4; n <= 4; n++) {
      const g = base + n * Math.PI;
      if (g > lo + 1e-7 && g < hi - 1e-7) out.push(g);
    }
  }
  return out;
}

/**
 * Side vector of a section cut by the plane with normal `n` instead of the plane normal to the
 * tangent: the true section point P + s·side is projected along the tangent onto the cut plane.
 */
function cutSide(frame: PathFrame, n: Vec3): Vec3 {
  const side = sideOf(frame);
  const t = vec.normalize(frame.tangent);
  const tn = vec.dot(t, n);
  if (Math.abs(tn) < 1e-9) return side;
  return vec.sub(side, vec.scale(t, vec.dot(side, n) / tn));
}

function hasAdvanceAfter(segments: PathSegment[], index: number): boolean {
  for (let i = index + 1; i < segments.length; i++) {
    const s = segments[i];
    if (s.kind === 'LINE' && Math.abs(s.length) >= EPS) return true;
    if (s.kind === 'ARC' && Math.abs(s.angleRad) >= EPS && s.radius > 0) return true;
  }
  return false;
}

function makeStation(f: PathFrame, s: number): PathStation {
  return {
    position: [...f.position] as Vec3,
    tangent: vec.normalize(f.tangent),
    up: vec.normalize(f.up),
    side: sideOf(f),
    s,
  };
}

/**
 * Samples a path into stations. Guarantees:
 *  - first station = path start, last station = path end,
 *  - arcs include axis-extreme angles (exact bounds),
 *  - TURN kinks produce a single mitred station.
 */
export function samplePath(path: TurtlePath, opts: SampleOptions = {}): PathStation[] {
  const maxArc = opts.maxArcStepRad ?? (3 * Math.PI) / 180;
  const maxLine = opts.maxLineStep ?? Infinity;
  let f = cloneFrame(path.start);
  let s = 0;
  const stations: PathStation[] = [makeStation(f, 0)];

  path.segments.forEach((seg, index) => {
    if (seg.kind === 'LINE') {
      if (Math.abs(seg.length) < EPS) return;
      const n = Math.max(1, Math.ceil(Math.abs(seg.length) / maxLine));
      for (let i = 1; i <= n; i++) {
        const g = advanceFrame(f, { kind: 'LINE', length: (seg.length * i) / n });
        stations.push(makeStation(g, s + (Math.abs(seg.length) * i) / n));
      }
      f = advanceFrame(f, seg);
      s += Math.abs(seg.length);
      return;
    }

    if (seg.kind === 'TURN') {
      if (Math.abs(seg.angleRad) < EPS) return;
      const g = advanceFrame(f, seg);
      const last = stations[stations.length - 1];
      if (stations.length === 1) {
        // Kink at the very start: the body starts along the new direction but is cut by the
        // original start plane (normal = start tangent), so nothing protrudes past the port.
        const n = vec.normalize(f.tangent);
        stations[0] = { ...makeStation(g, 0), miterSide: cutSide(g, n), capNormal: n };
      } else if (!hasAdvanceAfter(path.segments, index)) {
        // Kink at the very end: cut the last section by the final plane (normal = new tangent).
        const n = vec.normalize(g.tangent);
        last.miterSide = cutSide(f, n);
        last.capNormal = n;
      } else {
        const bis = vec.normalize(vec.add(sideOf(f), sideOf(g)));
        last.miterSide = vec.scale(bis, 1 / Math.cos(seg.angleRad / 2));
      }
      f = g;
      return;
    }

    // ARC
    if (Math.abs(seg.angleRad) < EPS || seg.radius <= 0) return;
    const a = arcAxis(f, seg.axis);
    const c = arcCenter(f, seg);
    const r0 = vec.sub(f.position, c);
    const n = Math.max(2, Math.ceil(Math.abs(seg.angleRad) / maxArc));
    const angles = new Set<number>();
    for (let i = 1; i <= n; i++) angles.add((seg.angleRad * i) / n);
    criticalArcAngles(r0, a, seg.angleRad).forEach((g) => angles.add(g));
    const sorted = Array.from(angles).sort((x, y) => Math.abs(x) - Math.abs(y));
    sorted.forEach((g) => {
      const part = { kind: 'ARC' as const, axis: seg.axis, angleRad: g, radius: seg.radius };
      stations.push(makeStation(advanceFrame(f, part), s + Math.abs(g * seg.radius)));
    });
    f = advanceFrame(f, seg);
    s += Math.abs(seg.angleRad * seg.radius);
  });

  // Snap the final station exactly onto the analytic end frame.
  const end = makeStation(f, s);
  const prev = stations[stations.length - 1];
  stations[stations.length - 1] = { ...end, miterSide: prev.miterSide, capNormal: prev.capNormal };
  return stations;
}

/** Frame (position/tangent/up) at an arc-length station along the path. */
export function frameAtLength(path: TurtlePath, target: number): PathFrame {
  let f = cloneFrame(path.start);
  let remaining = target;
  for (const seg of path.segments) {
    if (seg.kind === 'TURN') {
      if (remaining <= EPS) return f;
      f = advanceFrame(f, seg);
      continue;
    }
    const len = seg.kind === 'LINE' ? Math.abs(seg.length) : Math.abs(seg.radius * seg.angleRad);
    if (remaining <= len + EPS) {
      if (seg.kind === 'LINE') {
        return advanceFrame(f, { kind: 'LINE', length: Math.sign(seg.length || 1) * remaining });
      }
      const g = (remaining / Math.abs(seg.radius)) * Math.sign(seg.angleRad);
      return advanceFrame(f, { kind: 'ARC', axis: seg.axis, angleRad: g, radius: seg.radius });
    }
    remaining -= len;
    f = advanceFrame(f, seg);
  }
  return f;
}

/** A rectangle of the tray section in (side, up) coordinates of the moving frame. */
export interface SectionRect {
  side: [number, number];
  up: [number, number];
}

/** Section corner position at a station. */
export function sectionPoint(st: PathStation, sideOffset: number, upOffset: number): Vec3 {
  const sv = st.miterSide ?? st.side;
  return vec.combine([st.position, 1], [sv, sideOffset], [st.up, upOffset]);
}

/** Axis-aligned bounding box accumulator (mm). */
export class BoundsAccumulator {
  public min: Vec3 = [Infinity, Infinity, Infinity];
  public max: Vec3 = [-Infinity, -Infinity, -Infinity];

  add(p: Vec3): void {
    for (let k = 0; k < 3; k++) {
      if (p[k] < this.min[k]) this.min[k] = p[k];
      if (p[k] > this.max[k]) this.max[k] = p[k];
    }
  }

  get isEmpty(): boolean {
    return !Number.isFinite(this.min[0]);
  }

  result(): { min: Vec3; max: Vec3 } {
    return { min: vec.clean(this.min), max: vec.clean(this.max) };
  }
}
