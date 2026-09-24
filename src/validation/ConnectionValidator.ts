/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import type { ComponentInstance } from '../core/Instance.ts';

export interface ConnectionValidationResult {
  valid: boolean;
  code: 'OK' | 'WIDTH_MISMATCH' | 'DEPTH_MISMATCH' | 'TYPE_MISMATCH' | 'STYLE_MISMATCH' | 'PORT_NOT_FOUND';
  error?: string;
  recommendation?: string;
  details?: {
    portA: { id: string; width: number; depth: number; type: string };
    portB: { id: string; width: number; depth: number; type: string };
  };
}

/**
 * Engineering Connection Validator.
 * Validates dimensional and electrical/mechanical compatibility between mating ports.
 */
export class ConnectionValidator {
  public static validateConnection(
    instanceA: ComponentInstance,
    portIdA: string,
    instanceB: ComponentInstance,
    portIdB: string
  ): ConnectionValidationResult {
    const portsA = instanceA.definition.getLocalPorts(instanceA.effectiveParameters);
    const portsB = instanceB.definition.getLocalPorts(instanceB.effectiveParameters);

    const portA = portsA.find((p) => p.id === portIdA);
    const portB = portsB.find((p) => p.id === portIdB);

    if (!portA || !portB) {
      return {
        valid: false,
        code: 'PORT_NOT_FOUND',
        error: `One or both ports not found (${portIdA} on ${instanceA.instanceId}, ${portIdB} on ${instanceB.instanceId})`,
      };
    }

    // Check connection type compatibility
    if (portA.connectionType !== portB.connectionType) {
      return {
        valid: false,
        code: 'TYPE_MISMATCH',
        error: `介面類型不相符 (Type Mismatch: ${portA.connectionType} vs ${portB.connectionType})`,
        recommendation: '請選用相同連接介面類型之配件',
        details: {
          portA: { id: portA.id, width: portA.width, depth: portA.depth, type: portA.connectionType },
          portB: { id: portB.id, width: portB.width, depth: portB.depth, type: portB.connectionType },
        },
      };
    }

    // Check width match (Case B criteria)
    if (Math.abs(portA.width - portB.width) > 1.0) {
      return {
        valid: false,
        code: 'WIDTH_MISMATCH',
        error: `寬度不相符 (Width Mismatch: ${portA.width}mm != ${portB.width}mm)`,
        recommendation: `建議使用異徑大小頭 (FITTING_REDUCER_CENTER, LEFT 或 RIGHT) 進行過渡轉接 (${portA.width}mm ➔ ${portB.width}mm)`,
        details: {
          portA: { id: portA.id, width: portA.width, depth: portA.depth, type: portA.connectionType },
          portB: { id: portB.id, width: portB.width, depth: portB.depth, type: portB.connectionType },
        },
      };
    }

    // Check depth match
    if (Math.abs(portA.depth - portB.depth) > 1.0) {
      return {
        valid: false,
        code: 'DEPTH_MISMATCH',
        error: `深度/邊高不相符 (Depth Mismatch: ${portA.depth}mm != ${portB.depth}mm)`,
        recommendation: '請確認托架邊高規格一致',
        details: {
          portA: { id: portA.id, width: portA.width, depth: portA.depth, type: portA.connectionType },
          portB: { id: portB.id, width: portB.width, depth: portB.depth, type: portB.connectionType },
        },
      };
    }

    // Check physical tray style (ladder I-rail vs ventilated channel faces cannot be spliced)
    const styleA = portA.connectionFace?.style;
    const styleB = portB.connectionFace?.style;
    if (styleA && styleB && styleA !== styleB) {
      return {
        valid: false,
        code: 'STYLE_MISMATCH',
        error: `托架型式不相符 (Tray Style Mismatch: ${styleA} vs ${styleB})`,
        recommendation: '梯型與沖底型端面構造不同，請選用同一型錄系列之配件',
        details: {
          portA: { id: portA.id, width: portA.width, depth: portA.depth, type: portA.connectionType },
          portB: { id: portB.id, width: portB.width, depth: portB.depth, type: portB.connectionType },
        },
      };
    }

    return {
      valid: true,
      code: 'OK',
      details: {
        portA: { id: portA.id, width: portA.width, depth: portA.depth, type: portA.connectionType },
        portB: { id: portB.id, width: portB.width, depth: portB.depth, type: portB.connectionType },
      },
    };
  }
}
