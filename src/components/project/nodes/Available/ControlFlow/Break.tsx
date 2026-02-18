"use client";

import { memo } from "react";
import { NodeProps } from "@xyflow/react";
import NodeTemplate from "../../Template";
import { CornerDownLeft } from "lucide-react";
import { LuauType } from "@/types/luau";

/**
 * Data structure for the BreakStatementNode component
 *
 * Represents configuration options for Luau's break statement in visual scripts.
 * Break statements exit the innermost loop immediately when executed.
 *
 * @interface
 * @property {string} [description] - Optional custom description text displayed in node UI
 *   Defaults to "Exits the current loop immediately" if not provided.
 */
export interface BreakStatementNodeData {
    description?: string;
}

/**
 * Props type for BreakStatementNode component
 *
 * Extends React Flow's NodeProps with optional BreakStatementNodeData properties
 * to support break statement representation within the visual scripting interface.
 *
 * @typedef {NodeProps & Partial<BreakStatementNodeData>} BreakStatementNodeProps
 */
export type BreakStatementNodeProps = NodeProps & Partial<BreakStatementNodeData>;

/**
 * BreakStatementNode component represents Luau's break statement in visual scripts
 *
 * This node implements the break control flow statement which immediately terminates
 * execution of the innermost enclosing loop (while, repeat, or for loop) and transfers
 * control to the statement following the loop body.
 *
 * Key characteristics:
 * - Single Flow-type input handle representing control flow entry point
 * - No output handles (break terminates the current flow path within a loop)
 * - Distinctive purple color scheme for control flow statement identification
 * - Downward arrow icon (CornerDownLeft) visually suggesting "exit/termination"
 * - Optional custom description for contextual documentation within scripts
 *
 * Usage constraints and semantics:
 * - MUST be placed within a loop construct (while, repeat, for) in the script graph
 * - Using break outside a loop context results in a Luau compilation error at runtime
 * - Immediately halts execution of the current loop iteration
 * - Skips any remaining statements in the loop body for the current iteration
 * - Transfers control to the first statement after the loop's closing block
 * - Does NOT support labeled breaks (Luau limitation - only exits innermost loop)
 *
 * Visual scripting behavior:
 * - When flow execution reaches this node, the current loop terminates immediately
 * - Downstream nodes within the same loop iteration will NOT execute
 * - Execution continues at the node connected after the loop construct
 * - Multiple break nodes can exist within a single loop (e.g., for different exit conditions)
 *
 * Related constructs:
 * - ContinueStatementNode: Skips to next iteration instead of exiting loop
 * - ReturnStatementNode: Exits entire function scope (stronger termination)
 * - Conditional nodes: Often precede break nodes to determine exit conditions
 *
 * @component
 * @param {BreakStatementNodeProps} props - React Flow node properties
 *
 * @example
 * // Register node type in React Flow
 * const nodeTypes = useMemo(() => ({
 *   break: BreakStatementNode
 * }), []);
 *
 * @example
 * // Basic break statement node
 * const breakNode = {
 *   id: 'break-1',
 *   type: 'break',
 *    {
 *     description: "Exit loop when condition met"
 *   },
 *   position: { x: 200, y: 150 }
 * };
 *
 * @example
 * // Typical usage pattern within a while loop construct:
 * // [WhileNode]
 * //   └─ flow output → [ConditionCheck]
 * //                      ├─ true → [BreakStatementNode]  // Exit loop on condition
 * //                      └─ false → [LoopBodyNodes...] → back to WhileNode
 */
const BreakStatementNode = memo(({ data, selected }: BreakStatementNodeProps) => {
    const description: string =
        (data?.description as string) || "Exits the current loop immediately";

    return (
        <NodeTemplate
            details={{
                color: {
                    background: "bg-purple-400/10",
                    border: "border-purple-400/30",
                    text: "text-purple-400",
                    ring: "ring-purple-400/40",
                },
                icon: CornerDownLeft,
                name: "Break",
                description: description,
                selected,
            }}
            inputs={[
                { id: "execute", label: "Execute", type: LuauType.Flow },
            ]}
            outputs={[]}
        />
    );
});

BreakStatementNode.displayName = "BreakStatementNode";

/**
 * Static method to compute handles for BreakStatementNode
 *
 * Provides handle configuration for the visual scripting system to render
 * connection points without mounting the full component. Break statements
 * require a single Flow-type input handle for control flow sequencing and
 * produce no outputs since they terminate the current flow path.
 *
 * Note: Handle configuration is static and does not vary based on node data.
 * The single input handle accepts Flow-type connections representing the
 * control flow entry point where the break statement executes.
 *
 * @static
 * @param {BreakStatementNodeData} data - Node configuration data (unused - handles are static)
 * @returns {Object} Handle configuration object
 * @returns {Array} returns.inputs - Single Flow-type input handle for control flow entry
 * @returns {Array} returns.outputs - Empty array (break terminates flow, produces no outputs)
 *
 * @example
 * const handles = BreakStatementNode.getHandles();
 * // {
 * //   inputs: [
 * //     { id: "execute", label: "Execute", type: LuauType.Flow }
 * //   ],
 * //   outputs: []
 * // }
 */
(BreakStatementNode as any).getHandles = ( data: BreakStatementNodeData ) => ({
    inputs: [{ id: "execute", label: "Execute", type: LuauType.Flow }],
    outputs: [],
});

export default BreakStatementNode;