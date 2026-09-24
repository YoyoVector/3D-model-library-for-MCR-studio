import { TrayLayout } from './TrayLayouts.ts';
import { TrayMeshOptions } from './TrayMeshBuilder.ts';
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */
import * as THREE from 'three';
/**
 * Procedural Geometry Generator for Parametric 3D Engineering Components.
 * Generates true 3D meshes with exact vertex placement from millimeter parameters.
 * Scale of all returned groups is strictly (1, 1, 1).
 *
 * Cable tray and fitting builders delegate to the single engineering formula layer
 * (TrayLayouts.ts): the mesh is built from the same layout object that produces the
 * component's ports, centerline routes and bounds.
 */
export declare class GeometryGenerators {
    /**
     * Builds the mesh group of any resolved tray layout.
     */
    static buildTrayLayout(layout: TrayLayout, options?: TrayMeshOptions): THREE.Group;
    /**
     * Straight ladder / ventilated-through tray (catalog PDF p.4, p.30, p.41).
     * Splice plates are optional small-accessory visuals (default off); they are tagged as
     * accessories and never count as tray body.
     */
    static buildStraightTray(params: {
        width: number;
        depth: number;
        length: number;
        rungSpacing?: number;
        hasSplicePlates?: boolean;
        hasDivider?: boolean;
        dividerHeight?: number;
        trayStyle?: string;
        isIS?: boolean;
    }): THREE.Group;
    /**
     * Builds an individual splice plate assembly (accessory visual).
     */
    static buildSplicePlateMesh(depthM?: number): THREE.Group;
    static buildSplicePlate(params?: {
        depth?: number;
    }): THREE.Group;
    /**
     * Builds a cantilever support bracket.
     */
    static buildCantileverSupport(params: {
        width?: number;
        depth?: number;
        armLength?: number;
        channelHeight?: number;
    }): THREE.Group;
    /**
     * Horizontal elbow of any angle (catalog PDF p.5–8). `radius` is the catalog inner radius R;
     * the routing centerline radius is R + W/2. Optional straight tangents (catalog 125 mm).
     */
    static buildHorizontalElbow(params: {
        width: number;
        depth: number;
        radius: number;
        angleDeg: number;
        tangentLength?: number;
        trayStyle?: string;
        isIS?: boolean;
    }): THREE.Group;
    /**
     * Horizontal Tee (catalog PDF p.9): radius-R curved transitions from the main run into the
     * branch, 125 mm tangents. Main span = W + 2R + 2T, branch projection = W/2 + R + T.
     */
    static buildHorizontalTee(params: {
        width: number;
        depth: number;
        radius?: number;
        tangentLength?: number;
        length?: number;
        branchLength?: number;
        trayStyle?: string;
        isIS?: boolean;
    }): THREE.Group;
    /**
     * Vertical inside (rising, p.11–14) or outside (falling, p.15–18) bend.
     * `radius` is the catalog inner radius R; the routing centerline radius is R + H/2.
     */
    static buildVerticalRiser(params: {
        width: number;
        depth: number;
        radius: number;
        angleDeg: number;
        tangentLength?: number;
        isOutside?: boolean;
        trayStyle?: string;
        isIS?: boolean;
    }): THREE.Group;
    /**
     * Centre, left or right reducer (catalog PDF p.19–21): T straight at W1, taper, T straight at W2.
     * LEFT keeps the left rail straight when viewed from the wide end toward the narrow end.
     */
    static buildReducer(params: {
        inletWidth: number;
        outletWidth: number;
        depth: number;
        length: number;
        tangentLength?: number;
        type: 'CONCENTRIC' | 'LEFT' | 'RIGHT';
        trayStyle?: string;
        isIS?: boolean;
    }): THREE.Group;
    /**
     * Junction Box (Ex d / Ex e industrial enclosure).
     */
    static buildJunctionBox(params: {
        width: number;
        height: number;
        depth: number;
        boxType: 'IS' | 'NON_IS' | 'FIBER';
    }): THREE.Group;
    /**
     * Unistrut channel clamp / mounting bracket.
     */
    static buildUnistrutMount(params: {
        length: number;
    }): THREE.Group;
    /**
     * Rigid Steel Conduit riser pipe.
     */
    static buildConduitRiser(params: {
        diameterMm: number;
        lengthMm: number;
    }): THREE.Group;
    /**
     * MCT Penetration Transit Frame (Roxtec RG M6x1 style).
     */
    static buildMctPenetration(params: {
        widthMm: number;
        heightMm: number;
        thicknessMm: number;
    }): THREE.Group;
    /**
     * Control Cabinet (DCS / SIS / COM marshalling rack).
     */
    static buildControlCabinet(params: {
        widthMm: number;
        heightMm: number;
        depthMm: number;
        stripeColorHex: number;
    }): THREE.Group;
    /**
     * Structural H-Beam Steel Column.
     */
    static buildStructuralColumn(params: {
        heightMm: number;
        widthMm?: number;
    }): THREE.Group;
    /**
     * Structural Concrete Pier foundation.
     */
    static buildStructuralPier(params: {
        widthMm?: number;
        heightMm?: number;
    }): THREE.Group;
    /**
     * Structural Cross Beam (transverse pipe rack support).
     */
    static buildStructuralCrossBeam(params: {
        spanMm: number;
        heightMm?: number;
        depthMm?: number;
    }): THREE.Group;
    /**
     * Structural Longitudinal Stringer Beam.
     */
    static buildStructuralStringer(params: {
        spanMm: number;
    }): THREE.Group;
    /**
     * Process & Steam Piping obstacle models.
     */
    static buildPipe(params: {
        diameterMm: number;
        lengthMm: number;
        isSteam?: boolean;
        axis?: 'X' | 'Z';
    }): THREE.Group;
    /**
     * Thermal Hazard Zone obstacle envelope.
     */
    static buildHazardZone(params: {
        widthMm: number;
        heightMm: number;
        depthMm: number;
    }): THREE.Group;
    /**
     * Control Room Building and Raised Floor Context.
     */
    static buildBuildingContext(params: {
        widthMm: number;
        heightMm: number;
        depthMm: number;
    }): THREE.Group;
    /**
     * Visual Cable Bundle with flowing glow effect.
     */
    static buildVisualCable(params: {
        pathPoints: Array<[number, number, number]>;
        radiusMm?: number;
        colorHex?: number;
        emissiveHex?: number;
    }): THREE.Group;
    /**
     * Horizontal Cross (catalog PDF p.10): four radius-R curved corners, 125 mm tangents,
     * span = W + 2R + 2T along both axes.
     */
    static buildHorizontalCross(params: {
        width: number;
        depth: number;
        radius?: number;
        length?: number;
        tangentLength?: number;
        trayStyle?: string;
        isIS?: boolean;
    }): THREE.Group;
}
