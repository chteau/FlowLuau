"use client";

import { memo, useCallback, useState } from "react";
import { NodeProps, useNodeId, useReactFlow } from "@xyflow/react";
import NodeTemplate from "../../Template";
import { Slash as OrIcon, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { LuauType } from "@/types/luau";

export interface OrNodeData {
    mode?: "linear" | "expression";
    expression?: string;
}

export type OrNodeProps = NodeProps & { data: OrNodeData };

/**
 * Logical OR node that performs boolean OR operation.
 * Linear mode exposes two Boolean inputs (A OR B); expression mode evaluates a custom logical expression.
 * Outputs a single Boolean-typed result.
 */
const OrNode = memo(({ data, selected }: OrNodeProps) => {
    const nodeId = useNodeId();
    const { setNodes } = useReactFlow();

    const [mode, setMode] = useState<"linear" | "expression">(data.mode ?? "linear");
    const [expression, setExpression] = useState(data.expression ?? "");
    const [isValid, setIsValid] = useState(true);

    const updateData = useCallback(
        (partial: Partial<OrNodeData>) => {
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
                /^\s*(?:[a-zA-Z_]\w*|true|false)(?:\s+(?:and|or|not)\s+(?:[a-zA-Z_]\w*|true|false))*\s*$/i.test(expr);
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
                icon: mode === "expression" && !isValid ? AlertTriangle : OrIcon,
                name: "Or",
                description:
                    mode === "linear"
                        ? "Logical OR (A or B)"
                        : isValid
                        ? `Evaluates: ${expression || "A or B"}`
                        : "Invalid logical expression",
                selected,
            }}
            inputs={
                mode === "linear"
                    ? [
                          { id: "a", label: "A", type: LuauType.Boolean },
                          { id: "b", label: "B", type: LuauType.Boolean },
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
                            placeholder="e.g., isAdmin or isModerator"
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

OrNode.displayName = "OrNode";

(OrNode as any).getHandles = (data: OrNodeData) => ({
    inputs:
        (data?.mode ?? "linear") === "linear"
            ? [
                  { id: "a", label: "A", type: LuauType.Boolean },
                  { id: "b", label: "B", type: LuauType.Boolean },
              ]
            : [],
    outputs: [{ id: "result", label: "Result", type: LuauType.Boolean }],
});

export default OrNode;