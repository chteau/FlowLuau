"use client";

import { memo, useState } from "react";
import { NodeProps } from "@xyflow/react";
import NodeTemplate from "../../Template";
import { Type, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
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
 * Literal mode stores a direct string; expression mode evaluates a Luau string expression.
 * Outputs a single String-typed value with no inputs.
 */
const StringNode = memo(({ data, selected }: StringNodeProps) => {
    const [mode, setMode] = useState<"literal" | "expression">(data.mode ?? "literal");
    const [literalValue, setLiteralValue] = useState(data.value ?? "");
    const [expression, setExpression] = useState(data.expression ?? "");
    const [isValid, setIsValid] = useState(true);
    const [error, setError] = useState("");

    const handleExpressionChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const expr = e.target.value;
        setExpression(expr);
        const valid =
            expr.trim() === "" ||
            /^\s*(?:"[^"]*"|'[^']*'|[a-zA-Z_]\w*)\s*\.\.\s*(?:"[^"]*"|'[^']*'|[a-zA-Z_]\w*)\s*$/.test(expr);
        setIsValid(valid);
        setError(valid ? "" : "Invalid string expression (expected: A .. B)");
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
                icon: mode === "expression" && !isValid ? AlertTriangle : Type,
                name: "String",
                description:
                    mode === "literal"
                        ? "Represents a sequence of characters."
                        : "Evaluates a string expression.",
                selected,
            }}
            outputs={[{ id: "output", label: "Value", type: LuauType.String }]}
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
                        type="text"
                        value={literalValue}
                        onChange={(e) => setLiteralValue(e.target.value)}
                        placeholder="Enter string"
                        className="text-xs h-7"
                    />
                ) : (
                    <div className="space-y-1">
                        <VariableAutocomplete
                            scriptId={data.__scriptId ?? "unknown"}
                            type="text"
                            value={expression}
                            onChange={handleExpressionChange}
                            placeholder='e.g., "Hello " .. playerName'
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

StringNode.displayName = "StringNode";

(StringNode as any).getHandles = (_data: StringNodeData) => ({
    inputs: [],
    outputs: [{ id: "output", label: "Value", type: LuauType.String }],
});

export default StringNode;