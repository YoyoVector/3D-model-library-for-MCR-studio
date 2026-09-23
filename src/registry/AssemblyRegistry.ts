/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { ComponentRegistry } from './ComponentRegistry.ts';
import type { SubComponentReference, ComponentDefinition } from '../core/Schema.ts';

/**
 * Assembly Hierarchy and Subcomponent Registry.
 */
export class AssemblyRegistry {
  /**
   * Retrieves subcomponents for a given assembly definition ID.
   */
  public static getSubComponents(assemblyDefId: string): SubComponentReference[] {
    const def = ComponentRegistry.get(assemblyDefId);
    return def?.subComponents || [];
  }

  /**
   * Checks if a definition is a composite assembly.
   */
  public static isAssembly(defId: string): boolean {
    const def = ComponentRegistry.get(defId);
    return def?.origin === 'DERIVED_ASSEMBLY' && !!def?.subComponents && def.subComponents.length > 0;
  }
}
