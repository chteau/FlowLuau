"use client";

import { memo, useCallback, useEffect, useState } from "react";
import { NodeProps, useNodeId, useReactFlow } from "@xyflow/react";
import NodeTemplate from "../../Template";
import { AlertTriangle, List, KeyRound } from "lucide-react";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { LuauType } from "@/types/luau";
import VariableAutocomplete from "@/components/ui/variable-autocomplete";

/** A single key-value entry in a literal-mode Luau table. */
interface TableEntry {
    key: string;
    value: string;
}

export interface TableNodeData {
    mode?: "literal" | "expression";
    tableType?: "array" | "dictionary";
    expression?: string;
    entries?: TableEntry[];
    __scriptId?: string;
}

export type TableNodeProps = NodeProps & { data: TableNodeData };

/**
 * Table literal node that constructs a Luau table value.
 * Supports array-style `{1, 2, 3}` and dictionary-style `{key = value}` tables.
 * Expression mode evaluates inline table expressions; outputs a single Table-typed value.
 */
const TableNode = memo(({ data, selected }: TableNodeProps) => {
    const nodeId = useNodeId();
    const { setNodes } = useReactFlow();

    const [mode, setMode] = useState<"literal" | "expression">(data.mode ?? "literal");
    const [tableType, setTableType] = useState<"array" | "dictionary">(data.tableType ?? "array");
    const [entries, setEntries] = useState<TableEntry[]>(data.entries ?? [{ key: "", value: "" }]);
    const [expression, setExpression] = useState(data.expression ?? "");
    const [isValid, setIsValid] = useState(true);
    const [error, setError] = useState("");

    const updateData = useCallback(
        (partial: Partial<TableNodeData>) => {
            setNodes((nodes) =>
                nodes.map((n) =>
                    n.id === nodeId ? { ...n, data: { ...n.data, ...partial } } : n
                )
            );
        },
        [nodeId, setNodes]
    );

    useEffect(() => {
        if (data.entries && mode === "literal") setEntries(data.entries);
        if (data.expression && mode === "expression") setExpression(data.expression);
        if (data.tableType) setTableType(data.tableType);
    }, [data.entries, data.expression, data.tableType, mode]);

    const handleExpressionChange = useCallback(
        (e: React.ChangeEvent<HTMLInputElement>) => {
            const expr = e.target.value;
            setExpression(expr);
            updateData({ expression: expr });
            const valid = expr.trim() === "" || /^[a-zA-Z0-9_+\-*/%().,\s{}"'=\[\]]+$/.test(expr);
            setIsValid(valid);
            setError(valid ? "" : "Invalid table expression");
        },
        [updateData]
    );

    const handleModeChange = useCallback(
        (newMode: "literal" | "expression") => {
            setMode(newMode);
            updateData({ mode: newMode });
        },
        [updateData]
    );

    const handleTableTypeChange = useCallback(
        (newType: "array" | "dictionary") => {
            setTableType(newType);
            updateData({ tableType: newType });
            // Reset entries when switching types
            setEntries([{ key: "", value: "" }]);
        },
        [updateData]
    );

    const addEntry = useCallback(() => {
        setEntries((prev) => [...prev, { key: "", value: "" }]);
    }, []);

    const removeEntry = useCallback((index: number) => {
        setEntries((prev) => prev.filter((_, i) => i !== index));
    }, []);

    const updateEntry = useCallback(
        (index: number, field: keyof TableEntry, value: string) => {
            const newEntries = entries.map((entry, i) =>
                i === index ? { ...entry, [field]: value } : entry
            );
            setEntries(newEntries);
            updateData({ entries: newEntries });
        },
        [entries, updateData]
    );

    const getIcon = () => {
        if (mode === "expression" && !isValid) return AlertTriangle;
        if (tableType === "array") return List;
        return KeyRound;
    };

    const Icon = getIcon();

    return (
        <NodeTemplate
            details={{
                color: {
                    background: "bg-amber-400/10",
                    border: "border-amber-400/30",
                    text: "text-amber-400",
                    ring: "ring-amber-400/40",
                },
                icon: Icon,
                name: "Table",
                description:
                    mode === "literal"
                        ? tableType === "array"
                            ? "Array-style table {1, 2, 3}"
                            : "Dictionary-style table {key = value}"
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

                {mode === "literal" && (
                    <>
                        {/* Table type switcher */}
                        <div className="flex gap-1 mb-2">
                            <Button
                                variant={tableType === "array" ? "default" : "outline"}
                                size="xs"
                                className="text-xs h-6 cursor-pointer bg-amber-400/10 hover:bg-amber-400/20"
                                onClick={() => handleTableTypeChange("array")}
                            >
                                Array
                            </Button>
                            <Button
                                variant={tableType === "dictionary" ? "default" : "outline"}
                                size="xs"
                                className="text-xs h-6 cursor-pointer bg-amber-400/10 hover:bg-amber-400/20"
                                onClick={() => handleTableTypeChange("dictionary")}
                            >
                                Dictionary
                            </Button>
                        </div>

                        {tableType === "array" ? (
                            <>
                                {entries.map((_, index) => (
                                    <div key={index} className="flex gap-1 items-center">
                                        <span className="text-xs text-muted-foreground w-6">
                                            [{index + 1}]
                                        </span>
                                        <VariableAutocomplete
                                            scriptId={data.__scriptId ?? "unknown"}
                                            type="text"
                                            value={entries[index]?.value ?? ""}
                                            onChange={(e) =>
                                                updateEntry(index, "value", e.target.value)
                                            }
                                            placeholder="Value"
                                            className="text-xs h-7 flex-1"
                                            filterVariables={(v) =>
                                                v.type === LuauType.Any ||
                                                v.type === LuauType.Number ||
                                                v.type === LuauType.String ||
                                                v.type === LuauType.Boolean
                                            }
                                        />
                                        {entries.length > 1 && (
                                            <Button
                                                variant="destructive"
                                                size="icon-xs"
                                                onClick={() => removeEntry(index)}
                                                className="h-7 w-7"
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
                                    + Add Element
                                </Button>
                            </>
                        ) : (
                            <>
                                {entries.map((entry, index) => (
                                    <div key={index} className="flex gap-1 items-center">
                                        <Input
                                            type="text"
                                            value={entry.key}
                                            onChange={(e) =>
                                                updateEntry(index, "key", e.target.value)
                                            }
                                            placeholder="Key"
                                            className="text-xs h-7 w-24"
                                        />
                                        <span className="text-xs text-muted-foreground">=</span>
                                        <VariableAutocomplete
                                            scriptId={data.__scriptId ?? "unknown"}
                                            type="text"
                                            value={entry.value}
                                            onChange={(e) =>
                                                updateEntry(index, "value", e.target.value)
                                            }
                                            placeholder="Value"
                                            className="text-xs h-7 flex-1"
                                            filterVariables={(v) =>
                                                v.type === LuauType.Any ||
                                                v.type === LuauType.Number ||
                                                v.type === LuauType.String ||
                                                v.type === LuauType.Boolean
                                            }
                                        />
                                        {entries.length > 1 && (
                                            <Button
                                                variant="destructive"
                                                size="icon-xs"
                                                onClick={() => removeEntry(index)}
                                                className="h-7 w-7"
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
                            </>
                        )}

                        <span className="text-xs text-muted-foreground block text-center">
                            {entries.length} {entries.length === 1 ? "element" : "elements"}
                        </span>
                    </>
                )}

                {mode === "expression" && (
                    <div className="space-y-1">
                        <VariableAutocomplete
                            scriptId={data.__scriptId ?? "unknown"}
                            type="text"
                            value={expression}
                            onChange={handleExpressionChange}
                            placeholder='e.g., "{name = playerName, score = 0}"'
                            className={cn("text-xs h-7", !isValid && "border-destructive")}
                            filterVariables={(v) =>
                                v.type === LuauType.Any || v.type === LuauType.Table
                            }
                        />
                        {!isValid && <div className="text-[8px] text-destructive">{error}</div>}
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