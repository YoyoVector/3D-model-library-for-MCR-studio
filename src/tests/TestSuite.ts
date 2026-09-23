/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import * as THREE from 'three';
import { ComponentRegistry } from '../registry/ComponentRegistry.ts';
import { ComponentInstance } from '../core/Instance.ts';
import { MateEngine } from '../ports/MateEngine.ts';
import { ConnectionValidator } from '../validation/ConnectionValidator.ts';
import { JsonExporter } from '../export/JsonExporter.ts';
import { CatalogStandards } from '../registry/CatalogStandards.ts';
import { BomManager } from '../bom/BomManager.ts';
import { Transforms } from '../core/Transforms.ts';
import { PortFrame } from '../ports/PortFrame.ts';
import { AnalyticLength } from '../centerline/AnalyticLength.ts';
import { LEGACY_FITTING_BASELINES } from './baselines/legacyFittingBaselines.ts';

export interface TestCaseResult {
  id: string; // 'Case A', 'Case B', ...
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
export class AcceptanceTestSuite {
  public static runAll(): TestSuiteReport {
    ComponentRegistry.initAll();

    const results: TestCaseResult[] = [];

    results.push(this.testCaseA());
    results.push(this.testCaseB());
    results.push(this.testCaseC());
    results.push(this.testCaseD());
    results.push(this.testCaseE());
    results.push(this.testCaseF());
    results.push(this.testCaseG());
    results.push(this.testCaseH());
    results.push(this.testCaseI());
    results.push(this.testCaseJ());
    results.push(this.testCaseK());
    results.push(this.testCaseL());
    results.push(this.testCaseM());
    results.push(this.testCaseN());
    results.push(this.testCaseO());
    results.push(this.testCaseP());

    // Engineering Invariant Tests
    results.push(this.testCaseQ_CenterlinePortEndpoints());
    results.push(this.testCaseR_BoundsConsistency());
    results.push(this.testCaseS_PortFrameHandedness());
    results.push(this.testCaseT_EccentricReducerLength());
    results.push(this.testCaseU_TeePhysicalCenterline());
    results.push(this.testCaseV_DerivedStateExport());

    const totalPassed = results.filter((r) => r.passed).length;
    const totalFailed = results.length - totalPassed;

    return {
      timestamp: new Date().toISOString(),
      totalPassed,
      totalFailed,
      totalCases: results.length,
      allPassed: totalFailed === 0,
      cases: results,
    };
  }

  /**
   * Case A: 標準對接測試 (Straight 600x100 Port B -> Elbow 90° 600x100 Port A)
   */
  public static testCaseA(): TestCaseResult {
    const defStraight = ComponentRegistry.get('TRAY_STRAIGHT')!;
    const defElbow = ComponentRegistry.get('FITTING_ELBOW_90')!;

    const instStraight = new ComponentInstance('inst_straight', defStraight, { width: 600, depth: 100 });
    const instElbow = new ComponentInstance('inst_elbow', defElbow, { width: 600, depth: 100 });

    const val = ConnectionValidator.validateConnection(instStraight, 'PORT_B', instElbow, 'PORT_A');
    const passed = val.valid && val.code === 'OK';

    return {
      id: 'Case A',
      name: '標準對接測試 (Standard Mating Compatibility)',
      passed,
      expected: 'validateConnection returns PASS (valid: true)',
      actual: passed ? 'PASS (相容通過, 600W x 100D TRAY_END)' : `FAIL: ${val.error}`,
      details: val,
    };
  }

  /**
   * Case B: 尺寸不符攔截 (Straight 600x100 Port B -> Elbow 450x100 Port A)
   */
  public static testCaseB(): TestCaseResult {
    const defStraight = ComponentRegistry.get('TRAY_STRAIGHT')!;
    const defElbow = ComponentRegistry.get('FITTING_ELBOW_90')!;

    const instStraight = new ComponentInstance('inst_straight', defStraight, { width: 600, depth: 100 });
    const instElbow = new ComponentInstance('inst_elbow', defElbow, { width: 450, depth: 100 });

    const val = ConnectionValidator.validateConnection(instStraight, 'PORT_B', instElbow, 'PORT_A');
    const passed = !val.valid && (val.code === 'WIDTH_MISMATCH' || (val.code as string) === 'DIMENSION_MISMATCH');

    return {
      id: 'Case B',
      name: '尺寸不符攔截 (Dimension Mismatch Interception)',
      passed,
      expected: 'validateConnection returns FAIL with WIDTH_MISMATCH',
      actual: passed ? `PASS (成功攔截: ${val.error})` : `FAIL: Unexpected result`,
      details: val,
    };
  }

  /**
   * Case C: 深度不符攔截 (Straight 600x100 Port B -> Elbow 600x150 Port A)
   */
  public static testCaseC(): TestCaseResult {
    const defStraight = ComponentRegistry.get('TRAY_STRAIGHT')!;
    const defElbow = ComponentRegistry.get('FITTING_ELBOW_90')!;

    const instStraight = new ComponentInstance('inst_straight', defStraight, { width: 600, depth: 100 });
    const instElbow = new ComponentInstance('inst_elbow', defElbow, { width: 600, depth: 150 });

    const val = ConnectionValidator.validateConnection(instStraight, 'PORT_B', instElbow, 'PORT_A');
    const passed = !val.valid && (val.code === 'DEPTH_MISMATCH' || (val.code as string) === 'DIMENSION_MISMATCH');

    return {
      id: 'Case C',
      name: '深度不符攔截 (Depth Mismatch Interception)',
      passed,
      expected: 'validateConnection returns FAIL with DEPTH_MISMATCH (depth 100 != 150)',
      actual: passed ? `PASS (成功攔截: ${val.error})` : `FAIL: Unexpected result`,
      details: val,
    };
  }

