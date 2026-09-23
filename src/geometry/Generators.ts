/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import * as THREE from 'three';
import { Units } from '../core/Units.ts';
import { Materials } from './Materials.ts';

/**
 * Procedural Geometry Generator for Parametric 3D Engineering Components.
 * Generates true 3D meshes with exact vertex placement from millimeter parameters.
 * Scale of all returned groups is strictly (1, 1, 1).
 */
export class GeometryGenerators {
  /**
   * Builds a straight ladder tray with rungs and end splice plates.
   */
  static buildStraightTray(params: {
    width: number; // mm
    depth: number; // mm
    length: number; // mm
    rungSpacing?: number; // mm
    hasSplicePlates?: boolean;
    hasDivider?: boolean;
    isIS?: boolean;
  }): THREE.Group {
    const group = new THREE.Group();
    const w = Units.mmToM(params.width);
    const d = Units.mmToM(params.depth);
    const l = Units.mmToM(params.length);
    const t = 0.04; // 40mm rail flange/thickness
    const rungSpacingM = Units.mmToM(params.rungSpacing || 250);
    const mat = params.isIS ? Materials.TrayIS : Materials.Tray;

    // Left and right side rails
    const railGeo = new THREE.BoxGeometry(t, d, l);
    const railL = new THREE.Mesh(railGeo, mat);
    railL.position.set(-w / 2, 0, 0);
    railL.castShadow = true;
    railL.receiveShadow = true;

    const railR = new THREE.Mesh(railGeo, mat);
    railR.position.set(w / 2, 0, 0);
    railR.castShadow = true;
    railR.receiveShadow = true;

    group.add(railL, railR);

    // Rungs along the length
    const numRungs = Math.max(2, Math.floor(l / rungSpacingM));
    const rungD = 0.02; // 20mm height
    const rungW = 0.035; // 35mm width
    const rungGeo = new THREE.BoxGeometry(w, rungD, rungW);

    for (let i = 0; i <= numRungs; i++) {
      const z = -l / 2 + (l / numRungs) * i;
      const rung = new THREE.Mesh(rungGeo, mat);
      rung.position.set(0, -d / 2 + rungD / 2, z);
      rung.castShadow = true;
      group.add(rung);
    }

    // Optional longitudinal divider
    if (params.hasDivider) {
      const divGeo = new THREE.BoxGeometry(0.005, d, l);
      const divider = new THREE.Mesh(divGeo, Materials.Divider);
      divider.position.set(0, 0, 0);
      group.add(divider);
    }

    // End splice plates
    if (params.hasSplicePlates !== false) {
      const spL = this.buildSplicePlateMesh(d);
      spL.position.set(-w / 2, 0, l / 2);
      const spR = this.buildSplicePlateMesh(d);
      spR.position.set(w / 2, 0, l / 2);
      group.add(spL, spR);
    }

    return group;
  }

