"use client";

import { memo, useCallback, useEffect, useState } from "react";
import { NodeProps } from "@xyflow/react";
import NodeTemplate from "../../Template";
import { Table, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { LuauType } from "@/types/luau";
import VariableAutocomplete from "@/components/ui/variable-autocomplete";

/** A single key-value entry in a literal-mode Luau table. */
interface TableEntry {
    key: string;
    value: string | number | boolean;
}

export interface TableNodeData {
    mode?: "literal" | "expression";
    expression?: string;
    entries?: TableEntry[];
    __scriptId?: string;
}

export type TableNodeProps = NodeProps & { data: TableNodeData };

/**
 * Table literal node that constructs a Luau table value.
 * Literal mode builds tables from key-value entries; expression mode evaluates inline table expressions.
 * Outputs a single Table-typed value with no inputs.
 */
const TableNode = memo(({ data, selected }: TableNodeProps) => {
    const [mode, setMode] = useState<"literal" | "expression">(data.mode ?? "literal");
    const [entries, setEntries] = useState<TableEntry[]>(data.entries ?? [{ key: "", value: "" }]);
    const [expression, setExpression] = useState(data.expression ?? "");
    const [isValid, setIsValid] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        if (data.entries && mode === "literal") setEntries(data.entries);
        if (data.expression && mode === "expression") setExpression(data.expression);
    }, [data.entries, data.expression, mode]);

    const handleExpressionChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        const expr = e.target.value;
        setExpression(expr);
        const valid = expr.trim() === "" || /^[a-zA-Z0-9_+\-*/%().,\s{}"'=\[\]]+$/.test(expr);
        setIsValid(valid);
        setError(valid ? "" : "Invalid table expression");
    }, []);

    const addEntry = useCallback(() => {
        setEntries((prev) => [...prev, { key: "", value: "" }]);
    }, []);

    const removeEntry = useCallback((index: number) => {
        setEntries((prev) => prev.filter((_, i) => i !== index));
    }, []);

    const updateEntry = useCallback(
        (index: number, field: keyof TableEntry, value: string) => {
            setEntries((prev) =>
                prev.map((entry, i) => (i === index ? { ...entry, [field]: value } : entry))
            );
        },
        []
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
                icon: mode === "expression" && !isValid ? AlertTriangle : Table,
                name: "Table",
                description:
                    mode === "literal"
                        ? "Represents a key-value dictionary."
                        : "Evaluates a table expression.",
                selected,
            }}
            outputs={[{ id: "output", label: "Value", type: LuauType.Table }]}
        >
            <div className="space-y-2">
                {/* Mode switcher */}
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
                    <>
                        {entries.map((entry, index) => (
                            <div key={index} className="flex gap-1 items-center">
                                <Input
                                    type="text"
                                    value={entry.key}
                                    onChange={(e) => updateEntry(index, "key", e.target.value)}
                                    placeholder="Key"
                                    className="text-xs h-6 w-full"
                                />
                                <span>=</span>
                                <VariableAutocomplete
                                    scriptId={data.__scriptId ?? "unknown"}
                                    type="text"
                                    value={entry.value?.toString() ?? ""}
                                    onChange={(e) => updateEntry(index, "value", e.target.value)}
                                    placeholder="Value"
                                    className="text-xs h-6 flex-1"
                                />
                                {entries.length > 1 && (
                                    <Button
                                        variant="destructive"
                                        size="icon-xs"
                                        onClick={() => removeEntry(index)}
                                        className="h-6 w-6"
                                    >
                                        ×
                                    </Button>
                                )}
                            </div>
                        ))}
                        <Button
                            variant="outline"
                            size="sm"
                            className="w-full h-7 text-xs cursor-pointer"
                            onClick={addEntry}
                        >
                            + Add Entry
                        </Button>
                        <span className="text-xs text-muted-foreground">
                            {entries.length} {entries.length === 1 ? "entry" : "entries"}
                        </span>
                    </>
                ) : (
                    <div className="space-y-1">
                        <VariableAutocomplete
                            scriptId={data.__scriptId ?? "unknown"}
                            type="text"
                            value={expression}
                            onChange={handleExpressionChange}
                            placeholder='e.g., "{name = playerName, score = 0}"'
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

TableNode.displayName = "TableNode";

(TableNode as any).getHandles = (_data: TableNodeData) => ({
    inputs: [],
    outputs: [{ id: "output", label: "Value", type: LuauType.Table }],
});

export default TableNode;