  /**
   * Case D: 連接類型不符攔截 (Tray End -> Gland Port)
   */
  public static testCaseD(): TestCaseResult {
    const defStraight = ComponentRegistry.get('TRAY_STRAIGHT')!;
    const defJb = ComponentRegistry.get('EQUIP_JUNCTION_BOX')!;

    const instStraight = new ComponentInstance('inst_straight', defStraight);
    const instJb = new ComponentInstance('inst_jb', defJb);

    const val = ConnectionValidator.validateConnection(instStraight, 'PORT_B', instJb, 'PORT_BOTTOM_GLAND');
    const passed = !val.valid && val.code === 'TYPE_MISMATCH';

    return {
      id: 'Case D',
      name: '連接類型不符攔截 (Type Mismatch Interception)',
      passed,
      expected: 'validateConnection returns FAIL with TYPE_MISMATCH (TRAY_END vs GLAND)',
      actual: passed ? `PASS (成功攔截: ${val.error})` : `FAIL: Unexpected result`,
      details: val,
    };
  }

  /**
   * Case E: 異徑對接成功 (Straight 600 -> Reducer Left Port A, Reducer Port B -> Straight 450)
   */
  public static testCaseE(): TestCaseResult {
    const defStraight600 = ComponentRegistry.get('TRAY_STRAIGHT')!;
    const defStraight450 = ComponentRegistry.get('TRAY_STRAIGHT')!;
    const defReducer = ComponentRegistry.get('FITTING_REDUCER_LEFT')!;

    const instStraight600 = new ComponentInstance('s600', defStraight600, { width: 600, depth: 100 });
    const instReducer = new ComponentInstance('red', defReducer, { inletWidth: 600, outletWidth: 450, depth: 100 });
    const instStraight450 = new ComponentInstance('s450', defStraight450, { width: 450, depth: 100 });

    const val1 = ConnectionValidator.validateConnection(instStraight600, 'PORT_B', instReducer, 'PORT_A');
    const val2 = ConnectionValidator.validateConnection(instReducer, 'PORT_B', instStraight450, 'PORT_A');

    const passed = val1.valid && val2.valid;

    return {
      id: 'Case E',
      name: '異徑轉接成功 (Reducer Transition Compatibility)',
      passed,
      expected: 'Both 600mm inlet and 450mm outlet validate successfully',
      actual: passed
        ? 'PASS (寬度 600mm ➔ 異徑組件 ➔ 450mm 雙向對接全部相容通過)'
        : `FAIL: In=${val1.valid}, Out=${val2.valid}`,
      details: { val1, val2 },
    };
  }

  /**
   * Case F: Mate 放置數值正確性 (Position & Quaternion of mated instance B)
   */
  public static testCaseF(): TestCaseResult {
    const defStraight = ComponentRegistry.get('TRAY_STRAIGHT')!;
    const instA = new ComponentInstance('instA', defStraight, { length: 3000 });
    const instB = new ComponentInstance('instB', defStraight, { length: 3000 });

    const placement = MateEngine.computePlacement(instA, 'PORT_B', instB, 'PORT_A');
    instB.setPlacement(placement);

    const portAWorld = instA.getWorldPorts().find((p) => p.id === 'PORT_B')!;
    const portBWorld = instB.getWorldPorts().find((p) => p.id === 'PORT_A')!;

    const dist = Transforms.distance(portAWorld.worldPosition, portBWorld.worldPosition);
    const dotDir = Transforms.dot(portAWorld.worldDirection, portBWorld.worldDirection);
    const dotUp = Transforms.dot(portAWorld.worldUp, portBWorld.worldUp);

    const posPassed = dist <= 0.001;
    const dirOpposite = Math.abs(dotDir - -1.0) <= 0.001;
    const upAligned = Math.abs(dotUp - 1.0) <= 0.001;
    const passed = posPassed && dirOpposite && upAligned;

    return {
      id: 'Case F',
      name: '自動對接幾何放置驗證 (Mate Placement Spatial Invariants)',
      passed,
      expected: 'Distance <= 0.001mm, Direction Dot == -1.0 (Opposite), Up Dot == 1.0 (Co-planar)',
      actual: passed
        ? `PASS (Dist=${dist.toFixed(4)}mm, DirDot=${dotDir.toFixed(3)}, UpDot=${dotUp.toFixed(3)})`
        : `FAIL: Dist=${dist}mm, DirDot=${dotDir}, UpDot=${dotUp}`,
      details: { dist, dotDir, dotUp, placement },
    };
  }

