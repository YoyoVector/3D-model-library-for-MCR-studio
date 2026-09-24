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

      let spec = '';
      let unit = 'PCS';
      const qty = 1;

      // Tray / fitting specs are read from the same engineering dimensions that drive the geometry.
      const dims = def.getEngineeringDimensions?.(inst.effectiveParameters);
      const style = dims?.style === 'VENTILATED_THROUGH' ? 'Ventilated' : 'Ladder';

      if (dims && (def.id === 'TRAY_STRAIGHT' || def.id === 'TRAY_STRAIGHT_DIVIDER')) {
        spec = `${style} W=${dims.width}mm H=${dims.height}mm L=${Number(dims.length) / 1000}m`;
        unit = '支';
      } else if (dims && (def.id.startsWith('FITTING_ELBOW') || def.id.startsWith('FITTING_RISER'))) {
        spec = `${style} W=${dims.width}mm H=${dims.height}mm R=${dims.catalogRadius}mm ${dims.angleDeg}° T=${dims.tangentLength}mm`;
        unit = '組';
      } else if (dims && (def.id === 'FITTING_TEE' || def.id === 'FITTING_CROSS')) {
        const span = def.id === 'FITTING_TEE' ? `span ${dims.mainSpan}mm / branch ${dims.branchProjection}mm` : `span ${dims.span}mm`;
        spec = `${style} W=${dims.width}mm H=${dims.height}mm R=${dims.catalogRadius}mm T=${dims.tangentLength}mm (${span})`;
        unit = '組';
      } else if (dims && def.id.startsWith('FITTING_REDUCER')) {
        spec = `${style} W1=${dims.inletWidth}mm -> W2=${dims.outletWidth}mm H=${dims.height}mm L=${dims.length}mm`;
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
      // One BOM line per definition AND specification: different sizes of a fitting are separate lines.
      const key = `${def.id}|${spec}`;

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
