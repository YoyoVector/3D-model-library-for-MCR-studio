# Changelog

All notable changes to the `@mcr-studio/parametric-3d` library will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added — host integration (tray networks, plain script build)
- `normalizeTrayNetwork` / `resolveTrayNetwork` (`src/network/`): a host's nodes-and-segments tray
  drawing becomes a catalog-true installation — one fitting per bend / junction (elbows, vertical
  bends, tee, cross), centre reducers where the width changes (the catalog tee / cross have one W),
  straight trays between the fittings' reach, physical route centerline lengths
  (`pathCenterline`) and a take-off (`bom()`: fittings per size, straights in 3 m pieces per
  continuous run). Vertical tees become level tee + stub + vertical bend; widths snap up to the
  next catalog width; everything else the catalog cannot build is an ERROR issue.
  `updateRouteForChanges` updates host routes (cable paths) for the inserted stubs.
  `pathPoints` returns the world centerline of a route through the fittings, for drawing cables.
- Fitting choices: `options.bendWidth` ('WIDEST_LEG' default, 'NARROWEST_LEG' = reduce before
  the bend) and `options.nodeOverrides` (per-node fitting `width` and catalog `radius`). A fitting
  narrower than a leg gets its reducer before it, wider after it; reducers, straights, route lengths,
  BOM and meshes follow. `layout.fittingChoices(nodeId)` lists what a designer may choose; invalid
  choices are ERROR `OVERRIDE_INVALID`, choices on plain nodes WARNING `OVERRIDE_UNUSED`.
  Acceptance Case AR (44 total).
- `docs/integration/mcr-studio/`: integration notes for MCR-Studio (with r128 renders and the
  sample check harness).
- `PlanFrames` (`PAGE_Y_DOWN_METRES`, `NORTH_UP_METRES`) and `leftOfTravel`: the one right-handed
  world frame and named conversions from drawing coordinates.
- Host materials: `getThreeMesh({ materials: { body, divider, accessory } })` and
  `buildGeometry(params, options)` build a fresh object on the host's material; default meshes are
  flagged `userData.sharedMaterial = true`.
- `lib/index.iife.js`: plain `<script>` build on a global `THREE` (global `McrParametric3D`),
  tested on three r128 and current (`npm run test:script`).
- `standalone/MCR-3D-Component-Library.html`: the viewer as one file that opens from disk.
- Acceptance Cases AL–AQ: plan-frame handedness with a mirrored-frame negative control,
  network fittings with physical joint checks, normalization and ERROR reporting, route centerline
  measured along the placed geometry, network take-off, host materials.
- CI fails when the committed `lib/` / `standalone/` differ from a fresh build.

### Removed
- `lib/assets/aistudio/.gitignore` (AI Studio leftover; every `build:lib` deleted it).

Vendor-catalog recovery of the partial Gemini work (see `docs/handoff/recovery-audit.md`,
`docs/catalog-validation/`). Version number left for the maintainer to decide.

### Changed — engineering behaviour (review before upgrading)
- **`radius` is the catalog inner radius R** for all bends, tee and cross (was the centerline
  radius). Centerline radius = R + W/2 (horizontal) or R + H/2 (vertical).
  *Migration:* pass `radiusReference: 'CENTERLINE'` to keep legacy centerline semantics, or use
  `radius = legacyRadius − W/2` (horizontal) / `− H/2` (vertical). Generic defaults were chosen so the
  generic horizontal elbow keeps its legacy ports (W 600, R 300 → centerline 600).
- **`tangentLength` is honoured**: bend / tee / cross ports sit at the end of the tangent
  (vendor profiles: 125 mm). Generic elbows / risers default to 0 (legacy pure arc).
- **Tee / Cross**: radius-R curved transitions (catalog p.9 / p.10); spans derived from
  W + 2R + 2T. `length` / `branchLength` are accepted as legacy aliases that fix the tangents.
- **Vertical bends**: port `localUp` is the tray up (was the width axis — risers mated sideways);
  local frame centred on the bend centre; inside / outside bottom side per catalog.
- **Reducers**: `FITTING_REDUCER_LEFT` / `RIGHT` handedness follows the vendor drawing (LEFT keeps
  the left rail straight viewed from the wide end); optional straight ends via `tangentLength`
  (generic default 100, vendor 200 with length 600).
- **Straight tray**: splice plates are an optional accessory (`hasSplicePlates: true`, default off),
  excluded from bounds and connection checks; end rungs no longer protrude past the ports.
- BOM lines are keyed by definition **and** specification; specs read the engineering dimensions
  (the wrong "HDG 85 µm" finish text was removed).
- `getComponentSubCategory` uses prefix matching (STRUCT_CROSS_BEAM is no longer a "tee / cross").

