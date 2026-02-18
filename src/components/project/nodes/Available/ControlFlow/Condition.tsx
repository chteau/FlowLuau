"use client";
import React, { memo, useState } from 'react';
import { NodeProps } from '@xyflow/react';
import NodeTemplate from '../../Template';
import { Equal, EqualNot, ChevronLeft, ChevronRight } from 'lucide-react';
import { LuauType } from '@/types/luau';
import {
    Select,
    SelectContent,
    SelectGroup,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";

/**
 * Available comparison operators for the condition node
 */
type ComparisonType = '==' | '~=' | '>' | '<' | '>=' | '<=';

/**
 * Data structure for the ConditionNode component
 */
export interface ConditionNodeData {
    /** The comparison operator to use */
    comparisonType?: ComparisonType;
}

/**
 * Props interface for the ConditionNode component
 */
export type ConditionNodeProps = NodeProps & Partial<ConditionNodeData>;

/**
 * ConditionNode component represents a comparison operation in Luau
 *
 * This node:
 * - Allows comparing two values with various operators
 * - Provides a dropdown to select the comparison operator
 * - Has inputs for both values being compared (A and B)
 * - Outputs a boolean result of the comparison
 * - Is a "pure" node with no execution flow pins (only data pins)
 *
 * The node is designed for implementing comparison logic in visual scripts,
 * where the result can be used in conditional flows or other logic.
 *
 * @component
 * @param {ConditionNodeProps} props - Node properties provided by React Flow
 *
 * @example
 * // Register in node types
 * const nodeTypes = useMemo(() => ({
 *   condition: ConditionNode
 * }), []);
 *
 * @example
 * // Create a condition node
 * const conditionNode = {
 *   id: 'condition-1',
 *   type: 'condition',
 *    { comparisonType: '==' },
 *   position: { x: 100, y: 200 }
 * };
 */
const ConditionNode = memo(({
    data,
    isConnectable,
    selected,
    dragging
}: ConditionNodeProps) => {
    const [comparisonType, setComparisonType] = useState<ComparisonType>(
        typeof data.comparisonType === 'string' && ['==', '~=', '>', '<', '>=', '<='].includes(data.comparisonType)
            ? data.comparisonType as ComparisonType
            : '=='
    );

    /**
     * Returns the appropriate icon based on the current comparison type
     *
     * @returns Lucide icon component corresponding to the comparison operator
     */
    const getIcon = () => {
        switch (comparisonType) {
            case '==': return Equal;
            case '~=': return EqualNot;
            case '>':
            case '>=': return ChevronRight;
            case '<':
            case '<=': return ChevronLeft;
            default: return Equal;
        }
    };

    const Icon = getIcon();

    return (
        <NodeTemplate
            details={{
                color: {
                    background: "bg-purple-400/10",
                    border: "border-purple-400/30",
                    text: "text-purple-400",
                    ring: "ring-purple-400/40",
                },
                icon: Icon,
                name: "Condition",
                description: `Checks if A ${comparisonType} B`,
                selected
            }}
            inputs={[
                {
                    id: "a",
                    label: "A",
                    type: LuauType.Any
                },
                {
                    id: "b",
                    label: "B",
                    type: LuauType.Any
                }
            ]}
            outputs={[
                {
                    id: "result",
                    label: "Result",
                    type: LuauType.Boolean
                }
            ]}
        >
            <div className="space-y-2">
                <Select
                    value={comparisonType}
                    onValueChange={(value: string) => setComparisonType(value as ComparisonType)}
                >
                    <SelectTrigger className="w-full">
                        <SelectValue placeholder="Operator" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectGroup>
                            <SelectItem value="==">Equal (==)</SelectItem>
                            <SelectItem value="~=">Not Equal (~=)</SelectItem>
                            <SelectItem value=">">Greater Than (&gt;)</SelectItem>
                            <SelectItem value="<">Less Than (&lt;)</SelectItem>
                            <SelectItem value=">=">Greater or Equal (&gt;=)</SelectItem>
                            <SelectItem value="<=">Less or Equal (&lt;=)</SelectItem>
                        </SelectGroup>
                    </SelectContent>
                </Select>
            </div>
        </NodeTemplate>
    );
});

ConditionNode.displayName = 'ConditionNode';

/**
 * Generates handle configuration for the ConditionNode
 *
 * @param data - Node data containing configuration
 * @returns Object with inputs and outputs arrays for handle configuration
 */
interface HandleConfig {
    inputs: Array<{
        id: string;
        label: string;
        type: LuauType;
    }>;
    outputs: Array<{
        id: string;
        label: string;
        type: LuauType;
    }>;
}

interface GetHandlesFunction {
    (data: ConditionNodeData): HandleConfig;
}

(ConditionNode as any).getHandles = ((data: ConditionNodeData): HandleConfig => ({
    inputs: [
        { id: "a", label: "A", type: LuauType.Any },
        { id: "b", label: "B", type: LuauType.Any }
    ],
    outputs: [
        { id: "result", label: "Result", type: LuauType.Boolean }
    ]
})) as GetHandlesFunction;

export default ConditionNode;