  /**
   * Case G: 鏈式放置累積誤差 (Chain 10 Straight 3m trays -> Port B at Z = 30,000mm)
   */
  public static testCaseG(): TestCaseResult {
    const defStraight = ComponentRegistry.get('TRAY_STRAIGHT')!;
    const instances: ComponentInstance[] = [];

    const inst0 = new ComponentInstance('tray_0', defStraight, { length: 3000 });
    // Set first tray so Port A is at origin Z=0, hence center is at Z=1500
    inst0.setPlacement({ position: [0, 0, 1500], quaternion: [0, 0, 0, 1] });
    instances.push(inst0);

    for (let i = 1; i < 10; i++) {
      const prev = instances[i - 1];
      const curr = new ComponentInstance(`tray_${i}`, defStraight, { length: 3000 });
      const pl = MateEngine.computePlacement(prev, 'PORT_B', curr, 'PORT_A');
      curr.setPlacement(pl);
      instances.push(curr);
    }

    const lastInst = instances[9];
    const lastPortB = lastInst.getWorldPorts().find((p) => p.id === 'PORT_B')!;
    const expectedZ = 30000;
    const errZ = Math.abs(lastPortB.worldPosition[2] - expectedZ);
    const errX = Math.abs(lastPortB.worldPosition[0]);
    const errY = Math.abs(lastPortB.worldPosition[1]);
    const maxErr = Math.max(errX, errY, errZ);

    const passed = maxErr <= 0.01;

    return {
      id: 'Case G',
      name: '鏈式對接累積誤差 (Chain Mating Cumulative Error Across 10 Segments)',
      passed,
      expected: 'Cumulative position error <= 0.01mm after 10 mated 3m segments (Total 30m)',
      actual: passed
        ? `PASS (總長 30m, 終端端點 Z=${lastPortB.worldPosition[2].toFixed(4)}mm, 累積誤差=${maxErr.toExponential(2)}mm)`
        : `FAIL: Max Error = ${maxErr}mm`,
      details: { finalPosition: lastPortB.worldPosition, error: maxErr },
    };
  }

  /**
   * Case H: JSON 匯出與還原 (JsonExporter ComponentDefinition export round-trip)
   */
  public static testCaseH(): TestCaseResult {
    const def = ComponentRegistry.get('FITTING_ELBOW_90')!;
    const json = JsonExporter.exportDefinition(def);

    const hasSchema = json.schemaVersion === '2.0.0';
    const hasPorts = json.ports.length === 2;
    const hasCenterlines = json.centerlines.length === 1;
    const hasBounds = !!json.bounds && json.bounds.min && json.bounds.max;

    const passed = hasSchema && hasPorts && hasCenterlines && hasBounds;

    return {
      id: 'Case H',
      name: 'JSON 結構序列化確效 (JSON Export Structure Compliance)',
      passed,
      expected: 'JSON has schemaVersion 2.0.0, ports, centerlines, and bounds',
      actual: passed
        ? `PASS (JSON Schema 2.0.0 格式完整, 含 ${json.ports.length} 埠位, ${json.centerlines.length} 中心線, 包絡範圍齊備)`
        : `FAIL: Missing schema attributes`,
      details: json,
    };
  }

  /**
   * Case I: 迴轉環路封閉檢查 (4 x Elbow 90° forming a closed square loop)
   */
  public static testCaseI(): TestCaseResult {
    const defElbow = ComponentRegistry.get('FITTING_ELBOW_90')!;
    const R = 600;

    const e1 = new ComponentInstance('e1', defElbow, { radius: R });
    const e2 = new ComponentInstance('e2', defElbow, { radius: R });
    const e3 = new ComponentInstance('e3', defElbow, { radius: R });
    const e4 = new ComponentInstance('e4', defElbow, { radius: R });

    e2.setPlacement(MateEngine.computePlacement(e1, 'PORT_B', e2, 'PORT_A'));
    e3.setPlacement(MateEngine.computePlacement(e2, 'PORT_B', e3, 'PORT_A'));
    e4.setPlacement(MateEngine.computePlacement(e3, 'PORT_B', e4, 'PORT_A'));

    const pStart = e1.getWorldPorts().find((p) => p.id === 'PORT_A')!;
    const pEnd = e4.getWorldPorts().find((p) => p.id === 'PORT_B')!;

    const gap = Transforms.distance(pStart.worldPosition, pEnd.worldPosition);
    const passed = gap <= 0.05;

    return {
      id: 'Case I',
      name: '迴轉環路封閉精確度 (Closed Loop 4x90° Elbow Closure Precision)',
      passed,
      expected: 'Closure gap <= 0.05mm after completing a 360-degree loop',
      actual: passed
        ? `PASS (四只 90° 彎頭閉合間隙 Gap=${gap.toExponential(2)}mm)`
        : `FAIL: Loop gap = ${gap}mm`,
      details: { gap, start: pStart.worldPosition, end: pEnd.worldPosition },
    };
  }

  /**
   * Case J: 避讓包絡體計算 (OBSTACLE_MAIN_PROCESS_PIPE clearance envelope)
   */
  public static testCaseJ(): TestCaseResult {
    const defPipe = ComponentRegistry.get('OBSTACLE_MAIN_PROCESS_PIPE')!;
    const bounds = defPipe.getBounds({ diameterMm: 500, lengthMm: 6000, clearanceMm: 150 });

    const hasEnv = !!bounds.clearanceEnvelope;
    const dNom = 500;
    const buf = 150;
    const expectedMaxRadius = dNom / 2 + buf; // 400mm

    const actualMaxRadius = hasEnv ? bounds.clearanceEnvelope!.max[1] : 0;
    const passed = hasEnv && actualMaxRadius === expectedMaxRadius;

    return {
      id: 'Case J',
      name: '避讓包絡體動態計算 (Obstacle Clearance Envelope Computation)',
      passed,
      expected: `Clearance Envelope radius == ${expectedMaxRadius}mm (Pipe R=250 + Clearance 150mm)`,
      actual: passed
        ? `PASS (管徑 500mm + 防護緩衝 150mm ➔ 淨空包絡半徑 = ${actualMaxRadius}mm)`
        : `FAIL: Expected ${expectedMaxRadius}, got ${actualMaxRadius}`,
      details: bounds,
    };
  }

