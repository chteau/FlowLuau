"use client";

import { memo } from "react";
import { NodeProps } from "@xyflow/react";
import NodeTemplate from "../../Template";
import { Slash } from "lucide-react";
import { LuauType } from "@/types/luau";

export interface NilNodeData {
    value?: null;
}

export type NilNodeProps = NodeProps & { data: NilNodeData };

/**
 * Nil literal node that represents the absence of a value in Luau.
 * Outputs a single Nil-typed value with no inputs.
 */
const NilNode = memo(({ selected }: NilNodeProps) => (
    <NodeTemplate
        details={{
            color: {
                background: "bg-amber-400/10",
                border: "border-amber-400/30",
                text: "text-amber-400",
                ring: "ring-amber-400/40",
            },
            icon: Slash,
            name: "Nil",
            description: "Represents the absence of a value.",
            selected,
        }}
        outputs={[{ id: "output", label: "Value", type: LuauType.Nil }]}
    >
        <div className="flex justify-center py-2">
            <span className="text-xs bg-muted px-2 py-0.5 rounded text-muted-foreground font-mono">
                nil
            </span>
        </div>
    </NodeTemplate>
));

NilNode.displayName = "NilNode";

(NilNode as any).getHandles = (_data: NilNodeData) => ({
    inputs: [],
    outputs: [{ id: "output", label: "Value", type: LuauType.Nil }],
});

export default NilNode;