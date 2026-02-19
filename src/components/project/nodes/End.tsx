"use client";

import { memo } from "react";
import { NodeProps } from "@xyflow/react";
import NodeTemplate from "./Template";
import { Play, Square } from "lucide-react";
import { LuauType } from "@/types/luau";

/**
 * Data structure for the EndNode component
 *
 * Represents configuration data for the script termination point node.
 * Note: This interface contains a nested `data` property which combines with
 * React Flow's NodeProps.data to create a props.data.data structure.
 * This design quirk is preserved for backward compatibility.
 *
 * @interface
 * @property {Record<string, any>} data - Arbitrary metadata container for node configuration
 *   Typically empty for EndNode as it requires no user-configurable parameters
 */
export interface EndNodeData {
    data: Record<string, any>;
}

/**
 * Props type for EndNode component
 *
 * Extends React Flow's NodeProps with EndNodeData, resulting in a nested
 * data structure (props.data.data). This component serves as an optional
 * termination point for script execution flows.
 *
 * @typedef {NodeProps & EndNodeData} EndNodeProps
 */
export type EndNodeProps = NodeProps & EndNodeData;

/**
 * EndNode component represents an optional termination point in a Luau script flow
 *
 * This specialized node serves as a visual marker for script completion with the
 * following characteristics:
 * - Single input handle accepting execution flow (semantically LuauType.Flow)
 * - No output handles (terminates the current execution path)
 * - Distinctive square icon (■) signaling termination/completion semantics
 * - Zero configuration required (no user-editable parameters)
 * - Optional presence in scripts (unlike StartNode which is mandatory)
 *
 * Execution semantics:
 * - Receives execution flow via its input handle when upstream nodes complete
 * - Absorbs the flow without propagating it further (flow terminates at this node)
 * - Multiple EndNodes can exist in a single script (e.g., for different exit paths)
 * - Not strictly required - scripts can terminate naturally when no further
 *   executable nodes remain in the flow path
 *
 * Visual identification:
 * - Square icon (■) contrasting with StartNode's play icon (▶)
 * - Minimal visual treatment emphasizing its role as a sink/terminator
 * - Typically positioned at the bottom/right of script graphs
 * - Often used in educational contexts to explicitly mark script boundaries
 *
 * Type semantics note:
 * - Component currently declares input handle as LuauType.Any for historical reasons
 * - Semantically should accept LuauType.Flow (execution control) not data values
 * - Actual edge validation may enforce Flow-type connections via meta configuration
 * - Does not process or transform data - purely a flow termination marker
 *
 * Usage patterns:
 * - Optional explicit termination point after final operations
 * - Multiple exit points in complex scripts (success/failure paths)
 * - Visual bookend paired with StartNode for pedagogical clarity
 * - Not required for functional scripts - flow naturally terminates at leaf nodes
 *
 * Comparison with related constructs:
 * - StartNode: Mandatory entry point (single instance, output-only)
 * - ReturnStatementNode: Terminates function scope with optional return value
 * - BreakStatementNode: Terminates only loop scope, not entire script
 *
 * @component
 * @param {EndNodeProps} props - React Flow node properties with nested data structure
 *
 * @example
 * // Optional explicit termination in script flow
 * // [StartNode] → [ActionNode] → [EndNode]
 * //    (entry)      (processing)    (termination)
 *
 * @example
 * // Multiple exit paths with separate EndNodes
 * // [StartNode] → [ConditionNode]
 * //                 ├─ true → [SuccessAction] → [EndNode "Success"]
 * //                 └─ false → [FailureAction] → [EndNode "Failure"]
 */
const EndNode = memo(({ data, isConnectable, selected, dragging }: EndNodeProps) => {
    return (
        <NodeTemplate
            details={{
                icon: Square,
                name: "End",
                description: "Ending point.",
                selected: selected,
            }}
            inputs={[
                {
                    id: "input",
                    type: LuauType.Any,
                },
            ]}
        />
    );
});

EndNode.displayName = "EndNode";

/**
 * Static metadata configuration for EndNode
 *
 * Provides supplementary configuration for systems requiring explicit handle typing.
 * Note: Input handle is declared as LuauType.Any here, though semantically it should
 * accept LuauType.Flow for execution control. This discrepancy exists for historical
 * compatibility reasons and may be resolved in future versions.
 *
 * Purpose of meta configuration:
 * - Edge validation systems may reference this instead of component props
 * - Enables type-aware connection validation in visual scripting tools
 * - Supports editor features like connection highlighting and error detection
 *
 * Current limitation:
 * - Using LuauType.Any allows connections from any output type
 * - Ideal implementation would restrict to LuauType.Flow inputs only
 * - Validation may occur at script compilation time rather than connection time
 *
 * @static
 * @property {Object} meta.handles - Handle configuration for validation systems
 * @property {Array} meta.handles.inputs - Single input handle (accepts any type currently)
 * @property {Array} meta.handles.outputs - Empty array (no outgoing connections)
 *
 * @example
 * // Current permissive connection behavior
 * const validConnection = validateEdge({
 *   source: anyNodeWithAnyOutput,
 *   target: endNode,
 *   sourceHandle: 'anyOutput',
 *   targetHandle: 'input' // Accepted due to LuauType.Any typing
 * });
 *
 * // Ideal future behavior (not currently enforced)
 * // Only Flow-type outputs would connect to EndNode input
 */
(EndNode as any).meta = {
    handles: {
        inputs: [{ id: "input", type: LuauType.Any }],
        outputs: [],
    },
};

export default EndNode;