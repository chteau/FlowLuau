"use client";

import { memo, useState } from "react";
import { NodeProps } from "@xyflow/react";
import NodeTemplate from "../../Template";
import { Hash, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { LuauType } from "@/types/luau";
import VariableAutocomplete from "@/components/ui/variable-autocomplete";

export interface NumberNodeData {
    mode?: "literal" | "expression";
    value?: number;
    expression?: string;
    __scriptId?: string;
}

export type NumberNodeProps = NodeProps & { data: NumberNodeData };

/**
 * Number literal node that represents a Luau numeric value.
 * Literal mode stores a direct number; expression mode evaluates a Luau arithmetic expression.
 * Outputs a single Number-typed value with no inputs.
 */
const NumberNode = memo(({ data, selected }: NumberNodeProps) => {
    const [mode, setMode] = useState<"literal" | "expression">(data.mode ?? "literal");
    const [literalValue, setLiteralValue] = useState(data.value?.toString() ?? "0");
    const [expression, setExpression] = useState(data.expression ?? "");
    const [isValid, setIsValid] = useState(true);
    const [error, setError] = useState("");

    const handleLiteralChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = e.target.value;
        setLiteralValue(val);
        const valid = val === "" || /^[0-9+\-*/%(). ]*$/.test(val);
        setIsValid(valid);
        setError(valid ? "" : "Invalid numeric expression");
    };

    const handleExpressionChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const expr = e.target.value;
        setExpression(expr);
        const valid =
            expr.trim() === "" ||
            /^\s*(?:[a-zA-Z_]\w*|\d+(?:\.\d+)?)\s*[+\-*/%]\s*(?:[a-zA-Z_]\w*|\d+(?:\.\d+)?)\s*$/.test(expr.trim());
        setIsValid(valid);
        setError(valid ? "" : "Invalid numeric expression (expected: A <op> B)");
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
                icon: mode === "expression" && !isValid ? AlertTriangle : Hash,
                name: "Number",
                description:
                    mode === "literal"
                        ? "Represents a numeric value."
                        : "Evaluates a numeric expression.",
                selected,
            }}
            outputs={[{ id: "output", label: "Value", type: LuauType.Number }]}
        >
            <div className="space-y-2">
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
                    <Input
                        type="number"
                        value={literalValue}
                        onChange={handleLiteralChange}
                        placeholder="0"
                        className={cn(
                            "text-xs h-7 [appearance:textfield]",
                            !isValid && "border-destructive"
                        )}
                    />
                ) : (
                    <div className="space-y-1">
                        <VariableAutocomplete
                            scriptId={data.__scriptId ?? "unknown"}
                            type="text"
                            value={expression}
                            onChange={handleExpressionChange}
                            placeholder='e.g., "5 + 3 * 2"'
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

NumberNode.displayName = "NumberNode";

(NumberNode as any).getHandles = (_data: NumberNodeData) => ({
    inputs: [],
    outputs: [{ id: "output", label: "Value", type: LuauType.Number }],
});

export default NumberNode;