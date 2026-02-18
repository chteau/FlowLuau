"use client";

import React, { memo, useCallback, useState } from "react";
import { NodeProps, useNodeId, useReactFlow } from "@xyflow/react";
import NodeTemplate from "../../Template";
import { Minus, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { LuauType } from "@/types/luau";

/**
 * Data structure for the SubtractNode component
 *
 * Defines configuration options for arithmetic subtraction operations
 * with two operational modes: linear (fixed inputs) and expression-based.
 *
 * @interface
 * @property {("linear" | "expression")} [mode] - Operation mode selection
 * @property {string} [expression] - Custom Luau arithmetic expression when in expression mode
 */
export interface SubtractNodeData {
    mode?: "linear" | "expression";
    expression?: string;
}

/**
 * Props type for SubtractNode component
 *
 * Extends React Flow's NodeProps with optional SubtractNodeData properties
 * to support dynamic node configuration within the visual scripting interface.
 *
 * @typedef {NodeProps & Partial<SubtractNodeData>} SubtractNodeProps
 */
export type SubtractNodeProps = NodeProps & Partial<SubtractNodeData>;

/**
 * SubtractNode component performs arithmetic subtraction operations in visual scripts
 *
 * Supports two operational modes:
 * 1. Linear mode: Subtracts two explicit numeric inputs (A - B) via dedicated handles
 * 2. Expression mode: Evaluates a custom Luau arithmetic expression (e.g., "health - damage")
 *
 * Features:
 * - Real-time expression validation with visual feedback
 * - Seamless mode switching without data loss
 * - Persistent state synchronization with React Flow's node system
 * - Color-coded visual indicators for valid/invalid states
 * - Warning icon display for invalid expressions in expression mode
 * - Type-safe input/output handles based on current mode
 *
 * The node outputs a single numeric result representing the subtraction operation outcome.
 * Common use cases include:
 * - Calculating damage (e.g., health - damageTaken)
 * - Computing differences (e.g., endTime - startTime)
 * - Finding deltas (e.g., currentPosition - previousPosition)
 * - Determining remaining values (e.g., budget - expenses)
 *
 * @component
 * @param {SubtractNodeProps} props - React Flow node properties and custom data
 *
 * @example
 * // Linear mode node (default)
 * const linearSubtractNode = {
 *   id: 'subtract-1',
 *   type: 'subtract',
 *    { mode: 'linear' },
 *   position: { x: 100, y: 200 }
 * };
 *
 * @example
 * // Expression mode node
 * const expressionSubtractNode = {
 *   id: 'subtract-2',
 *   type: 'subtract',
 *    {
 *     mode: 'expression',
 *     expression: 'currentScore - penalty'
 *   },
 *   position: { x: 100, y: 200 }
 * };
 *
 * @example
 * // Common use case: Calculating time difference
 * const timeDiffNode = {
 *   id: 'subtract-3',
 *   type: 'subtract',
 *    {
 *     mode: 'expression',
 *     expression: 'endTime - startTime'
 *   },
 *   position: { x: 100, y: 200 }
 * };
 */
const SubtractNode = memo(({ data, selected }: SubtractNodeProps) => {
    const nodeId = useNodeId();
    const { setNodes } = useReactFlow();

    const [mode, setMode] = useState<"linear" | "expression">(
        (data?.mode as "linear" | "expression") || "linear"
    );
    const [expression, setExpression] = useState(data?.expression || "");
    const [isValid, setIsValid] = useState(true);

    /**
     * Updates node data in React Flow's state management system
     *
     * Merges partial data updates into the node's existing data while preserving
     * all other node properties. Ensures persistent state synchronization across
     * the visual scripting interface.
     *
     * @param {Partial<SubtractNodeData>} partial - Partial data object to merge into node data
     * @returns {void}
     */
    const updateData = useCallback(
        (partial: Partial<SubtractNodeData>) => {
            setNodes((nodes) =>
                nodes.map((node) =>
                    node.id === nodeId
                        ? { ...node, data: { ...node.data, ...partial } }
                        : node
                )
            );
        },
        [nodeId, setNodes]
    );

    /**
     * Handles mode switching between linear and expression operation types
     *
     * Updates local state and persists the mode selection to React Flow's node data.
     * Triggers immediate UI updates to reflect handle configuration changes.
     *
     * @param {("linear" | "expression")} newMode - Target operation mode
     * @returns {void}
     */
    const handleModeChange = useCallback(
        (newMode: "linear" | "expression") => {
            setMode(newMode);
            updateData({ mode: newMode });
        },
        [updateData]
    );

    /**
     * Handles expression input changes with real-time validation
     *
     * Validates expressions against a permissive pattern allowing common arithmetic
     * characters and operators. Provides immediate visual feedback for invalid syntax.
     *
     * Validation rules:
     * - Empty expressions are considered valid (placeholder state)
     * - Accepts alphanumeric characters, underscores, arithmetic operators (+-*%/),
     *   parentheses, decimal points, commas, and whitespace
     * - Does NOT validate semantic correctness (e.g., balanced parentheses, valid identifiers)
     *
     * @param {React.ChangeEvent<HTMLInputElement>} e - Input change event
     * @returns {void}
     */
    const handleExpressionChange = useCallback(
        (e: React.ChangeEvent<HTMLInputElement>) => {
            const expr = e.target.value;
            setExpression(expr);
            updateData({ expression: expr });

            const valid = expr.trim() === "" || /^[a-zA-Z0-9_+\-*/%().,\s]+$/.test(expr);
            setIsValid(valid);
        },
        [updateData]
    );

    return (
        <NodeTemplate
            details={{
                color: {
                    background: "bg-green-400/10",
                    border: "border-green-400/30",
                    text: "text-green-400",
                    ring: "ring-green-400/40",
                },
                icon: mode === "linear" ? Minus : isValid ? Minus : AlertTriangle,
                name: "Subtract",
                description:
                    mode === "linear"
                        ? "Subtracts B from A (A - B)"
                        : isValid
                            ? `Evaluates: ${expression || "A - B"}`
                            : "Invalid expression",
                selected,
            }}
            inputs={
                mode === "linear"
                    ? [
                        { id: "a", label: "A", type: LuauType.Number },
                        { id: "b", label: "B", type: LuauType.Number },
                    ]
                    : []
            }
            outputs={[{ id: "result", label: "Result", type: LuauType.Number }]}
        >
            <div className="space-y-2">
                <div className="flex gap-1 mb-2">
                    <Button
                        variant={mode === "linear" ? "default" : "outline"}
                        size="xs"
                        className="text-xs h-6 cursor-pointer bg-green-400/10 hover:bg-green-400/20"
                        onClick={() => handleModeChange("linear")}
                    >
                        Linear
                    </Button>
                    <Button
                        variant={mode === "expression" ? "default" : "outline"}
                        size="xs"
                        className="text-xs h-6 cursor-pointer bg-green-400/10 hover:bg-green-400/20"
                        onClick={() => handleModeChange("expression")}
                    >
                        Expression
                    </Button>
                </div>

                {mode === "expression" && (
                    <div className="space-y-1">
                        <Input
                            value={expression as string}
                            onChange={handleExpressionChange}
                            placeholder="e.g., health - damage"
                            className={cn(
                                "text-xs h-7 font-mono",
                                !isValid && "border-destructive"
                            )}
                        />
                        {!isValid && (
                            <div className="text-[8px] text-destructive">
                                Invalid arithmetic expression
                            </div>
                        )}
                    </div>
                )}
            </div>
        </NodeTemplate>
    );
});

SubtractNode.displayName = "SubtractNode";


/**
 * Static method to compute dynamic handles based on node data configuration
 *
 * Used by the visual scripting system to determine available connection points
 * without mounting the full component. Enables efficient handle rendering and
 * connection validation during graph operations.
 *
 * @static
 * @param {SubtractNodeData} data - Node configuration data
 * @returns {Object} Handle configuration with inputs and outputs arrays
 * @returns {Array} returns.inputs - Input handles (empty in expression mode)
 * @returns {Array} returns.outputs - Single numeric output handle
 *
 * @example
 * const handles = SubtractNode.getHandles({ mode: 'linear' });
 * // {
 * //   inputs: [
 * //     { id: 'a', label: 'A', type: LuauType.Number },
 * //     { id: 'b', label: 'B', type: LuauType.Number }
 * //   ],
 * //   outputs: [{ id: 'result', label: 'Result', type: LuauType.Number }]
 * // }
 */
(SubtractNode as any).getHandles = (data: SubtractNodeData) => {
    const mode = data?.mode || "linear";

    return {
        inputs:
            mode === "linear"
                ? [
                    { id: "a", label: "A", type: LuauType.Number },
                    { id: "b", label: "B", type: LuauType.Number },
                ]
                : [],
        outputs: [{ id: "result", label: "Result", type: LuauType.Number }],
    }
};

export default SubtractNode;