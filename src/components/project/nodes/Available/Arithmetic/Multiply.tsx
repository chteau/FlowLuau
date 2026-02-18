"use client";

import React, { memo, useCallback, useState } from "react";
import { NodeProps, useNodeId, useReactFlow } from "@xyflow/react";
import NodeTemplate from "../../Template";
import { Asterisk, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { LuauType } from "@/types/luau";

/**
 * Data structure for the MultiplyNode component
 *
 * Defines configuration options for arithmetic multiplication operations
 * with two operational modes: linear (fixed inputs) and expression-based.
 *
 * @interface
 * @property {("linear" | "expression")} [mode] - Operation mode selection
 * @property {string} [expression] - Custom Luau arithmetic expression when in expression mode
 */
export interface MultiplyNodeData {
    mode?: "linear" | "expression";
    expression?: string;
}

/**
 * Props type for MultiplyNode component
 *
 * Extends React Flow's NodeProps with optional MultiplyNodeData properties
 * to support dynamic node configuration within the visual scripting interface.
 *
 * @typedef {NodeProps & Partial<MultiplyNodeData>} MultiplyNodeProps
 */
export type MultiplyNodeProps = NodeProps & Partial<MultiplyNodeData>;

/**
 * MultiplyNode component performs arithmetic multiplication operations in visual scripts
 *
 * Supports two operational modes:
 * 1. Linear mode: Multiplies two explicit numeric inputs (A * B) via dedicated handles
 * 2. Expression mode: Evaluates a custom Luau arithmetic expression (e.g., "width * height")
 *
 * Features:
 * - Real-time expression validation with visual feedback
 * - Seamless mode switching without data loss
 * - Persistent state synchronization with React Flow's node system
 * - Color-coded visual indicators for valid/invalid states
 * - Warning icon display for invalid expressions in expression mode
 * - Type-safe input/output handles based on current mode
 *
 * The node outputs a single numeric result representing the multiplication operation outcome.
 * Common use cases include:
 * - Calculating areas (e.g., width * height)
 * - Scaling values (e.g., baseValue * multiplier)
 * - Computing totals (e.g., quantity * price)
 * - Vector/matrix operations in game logic
 *
 * @component
 * @param {MultiplyNodeProps} props - React Flow node properties and custom data
 *
 * @example
 * // Linear mode node (default)
 * const linearMultiplyNode = {
 *   id: 'multiply-1',
 *   type: 'multiply',
 *    { mode: 'linear' },
 *   position: { x: 100, y: 200 }
 * };
 *
 * @example
 * // Expression mode node
 * const expressionMultiplyNode = {
 *   id: 'multiply-2',
 *   type: 'multiply',
 *    {
 *     mode: 'expression',
 *     expression: 'damage * criticalMultiplier'
 *   },
 *   position: { x: 100, y: 200 }
 * };
 *
 * @example
 * // Common use case: Calculating area
 * const areaNode = {
 *   id: 'multiply-3',
 *   type: 'multiply',
 *    {
 *     mode: 'expression',
 *     expression: 'rectWidth * rectHeight'
 *   },
 *   position: { x: 100, y: 200 }
 * };
 */
const MultiplyNode = memo(({ data, selected }: MultiplyNodeProps) => {
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
     * @param {Partial<MultiplyNodeData>} partial - Partial data object to merge into node data
     * @returns {void}
     */
    const updateData = useCallback(
        (partial: Partial<MultiplyNodeData>) => {
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
                icon: mode === "linear" ? Asterisk : isValid ? Asterisk : AlertTriangle,
                name: "Multiply",
                description:
                    mode === "linear"
                        ? "Multiplies two numbers (A * B)"
                        : isValid
                            ? `Evaluates: ${expression || "A * B"}`
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
                            placeholder="e.g., width * height"
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

MultiplyNode.displayName = "MultiplyNode";

/**
 * Static method to compute dynamic handles based on node data configuration
 *
 * Used by the visual scripting system to determine available connection points
 * without mounting the full component. Enables efficient handle rendering and
 * connection validation during graph operations.
 *
 * @static
 * @param {MultiplyNodeData} data - Node configuration data
 * @returns {Object} Handle configuration with inputs and outputs arrays
 * @returns {Array} returns.inputs - Input handles (empty in expression mode)
 * @returns {Array} returns.outputs - Single numeric output handle
 *
 * @example
 * const handles = MultiplyNode.getHandles({ mode: 'linear' });
 * // {
 * //   inputs: [
 * //     { id: 'a', label: 'A', type: LuauType.Number },
 * //     { id: 'b', label: 'B', type: LuauType.Number }
 * //   ],
 * //   outputs: [{ id: 'result', label: 'Result', type: LuauType.Number }]
 * // }
 */
(MultiplyNode as any).getHandles = (data: MultiplyNodeData) => {
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

export default MultiplyNode;