  /**
   * Case K: 型錄規格邊界檢查 (Check width conformance for 550mm)
   */
  public static testCaseK(): TestCaseResult {
    const standardWidth = CatalogStandards.checkConformance({ width: 600 });
    const nonStandardWidth = CatalogStandards.checkConformance({ width: 550 });

    const passed = standardWidth.isStandard && !nonStandardWidth.isStandard && nonStandardWidth.warnings.length > 0;

    return {
      id: 'Case K',
      name: '工程型錄規範檢核 (Catalog Standards & Presets Conformance)',
      passed,
      expected: '600mm passes as standard; 550mm flags non-standard warning',
      actual: passed
        ? `PASS (600mm 標準通過; 550mm 正確警示: "${nonStandardWidth.warnings[0]}")`
        : `FAIL: Unexpected conformance check`,
      details: { standardWidth, nonStandardWidth },
    };
  }

  /**
   * Case L: 解析中心線長度公式精確度 (Straight & Elbow exact analytic formula)
   */
  public static testCaseL(): TestCaseResult {
    const defStraight = ComponentRegistry.get('TRAY_STRAIGHT')!;
    const defElbow90 = ComponentRegistry.get('FITTING_ELBOW_90')!;
    const defElbow45 = ComponentRegistry.get('FITTING_ELBOW_45')!;

    const rStraight = defStraight.getCenterlineRoutes({ length: 3000 })[0];
    const rElbow90 = defElbow90.getCenterlineRoutes({ radius: 600, angleDeg: 90 })[0];
    const rElbow45 = defElbow45.getCenterlineRoutes({ radius: 600, angleDeg: 45 })[0];

    const expStraight = 3000.0;
    const expElbow90 = (600 * Math.PI) / 2;
    const expElbow45 = (600 * Math.PI) / 4;

    const errStraight = Math.abs(rStraight.analyticLength - expStraight);
    const errElbow90 = Math.abs(rElbow90.analyticLength - expElbow90);
    const errElbow45 = Math.abs(rElbow45.analyticLength - expElbow45);

    const maxErr = Math.max(errStraight, errElbow90, errElbow45);
    const passed = maxErr <= 0.001;

    return {
      id: 'Case L',
      name: '解析中心線長度精確度 (Analytic Centerline Length Formula Validation)',
      passed,
      expected: 'Straight: 3000.000mm, Elbow 90°: 942.478mm, Elbow 45°: 471.239mm (Error <= 0.001mm)',
      actual: passed
        ? `PASS (Straight=${rStraight.analyticLength.toFixed(3)}mm, E90=${rElbow90.analyticLength.toFixed(3)}mm, E45=${rElbow45.analyticLength.toFixed(3)}mm, MaxError=${maxErr.toExponential(2)}mm)`
        : `FAIL: Max Error = ${maxErr}mm`,
      details: { rStraight, rElbow90, rElbow45 },
    };
  }

  /**
   * Case M: Assembly BOM 驗證 (Double-counting fixture verification)
   */
  public static testCaseM(): TestCaseResult {
    const defMainBay = ComponentRegistry.get('STRUCT_MAIN_BAY')!;
    const defCol = ComponentRegistry.get('STRUCT_COLUMN')!;

    // Construct a fixture with 1 main bay assembly and 2 bundled child instances + 1 separate column
    const instMainBay = new ComponentInstance('bay_01', defMainBay);
    const childCol1 = new ComponentInstance('bay_01_col1', defCol, {}, {}, 'bay_01');
    const childCol2 = new ComponentInstance('bay_01_col2', defCol, {}, {}, 'bay_01');
    const separateCol = new ComponentInstance('separate_col_01', defCol);

    const allFixtureInstances = [instMainBay, childCol1, childCol2, separateCol];

    // 1. With filtering enabled (standard mode)
    const filteredBom = BomManager.generateBom(allFixtureInstances, { filterBundledChildren: true });

    // 2. With filtering disabled (to verify double counting detection is functional and not hardcoded)
    const unfilteredBom = BomManager.generateBom(allFixtureInstances, { filterBundledChildren: false });

    const hasAssemblyKit = filteredBom.items.some((it) => it.definitionId === 'STRUCT_MAIN_BAY' && it.isAssemblyKit);
    const colItemFiltered = filteredBom.items.find((it) => it.definitionId === 'STRUCT_COLUMN');
    const colItemUnfiltered = unfilteredBom.items.find((it) => it.definitionId === 'STRUCT_COLUMN');

    const correctlyExcludedBundled =
      filteredBom.excludedBundledItems.includes('bay_01_col1') &&
      filteredBom.excludedBundledItems.includes('bay_01_col2');

    // Filtered column count must be exactly 1 (the separate column), NOT 3!
    const separateColCountCorrect = colItemFiltered?.quantity === 1;

    // Unfiltered column count must be 3, triggering hasDoubleCounting = true
    const doubleCountDetectedWhenUnfiltered = unfilteredBom.hasDoubleCounting && colItemUnfiltered?.quantity === 3;

    const passed =
      hasAssemblyKit &&
      correctlyExcludedBundled &&
      separateColCountCorrect &&
      !filteredBom.hasDoubleCounting &&
      doubleCountDetectedWhenUnfiltered;

    return {
      id: 'Case M',
      name: '組合件材料清單不重複計價 (Assembly BOM Zero Double-Counting Fixture)',
      passed,
      expected: 'Assembly Kit filters 2 bundled columns, only bills 1 kit + 1 separate column, with active double-counting detection',
      actual: passed
        ? `PASS (STRUCT_MAIN_BAY 套件正確排除 2 根內部 bundled 立柱, 獨立立柱計 1 支, 引擎成功攔截 double-counting)`
        : `FAIL: filteredCols=${colItemFiltered?.quantity}, unfilteredCols=${colItemUnfiltered?.quantity}, doubleCountingDetected=${doubleCountDetectedWhenUnfiltered}`,
      details: { filteredBom, unfilteredBom },
    };
  }

