"use client";

import React, { memo, useCallback, useState } from "react";
import { NodeProps, useNodeId, useReactFlow, useStore } from "@xyflow/react";
import NodeTemplate from "../../Template";
import { ListOrdered } from "lucide-react";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { LuauType } from "@/types/luau";
import { Label } from "@/components/ui/label";
import VariableAutocomplete from "@/components/ui/variable-autocomplete";

/**
 * Data structure for the ForLoopNode component
 *
 * Configures Luau for-loop behavior with two distinct operational modes:
 * 1. Counting mode: Numeric iteration with start/end/step parameters (for i = start, end, step)
 * 2. Generic mode: Iterator-based iteration over tables/sequences (for k, v in pairs(table))
 *
 * @interface
 * @property {("counting" | "generic")} [mode] - Loop iteration strategy selection
 * @property {string} [variableName] - Iterator variable name (counting mode only, default: "i")
 * @property {string} [startValue] - Starting value for counting loops (default: "1")
 * @property {string} [endValue] - Ending value for counting loops (default: "10")
 * @property {string} [stepValue] - Increment value for counting loops (default: "1")
 * @property {string} [iterableExpression] - Luau iterator expression (generic mode only, default: "pairs(table)")
 * @property {string} [description] - Custom description text displayed in node UI
 */
export interface ForLoopNodeData {
    mode?: "counting" | "generic";
    variableName?: string;
    startValue?: string;
    endValue?: string;
    stepValue?: string;
    iterableExpression?: string;
    description?: string;
}

/**
 * Props type for ForLoopNode component
 *
 * Extends React Flow's NodeProps with optional ForLoopNodeData properties
 * to support loop construct representation within the visual scripting interface.
 *
 * @typedef {NodeProps & Partial<ForLoopNodeData>} ForLoopNodeProps
 */
export type ForLoopNodeProps = NodeProps & Partial<ForLoopNodeData>;

/**
 * ForLoopNode component represents Luau for-loop constructs in visual scripts
 *
 * Implements both counting loops (numeric iteration) and generic loops (iterator-based)
 * with dynamic handle configuration based on selected mode. Manages loop execution flow
 * and provides iteration values to downstream nodes.
 *
 * Features:
 * - Dual-mode operation: counting (for i = 1, 10) and generic (for k, v in pairs(t))
 * - Real-time handle configuration adapting to selected mode
 * - Visual wiring indicators showing connected parameter inputs
 * - Disabled input fields when parameters are wired (prevents conflicting sources)
 * - Distinctive purple color scheme for loop construct identification
 * - ListOrdered icon representing sequential iteration semantics
 *
 * Counting mode characteristics:
 * - Four input handles: execution flow + three numeric parameters (start, end, step)
 * - Three output handles: loop body flow, completion flow, current index value
 * - Parameters can be provided via direct input fields OR wired connections (mutually exclusive)
 * - Default iteration: for i = 1, 10, 1
 *
 * Generic mode characteristics:
 * - Single execution flow input handle
 * - Three output handles: loop body flow, completion flow, current index/key value
 * - Custom iterator expression field (supports pairs(), ipairs(), custom iterators)
 * - Outputs both index/key and value through separate downstream connections
 *
 * Luau semantics:
 * - Counting loops use integer arithmetic with truncation toward negative infinity
 * - Step value can be negative for reverse iteration
 * - Generic loops support standard iterators: pairs() (dictionary), ipairs() (array), string.gmatch()
 * - Loop variable scope is strictly limited to the loop body
 * - Continue statements skip to next iteration; break statements exit loop entirely
 *
 * Visual scripting behavior:
 * - Execution enters via "execute" input handle to start loop
 * - For each iteration, flow proceeds through "loop" output handle to body nodes
 * - After final iteration, flow proceeds through "done" output handle
 * - Current iteration index/key available via "index" output handle during loop body execution
 * - Wired parameters override direct input field values (input fields disabled when wired)
 *
 * Common use cases:
 * - Array/table iteration (generic mode with ipairs/pairs)
 * - Fixed-count repetitions (counting mode)
 * - Countdown timers and progress indicators
 * - Grid traversal (nested loops with counting mode)
 * - Filtering/transforming collections (generic mode with custom logic)
 *
 * @component
 * @param {ForLoopNodeProps} props - React Flow node properties
 *
 * @example
 * // Register node type in React Flow
 * const nodeTypes = useMemo(() => ({
 *   forLoop: ForLoopNode
 * }), []);
 *
 * @example
 * // Counting loop node (default configuration)
 * const countingLoop = {
 *   id: 'loop-1',
 *   type: 'forLoop',
 *    {
 *     mode: 'counting',
 *     variableName: 'i',
 *     startValue: '1',
 *     endValue: '10',
 *     stepValue: '1'
 *   },
 *   position: { x: 100, y: 200 }
 * };
 *
 * @example
 * // Generic loop node (table iteration)
 * const tableLoop = {
 *   id: 'loop-2',
 *   type: 'forLoop',
 *    {
 *     mode: 'generic',
 *     iterableExpression: 'pairs(playerInventory)'
 *   },
 *   position: { x: 100, y: 200 }
 * };
 *
 * @example
 * // Typical loop structure in visual script:
 * // [StartNode] → [ForLoopNode.execute]
 * //                  ├─ .loop → [ProcessItemNode] → back to ForLoopNode
 * //                  └─ .done → [NextOperationNode]
 */
