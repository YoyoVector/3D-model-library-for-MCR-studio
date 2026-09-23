import { ComponentInstance } from '../core/Instance.ts';
export interface ConnectionValidationResult {
    valid: boolean;
    code: 'OK' | 'WIDTH_MISMATCH' | 'DEPTH_MISMATCH' | 'TYPE_MISMATCH' | 'PORT_NOT_FOUND';
    error?: string;
    recommendation?: string;
    details?: {
        portA: {
            id: string;
            width: number;
            depth: number;
            type: string;
        };
        portB: {
            id: string;
            width: number;
            depth: number;
            type: string;
        };
    };
}
/**
 * Engineering Connection Validator.
 * Validates dimensional and electrical/mechanical compatibility between mating ports.
 */
export declare class ConnectionValidator {
    static validateConnection(instanceA: ComponentInstance, portIdA: string, instanceB: ComponentInstance, portIdB: string): ConnectionValidationResult;
}
