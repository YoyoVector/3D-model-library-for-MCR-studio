import { ComponentDefinition } from '../core/Schema.ts';
/**
 * Single Canonical Component Registry for MCR-Studio.
 *
 * Cable trays and fittings are defined by family factories (TrayComponentFamilies.ts) that read
 * ONE engineering layout per component (geometry/TrayLayouts.ts). Structural, equipment,
 * obstacle and visual components are defined inline below.
 */
export declare class ComponentRegistry {
    private static _definitions;
    static getAll(): ComponentDefinition[];
    static get(id: string): ComponentDefinition | undefined;
    private static register;
    static initAll(): void;
}
