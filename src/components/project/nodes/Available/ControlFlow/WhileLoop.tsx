"use client";

import React, { memo, useCallback } from "react";
import { NodeProps, useNodeId, useReactFlow, useStore } from "@xyflow/react";
import NodeTemplate from "../../Template";
import { Clock } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { LuauType } from "@/types/luau";
import VariableAutocomplete from "@/components/ui/variable-autocomplete";

/**
 * Data structure for the WhileLoopNode component
 *
 * Configures Luau while-loop behavior with two operational modes:
 * 1. Linear mode: Condition value comes from external ConditionNode connection
 * 2. Expression mode: Condition value comes from inline Luau boolean expression
 *
 * Key semantic characteristic: while loops evaluate the condition BEFORE each
 * iteration, meaning the loop body may never execute if the initial condition is false.
 *
 * @interface
 * @property {("linear" | "expression")} [mode] - Condition evaluation strategy
 *   "linear" = wired connection from ConditionNode, "expression" = inline Luau expression
 * @property {string} [expression] - Inline Luau boolean expression when in expression mode
 *   Evaluated before each iteration to determine loop continuation
 * @property {string} [description] - Custom description text displayed in node UI
 *   Defaults to loop semantics description if not provided
 * @property {string} [__scriptId] - Internal script identifier for variable autocomplete context
 *   Used by VariableAutocomplete to provide context-aware suggestions (not part of public API)
 */
export interface WhileLoopNodeData {
    mode?: "linear" | "expression";
    expression?: string;
    description?: string;
}

/**
 * Props type for WhileLoopNode component
 *
 * Extends React Flow's NodeProps with optional WhileLoopNodeData properties
 * to support while-loop construct representation within the visual scripting interface.
 *
 * @typedef {NodeProps & Partial<WhileLoopNodeData>} WhileLoopNodeProps
 */
export type WhileLoopNodeProps = NodeProps & Partial<WhileLoopNodeData>;

/**
 * WhileLoopNode component represents Luau while-loops in visual scripts
 *
 * Implements the while-loop control flow construct where the condition is evaluated
 * BEFORE each iteration to determine whether to execute the loop body. Unlike
 * repeat-until loops, while loops may execute zero times if the initial condition
 * evaluates false.
 *
 * Features:
 * - Dual-mode condition evaluation: wired connections or inline expressions
 * - Visual feedback for missing condition connections in linear mode
 * - Variable-aware autocomplete in expression mode (contextual suggestions)
 * - Dynamic description updating based on current expression value
 * - Distinctive purple color scheme for loop construct identification
 * - Clock icon representing time-based or condition-based repetition semantics
 * - Two output flow handles: loop body continuation and post-loop completion
 *
 * Loop execution semantics:
 * 1. Flow enters via "execute" input handle
 * 2. Condition is evaluated BEFORE first iteration:
 *    - FALSE: Loop skips body entirely, flow proceeds via "done" output handle
 *    - TRUE: Loop body executes via "loop" output handle connections
 * 3. After body completes, condition re-evaluated:
 *    - TRUE: Loop repeats (flow returns to step 2)
 *    - FALSE: Loop terminates, flow proceeds via "done" output handle
 *
 * Mode characteristics:
 * - Linear mode: Requires ConditionNode connection to "condition" input handle
 *   Visual warning shown when connection is missing
 * - Expression mode: Accepts inline Luau boolean expressions with variable autocomplete
 *   (e.g., "index < 10", "isRunning and health > 0")
 *   Basic syntax validation with visual feedback for invalid patterns
 *
 * Luau semantics notes:
 * - Condition expression evaluated BEFORE each iteration (pre-test loop)
 * - Variables modified outside loop affect initial condition evaluation
 * - Supports break statements to exit loop early from within body
 * - Supports continue statements to skip to next condition evaluation
 * - Infinite loops possible if condition never becomes false (runtime responsibility)
 *
 * Common use cases:
 * - Polling loops (check condition repeatedly until met)
 * - Game update loops (run while game state active)
 * - Input processing loops (process while input available)
 * - Resource monitoring (check resource levels periodically)
 * - State machine transitions (loop while in specific state)
 *
 * Comparison with related constructs:
 * - RepeatUntilLoopNode: Condition evaluated AFTER body (guarantees at least one iteration)
 * - ForLoopNode: Fixed iteration count or iterator-based traversal
 * - IfElseNode: Single conditional branch without repetition
 *
 * @component
 * @param {WhileLoopNodeProps} props - React Flow node properties
 *
 * @example
 * // Register node type in React Flow
 * const nodeTypes = useMemo(() => ({
 *   while: WhileLoopNode
 * }), []);
 *
 * @example
 * // Linear mode node (wired condition)
 * const pollingLoop = {
 *   id: 'loop-1',
 *   type: 'while',
 *    {
 *     mode: 'linear',
 *     description: "Poll until resource available"
 *   },
 *   position: { x: 100, y: 200 }
 * };
 * // Connect ConditionNode output to "condition" input handle
 *
 * @example
 * // Expression mode node (inline condition with variable)
 * const gameLoop = {
 *   id: 'loop-2',
 *   type: 'while',
 *    {
 *     mode: 'expression',
 *     expression: 'gameState == "running"',
 *     description: "Run while game is active",
 *     __scriptId: 'main-script-123'
 *   },
 *   position: { x: 100, y: 200 }
 * };
 *
 * @example
 * // Typical loop structure in visual script:
 * // [StartNode] → [WhileLoopNode.execute]
 * //                  ├─ condition false → [WhileLoopNode.done] → [NextOperation]
 * //                  └─ condition true → [WhileLoopNode.loop] → [ProcessData] → back to WhileLoopNode
 */
