"use client";

import { memo, useCallback, useState } from "react";
import { NodeProps, useNodeId, useReactFlow } from "@xyflow/react";
import NodeTemplate from "../../Template";
import { Ban, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { LuauType } from "@/types/luau";

export interface NotNodeData {
    mode?: "linear" | "expression";
    expression?: string;
}

export type NotNodeProps = NodeProps & { data: NotNodeData };

/**
 * Logical NOT node that performs boolean negation.
 * Linear mode exposes one Boolean input (NOT A); expression mode evaluates a custom logical expression.
 * Outputs a single Boolean-typed result.
 */
const NotNode = memo(({ data, selected }: NotNodeProps) => {
    const nodeId = useNodeId();
    const { setNodes } = useReactFlow();

    const [mode, setMode] = useState<"linear" | "expression">(data.mode ?? "linear");
    const [expression, setExpression] = useState(data.expression ?? "");
    const [isValid, setIsValid] = useState(true);

    const updateData = useCallback(
        (partial: Partial<NotNodeData>) => {
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
            // Basic validation for logical expressions
            const valid =
                expr.trim() === "" ||
                /^\s*(?:[a-zA-Z_]\w*|true|false)\s*$/i.test(expr) ||
                /^\s*not\s+[a-zA-Z_]\w*/i.test(expr);
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
                icon: mode === "expression" && !isValid ? AlertTriangle : Ban,
                name: "Not",
                description:
                    mode === "linear"
                        ? "Logical NOT (not A)"
                        : isValid
                        ? `Evaluates: ${expression || "not A"}`
                        : "Invalid logical expression",
                selected,
            }}
            inputs={
                mode === "linear"
                    ? [{ id: "a", label: "A", type: LuauType.Boolean }]
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
                            placeholder="e.g., not isDisabled"
                            className={cn("text-xs h-7 font-mono", !isValid && "border-destructive")}
                        />
                        {!isValid && (
                            <div className="text-[8px] text-destructive">
                                Invalid logical expression
                            </div>
                        )}
                    </div>
                )}
            </div>
        </NodeTemplate>
    );
});

NotNode.displayName = "NotNode";

(NotNode as any).getHandles = (data: NotNodeData) => ({
    inputs:
        (data?.mode ?? "linear") === "linear"
            ? [{ id: "a", label: "A", type: LuauType.Boolean }]
            : [],
    outputs: [{ id: "result", label: "Result", type: LuauType.Boolean }],
});

export default NotNode;