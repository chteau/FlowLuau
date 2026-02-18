"use client";

import { memo } from "react";
import { NodeProps } from "@xyflow/react";
import NodeTemplate from "../../Template";
import { SkipForward } from "lucide-react";
import { LuauType } from "@/types/luau";

/**
 * Data structure for the ContinueStatementNode component
 *
 * Represents configuration options for Luau's continue statement in visual scripts.
 * Continue statements skip the remaining body of the current loop iteration and
 * proceed directly to the next iteration evaluation.
 *
 * @interface
 * @property {string} [description] - Optional custom description text displayed in node UI
 *   Defaults to "Skips to next loop iteration" if not provided.
 */
export interface ContinueStatementNodeData {
    description?: string;
}

/**
 * Props type for ContinueStatementNode component
 *
 * Extends React Flow's NodeProps with optional ContinueStatementNodeData properties
 * to support continue statement representation within the visual scripting interface.
 *
 * @typedef {NodeProps & Partial<ContinueStatementNodeData>} ContinueStatementNodeProps
 */
export type ContinueStatementNodeProps = NodeProps & Partial<ContinueStatementNodeData>;

/**
 * ContinueStatementNode component represents Luau's continue statement in visual scripts
 *
 * This node implements the continue control flow statement which immediately skips the
 * remainder of the current loop iteration and proceeds to evaluate the loop condition
 * for the next iteration (or terminates if no iterations remain).
 *
 * Key characteristics:
 * - Single Flow-type input handle representing control flow entry point
 * - No output handles (continue terminates the current iteration flow path)
 * - Distinctive purple color scheme for control flow statement identification
 * - Forward skip icon (SkipForward) visually suggesting "advance/skip forward"
 * - Optional custom description for contextual documentation within scripts
 *
 * Usage constraints and semantics:
 * - MUST be placed within a loop construct (while, repeat, or for loop) in the script graph
 * - Using continue outside a loop context results in a Luau compilation error at runtime
 * - Immediately halts execution of remaining statements in the current loop iteration
 * - Proceeds directly to loop condition re-evaluation (for while/repeat) or next iterator value (for for loops)
 * - Does NOT support labeled continues (Luau limitation - only affects innermost loop)
 *
 * Visual scripting behavior:
 * - When flow execution reaches this node, the current iteration terminates immediately
 * - Downstream nodes within the same loop iteration will NOT execute
 * - Execution resumes at the loop's condition check or iterator advancement phase
 * - Multiple continue nodes can exist within a single loop (e.g., for different skip conditions)
 *
 * Comparison with related constructs:
 * - BreakStatementNode: Exits the entire loop instead of just skipping current iteration
 * - ReturnStatementNode: Exits entire function scope (stronger termination)
 * - Conditional nodes: Often precede continue nodes to determine skip conditions
 *
 * Common use cases:
 * - Early iteration skipping based on guard conditions
 * - Filtering loop iterations (e.g., skip processing for invalid items)
 * - Optimizing loops by avoiding unnecessary computation in specific cases
 * - Implementing complex iteration patterns with multiple exit/skip paths
 *
 * @component
 * @param {ContinueStatementNodeProps} props - React Flow node properties
 *
 * @example
 * // Register node type in React Flow
 * const nodeTypes = useMemo(() => ({
 *   continue: ContinueStatementNode
 * }), []);
 *
 * @example
 * // Basic continue statement node
 * const continueNode = {
 *   id: 'continue-1',
 *   type: 'continue',
 *    {
 *     description: "Skip processing for invalid items"
 *   },
 *   position: { x: 200, y: 150 }
 * };
 *
 * @example
 * // Typical usage pattern within a for loop construct:
 * // [ForLoopNode]
 * //   └─ flow output → [IsValidCheck]
 * //                      ├─ false → [ContinueStatementNode]  // Skip invalid item
 * //                      └─ true → [ProcessItemNodes...] → back to ForLoopNode
 */
const ContinueStatementNode = memo(
    ({ data, selected }: ContinueStatementNodeProps) => {
        const description: string =
            (data?.description as string) ||
            "Skips to next loop iteration";

        return (
            <NodeTemplate
                details={{
                    color: {
                        background: "bg-purple-400/10",
                        border: "border-purple-400/30",
                        text: "text-purple-400",
                        ring: "ring-purple-400/40",
                    },
                    icon: SkipForward,
                    name: "Continue",
                    description: description,
                    selected,
                }}
                inputs={[
                    { id: "execute", label: "Execute", type: LuauType.Flow },
                ]}
                outputs={[]}
            />
        );
    }
);

ContinueStatementNode.displayName = "ContinueStatementNode";

/**
 * Static method to compute handles for ContinueStatementNode
 *
 * Provides handle configuration for the visual scripting system to render
 * connection points without mounting the full component. Continue statements
 * require a single Flow-type input handle for control flow sequencing and
 * produce no outputs since they terminate the current iteration flow path.
 *
 * Note: Handle configuration is static and does not vary based on node data.
 * The single input handle accepts Flow-type connections representing the
 * control flow entry point where the continue statement executes.
 *
 * @static
 * @param {ContinueStatementNodeData} data - Node configuration data (unused - handles are static)
 * @returns {Object} Handle configuration object
 * @returns {Array} returns.inputs - Single Flow-type input handle for control flow entry
 * @returns {Array} returns.outputs - Empty array (continue terminates iteration flow, produces no outputs)
 *
 * @example
 * const handles = ContinueStatementNode.getHandles();
 * // {
 * //   inputs: [
 * //     { id: "execute", label: "Execute", type: LuauType.Flow }
 * //   ],
 * //   outputs: []
 * // }
 */
(ContinueStatementNode as any).getHandles = (
     data: ContinueStatementNodeData
) => ({
    inputs: [{ id: "execute", label: "Execute", type: LuauType.Flow }],
    outputs: [],
});

export default ContinueStatementNode;