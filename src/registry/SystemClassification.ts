/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { VENDOR_PROFILES } from './TraySystemProfile.ts';

export type TraySystemCategory =
  | 'ALL'
  | 'SYSTEM_LADDER' // 鋁製梯型電纜線槽 (PDF p.1–26)
  | 'SYSTEM_VENTILATED_SMALL' // 鋁製密閉沖底型 100W x 50H (PDF p.27–37)
  | 'SYSTEM_VENTILATED_LARGE' // 鋁製密閉沖底型 300W x 100H (PDF p.38–47)
  | 'SYSTEM_STRUCTURAL' // 主管廊鋼構架
  | 'SYSTEM_EQUIPMENT' // 電氣設備與穿牆封堵
  | 'SYSTEM_OBSTACLE'; // 製程高溫與化學管道

export interface SystemCategoryMeta {
  id: TraySystemCategory;
  name: string;
  nameZh: string;
  badgeClass: string;
  catalogPages: string;
  description: string;
  profileId?: string;
}

export const TRAY_SYSTEM_METAS: Record<TraySystemCategory, SystemCategoryMeta> = {
  ALL: {
    id: 'ALL',
    name: 'All Components',
    nameZh: '全部配件與構件 (全庫展示)',
    badgeClass: 'bg-slate-800 text-slate-300 border-slate-700',
    catalogPages: 'All Pages',
    description: '顯示庫中所有可用之直槽、轉折配件、管架鋼構、設備與避讓障礙物。',
  },
  SYSTEM_LADDER: {
    id: 'SYSTEM_LADDER',
    name: 'Aluminum Ladder Tray System',
    nameZh: '鋁製梯型電纜線槽系統',
    badgeClass: 'bg-blue-950 text-blue-300 border-blue-700',
    catalogPages: 'PDF p.1 ~ p.26',
    description:
      'W 100~1000 mm、H 150 mm、R 300/600/900 mm；直槽、水平 90°/60°/45°/30° 彎頭、三通、四通、垂直上升/下降 90°/60°/45°/30°、中間/左偏/右偏異徑接頭。',
    profileId: 'LADDER_PROFILE_STANDARD',
  },
  SYSTEM_VENTILATED_SMALL: {
    id: 'SYSTEM_VENTILATED_SMALL',
    name: 'Ventilated-Through Tray A (100W x 50H)',
    nameZh: '鋁製密閉沖底型線槽 A (100W x 50H)',
    badgeClass: 'bg-emerald-950 text-emerald-300 border-emerald-700',
    catalogPages: 'PDF p.27 ~ p.37',
    description: '100W x 50H、R 300 mm；直槽、水平 90°/45° 彎頭、水平三通、垂直上升 90°、垂直下降 90° (型錄無四通與異徑)。',
    profileId: 'VENTILATED_PROFILE_A',
  },
  SYSTEM_VENTILATED_LARGE: {
    id: 'SYSTEM_VENTILATED_LARGE',
    name: 'Ventilated-Through Tray B (300W x 100H)',
    nameZh: '鋁製密閉沖底型線槽 B (300W x 100H)',
    badgeClass: 'bg-teal-950 text-teal-300 border-teal-700',
    catalogPages: 'PDF p.38 ~ p.47',
    description: '300W x 100H、R 300 mm；直槽、水平 90°/30° 彎頭、垂直上升 90°、垂直下降 90° (型錄無三通、四通與異徑)。',
    profileId: 'VENTILATED_PROFILE_B',
  },
  SYSTEM_STRUCTURAL: {
    id: 'SYSTEM_STRUCTURAL',
    name: 'Structural Pipe Rack Infrastructure',
    nameZh: '主管廊鋼構支撐架系統',
    badgeClass: 'bg-purple-950 text-purple-300 border-purple-700',
    catalogPages: 'Engineering Civil Spec',
    description: 'H 型鋼主立柱、橫樑與跨距門型管架組，提供電纜托架之標高固定基礎。',
  },
  SYSTEM_EQUIPMENT: {
    id: 'SYSTEM_EQUIPMENT',
    name: 'Electrical Equipment & Building MCT',
    nameZh: '現場端接箱與建築貫穿封堵',
    badgeClass: 'bg-amber-950 text-amber-300 border-amber-700',
    catalogPages: 'Instrumentation Spec',
    description: '本安/非本安防爆現場接線箱 (Junction Box) 與控制室耐火密封穿牆框 (MCT Penetration)。',
  },
  SYSTEM_OBSTACLE: {
    id: 'SYSTEM_OBSTACLE',
    name: 'Piping Obstacles for Routing Clearance',
    nameZh: '製程高溫與化學管道避讓物',
    badgeClass: 'bg-red-950 text-red-300 border-red-700',
    catalogPages: 'P&ID / Piping Spec',
    description: '高溫蒸汽管與高壓製程管，具備熱輻射防護淨空包絡圓筒體 (Clearance Envelope)。',
  },
};

