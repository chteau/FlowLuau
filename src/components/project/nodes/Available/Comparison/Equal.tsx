"use client";

import { memo, useCallback, useState } from "react";
import { NodeProps, useNodeId, useReactFlow } from "@xyflow/react";
import NodeTemplate from "../../Template";
import { Equal as EqualIcon, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { LuauType } from "@/types/luau";

export interface EqualNodeData {
    mode?: "linear" | "expression";
    expression?: string;
}

export type EqualNodeProps = NodeProps & { data: EqualNodeData };

/**
 * Comparison node that checks equality (==).
 * Linear mode exposes two generic inputs (A == B); expression mode evaluates a custom comparison expression.
 * Outputs a single Boolean-typed result.
 */
const EqualNode = memo(({ data, selected }: EqualNodeProps) => {
    const nodeId = useNodeId();
    const { setNodes } = useReactFlow();

    const [mode, setMode] = useState<"linear" | "expression">(data.mode ?? "linear");
    const [expression, setExpression] = useState(data.expression ?? "");
    const [isValid, setIsValid] = useState(true);

    const updateData = useCallback(
        (partial: Partial<EqualNodeData>) => {
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
            const valid =
                expr.trim() === "" ||
                /^\s*(?:[a-zA-Z_)\w*|\d+(?:\.\d+)?|true|false|\"[^\"]*\"|'[^']*')\s*(?:==|~=|<|<=|>|>=)\s*.+$/i.test(expr);
            setIsValid(valid);
        },
        [updateData]
    );

    return (
        <NodeTemplate
            details={{
                color: {
                    background: "bg-purple-400/10",
                    border: "border-purple-400/30",
                    text: "text-purple-400",
                    ring: "ring-purple-400/40",
                },
                icon: mode === "expression" && !isValid ? AlertTriangle : EqualIcon,
                name: "Equal",
                description:
                    mode === "linear"
                        ? "Equality check (A == B)"
                        : isValid
                        ? `Evaluates: ${expression || "A == B"}`
                        : "Invalid comparison expression",
                selected,
            }}
            inputs={
                mode === "linear"
                    ? [
                          { id: "a", label: "A", type: LuauType.Any },
                          { id: "b", label: "B", type: LuauType.Any },
                      ]
                    : []
            }
            outputs={[{ id: "result", label: "Result", type: LuauType.Boolean }]}
        >
            <div className="space-y-2">
                <div className="flex gap-1 mb-2">
                    <Button
                        variant={mode === "linear" ? "default" : "outline"}
                        size="xs"
                        className="text-xs h-6 cursor-pointer bg-purple-400/10 hover:bg-purple-400/20"
                        onClick={() => handleModeChange("linear")}
                    >
                        Linear
                    </Button>
                    <Button
                        variant={mode === "expression" ? "default" : "outline"}
                        size="xs"
                        className="text-xs h-6 cursor-pointer bg-purple-400/10 hover:bg-purple-400/20"
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
                            placeholder="e.g., score == 100"
                            className={cn("text-xs h-7 font-mono", !isValid && "border-destructive")}
                        />
                        {!isValid && (
                            <div className="text-[8px] text-destructive">
                                Invalid comparison expression
                            </div>
                        )}
                    </div>
                )}
            </div>
        </NodeTemplate>
    );
});

EqualNode.displayName = "EqualNode";

(EqualNode as any).getHandles = (data: EqualNodeData) => ({
    inputs:
        (data?.mode ?? "linear") === "linear"
            ? [
                  { id: "a", label: "A", type: LuauType.Any },
                  { id: "b", label: "B", type: LuauType.Any },
              ]
            : [],
    outputs: [{ id: "result", label: "Result", type: LuauType.Boolean }],
});

export default EqualNode;