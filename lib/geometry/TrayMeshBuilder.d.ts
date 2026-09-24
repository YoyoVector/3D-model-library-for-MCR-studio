import { TrayLayout } from './TrayLayouts.ts';
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */
import * as THREE from 'three';
export interface TrayMeshOptions {
    /** Intrinsically-safe tray colouring (plant scene). */
    isIS?: boolean;
}
/**
 * Builds the Three.js group for a tray layout.
 * Children are tagged with `userData.part` ('RAILS' | 'FLOOR' | 'RUNGS' | 'DIVIDER' | 'ACCESSORY');
 * accessory meshes also carry `userData.isAccessory = true` and are not part of the tray body.
 */
export declare function buildTrayLayoutGroup(layout: TrayLayout, options?: TrayMeshOptions): THREE.Group;