const ForLoopNode = memo(({ data, selected }: ForLoopNodeProps) => {
    const nodeId = useNodeId();
    const { setNodes } = useReactFlow();

    const [mode, setMode] = useState<"counting" | "generic">(
        data.mode && (data.mode === "counting" || data.mode === "generic")
            ? data.mode
            : "counting"
    );

    const variableName = data?.variableName || "i";
    const startValue = data?.startValue || "1";
    const endValue = data?.endValue || "10";
    const stepValue = data?.stepValue || "1";
    const iterableExpression = data?.iterableExpression || "pairs(table)";
    const description: string =
        (data?.description as string) ||
        `Counting loop: ${variableName} from ${startValue} to ${endValue}`;
    const scriptId = data?.__scriptId as string | undefined;

    // Retrieve connected edges to determine parameter wiring status
    const connectedEdges = useStore((s) =>
        s.edges.filter((e) => e.target === nodeId)
    );

    const isStartWired = connectedEdges.some(
        (e) => e.targetHandle === "start"
    );
    const isEndWired = connectedEdges.some((e) => e.targetHandle === "end");
    const isStepWired = connectedEdges.some((e) => e.targetHandle === "step");

    /**
     * Updates node data in React Flow's state management system
     *
     * Merges partial data updates into the node's existing data while preserving
     * all other node properties. Ensures persistent state synchronization across
     * the visual scripting interface.
     *
     * @param {Partial<ForLoopNodeData>} partial - Partial data object to merge into node data
     * @returns {void}
     */
    const updateData = useCallback(
        (partial: Partial<ForLoopNodeData>) => {
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
     * Handles mode switching between counting and generic loop operation types
     *
     * Updates local state and persists the mode selection to React Flow's node data.
     * Triggers immediate UI updates to reflect handle configuration changes.
     *
     * @param {("counting" | "generic")} newMode - Target loop iteration mode
     * @returns {void}
     */
    const handleModeChange = useCallback(
        (newMode: "counting" | "generic") => {
            setMode(newMode);
            updateData({ mode: newMode });
        },
        [updateData]
    );

    /**
     * Handles changes to the iterator variable name input field
     *
     * Updates the variable name used for loop iteration in counting mode.
     * Persists changes to React Flow's node data for persistence and export.
     *
     * @param {React.ChangeEvent<HTMLInputElement>} e - Input change event
     * @returns {void}
     */
    const handleVariableChange = useCallback(
        (e: React.ChangeEvent<HTMLInputElement>) => {
            updateData({ variableName: e.target.value });
        },
        [updateData]
    );

    /**
     * Handles changes to the start value input field in counting mode
     *
     * Updates the starting value for numeric iteration. Input is disabled when
     * the "start" handle is wired to prevent conflicting value sources.
     *
     * @param {React.ChangeEvent<HTMLInputElement>} e - Input change event
     * @returns {void}
     */
    const handleStartChange = useCallback(
        (e: React.ChangeEvent<HTMLInputElement>) => {
            updateData({ startValue: e.target.value });
        },
        [updateData]
    );

    /**
     * Handles changes to the end value input field in counting mode
     *
     * Updates the ending value for numeric iteration. Input is disabled when
     * the "end" handle is wired to prevent conflicting value sources.
     *
     * @param {React.ChangeEvent<HTMLInputElement>} e - Input change event
     * @returns {void}
     */
    const handleEndChange = useCallback(
        (e: React.ChangeEvent<HTMLInputElement>) => {
            updateData({ endValue: e.target.value });
        },
        [updateData]
    );

    /**
     * Handles changes to the step value input field in counting mode
     *
     * Updates the increment value for numeric iteration. Input is disabled when
     * the "step" handle is wired to prevent conflicting value sources.
     *
     * @param {React.ChangeEvent<HTMLInputElement>} e - Input change event
     * @returns {void}
     */
    const handleStepChange = useCallback(
        (e: React.ChangeEvent<HTMLInputElement>) => {
            updateData({ stepValue: e.target.value });
        },
        [updateData]
    );

    /**
     * Handles changes to the iterable expression input field in generic mode
     *
     * Updates the Luau iterator expression used for generic loops. Supports
     * standard iterators (pairs, ipairs) and custom iterator functions.
     *
     * @param {React.ChangeEvent<HTMLInputElement>} e - Input change event
     * @returns {void}
     */
    const handleIterableChange = useCallback(
        (e: React.ChangeEvent<HTMLInputElement>) => {
            updateData({ iterableExpression: e.target.value });
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
                icon: ListOrdered,
                name: "For Loop",
                description: description,
                selected,
            }}
            inputs={(ForLoopNode as any).getHandles(data).inputs}
            outputs={(ForLoopNode as any).getHandles(data).outputs}
        >
            <div className="space-y-2">
                <div className="flex gap-1 mb-2">
                    <Button
                        variant={mode === "counting" ? "default" : "outline"}
                        size="xs"
                        className="text-xs h-6 cursor-pointer bg-purple-400/10 hover:bg-purple-400/20"
                        onClick={() => handleModeChange("counting")}
                    >
                        Counting
                    </Button>
                    <Button
                        variant={mode === "generic" ? "default" : "outline"}
                        size="xs"
                        className="text-xs h-6 cursor-pointer bg-purple-400/10 hover:bg-purple-400/20"
                        onClick={() => handleModeChange("generic")}
                    >
                        Generic
                    </Button>
                </div>

                {mode === "counting" && (
                    <div className="space-y-1 mt-5">
                        <div className="flex gap-1 flex-col mb-4">
                            <Label
                                htmlFor="variableName"
                                className="text-xs text-muted-foreground"
                            >
                                Iterator name:
                            </Label>
                            <Input
                                id="variableName"
                                value={variableName as string}
                                onChange={handleVariableChange}
                                placeholder="i"
                                className="text-xs h-7 w-full"
                            />

                            <Label
                                htmlFor="fromNumber"
                                className="text-xs text-muted-foreground mt-4"
                            >
                                From:
                            </Label>
                            <Input
                                type={isStartWired ? "text" : "number"}
                                id="fromNumber"
                                value={isStartWired ? "Wired" : startValue as string}
                                onChange={handleStartChange}
                                placeholder="1"
                                className={cn(
                                    "text-xs h-7 w-full [appearance:textfield]"
                                )}
                                disabled={isStartWired}
                            />

                            <Label
                                htmlFor="toNumber"
                                className="text-xs text-muted-foreground mt-4"
                            >
                                To:
                            </Label>
                            <Input
                                type={isEndWired ? "text" : "number"}
                                id="toNumber"
                                value={isEndWired ? "Wired" : endValue as string}
                                onChange={handleEndChange}
                                placeholder="10"
                                className={cn(
                                    "text-xs h-7 w-full [appearance:textfield]"
                                )}
                                disabled={isEndWired}
                            />

                            <Label
                                htmlFor="step"
                                className="text-xs text-muted-foreground mt-4"
                            >
                                Step:
                            </Label>
                            <Input
                                type={isStepWired ? "text" : "number"}
                                id="step"
                                value={isStepWired ? "Wired" : stepValue as string}
                                onChange={handleStepChange}
                                placeholder="1"
                                className={cn(
                                    "text-xs h-7 w-full [appearance:textfield]"
                                )}
                                disabled={isStepWired}
                            />
                        </div>
                    </div>
                )}

                {mode === "generic" && (
                    <div className="space-y-1">
                        <VariableAutocomplete
                            scriptId={scriptId || "unknown"}
                            value={iterableExpression as string}
                            onChange={handleIterableChange}
                            placeholder="pairs(table)"
                            className={cn("text-xs h-7 font-mono")}
                        />
                        <p className="text-[10px] text-muted-foreground italic">
                            Use pairs(), ipairs(), or custom iterator
                        </p>
                    </div>
                )}
            </div>
        </NodeTemplate>
    );
});

ForLoopNode.displayName = "ForLoopNode";

/**
 * Static method to compute dynamic handles based on node data configuration
 *
 * Provides handle configuration that adapts to the selected loop mode:
 * - Counting mode: Includes parameter inputs (start/end/step) for flexible configuration
 * - Generic mode: Single execution input since parameters are embedded in iterator expression
 *
 * All modes share the same output structure:
 * - loop: Flow handle entering loop body for each iteration
 * - done: Flow handle exiting after final iteration completes
 * - index: Data handle providing current iteration index/key value
 *
 * Note: Value outputs (for generic loops) are typically handled by downstream nodes
 * connected to the loop body flow, rather than explicit handles on this node.
 *
 * @static
 * @param {ForLoopNodeData} data - Node configuration data containing mode selection
 * @returns {Object} Handle configuration with inputs and outputs arrays
 * @returns {Array} returns.inputs - Mode-dependent input handles
 * @returns {Array} returns.outputs - Consistent output handles across modes
 *
 * @example
 * // Counting mode handles
 * const countingHandles = ForLoopNode.getHandles({ mode: 'counting' });
 * // {
 * //   inputs: [
 * //     { id: "execute", label: "Execute", type: LuauType.Flow },
 * //     { id: "start", label: "From", type: LuauType.Number },
 * //     { id: "end", label: "To", type: LuauType.Number },
 * //     { id: "step", label: "Step", type: LuauType.Number }
 * //   ],
 * //   outputs: [
 * //     { id: "loop", label: "Loop Body", type: LuauType.Flow },
 * //     { id: "done", label: "Done", type: LuauType.Flow },
 * //     { id: "index", label: "Index", type: LuauType.Number }
 * //   ]
 * // }
 *
 * @example
 * // Generic mode handles
 * const genericHandles = ForLoopNode.getHandles({ mode: 'generic' });
 * // {
 * //   inputs: [
 * //     { id: "execute", label: "Execute", type: LuauType.Flow }
 * //   ],
 * //   outputs: [
 * //     { id: "loop", label: "Loop Body", type: LuauType.Flow },
 * //     { id: "done", label: "Done", type: LuauType.Flow },
 * //     { id: "index", label: "Index", type: LuauType.Number }
 * //   ]
 * // }
 */
(ForLoopNode as any).getHandles = (data: ForLoopNodeData) => {
    const mode = data?.mode || "counting";

    if (mode === "counting") {
        return {
            inputs: [
                { id: "execute", label: "Execute", type: LuauType.Flow },
                { id: "start", label: "From", type: LuauType.Number },
                { id: "end", label: "To", type: LuauType.Number },
                { id: "step", label: "Step", type: LuauType.Number },
            ],
            outputs: [
                { id: "loop", label: "Loop Body", type: LuauType.Flow },
                { id: "done", label: "Done", type: LuauType.Flow },
                { id: "index", label: "Index", type: LuauType.Number },
            ],
        };
    }

    // Generic mode
    return {
        inputs: [{ id: "execute", label: "Execute", type: LuauType.Flow }],
        outputs: [
            { id: "loop", label: "Loop Body", type: LuauType.Flow },
            { id: "done", label: "Done", type: LuauType.Flow },
            { id: "index", label: "Index", type: LuauType.Number },
        ],
    };
};

export default ForLoopNode;