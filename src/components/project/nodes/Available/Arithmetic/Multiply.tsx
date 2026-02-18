"use client";
import React, { memo, useCallback, useState } from "react";
import { NodeProps, useNodeId, useReactFlow } from "@xyflow/react";
import NodeTemplate from "../../Template";
import { Asterisk, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { LuauType } from "@/types/luau";

export interface MultiplyNodeData {
    mode?: "linear" | "expression";
    expression?: string;
}

export type MultiplyNodeProps = NodeProps & Partial<MultiplyNodeData>;

const MultiplyNode = memo(({ data, selected }: MultiplyNodeProps) => {
    const nodeId = useNodeId();
    const { setNodes } = useReactFlow();

    const [mode, setMode] = useState<"linear" | "expression">((data?.mode as "linear" | "expression") || "linear");
    const [expression, setExpression] = useState(data?.expression || "");
    const [isValid, setIsValid] = useState(true);

    const updateData = useCallback(
        (partial: Partial<MultiplyNodeData>) => {
            setNodes((nodes) =>
                nodes.map((node) =>
                    node.id === nodeId
                        ? { ...node, data: { ...node.data, ...partial } }
                        : node
                )
            );
        },
        [nodeId, setNodes]
    );

    const handleModeChange = useCallback(
        (newMode: "linear" | "expression") => {
            setMode(newMode);
            updateData({ mode: newMode });
        },
        [updateData]
    );

    const handleExpressionChange = useCallback(
        (e: React.ChangeEvent<HTMLInputElement>) => {
            const expr = e.target.value;
            setExpression(expr);
            updateData({ expression: expr });

            const valid = expr.trim() === "" || /^[a-zA-Z0-9_+\-*/%().,\s]+$/.test(expr);
            setIsValid(valid);
        },
        [updateData]
    );

    return (
        <NodeTemplate
            details={{
                color: {
                    background: "bg-green-400/10",
                    border: "border-green-400/30",
                    text: "text-green-400",
                    ring: "ring-green-400/40",
                },
                icon: mode === "linear" ? Asterisk : isValid ? Asterisk : AlertTriangle,
                name: "Multiply",
                description:
                    mode === "linear"
                        ? "Multiplies two numbers (A * B)"
                        : isValid
                            ? `Evaluates: ${expression || "A * B"}`
                            : "Invalid expression",
                selected,
            }}
            inputs={
                mode === "linear"
                    ? [
                        { id: "a", label: "A", type: LuauType.Number },
                        { id: "b", label: "B", type: LuauType.Number },
                    ]
                    : []
            }
            outputs={[{ id: "result", label: "Result", type: LuauType.Number }]}
        >
            <div className="space-y-2">
                <div className="flex gap-1 mb-2">
                    <Button
                        variant={mode === "linear" ? "default" : "outline"}
                        size="xs"
                        className="text-xs h-6 cursor-pointer bg-green-400/10 hover:bg-green-400/20"
                        onClick={() => handleModeChange("linear")}
                    >
                        Linear
                    </Button>
                    <Button
                        variant={mode === "expression" ? "default" : "outline"}
                        size="xs"
                        className="text-xs h-6 cursor-pointer bg-green-400/10 hover:bg-green-400/20"
                        onClick={() => handleModeChange("expression")}
                    >
                        Expression
                    </Button>
                </div>

                {mode === "expression" && (
                    <div className="space-y-1">
                        <Input
                            value={expression as string}
                            onChange={handleExpressionChange}
                            placeholder="e.g., width * height"
                            className={cn(
                                "text-xs h-7 font-mono",
                                !isValid && "border-destructive"
                            )}
                        />
                        {!isValid && (
                            <div className="text-[8px] text-destructive">
                                Invalid arithmetic expression
                            </div>
                        )}
                    </div>
                )}
            </div>
        </NodeTemplate>
    );
});

MultiplyNode.displayName = "MultiplyNode";

(MultiplyNode as any).getHandles = (data: MultiplyNodeData) => ({
    inputs:
        data?.mode === "linear"
            ? [
                { id: "a", label: "A", type: LuauType.Number },
                { id: "b", label: "B", type: LuauType.Number },
            ]
            : [],
    outputs: [{ id: "result", label: "Result", type: LuauType.Number }],
});

export default MultiplyNode;