const WhileLoopNode = memo(({ data, selected }: WhileLoopNodeProps) => {
    const nodeId = useNodeId();
    const { setNodes } = useReactFlow();

    const mode = data?.mode || "linear";
    const expression = data?.expression || "";
    const description: string = (data?.description as string) || "Loop while condition is true";
    const scriptId = data?.__scriptId as string | undefined;

    /**
     * Updates node data in React Flow's state management system
     *
     * Merges partial data updates into the node's existing data while preserving
     * all other node properties. Ensures persistent state synchronization across
     * the visual scripting interface.
     *
     * @param {Partial<WhileLoopNodeData>} partial - Partial data object to merge into node data
     * @returns {void}
     */
    const updateData = useCallback(
        (partial: Partial<WhileLoopNodeData>) => {
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
     * Note: In expression mode, VariableAutocomplete provides context-aware suggestions
     * based on the scriptId prop for improved authoring experience.
     *
     * @param {React.ChangeEvent<HTMLInputElement>} e - Input change event
     * @returns {void}
     */
    const handleExpressionChange = useCallback(
        (e: React.ChangeEvent<HTMLInputElement>) => {
            const expr = e.target.value;
            updateData({ expression: expr });

            const valid = expr.trim() === "" || /^[a-zA-Z0-9_+\-*/%().,\s=!<>]+$/.test(expr);
            if (!valid) {
                updateData({ description: "⚠️ Invalid expression" });
            } else {
                updateData({ description: `Loop while: ${expr || "condition"}` });
            }
        },
        [updateData]
    );

    /**
     * Get condition edges to verify if got a linked condition
     */
    const conditionEdges = useStore((s) =>
        s.edges.filter(
            (e) =>
                e.target === nodeId &&
                e.targetHandle?.startsWith("condition")
        )
    );
    const mainConditionConnected = conditionEdges.some((e) => e.targetHandle === "condition");

    return (
        <NodeTemplate
            details={{
                color: {
                    background: "bg-purple-400/10",
                    border: "border-purple-400/30",
                    text: "text-purple-400",
                    ring: "ring-purple-400/40",
                },
                icon: Clock,
                name: "While Loop",
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
                            placeholder="e.g., index < 10"
                            className={cn("text-xs h-7 font-mono")}
                        />
                    </div>
                )}
            </div>
        </NodeTemplate>
    );
});

WhileLoopNode.displayName = "WhileLoopNode";

/**
 * Static method to compute dynamic handles based on node data configuration
 *
 * Provides handle configuration that adapts to the selected evaluation mode:
 * - Linear mode: Includes condition input handle for external boolean connections
 * - Expression mode: Single execution input (condition embedded in expression)
 *
 * Output handles remain consistent across modes:
 * - loop: Flow handle entering loop body when condition evaluates true
 * - done: Flow handle exiting loop when condition evaluates false
 *
 * Note: Handle configuration dynamically affects available connection points
 * in the React Flow editor. Switching modes will add/remove the condition input
 * handle immediately, potentially breaking existing connections.
 *
 * @static
 * @param {WhileLoopNodeData} data - Node configuration data containing mode selection
 * @returns {Object} Handle configuration with inputs and outputs arrays
 * @returns {Array} returns.inputs - Mode-dependent input handles
 * @returns {Array} returns.outputs - Consistent output handles across modes
 *
 * @example
 * // Linear mode handles (wired condition)
 * const linearHandles = WhileLoopNode.getHandles({ mode: 'linear' });
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
 * const expressionHandles = WhileLoopNode.getHandles({ mode: 'expression' });
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
(WhileLoopNode as any).getHandles = (data: WhileLoopNodeData) => {
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
    }
};

export default WhileLoopNode;