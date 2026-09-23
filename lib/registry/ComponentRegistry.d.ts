import { ComponentDefinition } from '../core/Schema.ts';
/**
 * Single Canonical Component Registry for MCR-Studio.
 * Contains definitions for all 32 components across the 4 origin classifications.
 */
export declare class ComponentRegistry {
    private static _definitions;
    static getAll(): ComponentDefinition[];
    static get(id: string): ComponentDefinition | undefined;
    private static register;
    static initAll(): void;
}