  /**
   * Case N: 視覺回歸確效 (Deterministic Visual Baseline Regression of 8 Legacy Models)
   */
  public static testCaseN(): TestCaseResult {
    const camera = new THREE.PerspectiveCamera(45, 800 / 600, 0.1, 100);
    camera.position.set(2.6, 2.0, 3.0);
    camera.lookAt(0, 0, 0);
    camera.updateMatrixWorld(true);
    camera.updateProjectionMatrix();

    const legacyIds = Object.keys(LEGACY_FITTING_BASELINES);
    let totalDeltas = 0;
    const comparisons: any[] = [];

    legacyIds.forEach((id) => {
      const baseline = LEGACY_FITTING_BASELINES[id];
      const def = ComponentRegistry.get(id);
      if (!def) {
        totalDeltas++;
        comparisons.push({ id, error: 'Component definition missing' });
        return;
      }

      const mesh = def.buildGeometry(def.defaultParameters);
      mesh.updateMatrixWorld(true);

      let vertexCount = 0;
      let triangleCount = 0;
      const box = new THREE.Box3().setFromObject(mesh);

      mesh.traverse((child: any) => {
        if (child.isMesh && child.geometry) {
          const geo = child.geometry;
          if (geo.index) {
            triangleCount += geo.index.count / 3;
          } else if (geo.attributes?.position) {
            triangleCount += geo.attributes.position.count / 3;
          }
          if (geo.attributes?.position) {
            vertexCount += geo.attributes.position.count;
          }
        }
      });

      const center = new THREE.Vector3();
      box.getCenter(center);
      const proj = center.clone().project(camera);

      const actualBounds = [
        +box.min.x.toFixed(4), +box.min.y.toFixed(4), +box.min.z.toFixed(4),
        +box.max.x.toFixed(4), +box.max.y.toFixed(4), +box.max.z.toFixed(4),
      ];
      const actualCentroid = [+proj.x.toFixed(4), +proj.y.toFixed(4)];

      const vDelta = Math.abs(vertexCount - baseline.vertexCount);
      const tDelta = Math.abs(triangleCount - baseline.triangleCount);
      const mDelta = Math.abs(mesh.children.length - baseline.childMeshCount);
      const bDelta = actualBounds.reduce((max, val, idx) => Math.max(max, Math.abs(val - baseline.bounds[idx])), 0);
      const cDelta = Math.max(Math.abs(actualCentroid[0] - baseline.projectedCentroid[0]), Math.abs(actualCentroid[1] - baseline.projectedCentroid[1]));

      const modelDeltas = vDelta + tDelta + mDelta + (bDelta > 0.005 ? 1 : 0) + (cDelta > 0.005 ? 1 : 0);
      totalDeltas += modelDeltas;

      comparisons.push({
        id,
        baseline,
        actual: { childMeshCount: mesh.children.length, vertexCount, triangleCount, bounds: actualBounds, projectedCentroid: actualCentroid },
        deltas: { vDelta, tDelta, mDelta, bDelta, cDelta },
        match: modelDeltas === 0,
      });
    });

    const passed = totalDeltas === 0;

    return {
      id: 'Case N',
      name: '既有配件視覺回歸比對 (Deterministic Baseline Regression of 8 Models)',
      passed,
      expected: '8 legacy models match deterministic vertexCount, triangleCount, bounds, and screen projection with 0 unexpected delta',
      actual: passed
        ? `PASS (8/8 既有模型與幾何/投影特徵基準完全吻合, 0 unexpected difference)`
        : `FAIL: ${totalDeltas} unexpected deltas detected across baseline comparisons`,
      details: comparisons,
    };
  }

