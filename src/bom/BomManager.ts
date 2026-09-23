/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { ComponentRegistry } from '../registry/ComponentRegistry.ts';
import { AssemblyRegistry } from '../registry/AssemblyRegistry.ts';
import { BomScope, type BomScopeType } from '../core/Schema.ts';
import type { ComponentInstance } from '../core/Instance.ts';

export interface BomLineItem {
  itemNumber: string;
  definitionId: string;
  name: string;
  nameZh: string;
  bomScope: BomScopeType;
  spec: string;
  quantity: number;
  unit: string;
  isAssemblyKit: boolean;
  notes: string;
}

export interface BomReport {
  generatedAt: string;
  scope: BomScopeType | 'ALL';
  totalItems: number;
  items: BomLineItem[];
  hasDoubleCounting: boolean;
  excludedBundledItems: string[];
}

export interface BomGenerateOptions {
  scope?: BomScopeType | 'ALL';
  includeVisualOnly?: boolean;
  filterBundledChildren?: boolean; // defaults to true
}

/**
 * Bill of Materials (BOM) Management Engine.
 * Enforces Zero Double-Counting rules for assemblies and kits.
 */
export class BomManager {
  /**
   * Generates engineering BOM from an array of component instances.
   */
  public static generateBom(
    instances: ComponentInstance[],
    options: BomGenerateOptions = {}
  ): BomReport {
    const scope = options.scope ?? 'ALL';
    const filterBundledChildren = options.filterBundledChildren !== false;
    const includeVisualOnly = options.includeVisualOnly === true;

    const itemMap = new Map<string, BomLineItem>();
    let counter = 1;

    // Track active assembly kits
    const activeAssemblyInstanceIds = new Set<string>();
    const bundledChildKeys = new Set<string>();
    const excludedBundledItems: string[] = [];

    // Pass 1: Identify all assemblies and mark bundled subcomponents
    instances.forEach((inst) => {
      if (AssemblyRegistry.isAssembly(inst.definitionId) || (inst.definition.subComponents && inst.definition.subComponents.length > 0)) {
        activeAssemblyInstanceIds.add(inst.instanceId);
        const subs = AssemblyRegistry.getSubComponents(inst.definitionId).length > 0
          ? AssemblyRegistry.getSubComponents(inst.definitionId)
          : (inst.definition.subComponents || []);

        subs.forEach((sub) => {
          if (!sub.isPurchasedSeparately) {
            // Register composite key for child instance tagged to this parent
            bundledChildKeys.add(`${inst.instanceId}_${sub.definitionId}`);
            bundledChildKeys.add(`${inst.instanceId}_${sub.definitionId}_${sub.instanceSuffix}`);
          }
        });
      }
    });

    let doubleCountingOccurred = false;

    // Pass 2: Process instances and filter out bundled children
    instances.forEach((inst) => {
      const def = inst.definition;

      // Filter by visual / BOM metadata
      if (!includeVisualOnly && (def.bomScope === BomScope.VISUAL_ONLY || def.hasBomMetadata === false)) {
        return;
      }

      // Filter by scope
      if (scope !== 'ALL' && def.bomScope !== scope) {
        return;
      }

      // Check if this instance is a bundled child of an active assembly in this scene
      const isBundledChild =
        (inst.parentAssemblyInstanceId && activeAssemblyInstanceIds.has(inst.parentAssemblyInstanceId)) ||
        (inst.parentAssemblyInstanceId && bundledChildKeys.has(`${inst.parentAssemblyInstanceId}_${def.id}`)) ||
        Array.from(activeAssemblyInstanceIds).some(
          (parentInstId) => inst.instanceId.startsWith(parentInstId) && inst.instanceId !== parentInstId
        );

      if (isBundledChild) {
        if (filterBundledChildren) {
          // Actively exclude bundled child instance from loose billing
          excludedBundledItems.push(inst.instanceId);
          return;
        } else {
          // Double counting not prevented
          doubleCountingOccurred = true;
        }
      }

      const key = def.id;
      let spec = '';
      let unit = 'PCS';
      const qty = 1;

      if (def.id === 'TRAY_STRAIGHT' || def.id === 'TRAY_STRAIGHT_DIVIDER') {
        const lenM = (inst.effectiveParameters.length || 3000) / 1000;
        spec = `W=${inst.effectiveParameters.width || 600}mm / H=${inst.effectiveParameters.depth || 100}mm / L=${lenM}m (HDG 85μm)`;
        unit = '支';
      } else if (def.id.startsWith('FITTING_ELBOW')) {
        spec = `R=${inst.effectiveParameters.radius || 600}mm W=${inst.effectiveParameters.width || 600}mm Angle=${inst.effectiveParameters.angleDeg ?? 90}°`;
        unit = '組';
      } else if (def.id === 'FITTING_TEE') {
        spec = `W=${inst.effectiveParameters.width || 600}mm L=${inst.effectiveParameters.length || 1400}mm Branch=${inst.effectiveParameters.branchLength || 700}mm`;
        unit = '組';
      } else if (def.id.startsWith('FITTING_REDUCER')) {
        spec = `W1=${inst.effectiveParameters.inletWidth || 600}mm -> W2=${inst.effectiveParameters.outletWidth || 450}mm L=${inst.effectiveParameters.length || 500}mm`;
        unit = '組';
      } else if (def.id === 'PENETRATION_MCT') {
        spec = `RG M6x1 A-60 防火氣密等級 (${inst.effectiveParameters.widthMm || 600}x${inst.effectiveParameters.heightMm || 900}mm)`;
        unit = '套';
      } else if (def.id === 'STRUCT_MAIN_BAY') {
        spec = `主管廊四階門型構架套件 (含 2 柱、2 墩、4 橫樑，Span=7.8m, EL +8.0m)`;
        unit = '套 (Kit)';
      } else if (def.id === 'STRUCT_BRANCH_BAY') {
        spec = `支管廊門型構架套件 (含 2 柱、4 橫樑、2 縱樑，Span=2.7m)`;
        unit = '套 (Kit)';
      } else {
        spec = `標準工程預製規格`;
      }

      const isKit = AssemblyRegistry.isAssembly(def.id) || (def.subComponents && def.subComponents.length > 0) || false;

      if (itemMap.has(key)) {
        itemMap.get(key)!.quantity += qty;
      } else {
        itemMap.set(key, {
          itemNumber: String(counter++).padStart(2, '0'),
          definitionId: def.id,
          name: def.name,
          nameZh: def.nameZh,
          bomScope: def.bomScope ?? BomScope.MCR_CABLE_TRAY_BOM,
          spec,
          quantity: qty,
          unit,
          isAssemblyKit: isKit,
          notes: isKit ? 'Assembly Kit: Internal subcomponents bundled (No double count)' : 'Direct Component',
        });
      }
    });

    const items = Array.from(itemMap.values());

    return {
      generatedAt: new Date().toISOString(),
      scope,
      totalItems: items.reduce((acc, it) => acc + it.quantity, 0),
      items,
      hasDoubleCounting: doubleCountingOccurred,
      excludedBundledItems,
    };
  }
}
