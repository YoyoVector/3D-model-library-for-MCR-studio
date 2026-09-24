import { ComponentDefinition, EngineeringPlacement, WorldPortDefinition, CenterlineRouteDefinition, ComponentBoundsDefinition, GeometryBuildOptions } from './Schema.ts';
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */
import * as THREE from 'three';
/**
 * ComponentInstance represents an active component placed in the 3D scene.
 * All derived state (worldPorts, centerlines, meshes) is derived dynamically
 * from effectiveParameters and placement.
 */
export declare class ComponentInstance {
    readonly instanceId: string;
    readonly definition: ComponentDefinition;
    parentAssemblyInstanceId?: string;
    private _effectiveParameters;
    private _placement;
    private _cachedWorldPorts;
    private _cachedCenterlines;
    private _cachedBounds;
    private _cachedMesh;
    constructor(instanceId: string, definition: ComponentDefinition, parameterOverrides?: Record<string, any>, placement?: Partial<EngineeringPlacement>, parentAssemblyInstanceId?: string);
    get definitionId(): string;
    get effectiveParameters(): Readonly<Record<string, any>>;
    get placement(): Readonly<EngineeringPlacement>;
    /**
     * Updates one or more parameters. Automatically invalidates all derived state.
     */
    updateParameters(newOverrides: Record<string, any>): void;
    /**
     * Sets new spatial placement. Quaternion is the single canonical source of truth for rotation.
     */
    setPlacement(placement: EngineeringPlacement): void;
    /**
     * Sets position (in mm).
     */
    setPosition(pos: [number, number, number]): void;
    /**
     * Sets canonical quaternion rotation [x, y, z, w].
     */
    setQuaternion(quat: [number, number, number, number]): void;
    private invalidateCache;
    private invalidatePlacementCache;
    /**
     * Dynamically derives World Ports based on current placement and effectiveParameters.
     * Single Source of Truth: definition.getLocalPorts(this.effectiveParameters)
     */
    getWorldPorts(): WorldPortDefinition[];
    /**
     * Dynamically derives Centerlines with local and world coordinates.
     */
    getCenterlines(): CenterlineRouteDefinition[];
    /**
     * Dynamically derives Component Bounds and clearance envelopes.
     */
    getBounds(): ComponentBoundsDefinition;
    /**
     * Builds or returns the Three.js Object3D for this instance.
     * Local geometry mesh vertices are freshly generated from effectiveParameters,
     * mesh.scale remains strictly (1, 1, 1).
     *
     * With `options` (e.g. host materials) a fresh, uncached object is returned: the host owns
     * it and its geometry. Without options the cached object on the shared library materials is
     * returned.
     */
    getThreeMesh(options?: GeometryBuildOptions): THREE.Group;
    private buildMesh;
    private applyPlacementToMesh;
}
