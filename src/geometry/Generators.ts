/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import * as THREE from 'three';
import { Units } from '../core/Units.ts';
import { Materials } from './Materials.ts';
import {
  straightLayout,
  horizontalBendLayout,
  verticalBendLayout,
  teeLayout,
  crossLayout,
  reducerLayout,
  type TrayLayout,
} from './TrayLayouts.ts';
import { buildTrayLayoutGroup, type TrayMeshOptions } from './TrayMeshBuilder.ts';

/**
 * Procedural Geometry Generator for Parametric 3D Engineering Components.
 * Generates true 3D meshes with exact vertex placement from millimeter parameters.
 * Scale of all returned groups is strictly (1, 1, 1).
 *
 * Cable tray and fitting builders delegate to the single engineering formula layer
 * (TrayLayouts.ts): the mesh is built from the same layout object that produces the
 * component's ports, centerline routes and bounds.
 */
export class GeometryGenerators {
  /**
   * Builds the mesh group of any resolved tray layout.
   */
  static buildTrayLayout(layout: TrayLayout, options: TrayMeshOptions = {}): THREE.Group {
    return buildTrayLayoutGroup(layout, options);
  }

  /**
   * Straight ladder / ventilated-through tray (catalog PDF p.4, p.30, p.41).
   * Splice plates are optional small-accessory visuals (default off); they are tagged as
   * accessories and never count as tray body.
   */
  static buildStraightTray(params: {
    width: number; // mm
    depth: number; // mm
    length: number; // mm
    rungSpacing?: number; // mm
    hasSplicePlates?: boolean;
    hasDivider?: boolean;
    dividerHeight?: number;
    trayStyle?: string;
    isIS?: boolean;
  }): THREE.Group {
    return buildTrayLayoutGroup(straightLayout(params), { isIS: params.isIS });
  }

  /**
   * Builds an individual splice plate assembly (accessory visual).
   */
  static buildSplicePlateMesh(depthM: number = 0.1): THREE.Group {
    const group = new THREE.Group();
    const plate = new THREE.Mesh(
      new THREE.BoxGeometry(0.05, depthM - 0.02, 0.12),
      Materials.Support
    );
    group.add(plate);

    // Fastener bolts
    [-0.04, 0.04].forEach((z) => {
      const bolt = new THREE.Mesh(
        new THREE.CylinderGeometry(0.008, 0.008, 0.055, 8),
        Materials.Bolt
      );
      bolt.rotation.set(Math.PI / 2, 0, Math.PI / 2);
      bolt.position.set(0, 0, z);
      group.add(bolt);
    });

    return group;
  }

  static buildSplicePlate(params: { depth?: number } = {}): THREE.Group {
    const depthM = params.depth ? Units.mmToM(params.depth) : 0.1;
    return this.buildSplicePlateMesh(depthM);
  }

