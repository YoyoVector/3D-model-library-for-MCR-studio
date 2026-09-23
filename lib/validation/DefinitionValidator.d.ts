import { ComponentDefinition } from '../core/Schema.ts';
export interface DefinitionValidationReport {
    definitionId: string;
    valid: boolean;
    errors: string[];
    warnings: string[];
}
/**
 * Validates ComponentDefinition integrity, schema version, and port orthonormality.
 */
export declare class DefinitionValidator {
    static validate(def: ComponentDefinition): DefinitionValidationReport;
}
