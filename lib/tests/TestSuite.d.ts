/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */
export interface TestCaseResult {
    id: string;
    name: string;
    passed: boolean;
    actual: string;
    expected: string;
    details?: any;
}
export interface TestSuiteReport {
    timestamp: string;
    totalPassed: number;
    totalFailed: number;
    totalCases: number;
    allPassed: boolean;
    cases: TestCaseResult[];
}
/**
 * Automated Acceptance Test Suite for MCR-Studio Parametric 3D Library.
 * Cases A–V: engine invariants. Cases W–AK: vendor catalog geometry and physical assembly.
 */
export declare class AcceptanceTestSuite {
    static runAll(): TestSuiteReport;
    /**
     * Case A: 標準對接測試 (Ladder straight 600×150 PORT_B → Elbow 90° PORT_A from the same profile)
     */
    static testCaseA(): TestCaseResult;
    /**
     * Case B: 尺寸不符攔截 (Straight 600 → Elbow 450)
     */
    static testCaseB(): TestCaseResult;
    /**
     * Case C: 深度不符攔截 (Straight 600×100 → Elbow 600×150)
     */
    static testCaseC(): TestCaseResult;
    /**
     * Case D: 連接類型 / 托架型式不符攔截 (Tray End → Gland; Ladder → Ventilated)
     */
    static testCaseD(): TestCaseResult;
    /**
     * Case E: 異徑對接成功 (Ladder 600 → Reducer 600→300 → Ladder 300)
     */
    static testCaseE(): TestCaseResult;
    /**
     * Case F: Mate 放置數值正確性
     */
    static testCaseF(): TestCaseResult;
    /**
     * Case G: 鏈式放置累積誤差 (10 × 3 m straights → 30 m)
     */
    static testCaseG(): TestCaseResult;
    /**
     * Case H: JSON 匯出
     */
    static testCaseH(): TestCaseResult;
    /**
     * Case I: 4 × 90° elbows (catalog 125 mm tangents) close a loop.
     */
    static testCaseI(): TestCaseResult;
    /**
     * Case J: 避讓包絡體計算
     */
    static testCaseJ(): TestCaseResult;
    /**
     * Case K: 通用型錄規格邊界檢查 (generic NEMA-style presets)
     */
    static testCaseK(): TestCaseResult;
    /**
     * Case L: 解析中心線長度 (generic pure arc and catalog arc + tangents)
     */
    static testCaseL(): TestCaseResult;
    /**
     * Case M: Assembly BOM 驗證 (Double-counting fixture) + one BOM line per size
     */
    static testCaseM(): TestCaseResult;
    /**
     * Case N: 視覺回歸確效 (deterministic baseline of 8 legacy-ID models)
     */
    static testCaseN(): TestCaseResult;
    /**
     * Case O: 通用角度單一真實來源 (Generic angle 37.5°)
     */
    static testCaseO(): TestCaseResult;
    /**
     * Case P: 參數連動一致性 (R 300 → 600, angle 45 → 90)
     */
    static testCaseP(): TestCaseResult;
    /**
     * Case Q: Centerline ↔ Port endpoint invariant (all components, all variants)
     */
    static testCaseQ_CenterlinePortEndpoints(): TestCaseResult;
    /**
     * Case R: Bounds ↔ Geometry consistency (every tray component × variant + structural set)
     */
    static testCaseR_BoundsConsistency(): TestCaseResult;
    /**
     * Case S: Port frame handedness (right-handed orthonormal basis, det = +1)
     */
    static testCaseS_PortFrameHandedness(): TestCaseResult;
    /**
     * Case T: Reducer physical centerline length (generic linear taper and catalog 200+200+200)
     */
    static testCaseT_EccentricReducerLength(): TestCaseResult;
    /**
     * Case U: Tee branch centerline (catalog p.9): straight + concentric R+W/2 arc + straight.
     */
    static testCaseU_TeePhysicalCenterline(): TestCaseResult;
    /**
     * Case V: Derived state export snapshot
     */
    static testCaseV_DerivedStateExport(): TestCaseResult;
    /**
     * Case W: Ventilated profile A (PDF p.27–37) — every catalog component, joints physically valid.
     */
    static testCaseW_CatalogProfileA(): TestCaseResult;
    /**
     * Case X: Ventilated profile B (PDF p.38–47)
     */
    static testCaseX_CatalogProfileB(): TestCaseResult;
    /**
     * Case Y: Horizontal cross (PDF p.10): ports, 6 routes, catalog spans, radius-driven curved corners.
     */
    static testCaseY_HorizontalCross(): TestCaseResult;
    /**
     * Case Z: every catalog angle (30/45/60/90) for horizontal and vertical bends with 125 tangents
     */
    static testCaseZ_CatalogAngles(): TestCaseResult;
    /**
     * Case AA: Vendor dimension formulas checked on LIBRARY OUTPUT (not constants).
     */
    static testCaseAA_VendorDimensionFormulas(): TestCaseResult;
    /**
     * Case AB: Profile data vs the catalog tables (hand-entered catalog facts).
     */
    static testCaseAB_ProfileCatalogIntegrity(): TestCaseResult;
    /**
     * Case AC: Golden fixtures from the vendor PDF (ports, route lengths, bounds, dimensions).
     */
    static testCaseAC_GoldenFixtures(): TestCaseResult;
    /**
     * Case AD: Tee (PDF p.9) must have visibly curved transitions — checked on the mesh.
     */
    static testCaseAD_TeeCurvedTransition(): TestCaseResult;
    /**
     * Case AE: Cross (PDF p.10) curved corners in all four quadrants, both tray styles.
     */
    static testCaseAE_CrossCurvedCorners(): TestCaseResult;
    /**
     * Case AF: Profile propagation — H=150 (and W, R, T, style) reach every ladder component.
     */
    static testCaseAF_ProfilePropagation(): TestCaseResult;
    /**
     * Case AG: Radius semantics — catalog R → centerline radius → outer radius, measured on geometry.
     */
    static testCaseAG_RadiusSemantics(): TestCaseResult;
    /**
     * Case AH: Geometry terminates exactly on every TRAY_END port plane with the declared face.
     */
    static testCaseAH_ConnectionFaceTermination(): TestCaseResult;
    /**
     * Case AI: Physical assembly regression — the 12 mating scenarios.
     */
    static testCaseAI_AssemblyRegression(): TestCaseResult;
    /**
     * Case AJ: Negative controls — the assembly checks must catch overlap, gap, rotation and size errors.
     */
    static testCaseAJ_NegativeControls(): TestCaseResult;
    /**
     * Case AK: Assembly demos (viewer) — joints valid and end positions equal the hand-derived layout.
     */
    static testCaseAK_AssemblyDemos(): TestCaseResult;
}
