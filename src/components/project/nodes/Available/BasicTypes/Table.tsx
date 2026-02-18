"use client";

import React, { memo, useState, useEffect } from "react";
import { NodeProps } from "@xyflow/react";
import NodeTemplate from "../../Template";
import { Table, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { LuauType } from "@/types/luau";
import VariableAutocomplete from "@/components/ui/variable-autocomplete";

/**
 * Represents a single key-value pair entry in a Luau table literal
 *
 * Used exclusively in literal mode to construct tables with explicit entries.
 * Values support string, number, and boolean types for common scripting scenarios.
 *
 * @interface
 * @property {string} key - Table key (string identifier)
 * @property {string | number | boolean} value - Table value of primitive type
 */
interface TableEntry {
    key: string;
    value: string | number | boolean;
}

/**
 * Data structure for the TableNode component
 *
 * Defines configuration for Luau table (dictionary) representation with two
 * operational modes for flexible data structure definition.
 *
 * @interface
 * @property {("literal" | "expression")} [mode] - Operation mode selection
 * @property {string} [expression] - Luau table expression when in expression mode (e.g., "{x=1, y=2}")
 * @property {TableEntry[]} [entries] - Array of key-value pairs when in literal mode
 */
export interface TableNodeData {
    mode?: "literal" | "expression";
    expression?: string;
    entries?: TableEntry[];
}

/**
 * Props type for TableNode component
 *
 * Extends React Flow's NodeProps with optional TableNodeData properties
 * to support table/dictionary representation within the visual scripting interface.
 *
 * @typedef {NodeProps & Partial<TableNodeData>} TableNodeProps
 */
export type TableNodeProps = NodeProps & Partial<TableNodeData>;

/**
 * TableNode component represents Luau table (dictionary) values in visual scripts
 *
 * Supports two operational modes for defining table structures:
 * 1. Literal mode: Manually construct tables with explicit key-value entries via UI
 * 2. Expression mode: Evaluate custom Luau table expressions (e.g., "{name=player, score=0}")
 *
 * Features:
 * - Dynamic entry management in literal mode (add/remove/update entries)
 * - Real-time expression validation with visual feedback
 * - Warning icon display for invalid expressions in expression mode
 * - Color-coded amber styling for table type identification
 * - Entry counter showing current table size
 * - Single table-typed output handle for downstream connections
 * - Responsive validation feedback with descriptive error messages
 *
 * Common use cases:
 * - Configuration objects (settings, parameters)
 * - Entity/component data (player stats, item properties)
 * - Event payloads and message passing
 * - Structured return values from functions
 * - Temporary data aggregation before processing
 *
 * Luau table semantics:
 * - Tables are the fundamental data structure in Luau (similar to objects/dicts in other languages)
 * - Keys can be strings (named fields) or numbers (array-like indexing)
 * - Values can be any Luau type including nested tables
 * - Tables are reference types (passed by reference, not copied)
 *
 * Note: Expression validation uses a permissive pattern matcher and does not perform
 * full Luau semantic analysis. Complex table expressions may pass validation but
 * require proper syntax at runtime. Literal mode supports only primitive value types
 * (string, number, boolean) for simplicity in the UI editor.
 *
 * @component
 * @param {TableNodeProps} props - React Flow node properties
 *
 * @example
 * // Register node type in React Flow
 * const nodeTypes = useMemo(() => ({
 *   table: TableNode
 * }), []);
 *
 * @example
 * // Literal table node (explicit entries)
 * const configNode = {
 *   id: 'table-1',
 *   type: 'table',
 *    {
 *     mode: 'literal',
 *     entries: [
 *       { key: 'health', value: 100 },
 *       { key: 'name', value: 'Player1' },
 *       { key: 'active', value: true }
 *     ]
 *   },
 *   position: { x: 100, y: 200 }
 * };
 *
 * @example
 * // Expression table node (dynamic construction)
 * const dynamicNode = {
 *   id: 'table-2',
 *   type: 'table',
 *    {
 *     mode: 'expression',
 *     expression: '{x = position.X, y = position.Y, timestamp = os.time()}'
 *   },
 *   position: { x: 100, y: 200 }
 * };
 *
 * @example
 * // Common use case: Player stats table
 * const playerStatsNode = {
 *   id: 'table-3',
 *   type: 'table',
 *    {
 *     mode: 'literal',
 *     entries: [
 *       { key: 'level', value: 5 },
 *       { key: 'experience', value: 1250 },
 *       { key: 'gold', value: 350 }
 *     ]
 *   },
 *   position: { x: 100, y: 200 }
 * };
 */
const TableNode = memo(
    ({ data, isConnectable, selected, dragging }: TableNodeProps) => {
        const [mode, setMode] = useState(data.mode || "literal");
        const [entries, setEntries] = useState<TableEntry[]>(
            (data.entries as TableEntry[]) || [{ key: "", value: "" }]
        );
        const [expression, setExpression] = useState(data.expression || "");
        const [isValid, setIsValid] = useState(true);
        const [error, setError] = useState("");
        const scriptId = data?.__scriptId as string | undefined;

        /**
         * Synchronizes local state with external data prop changes
         *
         * Updates entries when switching to literal mode with pre-existing data,
         * and updates expression when switching to expression mode. Prevents
         * stale state when node configuration changes externally.
         *
         * @effect
         * @dependency {TableEntry[]} data.entries - External entries array
         * @dependency {string} data.expression - External expression string
         * @dependency {("literal" | "expression")} mode - Current operation mode
         */
        useEffect(() => {
            if (data.entries && mode === "literal") {
                setEntries(data.entries as TableEntry[]);
            }
            if (data.expression && mode === "expression") {
                setExpression(data.expression);
            }
        }, [data.entries, data.expression, mode]);

        /**
         * Handles mode switching between literal and expression operation types
         *
         * Updates local state to reflect the selected input method without
         * persisting changes to React Flow's node data (persistence handled externally).
         *
         * @param {string} newMode - Target mode ("literal" or "expression")
         * @returns {void}
         */
        const handleModeChange = (newMode: string) => {
            setMode(newMode);
        };

        /**
         * Handles expression input changes with real-time validation
         *
         * Validates expressions against a permissive pattern allowing common Luau
         * table syntax characters. Provides immediate visual feedback for invalid input.
         *
         * Validation rules:
         * - Empty expressions are considered valid (placeholder state)
         * - Accepts alphanumeric characters, underscores, operators, brackets,
         *   braces, quotes, colons, commas, and whitespace
         * - Does NOT validate semantic correctness (e.g., balanced braces, valid keys)
         *
         * @param {React.ChangeEvent<HTMLInputElement>} e - Input change event
         * @returns {void}
         */
        const handleExpressionChange = (
            e: React.ChangeEvent<HTMLInputElement>
        ) => {
            const expr = e.target.value;
            setExpression(expr);

            // In real implementation, this would validate against Luau grammar
            setIsValid(
                expr.trim() === "" ||
                /^[a-zA-Z0-9_\-+\/*%()={}:,.'"\[\] ]*$/.test(expr)
            );
            setError(isValid ? "" : "Invalid table expression");
        };

        /**
         * Adds a new empty key-value entry to the table in literal mode
         *
         * Appends a new entry with empty key and value fields to enable user input.
         * Preserves existing entries while expanding the table structure.
         *
         * @returns {void}
         */
        const addEntry = () => {
            setEntries([...entries, { key: "", value: "" }]);
        };

        /**
         * Removes a specific entry from the table in literal mode
         *
         * Filters out the entry at the specified index, maintaining order of
         * remaining entries. Prevents removal of the last entry to ensure
         * at least one entry is always available for editing.
         *
         * @param {number} index - Zero-based index of entry to remove
         * @returns {void}
         */
        const removeEntry = (index: number) => {
            setEntries(entries.filter((_, i) => i !== index));
        };

        /**
         * Updates a specific field of a table entry in literal mode
         *
         * Mutates either the key or value field of an entry at the specified index
         * while preserving all other entry data and table structure.
         *
         * @param {number} index - Zero-based index of entry to update
         * @param {("key" | "value")} field - Field to update ("key" or "value")
         * @param {string | number | boolean} value - New value for the field
         * @returns {void}
         */
        const updateEntry = (
            index: number,
            field: "key" | "value",
            value: string | number | boolean
        ) => {
            const newEntries = [...entries];
            newEntries[index] = {
                ...newEntries[index],
                [field]: value,
            } as TableEntry;
            setEntries(newEntries);
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
                    icon:
                        mode === "literal"
                            ? Table
                            : isValid
                                ? Table
                                : AlertTriangle,
                    name: "Table",
                    description:
                        mode === "literal"
                            ? "Represents a key-value dictionary."
                            : "Evaluates a table expression.",
                    selected,
                }}
                outputs={[
                    {
                        id: "output",
                        label: "Value",
                        type: LuauType.Table,
                    },
                ]}
            >
                <div className="space-y-2">
                    <div className="flex gap-1 mb-2">
                        <Button
                            variant={
                                mode === "literal" ? "default" : "outline"
                            }
                            size="xs"
                            className="text-xs h-6 cursor-pointer bg-amber-300/10 hover:bg-amber-300/20"
                            onClick={() => handleModeChange("literal")}
                        >
                            Literal
                        </Button>
                        <Button
                            variant={
                                mode === "expression" ? "default" : "outline"
                            }
                            size="xs"
                            className="text-xs h-6 cursor-pointer bg-amber-300/10 hover:bg-amber-300/20"
                            onClick={() => handleModeChange("expression")}
                        >
                            Expression
                        </Button>
                    </div>

                    {mode === "literal" ? (
                        <>
                            {entries.map((entry, index) => (
                                <div
                                    key={index}
                                    className="flex gap-1 items-center"
                                >
                                    <div className="relative w-full">
                                        <Input
                                            type="text"
                                            value={entry.key}
                                            onChange={(e) =>
                                                updateEntry(
                                                    index,
                                                    "key",
                                                    e.target.value
                                                )
                                            }
                                            placeholder="Key"
                                            className="text-xs h-6"
                                        />
                                    </div>
                                    <span>=</span>
                                    <VariableAutocomplete
                                        scriptId={scriptId || "unknown"}
                                        type="text"
                                        value={
                                            entry.value
                                                ? entry.value.toString()
                                                : ""
                                        }
                                        onChange={(e) =>
                                            updateEntry(
                                                index,
                                                "value",
                                                e.target.value
                                            )
                                        }
                                        placeholder="Value"
                                        className="text-xs h-6 flex-1"
                                    />
                                    {entries.length > 1 && (
                                        <Button
                                            variant="destructive"
                                            size="icon-xs"
                                            onClick={() =>
                                                removeEntry(index)
                                            }
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
                            <div className="flex justify-between items-center pt-1">
                                <span className="text-xs text-muted-foreground truncate max-w-[70%]">
                                    {entries.length}{" "}
                                    {entries.length === 1 ? "entry" : "entries"}
                                </span>
                            </div>
                        </>
                    ) : (
                        <div className="space-y-1">
                            <VariableAutocomplete
                                scriptId={scriptId || "unknown"}
                                type="text"
                                value={
                                    typeof expression === "string"
                                        ? expression
                                        : ""
                                }
                                onChange={handleExpressionChange}
                                placeholder='e.g., "{name = playerName, score = 0}"'
                                className={cn(
                                    "text-xs h-7",
                                    !isValid && "border-destructive"
                                )}
                            />
                            {!isValid && (
                                <div className="text-[8px] text-destructive">
                                    {error}
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </NodeTemplate>
        );
    }
);

TableNode.displayName = "TableNode";

/**
 * Static method to compute output handles for TableNode
 *
 * Provides handle configuration for the visual scripting system to render
 * connection points without mounting the full component. Table nodes expose
 * a single table-typed output handle regardless of operation mode.
 *
 * Note: This implementation returns static handle configuration as table nodes
 * have no configurable inputs. The output handle is always present and typed
 * as LuauType.Table for type-safe connections in the visual script graph.
 *
 * @static
 * @param {TableNodeData} data - Node configuration data (unused in static implementation)
 * @returns {Object} Handle configuration object
 * @returns {Array} returns.outputs - Single table output handle
 *
 * @example
 * const handles = TableNode.getHandles({ mode: 'literal' });
 * // {
 * //   outputs: [
 * //     { id: "output", label: "Value", type: LuauType.Table }
 * //   ]
 * // }
 */
interface HandleConfig {
    outputs: Array<{
        id: string;
        label: string;
        type: LuauType;
    }>;
}

interface GetHandlesFunction {
    (data: TableNodeData): HandleConfig;
}

(TableNode as any).getHandles = ((data: TableNodeData): HandleConfig => ({
    outputs: [{ id: "output", label: "Value", type: LuauType.Table }],
})) as GetHandlesFunction;

export default TableNode;