  /**
   * Builds a cantilever support bracket.
   */
  static buildCantileverSupport(params: {
    width?: number; // mm
    depth?: number; // mm
    armLength?: number; // mm
    channelHeight?: number; // mm
  }): THREE.Group {
    const group = new THREE.Group();
    const w = Units.mmToM(params.width || 600);
    const d = Units.mmToM(params.depth || 100);
    const armLen = Units.mmToM(params.armLength || (params.width ? params.width + 150 : 750));

    // C-channel horizontal arm
    const arm = new THREE.Mesh(
      new THREE.BoxGeometry(armLen, 0.04, 0.04),
      Materials.Support
    );
    arm.position.set(armLen / 2 - w / 2 - 0.05, -d / 2 - 0.02, 0);

    // Vertical mounting backplate
    const backplate = new THREE.Mesh(
      new THREE.BoxGeometry(0.02, 0.25, 0.06),
      Materials.Support
    );
    backplate.position.set(-w / 2 - 0.06, -d / 2 - 0.02 - 0.1, 0);

    // Hold-down clamps
    const clampL = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.01, 0.04), Materials.Bolt);
    clampL.position.set(-w / 2, -d / 2 + 0.005, 0);
    const clampR = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.01, 0.04), Materials.Bolt);
    clampR.position.set(w / 2, -d / 2 + 0.005, 0);

    group.add(arm, backplate, clampL, clampR);
    return group;
  }

  /**
   * Horizontal elbow of any angle (catalog PDF p.5–8). `radius` is the catalog inner radius R;
   * the routing centerline radius is R + W/2. Optional straight tangents (catalog 125 mm).
   */
  static buildHorizontalElbow(params: {
    width: number; // mm
    depth: number; // mm
    radius: number; // mm (catalog inner radius R)
    angleDeg: number; // deg (e.g. 30, 45, 60, 90)
    tangentLength?: number; // mm
    trayStyle?: string;
    isIS?: boolean;
  }): THREE.Group {
    return buildTrayLayoutGroup(horizontalBendLayout(params, params.angleDeg ?? 90), { isIS: params.isIS });
  }

  /**
   * Horizontal Tee (catalog PDF p.9): radius-R curved transitions from the main run into the
   * branch, 125 mm tangents. Main span = W + 2R + 2T, branch projection = W/2 + R + T.
   */
  static buildHorizontalTee(params: {
    width: number; // mm
    depth: number; // mm
    radius?: number; // mm (catalog inner radius R)
    tangentLength?: number; // mm
    length?: number; // mm (legacy alias: main span)
    branchLength?: number; // mm (legacy alias: branch projection)
    trayStyle?: string;
    isIS?: boolean;
  }): THREE.Group {
    return buildTrayLayoutGroup(teeLayout(params), { isIS: params.isIS });
  }

  /**
   * Vertical inside (rising, p.11–14) or outside (falling, p.15–18) bend.
   * `radius` is the catalog inner radius R; the routing centerline radius is R + H/2.
   */
  static buildVerticalRiser(params: {
    width: number; // mm
    depth: number; // mm
    radius: number; // mm (catalog inner radius R)
    angleDeg: number; // deg
    tangentLength?: number; // mm
    isOutside?: boolean;
    trayStyle?: string;
    isIS?: boolean;
  }): THREE.Group {
    return buildTrayLayoutGroup(verticalBendLayout(params, params.angleDeg ?? 90, !!params.isOutside), {
      isIS: params.isIS,
    });
  }

  /**
   * Centre, left or right reducer (catalog PDF p.19–21): T straight at W1, taper, T straight at W2.
   * LEFT keeps the left rail straight when viewed from the wide end toward the narrow end.
   */
  static buildReducer(params: {
    inletWidth: number; // mm (Port A)
    outletWidth: number; // mm (Port B)
    depth: number; // mm
    length: number; // mm
    tangentLength?: number; // mm
    type: 'CONCENTRIC' | 'LEFT' | 'RIGHT';
    trayStyle?: string;
    isIS?: boolean;
  }): THREE.Group {
    return buildTrayLayoutGroup(reducerLayout(params, params.type), { isIS: params.isIS });
  }


  /**
   * Junction Box (Ex d / Ex e industrial enclosure).
   */
  static buildJunctionBox(params: {
    width: number; // mm (default 550)
    height: number; // mm (default 750)
    depth: number; // mm (default 350)
    boxType: 'IS' | 'NON_IS' | 'FIBER';
  }): THREE.Group {
    const group = new THREE.Group();
    const w = Units.mmToM(params.width);
    const h = Units.mmToM(params.height);
    const d = Units.mmToM(params.depth);

    let mat = Materials.JbIS;
    if (params.boxType === 'NON_IS') mat = Materials.JbNonIS;
    if (params.boxType === 'FIBER') mat = Materials.JbFiber;

    // Enclosure body
    const body = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat);
    body.castShadow = true;
    group.add(body);

    // Unistrut mounting bracket on back
    const bracket = new THREE.Mesh(
      new THREE.BoxGeometry(0.12, h + 0.1, 0.08),
      Materials.Support
    );
    bracket.position.set(0, 0, d / 2 + 0.04);
    group.add(bracket);

    // Bottom cable gland entries
    [-w / 4, 0, w / 4].forEach((x) => {
      const gland = new THREE.Mesh(
        new THREE.CylinderGeometry(0.02, 0.02, 0.06, 12),
        Materials.Bolt
      );
      gland.position.set(x, -h / 2 - 0.03, 0);
      group.add(gland);
    });

    return group;
  }

  /**
   * Unistrut channel clamp / mounting bracket.
   */
  static buildUnistrutMount(params: {
    length: number; // mm
  }): THREE.Group {
    const group = new THREE.Group();
    const l = Units.mmToM(params.length);
    const channel = new THREE.Mesh(new THREE.BoxGeometry(0.041, l, 0.041), Materials.Support);
    group.add(channel);
    return group;
  }

  /**
   * Rigid Steel Conduit riser pipe.
   */
  static buildConduitRiser(params: {
    diameterMm: number; // e.g. 50mm
    lengthMm: number; // e.g. 5000mm
  }): THREE.Group {
    const group = new THREE.Group();
    const r = Units.mmToM(params.diameterMm) / 2;
    const l = Units.mmToM(params.lengthMm);

    const pipe = new THREE.Mesh(new THREE.CylinderGeometry(r, r, l, 16), Materials.Conduit);
    pipe.castShadow = true;
    group.add(pipe);
    return group;
  }

  /**
   * MCT Penetration Transit Frame (Roxtec RG M6x1 style).
   */
  static buildMctPenetration(params: {
    widthMm: number; // e.g. 600
    heightMm: number; // e.g. 900
    thicknessMm: number; // e.g. 400
  }): THREE.Group {
    const group = new THREE.Group();
    const w = Units.mmToM(params.widthMm);
    const h = Units.mmToM(params.heightMm);
    const t = Units.mmToM(params.thicknessMm);

    // Outer frame
    const frame = new THREE.Mesh(new THREE.BoxGeometry(t, h, w), Materials.MctFrame);
    frame.castShadow = true;
    group.add(frame);

    // Grid inserts (elastomeric sealing modules)
    const insertMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.9 });
    const insert = new THREE.Mesh(new THREE.BoxGeometry(t + 0.02, h * 0.8, w * 0.8), insertMat);
    group.add(insert);

    return group;
  }

  /**
   * Control Cabinet (DCS / SIS / COM marshalling rack).
   */
  static buildControlCabinet(params: {
    widthMm: number; // e.g. 1000
    heightMm: number; // e.g. 2200
    depthMm: number; // e.g. 800
    stripeColorHex: number;
  }): THREE.Group {
    const group = new THREE.Group();
    const w = Units.mmToM(params.widthMm);
    const h = Units.mmToM(params.heightMm);
    const d = Units.mmToM(params.depthMm);

    const body = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), Materials.CabinetBody);
    body.castShadow = true;
    group.add(body);

    // Front color stripe
    const stripe = new THREE.Mesh(
      new THREE.BoxGeometry(0.02, 0.2, d * 0.85),
      new THREE.MeshBasicMaterial({ color: params.stripeColorHex })
    );
    stripe.position.set(-w / 2 - 0.01, h / 2 - 0.3, 0);
    group.add(stripe);

    return group;
  }

  /**
   * Structural H-Beam Steel Column.
   */
  static buildStructuralColumn(params: {
    heightMm: number; // e.g. 8000
    widthMm?: number; // e.g. 350
  }): THREE.Group {
    const group = new THREE.Group();
    const h = Units.mmToM(params.heightMm);
    const w = Units.mmToM(params.widthMm || 350);

    const col = new THREE.Mesh(new THREE.BoxGeometry(w, h, w), Materials.ColumnSteel);
    col.position.y = h / 2;
    col.castShadow = true;
    group.add(col);
    return group;
  }

  /**
   * Structural Concrete Pier foundation.
   */
  static buildStructuralPier(params: {
    widthMm?: number; // e.g. 700
    heightMm?: number; // e.g. 400
  }): THREE.Group {
    const group = new THREE.Group();
    const w = Units.mmToM(params.widthMm || 700);
    const h = Units.mmToM(params.heightMm || 400);

    const pier = new THREE.Mesh(new THREE.BoxGeometry(w, h, w), Materials.ConcretePier);
    pier.position.y = h / 2;
    pier.receiveShadow = true;
    group.add(pier);
    return group;
  }

  /**
   * Structural Cross Beam (transverse pipe rack support).
   */
  static buildStructuralCrossBeam(params: {
    spanMm: number; // e.g. 7800
    heightMm?: number; // e.g. 250
    depthMm?: number; // e.g. 180
  }): THREE.Group {
    const group = new THREE.Group();
    const span = Units.mmToM(params.spanMm);
    const h = Units.mmToM(params.heightMm || 250);
    const d = Units.mmToM(params.depthMm || 180);

    const bm = new THREE.Mesh(new THREE.BoxGeometry(d, h, span), Materials.ColumnSteel);
    group.add(bm);
    return group;
  }

  /**
   * Structural Longitudinal Stringer Beam.
   */
  static buildStructuralStringer(params: {
    spanMm: number; // e.g. 6000
  }): THREE.Group {
    const group = new THREE.Group();
    const span = Units.mmToM(params.spanMm);
    const bm = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.15, span), Materials.BranchColumnSteel);
    group.add(bm);
    return group;
  }

  /**
   * Process & Steam Piping obstacle models.
   */
  static buildPipe(params: {
    diameterMm: number; // e.g. 600mm
    lengthMm: number; // e.g. 27000mm
    isSteam?: boolean;
    axis?: 'X' | 'Z';
  }): THREE.Group {
    const group = new THREE.Group();
    const r = Units.mmToM(params.diameterMm) / 2;
    const l = Units.mmToM(params.lengthMm);
    const mat = params.isSteam ? Materials.SteamPipe : Materials.ProcessPipe;

    const pipe = new THREE.Mesh(new THREE.CylinderGeometry(r, r, l, 24), mat);
    if (params.axis === 'Z') {
      pipe.rotation.x = Math.PI / 2;
    } else {
      pipe.rotation.z = Math.PI / 2;
    }
    pipe.castShadow = true;
    group.add(pipe);
    return group;
  }

  /**
   * Thermal Hazard Zone obstacle envelope.
   */
  static buildHazardZone(params: {
    widthMm: number;
    heightMm: number;
    depthMm: number;
  }): THREE.Group {
    const group = new THREE.Group();
    const w = Units.mmToM(params.widthMm);
    const h = Units.mmToM(params.heightMm);
    const d = Units.mmToM(params.depthMm);

    const mesh = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), Materials.HazardMesh);
    const wire = new THREE.BoxHelper(mesh, 0xf87171);
    group.add(mesh, wire);
    return group;
  }

  /**
   * Control Room Building and Raised Floor Context.
   */
  static buildBuildingContext(params: {
    widthMm: number;
    heightMm: number;
    depthMm: number;
  }): THREE.Group {
    const group = new THREE.Group();
    const w = Units.mmToM(params.widthMm);
    const h = Units.mmToM(params.heightMm);
    const d = Units.mmToM(params.depthMm);

    const room = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), Materials.BuildingWall);
    const floor = new THREE.Mesh(new THREE.BoxGeometry(w * 0.98, 0.4, d * 0.98), Materials.RaisedFloor);
    floor.position.y = -h / 2 + 0.2;

    group.add(room, floor);
    return group;
  }

  /**
   * Visual Cable Bundle with flowing glow effect.
   */
  static buildVisualCable(params: {
    pathPoints: Array<[number, number, number]>; // mm
    radiusMm?: number;
    colorHex?: number;
    emissiveHex?: number;
  }): THREE.Group {
    const group = new THREE.Group();
    if (params.pathPoints.length < 2) return group;

    const vectors = params.pathPoints.map(
      (p) => new THREE.Vector3(Units.mmToM(p[0]), Units.mmToM(p[1]), Units.mmToM(p[2]))
    );
    const curve = new THREE.CatmullRomCurve3(vectors);
    const radius = Units.mmToM(params.radiusMm || 25);

    const tubeGeo = new THREE.TubeGeometry(curve, 64, radius, 12, false);
    const mat = Materials.createCableMaterial(params.colorHex || 0x06b6d4, params.emissiveHex || 0x00aaff);
    const mesh = new THREE.Mesh(tubeGeo, mat);
    group.add(mesh);
    return group;
  }

  /**
   * Horizontal Cross (catalog PDF p.10): four radius-R curved corners, 125 mm tangents,
   * span = W + 2R + 2T along both axes.
   */
  static buildHorizontalCross(params: {
    width: number; // mm
    depth: number; // mm
    radius?: number; // mm (catalog inner radius R)
    length?: number; // mm (legacy alias: full span)
    tangentLength?: number; // mm
    trayStyle?: string;
    isIS?: boolean;
  }): THREE.Group {
    return buildTrayLayoutGroup(crossLayout(params), { isIS: params.isIS });
  }
}
