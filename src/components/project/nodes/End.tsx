"use client";

import { memo } from "react";
import { NodeProps } from "@xyflow/react";
import NodeTemplate from "./Template";
import { Square } from "lucide-react";
import { LuauType } from "@/types/luau";

export type EndNodeProps = NodeProps;

const EndNode = memo(({ selected }: EndNodeProps) => (
    <NodeTemplate
        details={{
            icon: Square,
            name: "End",
            description: "Ending point.",
            selected,
        }}
        inputs={[{ id: "input", type: LuauType.Flow }]}
    />
));

EndNode.displayName = "EndNode";

(EndNode as any).getHandles = () => ({
    inputs: [{ id: "input", type: LuauType.Flow }],
    outputs: [],
});

export default EndNode;