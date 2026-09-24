/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type TraySystemCategory =
  | 'ALL'
  | 'SYSTEM_LADDER' // 鋁製梯型托架系統 (Page 3–26)
  | 'SYSTEM_VENTILATED_SMALL' // 通風沖底型 - 小型 100W x 50H (Page 27–37)
  | 'SYSTEM_VENTILATED_LARGE' // 通風沖底型 - 大型 300W x 100H (Page 38–47)
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
    name: 'Heavy Duty Ladder Tray System',
    nameZh: '鋁製梯型電纜線槽系統',
    badgeClass: 'bg-blue-950 text-blue-300 border-blue-700',
    catalogPages: 'P.3 ~ P.26',
    description: 'CNS 13303 / NEMA VE 1 工業重型梯型托架，標稱寬度 150~1000mm，邊高 100/150mm，支援 90°/60°/45°/30° 轉彎、三通、四通、爬坡與大小頭。',
    profileId: 'LADDER_PROFILE_STANDARD',
  },
  SYSTEM_VENTILATED_SMALL: {
    id: 'SYSTEM_VENTILATED_SMALL',
    name: 'Ventilated Through Tray (Small 100W x 50H)',
    nameZh: '通風沖底型線槽 - 小型 (100W x 50H)',
    badgeClass: 'bg-emerald-950 text-emerald-300 border-emerald-700',
    catalogPages: 'P.27 ~ P.37',
    description: '鋁製密閉沖孔通風型托架（小型），標稱尺寸 100W x 50H mm，曲率半徑 R=300mm，標準轉折為 90° 與 45° 彎頭、三通與異徑。',
    profileId: 'VENTILATED_PROFILE_A',
  },
  SYSTEM_VENTILATED_LARGE: {
    id: 'SYSTEM_VENTILATED_LARGE',
    name: 'Ventilated Through Tray (Large 300W x 100H)',
    nameZh: '通風沖底型線槽 - 大型 (300W x 100H)',
    badgeClass: 'bg-teal-950 text-teal-300 border-teal-700',
    catalogPages: 'P.38 ~ P.47',
    description: '鋁製密閉沖孔通風型托架（大型），標稱尺寸 300W x 100H mm，曲率半徑 R=300mm，完整支援 90°/60°/45°/30° 彎頭、三通、垂直爬坡與異徑。',
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
  | 'RISER' // 垂直爬坡 / 下坡
  | 'REDUCER' // 大小頭過渡
  | 'ACCESSORY' // 附件板
  | 'STRUCTURAL' // 鋼構
  | 'EQUIPMENT' // 設備
  | 'OBSTACLE'; // 障礙

export function getComponentSubCategory(compId: string): ComponentSubCategory {
  if (compId.startsWith('TRAY_STRAIGHT')) return 'STRAIGHT';
  if (compId.includes('ELBOW')) return 'ELBOW';
  if (compId.includes('TEE') || compId.includes('CROSS')) return 'BRANCH';
  if (compId.includes('RISER')) return 'RISER';
  if (compId.includes('REDUCER')) return 'REDUCER';
  if (compId.startsWith('ACCESSORY')) return 'ACCESSORY';
  if (compId.startsWith('STRUCT')) return 'STRUCTURAL';
  if (compId.startsWith('EQUIP') || compId.startsWith('PENETRATION') || compId.startsWith('CONTEXT')) return 'EQUIPMENT';
  if (compId.startsWith('OBSTACLE')) return 'OBSTACLE';
  return 'ACCESSORY';
}

export const SUB_CATEGORY_NAMES: Record<ComponentSubCategory, string> = {
  STRAIGHT: '1. 主直通托架 (Straight Trays)',
  ELBOW: '2. 水平轉向彎頭 (Horizontal Elbows)',
  BRANCH: '3. 分支三通與十字四通 (Tees & Crosses)',
  RISER: '4. 垂直立體高程爬坡彎頭 (Vertical Risers)',
  REDUCER: '5. 變徑大小頭過渡 (Reducers)',
  ACCESSORY: '6. 端部與落線工程附件 (Accessories)',
  STRUCTURAL: '7. 鋼構管架與組合件 (Structural Framework)',
  EQUIPMENT: '8. 電氣設備與建築穿牆 (Equipment & MCT)',
  OBSTACLE: '9. 現場製程避讓管道 (Piping Obstacles)',
};

/**
 * Returns which tray system categories a component is compatible with.
 */
export function getComponentSystemCategories(compId: string): TraySystemCategory[] {
  if (compId.startsWith('STRUCT')) return ['SYSTEM_STRUCTURAL'];
  if (compId.startsWith('EQUIP') || compId.startsWith('PENETRATION') || compId.startsWith('CONTEXT')) return ['SYSTEM_EQUIPMENT'];
  if (compId.startsWith('OBSTACLE')) return ['SYSTEM_OBSTACLE'];

  // Tray fittings:
  const categories: TraySystemCategory[] = ['SYSTEM_LADDER'];

  // Small ventilated supports 90 & 45 elbows, tee, risers, center reducer
  if (
    compId === 'TRAY_STRAIGHT' ||
    compId === 'FITTING_ELBOW_90' ||
    compId === 'FITTING_ELBOW_45' ||
    compId === 'FITTING_TEE' ||
    compId === 'FITTING_RISER_IN_90' ||
    compId === 'FITTING_RISER_OUT_90' ||
    compId === 'FITTING_REDUCER_CENTER'
  ) {
    categories.push('SYSTEM_VENTILATED_SMALL');
  }

  // Large ventilated supports 90, 60, 45, 30 elbows, tee, cross, risers, reducers
  if (
    compId === 'TRAY_STRAIGHT' ||
    compId === 'FITTING_ELBOW_90' ||
    compId === 'FITTING_ELBOW_60' ||
    compId === 'FITTING_ELBOW_45' ||
    compId === 'FITTING_ELBOW_30' ||
    compId === 'FITTING_TEE' ||
    compId === 'FITTING_CROSS' ||
    compId === 'FITTING_RISER_IN_90' ||
    compId === 'FITTING_RISER_OUT_90' ||
    compId === 'FITTING_REDUCER_CENTER' ||
    compId === 'FITTING_REDUCER_LEFT' ||
    compId === 'FITTING_REDUCER_RIGHT'
  ) {
    categories.push('SYSTEM_VENTILATED_LARGE');
  }

  return categories;
}
