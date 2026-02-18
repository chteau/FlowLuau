// VariableSet.tsx
"use client";
import React, { memo, useCallback } from "react";
import { NodeProps, useNodeId, useReactFlow } from "@xyflow/react";
import NodeTemplate from "../../Template";
import { FilePenLine } from "lucide-react";
import { LuauType } from "@/types/luau";
import { Input } from "@/components/ui/input";

export interface VariableSetNodeData {
    variableName?: string;
}

export type VariableSetNodeProps = NodeProps & Partial<VariableSetNodeData>;

const VariableSetNode = memo(
    ({ data, selected }: VariableSetNodeProps) => {
        const nodeId = useNodeId();
        const { setNodes } = useReactFlow();
        const variableName = data?.variableName;

        // Properly update node data in React Flow store
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
                    icon: FilePenLine,
                    name: "Set Variable",
                    description: `Assigns value to "${variableName}"`,
                    selected,
                }}
                inputs={[
                    {
                        id: "execute",
                        label: "Execute",
                        type: LuauType.Flow,
                    },
                    {
                        id: "value",
                        label: "Value",
                        type: LuauType.Any,
                    },
                ]}
                outputs={[
                    {
                        id: "next",
                        label: "Next",
                        type: LuauType.Flow,
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

VariableSetNode.displayName = "VariableSetNode";

// Impure node: HAS execution pins (causes side effects)
(VariableSetNode as any).getHandles = (
    data: VariableSetNodeData
) => ({
    inputs: [
        { id: "execute", label: "Execute", type: LuauType.Flow },
        { id: "value", label: "Value", type: LuauType.Any },
    ],
    outputs: [
        { id: "next", label: "Next", type: LuauType.Flow },
    ],
});

export default VariableSetNode;