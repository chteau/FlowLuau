"use client";

import { memo, useCallback, useState } from "react";
import { NodeProps, useNodeId, useReactFlow } from "@xyflow/react";
import NodeTemplate from "../../Template";
import { Minus, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { LuauType } from "@/types/luau";

export interface SubtractNodeData {
    mode?: "linear" | "expression";
    expression?: string;
}

export type SubtractNodeProps = NodeProps & { data: SubtractNodeData };

/**
 * Subtraction node that subtracts one numeric value from another.
 * Linear mode exposes two Number inputs (A - B); expression mode evaluates a custom arithmetic expression.
 * Outputs a single Number-typed result.
 */
const SubtractNode = memo(({ data, selected }: SubtractNodeProps) => {
    const nodeId = useNodeId();
    const { setNodes } = useReactFlow();

    const [mode, setMode] = useState<"linear" | "expression">(data.mode ?? "linear");
    const [expression, setExpression] = useState(data.expression ?? "");
    const [isValid, setIsValid] = useState(true);

    const updateData = useCallback(
        (partial: Partial<SubtractNodeData>) => {
            setNodes((nodes) =>
                nodes.map((n) =>
                    n.id === nodeId ? { ...n, data: { ...n.data, ...partial } } : n
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
                icon: mode === "expression" && !isValid ? AlertTriangle : Minus,
                name: "Subtract",
                description:
                    mode === "linear"
                        ? "Subtracts B from A (A - B)"
                        : isValid
                        ? `Evaluates: ${expression || "A - B"}`
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
                            value={expression}
                            onChange={handleExpressionChange}
                            placeholder="e.g., health - damage"
                            className={cn("text-xs h-7 font-mono", !isValid && "border-destructive")}
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

SubtractNode.displayName = "SubtractNode";

(SubtractNode as any).getHandles = (data: SubtractNodeData) => ({
    inputs:
        (data?.mode ?? "linear") === "linear"
            ? [
                  { id: "a", label: "A", type: LuauType.Number },
                  { id: "b", label: "B", type: LuauType.Number },
              ]
            : [],
    outputs: [{ id: "result", label: "Result", type: LuauType.Number }],
});

export default SubtractNode;