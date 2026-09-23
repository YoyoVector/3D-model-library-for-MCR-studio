/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import * as THREE from 'three';
import { Units } from './Units.ts';
import { Transforms } from './Transforms.ts';
import type {
  ComponentDefinition,
  EngineeringPlacement,
  WorldPortDefinition,
  CenterlineRouteDefinition,
  ComponentBoundsDefinition,
} from './Schema.ts';

/**
 * ComponentInstance represents an active component placed in the 3D scene.
 * All derived state (worldPorts, centerlines, meshes) is derived dynamically
 * from effectiveParameters and placement.
 */
export class ComponentInstance {
  public readonly instanceId: string;
  public readonly definition: ComponentDefinition;
  public parentAssemblyInstanceId?: string;
  private _effectiveParameters: Record<string, any>;
  private _placement: EngineeringPlacement;

  // Cache invalidation state
  private _cachedWorldPorts: WorldPortDefinition[] | null = null;
  private _cachedCenterlines: CenterlineRouteDefinition[] | null = null;
  private _cachedBounds: ComponentBoundsDefinition[] | null = null;
  private _cachedMesh: THREE.Group | null = null;

  constructor(
    instanceId: string,
    definition: ComponentDefinition,
    parameterOverrides: Record<string, any> = {},
    placement?: Partial<EngineeringPlacement>,
    parentAssemblyInstanceId?: string
  ) {
    this.instanceId = instanceId;
    this.definition = definition;
    this.parentAssemblyInstanceId = parentAssemblyInstanceId;
    this._effectiveParameters = {
      ...definition.defaultParameters,
      ...parameterOverrides,
    };
    this._placement = {
      position: placement?.position ? [...placement.position] : [0, 0, 0],
      quaternion: placement?.quaternion ? [...placement.quaternion] : [0, 0, 0, 1],
    };
  }

  public get definitionId(): string {
    return this.definition.id;
  }

  public get effectiveParameters(): Readonly<Record<string, any>> {
    return this._effectiveParameters;
  }

  public get placement(): Readonly<EngineeringPlacement> {
    return this._placement;
  }

  /**
   * Updates one or more parameters. Automatically invalidates all derived state.
   */
  public updateParameters(newOverrides: Record<string, any>): void {
    this._effectiveParameters = {
      ...this._effectiveParameters,
      ...newOverrides,
    };
    this.invalidateCache();
  }

  /**
   * Sets new spatial placement. Quaternion is the single canonical source of truth for rotation.
   */
  public setPlacement(placement: EngineeringPlacement): void {
    this._placement = {
      position: [...placement.position],
      quaternion: [...placement.quaternion],
    };
    this._cachedWorldPorts = null;
    this._cachedCenterlines = null;
    this._cachedBounds = null;
    if (this._cachedMesh) {
      this.applyPlacementToMesh(this._cachedMesh);
    }
  }

  /**
   * Sets position (in mm).
   */
  public setPosition(pos: [number, number, number]): void {
    this._placement.position = [...pos];
    this.invalidatePlacementCache();
  }

  /**
   * Sets canonical quaternion rotation [x, y, z, w].
   */
  public setQuaternion(quat: [number, number, number, number]): void {
    this._placement.quaternion = [...quat];
    this.invalidatePlacementCache();
  }

  private invalidateCache(): void {
    this._cachedWorldPorts = null;
    this._cachedCenterlines = null;
    this._cachedBounds = null;
    this._cachedMesh = null;
  }

  private invalidatePlacementCache(): void {
    this._cachedWorldPorts = null;
    this._cachedCenterlines = null;
    this._cachedBounds = null;
    if (this._cachedMesh) {
      this.applyPlacementToMesh(this._cachedMesh);
    }
  }

  /**
   * Dynamically derives World Ports based on current placement and effectiveParameters.
   * Single Source of Truth: definition.getLocalPorts(this.effectiveParameters)
   */
  public getWorldPorts(): WorldPortDefinition[] {
    if (this._cachedWorldPorts) {
      return this._cachedWorldPorts;
    }

    const localPorts = this.definition.getLocalPorts(this._effectiveParameters);
    this._cachedWorldPorts = localPorts.map((lp) => {
      const worldPos = Transforms.transformPoint(lp.localPosition, this._placement);
      const worldDir = Transforms.transformDirection(lp.localDirection, this._placement);
      const worldUp = Transforms.transformDirection(lp.localUp, this._placement);

      return {
        id: lp.id,
        instanceId: this.instanceId,
        name: lp.name,
        worldPosition: worldPos,
        worldDirection: worldDir,
        worldUp: worldUp,
        width: lp.width,
        depth: lp.depth,
        connectionType: lp.connectionType,
      };
    });

    return this._cachedWorldPorts;
  }

  /**
   * Dynamically derives Centerlines with local and world coordinates.
   */
  public getCenterlines(): CenterlineRouteDefinition[] {
    if (this._cachedCenterlines) {
      return this._cachedCenterlines;
    }
    this._cachedCenterlines = this.definition.getCenterlineRoutes(this._effectiveParameters);
    return this._cachedCenterlines;
  }

  /**
   * Dynamically derives Component Bounds and clearance envelopes.
   */
  public getBounds(): ComponentBoundsDefinition {
    return this.definition.getBounds(this._effectiveParameters);
  }

  /**
   * Builds or returns the Three.js Object3D for this instance.
   * Local geometry mesh vertices are freshly generated from effectiveParameters,
   * mesh.scale remains strictly (1, 1, 1).
   */
  public getThreeMesh(): THREE.Group {
    if (this._cachedMesh) {
      return this._cachedMesh;
    }

    // Build pristine geometry group at engineering origin (0, 0, 0)
    const localGroup = this.definition.buildGeometry(this._effectiveParameters);
    localGroup.name = `Instance_${this.instanceId}_${this.definition.id}`;

    // Tag each mesh with instanceId for raycasting/inspector
    localGroup.traverse((child) => {
      if ((child as THREE.Mesh).isMesh) {
        child.userData = {
          ...child.userData,
          instanceId: this.instanceId,
          definitionId: this.definition.id,
        };
      }
    });

    // Create placement container
    const instanceContainer = new THREE.Group();
    instanceContainer.name = `Container_${this.instanceId}`;
    instanceContainer.add(localGroup);

    // Apply placement
    this.applyPlacementToMesh(instanceContainer);

    // Ensure scale is exactly (1, 1, 1)
    instanceContainer.scale.set(1, 1, 1);
    localGroup.scale.set(1, 1, 1);

    this._cachedMesh = instanceContainer;
    return this._cachedMesh;
  }

  private applyPlacementToMesh(group: THREE.Group): void {
    // Placement position is in mm, Three.js coordinates are in meters
    const posM = [
      Units.mmToM(this._placement.position[0]),
      Units.mmToM(this._placement.position[1]),
      Units.mmToM(this._placement.position[2]),
    ];
    group.position.set(posM[0], posM[1], posM[2]);
    group.quaternion.set(
      this._placement.quaternion[0],
      this._placement.quaternion[1],
      this._placement.quaternion[2],
      this._placement.quaternion[3]
    );
  }
}
