/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import * as THREE from 'three';
import { ComponentRegistry } from '../registry/ComponentRegistry.ts';
import { ComponentInstance } from '../core/Instance.ts';
import type { ComponentDefinition } from '../core/Schema.ts';
import { MateEngine } from '../ports/MateEngine.ts';
import { ConnectionValidator } from '../validation/ConnectionValidator.ts';
import { AssemblyValidator } from '../validation/AssemblyValidator.ts';
import { buildMatedAssembly, ASSEMBLY_DEMOS, type AssemblyStep } from '../validation/AssemblyChain.ts';
import { JsonExporter } from '../export/JsonExporter.ts';
import { CatalogStandards } from '../registry/CatalogStandards.ts';
import { BomManager } from '../bom/BomManager.ts';
import { Transforms } from '../core/Transforms.ts';
import { PortFrame } from '../ports/PortFrame.ts';
import { AnalyticLength } from '../centerline/AnalyticLength.ts';
import { LEGACY_FITTING_BASELINES } from './baselines/legacyFittingBaselines.ts';
import { VENDOR_GOLDEN_FIXTURES } from './fixtures/vendorCatalogFixtures.ts';
import { computeGeometryBounds } from '../geometry/GeometryBoundsValidator.ts';
import { straightLayout } from '../geometry/TrayLayouts.ts';
import { buildTrayLayoutGroup } from '../geometry/TrayMeshBuilder.ts';
import {
  TraySystemProfiles,
  createComponentFromProfile,
  resolveProfileParameters,
  trayFamilyOf,
  type TraySystemProfile,
} from '../registry/TraySystemProfile.ts';
import { getComponentSystemCategories } from '../registry/SystemClassification.ts';

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

type V3 = [number, number, number];

// ---------------------------------------------------------------------------
// Test helpers
// ---------------------------------------------------------------------------

const LADDER = () => TraySystemProfiles.get('LADDER_PROFILE_STANDARD')!;
const VENT_A = () => TraySystemProfiles.get('VENTILATED_PROFILE_A')!;
const VENT_B = () => TraySystemProfiles.get('VENTILATED_PROFILE_B')!;

function dist(a: V3, b: V3): number {
  return Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2]);
}

function maxBoundsError(a: { min: V3; max: V3 }, b: { min: V3; max: V3 }): number {
  let m = 0;
  for (let k = 0; k < 3; k++) m = Math.max(m, Math.abs(a.min[k] - b.min[k]), Math.abs(a.max[k] - b.max[k]));
  return m;
}

/** Body vertices (mm, component-local) of a geometry group, accessories excluded. */
function bodyVertices(group: THREE.Group): V3[] {
  group.updateMatrixWorld(true);
  const out: V3[] = [];
  group.traverse((o) => {
    const m = o as THREE.Mesh;
    if (!m.isMesh || m.userData?.isAccessory) return;
    const pos = m.geometry.getAttribute('position');
    const v = new THREE.Vector3();
    for (let i = 0; i < pos.count; i++) {
      v.fromBufferAttribute(pos, i).applyMatrix4(m.matrixWorld).multiplyScalar(1000);
      out.push([v.x, v.y, v.z]);
    }
  });
  return out;
}

/**
 * Curvature evidence: for each test angle within a 90° corner, a body vertex must lie on the
 * circle of radius `radius` (in plan XZ) around `center`, at that angle. A straight / square
 * junction has no vertices on such an arc away from its end points.
 */
function arcEvidence(verts: V3[], center: [number, number], radius: number, startDeg: number, sweepDeg: number): { found: number; tested: number } {
  const fractions = [0.2, 0.35, 0.5, 0.65, 0.8];
  let found = 0;
  fractions.forEach((f) => {
    const a = ((startDeg + sweepDeg * f) * Math.PI) / 180;
    const hit = verts.some((v) => {
      const dx = v[0] - center[0];
      const dz = v[2] - center[1];
      const r = Math.hypot(dx, dz);
      if (Math.abs(r - radius) > 0.5) return false;
      const ang = Math.atan2(dz, dx);
      let d = Math.abs(ang - a);
      d = Math.min(d, 2 * Math.PI - d);
      return d < (2 * Math.PI) / 180;
    });
    if (hit) found++;
  });
  return { found, tested: fractions.length };
}

/** All tray / fitting definitions (families driven by TrayLayouts). */
function trayDefinitions(): ComponentDefinition[] {
  return ComponentRegistry.getAll().filter((d) => trayFamilyOf(d.id) !== 'OTHER');
}

/** Parameter variants to exercise: generic defaults + every catalog profile offering the component. */
function variantsOf(def: ComponentDefinition): Array<{ label: string; params: Record<string, any> }> {
  const out: Array<{ label: string; params: Record<string, any> }> = [{ label: 'GENERIC', params: { ...def.defaultParameters } }];
  TraySystemProfiles.getAll().forEach((p) => {
    if (TraySystemProfiles.supports(p, def.id)) {
      out.push({ label: p.id, params: { ...def.defaultParameters, ...resolveProfileParameters(def.id, p) } });
    }
  });
  return out;
}

function result(id: string, name: string, passed: boolean, expected: string, pass: string, fail: string, details?: any): TestCaseResult {
  return { id, name, passed, expected, actual: passed ? pass : `FAIL: ${fail}`, details };
}

/**
 * Automated Acceptance Test Suite for MCR-Studio Parametric 3D Library.
 * Cases A–V: engine invariants. Cases W–AK: vendor catalog geometry and physical assembly.
 */