### Added
- `src/geometry/TrayLayouts.ts`, `SweepPath.ts`, `TrayMeshBuilder.ts`: single engineering formula
  layer for every tray family; `ComponentDefinition.getEngineeringDimensions()`.
- `ConnectionFaceDefinition` on ports; `ConnectionValidator` code `STYLE_MISMATCH`;
  `MateResult.upDotProduct`.
- `AssemblyValidator` (joint-plane separation, termination, face match, centerline continuity),
  `buildMatedAssembly`, `ASSEMBLY_DEMOS`.
- Vendor profiles corrected against the PDF: allowed widths / radii / horizontal & vertical angles,
  materials, finish, reducer stages, printed page offsets and per-series component lists;
  `resolveProfileParameters`, `printedPageOf`, `AssumptionLevel.ENGINEERING_DERIVED`.
- `FITTING_RISER_IN_60/30`, `FITTING_RISER_OUT_60/30` (catalog p.12, 14, 16, 18).
- Acceptance suite 28 → 37 cases: golden fixtures from the PDF, mesh curvature probes, radius
  semantics, port-plane termination, 12 physical mating scenarios, negative controls, assembly
  demos; README snippets executed by `npm run test`.
- Viewer: clear component / profile / parameters / validation / source hierarchy, assembly
  workspace with per-joint report, Presentation Steel theme, presentation mode, URL parameters.

### Fixed — second recovery audit (2026-09-24)
- Profile `vendor` is the masked name `SECXXX` (project rule: the vendor name is not written out).
- Viewer framing: the camera fits the content box into the viewport area left free by the info
  card and toolbar (models were hidden under the card, or larger than the viewport).
- `package-lock.json` now lists every platform's optional native binding (rolldown, lightningcss,
  tailwind oxide, TypeScript 7). `npm ci` with npm ≥ 11 refused the old lockfile. Resolved
  versions did not change.

### Fixed
- Viewer crash on connection mismatch (`connectionCheck.reasons` did not exist); hard-coded
  "all PASS" banners replaced by live results; plant-scene trays now run along the rack.

## [1.0.0] - 2026-09-23

### Added
- **Reusable TypeScript Package Architecture**:
  - Dual ESM (`lib/index.js`) and CommonJS (`lib/index.cjs`) distribution.
  - Complete TypeScript declaration bundling (`lib/index.d.ts`).
  - Modular subpath exports (`/core`, `/registry`, `/geometry`, `/ports`, `/centerline`, `/validation`, `/bom`, `/export`, `/tests`).
  - Interactive 3D Viewer application preserved as demo consumer.
- **32 Parametric 3D Industrial Engineering Components**:
  - **Cable Trays (7)**: Straight, Divider, Perforated, Wire Mesh, Ladder, Channel, Cover.
  - **Fittings (9)**: Horizontal Elbows 90°/45°, Vertical Inside/Outside Risers 90°/45°, Tee, Cross, Reducers (Center, Left, Right).
  - **Supports (4)**: Cantilever Arm, Trapeze Hanger, Floor Stanchion, Pipe Clamp.
  - **Penetrations & Terminal Equipment (4)**: MCT Frame, Firestop Block, Junction Box, Control Panel.
  - **Structural Steel (4)**: Main Pipe Rack Bay, Branch Bay, Structural Column, Pier Pedestal.
  - **Obstacles (2)**: High-Pressure Main Process Pipe, Superheated Steam Pipe with clearance envelopes.
  - **Accessories (2)**: Grounding Lug, Bonding Jumper.
- **Single Source of Truth (SOT) Dynamic Angle Engine**:
  - Arbitrary `angleDeg` dynamically derives Connection Ports, Centerlines, Bounds, and 3D Geometry.
- **Centerline ↔ Port Endpoint Invariant**:
  - Strict endpoint alignment validation ($\Delta \le 10^{-5}\text{mm}$).
- **Port Frame Right-Handed Orthonormal Basis**:
  - Determinant $\det(\mathbf{M}) = +1.00000$ enforced across all ports.
- **Physical Hypotenuse Reducer Length Formula**:
  - $L = \sqrt{L^2 + \Delta X^2}$ for accurate procurement BOM accounting.
- **Zero Double-Counting Multi-Scope BOM**:
  - `BomScope` classification (`MCR_CABLE_TRAY_BOM`, `MCR_TERMINATION_BOM`, `STRUCTURAL_REF`, `PROCESS_PIPING_REF`).
  - Bundled subcomponent filtering for assembled modules (`STRUCT_MAIN_BAY`).
- **Comprehensive Quality Assurance Suite**:
  - 22 automated acceptance & invariant test cases (Cases A ~ V) with 100% pass rate.
  - Deterministic visual baseline regression for 8 legacy models.
- **Release CI/CD Automation**:
  - GitHub Actions automated validation and release workflow.
