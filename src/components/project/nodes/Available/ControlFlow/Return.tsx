"use client";

import React, { memo, useCallback } from "react";
import { NodeProps, useNodeId, useReactFlow } from "@xyflow/react";
import NodeTemplate from "../../Template";
import { CornerUpLeft, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { LuauType } from "@/types/luau";
import VariableAutocomplete from "@/components/ui/variable-autocomplete";

/**
 * Data structure for the ReturnStatementNode component
 *
 * Configures Luau return statement behavior with two operational modes:
 * 1. Linear mode: Return value comes from external node connection
 * 2. Expression mode: Return value comes from inline Luau expression
 *
 * The return statement immediately terminates the current function execution
 * and optionally provides a value to the caller.
 *
 * @interface
 * @property {("linear" | "expression")} [mode] - Return value source strategy
 *   "linear" = wired connection from value-producing node, "expression" = inline Luau expression
 * @property {string} [expression] - Inline Luau expression when in expression mode
 *   Evaluated at return time to produce the return value (e.g., "score * 2", "playerName")
 * @property {string} [description] - Custom description text displayed in node UI
 *   Defaults to standard return semantics description if not provided
 */
export interface ReturnStatementNodeData {
    mode?: "linear" | "expression";
    expression?: string;
    description?: string;
}

/**
 * Props type for ReturnStatementNode component
 *
 * Extends React Flow's NodeProps with optional ReturnStatementNodeData properties
 * to support return statement representation within the visual scripting interface.
 *
 * @typedef {NodeProps & Partial<ReturnStatementNodeData>} ReturnStatementNodeProps
 */
export type ReturnStatementNodeProps = NodeProps & Partial<ReturnStatementNodeData>;

/**
 * ReturnStatementNode component represents Luau's return statement in visual scripts
 *
 * Implements function termination with optional value return. When executed, immediately
 * exits the current function scope and optionally passes a value back to the caller.
 *
 * Features:
 * - Dual-mode return value specification: wired connections or inline expressions
 * - Dynamic description updating based on current expression value
 * - Distinctive purple color scheme for control flow statement identification
 * - CornerUpLeft icon visually suggesting "exit/return" semantics
 * - No output handles (return terminates the current execution flow path)
 *
 * Execution semantics:
 * - Flow enters via "execute" input handle to trigger the return operation
 * - In linear mode: Return value comes from "value" input handle connection
 * - In expression mode: Return value comes from evaluated inline expression
 * - Execution immediately terminates current function scope upon activation
 * - Downstream nodes in the same function will NOT execute after return
 * - Multiple return nodes can exist in a function (e.g., early returns for guard clauses)
 *
 * Luau semantics notes:
 * - Functions implicitly return nil if no explicit return statement executes
 * - Return statements can appear anywhere in function body (not just at end)
 * - Returning multiple values is supported in Luau but not directly modeled here
 *   (use TableNode to return structured data as single value)
 * - Return statements inside loops immediately exit both loop and function
 *
 * Mode characteristics:
 * - Linear mode: Requires value-producing node connection to "value" input handle
 *   Supports any Luau type via LuauType.Any polymorphic typing
 * - Expression mode: Accepts inline Luau expressions (e.g., "health + armor")
 *   Basic syntax validation with visual feedback for invalid patterns
 *
 * Common use cases:
 * - Early function termination (guard clauses, validation failures)
 * - Returning computed results from utility functions
 * - Exit points in state machines or decision trees
 * - Error signaling with descriptive return values
 * - Short-circuit evaluation patterns
 *
 * Comparison with related constructs:
 * - BreakStatementNode: Exits only the innermost loop, not the entire function
 * - ContinueStatementNode: Skips to next loop iteration, does not exit function
 * - No explicit "exit" node needed - return serves as primary function termination mechanism
 *
 * Usage constraints:
 * - MUST be placed within a function scope in the script graph
 * - Using return outside a function context results in Luau compilation error at runtime
 * - Return statements in event handlers terminate only the handler function, not the entire script
 *
 * @component
 * @param {ReturnStatementNodeProps} props - React Flow node properties
 *
 * @example
 * // Register node type in React Flow
 * const nodeTypes = useMemo(() => ({
 *   return: ReturnStatementNode
 * }), []);
 *
 * @example
 * // Linear mode node (wired return value)
 * const successReturn = {
 *   id: 'return-1',
 *   type: 'return',
 *    {
 *     mode: 'linear',
 *     description: "Return success status"
 *   },
 *   position: { x: 300, y: 200 }
 * };
 * // Connect BooleanNode (value=true) to "value" input handle
 *
 * @example
 * // Expression mode node (computed return value)
 * const scoreReturn = {
 *   id: 'return-2',
 *   type: 'return',
 *    {
 *     mode: 'expression',
 *     expression: 'baseScore * multiplier',
 *     description: "Return final calculated score"
 *   },
 *   position: { x: 300, y: 200 }
 * };
 *
 * @example
 * // Typical usage pattern with guard clause:
 * // [FunctionStart] → [ValidateInput]
 * //                     ├─ invalid → [ReturnStatementNode] (return false early)
 * //                     └─ valid → [ProcessData] → [ReturnStatementNode] (return result)
 */
const ReturnStatementNode = memo(({ data, selected }: ReturnStatementNodeProps) => {
    const nodeId = useNodeId();
    const { setNodes } = useReactFlow();

    const mode = data?.mode || "linear";
    const expression = data?.expression || "";
    const description: string =
        (data?.description as string) || "Returns value and exits function";
    const scriptId = data?.__scriptId as string | undefined;

    /**
     * Updates node data in React Flow's state management system
     *
     * Merges partial data updates into the node's existing data while preserving
     * all other node properties. Ensures persistent state synchronization across
     * the visual scripting interface.
     *
     * @param {Partial<ReturnStatementNodeData>} partial - Partial data object to merge into node data
     * @returns {void}
     */
    const updateData = useCallback(
        (partial: Partial<ReturnStatementNodeData>) => {
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
     * Updates the node's mode selection in React Flow's persistent data store.
     * Switching modes dynamically changes available input handles (value handle
     * appears in linear mode, disappears in expression mode).
     *
     * @param {("linear" | "expression")} newMode - Target return value source mode
     * @returns {void}
     */
    const handleModeChange = useCallback(
        (newMode: "linear" | "expression") => {
            updateData({ mode: newMode });
        },
        [updateData]
    );

    /**
     * Handles expression input changes with real-time validation and description updates
     *
     * Updates the inline return expression and provides immediate visual feedback:
     * - Basic pattern validation against common Luau syntax characters
     * - Dynamic description text reflecting current expression value
     * - Warning indicator in description for invalid syntax patterns
     *
     * Validation rules:
     * - Empty expressions are permitted (returns nil in Luau)
     * - Accepts alphanumeric characters, operators, parentheses, quotes, and common Luau symbols
     * - Does NOT perform semantic validation (runtime Luau compiler handles type checking)
     *
     * @param {React.ChangeEvent<HTMLInputElement>} e - Input change event
     * @returns {void}
     */
    const handleExpressionChange = useCallback(
        (e: React.ChangeEvent<HTMLInputElement>) => {
            const expr = e.target.value;
            updateData({ expression: expr });

            const valid = expr.trim() === "" || /^[a-zA-Z0-9_+\-*/%().,\s"':;]+$/.test(expr);
            if (!valid) {
                updateData({ description: "Invalid expression" });
            } else {
                updateData({ description: `Returns: ${expr || "value"}` });
            }
        },
        [updateData]
    );

    return (
        <NodeTemplate
            details={{
                color: {
                    background: "bg-purple-400/10",
                    border: "border-purple-400/30",
                    text: "text-purple-400",
                    ring: "ring-purple-400/40",
                },
                icon: CornerUpLeft,
                name: "Return",
                description: description,
                selected,
            }}
            inputs={
                mode === "linear"
                    ? [
                          { id: "execute", label: "Execute", type: LuauType.Flow },
                          { id: "value", label: "Value", type: LuauType.Any },
                      ]
                    : [{ id: "execute", label: "Execute", type: LuauType.Flow }]
            }
            outputs={[]}
        >
            <div className="space-y-2">
                <div className="flex gap-1 mb-2">
                    <Button
                        variant={mode === "linear" ? "default" : "outline"}
                        size="xs"
                        className="text-xs h-6 cursor-pointer bg-purple-400/10 hover:bg-purple-400/20"
                        onClick={() => handleModeChange("linear")}
                    >
                        Linear
                    </Button>
                    <Button
                        variant={mode === "expression" ? "default" : "outline"}
                        size="xs"
                        className="text-xs h-6 cursor-pointer bg-purple-400/10 hover:bg-purple-400/20"
                        onClick={() => handleModeChange("expression")}
                    >
                        Expression
                    </Button>
                </div>

                {mode === "expression" && (
                    <div className="space-y-1">
                        <VariableAutocomplete
                            scriptId={scriptId || "unknown"}
                            value={expression as string}
                            onChange={handleExpressionChange}
                            placeholder='e.g., "Success"'
                            className={cn("text-xs h-7 font-mono")}
                        />
                    </div>
                )}
            </div>
        </NodeTemplate>
    );
});

ReturnStatementNode.displayName = "ReturnStatementNode";

/**
 * Static method to compute dynamic handles based on node data configuration
 *
 * Provides handle configuration that adapts to the selected value source mode:
 * - Linear mode: Includes value input handle for external connections
 * - Expression mode: Single execution input (value embedded in expression)
 *
 * Output handles are always empty since return statements terminate execution flow
 * and produce no downstream connections within the same function scope.
 *
 * Note: Handle configuration dynamically affects available connection points
 * in the React Flow editor. Switching modes will add/remove the value input
 * handle immediately, potentially breaking existing connections.
 *
 * @static
 * @param {ReturnStatementNodeData} data - Node configuration data containing mode selection
 * @returns {Object} Handle configuration with inputs and outputs arrays
 * @returns {Array} returns.inputs - Mode-dependent input handles
 * @returns {Array} returns.outputs - Empty array (return terminates flow)
 *
 * @example
 * // Linear mode handles (wired return value)
 * const linearHandles = ReturnStatementNode.getHandles({ mode: 'linear' });
 * // {
 * //   inputs: [
 * //     { id: "execute", label: "Execute", type: LuauType.Flow },
 * //     { id: "value", label: "Value", type: LuauType.Any }
 * //   ],
 * //   outputs: []
 * // }
 *
 * @example
 * // Expression mode handles (inline return value)
 * const expressionHandles = ReturnStatementNode.getHandles({ mode: 'expression' });
 * // {
 * //   inputs: [
 * //     { id: "execute", label: "Execute", type: LuauType.Flow }
 * //   ],
 * //   outputs: []
 * // }
 */
(ReturnStatementNode as any).getHandles = ( data: ReturnStatementNodeData ) => {
    const mode = data?.mode || "linear";

    return {
        inputs:
            mode === "linear"
                ? [
                      { id: "execute", label: "Execute", type: LuauType.Flow },
                      { id: "value", label: "Value", type: LuauType.Any },
                  ]
                : [{ id: "execute", label: "Execute", type: LuauType.Flow }],
        outputs: [],
    };
};

export default ReturnStatementNode;