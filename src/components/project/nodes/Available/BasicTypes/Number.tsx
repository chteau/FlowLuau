"use client";

import React, { memo, useState } from "react";
import { NodeProps } from "@xyflow/react";
import NodeTemplate from "../../Template";
import { Hash, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { LuauType } from "@/types/luau";
import VariableAutocomplete from "@/components/ui/variable-autocomplete";

/**
 * Props type for NumberNode component
 *
 * Extends React Flow's NodeProps to support numeric value representation
 * in visual scripting workflows with literal and expression modes.
 *
 * @typedef {NodeProps} NumberNodeProps
 */
export type NumberNodeProps = NodeProps;

/**
 * NumberNode component represents numeric values in Luau visual scripts
 *
 * Supports two operational modes for defining numeric values:
 * 1. Literal mode: Direct entry of numeric values via input field
 * 2. Expression mode: Custom Luau arithmetic expression evaluation (e.g., "5 + 3 * 2")
 *
 * Features:
 * - Real-time input validation with visual feedback
 * - Mode switching between literal values and expressions
 * - Warning icon display for invalid expressions
 * - Color-coded amber styling for numeric type identification
 * - Single numeric output handle for downstream connections
 * - Responsive validation feedback with descriptive error messages
 *
 * Common use cases:
 * - Constant numeric values (e.g., gravity = 9.8)
 * - Mathematical calculations (e.g., damage * multiplier)
 * - Position/velocity computations
 * - Timer/delay values
 * - Score/health/mana values in game logic
 *
 * Note: Expression validation uses pattern matching and does not perform
 * full Luau semantic analysis. Complex expressions may pass validation but
 * fail at runtime if syntactically invalid. Literal mode accepts only
 * numeric characters and basic arithmetic operators for flexibility.
 *
 * @component
 * @param {NumberNodeProps} props - React Flow node properties
 *
 * @example
 * // Register node type in React Flow
 * const nodeTypes = useMemo(() => ({
 *   number: NumberNode
 * }), []);
 *
 * @example
 * // Literal number node (constant value)
 * const constantNode = {
 *   id: 'num-1',
 *   type: 'number',
 *    { mode: 'literal', value: 42 },
 *   position: { x: 100, y: 200 }
 * };
 *
 * @example
 * // Expression number node (calculation)
 * const calcNode = {
 *   id: 'num-2',
 *   type: 'number',
 *    {
 *     mode: 'expression',
 *     expression: 'playerLevel * 10 + bonus'
 *   },
 *   position: { x: 100, y: 200 }
 * };
 */
const NumberNode = memo(
    ({ data, isConnectable, selected, dragging }: NumberNodeProps) => {
        const [mode, setMode] = useState(data.mode || "literal");
        const [literalValue, setLiteralValue] = useState(
            data.value?.toString() || "0"
        );
        const [expression, setExpression] = useState(data.expression || "");
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
         * Handles changes to the literal number input field with validation
         *
         * Validates input against a permissive pattern allowing numeric characters
         * and basic arithmetic operators for flexible literal entry. Empty values
         * are temporarily allowed during typing.
         *
         * Validation rules:
         * - Accepts digits (0-9), operators (+-*%/), parentheses, decimal points, and spaces
         * - Does NOT enforce complete numeric validity (allows partial input during typing)
         * - Visual feedback provided via border color changes on invalid state
         *
         * @param {React.ChangeEvent<HTMLInputElement>} e - Input change event
         * @returns {void}
         */
        const handleLiteralChange = (
            e: React.ChangeEvent<HTMLInputElement>
        ) => {
            const newValue = e.target.value;
            setLiteralValue(newValue);

            setIsValid(newValue === "" || /^[0-9+\-*/%(). ]*$/.test(newValue));
            setError(isValid ? "" : "Invalid numeric expression");
        };

        /**
         * Handles expression input changes with real-time validation
         *
         * Validates expressions against a pattern for simple binary arithmetic operations.
         * Provides immediate visual feedback and descriptive error messages for invalid syntax.
         *
         * Validation rules:
         * - Empty expressions are considered valid (placeholder state)
         * - Must contain two operands separated by an arithmetic operator (+, -, *, /, %)
         * - Operands can be identifiers ([a-zA-Z_]\w*) or numbers (\d+(\.\d+)?)
         * - Does NOT validate complex expressions (e.g., multiple operations, parentheses nesting)
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
                /^\s*(?:[a-zA-Z_]\w*|\d+(?:\.\d+)?)\s*([+\-*/%])\s*(?:[a-zA-Z_]\w*|\d+(?:\.\d+)?)\s*$/.test(
                    expr.trim()
                );

            setIsValid(valid);
            setError(
                valid ? "" : "Invalid numeric expression (expected: A <op> B)"
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
                    icon:
                        mode === "literal"
                            ? Hash
                            : isValid
                            ? Hash
                            : AlertTriangle,
                    name: "Number",
                    description:
                        mode === "literal"
                            ? "Represents a numeric value."
                            : "Evaluates a numeric expression.",
                    selected,
                }}
                outputs={[
                    {
                        id: "output",
                        label: "Value",
                        type: LuauType.Number,
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
                        <div className="space-y-1">
                            <div className="relative">
                                <Input
                                    type="number"
                                    value={literalValue}
                                    onChange={handleLiteralChange}
                                    placeholder="0"
                                    className={cn(
                                        "text-xs h-7",
                                        !isValid && "border-destructive",
                                        "[appearance:textfield]"
                                    )}
                                />
                            </div>
                        </div>
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
                                placeholder='e.g., "5 + 3 * 2"'
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

NumberNode.displayName = "NumberNode";

/**
 * Static method to compute output handles for NumberNode
 *
 * Provides handle configuration for the visual scripting system to render
 * connection points without mounting the full component. Number nodes expose
 * a single numeric-typed output handle regardless of operation mode.
 *
 * Note: This implementation returns static handle configuration as number nodes
 * have no configurable inputs. The output handle is always present and typed
 * as LuauType.Number for type-safe connections in the visual script graph.
 *
 * @static
 * @returns {Object} Handle configuration object
 * @returns {Array} returns.outputs - Single numeric output handle
 *
 * @example
 * const handles = NumberNode.getHandles();
 * // {
 * //   outputs: [
 * //     { id: "output", label: "Value", type: LuauType.Number }
 * //   ]
 * // }
 */
(NumberNode as any).getHandles = (
    ...args: Parameters<typeof NumberNode.prototype.getHandles>
) => ({
    outputs: [{ id: "output", label: "Value", type: LuauType.Number }],
});

export default NumberNode;