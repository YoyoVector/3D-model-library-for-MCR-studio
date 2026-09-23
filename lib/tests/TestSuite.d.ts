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
 * Automated Acceptance Test Suite for MCR-Studio Parametric 3D Library (Cases A ~ V).
 */
export declare class AcceptanceTestSuite {
    static runAll(): TestSuiteReport;
    /**
     * Case A: 標準對接測試 (Straight 600x100 Port B -> Elbow 90° 600x100 Port A)
     */
    static testCaseA(): TestCaseResult;
    /**
     * Case B: 尺寸不符攔截 (Straight 600x100 Port B -> Elbow 450x100 Port A)
     */
    static testCaseB(): TestCaseResult;
    /**
     * Case C: 深度不符攔截 (Straight 600x100 Port B -> Elbow 600x150 Port A)
     */
    static testCaseC(): TestCaseResult;
    /**
     * Case D: 連接類型不符攔截 (Tray End -> Gland Port)
     */
    static testCaseD(): TestCaseResult;
    /**
     * Case E: 異徑對接成功 (Straight 600 -> Reducer Left Port A, Reducer Port B -> Straight 450)
     */
    static testCaseE(): TestCaseResult;
    /**
     * Case F: Mate 放置數值正確性 (Position & Quaternion of mated instance B)
     */
    static testCaseF(): TestCaseResult;
    /**
     * Case G: 鏈式放置累積誤差 (Chain 10 Straight 3m trays -> Port B at Z = 30,000mm)
     */
    static testCaseG(): TestCaseResult;
    /**
     * Case H: JSON 匯出與還原 (JsonExporter ComponentDefinition export round-trip)
     */
    static testCaseH(): TestCaseResult;
    /**
     * Case I: 迴轉環路封閉檢查 (4 x Elbow 90° forming a closed square loop)
     */
    static testCaseI(): TestCaseResult;
    /**
     * Case J: 避讓包絡體計算 (OBSTACLE_MAIN_PROCESS_PIPE clearance envelope)
     */
    static testCaseJ(): TestCaseResult;
    /**
     * Case K: 型錄規格邊界檢查 (Check width conformance for 550mm)
     */
    static testCaseK(): TestCaseResult;
    /**
     * Case L: 解析中心線長度公式精確度 (Straight & Elbow exact analytic formula)
     */
    static testCaseL(): TestCaseResult;
    /**
     * Case M: Assembly BOM 驗證 (Double-counting fixture verification)
     */
    static testCaseM(): TestCaseResult;
    /**
     * Case N: 視覺回歸確效 (Deterministic Visual Baseline Regression of 8 Legacy Models)
     */
    static testCaseN(): TestCaseResult;
    /**
     * Case O: 通用角度單一真實來源 (Generic Angle 37.5° SOT Verification)
     */
    static testCaseO(): TestCaseResult;
    /**
     * Case P: 參數連動一致性 (Elbow R: 300 -> 600mm, Angle 45 -> 90°, all derived states sync)
     */
    static testCaseP(): TestCaseResult;
    /**
     * Invariant Test Q: Centerline ↔ Port Endpoint Invariant
     * Verifies for all routing-capable components:
     * centerline.firstPoint == fromPort.localPosition
     * centerline.lastPoint  == toPort.localPosition
     */
    static testCaseQ_CenterlinePortEndpoints(): TestCaseResult;
    /**
     * Invariant Test R: Bounds ↔ Geometry Consistency Invariant
     */
    static testCaseR_BoundsConsistency(): TestCaseResult;
    /**
     * Invariant Test S: Port Frame Handedness (Right-handed orthonormal basis, det = +1.0)
     */
    static testCaseS_PortFrameHandedness(): TestCaseResult;
    /**
     * Invariant Test T: Eccentric Reducer Physical Analytic Length
     */
    static testCaseT_EccentricReducerLength(): TestCaseResult;
    /**
     * Invariant Test U: Tee Physical Branch Centerline (Straight + Arc + Straight)
     */
    static testCaseU_TeePhysicalCenterline(): TestCaseResult;
    /**
     * Invariant Test V: Derived State Export Snapshot
     */
    static testCaseV_DerivedStateExport(): TestCaseResult;
}
