/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */
import * as THREE from 'three';
/**
 * Shared High-Fidelity Metallic & Engineering Materials.
 * Exactly preserves the visual baseline of the legacy prototypes.
 */
export declare class Materials {
    private static _flowTexture;
    static getCableFlowTexture(): THREE.CanvasTexture | null;
    static readonly Tray: THREE.MeshStandardMaterial;
    static readonly TrayIS: THREE.MeshStandardMaterial;
    static readonly Divider: THREE.MeshStandardMaterial;
    static readonly Support: THREE.MeshStandardMaterial;
    static readonly Bolt: THREE.MeshStandardMaterial;
    static createCableMaterial(colorHex?: number, emissiveHex?: number): THREE.MeshStandardMaterial;
    static createCableFlowMaterial(colorHex?: number, emissiveHex?: number): THREE.MeshStandardMaterial;
    static readonly ColumnSteel: THREE.MeshStandardMaterial;
    static readonly BranchColumnSteel: THREE.MeshStandardMaterial;
    static readonly ConcretePier: THREE.MeshStandardMaterial;
    static readonly ProcessPipe: THREE.MeshStandardMaterial;
    static readonly SteamPipe: THREE.MeshStandardMaterial;
    static readonly MctFrame: THREE.MeshStandardMaterial;
    static readonly CabinetBody: THREE.MeshStandardMaterial;
    static readonly JbIS: THREE.MeshStandardMaterial;
    static readonly JbNonIS: THREE.MeshStandardMaterial;
    static readonly JbFiber: THREE.MeshStandardMaterial;
    static readonly Conduit: THREE.MeshStandardMaterial;
    static readonly HazardMesh: THREE.MeshBasicMaterial;
    static readonly BuildingWall: THREE.MeshStandardMaterial;
    static readonly RaisedFloor: THREE.MeshStandardMaterial;
}
