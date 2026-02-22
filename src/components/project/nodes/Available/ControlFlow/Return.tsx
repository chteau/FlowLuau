"use client";

import { memo, useCallback } from "react";
import { NodeProps, useNodeId, useReactFlow } from "@xyflow/react";
import NodeTemplate from "../../Template";
import { CornerUpLeft } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { LuauType } from "@/types/luau";
import VariableAutocomplete from "@/components/ui/variable-autocomplete";

export interface ReturnStatementNodeData {
    mode?: "linear" | "expression";
    expression?: string;
    description?: string;
    __scriptId?: string;
}

export type ReturnStatementNodeProps = NodeProps & { data: ReturnStatementNodeData };

/**
 * Return statement node that exits function execution and returns a value.
 * Features two modes: Linear mode uses a Value input handle, Expression mode allows inline Luau expressions.
 * Always has a Prev flow input and no outputs (terminates execution flow).
 */
const ReturnStatementNode = memo(({ data, selected }: ReturnStatementNodeProps) => {
    const nodeId = useNodeId();
    const { setNodes } = useReactFlow();

    const mode = data.mode ?? "linear";
    const expression = data.expression ?? "";

    const updateData = useCallback(
        (partial: Partial<ReturnStatementNodeData>) => {
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
            const valid = expr.trim() === "" || /^[a-zA-Z0-9_+\-*/%().,\s"':;]+$/.test(expr);
            updateData({
                expression: expr,
                description: valid ? `Returns: ${expr || "value"}` : "Invalid expression",
            });
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
                icon: CornerUpLeft,
                name: "Return",
                description: data.description ?? "Returns value and exits function",
                selected,
            }}
            inputs={
                mode === "linear"
                    ? [
                          { id: "prev", label: "Prev", type: LuauType.Flow },
                          { id: "value", label: "Value", type: LuauType.Any },
                      ]
                    : [{ id: "prev", label: "Prev", type: LuauType.Flow }]
            }
            outputs={[]}
        >
            <div className="space-y-2">
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
                        placeholder='e.g., "Success"'
                        className={cn("text-xs h-7 font-mono")}
                    />
                )}
            </div>
        </NodeTemplate>
    );
});

ReturnStatementNode.displayName = "ReturnStatementNode";

(ReturnStatementNode as any).getHandles = (data: ReturnStatementNodeData) => ({
    inputs:
        (data?.mode ?? "linear") === "linear"
            ? [
                  { id: "prev", label: "Prev", type: LuauType.Flow },
                  { id: "value", label: "Value", type: LuauType.Any },
              ]
            : [{ id: "prev", label: "Prev", type: LuauType.Flow }],
    outputs: [],
});

export default ReturnStatementNode;