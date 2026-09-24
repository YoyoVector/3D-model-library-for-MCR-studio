/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */
export type TraySystemCategory = 'ALL' | 'SYSTEM_LADDER' | 'SYSTEM_VENTILATED_SMALL' | 'SYSTEM_VENTILATED_LARGE' | 'SYSTEM_STRUCTURAL' | 'SYSTEM_EQUIPMENT' | 'SYSTEM_OBSTACLE';
export interface SystemCategoryMeta {
    id: TraySystemCategory;
    name: string;
    nameZh: string;
    badgeClass: string;
    catalogPages: string;
    description: string;
    profileId?: string;
}
export declare const TRAY_SYSTEM_METAS: Record<TraySystemCategory, SystemCategoryMeta>;
/**
 * Functional sub-types for sorting inside a system.
 */
export type ComponentSubCategory = 'STRAIGHT' | 'ELBOW' | 'BRANCH' | 'RISER' | 'REDUCER' | 'ACCESSORY' | 'STRUCTURAL' | 'EQUIPMENT' | 'OBSTACLE';
export declare function getComponentSubCategory(compId: string): ComponentSubCategory;
export declare const SUB_CATEGORY_NAMES: Record<ComponentSubCategory, string>;
/**
 * Returns which tray system categories a component belongs to.
 * Tray series membership is derived from the vendor profiles' catalog component lists
 * (single source of truth), not maintained by hand.
 */
export declare function getComponentSystemCategories(compId: string): TraySystemCategory[];
