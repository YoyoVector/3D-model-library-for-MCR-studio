/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import * as THREE from 'three';
import {
  AssumptionLevel,
  ComponentOrigin,
  ComponentRole,
  type ComponentDefinition,
  type ConnectionPortDefinition,
  type CenterlineRouteDefinition,
  type ComponentBoundsDefinition,
} from '../core/Schema.ts';
import { RouteGenerator } from '../centerline/Route.ts';
import { AnalyticLength } from '../centerline/AnalyticLength.ts';
import { GeometryGenerators } from '../geometry/Generators.ts';

/**
 * Single Canonical Component Registry for MCR-Studio.
 * Contains definitions for all 32 components across the 4 origin classifications.
 */
export class ComponentRegistry {
  private static _definitions: Map<string, ComponentDefinition> = new Map();

  /**
   * Initializes and registers all 32 components.
   */
  public static getAll(): ComponentDefinition[] {
    if (this._definitions.size === 0) {
      this.initAll();
    }
    return Array.from(this._definitions.values());
  }

  public static get(id: string): ComponentDefinition | undefined {
    if (this._definitions.size === 0) {
      this.initAll();
    }
    return this._definitions.get(id);
  }

  private static register(def: ComponentDefinition): void {
    this._definitions.set(def.id, def);
  }

