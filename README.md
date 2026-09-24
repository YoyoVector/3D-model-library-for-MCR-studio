# @mcr-studio/parametric-3d

[![CI](https://github.com/YoyoVector/3D-model-library-for-MCR-studio/actions/workflows/ci.yml/badge.svg)](https://github.com/YoyoVector/3D-model-library-for-MCR-studio/actions)
[![License: Apache-2.0](https://img.shields.io/badge/License-Apache_2.0-blue.svg)](https://opensource.org/licenses/Apache-2.0)
[![Three.js](https://img.shields.io/badge/Three.js-r160+-black.svg)](https://threejs.org/)

**MCR-Studio Parametric Engineering 3D Component Library** — parametric 3D cable trays, fittings, pipe-rack structure, equipment and obstacles for main cable routing (MCR), with catalog-verified vendor profiles, physical mate validation and zero double-counting BOM.

---

## Features

- **39 parametric components** — 19 cable tray / fitting components (straight, divided straight, horizontal elbows 30/45/60/90°, tee, cross, vertical inside / outside bends 30/45/60/90°, centre / left / right reducers) plus structure, supports, equipment, penetrations and obstacles.
- **One engineering formula per tray family** (`src/geometry/TrayLayouts.ts`) — ports, centerline routes, analytic bounds and the 3D mesh are all read from the same resolved layout, so they cannot disagree.
- **Vendor catalog profiles** (`TraySystemProfiles`) — aluminium ladder (W 100–1000, H 150, R 300/600/900), ventilated-through 100W×50H and 300W×100H, each with the catalog pages and the components the series actually offers.
- **Connection-face semantics** — every tray port declares its physical face; geometry terminates exactly on the port plane.
- **Physical assembly validation** (`AssemblyValidator`, `buildMatedAssembly`) — joint-plane separation (no interpenetration), no gap, identical faces, up alignment and centerline continuity, checked on the real meshes.
- **Zero double-counting BOM** with one line per size; specs read from the engineering dimensions.
- **Acceptance suite** — 37 cases including vendor golden fixtures, mesh curvature probes, negative controls and hand-derived assembly demos.

---

## Installation

```bash
npm install @mcr-studio/parametric-3d three
```

---

## Quick Start

### 1. Create catalog-true components from a vendor profile

```typescript
import * as THREE from 'three';
import { TraySystemProfiles, createComponentFromProfile } from '@mcr-studio/parametric-3d';

const ladder = TraySystemProfiles.get('LADDER_PROFILE_STANDARD')!; // 600W × 150H, R 300, 125 mm tangents

const tray = createComponentFromProfile('TRAY_STRAIGHT', ladder, {}, 'tray_01');
const tee = createComponentFromProfile('FITTING_TEE', ladder, { width: 300, radius: 600 }, 'tee_01');

scene.add(tray.getThreeMesh(), tee.getThreeMesh()); // meshes in metres, engineering data in mm
console.log(tee.definition.getEngineeringDimensions!(tee.effectiveParameters));
// { mainSpan: 1750, branchProjection: 875, catalogRadius: 600, centerlineRadius: 750, ... }
```

### 2. Mate components and validate the physical joints

```typescript
import { buildMatedAssembly, ASSEMBLY_DEMOS, MateEngine, AssemblyValidator } from '@mcr-studio/parametric-3d';

// Chain / tree assembly: each step mates its `port` onto `attachPort` of an earlier step.
const result = buildMatedAssembly(
  [
    { definitionId: 'TRAY_STRAIGHT' },
    { definitionId: 'FITTING_ELBOW_90', port: 'PORT_A' },
    { definitionId: 'TRAY_STRAIGHT', port: 'PORT_A' },
  ],
  { profile: ladder }
);
console.log(result.passed, result.joints.map((j) => j.planeOffsetBMm)); // true, [0, 0]

// Or mate two instances yourself:
const mate = MateEngine.placeComponentByPort(tray, 'PORT_B', tee, 'PORT_A');
const joint = AssemblyValidator.checkJoint(tray, 'PORT_B', tee, 'PORT_A');
```

### 3. BOM

```typescript
import { BomManager, BomScope } from '@mcr-studio/parametric-3d';

const bom = BomManager.generateBom(result.instances, { scope: BomScope.MCR_CABLE_TRAY_BOM });
// e.g. "Ladder W=600mm H=150mm R=300mm 90° T=125mm" — one line per size
```

---

## Engineering conventions

| Parameter | Meaning |
| :--- | :--- |
| `width` (W) | Catalog nominal width. Ladder overall width is W + 26 (rail flanges); ventilated W is the outer width. |
| `depth` (H) | Side rail height (catalog H). |
| `radius` (R) | **Catalog inner radius R** — inner side rail (horizontal bends, tee, cross), rail-top side (vertical inside), tray bottom (vertical outside). Centerline radius = R + W/2 (horizontal) or R + H/2 (vertical). |
| `tangentLength` (T) | Straight at each fitting end (catalog 125 mm; reducers 200 mm). Ports sit at the physical end of the tangent. |
| `trayStyle` | `LADDER` or `VENTILATED_THROUGH`. |
| `radiusReference` | Migration aid: `'CENTERLINE'` interprets `radius` as the legacy centerline radius. |

Ports: TRAY_END ports sit at the centre of the tray section on the connection face; `localDirection` points outward, `localUp` from the tray bottom to the open side. Component definitions keep **generic** defaults (e.g. H 100); use a profile for vendor values.

Vendor validation matrix and open questions: [`docs/catalog-validation/`](docs/catalog-validation/). Recovery audit: [`docs/handoff/recovery-audit.md`](docs/handoff/recovery-audit.md).

---

## Public API (root package)

```typescript
import {
  // Core
  ComponentInstance, Units, Transforms, BomScope,
  // Registries & profiles
  ComponentRegistry, AssemblyRegistry, CatalogStandards,
  TraySystemProfiles, createComponentFromProfile, resolveProfileParameters,
  // Geometry formula layer
  GeometryGenerators, straightLayout, horizontalBendLayout, verticalBendLayout, teeLayout, crossLayout, reducerLayout,
  // Routing & mate
  MateEngine, RouteGenerator, AnalyticLength,
  // Validation
  ConnectionValidator, AssemblyValidator, buildMatedAssembly, ASSEMBLY_DEMOS,
  // Procurement & export
  BomManager, JsonExporter,
  // Tests
  AcceptanceTestSuite,
} from '@mcr-studio/parametric-3d';
```

---

## Interactive viewer (demo consumer)

```bash
npm run dev      # http://localhost:3000
```

- **構件檢視 Viewer** — pick a profile (Ladder / Ventilated A / Ventilated B / Generic) and a component. The info card shows the component, active profile (e.g. `SECXXX / Ladder / 600W × 150H`), main parameters, validation status (`CATALOG VERIFIED`, `ENGINEERING DERIVED`, `GENERIC`, …) with PDF page and printed catalog page, and whether every connection face terminates on its port plane.
- **對接裝配 Assembly** — built-in assembly demos and custom A↔B mating with a per-joint physical report.
- **管廊場景 Plant**, **驗收測試 Tests** (live results), **BOM** (CSV export).
- Themes: **Presentation Steel** (management demos), Engineering Dark, Engineering Light (+ legacy themes under 更多). Themes never change geometry.
- URL parameters for demos / screenshots: `?tab=viewer&profile=LADDER_PROFILE_STANDARD&comp=FITTING_TEE&theme=PRESENTATION_STEEL&view=TOP&present=1`, `?tab=assembly&demo=CROSS_CHAIN`.

---

## Scripts

```bash
npm run lint           # tsc --noEmit
npm run test           # 37-case acceptance & engineering suite
npm run build          # library (lib/) + demo app (dist/)
npm run test:contract  # ESM / CJS public API contract
npm run test:smoke     # npm pack → install in a clean consumer → ESM / CJS smoke test
```

> Windows note: `package-lock.json` currently records only Linux native bindings for rolldown / lightningcss / tailwind oxide. On Windows, after `npm ci`, run
> `npm install --no-save @rolldown/binding-win32-x64-msvc lightningcss-win32-x64-msvc @tailwindcss/oxide-win32-x64-msvc` (matching versions) before `npm run build` / `npm run dev`.

---

## License

Apache-2.0 © CTCI / MCR-Studio.
