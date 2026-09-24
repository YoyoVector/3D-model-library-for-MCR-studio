import { TrayLayout } from './TrayLayouts.ts';
import { GeometryBuildOptions } from '../core/Schema.ts';
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */
import * as THREE from 'three';
export interface TrayMeshOptions extends GeometryBuildOptions {
    /** Intrinsically-safe tray colouring (plant scene). */
    isIS?: boolean;
}
/**
 * Builds the Three.js group for a tray layout.
 * Children are tagged with `userData.part` ('RAILS' | 'FLOOR' | 'RUNGS' | 'DIVIDER' | 'ACCESSORY');
 * accessory meshes also carry `userData.isAccessory = true` and are not part of the tray body.
 * Meshes on a shared library material carry `userData.sharedMaterial = true`; meshes on a
 * host material (`options.materials`) belong to the host.
 */
export declare function buildTrayLayoutGroup(layout: TrayLayout, options?: TrayMeshOptions): THREE.Group;
