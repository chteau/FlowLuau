"use client";

import React, { memo, useCallback } from "react";
import { NodeProps, useNodeId, useReactFlow, useStore } from "@xyflow/react";
import NodeTemplate from "../../Template";
import { RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { LuauType } from "@/types/luau";
import VariableAutocomplete from "@/components/ui/variable-autocomplete";

/**
 * Data structure for the RepeatUntilLoopNode component
 *
 * Configures Luau repeat-until loop behavior with two operational modes:
 * 1. Linear mode: Condition value comes from external ConditionNode connection
 * 2. Expression mode: Condition value comes from inline Luau boolean expression
 *
 * Key semantic difference from while loops: repeat-until loops ALWAYS execute
 * the body at least once before evaluating the termination condition.
 *
 * @interface
 * @property {("linear" | "expression")} [mode] - Condition evaluation strategy
 *   "linear" = wired connection from ConditionNode, "expression" = inline Luau expression
 * @property {string} [expression] - Inline Luau boolean expression when in expression mode
 *   Evaluated after each iteration to determine loop termination
 * @property {string} [description] - Custom description text displayed in node UI
 *   Defaults to loop semantics description if not provided
 */
export interface RepeatUntilLoopNodeData {
    mode?: "linear" | "expression";
    expression?: string;
    description?: string;
}

/**
 * Props type for RepeatUntilLoopNode component
 *
 * Extends React Flow's NodeProps with optional RepeatUntilLoopNodeData properties
 * to support repeat-until loop construct representation within the visual scripting interface.
 *
 * @typedef {NodeProps & Partial<RepeatUntilLoopNodeData>} RepeatUntilLoopNodeProps
 */
export type RepeatUntilLoopNodeProps = NodeProps & Partial<RepeatUntilLoopNodeData>;

/**
 * RepeatUntilLoopNode component represents Luau repeat-until loops in visual scripts
 *
 * Implements the repeat-until control flow construct where the loop body executes
 * FIRST, then the condition is evaluated to determine whether to continue iterating.
 * This guarantees at least one execution of the loop body, unlike while loops.
 *
 * Features:
 * - Dual-mode condition evaluation: wired connections or inline expressions
 * - Visual feedback for missing condition connections in linear mode
 * - Dynamic description updating based on current expression value
 * - Distinctive purple color scheme for loop construct identification
 * - Circular arrow icon (RefreshCw) representing repetitive execution semantics
 * - Two output flow handles: loop body continuation and post-loop completion
 *
 * Loop execution semantics:
 * 1. Flow enters via "execute" input handle
 * 2. Loop body executes via "loop" output handle connections
 * 3. After body completes, condition is evaluated:
 *    - FALSE: Loop repeats (flow returns to step 2)
 *    - TRUE: Loop terminates, flow proceeds via "done" output handle
 * 4. Guaranteed minimum of one iteration regardless of initial condition state
 *
 * Mode characteristics:
 * - Linear mode: Requires ConditionNode connection to "condition" input handle
 *   Visual warning shown when connection is missing
 * - Expression mode: Accepts inline Luau boolean expressions (e.g., "index >= 10")
 *   Basic syntax validation with visual feedback for invalid patterns
 *
 * Luau semantics notes:
 * - Condition expression evaluated AFTER each iteration (post-test loop)
 * - Variables modified in loop body are visible during condition evaluation
 * - Supports break statements to exit loop early from within body
 * - Supports continue statements to skip to next iteration evaluation
 *
 * Common use cases:
 * - Input validation loops (prompt until valid input received)
 * - Resource acquisition retries (attempt operation until success)
 * - Game mechanics requiring guaranteed first iteration (e.g., spawn then check bounds)
 * - Menu systems where options must display at least once before exit check
 *
 * Comparison with related constructs:
 * - WhileLoopNode: Condition evaluated BEFORE body (may skip iteration entirely)
 * - ForLoopNode: Fixed iteration count or iterator-based traversal
 * - IfElseNode: Single conditional branch without repetition
 *
 * @component
 * @param {RepeatUntilLoopNodeProps} props - React Flow node properties
 *
 * @example
 * // Register node type in React Flow
 * const nodeTypes = useMemo(() => ({
 *   repeatUntil: RepeatUntilLoopNode
 * }), []);
 *
 * @example
 * // Linear mode node (wired condition)
 * const retryLoop = {
 *   id: 'loop-1',
 *   type: 'repeatUntil',
 *    {
 *     mode: 'linear',
 *     description: "Retry operation until success"
 *   },
 *   position: { x: 100, y: 200 }
 * };
 * // Connect ConditionNode output to "condition" input handle
 *
 * @example
 * // Expression mode node (inline condition)
 * const inputLoop = {
 *   id: 'loop-2',
 *   type: 'repeatUntil',
 *    {
 *     mode: 'expression',
 *     expression: 'userInput ~= ""',
 *     description: "Loop until user provides input"
 *   },
 *   position: { x: 100, y: 200 }
 * };
 *
 * @example
 * // Typical loop structure in visual script:
 * // [StartNode] → [RepeatUntilLoopNode.execute]
 * //                  └─ .loop → [PromptUserNode] → [ValidateInputNode] → back to RepeatUntilLoopNode
 * //                  └─ .done → [ProcessValidInputNode]
 */
const RepeatUntilLoopNode = memo(({ data, selected }: RepeatUntilLoopNodeProps) => {
    const nodeId = useNodeId();
    const { setNodes } = useReactFlow();

    const mode = data?.mode || "linear";
    const expression = data?.expression || "";
    const description: string =
        (data?.description as string) || "Loop until condition is true";
    const scriptId = data?.__scriptId as string | undefined;

    /**
     * Updates node data in React Flow's state management system
     *
     * Merges partial data updates into the node's existing data while preserving
     * all other node properties. Ensures persistent state synchronization across
     * the visual scripting interface.
     *
     * @param {Partial<RepeatUntilLoopNodeData>} partial - Partial data object to merge into node data
     * @returns {void}
     */
    const updateData = useCallback(
        (partial: Partial<RepeatUntilLoopNodeData>) => {
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
     * Switching modes dynamically changes available input handles (condition handle
     * appears in linear mode, disappears in expression mode).
     *
     * @param {("linear" | "expression")} newMode - Target condition evaluation mode
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
     * Updates the inline condition expression and provides immediate visual feedback:
     * - Basic pattern validation against common Luau syntax characters
     * - Dynamic description text reflecting current expression value
     * - Warning indicator in description for invalid syntax patterns
     *
     * Validation rules:
     * - Empty expressions are permitted (placeholder state)
     * - Accepts alphanumeric characters, operators, parentheses, and common Luau symbols
     * - Does NOT perform semantic validation (runtime Luau compiler handles this)
     *
     * @param {React.ChangeEvent<HTMLInputElement>} e - Input change event
     * @returns {void}
     */
    const handleExpressionChange = useCallback(
        (e: React.ChangeEvent<HTMLInputElement>) => {
            const expr = e.target.value;
            updateData({ expression: expr });

            // Basic validation
            const valid = expr.trim() === "" || /^[a-zA-Z0-9_+\-*/%().,\s=!<>]+$/.test(expr);
            if (!valid) {
                updateData({ description: "Invalid expression" });
            } else {
                updateData({ description: `Loop until: ${expr || "condition"}` });
            }
        },
        [updateData]
    );

    // Retrieve condition edges to determine wired connection status in linear mode
    const conditionEdges = useStore((s) =>
        s.edges.filter(
            (e) =>
                e.target === nodeId &&
                e.targetHandle?.startsWith("condition")
        )
    );

    const mainConditionConnected = conditionEdges.some(
        (e) => e.targetHandle === "condition"
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
                icon: RefreshCw,
                name: "Repeat Until Loop",
                description: description,
                selected,
            }}
            inputs={
                mode === "linear"
                    ? [
                        { id: "execute", label: "Execute", type: LuauType.Flow },
                        { id: "condition", label: "Condition", type: LuauType.Boolean },
                    ]
                    : [{ id: "execute", label: "Execute", type: LuauType.Flow }]
            }
            outputs={[
                { id: "loop", label: "Loop Body", type: LuauType.Flow },
                { id: "done", label: "Done", type: LuauType.Flow },
            ]}
        >
            <div className="space-y-2">
                {mode === "linear" && !mainConditionConnected && (
                    <span className="text-xs text-destructive block mb-5">
                        Condition Node Input missing.
                    </span>
                )}

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
                            placeholder="e.g., index >= 10"
                            className={cn("text-xs h-7 font-mono")}
                        />
                    </div>
                )}
            </div>
        </NodeTemplate>
    );
});

