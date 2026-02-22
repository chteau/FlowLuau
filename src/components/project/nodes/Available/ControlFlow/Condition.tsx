"use client";

import { memo, useState } from "react";
import { NodeProps } from "@xyflow/react";
import NodeTemplate from "../../Template";
import { Equal, EqualNot, ChevronLeft, ChevronRight } from "lucide-react";
import { LuauType } from "@/types/luau";
import {
    Select,
    SelectContent,
    SelectGroup,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";

/** Available comparison operators for the condition node. */
type ComparisonType = "==" | "~=" | ">" | "<" | ">=" | "<=";

export interface ConditionNodeData {
    comparisonType?: ComparisonType;
}

export type ConditionNodeProps = NodeProps & { data: ConditionNodeData };

/**
 * Condition comparison node that evaluates two values using a selected operator.
 * Supports six comparison operators: ==, ~=, >, <, >=, and <=.
 * Exposes two Any-type inputs (A and B) and outputs a Boolean result.
 */
const ConditionNode = memo(({ data, selected }: ConditionNodeProps) => {
    const [comparisonType, setComparisonType] = useState<ComparisonType>(
        data.comparisonType ?? "=="
    );

    return (
        <NodeTemplate
            details={{
                color: {
                    background: "bg-purple-400/10",
                    border: "border-purple-400/30",
                    text: "text-purple-400",
                    ring: "ring-purple-400/40",
                },
                icon:
                    comparisonType === "==" ? Equal
                    : comparisonType === "~=" ? EqualNot
                    : comparisonType === ">" || comparisonType === ">=" ? ChevronRight
                    : ChevronLeft,
                name: "Condition",
                description: `Checks if A ${comparisonType} B`,
                selected,
            }}
            inputs={[
                { id: "a", label: "A", type: LuauType.Any },
                { id: "b", label: "B", type: LuauType.Any },
            ]}
            outputs={[{ id: "result", label: "Result", type: LuauType.Boolean }]}
        >
            <div className="space-y-2">
                <Select
                    value={comparisonType}
                    onValueChange={(value) => setComparisonType(value as ComparisonType)}
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

ConditionNode.displayName = "ConditionNode";

(ConditionNode as any).getHandles = (_data: ConditionNodeData) => ({
    inputs: [
        { id: "a", label: "A", type: LuauType.Any },
        { id: "b", label: "B", type: LuauType.Any },
    ],
    outputs: [{ id: "result", label: "Result", type: LuauType.Boolean }],
});

export default ConditionNode;