/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import * as THREE from 'three';
import {
  AssumptionLevel,
  BomScope,
  ComponentOrigin,
  ComponentRole,
  type ComponentDefinition,
} from '../core/Schema.ts';
import { GeometryGenerators } from '../geometry/Generators.ts';
import {
  straightTrayDefinition,
  dividedStraightTrayDefinition,
  horizontalElbowDefinition,
  verticalBendDefinition,
  teeDefinition,
  crossDefinition,
  reducerDefinition,
} from './TrayComponentFamilies.ts';

/**
 * Single Canonical Component Registry for MCR-Studio.
 *
 * Cable trays and fittings are defined by family factories (TrayComponentFamilies.ts) that read
 * ONE engineering layout per component (geometry/TrayLayouts.ts). Structural, equipment,
 * obstacle and visual components are defined inline below.
 */
export class ComponentRegistry {
  private static _definitions: Map<string, ComponentDefinition> = new Map();

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
    // Engineering Definition is the independent Source of Truth.
    // getBounds() remains purely deterministic data/math calculation without Three.js Mesh dependency.
    this._definitions.set(def.id, def);
  }

  public static initAll(): void {
    this._definitions.clear();

    // -------------------------------------------------------------
    // 1. LEGACY_FITTING_LIBRARY
    // -------------------------------------------------------------

    // 1. TRAY_STRAIGHT (vendor PDF p.4 / p.30 / p.41)
    this.register(straightTrayDefinition());

    // 2. TRAY_STRAIGHT_DIVIDER (vendor PDF p.25 separator plate)
    this.register(dividedStraightTrayDefinition());

    // 3. FITTING_SPLICE_PLATE
    this.register({
      schemaVersion: '2.0.0',
      componentVersion: '1.0.0',
      id: 'FITTING_SPLICE_PLATE',
      name: 'Standard Splice Plate Connection Kit',
      nameZh: '標準連接壓板組件 (含搭接螺栓)',
      family: 'ACCESSORY',
      origin: ComponentOrigin.LEGACY_FITTING_LIBRARY,
      role: ComponentRole.SUPPORT,
      description: 'Factory-formed bolted steel splice plates connecting adjacent tray side rails.',
      hasBomMetadata: true,
      bomScope: BomScope.MCR_CABLE_TRAY_BOM,
      includedInMcrBom: true,
      defaultParameters: {
        depth: 100,
        length: 200,
        boltCount: 4,
      },
      provenance: {
        length: { source: 'Oglaend standard splice plate SP-100', assumptionLevel: AssumptionLevel.DEMO_DEFAULT, notes: '200mm length' },
      },
      getLocalPorts: (params) => [
        {
          id: 'PORT_L_RAIL',
          name: 'Left Rail Connection',
          localPosition: [-300, 0, 0],
          localDirection: [-1, 0, 0],
          localUp: [0, 1, 0],
          width: 20,
          depth: params.depth || 100,
          connectionType: 'STRUCTURAL',
        },
        {
          id: 'PORT_R_RAIL',
          name: 'Right Rail Connection',
          localPosition: [300, 0, 0],
          localDirection: [1, 0, 0],
          localUp: [0, 1, 0],
          width: 20,
          depth: params.depth || 100,
          connectionType: 'STRUCTURAL',
        },
      ],
      getCenterlineRoutes: () => [],
      getBounds: (params) => ({
        min: [-310, -(params.depth || 100) / 2, -(params.length || 200) / 2],
        max: [310, (params.depth || 100) / 2, (params.length || 200) / 2],
      }),
      buildGeometry: (params) => GeometryGenerators.buildSplicePlate(params as any),
    });

    // 4. SUPPORT_CANTILEVER
    this.register({
      schemaVersion: '2.0.0',
      componentVersion: '1.0.0',
      id: 'SUPPORT_CANTILEVER',
      name: 'Cantilever Tray Support Arm',
      nameZh: '懸臂式托架支撐臂',
      family: 'SUPPORT',
      origin: ComponentOrigin.LEGACY_FITTING_LIBRARY,
      role: ComponentRole.SUPPORT,
      description: 'Structural steel cantilever bracket bolted to pipe rack columns to carry cable trays.',
      hasBomMetadata: true,
      bomScope: BomScope.MCR_CABLE_TRAY_BOM,
      includedInMcrBom: true,
      defaultParameters: {
        armLength: 750,
        channelHeight: 120,
        thickness: 45,
      },
      provenance: {
        armLength: { source: 'Standard 600mm tray support clearance', assumptionLevel: AssumptionLevel.DEMO_DEFAULT, notes: '750mm arm length' },
      },
      getLocalPorts: (params) => [
        {
          id: 'PORT_BASE',
          name: 'Column Mounting Plate',
          localPosition: [0, 0, 0],
          localDirection: [-1, 0, 0],
          localUp: [0, 1, 0],
          width: 80,
          depth: 160,
          connectionType: 'STRUCTURAL',
        },
        {
          id: 'PORT_TRAY_SEAT',
          name: 'Tray Seating Surface',
          localPosition: [(params.armLength || 750) / 2, (params.channelHeight || 120) / 2, 0],
          localDirection: [0, 1, 0],
          localUp: [1, 0, 0],
          width: params.armLength || 750,
          depth: 45,
          connectionType: 'STRUCTURAL',
        },
      ],
      getCenterlineRoutes: () => [],
      getBounds: (params) => ({
        min: [0, -(params.channelHeight || 120) / 2, -25],
        max: [params.armLength || 750, (params.channelHeight || 120) / 2, 25],
      }),
      buildGeometry: (params) => GeometryGenerators.buildCantileverSupport(params as any),
    });

    // 5. FITTING_ELBOW_90 (vendor PDF p.5, p.31, p.42)
    this.register(horizontalElbowDefinition('FITTING_ELBOW_90', 90, ComponentOrigin.LEGACY_FITTING_LIBRARY, 'PDF p.5 / p.31 / p.42'));

    // 6. FITTING_TEE (vendor PDF p.9, p.33)
    this.register(teeDefinition());

    // 7. FITTING_RISER_IN_90 (vendor PDF p.11, p.34, p.44)
    this.register(verticalBendDefinition('FITTING_RISER_IN_90', 90, false, ComponentOrigin.LEGACY_FITTING_LIBRARY, 'PDF p.11 / p.34 / p.44'));

    // 8. FITTING_RISER_OUT_90 (vendor PDF p.15, p.35, p.45)
    this.register(verticalBendDefinition('FITTING_RISER_OUT_90', 90, true, ComponentOrigin.LEGACY_FITTING_LIBRARY, 'PDF p.15 / p.35 / p.45'));

    // -------------------------------------------------------------
    // 2. LEGACY_MCR_PROTOTYPE (16 items)
    // -------------------------------------------------------------

    // 9. EQUIP_JUNCTION_BOX
    this.register({
      schemaVersion: '2.0.0',
      componentVersion: '1.0.0',
      id: 'EQUIP_JUNCTION_BOX',
      name: 'Explosion-Proof Junction Box (Ex d)',
      nameZh: '防爆儀表接線箱 (JB)',
      family: 'EQUIPMENT',
      origin: ComponentOrigin.LEGACY_MCR_PROTOTYPE,
      role: ComponentRole.EQUIPMENT,
      description: 'NEMA 4X / Ex d cast aluminum junction box mounted on structural steel column.',
      hasBomMetadata: true,
      bomScope: BomScope.MCR_TERMINATION_BOM,
      includedInMcrBom: true,
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
      hasBomMetadata: true,
      bomScope: BomScope.MCR_CABLE_TRAY_BOM,
      includedInMcrBom: true,
      defaultParameters: { length: 850 },
      provenance: {
        length: { source: 'Unistrut P1000 standard', assumptionLevel: AssumptionLevel.DEMO_DEFAULT, notes: '41x41mm channel' },
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
      hasBomMetadata: true,
      bomScope: BomScope.MCR_TERMINATION_BOM,
      includedInMcrBom: true,
      defaultParameters: { diameterMm: 50, lengthMm: 5000 },
      provenance: {
        diameterMm: { source: 'ANSI C80.1 2-inch RGS', assumptionLevel: AssumptionLevel.DEMO_DEFAULT, notes: '50mm OD' },
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
      description: 'Multi-cable transit frame with elastomeric insert modules and wedge seal.',
      hasBomMetadata: true,
      bomScope: BomScope.MCR_TERMINATION_BOM,
      includedInMcrBom: true,
      defaultParameters: {
        widthMm: 600,
        heightMm: 900,
        thicknessMm: 400,
      },
      provenance: {
        widthMm: { source: 'Roxtec RG M6x1 sizing standard', assumptionLevel: AssumptionLevel.DEMO_DEFAULT, notes: '600x900mm frame' },
        thicknessMm: { source: 'Concrete wall sleeve depth', assumptionLevel: AssumptionLevel.DEMO_DEFAULT, notes: '400mm wall thickness' },
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
      hasBomMetadata: true,
      bomScope: BomScope.MCR_TERMINATION_BOM,
      includedInMcrBom: true,
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
      hasBomMetadata: true,
      bomScope: BomScope.STRUCTURAL_REF,
      includedInMcrBom: false,
      defaultParameters: { heightMm: 8000, widthMm: 350 },
      provenance: {
        heightMm: { source: 'Pipe rack standard elevation design', assumptionLevel: AssumptionLevel.DEMO_DEFAULT, notes: 'Reaches EL +8.0m' },
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
      hasBomMetadata: true,
      bomScope: BomScope.STRUCTURAL_REF,
      includedInMcrBom: false,
      defaultParameters: { widthMm: 700, heightMm: 400 },
      provenance: {
        heightMm: { source: 'Civil pedestal detail', assumptionLevel: AssumptionLevel.DEMO_DEFAULT, notes: '400mm above ground' },
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
      hasBomMetadata: true,
      bomScope: BomScope.STRUCTURAL_REF,
      includedInMcrBom: false,
      defaultParameters: { spanMm: 7800, heightMm: 250, depthMm: 180 },
      provenance: {
        spanMm: { source: 'Main Pipe Rack standard width', assumptionLevel: AssumptionLevel.DEMO_DEFAULT, notes: '7.8m transversal span' },
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
      description: 'Longitudinal steel stringer connecting transverse bays.',
      hasBomMetadata: true,
      bomScope: BomScope.STRUCTURAL_REF,
      includedInMcrBom: false,
      defaultParameters: { spanMm: 6000 },
      provenance: { spanMm: { source: 'Bay longitudinal spacing', assumptionLevel: AssumptionLevel.DEMO_DEFAULT, notes: '6.0m typical bay' } },
      getLocalPorts: () => [],
      getCenterlineRoutes: () => [],
      getBounds: (params) => ({ min: [-100, -75, -(params.spanMm || 6000) / 2], max: [100, 75, (params.spanMm || 6000) / 2] }),
      buildGeometry: (params) => GeometryGenerators.buildStructuralStringer(params as any),
    });

    // 18. OBSTACLE_MAIN_PROCESS_PIPE
    this.register({
      schemaVersion: '2.0.0',
      componentVersion: '1.0.0',
      id: 'OBSTACLE_MAIN_PROCESS_PIPE',
      name: 'Main Pipe Rack Process Line (Hydrocarbon)',
      nameZh: '主管廊碳氫製程管線',
      family: 'OBSTACLE',
      origin: ComponentOrigin.LEGACY_MCR_PROTOTYPE,
      role: ComponentRole.OBSTACLE,
      description: 'Heavy 500mm process pipeline running along EL +3.0m requiring minimum clearance.',
      hasBomMetadata: true,
      bomScope: BomScope.PROCESS_PIPING_REF,
      includedInMcrBom: false,
      defaultParameters: { diameterMm: 500, lengthMm: 27000, clearanceMm: 150 },
      provenance: { diameterMm: { source: 'Process sizing estimate', assumptionLevel: AssumptionLevel.DEMO_DEFAULT, notes: '500mm OD pipe' } },
      getLocalPorts: () => [],
      getCenterlineRoutes: () => [],
      getBounds: (params) => {
        const r = (params.diameterMm || 500) / 2;
        const buf = params.clearanceMm || 150;
        return {
          min: [-(params.lengthMm || 27000) / 2, -r, -r],
          max: [(params.lengthMm || 27000) / 2, r, r],
          clearanceEnvelope: {
            min: [-(params.lengthMm || 27000) / 2, -r - buf, -r - buf],
            max: [(params.lengthMm || 27000) / 2, r + buf, r + buf],
            reason: 'Flammable process line minimum clearance',
            bufferMm: buf,
          },
        };
      },
      buildGeometry: (params) => GeometryGenerators.buildPipe({ ...params, isSteam: false, axis: 'X' } as any),
    });

    // 19. OBSTACLE_MAIN_STEAM_PIPE
    this.register({
      schemaVersion: '2.0.0',
      componentVersion: '1.0.0',
      id: 'OBSTACLE_MAIN_STEAM_PIPE',
      name: 'High-Pressure Steam Header Pipe',
      nameZh: '主管廊高壓蒸汽管線',
      family: 'OBSTACLE',
      origin: ComponentOrigin.LEGACY_MCR_PROTOTYPE,
      role: ComponentRole.OBSTACLE,
      description: 'Thermal steam pipe with orange insulation and 250mm thermal radiant buffer envelope.',
      hasBomMetadata: true,
      bomScope: BomScope.PROCESS_PIPING_REF,
      includedInMcrBom: false,
      defaultParameters: { diameterMm: 480, lengthMm: 27000, clearanceMm: 250 },
      provenance: { diameterMm: { source: 'HP steam header sizing', assumptionLevel: AssumptionLevel.DEMO_DEFAULT, notes: '480mm insulated OD' } },
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
      hasBomMetadata: true,
      bomScope: BomScope.PROCESS_PIPING_REF,
      includedInMcrBom: false,
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
      hasBomMetadata: true,
      bomScope: BomScope.PROCESS_PIPING_REF,
      includedInMcrBom: false,
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
      hasBomMetadata: false,
      bomScope: BomScope.PROCESS_PIPING_REF,
      includedInMcrBom: false,
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
      hasBomMetadata: false,
      bomScope: BomScope.STRUCTURAL_REF,
      includedInMcrBom: false,
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
      hasBomMetadata: false,
      bomScope: BomScope.VISUAL_ONLY,
      includedInMcrBom: false,
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

    // 25. FITTING_ELBOW_45 (vendor PDF p.7, p.32)
    this.register(horizontalElbowDefinition('FITTING_ELBOW_45', 45, ComponentOrigin.NEW_COMPONENT, 'PDF p.7 / p.32'));

    // 25b. FITTING_ELBOW_60 (vendor PDF p.6)
    this.register(horizontalElbowDefinition('FITTING_ELBOW_60', 60, ComponentOrigin.NEW_COMPONENT, 'PDF p.6'));

    // 25c. FITTING_ELBOW_30 (vendor PDF p.8, p.43)
    this.register(horizontalElbowDefinition('FITTING_ELBOW_30', 30, ComponentOrigin.NEW_COMPONENT, 'PDF p.8 / p.43'));

    // 26. FITTING_RISER_IN_45 (vendor PDF p.13)
    this.register(verticalBendDefinition('FITTING_RISER_IN_45', 45, false, ComponentOrigin.NEW_COMPONENT, 'PDF p.13'));

    // 26b. FITTING_RISER_IN_60 / 30 (vendor PDF p.12 / p.14)
    this.register(verticalBendDefinition('FITTING_RISER_IN_60', 60, false, ComponentOrigin.NEW_COMPONENT, 'PDF p.12'));
    this.register(verticalBendDefinition('FITTING_RISER_IN_30', 30, false, ComponentOrigin.NEW_COMPONENT, 'PDF p.14'));

    // 27. FITTING_RISER_OUT_45 (vendor PDF p.17)
    this.register(verticalBendDefinition('FITTING_RISER_OUT_45', 45, true, ComponentOrigin.NEW_COMPONENT, 'PDF p.17'));

    // 27b. FITTING_RISER_OUT_60 / 30 (vendor PDF p.16 / p.18)
    this.register(verticalBendDefinition('FITTING_RISER_OUT_60', 60, true, ComponentOrigin.NEW_COMPONENT, 'PDF p.16'));
    this.register(verticalBendDefinition('FITTING_RISER_OUT_30', 30, true, ComponentOrigin.NEW_COMPONENT, 'PDF p.18'));

    // 28. FITTING_REDUCER_LEFT (vendor PDF p.20)
    this.register(
      reducerDefinition('FITTING_REDUCER_LEFT', 'LEFT', {
        name: 'Left Reducer',
        nameZh: '左偏異徑接頭',
        page: 'PDF p.20',
      })
    );

    // 29. FITTING_REDUCER_CENTER (vendor PDF p.19)
    this.register(
      reducerDefinition('FITTING_REDUCER_CENTER', 'CONCENTRIC', {
        name: 'Center Reducer',
        nameZh: '中間異徑接頭',
        page: 'PDF p.19',
      })
    );

    // 30. FITTING_REDUCER_RIGHT (vendor PDF p.21)
    this.register(
      reducerDefinition('FITTING_REDUCER_RIGHT', 'RIGHT', {
        name: 'Right Reducer',
        nameZh: '右偏異徑接頭',
        page: 'PDF p.21',
      })
    );

    // 31. FITTING_CROSS (vendor PDF p.10)
    this.register(crossDefinition());

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
      description: 'Engineered 4-tier steel portal frame bay assembly comprising 2 columns, 2 piers, and 4 transverse cross beams.',
      hasBomMetadata: true,
      bomScope: BomScope.STRUCTURAL_REF,
      includedInMcrBom: false,
      defaultParameters: {
        widthSpanMm: 7800,
        heightMm: 8000,
      },
      provenance: {
        widthSpanMm: { source: 'Main spine 7.8m span', assumptionLevel: AssumptionLevel.DEMO_DEFAULT, notes: 'Main spine 7.8m span' },
        heightMm: { source: 'Pipe rack standard elevation', assumptionLevel: AssumptionLevel.DEMO_DEFAULT, notes: 'EL +8.0m top elevation' },
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
      getBounds: () => ({ min: [-350, 0, -4150], max: [350, 8000, 4150] }),
      subComponents: [
        { definitionId: 'STRUCT_COLUMN', instanceSuffix: 'COL_NORTH', relativePlacement: { position: [0, 0, -3800], quaternion: [0, 0, 0, 1] }, isPurchasedSeparately: false },
        { definitionId: 'STRUCT_COLUMN', instanceSuffix: 'COL_SOUTH', relativePlacement: { position: [0, 0, 3800], quaternion: [0, 0, 0, 1] }, isPurchasedSeparately: false },
        { definitionId: 'STRUCT_PIER', instanceSuffix: 'PIER_NORTH', relativePlacement: { position: [0, 0, -3800], quaternion: [0, 0, 0, 1] }, isPurchasedSeparately: false },
        { definitionId: 'STRUCT_PIER', instanceSuffix: 'PIER_SOUTH', relativePlacement: { position: [0, 0, 3800], quaternion: [0, 0, 0, 1] }, isPurchasedSeparately: false },
        { definitionId: 'STRUCT_CROSS_BEAM', instanceSuffix: 'BEAM_3M', relativePlacement: { position: [0, 3000, 0], quaternion: [0, 0, 0, 1] }, isPurchasedSeparately: false },
        { definitionId: 'STRUCT_CROSS_BEAM', instanceSuffix: 'BEAM_4_8M', relativePlacement: { position: [0, 4800, 0], quaternion: [0, 0, 0, 1] }, isPurchasedSeparately: false },
        { definitionId: 'STRUCT_CROSS_BEAM', instanceSuffix: 'BEAM_6_4M', relativePlacement: { position: [0, 6350, 0], quaternion: [0, 0, 0, 1] }, isPurchasedSeparately: false },
        { definitionId: 'STRUCT_CROSS_BEAM', instanceSuffix: 'BEAM_7_2M', relativePlacement: { position: [0, 7150, 0], quaternion: [0, 0, 0, 1] }, isPurchasedSeparately: false },
      ],
      buildGeometry: () => {
        const group = new THREE.Group();
        [-3.8, 3.8].forEach((z) => {
          const col = GeometryGenerators.buildStructuralColumn({ heightMm: 8000, widthMm: 350 });
          col.position.set(0, 0, z);
          const pier = GeometryGenerators.buildStructuralPier({ widthMm: 700, heightMm: 400 });
          pier.position.set(0, 0, z);
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
      hasBomMetadata: true,
      bomScope: BomScope.STRUCTURAL_REF,
      includedInMcrBom: false,
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
      getBounds: () => ({ min: [-1350, 0, -3000], max: [1350, 8000, 3000] }),
      subComponents: [
        { definitionId: 'STRUCT_COLUMN', instanceSuffix: 'B_COL_L', relativePlacement: { position: [-1200, 0, 0], quaternion: [0, 0, 0, 1] }, isPurchasedSeparately: false },
        { definitionId: 'STRUCT_COLUMN', instanceSuffix: 'B_COL_R', relativePlacement: { position: [1200, 0, 0], quaternion: [0, 0, 0, 1] }, isPurchasedSeparately: false },
        { definitionId: 'STRUCT_CROSS_BEAM', instanceSuffix: 'B_BEAM_TOP', relativePlacement: { position: [0, 7150, 0], quaternion: [0, 0, 0, 1] }, isPurchasedSeparately: false },
        { definitionId: 'STRUCT_STRINGER', instanceSuffix: 'B_STR_L', relativePlacement: { position: [-1200, 7150, 0], quaternion: [0, 0, 0, 1] }, isPurchasedSeparately: false },
        { definitionId: 'STRUCT_STRINGER', instanceSuffix: 'B_STR_R', relativePlacement: { position: [1200, 7150, 0], quaternion: [0, 0, 0, 1] }, isPurchasedSeparately: false },
      ],
      buildGeometry: () => {
        const group = new THREE.Group();
        [-1.2, 1.2].forEach((bx) => {
          const col = GeometryGenerators.buildStructuralColumn({ heightMm: 8000, widthMm: 300 });
          col.position.set(bx, 0, 0);
          group.add(col);
        });
        const crossBeam = GeometryGenerators.buildStructuralCrossBeam({ spanMm: 2700 });
        crossBeam.position.set(0, 7.15, 0);
        crossBeam.rotation.y = Math.PI / 2;
        group.add(crossBeam);

        [-1.2, 1.2].forEach((sx) => {
          const str = GeometryGenerators.buildStructuralStringer({ spanMm: 6000 });
          str.position.set(sx, 7.15, 0);
          group.add(str);
        });
        return group;
      },
    });
  }
}
