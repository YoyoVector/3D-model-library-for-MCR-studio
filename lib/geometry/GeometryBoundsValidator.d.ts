import { ComponentDefinition, ComponentBoundsDefinition } from '../core/Schema.ts';
/**
 * Computes bounding box directly from Three.js procedural geometry meshes in millimeters.
 *
 * NOTE: This utility is dedicated strictly to:
 * - Invariant testing (e.g. Case R bounds consistency)
 * - Debugging & visual inspection
 * - Visual validation & regression prevention
 *
 * It MUST NOT be used as the production runtime implementation for ComponentDefinition.getBounds(),
 * ensuring ComponentDefinition remains the independent Source of Truth (SOT) and avoids circular validation.
 *
 * @param definition The component definition to evaluate.
 * @param params Millimeter parameters applied to buildGeometry.
 * @returns Millimeter bounding box { min: [x, y, z], max: [x, y, z] }
 */
export declare function computeGeometryBounds(definition: ComponentDefinition, params?: Record<string, any>): ComponentBoundsDefinition;
