import { ComponentDefinition, ComponentOriginType } from '../core/Schema.ts';
import { ReducerType } from '../geometry/TrayLayouts.ts';
export declare function straightTrayDefinition(): ComponentDefinition;
export declare function dividedStraightTrayDefinition(): ComponentDefinition;
export declare function horizontalElbowDefinition(id: string, angleDeg: number, origin: ComponentOriginType, pages: string): ComponentDefinition;
export declare function verticalBendDefinition(id: string, angleDeg: number, isOutside: boolean, origin: ComponentOriginType, pages: string): ComponentDefinition;
export declare function teeDefinition(): ComponentDefinition;
export declare function crossDefinition(): ComponentDefinition;
export declare function reducerDefinition(id: string, type: ReducerType, meta: {
    name: string;
    nameZh: string;
    page: string;
}): ComponentDefinition;
