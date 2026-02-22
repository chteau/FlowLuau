"use client";

import { memo, useState } from "react";
import { NodeProps } from "@xyflow/react";
import NodeTemplate from "../../Template";
import { ToggleRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { LuauType } from "@/types/luau";
import VariableAutocomplete from "@/components/ui/variable-autocomplete";

export interface BooleanNodeData {
    mode?: "literal" | "expression";
    value?: boolean;
    expression?: string;
    __scriptId?: string;
}

export type BooleanNodeProps = NodeProps & { data: BooleanNodeData };

/**
 * Boolean literal node that represents a Luau boolean value.
 * Literal mode provides a toggle between true and false; expression mode evaluates a Luau boolean expression.
 * Outputs a single Boolean-typed value with no inputs.
 */
const BooleanNode = memo(({ data, selected }: BooleanNodeProps) => {
    const [mode, setMode] = useState<"literal" | "expression">(data.mode ?? "literal");
    const [literalValue, setLiteralValue] = useState(data.value ?? true);
    const [expression, setExpression] = useState(data.expression ?? "");
    const [isValid, setIsValid] = useState(true);
    const [error, setError] = useState("");

    const handleExpressionChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const expr = e.target.value;
        setExpression(expr);
        const valid =
            expr.trim() === "" ||
            /^\s*(?:[a-zA-Z_]\w*|\d+(?:\.\d+)?)\s*(==|~=|>=|<=|>|<)\s*(?:[a-zA-Z_]\w*|\d+(?:\.\d+)?)\s*$/.test(expr);
        setIsValid(valid);
        setError(valid ? "" : "Invalid boolean expression (expected: A <op> B)");
    };

    return (
        <NodeTemplate
            details={{
                color: {
                    background: "bg-amber-400/10",
                    border: "border-amber-400/30",
                    text: "text-amber-400",
                    ring: "ring-amber-400/40",
                },
                icon: ToggleRight,
                name: "Boolean",
                description:
                    mode === "literal"
                        ? "Represents a true/false value."
                        : "Evaluates a boolean expression.",
                selected,
            }}
            outputs={[{ id: "output", label: "Value", type: LuauType.Boolean }]}
        >
            <div className="space-y-2 mb-4">
                <div className="flex gap-1 mb-2">
                    <Button
                        variant={mode === "literal" ? "default" : "outline"}
                        size="xs"
                        className="text-xs h-6 cursor-pointer bg-amber-300/10 hover:bg-amber-300/20"
                        onClick={() => setMode("literal")}
                    >
                        Literal
                    </Button>
                    <Button
                        variant={mode === "expression" ? "default" : "outline"}
                        size="xs"
                        className="text-xs h-6 cursor-pointer bg-amber-300/10 hover:bg-amber-300/20"
                        onClick={() => setMode("expression")}
                    >
                        Expression
                    </Button>
                </div>

                {mode === "literal" ? (
                    <Button
                        variant={literalValue ? "default" : "outline"}
                        size="sm"
                        className={cn(
                            "w-full h-7 text-xs cursor-pointer",
                            literalValue
                                ? "bg-amber-400/40 hover:bg-amber-400/50"
                                : "text-muted-foreground"
                        )}
                        onClick={() => setLiteralValue((v) => !v)}
                    >
                        {literalValue ? "TRUE" : "FALSE"}
                    </Button>
                ) : (
                    <div className="space-y-1">
                        <VariableAutocomplete
                            scriptId={data.__scriptId ?? "unknown"}
                            type="text"
                            value={expression}
                            onChange={handleExpressionChange}
                            placeholder='e.g., "x > 5 and y < 10"'
                            className={cn("text-xs h-7", !isValid && "border-destructive")}
                        />
                        {!isValid && (
                            <div className="text-[8px] text-destructive">{error}</div>
                        )}
                    </div>
                )}
            </div>
        </NodeTemplate>
    );
});

BooleanNode.displayName = "BooleanNode";

(BooleanNode as any).getHandles = (_data: BooleanNodeData) => ({
    inputs: [],
    outputs: [{ id: "output", label: "Value", type: LuauType.Boolean }],
});

export default BooleanNode;