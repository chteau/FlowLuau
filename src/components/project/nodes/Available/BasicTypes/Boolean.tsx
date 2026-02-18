"use client";

import React, { memo, useState } from "react";
import { NodeProps } from "@xyflow/react";
import NodeTemplate from "../../Template";
import { ToggleRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { LuauType } from "@/types/luau";
import { Input } from "@/components/ui/input";
import VariableAutocomplete from "@/components/ui/variable-autocomplete";

/**
 * Props type for BooleanNode component
 *
 * Extends React Flow's NodeProps to support boolean value representation
 * in visual scripting workflows with literal and expression modes.
 *
 * @typedef {NodeProps} BooleanNodeProps
 */
export type BooleanNodeProps = NodeProps;

/**
 * BooleanNode component represents boolean (true/false) values in Luau visual scripts
 *
 * Supports two operational modes for defining boolean values:
 * 1. Literal mode: Direct toggle between true and false states via UI button
 * 2. Expression mode: Custom Luau boolean expression evaluation (e.g., "x > 5 and y < 10")
 *
 * Features:
 * - Intuitive toggle interface for literal boolean values
 * - Real-time expression validation with descriptive error feedback
 * - Visual mode switching without data loss
 * - Color-coded amber styling for boolean type identification
 * - Single boolean output handle for downstream connections
 * - Responsive visual feedback for valid/invalid expression states
 *
 * Common use cases:
 * - Conditional branching logic (if/else conditions)
 * - Feature flags and toggle switches
 * - State validation checks
 * - Comparison operations between values
 *
 * Note: Expression validation uses a basic pattern matcher and does not perform
 * full Luau semantic analysis. Complex expressions may pass validation but fail
 * at runtime if syntactically invalid.
 *
 * @component
 * @param {BooleanNodeProps} props - React Flow node properties
 *
 * @example
 * // Register node type in React Flow
 * const nodeTypes = useMemo(() => ({
 *   boolean: BooleanNode
 * }), []);
 *
 * @example
 * // Literal boolean node (true value)
 * const trueNode = {
 *   id: 'bool-1',
 *   type: 'boolean',
 *    { mode: 'literal', value: true },
 *   position: { x: 100, y: 200 }
 * };
 *
 * @example
 * // Expression boolean node (comparison)
 * const comparisonNode = {
 *   id: 'bool-2',
 *   type: 'boolean',
 *    {
 *     mode: 'expression',
 *     expression: 'playerHealth > 0'
 *   },
 *   position: { x: 100, y: 200 }
 * };
 */
const BooleanNode = memo(
    ({ data, isConnectable, selected, dragging }: BooleanNodeProps) => {
        const [mode, setMode] = useState(data.mode || "literal");
        const [literalValue, setLiteralValue] = useState(data.value ?? true);
        const [expression, setExpression] = useState<string>(
            String(data.expression ?? "")
        );
        const [isValid, setIsValid] = useState(true);
        const [error, setError] = useState("");
        const scriptId = data?.__scriptId as string | undefined;

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
         * Toggles the boolean value state in literal mode
         *
         * Inverts the current literal value (true ↔ false) with immediate
         * visual feedback through the toggle button UI. Does not persist
         * changes to React Flow's node data (persistence handled externally).
         *
         * @returns {void}
         */
        const handleLiteralToggle = () => {
            const newValue = !literalValue;
            setLiteralValue(newValue);
        };

        /**
         * Handles expression input changes with real-time validation
         *
         * Validates expressions against a pattern for simple comparison operations.
         * Provides immediate visual feedback and descriptive error messages for
         * invalid syntax patterns.
         *
         * Validation rules:
         * - Empty expressions are considered valid (placeholder state)
         * - Must contain two operands separated by a comparison operator (==, ~=, >=, <=, >, <)
         * - Operands can be identifiers ([a-zA-Z_]\w*) or numbers (\d+(\.\d+)?)
         * - Does NOT validate complex boolean logic (e.g., "and", "or" chains)
         *
         * @param {React.ChangeEvent<HTMLInputElement>} e - Input change event
         * @returns {void}
         */
        const handleExpressionChange = (
            e: React.ChangeEvent<HTMLInputElement>
        ) => {
            const expr = e.target.value;
            setExpression(expr);

            const valid =
                expr.trim() === "" ||
                /^\s*(?:[a-zA-Z_]\w*|\d+(?:\.\d+)?)\s*(==|~=|>=|<=|>|<)\s*(?:[a-zA-Z_]\w*|\d+(?:\.\d+)?)\s*$/.test(
                    expr
                );

            setIsValid(valid);
            setError(
                valid ? "" : "Invalid boolean expression (expected: A <op> B)"
            );
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
                outputs={[
                    {
                        id: "output",
                        label: "Value",
                        type: LuauType.Boolean,
                    },
                ]}
            >
                <div className="space-y-2 mb-4">
                    <div className="flex gap-1 mb-2">
                        <Button
                            variant={mode === "literal" ? "default" : "outline"}
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
                        <Button
                            variant={literalValue ? "default" : "outline"}
                            size="sm"
                            className={cn(
                                "w-full h-7 text-xs cursor-pointer",
                                literalValue
                                    ? "bg-amber-400/40 hover:bg-amber-400/50"
                                    : "text-muted-foreground"
                            )}
                            onClick={handleLiteralToggle}
                        >
                            {literalValue ? "TRUE" : "FALSE"}
                        </Button>
                    ) : (
                        <div className="space-y-1">
                            <VariableAutocomplete
                                scriptId={scriptId || "unknown"}
                                type="text"
                                value={expression}
                                onChange={handleExpressionChange}
                                placeholder='e.g., "x > 5 and y < 10"'
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

BooleanNode.displayName = "BooleanNode";

/**
 * Static method to compute output handles for BooleanNode
 *
 * Provides handle configuration for the visual scripting system to render
 * connection points without mounting the full component. Boolean nodes
 * expose a single boolean-typed output handle regardless of operation mode.
 *
 * Note: This implementation returns static handle configuration and does not
 * access node data parameters. External systems should use this for handle
 * layout calculations during graph rendering operations.
 *
 * @static
 * @returns {Object} Handle configuration object
 * @returns {Array} returns.outputs - Single boolean output handle
 *
 * @example
 * const handles = BooleanNode.getHandles();
 * // {
 * //   outputs: [
 * //     { id: "output", label: "Value", type: LuauType.Boolean }
 * //   ]
 * // }
 */
(BooleanNode as any).getHandles = (
    ...args: Parameters<typeof BooleanNode.prototype.getHandles>
) => ({
    outputs: [{ id: "output", label: "Value", type: LuauType.Boolean }],
});

export default BooleanNode;