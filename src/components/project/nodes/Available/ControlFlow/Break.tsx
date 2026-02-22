"use client";

import { memo } from "react";
import { NodeProps } from "@xyflow/react";
import NodeTemplate from "../../Template";
import { CornerDownLeft } from "lucide-react";
import { LuauType } from "@/types/luau";

export interface BreakStatementNodeData {
    description?: string;
}

export type BreakStatementNodeProps = NodeProps & { data: BreakStatementNodeData };

/**
 * Break statement node that exits the current loop immediately and transfers control to the statement following the loop.
 * Features a single Prev flow input handle and no outputs (terminates loop execution).
 * Commonly used within loop bodies to prematurely exit based on specific conditions.
 */
const BreakStatementNode = memo(({ data, selected }: BreakStatementNodeProps) => (
    <NodeTemplate
        details={{
            color: {
                background: "bg-purple-400/10",
                border: "border-purple-400/30",
                text: "text-purple-400",
                ring: "ring-purple-400/40",
            },
            icon: CornerDownLeft,
            name: "Break",
            description: data.description ?? "Exits the current loop immediately",
            selected,
        }}
        inputs={[{ id: "prev", label: "Prev", type: LuauType.Flow }]}
        outputs={[]}
    />
));

BreakStatementNode.displayName = "BreakStatementNode";

(BreakStatementNode as any).getHandles = (_data: BreakStatementNodeData) => ({
    inputs: [{ id: "prev", label: "Prev", type: LuauType.Flow }],
    outputs: [],
});

export default BreakStatementNode;