import { BomScopeType } from '../core/Schema.ts';
import { ComponentInstance } from '../core/Instance.ts';
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
    filterBundledChildren?: boolean;
}
/**
 * Bill of Materials (BOM) Management Engine.
 * Enforces Zero Double-Counting rules for assemblies and kits.
 */
export declare class BomManager {
    /**
     * Generates engineering BOM from an array of component instances.
     */
    static generateBom(instances: ComponentInstance[], options?: BomGenerateOptions): BomReport;
}