  /**
   * Builds an individual splice plate assembly.
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

  /**
   * Builds a cantilever support bracket.
   */
  static buildCantileverSupport(params: {
    width: number; // mm
    depth: number; // mm
    armLength?: number; // mm
  }): THREE.Group {
    const group = new THREE.Group();
    const w = Units.mmToM(params.width);
    const d = Units.mmToM(params.depth);
    const armLen = Units.mmToM(params.armLength || params.width + 150);

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
   * Generic Angle Horizontal Elbow (45°, 90°, or non-standard).
   */
  static buildHorizontalElbow(params: {
    width: number; // mm
    depth: number; // mm
    radius: number; // mm
    angleDeg: number; // deg (e.g. 45, 90, 30)
    isIS?: boolean;
  }): THREE.Group {
    const group = new THREE.Group();
    const w = Units.mmToM(params.width);
    const d = Units.mmToM(params.depth);
    const r = Units.mmToM(params.radius);
    const angleRad = Units.degToRad(params.angleDeg);
    const t = 0.04;
    const mat = params.isIS ? Materials.TrayIS : Materials.Tray;

    // Inner and Outer curved rails
    const innerRail = this.createArcRail(r - w / 2, t, d, 0, angleRad, mat);
    const outerRail = this.createArcRail(r + w / 2, t, d, 0, angleRad, mat);
    group.add(innerRail, outerRail);

    // Radial rungs
    const stepDeg = 15;
    const count = Math.max(2, Math.round(params.angleDeg / stepDeg));
    const rungD = 0.02;
    const rungW = 0.035;

    for (let i = 1; i < count; i++) {
      const a = (i * angleRad) / count;
      const rung = new THREE.Mesh(new THREE.BoxGeometry(w, rungD, rungW), mat);
      rung.position.set(r * Math.cos(a), -d / 2 + rungD / 2, -r * Math.sin(a));
      rung.rotation.y = a;
      group.add(rung);
    }

    return group;
  }

  /**
   * Helper to create an extruded curved rail mesh.
   */
  private static createArcRail(
    radius: number,
    thickness: number,
    depth: number,
    angleStart: number,
    angleEnd: number,
    material: THREE.Material
  ): THREE.Mesh {
    const shape = new THREE.Shape();
    shape.absarc(0, 0, radius + thickness / 2, angleStart, angleEnd, false);
    shape.lineTo((radius - thickness / 2) * Math.cos(angleEnd), (radius - thickness / 2) * Math.sin(angleEnd));
    shape.absarc(0, 0, radius - thickness / 2, angleEnd, angleStart, true);
    shape.lineTo((radius + thickness / 2) * Math.cos(angleStart), (radius + thickness / 2) * Math.sin(angleStart));

    const geo = new THREE.ExtrudeGeometry(shape, { depth: depth, bevelEnabled: false, curveSegments: 32 });
    geo.translate(0, 0, -depth / 2);
    const mesh = new THREE.Mesh(geo, material);
    mesh.rotation.x = Math.PI / 2;
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    return mesh;
  }

  /**
   * Horizontal Tee.
   */
  static buildHorizontalTee(params: {
    width: number; // mm
    depth: number; // mm
    length: number; // mm (main run)
    branchLength: number; // mm
    isIS?: boolean;
  }): THREE.Group {
    const group = new THREE.Group();
    const w = Units.mmToM(params.width);
    const d = Units.mmToM(params.depth);
    const l = Units.mmToM(params.length);
    const bl = Units.mmToM(params.branchLength);
    const t = 0.04;
    const mat = params.isIS ? Materials.TrayIS : Materials.Tray;

    // Main run back rail (continuous)
    const railTop = new THREE.Mesh(new THREE.BoxGeometry(l, d, t), mat);
    railTop.position.set(0, 0, -w / 2);

    // Main run front rails (split by branch)
    const frontSegL = l / 2 - w / 2;
    const railBotL = new THREE.Mesh(new THREE.BoxGeometry(frontSegL, d, t), mat);
    railBotL.position.set(-l / 4 - w / 4, 0, w / 2);

    const railBotR = new THREE.Mesh(new THREE.BoxGeometry(frontSegL, d, t), mat);
    railBotR.position.set(l / 4 + w / 4, 0, w / 2);

    // Branch side rails
    const brLen = bl - w / 2;
    const railBrL = new THREE.Mesh(new THREE.BoxGeometry(t, d, brLen), mat);
    railBrL.position.set(-w / 2, 0, w / 2 + brLen / 2);

    const railBrR = new THREE.Mesh(new THREE.BoxGeometry(t, d, brLen), mat);
    railBrR.position.set(w / 2, 0, w / 2 + brLen / 2);

    group.add(railTop, railBotL, railBotR, railBrL, railBrR);

    // Main run rungs
    const rungD = 0.02;
    const rungW = 0.035;
    for (let x = -l / 2 + 0.1; x <= l / 2 - 0.1; x += 0.2) {
      if (Math.abs(x) < w / 2 - 0.05) continue;
      const rung = new THREE.Mesh(new THREE.BoxGeometry(w, rungD, rungW), mat);
      rung.rotation.y = Math.PI / 2;
      rung.position.set(x, -d / 2 + rungD / 2, 0);
      group.add(rung);
    }

    // Branch rungs
    for (let z = w / 2 + 0.1; z <= bl - 0.1; z += 0.2) {
      const rung = new THREE.Mesh(new THREE.BoxGeometry(w, rungD, rungW), mat);
      rung.position.set(0, -d / 2 + rungD / 2, z);
      group.add(rung);
    }

    return group;
  }

  /**
   * Generic Angle Vertical Riser (Inside or Outside, 45° or 90°).
   */
  static buildVerticalRiser(params: {
    width: number; // mm
    depth: number; // mm
    radius: number; // mm
    angleDeg: number; // deg
    isOutside?: boolean;
    isIS?: boolean;
  }): THREE.Group {
    const group = new THREE.Group();
    const w = Units.mmToM(params.width);
    const d = Units.mmToM(params.depth);
    const r = Units.mmToM(params.radius);
    const angleRad = Units.degToRad(params.angleDeg);
    const t = 0.04;
    const mat = params.isIS ? Materials.TrayIS : Materials.Tray;

    // Shape for vertical arc rail
    const shape = new THREE.Shape();
    shape.absarc(0, 0, r + d / 2, 0, angleRad, false);
    shape.lineTo((r - d / 2) * Math.cos(angleRad), (r - d / 2) * Math.sin(angleRad));
    shape.absarc(0, 0, r - d / 2, angleRad, 0, true);
    shape.lineTo(r + d / 2, 0);

    const geo = new THREE.ExtrudeGeometry(shape, { depth: t, bevelEnabled: false, curveSegments: 32 });
    geo.translate(0, 0, -t / 2);

    const railL = new THREE.Mesh(geo, mat);
    railL.position.z = -w / 2;
    const railR = new THREE.Mesh(geo, mat);
    railR.position.z = w / 2;
    group.add(railL, railR);

    // Rungs along vertical curve
    const stepDeg = 15;
    const count = Math.max(2, Math.round(params.angleDeg / stepDeg));
    const rungD = 0.02;
    const rungW = 0.035;

    for (let i = 1; i < count; i++) {
      const a = (i * angleRad) / count;
      const rPos = r - d / 2 + rungD / 2;
      const rung = new THREE.Mesh(new THREE.BoxGeometry(rungW, rungD, w), mat);
      rung.position.set(rPos * Math.cos(a), rPos * Math.sin(a), 0);
      rung.rotation.z = a + Math.PI / 2;
      group.add(rung);
    }

    if (params.isOutside) {
      group.rotation.y = Math.PI;
      group.rotation.z = -Math.PI / 2;
    }

    return group;
  }

  /**
   * Concentric, Left Eccentric, or Right Eccentric Reducer.
   */
  static buildReducer(params: {
    inletWidth: number; // mm (Port A)
    outletWidth: number; // mm (Port B)
    depth: number; // mm
    length: number; // mm
    type: 'CONCENTRIC' | 'LEFT' | 'RIGHT';
    isIS?: boolean;
  }): THREE.Group {
    const group = new THREE.Group();
    const w1 = Units.mmToM(params.inletWidth);
    const w2 = Units.mmToM(params.outletWidth);
    const d = Units.mmToM(params.depth);
    const l = Units.mmToM(params.length);
    const t = 0.04;
    const mat = params.isIS ? Materials.TrayIS : Materials.Tray;

    let xLeft1 = -w1 / 2;
    let xLeft2 = -w2 / 2;
    let xRight1 = w1 / 2;
    let xRight2 = w2 / 2;

    if (params.type === 'LEFT') {
      // Left side stays straight (offset 0), right side tapers
      xLeft1 = -w1 / 2;
      xLeft2 = -w1 / 2;
      xRight1 = w1 / 2;
      xRight2 = -w1 / 2 + w2;
    } else if (params.type === 'RIGHT') {
      // Right side stays straight, left side tapers
      xRight1 = w1 / 2;
      xRight2 = w1 / 2;
      xLeft1 = -w1 / 2;
      xLeft2 = w1 / 2 - w2;
    }

    // Angled left rail
    const dxL = xLeft2 - xLeft1;
    const railLenL = Math.hypot(dxL, l);
    const angleL = Math.atan2(dxL, l);
    const railL = new THREE.Mesh(new THREE.BoxGeometry(t, d, railLenL), mat);
    railL.position.set((xLeft1 + xLeft2) / 2, 0, 0);
    railL.rotation.y = -angleL;

    // Angled right rail
    const dxR = xRight2 - xRight1;
    const railLenR = Math.hypot(dxR, l);
    const angleR = Math.atan2(dxR, l);
    const railR = new THREE.Mesh(new THREE.BoxGeometry(t, d, railLenR), mat);
    railR.position.set((xRight1 + xRight2) / 2, 0, 0);
    railR.rotation.y = -angleR;

    group.add(railL, railR);

    // Variable width rungs
    const numRungs = Math.max(2, Math.floor(l / 0.2));
    const rungD = 0.02;
    const rungW = 0.035;

    for (let i = 0; i <= numRungs; i++) {
      const frac = i / numRungs;
      const z = -l / 2 + l * frac;
      const curLeft = xLeft1 + (xLeft2 - xLeft1) * frac;
      const curRight = xRight1 + (xRight2 - xRight1) * frac;
      const curW = curRight - curLeft;
      const curMidX = (curLeft + curRight) / 2;

      const rung = new THREE.Mesh(new THREE.BoxGeometry(curW, rungD, rungW), mat);
      rung.position.set(curMidX, -d / 2 + rungD / 2, z);
      group.add(rung);
    }

    return group;
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
}
