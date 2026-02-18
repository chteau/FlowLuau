"use client";

import { memo, useCallback } from "react";
import { NodeProps, useNodeId, useReactFlow } from "@xyflow/react";
import NodeTemplate from "../../Template";
import { FileText } from "lucide-react";
import { LuauType } from "@/types/luau";
import { Input } from "@/components/ui/input";

export interface VariableGetNodeData {
    variableName?: string;
}

export type VariableGetNodeProps = NodeProps & Partial<VariableGetNodeData>;

const VariableGetNode = memo(
    ({ data, selected }: VariableGetNodeProps) => {
        const nodeId = useNodeId();
        const { setNodes } = useReactFlow();
        const variableName = data?.variableName;

        const updateVariableName = useCallback(
            (newName: string) => {
                setNodes((nodes) =>
                    nodes.map((node) =>
                        node.id === nodeId
                            ? {
                                ...node,
                                data: {
                                    ...node.data,
                                    variableName: newName, // Prevent empty names
                                },
                            }
                            : node
                    )
                );
            },
            [nodeId, setNodes]
        );

        return (
            <NodeTemplate
                details={{
                    color: {
                        background: "bg-red-400/10",
                        border: "border-red-400/30",
                        text: "text-red-400",
                        ring: "ring-red-400/40",
                    },
                    icon: FileText,
                    name: "Get Variable",
                    description: `Reads value of "${variableName}"`,
                    selected: !!selected,
                }}
                inputs={[]}
                outputs={[
                    {
                        id: "value",
                        label: "Value",
                        type: LuauType.Any,
                    },
                ]}
            >
                <div className="space-y-2">
                    <div className="flex flex-col gap-1">
                        <label className="text-[10px] text-muted-foreground">
                            Variable Name
                        </label>
                        <Input
                            value={variableName as string}
                            onChange={(e) => updateVariableName(e.target.value)}
                            className="h-7 text-xs bg-background border-border"
                            placeholder="variable"
                            onBlur={(e) => {
                                // Ensure non-empty name on blur
                                if (!e.target.value.trim()) {
                                    updateVariableName("variable");
                                }
                            }}
                        />
                    </div>
                </div>
            </NodeTemplate>
        );
    }
);

VariableGetNode.displayName = "VariableGetNode";

// Pure node: NO execution pins, only data output
(VariableGetNode as any).getHandles = (
    data: VariableGetNodeData
) => ({
    inputs: [],
    outputs: [
        { id: "value", label: "Value", type: LuauType.Any },
    ],
});

export default VariableGetNode;