RepeatUntilLoopNode.displayName = "RepeatUntilLoopNode";

/**
 * Static method to compute dynamic handles based on node data configuration
 *
 * Provides handle configuration that adapts to the selected evaluation mode:
 * - Linear mode: Includes condition input handle for external boolean connections
 * - Expression mode: Single execution input (condition embedded in expression)
 *
 * Output handles remain consistent across modes:
 * - loop: Flow handle re-entering loop body for next iteration
 * - done: Flow handle exiting loop after condition evaluates true
 *
 * Note: Handle configuration dynamically affects available connection points
 * in the React Flow editor. Switching modes will add/remove the condition input
 * handle immediately, potentially breaking existing connections.
 *
 * @static
 * @param {RepeatUntilLoopNodeData} data - Node configuration data containing mode selection
 * @returns {Object} Handle configuration with inputs and outputs arrays
 * @returns {Array} returns.inputs - Mode-dependent input handles
 * @returns {Array} returns.outputs - Consistent output handles across modes
 *
 * @example
 * // Linear mode handles (wired condition)
 * const linearHandles = RepeatUntilLoopNode.getHandles({ mode: 'linear' });
 * // {
 * //   inputs: [
 * //     { id: "execute", label: "Execute", type: LuauType.Flow },
 * //     { id: "condition", label: "Condition", type: LuauType.Boolean }
 * //   ],
 * //   outputs: [
 * //     { id: "loop", label: "Loop Body", type: LuauType.Flow },
 * //     { id: "done", label: "Done", type: LuauType.Flow }
 * //   ]
 * // }
 *
 * @example
 * // Expression mode handles (inline condition)
 * const expressionHandles = RepeatUntilLoopNode.getHandles({ mode: 'expression' });
 * // {
 * //   inputs: [
 * //     { id: "execute", label: "Execute", type: LuauType.Flow }
 * //   ],
 * //   outputs: [
 * //     { id: "loop", label: "Loop Body", type: LuauType.Flow },
 * //     { id: "done", label: "Done", type: LuauType.Flow }
 * //   ]
 * // }
 */
(RepeatUntilLoopNode as any).getHandles = (data: RepeatUntilLoopNodeData) => {
    const mode = data?.mode || "linear";

    return {
        inputs:
            mode === "linear"
                ? [
                    { id: "execute", label: "Execute", type: LuauType.Flow },
                    { id: "condition", label: "Condition", type: LuauType.Boolean },
                ]
                : [{ id: "execute", label: "Execute", type: LuauType.Flow }],
        outputs: [
            { id: "loop", label: "Loop Body", type: LuauType.Flow },
            { id: "done", label: "Done", type: LuauType.Flow },
        ],
    };
};

export default RepeatUntilLoopNode;