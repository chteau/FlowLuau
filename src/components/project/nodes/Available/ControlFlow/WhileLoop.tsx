"use client";

import { memo, useCallback } from "react";
import { NodeProps, useNodeId, useReactFlow, useStore } from "@xyflow/react";
import NodeTemplate from "../../Template";
import { Clock } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { LuauType } from "@/types/luau";
import VariableAutocomplete from "@/components/ui/variable-autocomplete";

export interface WhileLoopNodeData {
    mode?: "linear" | "expression";
    expression?: string;
    description?: string;
    __scriptId?: string;
}

export type WhileLoopNodeProps = NodeProps & { data: WhileLoopNodeData };

/**
 * While loop control flow node with two operating modes:
 * - Linear mode: Uses a Condition input handle (Boolean type) connected from a Condition node
 * - Expression mode: Allows direct text input of a Luau boolean expression
 *
 * Features Loop Body and Next output handles to control iteration and exit flow.
 * Displays a warning when in linear mode without a connected condition input.
 */
const WhileLoopNode = memo(({ data, selected }: WhileLoopNodeProps) => {
    const nodeId = useNodeId();
    const { setNodes } = useReactFlow();

    const mode = data.mode ?? "linear";
    const expression = data.expression ?? "";

    const updateData = useCallback(
        (partial: Partial<WhileLoopNodeData>) => {
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

    const handleExpressionChange = useCallback(
        (e: React.ChangeEvent<HTMLInputElement>) => {
            const expr = e.target.value;
            const valid = expr.trim() === "" || /^[a-zA-Z0-9_+\-*/%().,\s=!<>]+$/.test(expr);
            updateData({
                expression: expr,
                description: valid ? `Loop while: ${expr || "condition"}` : "Invalid expression",
            });
        },
        [updateData]
    );

    const conditionEdges = useStore((s) =>
        s.edges.filter((e) => e.target === nodeId && e.targetHandle?.startsWith("condition"))
    );
    const mainConditionConnected = conditionEdges.some((e) => e.targetHandle === "condition");

    return (
        <NodeTemplate
            details={{
                color: {
                    background: "bg-purple-400/10",
                    border: cn("border-purple-400/30", !mainConditionConnected && "border-destructive animate-pulse"),
                    text: "text-purple-400",
                    ring: "ring-purple-400/40",
                },
                icon: Clock,
                name: "While Loop",
                description: data.description ?? "Loop while condition is true",
                selected,
            }}
            inputs={
                mode === "linear"
                    ? [
                          { id: "prev", label: "Prev", type: LuauType.Flow },
                          { id: "condition", label: "Condition", type: LuauType.Boolean },
                      ]
                    : [{ id: "prev", label: "Prev", type: LuauType.Flow }]
            }
            outputs={[
                { id: "loop", label: "Loop Body", type: LuauType.Flow },
                { id: "next", label: "Next", type: LuauType.Flow },
            ]}
        >
            <div className="space-y-2">
                {mode === "linear" && !mainConditionConnected && (
                    <span className="text-xs text-destructive block mb-5">
                        Condition Node Input missing.
                    </span>
                )}

                <div className="flex gap-1 mb-2">
                    <Button
                        variant={mode === "linear" ? "default" : "outline"}
                        size="xs"
                        className="text-xs h-6 cursor-pointer bg-purple-400/10 hover:bg-purple-400/20"
                        onClick={() => updateData({ mode: "linear" })}
                    >
                        Linear
                    </Button>
                    <Button
                        variant={mode === "expression" ? "default" : "outline"}
                        size="xs"
                        className="text-xs h-6 cursor-pointer bg-purple-400/10 hover:bg-purple-400/20"
                        onClick={() => updateData({ mode: "expression" })}
                    >
                        Expression
                    </Button>
                </div>

                {mode === "expression" && (
                    <VariableAutocomplete
                        scriptId={data.__scriptId ?? "unknown"}
                        value={expression}
                        onChange={handleExpressionChange}
                        placeholder="e.g., index < 10"
                        className={cn("text-xs h-7 font-mono")}
                    />
                )}
            </div>
        </NodeTemplate>
    );
});

WhileLoopNode.displayName = "WhileLoopNode";

(WhileLoopNode as any).getHandles = (data: WhileLoopNodeData) => ({
    inputs:
        (data?.mode ?? "linear") === "linear"
            ? [
                  { id: "prev", label: "Prev", type: LuauType.Flow },
                  { id: "condition", label: "Condition", type: LuauType.Boolean },
              ]
            : [{ id: "prev", label: "Prev", type: LuauType.Flow }],
    outputs: [
        { id: "loop", label: "Loop Body", type: LuauType.Flow },
        { id: "next", label: "Next", type: LuauType.Flow },
    ],
});

export default WhileLoopNode;