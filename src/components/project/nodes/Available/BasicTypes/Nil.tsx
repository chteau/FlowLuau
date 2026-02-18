"use client";

import { memo } from "react";
import { NodeProps } from "@xyflow/react";
import NodeTemplate from "../../Template";
import { Slash } from "lucide-react";
import { LuauType } from "@/types/luau";

/**
 * Data structure for the NilNode component
 *
 * Represents Luau's nil value (equivalent to null/undefined in other languages).
 * The value property is optional metadata and always semantically represents nil.
 *
 * @interface
 * @property {null} [value] - Optional metadata field (semantically always nil)
 */
export interface NilNodeData {
    value?: null;
}

/**
 * Props type for NilNode component
 *
 * Extends React Flow's NodeProps with optional NilNodeData properties
 * to support nil value representation within the visual scripting interface.
 *
 * @typedef {NodeProps & Partial<NilNodeData>} NilNodeProps
 */
export type NilNodeProps = NodeProps & Partial<NilNodeData>;

/**
 * NilNode component represents Luau's nil value in visual scripts
 *
 * Nil is Luau's representation of "no value" or "absence of value", equivalent to
 * null/undefined in other languages. This node provides a constant nil output
 * for use in script flows where explicit absence of data is required.
 *
 * Features:
 * - Single nil-typed output handle for downstream connections
 * - Distinctive visual representation with slash icon (/) symbolizing absence
 * - Consistent amber color scheme matching other primitive type nodes
 * - Compact, readable display showing "nil" literal in monospace font
 * - Zero configuration required (pure constant value node)
 *
 * Common use cases:
 * - Providing default nil values for optional parameters
 * - Resetting variables to nil state
 * - Representing uninitialized or cleared values
 * - Conditional branching where nil represents a terminal state
 * - Table key removal operations (setting to nil removes the key)
 *
 * Note: In Luau, nil has special semantics:
 * - Setting a table field to nil removes the field entirely
 * - Function parameters not provided default to nil
 * - nil is falsy in boolean contexts but distinct from false
 *
 * @component
 * @param {NilNodeProps} props - React Flow node properties
 *
 * @example
 * // Register node type in React Flow
 * const nodeTypes = useMemo(() => ({
 *   nil: NilNode
 * }), []);
 *
 * @example
 * // Basic nil node creation
 * const nilNode = {
 *   id: 'nil-1',
 *   type: 'nil',
 *    { value: null },
 *   position: { x: 100, y: 200 }
 * };
 *
 * @example
 * // Common use case: Resetting a variable to nil
 * // Connect NilNode output to a SetVariable node's value input
 * const resetNode = {
 *   id: 'reset-var',
 *   type: 'setVariable',
 *    {
 *     variableName: 'playerData',
 *     // Input 'value' connected from NilNode output
 *   },
 *   position: { x: 300, y: 200 }
 * };
 */
const NilNode = memo(
    ({ data, isConnectable, selected, dragging }: NilNodeProps) => {
        return (
            <NodeTemplate
                details={{
                    color: {
                        background: "bg-amber-400/10",
                        border: "border-amber-400/30",
                        text: "text-amber-400",
                        ring: "ring-amber-400/40",
                    },
                    icon: Slash,
                    name: "Nil",
                    description: "Represents the absence of a value.",
                    selected,
                }}
                outputs={[
                    {
                        id: "output",
                        label: "Value",
                        type: LuauType.Nil,
                    },
                ]}
            >
                <div className="flex justify-center py-2">
                    <span className="text-xs bg-muted px-2 py-0.5 rounded text-muted-foreground font-mono">
                        nil
                    </span>
                </div>
            </NodeTemplate>
        );
    }
);

NilNode.displayName = "NilNode";

/**
 * Static method to compute output handles for NilNode
 *
 * Provides handle configuration for the visual scripting system to render
 * connection points without mounting the full component. Nil nodes expose
 * a single nil-typed output handle representing the constant nil value.
 *
 * Note: This implementation returns static handle configuration as nil nodes
 * have no configurable inputs or mode variations. The output handle is always
 * present regardless of node data state.
 *
 * @static
 * @returns {Object} Handle configuration object
 * @returns {Array} returns.outputs - Single nil-typed output handle
 *
 * @example
 * const handles = NilNode.getHandles();
 * // {
 * //   outputs: [
 * //     { id: "output", label: "Value", type: LuauType.Nil }
 * //   ]
 * // }
 */
(NilNode as any).getHandles = (
    ...args: Parameters<typeof NilNode.prototype.getHandles>
) => ({
    outputs: [{ id: "output", label: "Value", type: LuauType.Nil }],
});

export default NilNode;