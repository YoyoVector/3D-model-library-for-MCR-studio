/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */
import * as THREE from 'three';
/**
 * Procedural Geometry Generator for Parametric 3D Engineering Components.
 * Generates true 3D meshes with exact vertex placement from millimeter parameters.
 * Scale of all returned groups is strictly (1, 1, 1).
 */
export declare class GeometryGenerators {
    /**
     * Builds a straight ladder tray with rungs and end splice plates.
     */
    static buildStraightTray(params: {
        width: number;
        depth: number;
        length: number;
        rungSpacing?: number;
        hasSplicePlates?: boolean;
        hasDivider?: boolean;
        isIS?: boolean;
    }): THREE.Group;
    /**
     * Builds an individual splice plate assembly.
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
     * Generic Angle Horizontal Elbow (45°, 90°, or non-standard).
     */
    static buildHorizontalElbow(params: {
        width: number;
        depth: number;
        radius: number;
        angleDeg: number;
        isIS?: boolean;
    }): THREE.Group;
    /**
     * Helper to create an extruded curved rail mesh.
     */
    private static createArcRail;
    /**
     * Horizontal Tee.
     */
    static buildHorizontalTee(params: {
        width: number;
        depth: number;
        length: number;
        branchLength: number;
        isIS?: boolean;
    }): THREE.Group;
    /**
     * Generic Angle Vertical Riser (Inside or Outside, 45° or 90°).
     */
    static buildVerticalRiser(params: {
        width: number;
        depth: number;
        radius: number;
        angleDeg: number;
        isOutside?: boolean;
        isIS?: boolean;
    }): THREE.Group;
    /**
     * Concentric, Left Eccentric, or Right Eccentric Reducer.
     */
    static buildReducer(params: {
        inletWidth: number;
        outletWidth: number;
        depth: number;
        length: number;
        type: 'CONCENTRIC' | 'LEFT' | 'RIGHT';
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
}
