"use client";

import { memo } from "react";
import { NodeProps } from "@xyflow/react";
import NodeTemplate from "./Template";
import { Play } from "lucide-react";
import { LuauType } from "@/types/luau";

/**
 * Data structure for the StartNode component
 *
 * Represents configuration data for the script entry point node.
 * Note: This interface contains a nested `data` property which combines with
 * React Flow's NodeProps.data to create a props.data.data structure.
 * This design quirk is preserved for backward compatibility.
 *
 * @interface
 * @property {Record<string, any>} data - Arbitrary metadata container for node configuration
 *   Typically empty for StartNode as it requires no user-configurable parameters
 */
export interface StartNodeData {
    data: Record<string, any>;
}

/**
 * Props type for StartNode component
 *
 * Extends React Flow's NodeProps with StartNodeData, resulting in a nested
 * data structure (props.data.data). This component serves as the mandatory
 * entry point for script execution flows.
 *
 * @typedef {NodeProps & StartNodeData} StartNodeProps
 */
export type StartNodeProps = NodeProps & StartNodeData;

/**
 * StartNode component represents the mandatory entry point of a Luau script flow
 *
 * This specialized node serves as the execution origin for visual scripts with
 * the following characteristics:
 * - Single Flow-type output handle (no input handles - cannot be preceded by other nodes)
 * - Distinctive visual treatment with play icon (Play) signaling execution start
 * - Fixed position typically at the top/left of the script graph
 * - Zero configuration required (no user-editable parameters)
 * - Mandatory presence in every valid script (enforced by script validation)
 *
 * Execution semantics:
 * - When a script executes, flow originates from this node's output handle
 * - Connected downstream nodes receive execution flow in topological order
 * - Multiple StartNodes in a single script graph are invalid (validation error)
 * - Cannot be deleted if it would leave the script without an entry point
 *
 * Visual identification:
 * - Prominent play icon (▶) reinforcing "start/execute" semantics
 * - Bold typography and visual treatment distinguishing it from regular nodes
 * - Typically positioned at graph origin (0,0) by auto-layout algorithms
 * - Disabled drag/resize handles in some editor implementations (fixed position)
 *
 * Integration constraints:
 * - Must connect to exactly one downstream node in valid scripts
 * - Cannot have incoming connections (input handles array is empty)
 * - Output handle type is Flow (execution control) not data (LuauType.Any)
 *   Note: Component currently renders with LuauType.Any due to legacy implementation;
 *   actual edge validation uses LuauType.Flow via meta configuration
 *
 * Common patterns:
 * - Always the first node created when initializing a new script
 * - Precedes flow control nodes (IfElse, loops) or direct action nodes
 * - Never appears mid-flow - strictly an entry point construct
 * - Paired with EndNode in structured script templates (optional convention)
 *
 * @component
 * @param {StartNodeProps} props - React Flow node properties with nested data structure
 *
 * @example
 * // Automatic creation during script initialization
 * const startNode = {
 *   id: 'start',
 *   type: 'start',
 *   data: { data: {} }, // Nested structure per interface definition
 *   position: { x: 50, y: 50 },
 *   draggable: false,   // Often locked in position
 *   selectable: false   // Often non-selectable to prevent deletion
 * };
 *
 * @example
 * // Typical script structure with StartNode as origin
 * // [StartNode] → [FirstActionNode] → [SecondActionNode] → ...
 * //    (entry)      (receives flow)     (receives flow)
 */
const StartNode = memo(({ data, isConnectable, selected, dragging }: StartNodeProps) => {
    return (
        <NodeTemplate
            details={{
                icon: Play,
                name: "Start",
                description: "Starting point of your script.",
                selected: selected,
            }}
            outputs={[
                {
                    id: "output",
                    type: LuauType.Any,
                },
            ]}
        />
    );
});

StartNode.displayName = "StartNode";

/**
 * Static metadata configuration for StartNode
 *
 * Provides supplementary configuration not expressible through standard props.
 * Critical for edge validation where the actual output type must be LuauType.Flow
 * despite the component rendering with LuauType.Any for legacy reasons.
 *
 * Note: This metadata takes precedence over component prop values during
 * edge validation and type checking operations in the visual scripting system.
 *
 * @static
 * @property {Object} meta.handles - Handle configuration for validation systems
 * @property {Array} meta.handles.inputs - Empty array (no incoming connections allowed)
 * @property {Array} meta.handles.outputs - Single Flow-type output handle for execution origin
 *
 * @example
 * // Edge validation uses meta configuration, not component props:
 * const isValidConnection = validateEdge({
 *   source: someNode,
 *   target: startNode, // Rejected - StartNode has no input handles
 *   sourceHandle: 'output',
 *   targetHandle: 'output' // Rejected - output is not an input handle
 * });
 *
 * const flowEdge = validateEdge({
 *   source: startNode,
 *   target: actionNode,
 *   sourceHandle: 'output', // Accepted - Flow type compatible with Flow input
 *   targetHandle: 'execute'
 * });
 */
(StartNode as any).meta = {
    handles: {
        inputs: [],
        outputs: [{ id: "output", type: LuauType.Flow }],
    },
};

export default StartNode;