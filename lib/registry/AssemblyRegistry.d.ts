import { SubComponentReference } from '../core/Schema.ts';
/**
 * Assembly Hierarchy and Subcomponent Registry.
 */
export declare class AssemblyRegistry {
    /**
     * Retrieves subcomponents for a given assembly definition ID.
     */
    static getSubComponents(assemblyDefId: string): SubComponentReference[];
    /**
     * Checks if a definition is a composite assembly.
     */
    static isAssembly(defId: string): boolean;
}