/**
 * Functional sub-types for sorting inside a system.
 */
export type ComponentSubCategory =
  | 'STRAIGHT' // 直槽
  | 'ELBOW' // 水平轉彎
  | 'BRANCH' // 三通 / 四通
  | 'RISER' // 垂直上升 / 下降
  | 'REDUCER' // 異徑接頭
  | 'ACCESSORY' // 附件板
  | 'STRUCTURAL' // 鋼構
  | 'EQUIPMENT' // 設備
  | 'OBSTACLE'; // 障礙

export function getComponentSubCategory(compId: string): ComponentSubCategory {
  // Prefix matching: e.g. STRUCT_CROSS_BEAM is structural, CONDUIT_RISER is a conduit, not a tray fitting.
  if (compId.startsWith('TRAY_STRAIGHT')) return 'STRAIGHT';
  if (compId.startsWith('FITTING_ELBOW')) return 'ELBOW';
  if (compId === 'FITTING_TEE' || compId === 'FITTING_CROSS') return 'BRANCH';
  if (compId.startsWith('FITTING_RISER')) return 'RISER';
  if (compId.startsWith('FITTING_REDUCER')) return 'REDUCER';
  if (compId.startsWith('STRUCT')) return 'STRUCTURAL';
  if (compId.startsWith('EQUIP') || compId.startsWith('PENETRATION') || compId.startsWith('CONTEXT') || compId.startsWith('CONDUIT')) return 'EQUIPMENT';
  if (compId.startsWith('OBSTACLE')) return 'OBSTACLE';
  return 'ACCESSORY';
}

export const SUB_CATEGORY_NAMES: Record<ComponentSubCategory, string> = {
  STRAIGHT: '1. 直式線槽 (Straight Trays)',
  ELBOW: '2. 水平彎頭 (Horizontal Elbows)',
  BRANCH: '3. 三通與四通 (Tees & Crosses)',
  RISER: '4. 垂直上升 / 下降彎頭 (Vertical Bends)',
  REDUCER: '5. 異徑接頭 (Reducers)',
  ACCESSORY: '6. 端部與落線工程附件 (Accessories)',
  STRUCTURAL: '7. 鋼構管架與組合件 (Structural Framework)',
  EQUIPMENT: '8. 電氣設備與建築穿牆 (Equipment & MCT)',
  OBSTACLE: '9. 現場製程避讓管道 (Piping Obstacles)',
};

/**
 * Returns which tray system categories a component belongs to.
 * Tray series membership is derived from the vendor profiles' catalog component lists
 * (single source of truth), not maintained by hand.
 */
export function getComponentSystemCategories(compId: string): TraySystemCategory[] {
  if (compId.startsWith('STRUCT')) return ['SYSTEM_STRUCTURAL'];
  if (compId.startsWith('EQUIP') || compId.startsWith('PENETRATION') || compId.startsWith('CONTEXT')) return ['SYSTEM_EQUIPMENT'];
  if (compId.startsWith('OBSTACLE')) return ['SYSTEM_OBSTACLE'];

  const categories: TraySystemCategory[] = [];
  (Object.values(TRAY_SYSTEM_METAS) as SystemCategoryMeta[]).forEach((meta) => {
    const profile = meta.profileId ? VENDOR_PROFILES[meta.profileId] : undefined;
    if (profile && profile.components.some((c) => c.definitionId === compId)) {
      categories.push(meta.id);
    }
  });
  return categories;
}
