import { ComponentDefinition } from '../core/Schema.ts';
import { ComponentInstance } from '../core/Instance.ts';
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
        derivedSnapshot: {
            status: 'NON_CANONICAL_SNAPSHOT';
            worldPorts: any[];
            bounds: any;
        };
    }>;
}
/**
 * Clean Engineering JSON Serialization & Export Engine.
 */
export declare class JsonExporter {
    /**
     * Exports a ComponentDefinition into standard JSON structure (Case H).
     */
    static exportDefinition(def: ComponentDefinition): ExportedComponentJson;
    /**
     * Exports multiple definitions as a catalog JSON.
     */
    static exportCatalog(defs: ComponentDefinition[]): ExportedComponentJson[];
    /**
     * Exports active scene instances into canonical JSON payload.
     */
    static exportScene(instances: ComponentInstance[]): ExportedSceneJson;
    /**
     * Exports an active component instance into serialized JSON string.
     */
    static exportInstance(inst: ComponentInstance): string;
}
