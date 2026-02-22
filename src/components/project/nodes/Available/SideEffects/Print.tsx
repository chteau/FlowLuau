"use client";

import { memo } from "react";
import { NodeProps } from "@xyflow/react";
import NodeTemplate from "../../Template";
import { Printer } from "lucide-react";
import { LuauType } from "@/types/luau";

export interface PrintNodeData {
    value?: string;
}

export type PrintNodeProps = NodeProps & { data: PrintNodeData };

/**
 * Console output node that prints an incoming value to the debug console.
 * Features Prev/Next flow handles and a polymorphic Value input of type Any.
 * Commonly used for debugging and logging variable values during script execution.
 */
const PrintNode = memo(({ selected }: PrintNodeProps) => (
    <NodeTemplate
        details={{
            color: {
                background: "bg-blue-400/10",
                border: "border-blue-400/30",
                text: "text-blue-400",
                ring: "ring-blue-400/40",
            },
            icon: Printer,
            name: "Print",
            description: "Outputs a value to the console.",
            selected,
        }}
        inputs={[
            { id: "prev", label: "Prev", type: LuauType.Flow },
            { id: "value", label: "Value", type: LuauType.Any },
        ]}
        outputs={[{ id: "next", label: "Next", type: LuauType.Flow }]}
    />
));

PrintNode.displayName = "PrintNode";

(PrintNode as any).getHandles = (_data: PrintNodeData) => ({
    inputs: [
        { id: "prev", label: "Prev", type: LuauType.Flow },
        { id: "value", label: "Value", type: LuauType.Any },
    ],
    outputs: [{ id: "next", label: "Next", type: LuauType.Flow }],
});

export default PrintNode;