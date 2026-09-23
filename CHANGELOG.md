# Changelog

All notable changes to the `@mcr-studio/parametric-3d` library will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

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
