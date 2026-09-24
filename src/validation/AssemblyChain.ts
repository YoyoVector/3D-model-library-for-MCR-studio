/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { ComponentInstance } from '../core/Instance.ts';
import type { EngineeringPlacement } from '../core/Schema.ts';
import { ComponentRegistry } from '../registry/ComponentRegistry.ts';
import { resolveProfileParameters, type TraySystemProfile } from '../registry/TraySystemProfile.ts';
import { MateEngine } from '../ports/MateEngine.ts';
import { AssemblyValidator, type JointCheckResult } from './AssemblyValidator.ts';

/**
 * One component of an assembly. Every step after the first is mated by its own `port` onto
 * `attachPort` of an earlier step (`attachTo`, default: the previous step).
 */
export interface AssemblyStep {
  definitionId: string;
  overrides?: Record<string, any>;
  /** Own port mated onto the existing assembly (ignored for the first step). */
  port?: string;
  /** Index of the step to attach to (default: previous step). */
  attachTo?: number;
  /** Port on the attached step (default: 'PORT_B'). */
  attachPort?: string;
  instanceId?: string;
}

export interface AssemblyBuildResult {
  instances: ComponentInstance[];
  joints: JointCheckResult[];
  passed: boolean;
  issues: string[];
}

/**
 * Builds a mated assembly (chain or tree) with MateEngine and validates every joint physically
 * (AssemblyValidator: separation, termination, face match, centerline continuity).
 * When a profile is given, every step receives the profile's catalog parameters.
 */
export function buildMatedAssembly(
  steps: AssemblyStep[],
  options: { profile?: TraySystemProfile; basePlacement?: EngineeringPlacement } = {}
): AssemblyBuildResult {
  const instances: ComponentInstance[] = [];
  const joints: JointCheckResult[] = [];
  const issues: string[] = [];

  steps.forEach((step, i) => {
    const def = ComponentRegistry.get(step.definitionId);
    if (!def) throw new Error(`Unknown component '${step.definitionId}'`);
    const params = options.profile
      ? resolveProfileParameters(step.definitionId, options.profile, step.overrides ?? {})
      : { ...(step.overrides ?? {}) };
    const inst = new ComponentInstance(step.instanceId ?? `asm_${i}_${step.definitionId.toLowerCase()}`, def, params);

    if (i === 0) {
      if (options.basePlacement) inst.setPlacement(options.basePlacement);
      instances.push(inst);
      return;
    }

    const parentIndex = step.attachTo ?? i - 1;
    const parent = instances[parentIndex];
    const parentPort = step.attachPort ?? 'PORT_B';
    const ownPort = step.port ?? 'PORT_A';
    const mate = MateEngine.placeComponentByPort(parent, parentPort, inst, ownPort);
    if (!mate.success) issues.push(`Step ${i} (${step.definitionId}): ${mate.message}`);
    instances.push(inst);

    const joint = AssemblyValidator.checkJoint(parent, parentPort, inst, ownPort);
    joints.push(joint);
    joint.issues.forEach((msg) => issues.push(`Joint ${parent.instanceId}.${parentPort} ↔ ${inst.instanceId}.${ownPort}: ${msg}`));
  });

  return { instances, joints, passed: issues.length === 0, issues };
}

/** Built-in assembly demos (used by the viewer and by the regression suite). */
export const ASSEMBLY_DEMOS: Record<string, { name: string; nameZh: string; steps: AssemblyStep[] }> = {
  ELBOW_TEE_CHAIN: {
    name: 'Straight → Elbow 90° → Straight → Tee → Straight (main + branch)',
    nameZh: '直槽 → 90° 彎頭 → 直槽 → 三通 → 直槽 (主線與分支)',
    steps: [
      { definitionId: 'TRAY_STRAIGHT', overrides: { length: 2000 } },
      { definitionId: 'FITTING_ELBOW_90', port: 'PORT_A' },
      { definitionId: 'TRAY_STRAIGHT', overrides: { length: 2000 }, port: 'PORT_A' },
      { definitionId: 'FITTING_TEE', port: 'PORT_A' },
      { definitionId: 'TRAY_STRAIGHT', overrides: { length: 2000 }, port: 'PORT_A', attachTo: 3, attachPort: 'PORT_B' },
      { definitionId: 'TRAY_STRAIGHT', overrides: { length: 2000 }, port: 'PORT_A', attachTo: 3, attachPort: 'PORT_C' },
    ],
  },
  CROSS_CHAIN: {
    name: 'Straight → Cross → Straight on every outlet',
    nameZh: '直槽 → 四通 → 三向直槽',
    steps: [
      { definitionId: 'TRAY_STRAIGHT', overrides: { length: 2000 } },
      { definitionId: 'FITTING_CROSS', port: 'PORT_A' },
      { definitionId: 'TRAY_STRAIGHT', overrides: { length: 2000 }, port: 'PORT_A', attachTo: 1, attachPort: 'PORT_B' },
      { definitionId: 'TRAY_STRAIGHT', overrides: { length: 2000 }, port: 'PORT_A', attachTo: 1, attachPort: 'PORT_C' },
      { definitionId: 'TRAY_STRAIGHT', overrides: { length: 2000 }, port: 'PORT_A', attachTo: 1, attachPort: 'PORT_D' },
    ],
  },
  VERTICAL_OFFSET: {
    name: 'Straight → Vertical Inside 90° → Riser → Vertical Outside 90° → Straight',
    nameZh: '直槽 → 垂直上升 90° → 垂直直槽 → 垂直下降 90° → 直槽',
    steps: [
      { definitionId: 'TRAY_STRAIGHT', overrides: { length: 2000 } },
      { definitionId: 'FITTING_RISER_IN_90', port: 'PORT_A' },
      { definitionId: 'TRAY_STRAIGHT', overrides: { length: 1500 }, port: 'PORT_A' },
      { definitionId: 'FITTING_RISER_OUT_90', port: 'PORT_A' },
      { definitionId: 'TRAY_STRAIGHT', overrides: { length: 2000 }, port: 'PORT_A' },
    ],
  },
  REDUCER_CHAIN: {
    name: 'Straight 600 → Left Reducer 600→300 → Straight 300',
    nameZh: '直槽 600 → 左偏異徑 600→300 → 直槽 300',
    steps: [
      { definitionId: 'TRAY_STRAIGHT', overrides: { length: 2000, width: 600 } },
      { definitionId: 'FITTING_REDUCER_LEFT', overrides: { inletWidth: 600, outletWidth: 300 }, port: 'PORT_A' },
      { definitionId: 'TRAY_STRAIGHT', overrides: { length: 2000, width: 300 }, port: 'PORT_A' },
    ],
  },
};
