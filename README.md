# @mcr-studio/parametric-3d

[![CI](https://github.com/YoyoVector/3D-model-library-for-MCR-studio/actions/workflows/ci.yml/badge.svg)](https://github.com/YoyoVector/3D-model-library-for-MCR-studio/actions)
[![License: Apache-2.0](https://img.shields.io/badge/License-Apache_2.0-blue.svg)](https://opensource.org/licenses/Apache-2.0)
[![Three.js](https://img.shields.io/badge/Three.js-r128+-black.svg)](https://threejs.org/)

**MCR-Studio Parametric Engineering 3D Component Library** — parametric 3D cable trays, fittings, pipe-rack structure, equipment and obstacles for main cable routing (MCR), with catalog-verified vendor profiles, physical mate validation and zero double-counting BOM.

---

## Features

- **39 parametric components** — 19 cable tray / fitting components (straight, divided straight, horizontal elbows 30/45/60/90°, tee, cross, vertical inside / outside bends 30/45/60/90°, centre / left / right reducers) plus structure, supports, equipment, penetrations and obstacles.
- **One engineering formula per tray family** (`src/geometry/TrayLayouts.ts`) — ports, centerline routes, analytic bounds and the 3D mesh are all read from the same resolved layout, so they cannot disagree.
- **Vendor catalog profiles** (`TraySystemProfiles`) — aluminium ladder (W 100–1000, H 150, R 300/600/900), ventilated-through 100W×50H and 300W×100H, each with the catalog pages and the components the series actually offers.
- **Connection-face semantics** — every tray port declares its physical face; geometry terminates exactly on the port plane.
- **Physical assembly validation** (`AssemblyValidator`, `buildMatedAssembly`) — joint-plane separation (no interpenetration), no gap, identical faces, up alignment and centerline continuity, checked on the real meshes.
- **Tray network → catalog fittings** (`normalizeTrayNetwork`, `resolveTrayNetwork`) — a host's nodes-and-segments drawing becomes a buildable installation: one catalog fitting per bend / junction, reducers where the width changes, straight trays in between, physical route centerline lengths and a material take-off. What the catalog cannot build is reported, never approximated.
- **One engineering frame** (`PlanFrames`) — right-handed, +Y up, mm. Host drawing coordinates convert through one named frame, so LEFT / RIGHT and turn directions match the drawing.
- **Zero double-counting BOM** with one line per size; specs read from the engineering dimensions.
- **Works without npm** — `lib/index.iife.js` is a plain `<script>` build on a global `THREE` (tested on three r128 and current), and `standalone/MCR-3D-Component-Library.html` is the viewer as one file that opens by double-click.
- **Acceptance suite** — 44 cases including vendor golden fixtures, mesh curvature probes, negative controls, hand-derived assembly demos, network layouts, designer fitting choices and plan-frame handedness.

---

## Installation

```bash
npm install @mcr-studio/parametric-3d three
```

**Without npm** (offline pages, company computers): copy `lib/index.iife.js` next to a global three.js build and load both with plain script tags. It defines the global `McrParametric3D`:

```html
<script src="vendor/three.min.js"></script>          <!-- global THREE, r128 or newer -->
<script src="vendor/mcr-parametric-3d.js"></script>   <!-- copy of lib/index.iife.js -->
<script>
  const { TraySystemProfiles, createComponentFromProfile } = McrParametric3D;
</script>
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

### 4. Tray network → catalog fittings (host applications)

A host application keeps its own drawing data (nodes and straight centerline segments) and lets the
library decide what is physically built:

```typescript
import {
  PlanFrames, trayNetworkFromPlan, normalizeTrayNetwork, resolveTrayNetwork, updateRouteForChanges,
} from '@mcr-studio/parametric-3d';

// Drawing coordinates: x right, y down the page, z elevation, metres.
const network = trayNetworkFromPlan(
  [
    { id: 'A', x: 0, y: 0, z: 6.4 }, { id: 'T', x: 10, y: 0, z: 6.4 }, { id: 'E', x: 20, y: 0, z: 6.4 },
    { id: 'B', x: 10, y: 6, z: 6.4 }, { id: 'J', x: 10, y: 6, z: 1.4 },
  ],
  [
    { id: 'main1', from: 'A', to: 'T', width: 600 }, { id: 'main2', from: 'T', to: 'E', width: 600 },
    { id: 'branch', from: 'T', to: 'B', width: 300 }, { id: 'riser', from: 'B', to: 'J', width: 300 },
  ],
  PlanFrames.PAGE_Y_DOWN_METRES
);

const normalized = normalizeTrayNetwork(network, ladder); // catalog widths; vertical tee → tee + stub + bend
const layout = resolveTrayNetwork(normalized.network, ladder);

layout.issues;   // [] here; ERRORs for what the catalog cannot build (short segment, 75° turn, Y junction …)
layout.fittings; // T: FITTING_TEE W600 + FITTING_REDUCER_CENTER 600→300; B: FITTING_RISER_OUT_90 W300
layout.pathCenterline(updateRouteForChanges(['main1', 'branch', 'riser'], normalized));
// { lengthMm: 20581.53, polylineMm: 21000, ok: true } — through the fittings, not the drawing corners
layout.pathPoints(['main1', 'branch', 'riser']); // world points (mm) along that centerline, for drawing cables
layout.bom();    // fittings per size + straight trays as 3 m pieces per continuous run

// Host materials: the host styles trays by state and owns (and disposes) the material.
for (const item of layout.instances()) scene.add(item.getThreeMesh({ materials: { body: trayMaterial } }));
```

Rules (catalog first; see Cases AM–AP):

| Situation | Built as |
| :--- | :--- |
| Level turn 30 / 45 / 60 / 90° | Horizontal elbow of the widest leg; reducer on a narrower leg (`bendWidth: 'NARROWEST_LEG'`: reduce first, elbow of the narrowest leg) |
| Level ↔ plumb (or catalog-angle incline) | Vertical inside (rising) / outside (falling) bend; width as for elbows |
| Main run with a perpendicular level branch | Tee of the widest leg; reducer on each narrower leg (the catalog tee has one W) |
| Two level runs crossing at 90° | Cross; reducers as for the tee |
| Width change on a straight line | Centre reducer (600 long) into the narrower segment |
| Vertical tee (plumb branch off a level run) | `normalizeTrayNetwork`: level tee + horizontal stub + vertical bend; the run's free end moves sideways |
| Width not in the catalog | `normalizeTrayNetwork`: next wider catalog width |
| Other angles, Y junctions, segments shorter than their fittings, parts the series does not offer | ERROR issue — redesign; nothing is approximated |

**Designer choices.** A host that lets people edit fittings stores only their choices and resolves
again; reducers, straight lengths, route lengths, BOM and meshes follow:

```typescript
const options = {
  bendWidth: 'NARROWEST_LEG',                              // project rule: reduce before bends
  nodeOverrides: { T: { radius: 600 } },                    // per-node fitting width / catalog radius
};
const layout2 = resolveTrayNetwork(normalizeTrayNetwork(network, ladder, options).network, ladder, options);
layout2.fittingChoices('T'); // { definitionId: 'FITTING_TEE', width: 600, widthChoices: [300, 400, 500, 600], radius: 600, radiusChoices: [300, 600, 900], … }
```

A fitting narrower than a leg gets the reducer before it, wider than a leg after it. Invalid choices
are ERROR `OVERRIDE_INVALID` (the rule value is used); choices on nodes without a fitting are WARNING
`OVERRIDE_UNUSED`. Integration notes for MCR-Studio: [`docs/integration/mcr-studio/`](docs/integration/mcr-studio/).

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

World frame: right-handed, +Y up, X / Z horizontal; engineering data in mm, Three.js meshes in metres. Drawing coordinates with y running down the page and z as elevation form a left-handed triple — convert them through `PlanFrames` and never decide left / right in them.

Materials: `getThreeMesh()` returns a cached object on the shared library materials (`userData.sharedMaterial = true`; do not dispose them). `getThreeMesh({ materials: { body } })` returns a fresh object on the host's material, owned by the host.

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
  // Tray networks & plan frames (host integration)
  PlanFrames, leftOfTravel, trayNetworkFromPlan, normalizeTrayNetwork, resolveTrayNetwork, updateRouteForChanges,
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

No npm on the computer? Open `standalone/MCR-3D-Component-Library.html` directly: one file that works offline from disk (the URL parameters below work on it too).

- **構件檢視 Viewer** — pick a profile (Ladder / Ventilated A / Ventilated B / Generic) and a component. The info card shows the component, active profile (e.g. `SECXXX / Ladder / 600W × 150H`), main parameters, validation status (`CATALOG VERIFIED`, `ENGINEERING DERIVED`, `GENERIC`, …) with PDF page and printed catalog page, and whether every connection face terminates on its port plane.
- **對接裝配 Assembly** — built-in assembly demos and custom A↔B mating with a per-joint physical report.
- **管廊場景 Plant**, **驗收測試 Tests** (live results), **BOM** (CSV export).
- Themes: **Presentation Steel** (management demos), Engineering Dark, Engineering Light (+ legacy themes under 更多). Themes never change geometry.
- URL parameters for demos / screenshots: `?tab=viewer&profile=LADDER_PROFILE_STANDARD&comp=FITTING_TEE&theme=PRESENTATION_STEEL&view=TOP&present=1`, `?tab=assembly&demo=CROSS_CHAIN`.

---

## Scripts

```bash
npm run lint           # tsc --noEmit
npm run test           # 44-case acceptance & engineering suite
npm run build          # library (lib/: ESM, CJS, IIFE) + demo app (dist/) + standalone viewer (standalone/)
npm run test:contract  # ESM / CJS public API contract
npm run test:script    # lib/index.iife.js on a global THREE: three r128 and current, identical geometry
npm run test:smoke     # npm pack → install in a clean consumer → ESM / CJS smoke test
```

`lib/` and `standalone/` are committed so that computers without npm can use them; CI fails when they are out of date with the source.

---

## License

Apache-2.0 © CTCI / MCR-Studio.
