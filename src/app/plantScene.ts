/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import type * as THREE from 'three';
import { ComponentRegistry, ComponentInstance, TraySystemProfiles, resolveProfileParameters } from '../index.ts';

export interface PlantLayers {
  nis: boolean;
  is: boolean;
  bays: boolean;
  jbs: boolean;
  pipes: boolean;
  mct: boolean;
  cables: boolean;
}

export const DEFAULT_PLANT_LAYERS: PlantLayers = { nis: true, is: true, bays: true, jbs: true, pipes: true, mct: true, cables: true };

/** Main pipe rack demo scene (two tray tiers, bays, JBs, piping obstacles, MCT, cables). */
export function buildPlantScene(layers: PlantLayers): THREE.Object3D[] {
  const out: THREE.Object3D[] = [];
  const add = (inst: ComponentInstance) => out.push(inst.getThreeMesh());

  if (layers.bays) {
    const bay = ComponentRegistry.get('STRUCT_MAIN_BAY')!;
    [-18, -14, -8, -2, 4, 8].forEach((x) => add(new ComponentInstance(`bay_${x}`, bay, {}, { position: [x * 1000, 0, 0] })));
    const branch = ComponentRegistry.get('STRUCT_BRANCH_BAY')!;
    [-6.5, -9.5].forEach((z) => add(new ComponentInstance(`b_bay_${z}`, branch, {}, { position: [-14000, 0, z * 1000] })));
  }

  if (layers.pipes) {
    add(new ComponentInstance('p_proc', ComponentRegistry.get('OBSTACLE_MAIN_PROCESS_PIPE')!, {}, { position: [-5000, 3300, -1200] }));
    add(new ComponentInstance('p_steam', ComponentRegistry.get('OBSTACLE_MAIN_STEAM_PIPE')!, {}, { position: [-5000, 5050, 1200] }));
  }

  if (layers.jbs) {
    const jb = ComponentRegistry.get('EQUIP_JUNCTION_BOX')!;
    const jbs: Array<{ id: string; pos: [number, number, number]; type: string }> = [
      { id: 'JB101', pos: [-14000, 1400, -9500], type: 'IS' },
      { id: 'JB102', pos: [-14000, 1400, -6500], type: 'NON_IS' },
      { id: 'JB103', pos: [-8000, 1400, -3800], type: 'IS' },
      { id: 'JB201', pos: [-14000, 1400, 3800], type: 'NON_IS' },
      { id: 'JB202', pos: [-2000, 1400, 6500], type: 'IS' },
      { id: 'JB203', pos: [-2000, 1400, 9500], type: 'FIBER' },
    ];
    jbs.forEach((j) => add(new ComponentInstance(j.id, jb, { boxType: j.type }, { position: j.pos })));
  }

  if (layers.mct) {
    const mct = ComponentRegistry.get('PENETRATION_MCT')!;
    add(new ComponentInstance('mct_1', mct, {}, { position: [12000, 3200, -2500] }));
    add(new ComponentInstance('mct_2', mct, {}, { position: [12000, 3200, 2500] }));
    add(new ComponentInstance('bldg', ComponentRegistry.get('CONTEXT_BUILDING')!, {}, { position: [16000, 2750, 0] }));
  }

  // Tray tiers use the vendor ladder profile (600W × 150H), laid along X.
  const tray = ComponentRegistry.get('TRAY_STRAIGHT')!;
  const ladder = TraySystemProfiles.get('LADDER_PROFILE_STANDARD')!;
  const alongX: [number, number, number, number] = [0, Math.SQRT1_2, 0, Math.SQRT1_2];
  if (layers.is) {
    add(new ComponentInstance('tray_is', tray, resolveProfileParameters('TRAY_STRAIGHT', ladder, { length: 26000, isIS: true }), { position: [-5000, 6400, -1800], quaternion: alongX }));
  }
  if (layers.nis) {
    add(new ComponentInstance('tray_nis', tray, resolveProfileParameters('TRAY_STRAIGHT', ladder, { length: 26000 }), { position: [-5000, 7200, 600], quaternion: alongX }));
  }

  if (layers.cables) {
    const cable = ComponentRegistry.get('VISUAL_CABLE_GENERATOR')!;
    add(
      new ComponentInstance('cable_is', cable, {
        colorHex: 0x00d2ff,
        emissiveHex: 0x0088cc,
        pathPoints: [
          [-14000, 1400, -9500],
          [-14000, 6400, -9500],
          [-14000, 6400, -1800],
          [8000, 6400, -1800],
          [12000, 3200, -2500],
          [16000, 400, -2500],
        ],
      })
    );
    add(
      new ComponentInstance('cable_nis', cable, {
        colorHex: 0xffb703,
        emissiveHex: 0xcc8800,
        pathPoints: [
          [-14000, 1400, -6500],
          [-14000, 7200, -6500],
          [-14000, 7200, 600],
          [8000, 7200, 600],
          [12000, 3200, 2500],
          [16000, 400, 2500],
        ],
      })
    );
  }
  return out;
}
