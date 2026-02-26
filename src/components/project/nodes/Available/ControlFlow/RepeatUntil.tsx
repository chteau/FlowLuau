"use client";

import { memo, useCallback, useEffect } from "react";
import { NodeProps, useNodeId, useReactFlow, useStore } from "@xyflow/react";
import NodeTemplate from "../../Template";
import { RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { LuauType } from "@/types/luau";
import VariableAutocomplete from "@/components/ui/variable-autocomplete";
import { useIntellisenseStore } from "@/stores/intellisense-store";

export interface RepeatUntilLoopNodeData {
    mode?: "linear" | "expression";
    expression?: string;
    description?: string;
    __scriptId?: string;
}

export type RepeatUntilLoopNodeProps = NodeProps & { data: RepeatUntilLoopNodeData };

/**
 * Repeat-Until loop control flow node that executes at least once and continues until the condition becomes true.
 * Features two modes: Linear mode uses a Condition Boolean input handle, Expression mode allows inline Luau boolean expressions.
 * Provides Loop Body and Next output handles to control iteration and exit flow, with validation warnings for missing condition inputs.
 */
const RepeatUntilLoopNode = memo(({ data, selected }: RepeatUntilLoopNodeProps) => {
    const nodeId = useNodeId();
    const { setNodes } = useReactFlow();
    const scriptId = data.__scriptId;

    // Create and manage loop scope for repeat-until loop
    useEffect(() => {
        if (!scriptId) return;

        // Create loop scope for the repeat-until loop
        const loopScopeId = `${nodeId}-loop-scope`;
        useIntellisenseStore.getState().createScope(scriptId, {
            id: loopScopeId,
            scopeType: "loop",
            nodeId: nodeId!,
            variableNames: new Set(),
            childScopeIds: new Set(),
        });

        return () => {
            // Clean up when node is removed
            useIntellisenseStore.getState().destroyScope(scriptId, loopScopeId);
        };
    }, [scriptId, nodeId]);

    const mode = data.mode ?? "linear";
    const expression = data.expression ?? "";

    const updateData = useCallback(
        (partial: Partial<RepeatUntilLoopNodeData>) => {
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
                description: valid ? `Loop until: ${expr || "condition"}` : "Invalid expression",
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
                icon: RefreshCw,
                name: "Repeat Until Loop",
                description: data.description ?? "Loop until condition is true",
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
                        placeholder="e.g., index >= 10"
                        className={cn("text-xs h-7 font-mono")}
                    />
                )}
            </div>
        </NodeTemplate>
    );
});

RepeatUntilLoopNode.displayName = "RepeatUntilLoopNode";

(RepeatUntilLoopNode as any).getHandles = (_data: RepeatUntilLoopNodeData) => ({
    inputs:
        (_data?.mode ?? "linear") === "linear"
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

export default RepeatUntilLoopNode;