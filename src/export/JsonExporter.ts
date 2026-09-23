/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import type { ComponentDefinition } from '../core/Schema.ts';
import type { ComponentInstance } from '../core/Instance.ts';

export interface ExportedComponentJson {
  schemaVersion: '2.0.0';
  componentVersion: string;
  id: string;
  name: string;
  nameZh: string;
  family: string;
  origin: string;
  role: string;
  description: string;
  defaultParameters: Record<string, any>;
  provenance: Record<string, any>;
  ports: any[];
  centerlines: any[];
  bounds: any;
  subComponents?: any[];
}

export interface ExportedSceneJson {
  schemaVersion: '2.0.0';
  exportedAt: string;
  instances: Array<{
    instanceId: string;
    definitionId: string;
    effectiveParameters: Record<string, any>;
    placement: {
      position: [number, number, number];
      quaternion: [number, number, number, number];
    };
    worldPorts: any[];
  }>;
}

/**
 * Clean Engineering JSON Serialization & Export Engine.
 */
export class JsonExporter {
  /**
   * Exports a ComponentDefinition into standard JSON structure (Case H).
   */
  public static exportDefinition(def: ComponentDefinition): ExportedComponentJson {
    const params = def.defaultParameters;
    return {
      schemaVersion: '2.0.0',
      componentVersion: def.componentVersion,
      id: def.id,
      name: def.name,
      nameZh: def.nameZh,
      family: def.family,
      origin: def.origin,
      role: def.role,
      description: def.description,
      defaultParameters: { ...def.defaultParameters },
      provenance: { ...def.provenance },
      ports: def.getLocalPorts(params),
      centerlines: def.getCenterlineRoutes(params),
      bounds: def.getBounds(params),
      subComponents: def.subComponents ? [...def.subComponents] : undefined,
    };
  }

  /**
   * Exports multiple definitions as a catalog JSON.
   */
  public static exportCatalog(defs: ComponentDefinition[]): ExportedComponentJson[] {
    return defs.map((d) => this.exportDefinition(d));
  }

  /**
   * Exports active scene instances into JSON.
   */
  public static exportScene(instances: ComponentInstance[]): ExportedSceneJson {
    return {
      schemaVersion: '2.0.0',
      exportedAt: new Date().toISOString(),
      instances: instances.map((inst) => ({
        instanceId: inst.instanceId,
        definitionId: inst.definitionId,
        effectiveParameters: { ...inst.effectiveParameters },
        placement: {
          position: [...inst.placement.position] as [number, number, number],
          quaternion: [...inst.placement.quaternion] as [number, number, number, number],
        },
        worldPorts: inst.getWorldPorts(),
      })),
    };
  }
}