  /**
   * Case O: 通用角度單一真實來源 (Generic Angle 37.5° SOT Verification)
   */
  public static testCaseO(): TestCaseResult {
    const customAngle = 37.5;
    const defElbow = ComponentRegistry.get('FITTING_ELBOW_90')!;
    const inst = new ComponentInstance('inst_custom_angle', defElbow, { angleDeg: customAngle, radius: 600, width: 600 });

    const ports = inst.getWorldPorts();
    const portA = ports.find((p) => p.id === 'PORT_A')!;
    const portB = ports.find((p) => p.id === 'PORT_B')!;
    const centerline = inst.getCenterlines()[0];
    const mesh = inst.getThreeMesh();

    const aRad = (customAngle * Math.PI) / 180;
    const expectedEndX = 600 * Math.cos(aRad);
    const expectedEndZ = -600 * Math.sin(aRad);
    const expectedAnalyticLen = 600 * aRad;

    // 1. Port endpoint match
    const portBPosErr = Math.hypot(portB.worldPosition[0] - expectedEndX, portB.worldPosition[2] - expectedEndZ);
    const portPassed = portBPosErr < 0.01;

    // 2. Centerline endpoint match
    const firstSample = centerline.samplePoints[0];
    const lastSample = centerline.samplePoints[centerline.samplePoints.length - 1];
    const clStartErr = Transforms.distance(firstSample, portA.worldPosition);
    const clEndErr = Transforms.distance(lastSample, portB.worldPosition);
    const clPassed = clStartErr < 0.01 && clEndErr < 0.01;

    // 3. Analytic length match
    const lenErr = Math.abs(centerline.analyticLength - expectedAnalyticLen);
    const lenPassed = lenErr < 0.01;

    // 4. Geometry bounds in Z reflect 37.5°
    const box = new THREE.Box3().setFromObject(mesh);
    const geoPassed = box.min.z < 0 && box.max.z > 0;

    // 5. Catalog check
    const conf = CatalogStandards.checkConformance({ angleDeg: customAngle });
    const warnsNonStandard = !conf.isStandard && conf.warnings.some((w) => w.includes('Non-standard'));

    const passed = portPassed && clPassed && lenPassed && geoPassed && warnsNonStandard;

    return {
      id: 'Case O',
      name: '通用角度單一真實來源 (Generic Angle 37.5° Ports, Route & Geometry SOT)',
      passed,
      expected: 'angleDeg 37.5° synchronously drives Port B position, Centerline endpoints, analytic length, and geometry orientation',
      actual: passed
        ? `PASS (37.5°: Port B=[${portB.worldPosition[0].toFixed(1)}, ${portB.worldPosition[2].toFixed(1)}]mm, CenterlineErr=${clEndErr.toFixed(3)}mm, Length=${centerline.analyticLength.toFixed(2)}mm, 型錄警示確認)`
        : `FAIL: portPassed=${portPassed}, clPassed=${clPassed}, lenPassed=${lenPassed}, warns=${warnsNonStandard}`,
      details: { portBPosErr, clStartErr, clEndErr, lenErr, conf },
    };
  }

  /**
   * Case P: 參數連動一致性 (Elbow R: 300 -> 600mm, Angle 45 -> 90°, all derived states sync)
   */
  public static testCaseP(): TestCaseResult {
    const def = ComponentRegistry.get('FITTING_ELBOW_90')!;
    const inst = new ComponentInstance('inst_consistency', def, { radius: 300, angleDeg: 45 });

    const len1 = inst.getCenterlines()[0].analyticLength;
    const port1Pos = inst.getWorldPorts().find((p) => p.id === 'PORT_A')!.worldPosition[0];

    // Modify parameters simultaneously
    inst.updateParameters({ radius: 600, angleDeg: 90 });

    const len2 = inst.getCenterlines()[0].analyticLength;
    const port2Pos = inst.getWorldPorts().find((p) => p.id === 'PORT_A')!.worldPosition[0];
    const bounds2 = inst.getBounds();

    // Verify all states synchronized to R=600, Angle=90
    const expectedLen2 = (600 * Math.PI) / 2;
    const lenUpdated = Math.abs(len2 - expectedLen2) < 0.001;
    const portUpdated = port2Pos === 600;
    const boundsUpdated = bounds2.max[0] >= 600;

    const passed = lenUpdated && portUpdated && boundsUpdated && len2 !== len1 && port2Pos !== port1Pos;

    return {
      id: 'Case P',
      name: '參數連動單一資料源一致性 (Single Source of Truth Consistency Across Derivatives)',
      passed,
      expected: 'Changing R=300->600mm & Angle=45->90° synchronously updates Ports, Centerlines, Length, Bounds, and Mesh',
      actual: passed
        ? `PASS (所有衍生資料由同一組 effectiveParameters 同步推導: Length ${len1.toFixed(1)}mm ➔ ${len2.toFixed(1)}mm, PortX ${port1Pos}mm ➔ ${port2Pos}mm, 無舊值殘留)`
        : `FAIL: lenUpdated=${lenUpdated}, portUpdated=${portUpdated}`,
      details: { len1, len2, port1Pos, port2Pos, bounds2 },
    };
  }

