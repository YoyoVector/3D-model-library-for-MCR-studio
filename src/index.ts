/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * MCR-Studio Parametric Engineering 3D Component Library
 *
 * A reusable, modular TypeScript 3D library for industrial cable tray raceways,
 * structural pipe racks, piping obstacles, parametric routing centerlines, and
 * zero double-counting BOM procurement.
 *
 * @packageDocumentation
 */

// Package version
export const VERSION = '1.0.0';

// 1. Core Schema, Types, Instance & Coordinate Transforms
export * from './core/index.ts';

// 2. Component Registry, Catalog Standards & Assembly Hierarchy
export * from './registry/index.ts';

// 3. Port Connections & 3D Mate Placement Engine
export * from './ports/index.ts';

// 4. Centerline Routing & Analytic Length Formulas
export * from './centerline/index.ts';

// 5. Interface & Dimension Compatibility Validation
export * from './validation/index.ts';

// 6. Bill of Materials (BOM) & Multi-Scope Procurement Manager
export * from './bom/index.ts';

// 7. Parametric 3D Mesh Generators & Physical Materials
export * from './geometry/index.ts';

// 8. Canonical Scene & Schema 2.0.0 JSON Exporter
export * from './export/index.ts';

// 9. Engineering Invariant & Acceptance Test Suite (Case A ~ Case V)
export * from './tests/index.ts';
