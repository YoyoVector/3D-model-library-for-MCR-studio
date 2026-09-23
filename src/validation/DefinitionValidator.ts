/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import type { ComponentDefinition } from '../core/Schema.ts';
import { Transforms } from '../core/Transforms.ts';

export interface DefinitionValidationReport {
  definitionId: string;
  valid: boolean;
  errors: string[];
  warnings: string[];
}

/**
 * Validates ComponentDefinition integrity, schema version, and port orthonormality.
 */
export class DefinitionValidator {
  public static validate(def: ComponentDefinition): DefinitionValidationReport {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Schema version check (Case H)
    if (def.schemaVersion !== '2.0.0') {
      errors.push(`Invalid schemaVersion: expected "2.0.0", got "${def.schemaVersion}"`);
    }

    if (!def.componentVersion) {
      errors.push('Missing componentVersion');
    }

    if (!def.id) {
      errors.push('Missing definition id');
    }

    // Validate dynamic derivation functions
    try {
      const ports = def.getLocalPorts(def.defaultParameters);
      ports.forEach((p) => {
        // Check unit length of direction and up
        const dirLen = Math.hypot(p.localDirection[0], p.localDirection[1], p.localDirection[2]);
        const upLen = Math.hypot(p.localUp[0], p.localUp[1], p.localUp[2]);
        if (Math.abs(dirLen - 1.0) > 0.01) {
          errors.push(`Port ${p.id} direction vector is not normalized (length=${dirLen})`);
        }
        if (Math.abs(upLen - 1.0) > 0.01) {
          errors.push(`Port ${p.id} up vector is not normalized (length=${upLen})`);
        }
        const dot = Transforms.dot(p.localDirection, p.localUp);
        if (Math.abs(dot) > 0.05) {
          errors.push(`Port ${p.id} direction and up vectors are not orthogonal (dot=${dot})`);
        }
      });
    } catch (err: any) {
      errors.push(`getLocalPorts threw runtime error: ${err.message}`);
    }

    try {
      const routes = def.getCenterlineRoutes(def.defaultParameters);
      routes.forEach((r) => {
        if (r.analyticLength <= 0 && r.samplePoints.length > 1) {
          warnings.push(`Route ${r.id} has non-positive analyticLength: ${r.analyticLength}`);
        }
      });
    } catch (err: any) {
      errors.push(`getCenterlineRoutes threw runtime error: ${err.message}`);
    }

    return {
      definitionId: def.id,
      valid: errors.length === 0,
      errors,
      warnings,
    };
  }
}