  private static initAll(): void {
    // -------------------------------------------------------------
    // 1. LEGACY_FITTING_LIBRARY (8 items)
    // -------------------------------------------------------------

    // 1. TRAY_STRAIGHT
    this.register({
      schemaVersion: '2.0.0',
      componentVersion: '1.0.0',
      id: 'TRAY_STRAIGHT',
      name: 'Straight Cable Tray',
      nameZh: '標準直段托架',
      family: 'CABLE_TRAY',
      origin: ComponentOrigin.LEGACY_FITTING_LIBRARY,
      role: ComponentRole.TRAY,
      description: 'Standard heavy-duty industrial straight ladder cable tray with side rails and rungs.',
      defaultParameters: {
        width: 600, // mm
        depth: 100, // mm
        length: 3000, // mm
        rungSpacing: 250,
      },
      provenance: {
        width: { source: 'NEMA VE 1 / Industrial Standard', assumptionLevel: AssumptionLevel.DEMO_DEFAULT, notes: 'Standard nominal tray width' },
        depth: { source: 'NEMA VE 1', assumptionLevel: AssumptionLevel.DEMO_DEFAULT, notes: 'Standard 100mm side rail height' },
        length: { source: 'Standard 3m section', assumptionLevel: AssumptionLevel.DEMO_DEFAULT, notes: 'Catalog standard 3000mm length' },
      },
      getLocalPorts: (params) => {
        const halfL = (params.length || 3000) / 2;
        const w = params.width || 600;
        const d = params.depth || 100;
        return [
          {
            id: 'PORT_A',
            name: 'Inlet (Start)',
            localPosition: [0, 0, -halfL],
            localDirection: [0, 0, -1],
            localUp: [0, 1, 0],
            width: w,
            depth: d,
            connectionType: 'TRAY_END',
          },
          {
            id: 'PORT_B',
            name: 'Outlet (End)',
            localPosition: [0, 0, halfL],
            localDirection: [0, 0, 1],
            localUp: [0, 1, 0],
            width: w,
            depth: d,
            connectionType: 'TRAY_END',
          },
        ];
      },
      getCenterlineRoutes: (params) => [
        RouteGenerator.createStraightZ('PORT_A', 'PORT_B', params.length || 3000),
      ],
      getBounds: (params) => {
        const halfW = (params.width || 600) / 2;
        const halfD = (params.depth || 100) / 2;
        const halfL = (params.length || 3000) / 2;
        return {
          min: [-halfW, -halfD, -halfL],
          max: [halfW, halfD, halfL],
        };
      },
      buildGeometry: (params) => GeometryGenerators.buildStraightTray(params as any),
    });

    // 2. TRAY_STRAIGHT_DIVIDER
    this.register({
      schemaVersion: '2.0.0',
      componentVersion: '1.0.0',
      id: 'TRAY_STRAIGHT_DIVIDER',
      name: 'Straight Cable Tray with Divider',
      nameZh: '直段托架附金屬隔離板',
      family: 'CABLE_TRAY',
      origin: ComponentOrigin.LEGACY_FITTING_LIBRARY,
      role: ComponentRole.TRAY,
      description: 'Straight ladder tray equipped with physical grounded metallic divider for IS/Non-IS segregation.',
      defaultParameters: {
        width: 600,
        depth: 100,
        length: 3000,
        hasDivider: true,
      },
      provenance: {
        hasDivider: { source: 'PIP PNC00001 / IEC 60079-14', assumptionLevel: AssumptionLevel.VERIFIED_PROJECT_REQUIREMENT, notes: 'IS/Non-IS partition requirement' },
      },
      getLocalPorts: (params) => ComponentRegistry.get('TRAY_STRAIGHT')!.getLocalPorts(params),
      getCenterlineRoutes: (params) => ComponentRegistry.get('TRAY_STRAIGHT')!.getCenterlineRoutes(params),
      getBounds: (params) => ComponentRegistry.get('TRAY_STRAIGHT')!.getBounds(params),
      buildGeometry: (params) => GeometryGenerators.buildStraightTray({ ...params, hasDivider: true } as any),
    });

    // 3. FITTING_SPLICE_PLATE
    this.register({
      schemaVersion: '2.0.0',
      componentVersion: '1.0.0',
      id: 'FITTING_SPLICE_PLATE',
      name: 'Splice Plate Assembly',
      nameZh: '螺栓對接連接板組',
      family: 'ACCESSORY',
      origin: ComponentOrigin.LEGACY_FITTING_LIBRARY,
      role: ComponentRole.FITTING,
      description: 'Bolted coupling splice plate set connecting adjacent tray side rails.',
      defaultParameters: {
        depth: 100,
      },
      provenance: {
        depth: { source: 'Oglaend Catalog', assumptionLevel: AssumptionLevel.VERIFIED_VENDOR_CATALOG, notes: 'Matches 100mm rail' },
      },
      getLocalPorts: () => [],
      getCenterlineRoutes: () => [],
      getBounds: () => ({ min: [-25, -50, -60], max: [25, 50, 60] }),
      buildGeometry: (params) => GeometryGenerators.buildSplicePlateMesh((params.depth || 100) / 1000),
    });

    // 4. SUPPORT_CANTILEVER
    this.register({
      schemaVersion: '2.0.0',
      componentVersion: '1.0.0',
      id: 'SUPPORT_CANTILEVER',
      name: 'Cantilever Support Arm',
      nameZh: '懸臂固定支撐架',
      family: 'SUPPORT',
      origin: ComponentOrigin.LEGACY_FITTING_LIBRARY,
      role: ComponentRole.SUPPORT,
      description: 'C-channel cantilever bracket with backplate and hold-down clamps for column mounting.',
      defaultParameters: {
        width: 600,
        depth: 100,
        armLength: 750,
      },
      provenance: {
        armLength: { source: 'Typical tray bracket sizing', assumptionLevel: AssumptionLevel.DEMO_DEFAULT, notes: 'Width + 150mm extension' },
      },
      getLocalPorts: (params) => [
        {
          id: 'PORT_MOUNT',
          name: 'Column Mounting Backplate',
          localPosition: [-(params.width || 600) / 2 - 60, -150, 0],
          localDirection: [-1, 0, 0],
          localUp: [0, 1, 0],
          width: 60,
          depth: 250,
          connectionType: 'STRUCTURAL',
        },
      ],
      getCenterlineRoutes: () => [],
      getBounds: (params) => ({
        min: [-(params.width || 600) / 2 - 70, -200, -30],
        max: [(params.width || 600) / 2 + 100, 50, 30],
      }),
      buildGeometry: (params) => GeometryGenerators.buildCantileverSupport(params as any),
    });

    // 5. FITTING_ELBOW_90
    this.register({
      schemaVersion: '2.0.0',
      componentVersion: '1.0.0',
      id: 'FITTING_ELBOW_90',
      name: 'Horizontal Elbow 90°',
      nameZh: '90° 水平轉彎頭',
      family: 'FITTING',
      origin: ComponentOrigin.LEGACY_FITTING_LIBRARY,
      role: ComponentRole.FITTING,
      description: 'Factory-formed 90-degree horizontal elbow for planar routing directional change.',
      defaultParameters: {
        width: 600,
        depth: 100,
        radius: 600,
        angleDeg: 90,
      },
      provenance: {
        radius: { source: 'Minimum cable bending radius standard', assumptionLevel: AssumptionLevel.DEMO_DEFAULT, notes: 'Catalog R=600mm' },
        angleDeg: { source: 'Standard 90-degree turn', assumptionLevel: AssumptionLevel.VERIFIED_VENDOR_CATALOG, notes: 'Standard bend' },
      },
      getLocalPorts: (params) => {
        const r = params.radius || 600;
        const w = params.width || 600;
        const d = params.depth || 100;
        return [
          {
            id: 'PORT_A',
            name: 'Inlet Port A',
            localPosition: [r, 0, 0],
            localDirection: [0, 0, 1], // Normal pointing outward facing straight tray inlet
            localUp: [0, 1, 0],
            width: w,
            depth: d,
            connectionType: 'TRAY_END',
          },
          {
            id: 'PORT_B',
            name: 'Outlet Port B',
            localPosition: [0, 0, -r],
            localDirection: [-1, 0, 0], // Outward normal along -X
            localUp: [0, 1, 0],
            width: w,
            depth: d,
            connectionType: 'TRAY_END',
          },
        ];
      },
      getCenterlineRoutes: (params) => [
        RouteGenerator.createHorizontalElbow('PORT_A', 'PORT_B', params.radius || 600, params.angleDeg || 90),
      ],
      getBounds: (params) => {
        const r = params.radius || 600;
        const halfW = (params.width || 600) / 2;
        const halfD = (params.depth || 100) / 2;
        return {
          min: [-halfW, -halfD, -r - halfW],
          max: [r + halfW, halfD, halfW],
        };
      },
      buildGeometry: (params) => GeometryGenerators.buildHorizontalElbow({ ...params, angleDeg: 90 } as any),
    });

    // 6. FITTING_TEE
    this.register({
      schemaVersion: '2.0.0',
      componentVersion: '1.0.0',
      id: 'FITTING_TEE',
      name: 'Horizontal Tee',
      nameZh: '水平三通配件',
      family: 'FITTING',
      origin: ComponentOrigin.LEGACY_FITTING_LIBRARY,
      role: ComponentRole.FITTING,
      description: 'T-junction fitting connecting a main through-run to a perpendicular branch tray.',
      defaultParameters: {
        width: 600,
        depth: 100,
        length: 1400,
        branchLength: 700,
      },
      provenance: {
        length: { source: 'Oglaend standard tee', assumptionLevel: AssumptionLevel.DEMO_DEFAULT, notes: 'Main run length' },
      },
      getLocalPorts: (params) => {
        const halfL = (params.length || 1400) / 2;
        const bl = params.branchLength || 700;
        const w = params.width || 600;
        const d = params.depth || 100;
        return [
          {
            id: 'PORT_A',
            name: 'Main Run Inlet',
            localPosition: [-halfL, 0, 0],
            localDirection: [-1, 0, 0],
            localUp: [0, 1, 0],
            width: w,
            depth: d,
            connectionType: 'TRAY_END',
          },
          {
            id: 'PORT_B',
            name: 'Main Run Outlet',
            localPosition: [halfL, 0, 0],
            localDirection: [1, 0, 0],
            localUp: [0, 1, 0],
            width: w,
            depth: d,
            connectionType: 'TRAY_END',
          },
          {
            id: 'PORT_C',
            name: 'Branch Port',
            localPosition: [0, 0, bl],
            localDirection: [0, 0, 1],
            localUp: [0, 1, 0],
            width: w,
            depth: d,
            connectionType: 'TRAY_END',
          },
        ];
      },
      getCenterlineRoutes: (params) => {
        const l = params.length || 1400;
        const bl = params.branchLength || 700;
        return [
          {
            id: 'ROUTE_A_B',
            fromPort: 'PORT_A',
            toPort: 'PORT_B',
            type: 'STRAIGHT',
            analyticLength: AnalyticLength.straight(l),
            samplePoints: [
              [-l / 2, 0, 0],
              [0, 0, 0],
              [l / 2, 0, 0],
            ],
          },
          {
            id: 'ROUTE_A_C',
            fromPort: 'PORT_A',
            toPort: 'PORT_C',
            type: 'ARC_XZ',
            analyticLength: AnalyticLength.teeBranch(l, bl),
            samplePoints: [
              [-l / 2, 0, 0],
              [0, 0, 0],
              [0, 0, bl],
            ],
          },
          {
            id: 'ROUTE_B_C',
            fromPort: 'PORT_B',
            toPort: 'PORT_C',
            type: 'ARC_XZ',
            analyticLength: AnalyticLength.teeBranch(l, bl),
            samplePoints: [
              [l / 2, 0, 0],
              [0, 0, 0],
              [0, 0, bl],
            ],
          },
        ];
      },
      getBounds: (params) => {
        const halfL = (params.length || 1400) / 2;
        const bl = params.branchLength || 700;
        const halfW = (params.width || 600) / 2;
        const halfD = (params.depth || 100) / 2;
        return {
          min: [-halfL, -halfD, -halfW],
          max: [halfL, halfD, bl],
        };
      },
      buildGeometry: (params) => GeometryGenerators.buildHorizontalTee(params as any),
    });

    // 7. FITTING_RISER_IN_90
    this.register({
      schemaVersion: '2.0.0',
      componentVersion: '1.0.0',
      id: 'FITTING_RISER_IN_90',
      name: 'Inside Vertical Riser 90°',
      nameZh: '90° 內彎垂直爬坡彎頭',
      family: 'FITTING',
      origin: ComponentOrigin.LEGACY_FITTING_LIBRARY,
      role: ComponentRole.FITTING,
      description: 'Inside vertical riser fitting transitioning horizontal tray run upwards.',
      defaultParameters: {
        width: 600,
        depth: 100,
        radius: 600,
        angleDeg: 90,
      },
      provenance: {
        radius: { source: 'Vertical bend catalog standard', assumptionLevel: AssumptionLevel.DEMO_DEFAULT, notes: 'R=600mm' },
      },
      getLocalPorts: (params) => {
        const r = params.radius || 600;
        const w = params.width || 600;
        const d = params.depth || 100;
        return [
          {
            id: 'PORT_A',
            name: 'Bottom Inlet',
            localPosition: [r, 0, 0],
            localDirection: [0, -1, 0],
            localUp: [0, 0, 1],
            width: w,
            depth: d,
            connectionType: 'TRAY_END',
          },
          {
            id: 'PORT_B',
            name: 'Top Outlet',
            localPosition: [0, r, 0],
            localDirection: [-1, 0, 0],
            localUp: [0, 0, 1],
            width: w,
            depth: d,
            connectionType: 'TRAY_END',
          },
        ];
      },
      getCenterlineRoutes: (params) => [
        RouteGenerator.createVerticalRiser('PORT_A', 'PORT_B', params.radius || 600, params.angleDeg || 90, false),
      ],
      getBounds: (params) => {
        const r = params.radius || 600;
        const halfW = (params.width || 600) / 2;
        return {
          min: [-50, -50, -halfW],
          max: [r + 50, r + 50, halfW],
        };
      },
      buildGeometry: (params) => GeometryGenerators.buildVerticalRiser({ ...params, isOutside: false } as any),
    });

    // 8. FITTING_RISER_OUT_90
    this.register({
      schemaVersion: '2.0.0',
      componentVersion: '1.0.0',
      id: 'FITTING_RISER_OUT_90',
      name: 'Outside Vertical Riser 90°',
      nameZh: '90° 外彎垂直下坡彎頭',
      family: 'FITTING',
      origin: ComponentOrigin.LEGACY_FITTING_LIBRARY,
      role: ComponentRole.FITTING,
      description: 'Outside vertical riser fitting transitioning horizontal tray downwards.',
      defaultParameters: {
        width: 600,
        depth: 100,
        radius: 600,
        angleDeg: 90,
      },
      provenance: {
        radius: { source: 'Catalog standard R=600mm', assumptionLevel: AssumptionLevel.DEMO_DEFAULT, notes: 'Vertical drop' },
      },
      getLocalPorts: (params) => {
        const r = params.radius || 600;
        const w = params.width || 600;
        const d = params.depth || 100;
        return [
          {
            id: 'PORT_A',
            name: 'Top Inlet',
            localPosition: [0, 0, 0],
            localDirection: [1, 0, 0],
            localUp: [0, 1, 0],
            width: w,
            depth: d,
            connectionType: 'TRAY_END',
          },
          {
            id: 'PORT_B',
            name: 'Bottom Outlet',
            localPosition: [r, -r, 0],
            localDirection: [0, -1, 0],
            localUp: [0, 0, 1],
            width: w,
            depth: d,
            connectionType: 'TRAY_END',
          },
        ];
      },
      getCenterlineRoutes: (params) => [
        RouteGenerator.createVerticalRiser('PORT_A', 'PORT_B', params.radius || 600, params.angleDeg || 90, true),
      ],
      getBounds: (params) => {
        const r = params.radius || 600;
        const halfW = (params.width || 600) / 2;
        return {
          min: [-50, -r - 50, -halfW],
          max: [r + 50, 50, halfW],
        };
      },
      buildGeometry: (params) => GeometryGenerators.buildVerticalRiser({ ...params, isOutside: true } as any),
    });

    // -------------------------------------------------------------
    // 2. LEGACY_MCR_PROTOTYPE (16 items)
    // -------------------------------------------------------------

    // 9. EQUIP_JUNCTION_BOX
    this.register({
      schemaVersion: '2.0.0',
      componentVersion: '1.0.0',
      id: 'EQUIP_JUNCTION_BOX',
      name: 'Explosion-Proof Junction Box',
      nameZh: '防爆接線箱 (Ex d/e)',
      family: 'EQUIPMENT',
      origin: ComponentOrigin.LEGACY_MCR_PROTOTYPE,
      role: ComponentRole.EQUIPMENT,
      description: 'Field explosion-proof junction box mounted on pipe rack column with Unistrut channels.',
      defaultParameters: {
        width: 550,
        height: 750,
        depth: 350,
        boxType: 'IS',
      },
      provenance: {
        width: { source: 'Field JB sizing practice', assumptionLevel: AssumptionLevel.DEMO_DEFAULT, notes: '550x750x350 enclosure' },
      },
      getLocalPorts: (params) => [
        {
          id: 'PORT_BOTTOM_GLAND',
          name: 'Bottom Cable Gland Entry',
          localPosition: [0, -(params.height || 750) / 2, 0],
          localDirection: [0, -1, 0],
          localUp: [0, 0, 1],
          width: 150,
          depth: 50,
          connectionType: 'GLAND',
        },
      ],
      getCenterlineRoutes: () => [],
      getBounds: (params) => {
        const hw = (params.width || 550) / 2;
        const hh = (params.height || 750) / 2;
        const hd = (params.depth || 350) / 2;
        return { min: [-hw, -hh, -hd], max: [hw, hh, hd] };
      },
      buildGeometry: (params) => GeometryGenerators.buildJunctionBox(params as any),
    });

    // 10. MOUNT_UNISTRUT
    this.register({
      schemaVersion: '2.0.0',
      componentVersion: '1.0.0',
      id: 'MOUNT_UNISTRUT',
      name: 'Unistrut Channel Mounting Support',
      nameZh: '槽鋼托架支架 (Unistrut)',
      family: 'SUPPORT',
      origin: ComponentOrigin.LEGACY_MCR_PROTOTYPE,
      role: ComponentRole.SUPPORT,
      description: 'Standard P1000 41x41mm slotted channel clamped to steel columns.',
      defaultParameters: { length: 850 },
      provenance: {
        length: { source: 'Unistrut P1000 standard', assumptionLevel: AssumptionLevel.VERIFIED_VENDOR_CATALOG, notes: '41x41mm channel' },
      },
      getLocalPorts: () => [],
      getCenterlineRoutes: () => [],
      getBounds: (params) => ({ min: [-21, -(params.length || 850) / 2, -21], max: [21, (params.length || 850) / 2, 21] }),
      buildGeometry: (params) => GeometryGenerators.buildUnistrutMount(params as any),
    });

    // 11. CONDUIT_RISER
    this.register({
      schemaVersion: '2.0.0',
      componentVersion: '1.0.0',
      id: 'CONDUIT_RISER',
      name: 'Rigid Steel Conduit Riser',
      nameZh: '立柱保護鋼管 (RGS Conduit)',
      family: 'PENETRATION',
      origin: ComponentOrigin.LEGACY_MCR_PROTOTYPE,
      role: ComponentRole.PENETRATION,
      description: 'Rigid galvanized steel conduit protecting trunk cables rising from JB to top tier tray.',
      defaultParameters: { diameterMm: 50, lengthMm: 5000 },
      provenance: {
        diameterMm: { source: 'ANSI C80.1 2-inch RGS', assumptionLevel: AssumptionLevel.VERIFIED_VENDOR_CATALOG, notes: '50mm OD' },
      },
      getLocalPorts: (params) => [
        {
          id: 'PORT_BOTTOM',
          name: 'Bottom Threaded Hub',
          localPosition: [0, -(params.lengthMm || 5000) / 2, 0],
          localDirection: [0, -1, 0],
          localUp: [0, 0, 1],
          width: 50,
          depth: 50,
          connectionType: 'CONDUIT',
        },
        {
          id: 'PORT_TOP',
          name: 'Top Weatherhead Outlet',
          localPosition: [0, (params.lengthMm || 5000) / 2, 0],
          localDirection: [0, 1, 0],
          localUp: [0, 0, 1],
          width: 50,
          depth: 50,
          connectionType: 'CONDUIT',
        },
      ],
      getCenterlineRoutes: (params) => [
        {
          id: 'ROUTE_CONDUIT',
          fromPort: 'PORT_BOTTOM',
          toPort: 'PORT_TOP',
          type: 'STRAIGHT',
          analyticLength: params.lengthMm || 5000,
          samplePoints: [
            [0, -(params.lengthMm || 5000) / 2, 0],
            [0, (params.lengthMm || 5000) / 2, 0],
          ],
        },
      ],
      getBounds: (params) => ({
        min: [-25, -(params.lengthMm || 5000) / 2, -25],
        max: [25, (params.lengthMm || 5000) / 2, 25],
      }),
      buildGeometry: (params) => GeometryGenerators.buildConduitRiser(params as any),
    });

    // 12. PENETRATION_MCT
    this.register({
      schemaVersion: '2.0.0',
      componentVersion: '1.0.0',
      id: 'PENETRATION_MCT',
      name: 'MCT Transit Firestop Frame',
      nameZh: 'MCT 防火密封穿牆框組',
      family: 'PENETRATION',
      origin: ComponentOrigin.LEGACY_MCR_PROTOTYPE,
      role: ComponentRole.PENETRATION,
      description: 'Roxtec RG M6x1 multi-cable transit frame with elastomeric insert modules and wedge seal.',
      defaultParameters: {
        widthMm: 600,
        heightMm: 900,
        thicknessMm: 400,
      },
      provenance: {
        widthMm: { source: 'Roxtec RG M6x1 Catalog', assumptionLevel: AssumptionLevel.VERIFIED_VENDOR_CATALOG, notes: '600x900mm nominal frame' },
        heightMm: { source: 'Roxtec Catalog', assumptionLevel: AssumptionLevel.VERIFIED_VENDOR_CATALOG, notes: '900mm height' },
        thicknessMm: { source: 'Concrete wall sleeve depth', assumptionLevel: AssumptionLevel.VERIFIED_PROJECT_REQUIREMENT, notes: '400mm wall thickness' },
      },
      getLocalPorts: (params) => [
        {
          id: 'PORT_EXT',
          name: 'Exterior Intake Face',
          localPosition: [-(params.thicknessMm || 400) / 2, 0, 0],
          localDirection: [-1, 0, 0],
          localUp: [0, 1, 0],
          width: params.widthMm || 600,
          depth: params.heightMm || 900,
          connectionType: 'FLANGE',
        },
        {
          id: 'PORT_INT',
          name: 'Interior Control Room Face',
          localPosition: [(params.thicknessMm || 400) / 2, 0, 0],
          localDirection: [1, 0, 0],
          localUp: [0, 1, 0],
          width: params.widthMm || 600,
          depth: params.heightMm || 900,
          connectionType: 'FLANGE',
        },
      ],
      getCenterlineRoutes: (params) => [
        {
          id: 'ROUTE_MCT',
          fromPort: 'PORT_EXT',
          toPort: 'PORT_INT',
          type: 'STRAIGHT',
          analyticLength: params.thicknessMm || 400,
          samplePoints: [
            [-(params.thicknessMm || 400) / 2, 0, 0],
            [(params.thicknessMm || 400) / 2, 0, 0],
          ],
        },
      ],
      getBounds: (params) => ({
        min: [-(params.thicknessMm || 400) / 2, -(params.heightMm || 900) / 2, -(params.widthMm || 600) / 2],
        max: [(params.thicknessMm || 400) / 2, (params.heightMm || 900) / 2, (params.widthMm || 600) / 2],
      }),
      buildGeometry: (params) => GeometryGenerators.buildMctPenetration(params as any),
    });

    // 13. EQUIP_CONTROL_CABINET
    this.register({
      schemaVersion: '2.0.0',
      componentVersion: '1.0.0',
      id: 'EQUIP_CONTROL_CABINET',
      name: 'Control Room Marshalling Cabinet',
      nameZh: '控制室系統交連機櫃 (DCS/SIS)',
      family: 'EQUIPMENT',
      origin: ComponentOrigin.LEGACY_MCR_PROTOTYPE,
      role: ComponentRole.EQUIPMENT,
      description: 'Standard 800x1000x2200mm floor-mounted marshalling rack with bottom trench cable entry.',
      defaultParameters: {
        widthMm: 1000,
        heightMm: 2200,
        depthMm: 800,
        stripeColorHex: 0x0284c7,
      },
      provenance: {
        heightMm: { source: 'Standard 42U cabinet', assumptionLevel: AssumptionLevel.DEMO_DEFAULT, notes: '2200mm with plinth' },
      },
      getLocalPorts: (params) => [
        {
          id: 'PORT_BOTTOM_ENTRY',
          name: 'Bottom Cable Trench Entry',
          localPosition: [0, -(params.heightMm || 2200) / 2, 0],
          localDirection: [0, -1, 0],
          localUp: [1, 0, 0],
          width: (params.widthMm || 1000) * 0.7,
          depth: (params.depthMm || 800) * 0.7,
          connectionType: 'TRAY_END',
        },
      ],
      getCenterlineRoutes: () => [],
      getBounds: (params) => ({
        min: [-(params.widthMm || 1000) / 2, -(params.heightMm || 2200) / 2, -(params.depthMm || 800) / 2],
        max: [(params.widthMm || 1000) / 2, (params.heightMm || 2200) / 2, (params.depthMm || 800) / 2],
      }),
      buildGeometry: (params) => GeometryGenerators.buildControlCabinet(params as any),
    });

    // 14. STRUCT_COLUMN
    this.register({
      schemaVersion: '2.0.0',
      componentVersion: '1.0.0',
      id: 'STRUCT_COLUMN',
      name: 'Pipe Rack Structural Column',
      nameZh: '主管廊 H 型鋼立柱',
      family: 'STRUCTURE',
      origin: ComponentOrigin.LEGACY_MCR_PROTOTYPE,
      role: ComponentRole.STRUCTURE,
      description: 'Heavy structural H-beam steel column reaching up to EL +8.0m with beam connections.',
      defaultParameters: { heightMm: 8000, widthMm: 350 },
      provenance: {
        heightMm: { source: 'PIP PNC00001', assumptionLevel: AssumptionLevel.VERIFIED_PROJECT_REQUIREMENT, notes: 'Reaches EL +8.0m' },
      },
      getLocalPorts: () => [],
      getCenterlineRoutes: () => [],
      getBounds: (params) => ({ min: [-175, 0, -175], max: [175, params.heightMm || 8000, 175] }),
      buildGeometry: (params) => GeometryGenerators.buildStructuralColumn(params as any),
    });

    // 15. STRUCT_PIER
    this.register({
      schemaVersion: '2.0.0',
      componentVersion: '1.0.0',
      id: 'STRUCT_PIER',
      name: 'Concrete Foundation Pier',
      nameZh: '混凝土基墩基礎',
      family: 'STRUCTURE',
      origin: ComponentOrigin.LEGACY_MCR_PROTOTYPE,
      role: ComponentRole.STRUCTURE,
      description: 'Reinforced concrete foundation pedestal anchoring steel columns to ground.',
      defaultParameters: { widthMm: 700, heightMm: 400 },
      provenance: {
        heightMm: { source: 'Standard civil detail', assumptionLevel: AssumptionLevel.DEMO_DEFAULT, notes: '400mm above ground' },
      },
      getLocalPorts: () => [],
      getCenterlineRoutes: () => [],
      getBounds: (params) => ({ min: [-350, 0, -350], max: [350, params.heightMm || 400, 350] }),
      buildGeometry: (params) => GeometryGenerators.buildStructuralPier(params as any),
    });

    // 16. STRUCT_CROSS_BEAM
    this.register({
      schemaVersion: '2.0.0',
      componentVersion: '1.0.0',
      id: 'STRUCT_CROSS_BEAM',
      name: 'Pipe Rack Cross Beam',
      nameZh: '管廊橫向支撐樑',
      family: 'STRUCTURE',
      origin: ComponentOrigin.LEGACY_MCR_PROTOTYPE,
      role: ComponentRole.STRUCTURE,
      description: 'Transverse structural beam spanning across columns supporting piping and cable trays.',
      defaultParameters: { spanMm: 7800, heightMm: 250, depthMm: 180 },
      provenance: {
        spanMm: { source: 'PIP PNC00001 Main Pipe Rack width', assumptionLevel: AssumptionLevel.VERIFIED_PROJECT_REQUIREMENT, notes: '7.8m transversal span' },
      },
      getLocalPorts: () => [],
      getCenterlineRoutes: () => [],
      getBounds: (params) => ({ min: [-90, -125, -(params.spanMm || 7800) / 2], max: [90, 125, (params.spanMm || 7800) / 2] }),
      buildGeometry: (params) => GeometryGenerators.buildStructuralCrossBeam(params as any),
    });

    // 17. STRUCT_STRINGER
    this.register({
      schemaVersion: '2.0.0',
      componentVersion: '1.0.0',
      id: 'STRUCT_STRINGER',
      name: 'Longitudinal Stringer Beam',
      nameZh: '管廊縱向縱樑',
      family: 'STRUCTURE',
      origin: ComponentOrigin.LEGACY_MCR_PROTOTYPE,
      role: ComponentRole.STRUCTURE,
      description: 'Longitudinal structural tie beam interconnecting portal frames along bay span.',
      defaultParameters: { spanMm: 6000 },
      provenance: {
        spanMm: { source: '6m typical column spacing', assumptionLevel: AssumptionLevel.DEMO_DEFAULT, notes: '6000mm longitudinal bay' },
      },
      getLocalPorts: () => [],
      getCenterlineRoutes: () => [],
      getBounds: (params) => ({ min: [-100, -75, -(params.spanMm || 6000) / 2], max: [100, 75, (params.spanMm || 6000) / 2] }),
      buildGeometry: (params) => GeometryGenerators.buildStructuralStringer(params as any),
    });

    // 18. OBSTACLE_PROCESS_PIPE
    this.register({
      schemaVersion: '2.0.0',
      componentVersion: '1.0.0',
      id: 'OBSTACLE_PROCESS_PIPE',
      name: 'Lower Tier Process Pipe',
      nameZh: '下層製程液體管 (EL +3.0m)',
      family: 'OBSTACLE',
      origin: ComponentOrigin.LEGACY_MCR_PROTOTYPE,
      role: ComponentRole.OBSTACLE,
      description: 'Process liquid piping running at lower tier EL +3.0m.',
      defaultParameters: { diameterMm: 600, lengthMm: 27000, elevationMm: 3300 },
      provenance: {
        elevationMm: { source: 'PIP PNC00001 tier elevation', assumptionLevel: AssumptionLevel.VERIFIED_PROJECT_REQUIREMENT, notes: 'EL +3.0m tier' },
      },
      getLocalPorts: () => [],
      getCenterlineRoutes: () => [],
      getBounds: (params) => ({ min: [-(params.lengthMm || 27000) / 2, -300, -300], max: [(params.lengthMm || 27000) / 2, 300, 300] }),
      buildGeometry: (params) => GeometryGenerators.buildPipe({ ...params, isSteam: false, axis: 'X' } as any),
    });

    // 19. OBSTACLE_STEAM_PIPE
    this.register({
      schemaVersion: '2.0.0',
      componentVersion: '1.0.0',
      id: 'OBSTACLE_STEAM_PIPE',
      name: 'Middle Tier High-Temp Steam Pipe',
      nameZh: '中層高溫蒸汽保溫管 (EL +4.8m)',
      family: 'OBSTACLE',
      origin: ComponentOrigin.LEGACY_MCR_PROTOTYPE,
      role: ComponentRole.OBSTACLE,
      description: 'High-temperature steam line at middle tier EL +4.8m requiring 250mm thermal safety clearance.',
      defaultParameters: { diameterMm: 480, lengthMm: 27000, clearanceMm: 250 },
      provenance: {
        diameterMm: { source: 'Steam pipe with calcium silicate insulation', assumptionLevel: AssumptionLevel.DEMO_DEFAULT, notes: '480mm total OD' },
        clearanceMm: { source: 'Thermal buffer estimation', assumptionLevel: AssumptionLevel.UNVERIFIED, notes: '250mm unverified safety buffer' },
      },
      getLocalPorts: () => [],
      getCenterlineRoutes: () => [],
      getBounds: (params) => {
        const r = (params.diameterMm || 480) / 2;
        const buf = params.clearanceMm || 250;
        return {
          min: [-(params.lengthMm || 27000) / 2, -r, -r],
          max: [(params.lengthMm || 27000) / 2, r, r],
          clearanceEnvelope: {
            min: [-(params.lengthMm || 27000) / 2, -r - buf, -r - buf],
            max: [(params.lengthMm || 27000) / 2, r + buf, r + buf],
            reason: 'High-temperature radiant heat buffer',
            bufferMm: buf,
          },
        };
      },
      buildGeometry: (params) => GeometryGenerators.buildPipe({ ...params, isSteam: true, axis: 'X' } as any),
    });

    // 20. OBSTACLE_BRANCH_PIPE_N
    this.register({
      schemaVersion: '2.0.0',
      componentVersion: '1.0.0',
      id: 'OBSTACLE_BRANCH_PIPE_N',
      name: 'North Branch Process Pipe',
      nameZh: '北側反應區分支製程管',
      family: 'OBSTACLE',
      origin: ComponentOrigin.LEGACY_MCR_PROTOTYPE,
      role: ComponentRole.OBSTACLE,
      description: 'Process branch pipe running across north branch rack along Z axis.',
      defaultParameters: { diameterMm: 400, lengthMm: 7500 },
      provenance: { diameterMm: { source: 'Branch process sizing', assumptionLevel: AssumptionLevel.DEMO_DEFAULT, notes: '400mm OD' } },
      getLocalPorts: () => [],
      getCenterlineRoutes: () => [],
      getBounds: (params) => ({ min: [-200, -200, -(params.lengthMm || 7500) / 2], max: [200, 200, (params.lengthMm || 7500) / 2] }),
      buildGeometry: (params) => GeometryGenerators.buildPipe({ ...params, isSteam: false, axis: 'Z' } as any),
    });

    // 21. OBSTACLE_BRANCH_PIPE_S
    this.register({
      schemaVersion: '2.0.0',
      componentVersion: '1.0.0',
      id: 'OBSTACLE_BRANCH_PIPE_S',
      name: 'South Branch Steam Pipe',
      nameZh: '南側儲槽區分支蒸汽管',
      family: 'OBSTACLE',
      origin: ComponentOrigin.LEGACY_MCR_PROTOTYPE,
      role: ComponentRole.OBSTACLE,
      description: 'Steam branch line running into south storage area.',
      defaultParameters: { diameterMm: 360, lengthMm: 7500 },
      provenance: { diameterMm: { source: 'Branch steam sizing', assumptionLevel: AssumptionLevel.DEMO_DEFAULT, notes: '360mm OD' } },
      getLocalPorts: () => [],
      getCenterlineRoutes: () => [],
      getBounds: (params) => ({ min: [-180, -180, -(params.lengthMm || 7500) / 2], max: [180, 180, (params.lengthMm || 7500) / 2] }),
      buildGeometry: (params) => GeometryGenerators.buildPipe({ ...params, isSteam: true, axis: 'Z' } as any),
    });

    // 22. OBSTACLE_HAZARD_ZONE
    this.register({
      schemaVersion: '2.0.0',
      componentVersion: '1.0.0',
      id: 'OBSTACLE_HAZARD_ZONE',
      name: 'Thermal Hazard Envelope Zone',
      nameZh: '高溫熱區避讓包絡體',
      family: 'OBSTACLE',
      origin: ComponentOrigin.LEGACY_MCR_PROTOTYPE,
      role: ComponentRole.OBSTACLE,
      description: 'Thermal furnace radiant exclusion zone enforcing routing detour.',
      defaultParameters: { widthMm: 6000, heightMm: 6000, depthMm: 4000 },
      provenance: { widthMm: { source: 'Furnace exclusion envelope', assumptionLevel: AssumptionLevel.UNVERIFIED, notes: 'Requires CFD verification' } },
      getLocalPorts: () => [],
      getCenterlineRoutes: () => [],
      getBounds: (params) => ({
        min: [-(params.widthMm || 6000) / 2, -(params.heightMm || 6000) / 2, -(params.depthMm || 4000) / 2],
        max: [(params.widthMm || 6000) / 2, (params.heightMm || 6000) / 2, (params.depthMm || 4000) / 2],
      }),
      buildGeometry: (params) => GeometryGenerators.buildHazardZone(params as any),
    });

    // 23. CONTEXT_BUILDING
    this.register({
      schemaVersion: '2.0.0',
      componentVersion: '1.0.0',
      id: 'CONTEXT_BUILDING',
      name: 'Control Room Building & Floor',
      nameZh: '控制室建築主體與高架地板',
      family: 'STRUCTURE',
      origin: ComponentOrigin.LEGACY_MCR_PROTOTYPE,
      role: ComponentRole.STRUCTURE,
      description: 'Reinforced concrete control building envelope with raised access floor.',
      defaultParameters: { widthMm: 11000, heightMm: 5500, depthMm: 14000 },
      provenance: { widthMm: { source: 'Control room architectural layout', assumptionLevel: AssumptionLevel.DEMO_DEFAULT, notes: '11x5.5x14m envelope' } },
      getLocalPorts: () => [],
      getCenterlineRoutes: () => [],
      getBounds: (params) => ({
        min: [-(params.widthMm || 11000) / 2, 0, -(params.depthMm || 14000) / 2],
        max: [(params.widthMm || 11000) / 2, params.heightMm || 5500, (params.depthMm || 14000) / 2],
      }),
      buildGeometry: (params) => GeometryGenerators.buildBuildingContext(params as any),
    });

    // 24. VISUAL_CABLE_GENERATOR
    this.register({
      schemaVersion: '2.0.0',
      componentVersion: '1.0.0',
      id: 'VISUAL_CABLE_GENERATOR',
      name: 'Dynamic Flowing Cable Bundle',
      nameZh: '動態流光訊號電纜束',
      family: 'VISUAL',
      origin: ComponentOrigin.LEGACY_MCR_PROTOTYPE,
      role: ComponentRole.VISUAL,
      description: '3D cable bundle with animated flow shader displaying signal direction and segregation colors.',
      defaultParameters: {
        radiusMm: 25,
        colorHex: 0x06b6d4,
        emissiveHex: 0x00aaff,
        pathPoints: [
          [0, 0, 0],
          [0, 5000, 0],
          [5000, 5000, 0],
        ],
      },
      provenance: { radiusMm: { source: 'Multi-pair trunk cable outer diameter', assumptionLevel: AssumptionLevel.DEMO_DEFAULT, notes: '25mm average OD' } },
      getLocalPorts: () => [],
      getCenterlineRoutes: () => [],
      getBounds: () => ({ min: [-50, -50, -50], max: [5000, 5000, 50] }),
      buildGeometry: (params) => GeometryGenerators.buildVisualCable(params as any),
    });

    // -------------------------------------------------------------
    // 3. NEW_COMPONENT (6 items)
    // -------------------------------------------------------------

    // 25. FITTING_ELBOW_45
    this.register({
      schemaVersion: '2.0.0',
      componentVersion: '1.0.0',
      id: 'FITTING_ELBOW_45',
      name: 'Horizontal Elbow 45°',
      nameZh: '45° 水平轉彎頭',
      family: 'FITTING',
      origin: ComponentOrigin.NEW_COMPONENT,
      role: ComponentRole.FITTING,
      description: 'Factory-formed 45-degree horizontal elbow for gradual directional routing offset.',
      defaultParameters: {
        width: 600,
        depth: 100,
        radius: 600,
        angleDeg: 45,
      },
      provenance: {
        radius: { source: 'NEMA VE 1 / Oglaend Catalog', assumptionLevel: AssumptionLevel.VERIFIED_VENDOR_CATALOG, notes: 'Standard 45-deg elbow R=600mm' },
      },
      getLocalPorts: (params) => {
        const r = params.radius || 600;
        const w = params.width || 600;
        const d = params.depth || 100;
        const aRad = (45 * Math.PI) / 180;
        // Outlet position and outward normal
        const endX = r * Math.cos(aRad);
        const endZ = -r * Math.sin(aRad);
        const outDirX = -Math.sin(aRad);
        const outDirZ = -Math.cos(aRad);

        return [
          {
            id: 'PORT_A',
            name: 'Inlet Port A',
            localPosition: [r, 0, 0],
            localDirection: [0, 0, 1],
            localUp: [0, 1, 0],
            width: w,
            depth: d,
            connectionType: 'TRAY_END',
          },
          {
            id: 'PORT_B',
            name: 'Outlet Port B',
            localPosition: [endX, 0, endZ],
            localDirection: [outDirX, 0, outDirZ],
            localUp: [0, 1, 0],
            width: w,
            depth: d,
            connectionType: 'TRAY_END',
          },
        ];
      },
      getCenterlineRoutes: (params) => [
        RouteGenerator.createHorizontalElbow('PORT_A', 'PORT_B', params.radius || 600, 45),
      ],
      getBounds: (params) => {
        const r = params.radius || 600;
        const halfW = (params.width || 600) / 2;
        const halfD = (params.depth || 100) / 2;
        return {
          min: [-halfW, -halfD, -r * 0.75 - halfW],
          max: [r + halfW, halfD, halfW],
        };
      },
      buildGeometry: (params) => GeometryGenerators.buildHorizontalElbow({ ...params, angleDeg: 45 } as any),
    });

    // 26. FITTING_RISER_IN_45
    this.register({
      schemaVersion: '2.0.0',
      componentVersion: '1.0.0',
      id: 'FITTING_RISER_IN_45',
      name: 'Inside Vertical Riser 45°',
      nameZh: '45° 內彎垂直爬坡彎頭',
      family: 'FITTING',
      origin: ComponentOrigin.NEW_COMPONENT,
      role: ComponentRole.FITTING,
      description: '45-degree inside vertical riser for gradual elevation change.',
      defaultParameters: {
        width: 600,
        depth: 100,
        radius: 600,
        angleDeg: 45,
      },
      provenance: { radius: { source: 'Oglaend Catalog', assumptionLevel: AssumptionLevel.VERIFIED_VENDOR_CATALOG, notes: 'R=600mm' } },
      getLocalPorts: (params) => {
        const r = params.radius || 600;
        const w = params.width || 600;
        const d = params.depth || 100;
        const aRad = (45 * Math.PI) / 180;
        return [
          {
            id: 'PORT_A',
            name: 'Bottom Inlet',
            localPosition: [r, 0, 0],
            localDirection: [0, -1, 0],
            localUp: [0, 0, 1],
            width: w,
            depth: d,
            connectionType: 'TRAY_END',
          },
          {
            id: 'PORT_B',
            name: 'Top Outlet',
            localPosition: [r * Math.cos(aRad), r * Math.sin(aRad), 0],
            localDirection: [-Math.sin(aRad), Math.cos(aRad), 0],
            localUp: [0, 0, 1],
            width: w,
            depth: d,
            connectionType: 'TRAY_END',
          },
        ];
      },
      getCenterlineRoutes: (params) => [
        RouteGenerator.createVerticalRiser('PORT_A', 'PORT_B', params.radius || 600, 45, false),
      ],
      getBounds: (params) => {
        const r = params.radius || 600;
        const halfW = (params.width || 600) / 2;
        return {
          min: [-50, -50, -halfW],
          max: [r + 50, r * 0.75 + 50, halfW],
        };
      },
      buildGeometry: (params) => GeometryGenerators.buildVerticalRiser({ ...params, angleDeg: 45, isOutside: false } as any),
    });

    // 27. FITTING_RISER_OUT_45
    this.register({
      schemaVersion: '2.0.0',
      componentVersion: '1.0.0',
      id: 'FITTING_RISER_OUT_45',
      name: 'Outside Vertical Riser 45°',
      nameZh: '45° 外彎垂直下坡彎頭',
      family: 'FITTING',
      origin: ComponentOrigin.NEW_COMPONENT,
      role: ComponentRole.FITTING,
      description: '45-degree outside vertical riser for downward slope.',
      defaultParameters: {
        width: 600,
        depth: 100,
        radius: 600,
        angleDeg: 45,
      },
      provenance: { radius: { source: 'Oglaend Catalog', assumptionLevel: AssumptionLevel.VERIFIED_VENDOR_CATALOG, notes: 'R=600mm' } },
      getLocalPorts: (params) => {
        const r = params.radius || 600;
        const w = params.width || 600;
        const d = params.depth || 100;
        const aRad = (45 * Math.PI) / 180;
        return [
          {
            id: 'PORT_A',
            name: 'Top Inlet',
            localPosition: [0, 0, 0],
            localDirection: [1, 0, 0],
            localUp: [0, 1, 0],
            width: w,
            depth: d,
            connectionType: 'TRAY_END',
          },
          {
            id: 'PORT_B',
            name: 'Bottom Outlet',
            localPosition: [r * Math.sin(aRad), -r * (1 - Math.cos(aRad)), 0],
            localDirection: [Math.cos(aRad), -Math.sin(aRad), 0],
            localUp: [0, 0, 1],
            width: w,
            depth: d,
            connectionType: 'TRAY_END',
          },
        ];
      },
      getCenterlineRoutes: (params) => [
        RouteGenerator.createVerticalRiser('PORT_A', 'PORT_B', params.radius || 600, 45, true),
      ],
      getBounds: (params) => {
        const r = params.radius || 600;
        const halfW = (params.width || 600) / 2;
        return {
          min: [-50, -r * 0.75 - 50, -halfW],
          max: [r + 50, 50, halfW],
        };
      },
      buildGeometry: (params) => GeometryGenerators.buildVerticalRiser({ ...params, angleDeg: 45, isOutside: true } as any),
    });

    // 28. FITTING_REDUCER_CENTER
    this.register({
      schemaVersion: '2.0.0',
      componentVersion: '1.0.0',
      id: 'FITTING_REDUCER_CENTER',
      name: 'Concentric Reducer',
      nameZh: '同心異徑大小頭',
      family: 'FITTING',
      origin: ComponentOrigin.NEW_COMPONENT,
      role: ComponentRole.FITTING,
      description: 'Symmetric concentric reducer transitioning between different tray widths along a shared centerline.',
      defaultParameters: {
        inletWidth: 600,
        outletWidth: 450,
        depth: 100,
        length: 500,
      },
      provenance: {
        inletWidth: { source: 'Standard width transition', assumptionLevel: AssumptionLevel.DEMO_DEFAULT, notes: '600mm to 450mm' },
        length: { source: 'Oglaend Catalog', assumptionLevel: AssumptionLevel.VERIFIED_VENDOR_CATALOG, notes: '500mm standard transition length' },
      },
      getLocalPorts: (params) => {
        const halfL = (params.length || 500) / 2;
        const w1 = params.inletWidth || 600;
        const w2 = params.outletWidth || 450;
        const d = params.depth || 100;
        return [
          {
            id: 'PORT_A',
            name: 'Inlet Port (Large)',
            localPosition: [0, 0, -halfL],
            localDirection: [0, 0, -1],
            localUp: [0, 1, 0],
            width: w1,
            depth: d,
            connectionType: 'TRAY_END',
          },
          {
            id: 'PORT_B',
            name: 'Outlet Port (Small)',
            localPosition: [0, 0, halfL],
            localDirection: [0, 0, 1],
            localUp: [0, 1, 0],
            width: w2,
            depth: d,
            connectionType: 'TRAY_END',
          },
        ];
      },
      getCenterlineRoutes: (params) => [
        RouteGenerator.createReducer('PORT_A', 'PORT_B', params.length || 500, 0),
      ],
      getBounds: (params) => {
        const maxW = Math.max(params.inletWidth || 600, params.outletWidth || 450) / 2;
        const halfD = (params.depth || 100) / 2;
        const halfL = (params.length || 500) / 2;
        return {
          min: [-maxW, -halfD, -halfL],
          max: [maxW, halfD, halfL],
        };
      },
      buildGeometry: (params) => GeometryGenerators.buildReducer({ ...params, type: 'CONCENTRIC' } as any),
    });

    // 29. FITTING_REDUCER_LEFT
    this.register({
      schemaVersion: '2.0.0',
      componentVersion: '1.0.0',
      id: 'FITTING_REDUCER_LEFT',
      name: 'Left Eccentric Reducer',
      nameZh: '左側單邊平直大小頭',
      family: 'FITTING',
      origin: ComponentOrigin.NEW_COMPONENT,
      role: ComponentRole.FITTING,
      description: 'Eccentric reducer maintaining straight alignment along the left rail while tapering the right side.',
      defaultParameters: {
        inletWidth: 600,
        outletWidth: 450,
        depth: 100,
        length: 500,
      },
      provenance: {
        inletWidth: { source: 'Standard asymmetric reducer', assumptionLevel: AssumptionLevel.DEMO_DEFAULT, notes: 'Wall hugging layout' },
      },
      getLocalPorts: (params) => {
        const halfL = (params.length || 500) / 2;
        const w1 = params.inletWidth || 600;
        const w2 = params.outletWidth || 450;
        const d = params.depth || 100;
        // Left rail aligned at x = -w1/2
        const outletCenterOffset = (w2 - w1) / 2;
        return [
          {
            id: 'PORT_A',
            name: 'Inlet Port (Large)',
            localPosition: [0, 0, -halfL],
            localDirection: [0, 0, -1],
            localUp: [0, 1, 0],
            width: w1,
            depth: d,
            connectionType: 'TRAY_END',
          },
          {
            id: 'PORT_B',
            name: 'Outlet Port (Small)',
            localPosition: [outletCenterOffset, 0, halfL],
            localDirection: [0, 0, 1],
            localUp: [0, 1, 0],
            width: w2,
            depth: d,
            connectionType: 'TRAY_END',
          },
        ];
      },
      getCenterlineRoutes: (params) => {
        const w1 = params.inletWidth || 600;
        const w2 = params.outletWidth || 450;
        const offset = (w2 - w1) / 2;
        return [RouteGenerator.createReducer('PORT_A', 'PORT_B', params.length || 500, offset)];
      },
      getBounds: (params) => {
        const w1 = params.inletWidth || 600;
        const halfD = (params.depth || 100) / 2;
        const halfL = (params.length || 500) / 2;
        return {
          min: [-w1 / 2, -halfD, -halfL],
          max: [w1 / 2, halfD, halfL],
        };
      },
      buildGeometry: (params) => GeometryGenerators.buildReducer({ ...params, type: 'LEFT' } as any),
    });

    // 30. FITTING_REDUCER_RIGHT
    this.register({
      schemaVersion: '2.0.0',
      componentVersion: '1.0.0',
      id: 'FITTING_REDUCER_RIGHT',
      name: 'Right Eccentric Reducer',
      nameZh: '右側單邊平直大小頭',
      family: 'FITTING',
      origin: ComponentOrigin.NEW_COMPONENT,
      role: ComponentRole.FITTING,
      description: 'Eccentric reducer maintaining straight alignment along the right rail while tapering the left side.',
      defaultParameters: {
        inletWidth: 600,
        outletWidth: 450,
        depth: 100,
        length: 500,
      },
      provenance: {
        inletWidth: { source: 'Standard asymmetric reducer', assumptionLevel: AssumptionLevel.DEMO_DEFAULT, notes: 'Right flush' },
      },
      getLocalPorts: (params) => {
        const halfL = (params.length || 500) / 2;
        const w1 = params.inletWidth || 600;
        const w2 = params.outletWidth || 450;
        const d = params.depth || 100;
        // Right rail aligned at x = w1/2
        const outletCenterOffset = (w1 - w2) / 2;
        return [
          {
            id: 'PORT_A',
            name: 'Inlet Port (Large)',
            localPosition: [0, 0, -halfL],
            localDirection: [0, 0, -1],
            localUp: [0, 1, 0],
            width: w1,
            depth: d,
            connectionType: 'TRAY_END',
          },
          {
            id: 'PORT_B',
            name: 'Outlet Port (Small)',
            localPosition: [outletCenterOffset, 0, halfL],
            localDirection: [0, 0, 1],
            localUp: [0, 1, 0],
            width: w2,
            depth: d,
            connectionType: 'TRAY_END',
          },
        ];
      },
      getCenterlineRoutes: (params) => {
        const w1 = params.inletWidth || 600;
        const w2 = params.outletWidth || 450;
        const offset = (w1 - w2) / 2;
        return [RouteGenerator.createReducer('PORT_A', 'PORT_B', params.length || 500, offset)];
      },
      getBounds: (params) => {
        const w1 = params.inletWidth || 600;
        const halfD = (params.depth || 100) / 2;
        const halfL = (params.length || 500) / 2;
        return {
          min: [-w1 / 2, -halfD, -halfL],
          max: [w1 / 2, halfD, halfL],
        };
      },
      buildGeometry: (params) => GeometryGenerators.buildReducer({ ...params, type: 'RIGHT' } as any),
    });

    // -------------------------------------------------------------
    // 4. DERIVED_ASSEMBLY (2 items)
    // -------------------------------------------------------------

    // 31. STRUCT_MAIN_BAY
    this.register({
      schemaVersion: '2.0.0',
      componentVersion: '1.0.0',
      id: 'STRUCT_MAIN_BAY',
      name: 'Main Pipe Rack Portal Bay Assembly',
      nameZh: '主管廊四階門型構架組合件',
      family: 'STRUCTURE_ASSEMBLY',
      origin: ComponentOrigin.DERIVED_ASSEMBLY,
      role: ComponentRole.STRUCTURE,
      description: 'Engineered 4-tier steel portal frame bay assembly comprising 2 columns, 2 piers, and 4 transverse cross beams (EL +3.0m, +4.8m, +6.35m, +7.15m).',
      defaultParameters: {
        widthSpanMm: 7800,
        heightMm: 8000,
      },
      provenance: {
        widthSpanMm: { source: 'PIP PNC00001', assumptionLevel: AssumptionLevel.VERIFIED_PROJECT_REQUIREMENT, notes: 'Main spine 7.8m span' },
        heightMm: { source: 'PIP PNC00001', assumptionLevel: AssumptionLevel.VERIFIED_PROJECT_REQUIREMENT, notes: 'EL +8.0m top elevation' },
      },
      getLocalPorts: () => [
        {
          id: 'PORT_TIER_LOWER',
          name: 'Lower Top Tier IS Tray Seat (EL +6.35m)',
          localPosition: [0, 6350, 0],
          localDirection: [0, 1, 0],
          localUp: [1, 0, 0],
          width: 7800,
          depth: 250,
          connectionType: 'STRUCTURAL',
        },
        {
          id: 'PORT_TIER_UPPER',
          name: 'Upper Top Tier Non-IS Tray Seat (EL +7.15m)',
          localPosition: [0, 7150, 0],
          localDirection: [0, 1, 0],
          localUp: [1, 0, 0],
          width: 7800,
          depth: 250,
          connectionType: 'STRUCTURAL',
        },
      ],
      getCenterlineRoutes: () => [],
      getBounds: () => ({ min: [-3900, 0, -350], max: [3900, 8000, 350] }),
      subComponents: [
        { definitionId: 'STRUCT_COLUMN', instanceSuffix: 'COL_NORTH', relativePlacement: { position: [0, 4000, -3800], quaternion: [0, 0, 0, 1] }, isPurchasedSeparately: false },
        { definitionId: 'STRUCT_COLUMN', instanceSuffix: 'COL_SOUTH', relativePlacement: { position: [0, 4000, 3800], quaternion: [0, 0, 0, 1] }, isPurchasedSeparately: false },
        { definitionId: 'STRUCT_PIER', instanceSuffix: 'PIER_NORTH', relativePlacement: { position: [0, 200, -3800], quaternion: [0, 0, 0, 1] }, isPurchasedSeparately: false },
        { definitionId: 'STRUCT_PIER', instanceSuffix: 'PIER_SOUTH', relativePlacement: { position: [0, 200, 3800], quaternion: [0, 0, 0, 1] }, isPurchasedSeparately: false },
        { definitionId: 'STRUCT_CROSS_BEAM', instanceSuffix: 'BEAM_3M', relativePlacement: { position: [0, 3000, 0], quaternion: [0, 0, 0, 1] }, isPurchasedSeparately: false },
        { definitionId: 'STRUCT_CROSS_BEAM', instanceSuffix: 'BEAM_4_8M', relativePlacement: { position: [0, 4800, 0], quaternion: [0, 0, 0, 1] }, isPurchasedSeparately: false },
        { definitionId: 'STRUCT_CROSS_BEAM', instanceSuffix: 'BEAM_6_4M', relativePlacement: { position: [0, 6350, 0], quaternion: [0, 0, 0, 1] }, isPurchasedSeparately: false },
        { definitionId: 'STRUCT_CROSS_BEAM', instanceSuffix: 'BEAM_7_2M', relativePlacement: { position: [0, 7150, 0], quaternion: [0, 0, 0, 1] }, isPurchasedSeparately: false },
      ],
      buildGeometry: () => {
        const group = new THREE.Group();
        [-3.8, 3.8].forEach((z) => {
          const col = GeometryGenerators.buildStructuralColumn({ heightMm: 8000, widthMm: 350 });
          col.position.set(0, 4.0, z);
          const pier = GeometryGenerators.buildStructuralPier({ widthMm: 700, heightMm: 400 });
          pier.position.set(0, 0.2, z);
          group.add(col, pier);
        });
        [3.0, 4.8, 6.35, 7.15].forEach((ey) => {
          const bm = GeometryGenerators.buildStructuralCrossBeam({ spanMm: 7800 });
          bm.position.set(0, ey, 0);
          group.add(bm);
        });
        return group;
      },
    });

    // 32. STRUCT_BRANCH_BAY
    this.register({
      schemaVersion: '2.0.0',
      componentVersion: '1.0.0',
      id: 'STRUCT_BRANCH_BAY',
      name: 'Branch Pipe Rack Portal Bay Assembly',
      nameZh: '製程支管廊門型構架組合件',
      family: 'STRUCTURE_ASSEMBLY',
      origin: ComponentOrigin.DERIVED_ASSEMBLY,
      role: ComponentRole.STRUCTURE,
      description: 'Branch pipe rack portal bay with longitudinal stringers for lateral piping and tray feeds.',
      defaultParameters: {
        widthSpanMm: 2700,
        heightMm: 8000,
        stringerSpanMm: 6000,
      },
      provenance: {
        widthSpanMm: { source: 'Branch rack layout', assumptionLevel: AssumptionLevel.DEMO_DEFAULT, notes: '2.7m lateral width' },
      },
      getLocalPorts: () => [],
      getCenterlineRoutes: () => [],
      getBounds: () => ({ min: [-1500, 0, -3000], max: [1500, 8000, 3000] }),
      subComponents: [
        { definitionId: 'STRUCT_COLUMN', instanceSuffix: 'B_COL_L', relativePlacement: { position: [-1200, 4000, 0], quaternion: [0, 0, 0, 1] }, isPurchasedSeparately: false },
        { definitionId: 'STRUCT_COLUMN', instanceSuffix: 'B_COL_R', relativePlacement: { position: [1200, 4000, 0], quaternion: [0, 0, 0, 1] }, isPurchasedSeparately: false },
        { definitionId: 'STRUCT_CROSS_BEAM', instanceSuffix: 'B_BEAM_TOP', relativePlacement: { position: [0, 7150, 0], quaternion: [0, 0, 0, 1] }, isPurchasedSeparately: false },
        { definitionId: 'STRUCT_STRINGER', instanceSuffix: 'B_STR_L', relativePlacement: { position: [-1200, 7150, 0], quaternion: [0, 0, 0, 1] }, isPurchasedSeparately: false },
        { definitionId: 'STRUCT_STRINGER', instanceSuffix: 'B_STR_R', relativePlacement: { position: [1200, 7150, 0], quaternion: [0, 0, 0, 1] }, isPurchasedSeparately: false },
      ],
      buildGeometry: () => {
        const group = new THREE.Group();
        [-1.2, 1.2].forEach((bx) => {
          const col = GeometryGenerators.buildStructuralColumn({ heightMm: 8000, widthMm: 300 });
          col.position.set(bx, 4.0, 0);
          group.add(col);
        });
        [3.0, 4.8, 6.35, 7.15].forEach((ey) => {
          const bm = GeometryGenerators.buildStructuralCrossBeam({ spanMm: 2700 });
          bm.position.set(0, ey, 0);
          group.add(bm);
        });
        [6.35, 7.15].forEach((ey) => {
          const s1 = GeometryGenerators.buildStructuralStringer({ spanMm: 6000 });
          s1.position.set(-1.2, ey, 0);
          const s2 = GeometryGenerators.buildStructuralStringer({ spanMm: 6000 });
          s2.position.set(1.2, ey, 0);
          group.add(s1, s2);
        });
        return group;
      },
    });
  }
}
