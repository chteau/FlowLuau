"use client";

import { memo } from "react";
import { NodeProps } from "@xyflow/react";
import NodeTemplate from "../../Template";
import { SkipForward } from "lucide-react";
import { LuauType } from "@/types/luau";

export interface ContinueStatementNodeData {
    description?: string;
}

export type ContinueStatementNodeProps = NodeProps & { data: ContinueStatementNodeData };

/**
 * Continue statement node that skips the current loop iteration and proceeds to the next one.
 * Features a single Prev flow input handle and no outputs (terminates the current iteration).
 * Commonly used within loop bodies to bypass remaining logic and advance to the next cycle.
 */
const ContinueStatementNode = memo(({ data, selected }: ContinueStatementNodeProps) => (
    <NodeTemplate
        details={{
            color: {
                background: "bg-purple-400/10",
                border: "border-purple-400/30",
                text: "text-purple-400",
                ring: "ring-purple-400/40",
            },
            icon: SkipForward,
            name: "Continue",
            description: data.description ?? "Skips to next loop iteration",
            selected,
        }}
        inputs={[{ id: "prev", label: "Prev", type: LuauType.Flow }]}
        outputs={[]}
    />
));

ContinueStatementNode.displayName = "ContinueStatementNode";

(ContinueStatementNode as any).getHandles = (_data: ContinueStatementNodeData) => ({
    inputs: [{ id: "prev", label: "Prev", type: LuauType.Flow }],
    outputs: [],
});

export default ContinueStatementNode;