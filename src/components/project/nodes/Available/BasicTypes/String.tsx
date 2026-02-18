"use client";

import React, { memo, useState } from "react";
import { NodeProps } from "@xyflow/react";
import NodeTemplate from "../../Template";
import { Type, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { LuauType } from "@/types/luau";
import VariableAutocomplete from "@/components/ui/variable-autocomplete";

/**
 * Props type for StringNode component
 *
 * Extends React Flow's NodeProps to support string value representation
 * in visual scripting workflows with literal and expression modes.
 *
 * @typedef {NodeProps} StringNodeProps
 */
export type StringNodeProps = NodeProps;

/**
 * StringNode component represents string (text) values in Luau visual scripts
 *
 * Supports two operational modes for defining string values:
 * 1. Literal mode: Direct entry of raw text content via input field
 * 2. Expression mode: Custom Luau string expression evaluation using concatenation operator (..)
 *    Examples: '"Hello " .. playerName', 'prefix .. suffix'
 *
 * Features:
 * - Intuitive mode switching between literal text and expressions
 * - Real-time expression validation with descriptive error feedback
 * - Visual warning indicators for invalid syntax (AlertTriangle icon)
 * - Color-coded amber styling for string type identification
 * - Single string-typed output handle for downstream connections
 * - Placeholder hints guiding proper expression syntax
 *
 * Common use cases:
 * - UI text content (labels, messages, tooltips)
 * - Dynamic string concatenation (player names, scores, messages)
 * - File/path construction
 * - Debug logging messages
 * - Template strings for formatted output
 *
 * Note: Expression validation uses pattern matching for basic concatenation syntax.
 * Complex string operations (e.g., string methods, nested expressions) may pass
 * validation but require proper Luau syntax at runtime. Literal mode accepts any
 * text content without validation constraints.
 *
 * @component
 * @param {StringNodeProps} props - React Flow node properties
 *
 * @example
 * // Register node type in React Flow
 * const nodeTypes = useMemo(() => ({
 *   string: StringNode
 * }), []);
 *
 * @example
 * // Literal string node (static text)
 * const messageNode = {
 *   id: 'str-1',
 *   type: 'string',
 *    { mode: 'literal', value: 'Game Over' },
 *   position: { x: 100, y: 200 }
 * };
 *
 * @example
 * // Expression string node (dynamic concatenation)
 * const playerNameNode = {
 *   id: 'str-2',
 *   type: 'string',
 *    {
 *     mode: 'expression',
 *     expression: '"Player: " .. playerName'
 *   },
 *   position: { x: 100, y: 200 }
 * };
 *
 * @example
 * // Common use case: Score display message
 * const scoreMessageNode = {
 *   id: 'str-3',
 *   type: 'string',
 *    {
 *     mode: 'expression',
 *     expression: '"Score: " .. currentScore'
 *   },
 *   position: { x: 100, y: 200 }
 * };
 */
const StringNode = memo(
    ({ data, isConnectable, selected, dragging }: StringNodeProps) => {
        const [mode, setMode] = useState(data.mode || "literal");
        const [literalValue, setLiteralValue] = useState(
            (data.value as string) || ""
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
         * Handles expression input changes with real-time validation
         *
         * Validates expressions against a pattern for Luau string concatenation using
         * the .. operator. Provides immediate visual feedback and descriptive error messages.
         *
         * Validation rules:
         * - Empty expressions are considered valid (placeholder state)
         * - Must contain two operands joined by the concatenation operator (..)
         * - Operands can be:
         *   - Double-quoted strings ("text")
         *   - Single-quoted strings ('text')
         *   - Identifiers ([a-zA-Z_]\w*)
         * - Does NOT validate semantic correctness (e.g., variable existence at runtime)
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
                /^\s*(?:"[^"]*"|'[^']*'|[a-zA-Z_]\w*)\s*\.\.\s*(?:"[^"]*"|'[^']*'|[a-zA-Z_]\w*)\s*$/.test(
                    expr
                );

            setIsValid(valid);
            setError(
                valid ? "" : 'Invalid string expression (expected: A .. B)'
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
                            ? Type
                            : isValid
                            ? Type
                            : AlertTriangle,
                    name: "String",
                    description:
                        mode === "literal"
                            ? "Represents a sequence of characters."
                            : "Evaluates a string expression.",
                    selected,
                }}
                outputs={[
                    {
                        id: "output",
                        label: "Value",
                        type: LuauType.String,
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
                            <Input
                                type="text"
                                value={literalValue}
                                onChange={(e) => setLiteralValue(e.target.value)}
                                placeholder="Enter string"
                                className="text-xs h-7"
                            />
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
                                placeholder='e.g., "Hello " .. playerName'
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

StringNode.displayName = "StringNode";

/**
 * Static method to compute output handles for StringNode
 *
 * Provides handle configuration for the visual scripting system to render
 * connection points without mounting the full component. String nodes expose
 * a single string-typed output handle regardless of operation mode.
 *
 * Note: This implementation returns static handle configuration as string nodes
 * have no configurable inputs. The output handle is always present and typed
 * as LuauType.String for type-safe connections in the visual script graph.
 *
 * @static
 * @returns {Object} Handle configuration object
 * @returns {Array} returns.outputs - Single string output handle
 *
 * @example
 * const handles = StringNode.getHandles();
 * // {
 * //   outputs: [
 * //     { id: "output", label: "Value", type: LuauType.String }
 * //   ]
 * // }
 */
(StringNode as any).getHandles = (
    ...args: Parameters<typeof StringNode.prototype.getHandles>
) => ({
    outputs: [{ id: "output", label: "Value", type: LuauType.String }],
});

export default StringNode;