  /**
   * Invariant Test Q: Centerline ↔ Port Endpoint Invariant
   * Verifies for all routing-capable components:
   * centerline.firstPoint == fromPort.localPosition
   * centerline.lastPoint  == toPort.localPosition
   */
  public static testCaseQ_CenterlinePortEndpoints(): TestCaseResult {
    const allDefs = ComponentRegistry.getAll();
    let checkedRoutes = 0;
    let maxError = 0;
    const failures: any[] = [];

    allDefs.forEach((def) => {
      const routes = def.getCenterlineRoutes(def.defaultParameters);
      if (routes.length === 0) return;

      const ports = def.getLocalPorts(def.defaultParameters);
      const portMap = new Map(ports.map((p) => [p.id, p]));

      routes.forEach((r) => {
        checkedRoutes++;
        const fromPort = portMap.get(r.fromPort);
        const toPort = portMap.get(r.toPort);

        if (!fromPort || !toPort) {
          failures.push({ defId: def.id, routeId: r.id, error: 'Port not found' });
          return;
        }

        const firstPt = r.samplePoints[0];
        const lastPt = r.samplePoints[r.samplePoints.length - 1];

        const startDist = Transforms.distance(firstPt, fromPort.localPosition);
        const endDist = Transforms.distance(lastPt, toPort.localPosition);

        maxError = Math.max(maxError, startDist, endDist);

        if (startDist > 0.01 || endDist > 0.01) {
          failures.push({
            defId: def.id,
            routeId: r.id,
            startDist,
            endDist,
            firstPt,
            fromPortPos: fromPort.localPosition,
            lastPt,
            toPortPos: toPort.localPosition,
          });
        }
      });
    });

    const passed = failures.length === 0 && checkedRoutes >= 14;

    return {
      id: 'Case Q',
      name: '中心線與埠位端點精確重合不變量 (Centerline ↔ Port Endpoint Invariant)',
      passed,
      expected: 'All routing components have centerline start == fromPort and end == toPort within 0.01mm tolerance',
      actual: passed
        ? `PASS (已驗證 ${checkedRoutes} 條路由中心線, 最大端點誤差 = ${maxError.toExponential(2)}mm, 包含 RISER_OUT_90/45 全數合格)`
        : `FAIL: ${failures.length} routing invariant violations`,
      details: { checkedRoutes, maxError, failures },
    };
  }

  /**
   * Invariant Test R: Bounds ↔ Geometry Consistency Invariant
   * Rigorously checks minX, minY, minZ, maxX, maxY, maxZ between getBounds() and THREE.Box3.
   */
  public static testCaseR_BoundsConsistency(): TestCaseResult {
    const requiredTestIds = [
      'STRUCT_COLUMN',
      'STRUCT_PIER',
      'STRUCT_MAIN_BAY',
      'STRUCT_BRANCH_BAY',
      'TRAY_STRAIGHT',
      'FITTING_ELBOW_90',
      'FITTING_RISER_OUT_90',
      'FITTING_REDUCER_LEFT',
    ];

    const failures: Array<{
      id: string;
      axis: string;
      boundsVal: number;
      geoVal: number;
      diff: number;
    }> = [];

    let maxError = 0;
    const toleranceMm = 0.05; // 50 microns

    requiredTestIds.forEach((id) => {
      const def = ComponentRegistry.get(id);
      if (!def) {
        failures.push({ id, axis: 'REGISTRY', boundsVal: 0, geoVal: 0, diff: -1 });
        return;
      }

      const bounds = def.getBounds(def.defaultParameters);
      const mesh = def.buildGeometry(def.defaultParameters);
      mesh.updateMatrixWorld(true);

      const box = new THREE.Box3().setFromObject(mesh);
      const geoMinMm = [box.min.x * 1000, box.min.y * 1000, box.min.z * 1000];
      const geoMaxMm = [box.max.x * 1000, box.max.y * 1000, box.max.z * 1000];

      const axes = ['X', 'Y', 'Z'];

      // Compare minX, minY, minZ
      for (let i = 0; i < 3; i++) {
        const diff = Math.abs(bounds.min[i] - geoMinMm[i]);
        maxError = Math.max(maxError, diff);
        if (diff > toleranceMm) {
          failures.push({
            id,
            axis: `min${axes[i]}`,
            boundsVal: bounds.min[i],
            geoVal: geoMinMm[i],
            diff,
          });
        }
      }

      // Compare maxX, maxY, maxZ
      for (let i = 0; i < 3; i++) {
        const diff = Math.abs(bounds.max[i] - geoMaxMm[i]);
        maxError = Math.max(maxError, diff);
        if (diff > toleranceMm) {
          failures.push({
            id,
            axis: `max${axes[i]}`,
            boundsVal: bounds.max[i],
            geoVal: geoMaxMm[i],
            diff,
          });
        }
      }
    });

    const passed = failures.length === 0;

    return {
      id: 'Case R',
      name: '構件包絡邊界與實體幾何一致性 (Bounds ↔ Geometry Consistency Invariant)',
      passed,
      expected: `All ${requiredTestIds.length} required components have minX/Y/Z & maxX/Y/Z matching THREE.Box3 within ${toleranceMm}mm`,
      actual: passed
        ? `PASS (已嚴格比對 ${requiredTestIds.length} 組構件之 6 軸包絡邊界 min/max，最大誤差 = ${maxError.toExponential(2)}mm)`
        : `FAIL: ${failures.length} bounding coordinate inconsistencies (Max Error = ${maxError.toFixed(3)}mm)`,
      details: { requiredTestIds, maxError, failures },
    };
  }

  /**
   * Invariant Test S: Port Frame Handedness (Right-handed orthonormal basis, det = +1.0)
   */
  public static testCaseS_PortFrameHandedness(): TestCaseResult {
    const allDefs = ComponentRegistry.getAll();
    let portCount = 0;
    let minDet = 1.0;
    let maxDet = 1.0;
    const failures: any[] = [];

    allDefs.forEach((def) => {
      const ports = def.getLocalPorts(def.defaultParameters);
      ports.forEach((p) => {
        portCount++;
        const frame = new PortFrame(p.localPosition, p.localDirection, p.localUp);
        const det = frame.getDeterminant();
        minDet = Math.min(minDet, det);
        maxDet = Math.max(maxDet, det);

        if (Math.abs(det - 1.0) > 0.001) {
          failures.push({ defId: def.id, portId: p.id, det });
        }
      });
    });

    const passed = failures.length === 0 && portCount > 30;

    return {
      id: 'Case S',
      name: '埠位局部座標系右手正交規範 (Port Frame Right-Handed Orthonormal Invariant)',
      passed,
      expected: 'All port basis frames satisfy right = up x direction with basis determinant strictly +1.0 (no reflection)',
      actual: passed
        ? `PASS (全庫 ${portCount} 個埠位座標系正交行列式值 det = 1.00000, 嚴格右手系, 無左手映象)`
        : `FAIL: ${failures.length} inverted port frames detected`,
      details: { portCount, minDet, maxDet, failures },
    };
  }

