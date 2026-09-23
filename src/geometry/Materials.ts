/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import * as THREE from 'three';

/**
 * Shared High-Fidelity Metallic & Engineering Materials.
 * Exactly preserves the visual baseline of the legacy prototypes.
 */
export class Materials {
  private static _flowTexture: THREE.CanvasTexture | null = null;

  public static getCableFlowTexture(): THREE.CanvasTexture | null {
    if (this._flowTexture) return this._flowTexture;
    if (typeof document === 'undefined') return null;

    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 32;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.fillStyle = '#082f49';
      ctx.fillRect(0, 0, 512, 32);

      const grd = ctx.createLinearGradient(0, 0, 256, 0);
      grd.addColorStop(0, 'rgba(6, 182, 212, 0)');
      grd.addColorStop(0.5, 'rgba(34, 211, 238, 1)');
      grd.addColorStop(1, 'rgba(6, 182, 212, 0)');
      ctx.fillStyle = grd;
      ctx.fillRect(0, 0, 256, 32);
      ctx.fillRect(256, 0, 256, 32);
    }

    const tex = new THREE.CanvasTexture(canvas);
    tex.wrapS = THREE.RepeatWrapping;
    tex.wrapT = THREE.RepeatWrapping;
    tex.repeat.set(2, 1);
    this._flowTexture = tex;
    return this._flowTexture;
  }

  // Hyper-metallic tray material (Legacy Fitting Baseline)
  public static readonly Tray = new THREE.MeshStandardMaterial({
    color: 0x94a3b8,
    metalness: 0.95,
    roughness: 0.25,
    side: THREE.DoubleSide,
  });

  public static readonly TrayIS = new THREE.MeshStandardMaterial({
    color: 0x0284c7,
    metalness: 0.85,
    roughness: 0.3,
    side: THREE.DoubleSide,
  });

  // Divider material
  public static readonly Divider = new THREE.MeshStandardMaterial({
    color: 0xcbd5e1,
    metalness: 0.8,
    roughness: 0.3,
    side: THREE.DoubleSide,
  });

  // Structural support steel
  public static readonly Support = new THREE.MeshStandardMaterial({
    color: 0x334155,
    metalness: 0.7,
    roughness: 0.5,
  });

  // Fasteners & hardware
  public static readonly Bolt = new THREE.MeshStandardMaterial({
    color: 0xf1f5f9,
    metalness: 1.0,
    roughness: 0.1,
  });

  // Flowing cable material
  public static createCableMaterial(colorHex: number = 0x06b6d4, emissiveHex: number = 0x00aaff) {
    return new THREE.MeshStandardMaterial({
      color: colorHex,
      emissive: emissiveHex,
      emissiveIntensity: 1.3,
      map: this.getCableFlowTexture(),
      metalness: 0.3,
      roughness: 0.2,
    });
  }

  // Main Pipe Rack structural steel
  public static readonly ColumnSteel = new THREE.MeshStandardMaterial({
    color: 0x1e293b,
    metalness: 0.65,
    roughness: 0.5,
  });

  public static readonly BranchColumnSteel = new THREE.MeshStandardMaterial({
    color: 0x172554,
    metalness: 0.7,
    roughness: 0.45,
  });

  // Concrete foundation pier
  public static readonly ConcretePier = new THREE.MeshStandardMaterial({
    color: 0x334155,
    metalness: 0.3,
    roughness: 0.8,
  });

  // Piping
  public static readonly ProcessPipe = new THREE.MeshStandardMaterial({
    color: 0x059669,
    metalness: 0.4,
    roughness: 0.5,
  });

  public static readonly SteamPipe = new THREE.MeshStandardMaterial({
    color: 0xd97706,
    metalness: 0.5,
    roughness: 0.4,
  });

  // MCT Frame
  public static readonly MctFrame = new THREE.MeshStandardMaterial({
    color: 0xd97706,
    metalness: 0.8,
    roughness: 0.2,
  });

  // Cabinets
  public static readonly CabinetBody = new THREE.MeshStandardMaterial({
    color: 0x334155,
    metalness: 0.6,
    roughness: 0.4,
  });

  // Junction Box materials
  public static readonly JbIS = new THREE.MeshStandardMaterial({
    color: 0x0284c7,
    metalness: 0.5,
    roughness: 0.3,
  });

  public static readonly JbNonIS = new THREE.MeshStandardMaterial({
    color: 0xf59e0b,
    metalness: 0.5,
    roughness: 0.3,
  });

  public static readonly JbFiber = new THREE.MeshStandardMaterial({
    color: 0x9333ea,
    metalness: 0.5,
    roughness: 0.3,
  });

  // Conduit
  public static readonly Conduit = new THREE.MeshStandardMaterial({
    color: 0x94a3b8,
    metalness: 0.75,
    roughness: 0.35,
  });

  // Thermal Hazard Zone
  public static readonly HazardMesh = new THREE.MeshBasicMaterial({
    color: 0xef4444,
    transparent: true,
    opacity: 0.18,
  });

  public static readonly BuildingWall = new THREE.MeshStandardMaterial({
    color: 0x1e293b,
    transparent: true,
    opacity: 0.35,
    roughness: 0.5,
  });

  public static readonly RaisedFloor = new THREE.MeshStandardMaterial({
    color: 0x0f172a,
    roughness: 0.8,
  });
}
