"use client";

import { memo, useCallback, useState } from "react";
import { NodeProps, useNodeId, useReactFlow } from "@xyflow/react";
import NodeTemplate from "../../Template";
import { Type, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { LuauType } from "@/types/luau";
import VariableAutocomplete from "@/components/ui/variable-autocomplete";

export interface StringNodeData {
    mode?: "literal" | "expression";
    value?: string;
    expression?: string;
    __scriptId?: string;
}

export type StringNodeProps = NodeProps & { data: StringNodeData };

/**
 * String literal node that represents a Luau string value.
 * Literal mode stores a direct string; expression mode evaluates concatenation or variable expressions.
 * Outputs a single String-typed value with no inputs.
 */
const StringNode = memo(({ data, selected }: StringNodeProps) => {
    const nodeId = useNodeId();
    const { setNodes } = useReactFlow();

    const [mode, setMode] = useState<"literal" | "expression">(data.mode ?? "literal");
    const [literalValue, setLiteralValue] = useState(data.value ?? "");
    const [expression, setExpression] = useState(data.expression ?? "");
    const [isValid, setIsValid] = useState(true);
    const [error, setError] = useState("");

    const updateData = useCallback(
        (partial: Partial<StringNodeData>) => {
            setNodes((nodes) =>
                nodes.map((n) =>
                    n.id === nodeId ? { ...n, data: { ...n.data, ...partial } } : n
                )
            );
        },
        [nodeId, setNodes]
    );

    const handleModeChange = useCallback(
        (newMode: "literal" | "expression") => {
            setMode(newMode);
            updateData({ mode: newMode });
        },
        [updateData]
    );

    const handleLiteralChange = useCallback(
        (e: React.ChangeEvent<HTMLInputElement>) => {
            const newValue = e.target.value;
            setLiteralValue(newValue);
            updateData({ value: newValue });
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
                /^["'[\]a-zA-Z0-9_.\s%()+\-*/]+$/.test(expr);
            setIsValid(valid);
            setError(valid ? "" : "Invalid string expression");
        },
        [updateData]
    );

    return (
        <NodeTemplate
            details={{
                color: {
                    background: "bg-amber-400/10",
                    border: "border-amber-400/30",
                    text: "text-amber-400",
                    ring: "ring-amber-400/40",
                },
                icon: mode === "expression" && !isValid ? AlertTriangle : Type,
                name: "String",
                description:
                    mode === "literal"
                        ? "Represents a sequence of characters."
                        : "Evaluates a string expression (e.g., concatenation).",
                selected,
            }}
            outputs={[{ id: "output", label: "Value", type: LuauType.String }]}
        >
            <div className="space-y-2">
                <div className="flex gap-1 mb-2">
                    <Button
                        variant={mode === "literal" ? "default" : "outline"}
                        size="xs"
                        className="text-xs h-6 cursor-pointer bg-amber-400/10 hover:bg-amber-400/20"
                        onClick={() => handleModeChange("literal")}
                    >
                        Literal
                    </Button>
                    <Button
                        variant={mode === "expression" ? "default" : "outline"}
                        size="xs"
                        className="text-xs h-6 cursor-pointer bg-amber-400/10 hover:bg-amber-400/20"
                        onClick={() => handleModeChange("expression")}
                    >
                        Expression
                    </Button>
                </div>

                {mode === "literal" ? (
                    <div className="space-y-1">
                        <VariableAutocomplete
                            scriptId={data.__scriptId ?? "unknown"}
                            type="text"
                            value={literalValue}
                            onChange={handleLiteralChange}
                            placeholder='e.g., "Hello World" or greetingVar'
                            filterVariables={(v) =>
                                v.type === LuauType.String || v.type === LuauType.Any
                            }
                            className="text-xs h-7"
                        />
                        <div className="text-[10px] text-muted-foreground truncate">
                            Preview: "{literalValue || ""}"
                        </div>
                    </div>
                ) : (
                    <div className="space-y-1">
                        <VariableAutocomplete
                            scriptId={data.__scriptId ?? "unknown"}
                            type="text"
                            value={expression}
                            onChange={handleExpressionChange}
                            placeholder='e.g., "Hello " .. playerName .. "!"'
                            filterVariables={(v) =>
                                v.type === LuauType.String || v.type === LuauType.Any
                            }
                            className={cn("text-xs h-7", !isValid && "border-destructive")}
                        />
                        {!isValid && expression.trim() !== "" && (
                            <div className="text-[8px] text-destructive">{error}</div>
                        )}
                        <div className="text-[10px] text-muted-foreground italic">
                            Supports: literals, variables, and <code className="font-mono">..</code> concatenation
                        </div>
                    </div>
                )}
            </div>
        </NodeTemplate>
    );
});

StringNode.displayName = "StringNode";

(StringNode as any).getHandles = (_data: StringNodeData) => ({
    inputs: [],
    outputs: [{ id: "output", label: "Value", type: LuauType.String }],
});

export default StringNode;