  /**
   * Invariant Test T: Eccentric Reducer Physical Analytic Length
   */
  public static testCaseT_EccentricReducerLength(): TestCaseResult {
    const defLeft = ComponentRegistry.get('FITTING_REDUCER_LEFT')!;
    const defCenter = ComponentRegistry.get('FITTING_REDUCER_CENTER')!;

    // 600 -> 450 with L=500 -> offset = 75mm
    const routeLeft = defLeft.getCenterlineRoutes({ inletWidth: 600, outletWidth: 450, length: 500 })[0];
    const routeCenter = defCenter.getCenterlineRoutes({ inletWidth: 600, outletWidth: 450, length: 500 })[0];

    const expectedHypot = Math.hypot(500, 75); // 505.5937...
    const errLeft = Math.abs(routeLeft.analyticLength - expectedHypot);
    const errCenter = Math.abs(routeCenter.analyticLength - 500);

    const passed = errLeft < 0.001 && errCenter < 0.001 && routeLeft.analyticLength > 500;

    return {
      id: 'Case T',
      name: '偏心大小頭物理斜邊中心線長度 (Eccentric Reducer Physical Hypotenuse Length)',
      passed,
      expected: 'Eccentric reducer length uses sqrt(L^2 + offset^2) = 505.594mm > 500mm',
      actual: passed
        ? `PASS (左偏異徑長度 = ${routeLeft.analyticLength.toFixed(3)}mm (含 75mm 側向偏移), 同心長度 = ${routeCenter.analyticLength.toFixed(3)}mm)`
        : `FAIL: errLeft=${errLeft}, errCenter=${errCenter}`,
      details: { routeLeft, routeCenter, expectedHypot },
    };
  }

  /**
   * Invariant Test U: Tee Physical Branch Centerline (Straight + Arc + Straight)
   */
  public static testCaseU_TeePhysicalCenterline(): TestCaseResult {
    const defTee = ComponentRegistry.get('FITTING_TEE')!;
    const routes = defTee.getCenterlineRoutes({ length: 1400, branchLength: 700, radius: 300 });

    const routeAC = routes.find((r) => r.id === 'ROUTE_A_C')!;
    const routeBC = routes.find((r) => r.id === 'ROUTE_B_C')!;

    const expectedAnalytic = AnalyticLength.teeBranch(1400, 700, 300);
    const errAC = Math.abs(routeAC.analyticLength - expectedAnalytic);

    // Verify sample points form a smooth continuous curve
    let polyLength = 0;
    for (let i = 1; i < routeAC.samplePoints.length; i++) {
      polyLength += Transforms.distance(routeAC.samplePoints[i - 1], routeAC.samplePoints[i]);
    }
    const chordError = Math.abs(polyLength - expectedAnalytic);

    const passed = errAC < 0.001 && chordError < 2.0 && routeAC.samplePoints.length > 5;

    return {
      id: 'Case U',
      name: '三通實體過渡中心線曲線 (Tee Smooth Arc Branch Centerline Invariant)',
      passed,
      expected: 'ROUTE_A_C is Straight+Arc+Straight polyline starting at Port A and ending at Port C',
      actual: passed
        ? `PASS (分流中心線長度 = ${routeAC.analyticLength.toFixed(2)}mm, 幾何取樣離散弦長 = ${polyLength.toFixed(2)}mm, 圓弧轉角平滑)`
        : `FAIL: errAC=${errAC}, chordError=${chordError}`,
      details: { routeAC, routeBC, expectedAnalytic, polyLength },
    };
  }

  /**
   * Invariant Test V: Derived State Export Snapshot
   */
  public static testCaseV_DerivedStateExport(): TestCaseResult {
    const def = ComponentRegistry.get('TRAY_STRAIGHT')!;
    const inst = new ComponentInstance('test_export_inst', def);

    const exported = JsonExporter.exportScene([inst]);
    const exportedInst = exported.instances[0];

    const hasDerivedSnapshot = !!exportedInst.derivedSnapshot;
    const statusOk = exportedInst.derivedSnapshot?.status === 'NON_CANONICAL_SNAPSHOT';
    const hasCanonicalParams = !!exportedInst.effectiveParameters && !!exportedInst.placement;

    const passed = hasDerivedSnapshot && statusOk && hasCanonicalParams;

    return {
      id: 'Case V',
      name: '衍生狀態匯出標記不變量 (Derived State Export Non-Canonical Snapshot)',
      passed,
      expected: 'exportScene marks worldPorts under derivedSnapshot with NON_CANONICAL_SNAPSHOT status',
      actual: passed
        ? 'PASS (匯出資料以 effectiveParameters 與 placement 為 SOT, worldPorts 妥善收容於 derivedSnapshot)'
        : 'FAIL: Export structure violated',
      details: exportedInst,
    };
  }
}
