"use client";

import { memo } from "react";
import { NodeProps } from "@xyflow/react";
import NodeTemplate from "./Template";
import { Play } from "lucide-react";
import { LuauType } from "@/types/luau";

export type StartNodeProps = NodeProps;

const StartNode = memo(({ selected }: StartNodeProps) => (
    <NodeTemplate
        details={{
            icon: Play,
            name: "Start",
            description: "Starting point of your script.",
            selected,
        }}
        outputs={[{ id: "output", type: LuauType.Flow }]}
    />
));

StartNode.displayName = "StartNode";

(StartNode as any).getHandles = () => ({
    inputs: [],
    outputs: [{ id: "output", type: LuauType.Flow }],
});

export default StartNode;