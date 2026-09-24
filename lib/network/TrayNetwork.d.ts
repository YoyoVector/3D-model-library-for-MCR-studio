import { Vec3 } from '../geometry/SweepPath.ts';
import { ComponentInstance } from '../core/Instance.ts';
import { TraySystemProfile } from '../registry/TraySystemProfile.ts';
import { BomLineItem } from '../bom/BomManager.ts';
import { PlanFrame, PlanPoint } from './PlanFrames.ts';
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
export type NetworkIssueCode = 'INVALID_NETWORK' | 'WIDTH_ADJUSTED' | 'HEIGHT_ADJUSTED' | 'HEIGHT_NOT_IN_CATALOG' | 'WIDTH_NOT_IN_CATALOG' | 'VERTICAL_TEE_REPLACED' | 'VERTICAL_TEE_UNRESOLVED' | 'ANGLE_NOT_IN_CATALOG' | 'JUNCTION_NOT_IN_CATALOG' | 'FITTING_NOT_OFFERED' | 'SEGMENT_TOO_SHORT' | 'VERTICAL_RUN_TWISTED' | 'FITTING_MISALIGNED';
export interface NetworkIssue {
    severity: 'ERROR' | 'WARNING';
    code: NetworkIssueCode;
    message: string;
    nodeId?: string;
    segmentId?: string;
    values?: Record<string, number | string>;
}
export type NetworkChange = {
    kind: 'SEGMENT_WIDTH';
    segmentId: string;
    from: number;
    to: number;
    reason: string;
} | {
    kind: 'SEGMENT_HEIGHT';
    segmentId: string;
    from: number;
    to: number;
    reason: string;
} | {
    kind: 'NODE_ADDED';
    nodeId: string;
    position: Vec3;
    reason: string;
} | {
    kind: 'NODE_MOVED';
    nodeId: string;
    from: Vec3;
    to: Vec3;
    reason: string;
} | {
    kind: 'SEGMENT_ADDED';
    segmentId: string;
    from: string;
    to: string;
    width: number;
    reason: string;
} | {
    kind: 'SEGMENT_RECONNECTED';
    segmentId: string;
    before: {
        from: string;
        to: string;
    };
    after: {
        from: string;
        to: string;
    };
    reason: string;
};
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
}
/** Builds a world-frame network from host plan coordinates through ONE PlanFrame. */
export declare function trayNetworkFromPlan(nodes: Array<PlanPoint & {
    id: string;
}>, segments: TrayNetworkSegment[], frame: PlanFrame): TrayNetwork;
export interface PlacedFitting {
    id: string;
    nodeId: string;
    role: 'FITTING' | 'REDUCER';
    definitionId: string;
    instance: ComponentInstance;
    /** Which segment each port connects to. */
    legs: Array<{
        segmentId: string;
        portId: string;
    }>;
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
    fitting?: {
        id: string;
        portId: string;
    };
    /** Reducer between the fitting (or node) and the straight. */
    reducer?: {
        id: string;
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
    bom(): TrayNetworkBom;
}
/**
 * Resolves a catalog-true installation for a tray network. The network should first pass
 * through normalizeTrayNetwork(); anything the catalog cannot build is reported as an ERROR
 * issue instead of being approximated.
 */
export declare function resolveTrayNetwork(network: TrayNetwork, profile: TraySystemProfile, options?: TrayNetworkOptions): TrayNetworkLayout;
export interface NormalizedTrayNetwork {
    network: TrayNetwork;
    changes: NetworkChange[];
    issues: NetworkIssue[];
}
/**
 * Brings a network onto the catalog: widths to the next catalog width (never narrower), heights to
 * the profile height, and each vertical tee replaced by a level tee + horizontal stub + vertical
 * bend (the vertical run moves sideways by the stub length; its free end moves with it).
 * The returned changes let the host apply the same edits to its own project data.
 */
export declare function normalizeTrayNetwork(network: TrayNetwork, profile: TraySystemProfile, options?: TrayNetworkOptions): NormalizedTrayNetwork;
/**
 * Updates a route (consecutive segment ids, e.g. a cable path) for the changes made by
 * normalizeTrayNetwork(): where a route passed from the main run into a replaced vertical tee's
 * vertical run, the new horizontal stub is inserted between them.
 */
export declare function updateRouteForChanges(segmentIds: string[], normalized: NormalizedTrayNetwork): string[];
