# @mcr-studio/parametric-3d

[![CI](https://github.com/YoyoVector/3D-model-library-for-MCR-studio/actions/workflows/ci.yml/badge.svg)](https://github.com/YoyoVector/3D-model-library-for-MCR-studio/actions)
[![License: Apache-2.0](https://img.shields.io/badge/License-Apache_2.0-blue.svg)](https://opensource.org/licenses/Apache-2.0)
[![TypeScript 5+](https://img.shields.io/badge/TypeScript-5.0+-3178C6.svg)](https://www.typescriptlang.org/)
[![Three.js](https://img.shields.io/badge/Three.js-r160+-black.svg)](https://threejs.org/)

**MCR-Studio Parametric Engineering 3D Component Library** is a production-grade, modular, parametric 3D library for industrial plant engineering, cable tray raceway routing, pipe racks, equipment penetration, obstacle clearance, and zero double-counting BOM procurement.

---

## Features

- **32 Parametric Components**: Complete industrial library spanning Cable Trays, Fittings, Structural Steel, Supports, Equipment Junction Boxes, MCT Wall Penetrations, and Process Piping Obstacles.
- **Parametric Single Source of Truth (SOT)**: All Ports, Centerlines, Bounds, and 3D Geometry dynamically derive from runtime `effectiveParameters` (arbitrary angles, lengths, widths, depths).
- **Exact Analytic Centerlines**: Closed-form mathematical formulas for straight, circular arc, and eccentric hypotenuse transition routing centerlines.
- **Rigid 3D Mate Engine**: Quaternion-based port alignment, orthonormal frame compliance, and cumulative error $\le 10^{-5}\text{mm}$.
- **Zero Double-Counting BOM Engine**: Multi-scope procurement filtering (`MCR_CABLE_TRAY_BOM`, `MCR_TERMINATION_BOM`, `STRUCTURAL_REF`, `PROCESS_PIPING_REF`) with automated kit bundle de-duplication.
- **Export Schema 2.0.0**: Clean JSON serialization of component metadata, runtime placements, and non-canonical derived snapshots.
- **Comprehensive Quality Assurance**: 22 automated acceptance & invariant test cases (Cases A ~ V).

---

## Installation

```bash
# npm
npm install @mcr-studio/parametric-3d three

# yarn
yarn add @mcr-studio/parametric-3d three

# pnpm
pnpm add @mcr-studio/parametric-3d three
```

---

## Quick Start

### 1. Instantiate and Render a Component

```typescript
import * as THREE from 'three';
import { ComponentRegistry, ComponentInstance } from '@mcr-studio/parametric-3d';

// Retrieve definition from registry
const trayDef = ComponentRegistry.get('TRAY_STRAIGHT')!;

// Create a parametric instance with custom parameters
const trayInstance = new ComponentInstance('tray_01', trayDef, {
  length: 3000,
  width: 600,
  depth: 100,
});

// Set 3D placement (units: millimeters for engineering, converted internally for Three.js)
trayInstance.setPlacement({
  position: [0, 6400, 0], // EL +6.4m
  quaternion: [0, 0, 0, 1],
});

// Get Three.js mesh and add to scene
const mesh = trayInstance.getThreeMesh();
scene.add(mesh);
```

### 2. Snap & Mate Components via Ports

```typescript
import { MateEngine } from '@mcr-studio/parametric-3d';

const elbowDef = ComponentRegistry.get('FITTING_ELBOW_90')!;
const elbowInstance = new ComponentInstance('elbow_01', elbowDef, {
  radius: 600,
  width: 600,
  depth: 100,
});

// Automatically calculate spatial placement to mate elbow PORT_A to tray PORT_B
const mateResult = MateEngine.computeMateTransform(
  trayInstance, 'PORT_B',
  elbowInstance, 'PORT_A',
  0.5 // tolerance in mm
);

if (mateResult.success) {
  elbowInstance.setPlacement(mateResult.placement);
  scene.add(elbowInstance.getThreeMesh());
}
```

### 3. Generate Procurement BOM

```typescript
import { BomManager, BomScope } from '@mcr-studio/parametric-3d';

const instances = [trayInstance, elbowInstance];

// Generate BOM with zero double-counting
const bom = BomManager.generateBom(instances, {
  scope: BomScope.MCR_CABLE_TRAY_BOM,
  preventDoubleCounting: true,
});

console.log(bom.items);
console.log(`Total count: ${bom.totalCount}, Double counting detected: ${bom.hasDoubleCounting}`);
```

---

## Submodule Exports

| Import Path | Description |
|---|---|
| `@mcr-studio/parametric-3d` | Root bundle exporting all public APIs |
| `@mcr-studio/parametric-3d/core` | `ComponentInstance`, `Units`, `Transforms`, `Schema` |
| `@mcr-studio/parametric-3d/registry` | `ComponentRegistry`, `CatalogStandards`, `AssemblyRegistry` |
| `@mcr-studio/parametric-3d/ports` | `MateEngine`, `MateResult` |
| `@mcr-studio/parametric-3d/centerline` | `RouteGenerator`, `AnalyticLength` |
| `@mcr-studio/parametric-3d/geometry` | `Generators`, `Materials` |
| `@mcr-studio/parametric-3d/validation` | `ConnectionValidator` |
| `@mcr-studio/parametric-3d/bom` | `BomManager`, `BomScope` |
| `@mcr-studio/parametric-3d/export` | `JsonExporter` |
| `@mcr-studio/parametric-3d/tests` | `AcceptanceTestSuite`, `LEGACY_FITTING_BASELINES` |

---

## Interactive Viewer (Demo Consumer)

This repository includes a full-featured 3D viewer application that acts as a reference consumer of the package:

```bash
# Start development dev server (port 3000)
npm run dev

# Run automated invariant & acceptance test suite
npm run test

# Build library package (outputs to lib/) and demo application (outputs to dist/)
npm run build
```

---

## License

Apache-2.0 © CTCI / MCR-Studio.