export class AcceptanceTestSuite {
  public static runAll(): TestSuiteReport {
    ComponentRegistry.initAll();

    const tests: Array<() => TestCaseResult> = [
      () => this.testCaseA(),
      () => this.testCaseB(),
      () => this.testCaseC(),
      () => this.testCaseD(),
      () => this.testCaseE(),
      () => this.testCaseF(),
      () => this.testCaseG(),
      () => this.testCaseH(),
      () => this.testCaseI(),
      () => this.testCaseJ(),
      () => this.testCaseK(),
      () => this.testCaseL(),
      () => this.testCaseM(),
      () => this.testCaseN(),
      () => this.testCaseO(),
      () => this.testCaseP(),
      () => this.testCaseQ_CenterlinePortEndpoints(),
      () => this.testCaseR_BoundsConsistency(),
      () => this.testCaseS_PortFrameHandedness(),
      () => this.testCaseT_EccentricReducerLength(),
      () => this.testCaseU_TeePhysicalCenterline(),
      () => this.testCaseV_DerivedStateExport(),
      () => this.testCaseW_CatalogProfileA(),
      () => this.testCaseX_CatalogProfileB(),
      () => this.testCaseY_HorizontalCross(),
      () => this.testCaseZ_CatalogAngles(),
      () => this.testCaseAA_VendorDimensionFormulas(),
      () => this.testCaseAB_ProfileCatalogIntegrity(),
      () => this.testCaseAC_GoldenFixtures(),
      () => this.testCaseAD_TeeCurvedTransition(),
      () => this.testCaseAE_CrossCurvedCorners(),
      () => this.testCaseAF_ProfilePropagation(),
      () => this.testCaseAG_RadiusSemantics(),
      () => this.testCaseAH_ConnectionFaceTermination(),
      () => this.testCaseAI_AssemblyRegression(),
      () => this.testCaseAJ_NegativeControls(),
      () => this.testCaseAK_AssemblyDemos(),
    ];

    const results: TestCaseResult[] = tests.map((t, i) => {
      try {
        return t();
      } catch (err: any) {
        return {
          id: `#${i + 1}`,
          name: 'Test threw an exception',
          passed: false,
          expected: 'No runtime exception',
          actual: `FAIL: ${err?.message ?? err}`,
        };
      }
    });

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
   * Case A: 標準對接測試 (Ladder straight 600×150 PORT_B → Elbow 90° PORT_A from the same profile)
   */
  public static testCaseA(): TestCaseResult {
    const s = createComponentFromProfile('TRAY_STRAIGHT', LADDER(), {}, 'inst_straight');
    const e = createComponentFromProfile('FITTING_ELBOW_90', LADDER(), {}, 'inst_elbow');
    const val = ConnectionValidator.validateConnection(s, 'PORT_B', e, 'PORT_A');
    const passed = val.valid && val.code === 'OK';
    return result(
      'Case A',
      '標準對接測試 (Standard Mating Compatibility)',
      passed,
      'Ladder 600W×150H straight ↔ elbow 90° validates OK',
      'PASS (相容通過, 600W x 150H TRAY_END, LADDER ↔ LADDER)',
      `${val.code} ${val.error ?? ''}`,
      val
    );
  }

  /**
   * Case B: 尺寸不符攔截 (Straight 600 → Elbow 450)
   */
  public static testCaseB(): TestCaseResult {
    const s = new ComponentInstance('inst_straight', ComponentRegistry.get('TRAY_STRAIGHT')!, { width: 600, depth: 100 });
    const e = new ComponentInstance('inst_elbow', ComponentRegistry.get('FITTING_ELBOW_90')!, { width: 450, depth: 100 });
    const val = ConnectionValidator.validateConnection(s, 'PORT_B', e, 'PORT_A');
    const passed = !val.valid && val.code === 'WIDTH_MISMATCH';
    return result('Case B', '尺寸不符攔截 (Dimension Mismatch Interception)', passed, 'FAIL with WIDTH_MISMATCH', `PASS (成功攔截: ${val.error})`, val.code, val);
  }

  /**
   * Case C: 深度不符攔截 (Straight 600×100 → Elbow 600×150)
   */
  public static testCaseC(): TestCaseResult {
    const s = new ComponentInstance('inst_straight', ComponentRegistry.get('TRAY_STRAIGHT')!, { width: 600, depth: 100 });
    const e = new ComponentInstance('inst_elbow', ComponentRegistry.get('FITTING_ELBOW_90')!, { width: 600, depth: 150 });
    const val = ConnectionValidator.validateConnection(s, 'PORT_B', e, 'PORT_A');
    const passed = !val.valid && val.code === 'DEPTH_MISMATCH';
    return result('Case C', '深度不符攔截 (Depth Mismatch Interception)', passed, 'FAIL with DEPTH_MISMATCH (100 != 150)', `PASS (成功攔截: ${val.error})`, val.code, val);
  }

  /**
   * Case D: 連接類型 / 托架型式不符攔截 (Tray End → Gland; Ladder → Ventilated)
   */
  public static testCaseD(): TestCaseResult {
    const s = new ComponentInstance('inst_straight', ComponentRegistry.get('TRAY_STRAIGHT')!);
    const jb = new ComponentInstance('inst_jb', ComponentRegistry.get('EQUIP_JUNCTION_BOX')!);
    const val = ConnectionValidator.validateConnection(s, 'PORT_B', jb, 'PORT_BOTTOM_GLAND');
    const ladder = new ComponentInstance('l', ComponentRegistry.get('TRAY_STRAIGHT')!, { width: 300, depth: 100, trayStyle: 'LADDER' });
    const vent = new ComponentInstance('v', ComponentRegistry.get('FITTING_ELBOW_90')!, { width: 300, depth: 100, trayStyle: 'VENTILATED_THROUGH' });
    const valStyle = ConnectionValidator.validateConnection(ladder, 'PORT_B', vent, 'PORT_A');
    const passed = !val.valid && val.code === 'TYPE_MISMATCH' && !valStyle.valid && valStyle.code === 'STYLE_MISMATCH';
    return result(
      'Case D',
      '連接類型與托架型式不符攔截 (Type & Tray-Style Mismatch Interception)',
      passed,
      'TRAY_END vs GLAND → TYPE_MISMATCH; LADDER vs VENTILATED (same W×H) → STYLE_MISMATCH',
      'PASS (TYPE_MISMATCH 與 STYLE_MISMATCH 皆正確攔截)',
      `${val.code} / ${valStyle.code}`,
      { val, valStyle }
    );
  }

  /**
   * Case E: 異徑對接成功 (Ladder 600 → Reducer 600→300 → Ladder 300)
   */
  public static testCaseE(): TestCaseResult {
    const s600 = createComponentFromProfile('TRAY_STRAIGHT', LADDER(), { width: 600 }, 's600');
    const red = createComponentFromProfile('FITTING_REDUCER_LEFT', LADDER(), { inletWidth: 600, outletWidth: 300 }, 'red');
    const s300 = createComponentFromProfile('TRAY_STRAIGHT', LADDER(), { width: 300 }, 's300');
    const val1 = ConnectionValidator.validateConnection(s600, 'PORT_B', red, 'PORT_A');
    const val2 = ConnectionValidator.validateConnection(red, 'PORT_B', s300, 'PORT_A');
    const passed = val1.valid && val2.valid;
    return result(
      'Case E',
      '異徑轉接成功 (Reducer Transition Compatibility)',
      passed,
      '600 inlet and 300 outlet both validate',
      'PASS (600mm ➔ 左偏異徑 ➔ 300mm 雙向對接相容)',
      `In=${val1.code}, Out=${val2.code}`,
      { val1, val2 }
    );
  }

  /**
   * Case F: Mate 放置數值正確性
   */
  public static testCaseF(): TestCaseResult {
    const def = ComponentRegistry.get('TRAY_STRAIGHT')!;
    const a = new ComponentInstance('instA', def, { length: 3000 });
    const b = new ComponentInstance('instB', def, { length: 3000 });
    const mate = MateEngine.computeMateTransform(a, 'PORT_B', b, 'PORT_A');
    b.setPlacement(mate.placement);
    const pa = a.getWorldPorts().find((p) => p.id === 'PORT_B')!;
    const pb = b.getWorldPorts().find((p) => p.id === 'PORT_A')!;
    const d = Transforms.distance(pa.worldPosition, pb.worldPosition);
    const dirDot = Transforms.dot(pa.worldDirection, pb.worldDirection);
    const upDot = Transforms.dot(pa.worldUp, pb.worldUp);
    const passed = d <= 0.001 && Math.abs(dirDot + 1) <= 0.001 && Math.abs(upDot - 1) <= 0.001 && Math.abs((mate.upDotProduct ?? 0) - 1) <= 1e-6;
    return result(
      'Case F',
      '自動對接幾何放置驗證 (Mate Placement Spatial Invariants)',
      passed,
      'Distance <= 0.001mm, direction dot -1, up dot +1 (also reported by MateEngine)',
      `PASS (Dist=${d.toFixed(4)}mm, DirDot=${dirDot.toFixed(3)}, UpDot=${upDot.toFixed(3)})`,
      `Dist=${d}, DirDot=${dirDot}, UpDot=${upDot}`,
      { d, dirDot, upDot, mate }
    );
  }

  /**
   * Case G: 鏈式放置累積誤差 (10 × 3 m straights → 30 m)
   */
  public static testCaseG(): TestCaseResult {
    const def = ComponentRegistry.get('TRAY_STRAIGHT')!;
    const inst: ComponentInstance[] = [];
    const first = new ComponentInstance('tray_0', def, { length: 3000 });
    first.setPlacement({ position: [0, 0, 1500], quaternion: [0, 0, 0, 1] });
    inst.push(first);
    for (let i = 1; i < 10; i++) {
      const c = new ComponentInstance(`tray_${i}`, def, { length: 3000 });
      c.setPlacement(MateEngine.computePlacement(inst[i - 1], 'PORT_B', c, 'PORT_A'));
      inst.push(c);
    }
    const end = inst[9].getWorldPorts().find((p) => p.id === 'PORT_B')!.worldPosition;
    const err = Math.max(Math.abs(end[0]), Math.abs(end[1]), Math.abs(end[2] - 30000));
    const passed = err <= 0.01;
    return result(
      'Case G',
      '鏈式對接累積誤差 (Chain Mating Cumulative Error Across 10 Segments)',
      passed,
      'Cumulative position error <= 0.01mm after 10 mated 3m segments',
      `PASS (終端 Z=${end[2].toFixed(4)}mm, 累積誤差=${err.toExponential(2)}mm)`,
      `error ${err}`,
      { end, err }
    );
  }

  /**
   * Case H: JSON 匯出
   */
  public static testCaseH(): TestCaseResult {
    const json = JsonExporter.exportDefinition(ComponentRegistry.get('FITTING_ELBOW_90')!);
    const passed =
      json.schemaVersion === '2.0.0' &&
      json.ports.length === 2 &&
      json.centerlines.length === 1 &&
      !!json.bounds?.min &&
      !!json.bounds?.max &&
      !!json.ports[0].connectionFace;
    return result(
      'Case H',
      'JSON 結構序列化確效 (JSON Export Structure Compliance)',
      passed,
      'schemaVersion 2.0.0 with ports (incl. connectionFace), centerlines and bounds',
      `PASS (Schema 2.0.0, ${json.ports.length} 埠位含連接面, ${json.centerlines.length} 中心線)`,
      'Missing schema attributes',
      json
    );
  }

  /**
   * Case I: 4 × 90° elbows (catalog 125 mm tangents) close a loop.
   */
  public static testCaseI(): TestCaseResult {
    const elbows = [0, 1, 2, 3].map((i) => createComponentFromProfile('FITTING_ELBOW_90', LADDER(), {}, `e${i}`));
    for (let i = 1; i < 4; i++) elbows[i].setPlacement(MateEngine.computePlacement(elbows[i - 1], 'PORT_B', elbows[i], 'PORT_A'));
    const start = elbows[0].getWorldPorts().find((p) => p.id === 'PORT_A')!;
    const end = elbows[3].getWorldPorts().find((p) => p.id === 'PORT_B')!;
    const gap = Transforms.distance(start.worldPosition, end.worldPosition);
    const dirDot = Transforms.dot(start.worldDirection, end.worldDirection);
    const passed = gap <= 0.05 && Math.abs(dirDot + 1) < 1e-6;
    return result(
      'Case I',
      '迴轉環路封閉精確度 (Closed Loop 4×90° Elbow with 125mm Tangents)',
      passed,
      'Closure gap <= 0.05mm and closing ports face each other',
      `PASS (閉合間隙 Gap=${gap.toExponential(2)}mm)`,
      `gap ${gap}, dirDot ${dirDot}`,
      { gap }
    );
  }

  /**
   * Case J: 避讓包絡體計算
   */
  public static testCaseJ(): TestCaseResult {
    const b = ComponentRegistry.get('OBSTACLE_MAIN_PROCESS_PIPE')!.getBounds({ diameterMm: 500, lengthMm: 6000, clearanceMm: 150 });
    const r = b.clearanceEnvelope ? b.clearanceEnvelope.max[1] : 0;
    const passed = !!b.clearanceEnvelope && r === 400;
    return result('Case J', '避讓包絡體動態計算 (Obstacle Clearance Envelope Computation)', passed, 'Envelope radius 400mm (R250 + 150)', `PASS (淨空包絡半徑 = ${r}mm)`, `got ${r}`, b);
  }

  /**
   * Case K: 通用型錄規格邊界檢查 (generic NEMA-style presets)
   */
  public static testCaseK(): TestCaseResult {
    const std = CatalogStandards.checkConformance({ width: 600 });
    const non = CatalogStandards.checkConformance({ width: 550 });
    const passed = std.isStandard && !non.isStandard && non.warnings.length > 0;
    return result('Case K', '工程型錄規範檢核 (Catalog Standards & Presets Conformance)', passed, '600 standard, 550 flagged', `PASS (550mm 警示: "${non.warnings[0]}")`, 'unexpected', { std, non });
  }

  /**
   * Case L: 解析中心線長度 (generic pure arc and catalog arc + tangents)
   */
  public static testCaseL(): TestCaseResult {
    const s = ComponentRegistry.get('TRAY_STRAIGHT')!.getCenterlineRoutes({ length: 3000 })[0];
    // Generic: R 300 inner + W/2 300 = 600 centerline, no tangents (legacy numbers).
    const e90 = ComponentRegistry.get('FITTING_ELBOW_90')!.getCenterlineRoutes({ radius: 300, width: 600, angleDeg: 90, tangentLength: 0 })[0];
    const e45 = ComponentRegistry.get('FITTING_ELBOW_45')!.getCenterlineRoutes({ radius: 300, width: 600, angleDeg: 45, tangentLength: 0 })[0];
    // Catalog: R 300, W 600, T 125.
    const e90t = ComponentRegistry.get('FITTING_ELBOW_90')!.getCenterlineRoutes({ radius: 300, width: 600, tangentLength: 125 })[0];
    const errs = [
      Math.abs(s.analyticLength - 3000),
      Math.abs(e90.analyticLength - (600 * Math.PI) / 2),
      Math.abs(e45.analyticLength - (600 * Math.PI) / 4),
      Math.abs(e90t.analyticLength - AnalyticLength.arcWithTangents(600, 90, 125)),
    ];
    // Polyline of samples must converge to the analytic length.
    let poly = 0;
    for (let i = 1; i < e90t.samplePoints.length; i++) poly += Transforms.distance(e90t.samplePoints[i - 1], e90t.samplePoints[i]);
    const maxErr = Math.max(...errs);
    const passed = maxErr <= 0.001 && Math.abs(poly - e90t.analyticLength) < 1.0;
    return result(
      'Case L',
      '解析中心線長度精確度 (Analytic Centerline Length Formula Validation)',
      passed,
      'Straight 3000; E90 942.478; E45 471.239; E90+2×125 tangents 1192.478; sampled polyline within 1mm',
      `PASS (E90=${e90.analyticLength.toFixed(3)}, E45=${e45.analyticLength.toFixed(3)}, E90+T=${e90t.analyticLength.toFixed(3)}mm)`,
      `errors ${errs.join(', ')}; poly ${poly}`,
      { errs, poly }
    );
  }

  /**
   * Case M: Assembly BOM 驗證 (Double-counting fixture) + one BOM line per size
   */
  public static testCaseM(): TestCaseResult {
    const bay = new ComponentInstance('bay_01', ComponentRegistry.get('STRUCT_MAIN_BAY')!);
    const col = ComponentRegistry.get('STRUCT_COLUMN')!;
    const c1 = new ComponentInstance('bay_01_col1', col, {}, {}, 'bay_01');
    const c2 = new ComponentInstance('bay_01_col2', col, {}, {}, 'bay_01');
    const sep = new ComponentInstance('separate_col_01', col);
    const all = [bay, c1, c2, sep];
    const filtered = BomManager.generateBom(all, { filterBundledChildren: true });
    const unfiltered = BomManager.generateBom(all, { filterBundledChildren: false });
    const kit = filtered.items.some((it) => it.definitionId === 'STRUCT_MAIN_BAY' && it.isAssemblyKit);
    const colF = filtered.items.find((it) => it.definitionId === 'STRUCT_COLUMN');
    const colU = unfiltered.items.find((it) => it.definitionId === 'STRUCT_COLUMN');
    const excluded = filtered.excludedBundledItems.includes('bay_01_col1') && filtered.excludedBundledItems.includes('bay_01_col2');

    // Two elbow sizes must be two BOM lines with their own specs.
    const eA = createComponentFromProfile('FITTING_ELBOW_90', LADDER(), { radius: 300 }, 'eA');
    const eB = createComponentFromProfile('FITTING_ELBOW_90', LADDER(), { radius: 600 }, 'eB');
    const eC = createComponentFromProfile('FITTING_ELBOW_90', LADDER(), { radius: 600 }, 'eC');
    const elbowBom = BomManager.generateBom([eA, eB, eC]);
    const perSize = elbowBom.items.length === 2 && elbowBom.items.some((it) => it.quantity === 2 && it.spec.includes('R=600mm'));

    const passed = kit && excluded && colF?.quantity === 1 && !filtered.hasDoubleCounting && unfiltered.hasDoubleCounting && colU?.quantity === 3 && perSize;
    return result(
      'Case M',
      '組合件材料清單不重複計價 (Assembly BOM Zero Double-Counting & Per-Size Lines)',
      passed,
      'Kit excludes bundled columns; double counting detected when unfiltered; different fitting sizes are separate lines',
      'PASS (套件排除 2 根內部立柱, 獨立立柱計 1 支, R300/R600 彎頭分列 BOM)',
      `cols=${colF?.quantity}/${colU?.quantity}, perSize=${perSize}`,
      { filtered, unfiltered, elbowBom }
    );
  }

  /**
   * Case N: 視覺回歸確效 (deterministic baseline of 8 legacy-ID models)
   */
  public static testCaseN(): TestCaseResult {
    const camera = new THREE.PerspectiveCamera(45, 800 / 600, 0.1, 100);
    camera.position.set(2.6, 2.0, 3.0);
    camera.lookAt(0, 0, 0);
    camera.updateMatrixWorld(true);
    camera.updateProjectionMatrix();

    let totalDeltas = 0;
    const comparisons: any[] = [];
    Object.keys(LEGACY_FITTING_BASELINES).forEach((id) => {
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
          if (geo.index) triangleCount += geo.index.count / 3;
          else if (geo.attributes?.position) triangleCount += geo.attributes.position.count / 3;
          if (geo.attributes?.position) vertexCount += geo.attributes.position.count;
        }
      });
      const center = new THREE.Vector3();
      box.getCenter(center);
      const proj = center.clone().project(camera);
      const bounds = [box.min.x, box.min.y, box.min.z, box.max.x, box.max.y, box.max.z].map((v) => +v.toFixed(4));
      const centroid = [+proj.x.toFixed(4), +proj.y.toFixed(4)];
      const vDelta = Math.abs(vertexCount - baseline.vertexCount);
      const tDelta = Math.abs(triangleCount - baseline.triangleCount);
      const mDelta = Math.abs(mesh.children.length - baseline.childMeshCount);
      const bDelta = bounds.reduce((m, v, i) => Math.max(m, Math.abs(v - baseline.bounds[i])), 0);
      const cDelta = Math.max(Math.abs(centroid[0] - baseline.projectedCentroid[0]), Math.abs(centroid[1] - baseline.projectedCentroid[1]));
      const d = vDelta + tDelta + mDelta + (bDelta > 0.005 ? 1 : 0) + (cDelta > 0.005 ? 1 : 0);
      totalDeltas += d;
      comparisons.push({
        id,
        baseline,
        actual: { childMeshCount: mesh.children.length, vertexCount, triangleCount, bounds, projectedCentroid: centroid },
        deltas: { vDelta, tDelta, mDelta, bDelta, cDelta },
        match: d === 0,
      });
    });
    const passed = totalDeltas === 0;
    return result(
      'Case N',
      '既有配件視覺回歸比對 (Deterministic Baseline Regression of 8 Models)',
      passed,
      '8 legacy-ID models match the recorded vertex / triangle / bounds / projection signature',
      'PASS (8/8 模型與幾何基準吻合, 0 unexpected difference)',
      `${totalDeltas} unexpected deltas`,
      comparisons
    );
  }

  /**
   * Case O: 通用角度單一真實來源 (Generic angle 37.5°)
   */
  public static testCaseO(): TestCaseResult {
    const angle = 37.5;
    const R = 300;
    const W = 600;
    const Rc = R + W / 2;
    const inst = new ComponentInstance('inst_custom_angle', ComponentRegistry.get('FITTING_ELBOW_90')!, { angleDeg: angle, radius: R, width: W, tangentLength: 0 });
    const ports = inst.getWorldPorts();
    const a = ports.find((p) => p.id === 'PORT_A')!;
    const b = ports.find((p) => p.id === 'PORT_B')!;
    const cl = inst.getCenterlines()[0];
    const rad = (angle * Math.PI) / 180;
    const portErr = Math.hypot(b.worldPosition[0] - Rc * Math.cos(rad), b.worldPosition[2] + Rc * Math.sin(rad));
    const clErr = Math.max(Transforms.distance(cl.samplePoints[0], a.worldPosition), Transforms.distance(cl.samplePoints[cl.samplePoints.length - 1], b.worldPosition));
    const lenErr = Math.abs(cl.analyticLength - Rc * rad);
    const box = new THREE.Box3().setFromObject(inst.getThreeMesh());
    const geoOk = box.min.z < -0.2 && box.max.z <= 0.001;
    const conf = CatalogStandards.checkConformance({ angleDeg: angle });
    const warns = !conf.isStandard && conf.warnings.some((w) => w.includes('Non-standard'));
    const passed = portErr < 0.01 && clErr < 0.01 && lenErr < 0.01 && geoOk && warns;
    return result(
      'Case O',
      '通用角度單一真實來源 (Generic Angle 37.5° Ports, Route & Geometry SOT)',
      passed,
      'angleDeg 37.5° drives Port B, centerline end points, length and geometry from Rc = R + W/2',
      `PASS (37.5°: Port B=[${b.worldPosition[0].toFixed(1)}, ${b.worldPosition[2].toFixed(1)}]mm, Length=${cl.analyticLength.toFixed(2)}mm)`,
      `portErr=${portErr}, clErr=${clErr}, lenErr=${lenErr}, geo=${geoOk}, warns=${warns}`,
      { portErr, clErr, lenErr, conf }
    );
  }

  /**
   * Case P: 參數連動一致性 (R 300 → 600, angle 45 → 90)
   */
  public static testCaseP(): TestCaseResult {
    const inst = new ComponentInstance('inst_consistency', ComponentRegistry.get('FITTING_ELBOW_90')!, { radius: 300, angleDeg: 45, width: 600, tangentLength: 0 });
    const len1 = inst.getCenterlines()[0].analyticLength;
    const x1 = inst.getWorldPorts().find((p) => p.id === 'PORT_A')!.worldPosition[0];
    inst.updateParameters({ radius: 600, angleDeg: 90 });
    const len2 = inst.getCenterlines()[0].analyticLength;
    const x2 = inst.getWorldPorts().find((p) => p.id === 'PORT_A')!.worldPosition[0];
    const b2 = inst.getBounds();
    const geo = new THREE.Box3().setFromObject(inst.getThreeMesh());
    const passed =
      Math.abs(len2 - (900 * Math.PI) / 2) < 0.001 &&
      Math.abs(x2 - 900) < 1e-9 &&
      Math.abs(b2.max[0] - (600 + 600 + 13)) < 1e-6 &&
      Math.abs(geo.max.x * 1000 - b2.max[0]) < 0.05 &&
      len1 !== len2 &&
      x1 !== x2;
    return result(
      'Case P',
      '參數連動單一資料源一致性 (Single Source of Truth Consistency Across Derivatives)',
      passed,
      'R 300→600 & 45°→90° updates ports (Rc 600→900), length, bounds and mesh together',
      `PASS (Length ${len1.toFixed(1)} ➔ ${len2.toFixed(1)}mm, PortX ${x1} ➔ ${x2}mm, mesh maxX ${(geo.max.x * 1000).toFixed(2)}mm)`,
      `len2=${len2}, x2=${x2}, bounds=${b2.max[0]}`,
      { len1, len2, x1, x2, b2 }
    );
  }

  /**
   * Case Q: Centerline ↔ Port endpoint invariant (all components, all variants)
   */
  public static testCaseQ_CenterlinePortEndpoints(): TestCaseResult {
    let checked = 0;
    let maxError = 0;
    const failures: any[] = [];
    ComponentRegistry.getAll().forEach((def) => {
      const variants = trayFamilyOf(def.id) === 'OTHER' ? [{ label: 'DEFAULT', params: def.defaultParameters }] : variantsOf(def);
      variants.forEach(({ label, params }) => {
        const ports = new Map(def.getLocalPorts(params).map((p) => [p.id, p]));
        def.getCenterlineRoutes(params).forEach((r) => {
          checked++;
          const from = ports.get(r.fromPort);
          const to = ports.get(r.toPort);
          if (!from || !to) {
            failures.push({ id: def.id, label, route: r.id, error: 'Port not found' });
            return;
          }
          const e = Math.max(dist(r.samplePoints[0], from.localPosition), dist(r.samplePoints[r.samplePoints.length - 1], to.localPosition));
          maxError = Math.max(maxError, e);
          if (e > 0.01) failures.push({ id: def.id, label, route: r.id, e });
        });
      });
    });
    const passed = failures.length === 0 && checked >= 60;
    return result(
      'Case Q',
      '中心線與埠位端點精確重合不變量 (Centerline ↔ Port Endpoint Invariant)',
      passed,
      'Every route starts at fromPort and ends at toPort within 0.01mm (generic + every catalog profile)',
      `PASS (已驗證 ${checked} 條路由, 最大端點誤差 = ${maxError.toExponential(2)}mm)`,
      `${failures.length} violations`,
      { checked, maxError, failures }
    );
  }

  /**
   * Case R: Bounds ↔ Geometry consistency (every tray component × variant + structural set)
   */
  public static testCaseR_BoundsConsistency(): TestCaseResult {
    const failures: any[] = [];
    let maxError = 0;
    let checked = 0;
    const check = (id: string, label: string, def: ComponentDefinition, params: Record<string, any>) => {
      checked++;
      const e = maxBoundsError(def.getBounds(params), computeGeometryBounds(def, params));
      maxError = Math.max(maxError, e);
      if (e > 0.05) failures.push({ id, label, e });
    };
    trayDefinitions().forEach((def) => variantsOf(def).forEach((v) => check(def.id, v.label, def, v.params)));
    ['STRUCT_COLUMN', 'STRUCT_PIER', 'STRUCT_MAIN_BAY', 'STRUCT_BRANCH_BAY'].forEach((id) => {
      const def = ComponentRegistry.get(id)!;
      check(id, 'DEFAULT', def, def.defaultParameters);
    });
    const passed = failures.length === 0 && checked >= 40;
    return result(
      'Case R',
      '構件包絡邊界與實體幾何一致性 (Bounds ↔ Geometry Consistency Invariant)',
      passed,
      'getBounds() equals THREE.Box3 of the body mesh within 0.05mm for every tray component and profile',
      `PASS (已比對 ${checked} 組構件/規格之 6 軸包絡, 最大誤差 = ${maxError.toExponential(2)}mm)`,
      `${failures.length} inconsistencies (max ${maxError.toFixed(3)}mm)`,
      { checked, maxError, failures }
    );
  }

  /**
   * Case S: Port frame handedness (right-handed orthonormal basis, det = +1)
   */
  public static testCaseS_PortFrameHandedness(): TestCaseResult {
    let count = 0;
    const failures: any[] = [];
    ComponentRegistry.getAll().forEach((def) => {
      def.getLocalPorts(def.defaultParameters).forEach((p) => {
        count++;
        const det = new PortFrame(p.localPosition, p.localDirection, p.localUp).getDeterminant();
        if (Math.abs(det - 1) > 0.001 || Math.abs(Transforms.dot(p.localDirection, p.localUp)) > 1e-9) failures.push({ id: def.id, port: p.id, det });
      });
    });
    const passed = failures.length === 0 && count > 40;
    return result(
      'Case S',
      '埠位局部座標系右手正交規範 (Port Frame Right-Handed Orthonormal Invariant)',
      passed,
      'All port frames: direction ⟂ up and det(right, up, direction) = +1',
      `PASS (全庫 ${count} 個埠位右手正交 det = 1.00000)`,
      `${failures.length} inverted / skewed frames`,
      { count, failures }
    );
  }

  /**
   * Case T: Reducer physical centerline length (generic linear taper and catalog 200+200+200)
   */
  public static testCaseT_EccentricReducerLength(): TestCaseResult {
    const left = ComponentRegistry.get('FITTING_REDUCER_LEFT')!;
    const center = ComponentRegistry.get('FITTING_REDUCER_CENTER')!;
    const gLeft = left.getCenterlineRoutes({ inletWidth: 600, outletWidth: 450, length: 500, tangentLength: 0 })[0];
    const gCenter = center.getCenterlineRoutes({ inletWidth: 600, outletWidth: 450, length: 500, tangentLength: 0 })[0];
    const vLeft = left.getCenterlineRoutes({ inletWidth: 600, outletWidth: 300, length: 600, tangentLength: 200 })[0];
    const errs = [
      Math.abs(gLeft.analyticLength - Math.hypot(500, 75)),
      Math.abs(gCenter.analyticLength - 500),
      Math.abs(vLeft.analyticLength - AnalyticLength.reducerWithTangents(600, 150, 200, 200)),
      Math.abs(vLeft.analyticLength - 650),
    ];
    const passed = Math.max(...errs) < 0.001;
    return result(
      'Case T',
      '異徑接頭物理中心線長度 (Reducer Physical Centerline Length)',
      passed,
      'Generic 600→450 L500: √(500²+75²)=505.594; catalog 600→300: 200 + √(200²+150²) + 200 = 650',
      `PASS (通用左偏 = ${gLeft.analyticLength.toFixed(3)}mm, 型錄左偏 = ${vLeft.analyticLength.toFixed(3)}mm)`,
      `errors ${errs.join(', ')}`,
      { gLeft, vLeft }
    );
  }

  /**
   * Case U: Tee branch centerline (catalog p.9): straight + concentric R+W/2 arc + straight.
   */
  public static testCaseU_TeePhysicalCenterline(): TestCaseResult {
    const W = 600;
    const R = 300;
    const T = 125;
    const Rc = R + W / 2;
    const routes = ComponentRegistry.get('FITTING_TEE')!.getCenterlineRoutes({ width: W, radius: R, tangentLength: T, depth: 150 });
    const ac = routes.find((r) => r.id === 'ROUTE_A_C')!;
    const expected = AnalyticLength.teeBranch(W + 2 * R + 2 * T, W / 2 + R + T, Rc);
    // Arc samples must lie on the circle of radius Rc about the corner centre (−(W/2+R), W/2+R).
    const cx = -(W / 2 + R);
    const cz = W / 2 + R;
    const arcPts = ac.samplePoints.filter((p) => p[0] > cx + 1e-6 && p[2] < cz - 1e-6);
    const arcErr = arcPts.reduce((m, p) => Math.max(m, Math.abs(Math.hypot(p[0] - cx, p[2] - cz) - Rc)), 0);
    let poly = 0;
    for (let i = 1; i < ac.samplePoints.length; i++) poly += Transforms.distance(ac.samplePoints[i - 1], ac.samplePoints[i]);
    const passed = Math.abs(ac.analyticLength - expected) < 0.001 && Math.abs(expected - (250 + (Math.PI / 2) * Rc)) < 1e-9 && arcPts.length >= 10 && arcErr < 1e-6 && Math.abs(poly - expected) < 1;
    return result(
      'Case U',
      '三通實體過渡中心線曲線 (Tee Curved Branch Centerline, PDF p.9)',
      passed,
      'ROUTE_A_C = 125 + (π/2)(R + W/2) + 125, arc concentric with the curved front rail',
      `PASS (分流中心線 = ${ac.analyticLength.toFixed(2)}mm, ${arcPts.length} 點位於 R+W/2=${Rc}mm 圓弧)`,
      `len ${ac.analyticLength} vs ${expected}, arcErr ${arcErr}, arcPts ${arcPts.length}`,
      { expected, arcErr, poly }
    );
  }

  /**
   * Case V: Derived state export snapshot
   */
  public static testCaseV_DerivedStateExport(): TestCaseResult {
    const inst = createComponentFromProfile('TRAY_STRAIGHT', LADDER(), {}, 'test_export_inst');
    const ex = JsonExporter.exportScene([inst]).instances[0];
    const passed = ex.derivedSnapshot?.status === 'NON_CANONICAL_SNAPSHOT' && !!ex.effectiveParameters && !!ex.placement && ex.effectiveParameters.profileId === 'LADDER_PROFILE_STANDARD';
    return result(
      'Case V',
      '衍生狀態匯出標記不變量 (Derived State Export Non-Canonical Snapshot)',
      passed,
      'worldPorts under derivedSnapshot (NON_CANONICAL_SNAPSHOT); effectiveParameters carry the profile id',
      'PASS (effectiveParameters + placement 為 SOT, 含 profileId 追溯)',
      'Export structure violated',
      ex
    );
  }

  /**
   * Case W: Ventilated profile A (PDF p.27–37) — every catalog component, joints physically valid.
   */
  public static testCaseW_CatalogProfileA(): TestCaseResult {
    const p = VENT_A();
    const issues: string[] = [];
    p.components.forEach((c) => {
      const inst = createComponentFromProfile(c.definitionId, p, {}, `a_${c.definitionId}`);
      const e = inst.effectiveParameters;
      if (e.width !== 100 || e.depth !== 50 || e.trayStyle !== 'VENTILATED_THROUGH') issues.push(`${c.definitionId} params`);
      if (trayFamilyOf(c.definitionId) !== 'STRAIGHT' && (e.radius !== 300 || e.tangentLength !== 125)) issues.push(`${c.definitionId} R/T`);
      inst.getWorldPorts().forEach((port) => {
        if (port.depth !== 50 || port.connectionFace?.halfWidth !== 50) issues.push(`${c.definitionId}.${port.id} face`);
      });
    });
    const asm = buildMatedAssembly(
      [{ definitionId: 'TRAY_STRAIGHT' }, { definitionId: 'FITTING_ELBOW_45' }, { definitionId: 'TRAY_STRAIGHT' }, { definitionId: 'FITTING_TEE' }],
      { profile: p }
    );
    if (!asm.passed) issues.push(...asm.issues);
    const noCross = !TraySystemProfiles.supports(p, 'FITTING_CROSS') && !TraySystemProfiles.supports(p, 'FITTING_REDUCER_CENTER');
    if (!noCross) issues.push('Profile A must not offer cross / reducers (not in PDF p.29 index)');
    const passed = issues.length === 0;
    return result(
      'Case W',
      '型錄規格 A 沖底型 100W×50H (Ventilated Profile A, PDF p.27–37)',
      passed,
      'All 6 catalog components inherit 100W × 50H, R300, T125, VENTILATED; S→E45→S→Tee joints physically valid',
      `PASS (6 構件繼承正確, ${asm.joints.length} 個接頭實體對接通過)`,
      issues.join('; '),
      { issues }
    );
  }

  /**
   * Case X: Ventilated profile B (PDF p.38–47)
   */
  public static testCaseX_CatalogProfileB(): TestCaseResult {
    const p = VENT_B();
    const issues: string[] = [];
    p.components.forEach((c) => {
      const inst = createComponentFromProfile(c.definitionId, p, {}, `b_${c.definitionId}`);
      const e = inst.effectiveParameters;
      if (e.width !== 300 || e.depth !== 100 || e.trayStyle !== 'VENTILATED_THROUGH') issues.push(`${c.definitionId} params`);
    });
    const asm = buildMatedAssembly(
      [
        { definitionId: 'TRAY_STRAIGHT' },
        { definitionId: 'FITTING_ELBOW_30' },
        { definitionId: 'TRAY_STRAIGHT' },
        { definitionId: 'FITTING_RISER_OUT_90' },
        { definitionId: 'TRAY_STRAIGHT' },
      ],
      { profile: p }
    );
    if (!asm.passed) issues.push(...asm.issues);
    if (TraySystemProfiles.supports(p, 'FITTING_TEE')) issues.push('Profile B must not offer a tee (not in PDF p.40 index)');
    if (JSON.stringify(p.allowedHorizontalAngles) !== '[30,90]' || JSON.stringify(p.allowedVerticalAngles) !== '[90]') issues.push('angles');
    const passed = issues.length === 0;
    return result(
      'Case X',
      '型錄規格 B 沖底型 300W×100H (Ventilated Profile B, PDF p.38–47)',
      passed,
      'All 5 catalog components inherit 300W × 100H; S→E30→S→VO90→S joints physically valid; no tee',
      `PASS (5 構件繼承正確, ${asm.joints.length} 個接頭實體對接通過)`,
      issues.join('; '),
      { issues }
    );
  }

  /**
   * Case Y: Horizontal cross (PDF p.10): ports, 6 routes, catalog spans, radius-driven curved corners.
   */
  public static testCaseY_HorizontalCross(): TestCaseResult {
    const def = ComponentRegistry.get('FITTING_CROSS')!;
    const issues: string[] = [];
    [300, 600].forEach((R) => {
      const params = resolveProfileParameters('FITTING_CROSS', LADDER(), { radius: R });
      const inst = new ComponentInstance(`cross_${R}`, def, params);
      const ports = inst.getWorldPorts();
      const routes = inst.getCenterlines();
      const half = 300 + R + 125;
      if (ports.length !== 4) issues.push(`R${R}: ${ports.length} ports`);
      if (routes.length !== 6) issues.push(`R${R}: ${routes.length} routes`);
      const expectPos: Record<string, V3> = { PORT_A: [-half, 0, 0], PORT_B: [half, 0, 0], PORT_C: [0, 0, half], PORT_D: [0, 0, -half] };
      ports.forEach((p) => {
        if (dist(p.worldPosition, expectPos[p.id]) > 1e-6) issues.push(`R${R}: ${p.id} at ${p.worldPosition}`);
      });
      const turn = 250 + (Math.PI / 2) * (R + 300);
      routes.forEach((r) => {
        const exp = r.type === 'STRAIGHT' ? 2 * half : turn;
        if (Math.abs(r.analyticLength - exp) > 1e-6) issues.push(`R${R}: ${r.id} length ${r.analyticLength}`);
      });
      const pairs = new Set(routes.map((r) => `${r.fromPort}-${r.toPort}`));
      ['PORT_A-PORT_B', 'PORT_D-PORT_C', 'PORT_A-PORT_C', 'PORT_A-PORT_D', 'PORT_B-PORT_C', 'PORT_B-PORT_D'].forEach((k) => {
        if (!pairs.has(k)) issues.push(`R${R}: missing route ${k}`);
      });
      const verts = bodyVertices(inst.getThreeMesh());
      const c = 300 + R;
      [
        [-1, 1, 270],
        [1, 1, 180],
        [1, -1, 90],
        [-1, -1, 0],
      ].forEach(([sx, sz, start]) => {
        const ev = arcEvidence(verts, [sx * c, sz * c], R - 13, start, 90);
        if (ev.found !== ev.tested) issues.push(`R${R}: corner (${sx},${sz}) arc evidence ${ev.found}/${ev.tested}`);
      });
    });
    const passed = issues.length === 0;
    return result(
      'Case Y',
      '水平四通十字托架 (Horizontal Cross, PDF p.10)',
      passed,
      '4 ports at ±(W/2+R+125); routes A↔B, D↔C straight and A↔C, A↔D, B↔C, B↔D = 250 + π/2(R+W/2); 4 curved radius-R corners on the mesh; R300 and R600',
      'PASS (四通 4 埠位、6 路由、四角圓弧轉角與型錄尺寸全數吻合, R300 / R600)',
      issues.join('; '),
      { issues }
    );
  }

  /**
   * Case Z: every catalog angle (30/45/60/90) for horizontal and vertical bends with 125 tangents
   */
  public static testCaseZ_CatalogAngles(): TestCaseResult {
    const W = 600;
    const H = 150;
    const R = 300;
    const T = 125;
    const failures: any[] = [];
    [30, 45, 60, 90].forEach((ang) => {
      const rad = (ang * Math.PI) / 180;
      const h = createComponentFromProfile(`FITTING_ELBOW_${ang}`, LADDER(), {}, `h${ang}`);
      const hb = h.getWorldPorts().find((p) => p.id === 'PORT_B')!;
      const Rc = R + W / 2;
      const expH: V3 = [Rc * Math.cos(rad) - T * Math.sin(rad), 0, -Rc * Math.sin(rad) - T * Math.cos(rad)];
      if (dist(hb.worldPosition, expH) > 1e-6 || Math.abs(h.getCenterlines()[0].analyticLength - (2 * T + Rc * rad)) > 1e-6) failures.push({ ang, kind: 'H' });

      const vi = createComponentFromProfile(`FITTING_RISER_IN_${ang}`, LADDER(), {}, `vi${ang}`);
      const vib = vi.getWorldPorts().find((p) => p.id === 'PORT_B')!;
      const Rv = R + H / 2;
      const expVI: V3 = [Rv * Math.sin(rad) + T * Math.cos(rad), -Rv * Math.cos(rad) + T * Math.sin(rad), 0];
      if (dist(vib.worldPosition, expVI) > 1e-6 || dist(vib.worldDirection, [Math.cos(rad), Math.sin(rad), 0]) > 1e-9) failures.push({ ang, kind: 'VI', got: vib.worldPosition, expVI });

      const vo = createComponentFromProfile(`FITTING_RISER_OUT_${ang}`, LADDER(), {}, `vo${ang}`);
      const vob = vo.getWorldPorts().find((p) => p.id === 'PORT_B')!;
      const expVO: V3 = [Rv * Math.sin(rad) + T * Math.cos(rad), Rv * Math.cos(rad) - T * Math.sin(rad), 0];
      if (dist(vob.worldPosition, expVO) > 1e-6 || dist(vob.worldDirection, [Math.cos(rad), -Math.sin(rad), 0]) > 1e-9) failures.push({ ang, kind: 'VO', got: vob.worldPosition, expVO });
    });
    const passed = failures.length === 0;
    return result(
      'Case Z',
      '型錄全角度彎頭 (Catalog Angles 30/45/60/90°: Horizontal, Vertical Inside & Outside)',
      passed,
      '12 catalog bends: outlet port = arc end + 125 tangent, Rc = R + W/2 (horizontal) or R + H/2 (vertical)',
      'PASS (水平/垂直上升/垂直下降 × 30°/45°/60°/90° 共 12 組埠位與長度精確)',
      `${failures.length} bends failed`,
      { failures }
    );
  }

  /**
   * Case AA: Vendor dimension formulas checked on LIBRARY OUTPUT (not constants).
   */
  public static testCaseAA_VendorDimensionFormulas(): TestCaseResult {
    const issues: string[] = [];
    // Ladder overall width W + 26 read from the straight tray bounds for every catalog width.
    LADDER().allowedWidths.forEach((W) => {
      const b = createComponentFromProfile('TRAY_STRAIGHT', LADDER(), { width: W }, `w${W}`).getBounds();
      if (Math.abs(b.max[0] - b.min[0] - (W + 26)) > 1e-6) issues.push(`ladder W${W} overall ${b.max[0] - b.min[0]}`);
    });
    // Ventilated: W is the outer width.
    [VENT_A(), VENT_B()].forEach((p) => {
      const b = createComponentFromProfile('TRAY_STRAIGHT', p, {}, `v${p.id}`).getBounds();
      if (Math.abs(b.max[0] - b.min[0] - p.width) > 1e-6) issues.push(`${p.id} overall ${b.max[0] - b.min[0]}`);
      if (p.coverWidth !== p.width + 6) issues.push(`${p.id} cover`);
    });
    if (LADDER().overallWidth !== LADDER().width + 26 || LADDER().coverWidth !== LADDER().width + 38) issues.push('ladder profile cover/overall');
    // Tee & cross spans for every radius.
    LADDER().allowedRadii.forEach((R) => {
      const tee = ComponentRegistry.get('FITTING_TEE')!.getEngineeringDimensions!(resolveProfileParameters('FITTING_TEE', LADDER(), { radius: R }));
      if (tee.mainSpan !== 600 + 2 * R + 250 || tee.branchFromBackRail !== 600 + R + 125) issues.push(`tee R${R}`);
      const cross = ComponentRegistry.get('FITTING_CROSS')!.getEngineeringDimensions!(resolveProfileParameters('FITTING_CROSS', LADDER(), { radius: R }));
      if (cross.span !== 600 + 2 * R + 250) issues.push(`cross R${R}`);
    });
    // Reducer three stages 200 + 200 + 200 = 600.
    const red = ComponentRegistry.get('FITTING_REDUCER_CENTER')!.getEngineeringDimensions!(resolveProfileParameters('FITTING_REDUCER_CENTER', LADDER()));
    if (red.length !== 600 || red.tangentLength !== 200 || red.transitionLength !== 200) issues.push('reducer stages');
    // Straight rung layout 125 + 250k (12 rungs on 3000).
    const layout = straightLayout(resolveProfileParameters('TRAY_STRAIGHT', LADDER()));
    const zs = layout.rungs.map((r) => r.position[2] + 1500);
    if (zs.length !== 12 || Math.abs(zs[0] - 125) > 1e-9 || Math.abs(zs[11] - 2875) > 1e-9) issues.push(`rungs ${zs.length}`);
    const passed = issues.length === 0;
    return result(
      'Case AA',
      '型錄工程尺寸公式確效 (Vendor Dimension Formulas on Library Output)',
      passed,
      'Ladder overall W+26 (all 10 widths), ventilated W+0 / cover W+6, tee W+2R+250 & W+R+125, cross W+2R+250, reducer 200+200+200, rungs 125+250k',
      'PASS (由函式庫實際輸出驗證全部型錄公式)',
      issues.join('; '),
      { issues }
    );
  }

  /**
   * Case AB: Profile data vs the catalog tables (hand-entered catalog facts).
   */
  public static testCaseAB_ProfileCatalogIntegrity(): TestCaseResult {
    const issues: string[] = [];
    const l = LADDER();
    const a = VENT_A();
    const b = VENT_B();
    const eq = (x: any, y: any, what: string) => {
      if (JSON.stringify(x) !== JSON.stringify(y)) issues.push(`${what}: ${JSON.stringify(x)} != ${JSON.stringify(y)}`);
    };
    // Ladder: p.4–21 tables
    eq(l.height, 150, 'ladder H');
    eq(l.allowedWidths, [100, 200, 300, 400, 500, 600, 700, 800, 900, 1000], 'ladder W');
    eq(l.allowedRadii, [300, 600, 900], 'ladder R');
    eq(l.allowedHorizontalAngles, [30, 45, 60, 90], 'ladder H angles');
    eq(l.allowedVerticalAngles, [30, 45, 60, 90], 'ladder V angles');
    eq([l.standardLength, l.tangentLength, l.reducerLength, l.reducerTangentLength, l.rungSpacingMm], [3000, 125, 600, 200, 250], 'ladder L/T/reducer/rung');
    eq(l.source.pages[l.source.pages.length - 1], 26, 'ladder last page');
    // Ventilated A: p.30–35
    eq([a.width, a.height, a.allowedRadii, a.allowedHorizontalAngles, a.allowedVerticalAngles], [100, 50, [300], [45, 90], [90]], 'vent A');
    eq([a.material.startsWith('ALUMINUM_6063_T5'), a.fittingMaterial.startsWith('ALUMINUM_5052_H32')], [true, true], 'vent A materials');
    // Ventilated B: p.41–45
    eq([b.width, b.height, b.allowedRadii, b.allowedHorizontalAngles, b.allowedVerticalAngles], [300, 100, [300], [30, 90], [90]], 'vent B');
    // Every listed component exists and cites pages inside the profile.
    TraySystemProfiles.getAll().forEach((p) => {
      p.components.forEach((c) => {
        if (!ComponentRegistry.get(c.definitionId)) issues.push(`${p.id}: unknown ${c.definitionId}`);
        c.pages.forEach((pg) => {
          if (!p.source.pages.includes(pg)) issues.push(`${p.id}: ${c.definitionId} page ${pg} outside profile`);
        });
      });
    });
    // Ventilated series availability matches the PDF index pages (p.29, p.40).
    eq(a.components.map((c) => c.definitionId).sort(), ['FITTING_ELBOW_45', 'FITTING_ELBOW_90', 'FITTING_RISER_IN_90', 'FITTING_RISER_OUT_90', 'FITTING_TEE', 'TRAY_STRAIGHT'], 'vent A components');
    eq(b.components.map((c) => c.definitionId).sort(), ['FITTING_ELBOW_30', 'FITTING_ELBOW_90', 'FITTING_RISER_IN_90', 'FITTING_RISER_OUT_90', 'TRAY_STRAIGHT'], 'vent B components');
    const passed = issues.length === 0;
    return result(
      'Case AB',
      '規格集與型錄表格一致性 (Profile Data vs Catalog Tables)',
      passed,
      'Ladder H150 / W100–1000 / R300,600,900 / 30–90°; Vent A 100×50 R300 H45,90 V90; Vent B 300×100 R300 H30,90 V90; component lists = PDF index pages',
      'PASS (3 組規格集之 W/H/R/角度/材質/頁碼與型錄一致)',
      issues.join('; '),
      { issues }
    );
  }

  /**
   * Case AC: Golden fixtures from the vendor PDF (ports, route lengths, bounds, dimensions).
   */
  public static testCaseAC_GoldenFixtures(): TestCaseResult {
    const failures: any[] = [];
    VENDOR_GOLDEN_FIXTURES.forEach((fx) => {
      const profile = TraySystemProfiles.get(fx.profileId)!;
      const inst = createComponentFromProfile(fx.definitionId, profile, fx.params, `fx_${fx.id}`);
      const ports = inst.getWorldPorts();
      fx.expectedPorts.forEach((ep) => {
        const p = ports.find((x) => x.id === ep.id);
        if (!p) return failures.push({ fx: fx.id, port: ep.id, error: 'missing' });
        if (dist(p.worldPosition, ep.position) > 0.01) failures.push({ fx: fx.id, port: ep.id, position: p.worldPosition, expected: ep.position });
        if (dist(p.worldDirection, ep.direction) > 1e-6) failures.push({ fx: fx.id, port: ep.id, direction: p.worldDirection, expected: ep.direction });
        if (ep.up && dist(p.worldUp, ep.up) > 1e-6) failures.push({ fx: fx.id, port: ep.id, up: p.worldUp, expected: ep.up });
        if (ep.width !== undefined && p.width !== ep.width) failures.push({ fx: fx.id, port: ep.id, width: p.width });
      });
      const routes = inst.getCenterlines();
      Object.entries(fx.expectedRouteLengths).forEach(([rid, len]) => {
        const r = routes.find((x) => x.id === rid);
        if (!r || Math.abs(r.analyticLength - len) > 0.01) failures.push({ fx: fx.id, route: rid, got: r?.analyticLength, expected: len });
      });
      if (fx.expectedBounds) {
        const e = maxBoundsError(inst.getBounds() as any, fx.expectedBounds);
        const g = maxBoundsError(computeGeometryBounds(inst.definition, inst.effectiveParameters) as any, fx.expectedBounds);
        if (e > 0.01 || g > 0.05) failures.push({ fx: fx.id, boundsErr: e, geometryErr: g, bounds: inst.getBounds() });
      }
      if (fx.expectedDims) {
        const dims = inst.definition.getEngineeringDimensions!(inst.effectiveParameters);
        Object.entries(fx.expectedDims).forEach(([k, v]) => {
          if (Math.abs(Number(dims[k]) - v) > 1e-6) failures.push({ fx: fx.id, dim: k, got: dims[k], expected: v });
        });
      }
    });
    const passed = failures.length === 0;
    return result(
      'Case AC',
      '型錄黃金樣本 (Vendor Catalog Golden Fixtures)',
      passed,
      `${VENDOR_GOLDEN_FIXTURES.length} fixtures from PDF p.4–45: ports, directions, up vectors, route lengths, bounds (analytic & mesh), dimensions`,
      `PASS (${VENDOR_GOLDEN_FIXTURES.length} 組型錄黃金樣本全數吻合)`,
      `${failures.length} mismatches`,
      { failures }
    );
  }

  /**
   * Case AD: Tee (PDF p.9) must have visibly curved transitions — checked on the mesh.
   */
  public static testCaseAD_TeeCurvedTransition(): TestCaseResult {
    const issues: string[] = [];
    const cases: Array<{ profile: TraySystemProfile; W: number; R: number; overhang: number }> = [
      { profile: LADDER(), W: 600, R: 300, overhang: 13 },
      { profile: LADDER(), W: 300, R: 600, overhang: 13 },
      { profile: VENT_A(), W: 100, R: 300, overhang: 0 },
    ];
    cases.forEach(({ profile, W, R, overhang }) => {
      const inst = createComponentFromProfile('FITTING_TEE', profile, { width: W, radius: R }, `tee_${W}_${R}`);
      const verts = bodyVertices(inst.getThreeMesh());
      const c = W / 2 + R;
      const left = arcEvidence(verts, [-c, c], R - overhang, 270, 90);
      const right = arcEvidence(verts, [c, c], R - overhang, 180, 90);
      if (left.found !== left.tested || right.found !== right.tested) issues.push(`${profile.id} W${W} R${R}: arc evidence L${left.found}/R${right.found}`);
    });
    // Negative control: a square junction made of straight boxes has no arc.
    const square = new THREE.Group();
    const box = (sx: number, sz: number, x: number, z: number) => {
      const m = new THREE.Mesh(new THREE.BoxGeometry(sx / 1000, 0.15, sz / 1000));
      m.position.set(x / 1000, 0, z / 1000);
      square.add(m);
    };
    box(1450, 30, 0, -300);
    box(425, 30, -512.5, 300);
    box(425, 30, 512.5, 300);
    box(30, 425, -300, 512.5);
    box(30, 425, 300, 512.5);
    const neg = arcEvidence(bodyVertices(square), [-600, 600], 287, 270, 90);
    if (neg.found > 1) issues.push(`square-junction control produced ${neg.found} arc hits`);
    const passed = issues.length === 0;
    return result(
      'Case AD',
      '三通曲線過渡實體幾何 (Tee Curved Transition on the Mesh, PDF p.9)',
      passed,
      'Both front rails carry vertices on the radius-R arc at 5 angles (ladder 600/R300, 300/R600, ventilated 100/R300); a square junction fails the same probe',
      'PASS (三通兩側前緣均為 R 圓弧過渡, 方形直角接頭對照組正確不通過)',
      issues.join('; '),
      { issues, negativeControl: neg }
    );
  }

  /**
   * Case AE: Cross (PDF p.10) curved corners in all four quadrants, both tray styles.
   */
  public static testCaseAE_CrossCurvedCorners(): TestCaseResult {
    const issues: string[] = [];
    [
      { W: 600, R: 300, style: 'LADDER', overhang: 13 },
      { W: 600, R: 900, style: 'LADDER', overhang: 13 },
      { W: 300, R: 300, style: 'VENTILATED_THROUGH', overhang: 0 },
    ].forEach(({ W, R, style, overhang }) => {
      const inst = new ComponentInstance('x', ComponentRegistry.get('FITTING_CROSS')!, { width: W, radius: R, depth: 150, tangentLength: 125, trayStyle: style });
      const verts = bodyVertices(inst.getThreeMesh());
      const c = W / 2 + R;
      const quadrants: Array<[number, number, number]> = [
        [-1, 1, 270],
        [1, 1, 180],
        [1, -1, 90],
        [-1, -1, 0],
      ];
      quadrants.forEach(([sx, sz, start]) => {
        const ev = arcEvidence(verts, [sx * c, sz * c], R - overhang, start, 90);
        if (ev.found !== ev.tested) issues.push(`${style} W${W} R${R} (${sx},${sz}) ${ev.found}/${ev.tested}`);
      });
      // No body material in the middle of each corner cut-out (inside the arc).
      const cut = verts.filter((v) => {
        return quadrants.some(([sx, sz]) => Math.hypot(v[0] - sx * c, v[2] - sz * c) < R - overhang - 1);
      });
      if (cut.length > 0) issues.push(`${style} W${W} R${R}: ${cut.length} vertices inside corner cut-outs`);
    });
    const passed = issues.length === 0;
    return result(
      'Case AE',
      '四通四角曲線轉角實體幾何 (Cross Curved Corners on the Mesh, PDF p.10)',
      passed,
      'Every quadrant has a radius-R curved corner rail and an empty corner cut-out (ladder R300 / R900, ventilated)',
      'PASS (四通 4 象限圓弧轉角, 轉角內無實體)',
      issues.join('; '),
      { issues }
    );
  }

  /**
   * Case AF: Profile propagation — H=150 (and W, R, T, style) reach every ladder component.
   */
  public static testCaseAF_ProfilePropagation(): TestCaseResult {
    const issues: string[] = [];
    TraySystemProfiles.getAll().forEach((profile) => {
      profile.components.forEach((c) => {
        const inst = createComponentFromProfile(c.definitionId, profile, {}, `pp_${profile.id}_${c.definitionId}`);
        const b = inst.getBounds();
        if (Math.abs(b.min[1] + profile.height / 2) > 1e-6 && trayFamilyOf(c.definitionId) !== 'V_BEND') issues.push(`${profile.id}/${c.definitionId}: height ${b.max[1] - b.min[1]}`);
        inst.getWorldPorts().forEach((p) => {
          if (p.depth !== profile.height) issues.push(`${profile.id}/${c.definitionId}.${p.id}: depth ${p.depth}`);
          if (p.connectionFace?.style !== profile.trayType) issues.push(`${profile.id}/${c.definitionId}.${p.id}: style`);
        });
        const cats = getComponentSystemCategories(c.definitionId);
        const expectCat = profile.trayType === 'LADDER' ? 'SYSTEM_LADDER' : profile.width === 100 ? 'SYSTEM_VENTILATED_SMALL' : 'SYSTEM_VENTILATED_LARGE';
        if (!cats.includes(expectCat as any)) issues.push(`${c.definitionId} not classified in ${expectCat}`);
      });
    });
    // Generic defaults are clearly generic (no vendor-verified provenance on definitions).
    trayDefinitions().forEach((d) => {
      Object.entries(d.provenance).forEach(([k, pv]) => {
        if (pv.assumptionLevel === 'VERIFIED_VENDOR_CATALOG') issues.push(`${d.id}.${k} claims VERIFIED on a generic default`);
      });
    });
    // Vertical bend heights: section H is radial, check port depth instead (done above) and radial extent.
    const vi = createComponentFromProfile('FITTING_RISER_IN_90', LADDER(), {}, 'vi_h');
    const dims = vi.definition.getEngineeringDimensions!(vi.effectiveParameters);
    if (Number(dims.outerRadius) - Number(dims.innerRadius) !== 150) issues.push('VI90 radial height');
    const passed = issues.length === 0;
    return result(
      'Case AF',
      '規格集參數傳遞 (Profile Propagation: W / H=150 / R / T / Style to Every Component)',
      passed,
      'Every catalog component of every profile carries the profile H, style and face; classification derived from profiles; no VERIFIED claims on generic defaults',
      'PASS (H=150 等規格集參數完整傳遞至全部梯型構件)',
      issues.join('; '),
      { issues }
    );
  }

  /**
   * Case AG: Radius semantics — catalog R → centerline radius → outer radius, measured on geometry.
   */
  public static testCaseAG_RadiusSemantics(): TestCaseResult {
    const issues: string[] = [];
    // Horizontal: inner rail flange edge at R − 13, outer at R + W + 13 (radial, in plan).
    const h = createComponentFromProfile('FITTING_ELBOW_90', LADDER(), { width: 600, radius: 600, tangentLength: 0 }, 'h');
    const hv = bodyVertices(h.getThreeMesh());
    const hr = hv.map((v) => Math.hypot(v[0], v[2]));
    if (Math.abs(Math.min(...hr) - (600 - 13)) > 0.05 || Math.abs(Math.max(...hr) - (600 + 600 + 13)) > 0.05) issues.push(`H radial ${Math.min(...hr)}..${Math.max(...hr)}`);
    if (Math.abs(h.getWorldPorts()[0].worldPosition[0] - 900) > 1e-9) issues.push('H port at Rc');
    // Vertical inside: tray body radial extent [R, R + H] in XY; bottom (rungs) on the outer side.
    const vi = createComponentFromProfile('FITTING_RISER_IN_90', LADDER(), { radius: 300, tangentLength: 0 }, 'vi');
    const viv = bodyVertices(vi.getThreeMesh()).map((v) => Math.hypot(v[0], v[1]));
    if (Math.abs(Math.min(...viv) - 300) > 0.05 || Math.abs(Math.max(...viv) - 450) > 0.05) issues.push(`VI radial ${Math.min(...viv)}..${Math.max(...viv)}`);
    const rungRadii = (inst: ComponentInstance) => {
      const g = new THREE.Group();
      g.add((inst.getThreeMesh().getObjectByName('Rungs') as THREE.Mesh).clone());
      return bodyVertices(g).map((v) => Math.hypot(v[0], v[1]));
    };
    const rungR = rungRadii(vi);
    if (Math.min(...rungR) < 400) issues.push(`VI rungs not on the outer (bottom) side: min r ${Math.min(...rungR)}`);
    // Vertical outside: rungs on the inner (bottom) side.
    const vo = createComponentFromProfile('FITTING_RISER_OUT_90', LADDER(), { radius: 300, tangentLength: 0 }, 'vo');
    const voR = rungRadii(vo);
    if (Math.max(...voR) > 350) issues.push(`VO rungs not on the inner (bottom) side: max r ${Math.max(...voR)}`);
    // Every module reads the same derived radius.
    const d = h.definition.getEngineeringDimensions!(h.effectiveParameters);
    if (d.catalogRadius !== 600 || d.centerlineRadius !== 900 || d.outerRailRadius !== 1200) issues.push('dims');
    const route = h.getCenterlines()[0];
    const routeR = route.samplePoints.map((p) => Math.hypot(p[0], p[2]));
    if (routeR.some((r) => Math.abs(r - 900) > 1e-6)) issues.push('route radius');
    // Migration aid: legacy centerline radius semantics reproduce the legacy port positions.
    const legacy = new ComponentInstance('legacy', ComponentRegistry.get('FITTING_ELBOW_90')!, { width: 600, radius: 600, radiusReference: 'CENTERLINE', tangentLength: 0 });
    const lp = legacy.getWorldPorts();
    if (dist(lp[0].worldPosition, [600, 0, 0]) > 1e-9 || dist(lp[1].worldPosition, [0, 0, -600]) > 1e-9) issues.push('radiusReference CENTERLINE');
    const legacyV = new ComponentInstance('legacyV', ComponentRegistry.get('FITTING_RISER_OUT_90')!, { depth: 100, radius: 600, radiusReference: 'CENTERLINE', tangentLength: 0 });
    if (Number(legacyV.definition.getEngineeringDimensions!(legacyV.effectiveParameters).centerlineRadius) !== 600) issues.push('radiusReference CENTERLINE (vertical)');
    const passed = issues.length === 0;
    return result(
      'Case AG',
      '彎曲半徑語意單一推導 (Radius Semantics: Catalog R → Centerline → Outer)',
      passed,
      'H-bend: rail geometry R−13…R+W+13, route & port at R+W/2; VI: body R…R+H, rungs outside; VO: rungs inside',
      'PASS (型錄 R = 內側半徑, 中心線半徑 R+W/2 或 R+H/2, 幾何/埠位/路由/尺寸一致)',
      issues.join('; '),
      { issues }
    );
  }

  /**
   * Case AH: Geometry terminates exactly on every TRAY_END port plane with the declared face.
   */
  public static testCaseAH_ConnectionFaceTermination(): TestCaseResult {
    const failures: any[] = [];
    let checked = 0;
    trayDefinitions().forEach((def) => {
      variantsOf(def).forEach(({ label, params }) => {
        [params, { ...params, tangentLength: 0 }].forEach((p) => {
          const inst = new ComponentInstance(`t_${def.id}`, def, p);
          // A reducer with tangentLength 0 tapers right at its ports (legacy linear taper). The body
          // is cut by the port plane (no protrusion), but the ladder flange footprint on the plane
          // widens by overhang·(1/cos φ − 1): an exact, expected deviation — use straight ends to mate.
          let expectedFace = 0;
          if (trayFamilyOf(def.id) === 'REDUCER' && Number(p.tangentLength) === 0) {
            const d = def.getEngineeringDimensions!(p);
            const w1 = Number(d.inletWidth);
            const w2 = Number(d.outletWidth);
            const dx = d.reducerType === 'CONCENTRIC' ? Math.abs(w1 - w2) / 2 : Math.abs(w1 - w2);
            const overhang = d.style === 'LADDER' ? 13 : 0;
            expectedFace = overhang * (1 / Math.cos(Math.atan2(dx, Number(d.length))) - 1);
          }
          AssemblyValidator.checkPortTermination(inst).forEach((r) => {
            checked++;
            const ok = Math.abs(r.planeOffsetMm) <= 0.05 && Math.abs(r.faceMismatchMm - expectedFace) <= 0.05;
            if (!ok) failures.push({ id: def.id, label, T: p.tangentLength, port: r.portId, offset: r.planeOffsetMm, face: r.faceMismatchMm, expectedFace });
          });
        });
      });
    });
    // Accessories (splice plates) do not count as body.
    const s = new ComponentInstance('sp', ComponentRegistry.get('TRAY_STRAIGHT')!, { hasSplicePlates: true });
    const spOk = AssemblyValidator.checkPortTermination(s).every((r) => r.passed);
    if (!spOk) failures.push({ id: 'TRAY_STRAIGHT', label: 'splice plates', error: 'accessory counted as body' });
    const passed = failures.length === 0 && checked >= 80;
    return result(
      'Case AH',
      '幾何終止於連接面 (Body Terminates on Every Connection Plane)',
      passed,
      'For every tray component × profile × tangent (0 / catalog): no body past the port plane, no recess, face = declared envelope',
      `PASS (${checked} 個埠位連接面全數精確終止)`,
      `${failures.length} ports failed`,
      { checked, failures }
    );
  }

  /**
   * Case AI: Physical assembly regression — the 12 mating scenarios.
   */
  public static testCaseAI_AssemblyRegression(): TestCaseResult {
    const scenarios: Array<{ name: string; steps: AssemblyStep[] }> = [
      { name: 'Straight → Straight', steps: [{ definitionId: 'TRAY_STRAIGHT' }, { definitionId: 'TRAY_STRAIGHT' }] },
      { name: 'Straight → H90', steps: [{ definitionId: 'TRAY_STRAIGHT' }, { definitionId: 'FITTING_ELBOW_90' }] },
      { name: 'Straight → H45', steps: [{ definitionId: 'TRAY_STRAIGHT' }, { definitionId: 'FITTING_ELBOW_45' }] },
      { name: 'Straight → H60', steps: [{ definitionId: 'TRAY_STRAIGHT' }, { definitionId: 'FITTING_ELBOW_60' }] },
      { name: 'Straight → H30', steps: [{ definitionId: 'TRAY_STRAIGHT' }, { definitionId: 'FITTING_ELBOW_30' }] },
      { name: 'Straight → Vertical Inside', steps: [{ definitionId: 'TRAY_STRAIGHT' }, { definitionId: 'FITTING_RISER_IN_90' }] },
      { name: 'Straight → Vertical Outside', steps: [{ definitionId: 'TRAY_STRAIGHT' }, { definitionId: 'FITTING_RISER_OUT_90' }] },
      { name: 'Straight → Tee main (A)', steps: [{ definitionId: 'TRAY_STRAIGHT' }, { definitionId: 'FITTING_TEE', port: 'PORT_A' }] },
      { name: 'Straight → Tee branch (C)', steps: [{ definitionId: 'TRAY_STRAIGHT' }, { definitionId: 'FITTING_TEE', port: 'PORT_C' }] },
      ...['PORT_A', 'PORT_B', 'PORT_C', 'PORT_D'].map((port) => ({
        name: `Straight → Cross ${port}`,
        steps: [{ definitionId: 'TRAY_STRAIGHT' }, { definitionId: 'FITTING_CROSS', port }] as AssemblyStep[],
      })),
      {
        name: 'Straight → Reducer (L/C/R)',
        steps: [
          { definitionId: 'TRAY_STRAIGHT', overrides: { width: 600 } },
          { definitionId: 'FITTING_REDUCER_LEFT', overrides: { inletWidth: 600, outletWidth: 300 } },
          { definitionId: 'TRAY_STRAIGHT', overrides: { width: 300 } },
          { definitionId: 'FITTING_REDUCER_CENTER', overrides: { inletWidth: 300, outletWidth: 200 } },
          { definitionId: 'TRAY_STRAIGHT', overrides: { width: 200 } },
          { definitionId: 'FITTING_REDUCER_RIGHT', overrides: { inletWidth: 200, outletWidth: 100 } },
        ],
      },
      {
        name: 'Multi-component chain',
        steps: [
          { definitionId: 'TRAY_STRAIGHT' },
          { definitionId: 'FITTING_ELBOW_45' },
          { definitionId: 'FITTING_ELBOW_45' },
          { definitionId: 'TRAY_STRAIGHT' },
          { definitionId: 'FITTING_RISER_IN_60' },
          { definitionId: 'FITTING_RISER_OUT_60' },
          { definitionId: 'FITTING_ELBOW_30' },
          { definitionId: 'FITTING_ELBOW_60' },
          { definitionId: 'TRAY_STRAIGHT' },
          { definitionId: 'FITTING_TEE' },
          { definitionId: 'FITTING_CROSS', attachTo: 9, attachPort: 'PORT_C' },
          { definitionId: 'TRAY_STRAIGHT', attachTo: 10, attachPort: 'PORT_D' },
        ],
      },
    ];
    const failures: any[] = [];
    let joints = 0;
    let maxPen = 0;
    // Steps without explicit overrides are sized to width W (straights shortened to 1500 mm).
    const sized = (s: AssemblyStep, W: number): AssemblyStep => {
      if (s.overrides) return s;
      if (s.definitionId === 'TRAY_STRAIGHT') return { ...s, overrides: { width: W, length: 1500 } };
      return { ...s, overrides: { width: W } };
    };
    scenarios.forEach((sc) => {
      [300, 600].forEach((W) => {
        const steps = sc.steps.map((s) => sized(s, W));
        const asm = buildMatedAssembly(steps, { profile: LADDER() });
        joints += asm.joints.length;
        asm.joints.forEach((j) => (maxPen = Math.max(maxPen, j.planeOffsetAMm, j.planeOffsetBMm)));
        if (!asm.passed) failures.push({ scenario: sc.name, W, issues: asm.issues });
      });
    });
    const passed = failures.length === 0 && joints >= 50;
    return result(
      'Case AI',
      '實體裝配回歸 (Physical Assembly Regression: 12 Mating Scenarios)',
      passed,
      'Each joint: ConnectionValidator PASS, ports coincide, directions opposite, up aligned, no body past the joint plane, no gap, identical faces, continuous centerline (W300 & W600)',
      `PASS (${joints} 個接頭全部通過, 最大穿越量 ${Math.max(0, maxPen).toExponential(2)}mm)`,
      `${failures.length} scenarios failed`,
      { failures, joints }
    );
  }

  /**
   * Case AJ: Negative controls — the assembly checks must catch overlap, gap, rotation and size errors.
   */
  public static testCaseAJ_NegativeControls(): TestCaseResult {
    const issues: string[] = [];
    const S = ComponentRegistry.get('TRAY_STRAIGHT')!;
    const base = () => createComponentFromProfile('TRAY_STRAIGHT', LADDER(), {}, 'nc_a');

    // 1) Body overhang past the port (legacy splice-plate / end-rung defect): ports pulled 60 mm inside the body.
    const overhangDef: ComponentDefinition = {
      ...S,
      id: 'NC_OVERHANG',
      getLocalPorts: (p) =>
        S.getLocalPorts(p).map((port) => ({
          ...port,
          localPosition: [port.localPosition[0], port.localPosition[1], port.localPosition[2] - Math.sign(port.localPosition[2]) * 60] as V3,
        })),
    };
    {
      const a = base();
      const b = new ComponentInstance('nc_b', overhangDef, resolveProfileParameters('TRAY_STRAIGHT', LADDER()));
      MateEngine.placeComponentByPort(a, 'PORT_B', b, 'PORT_A');
      const j = AssemblyValidator.checkJoint(a, 'PORT_B', b, 'PORT_A');
      if (j.passed || Math.abs(j.planeOffsetBMm - 60) > 0.05) issues.push(`overhang not detected (${j.planeOffsetBMm})`);
    }
    // 2) Mate shifted 30 mm into the neighbour → penetration; 3) shifted 20 mm away → gap.
    [
      { shift: -30, expect: 30, label: 'penetration' },
      { shift: 20, expect: -20, label: 'gap' },
    ].forEach(({ shift, expect, label }) => {
      const a = base();
      const b = createComponentFromProfile('TRAY_STRAIGHT', LADDER(), {}, 'nc_b');
      const pl = MateEngine.computePlacement(a, 'PORT_B', b, 'PORT_A');
      b.setPlacement({ ...pl, position: [pl.position[0], pl.position[1], pl.position[2] + shift] });
      const j = AssemblyValidator.checkJoint(a, 'PORT_B', b, 'PORT_A');
      if (j.passed || Math.abs(j.planeOffsetBMm - expect) > 0.05) issues.push(`${label} not detected (${j.planeOffsetBMm})`);
    });
    // 4) Part rotated 90° about the joint axis (legacy riser up-vector defect) → face / up mismatch.
    {
      const a = base();
      const b = createComponentFromProfile('FITTING_RISER_IN_90', LADDER(), {}, 'nc_r');
      const pl = MateEngine.computePlacement(a, 'PORT_B', b, 'PORT_A');
      // Rotate the correctly mated riser by 90° about the joint axis (world Z through the joint point).
      const joint = a.getWorldPorts().find((p) => p.id === 'PORT_B')!.worldPosition;
      const rot = Transforms.fromAxisAngle([0, 0, 1], Math.PI / 2);
      const q = Transforms.quaternionMultiply(rot, pl.quaternion);
      const rel = Transforms.transformPoint(
        [pl.position[0] - joint[0], pl.position[1] - joint[1], pl.position[2] - joint[2]],
        { position: [0, 0, 0], quaternion: rot }
      );
      b.setPlacement({ position: [joint[0] + rel[0], joint[1] + rel[1], joint[2] + rel[2]], quaternion: q });
      const j = AssemblyValidator.checkJoint(a, 'PORT_B', b, 'PORT_A');
      if (j.passed || j.upDot > 0.5 || j.faceMismatchMm < 10) issues.push(`rotation not detected (up ${j.upDot}, face ${j.faceMismatchMm})`);
    }
    // 5) Width mismatch is rejected by the connection validator inside the joint check.
    {
      const a = base();
      const b = createComponentFromProfile('TRAY_STRAIGHT', LADDER(), { width: 300 }, 'nc_w');
      MateEngine.placeComponentByPort(a, 'PORT_B', b, 'PORT_A');
      const j = AssemblyValidator.checkJoint(a, 'PORT_B', b, 'PORT_A');
      if (j.passed || j.connection.code !== 'WIDTH_MISMATCH') issues.push('width mismatch not rejected');
    }
    const passed = issues.length === 0;
    return result(
      'Case AJ',
      '對照組：檢測器必須抓到錯誤 (Negative Controls: Overlap / Gap / Rotation / Size)',
      passed,
      '60mm overhang, 30mm penetration, 20mm gap, 90° rotated part and width mismatch are all reported as failures',
      'PASS (5 組刻意錯誤全部被裝配檢測器攔截)',
      issues.join('; '),
      { issues }
    );
  }

  /**
   * Case AK: Assembly demos (viewer) — joints valid and end positions equal the hand-derived layout.
   */
  public static testCaseAK_AssemblyDemos(): TestCaseResult {
    const issues: string[] = [];
    const L = LADDER(); // W600, H150, R300 → Rc 600 (H) / 375 (V), T125
    const run = (key: string) => {
      const r = buildMatedAssembly(ASSEMBLY_DEMOS[key].steps, { profile: L });
      if (!r.passed) issues.push(`${key}: ${r.issues.join(' | ')}`);
      return r.instances;
    };
    const port = (inst: ComponentInstance, id: string) => inst.getWorldPorts().find((p) => p.id === id)!;
    const expectAt = (label: string, got: V3, exp: V3) => {
      if (dist(got, exp) > 0.01) issues.push(`${label}: ${got.map((v) => v.toFixed(2))} != ${exp}`);
    };

    // ELBOW_TEE_CHAIN: S(2000) → E90 (left turn) → S(2000) → Tee → S on B and on C.
    const et = run('ELBOW_TEE_CHAIN');
    expectAt('E90 outlet', port(et[1], 'PORT_B').worldPosition, [725, 0, 1725]);
    expectAt('Tee centre-branch C', port(et[3], 'PORT_C').worldPosition, [3450, 0, 2450]);
    expectAt('Main run end', port(et[4], 'PORT_B').worldPosition, [6175, 0, 1725]);
    expectAt('Branch run end', port(et[5], 'PORT_B').worldPosition, [3450, 0, 4450]);

    // CROSS_CHAIN: C to the traveller's right (−X), D to the left (+X).
    const cr = run('CROSS_CHAIN');
    expectAt('Cross B run end', port(cr[2], 'PORT_B').worldPosition, [0, 0, 4450]);
    expectAt('Cross C run end', port(cr[3], 'PORT_B').worldPosition, [-2725, 0, 1725]);
    expectAt('Cross D run end', port(cr[4], 'PORT_B').worldPosition, [2725, 0, 1725]);

    // VERTICAL_OFFSET: rise = (375+125) + 1500 + (375+125) = 2500; advance 500 + 500.
    const vo = run('VERTICAL_OFFSET');
    const endPort = port(vo[4], 'PORT_B');
    expectAt('Vertical offset end', endPort.worldPosition, [0, 2500, 4000]);
    if (dist(endPort.worldUp, [0, 1, 0]) > 1e-9) issues.push('final tray not upright');

    // REDUCER_CHAIN: left reducer keeps the left (+X) rail straight → outlet centre +150.
    const rc = run('REDUCER_CHAIN');
    expectAt('Reducer outlet', port(rc[1], 'PORT_B').worldPosition, [150, 0, 1600]);
    expectAt('300 run end', port(rc[2], 'PORT_B').worldPosition, [150, 0, 3600]);

    const passed = issues.length === 0;
    return result(
      'Case AK',
      '裝配示範與手算位置 (Assembly Demos vs Hand-Derived Layout)',
      passed,
      'Elbow→Tee chain, Cross chain, vertical offset (rise 2500) and reducer chain: all joints valid, end points equal hand calculation',
      'PASS (4 組裝配示範接頭全部通過, 端點座標與手算一致)',
      issues.join('; '),
      { issues }
    );
  }
}
