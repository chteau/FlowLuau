"use client";

import { memo, useState } from "react";
import { NodeProps } from "@xyflow/react";
import NodeTemplate from "../../Template";
import { Equal, EqualNot, ChevronLeft, ChevronRight } from "lucide-react";
import { LuauType } from "@/types/luau";
import {
    Select,
    SelectContent,
    SelectGroup,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";

/**
 * Supported comparison operators for conditional evaluation in Luau
 *
 * Represents the six standard comparison operators available in Luau language:
 * - '==': Equality check (values are equal)
 * - '~=': Inequality check (values are not equal)
 * - '>': Greater than comparison
 * - '<': Less than comparison
 * - '>=': Greater than or equal comparison
 * - '<=': Less than or equal comparison
 *
 * These operators work with numeric, string, and compatible types following
 * Luau's comparison semantics. Type coercion is NOT performed automatically.
 *
 * @typedef {('==' | '~=' | '>' | '<' | '>=' | '<=')} ComparisonType
 */
type ComparisonType = "==" | "~=" | ">" | "<" | ">=" | "<=";

/**
 * Data structure for the ConditionNode component
 *
 * Defines configuration for comparison operations between two values with
 * selectable operator types. Used to generate boolean results for conditional logic.
 *
 * @interface
 * @property {ComparisonType} [comparisonType] - Selected comparison operator
 *   Defaults to '==' (equality) if not specified. Must be one of the six supported operators.
 */
export interface ConditionNodeData {
    comparisonType?: ComparisonType;
}

/**
 * Props type for ConditionNode component
 *
 * Extends React Flow's NodeProps with optional ConditionNodeData properties
 * to support comparison operations within the visual scripting interface.
 *
 * @typedef {NodeProps & Partial<ConditionNodeData>} ConditionNodeProps
 */
export type ConditionNodeProps = NodeProps & Partial<ConditionNodeData>;

/**
 * ConditionNode component performs comparison operations between two values in visual scripts
 *
 * Evaluates a boolean result by comparing two input values (A and B) using a selectable
 * Luau comparison operator. The node outputs the result as a boolean value for use in
 * conditional branching and logical operations.
 *
 * Features:
 * - Six standard Luau comparison operators via dropdown selection
 * - Dynamic icon visualization reflecting the current operator type
 * - Two polymorphic inputs accepting any Luau type (LuauType.Any)
 * - Single boolean output representing the comparison result
 * - Pure data-flow node (no execution flow handles - operates on data only)
 * - Color-coded purple styling for conditional/logic node identification
 * - Operator-aware description text updating in real-time
 *
 * Comparison semantics:
 * - Numeric comparisons follow standard mathematical ordering
 * - String comparisons use lexicographical (dictionary) ordering
 * - Mixed type comparisons (e.g., number vs string) result in runtime errors in Luau
 * - nil comparisons follow Luau rules (nil equals only nil)
 * - Tables/functions are compared by reference identity, not content
 *
 * Common use cases:
 * - Conditional branching decisions (if/else conditions)
 * - Loop termination conditions (while/repeat loops)
 * - Validation checks (input ranges, state verification)
 * - Sorting predicates and ordering logic
 * - State transition guards in finite state machines
 *
 * Integration patterns:
 * - Connect output to BranchNode's condition input for flow control
 * - Chain multiple ConditionNodes with BooleanNode for complex logic (AND/OR)
 * - Use with NumberNode/StringNode literals for constant comparisons
 * - Feed results into other logical operators (not, and, or)
 *
 * @component
 * @param {ConditionNodeProps} props - React Flow node properties
 *
 * @example
 * // Register node type in React Flow
 * const nodeTypes = useMemo(() => ({
 *   condition: ConditionNode
 * }), []);
 *
 * @example
 * // Equality comparison node (default operator)
 * const equalityNode = {
 *   id: 'cond-1',
 *   type: 'condition',
 *    { comparisonType: '==' },
 *   position: { x: 100, y: 200 }
 * };
 *
 * @example
 * // Greater than comparison for threshold check
 * const thresholdNode = {
 *   id: 'cond-2',
 *   type: 'condition',
 *    { comparisonType: '>=' },
 *   position: { x: 100, y: 200 }
 * };
 * // Connect NumberNode (value=100) to input A
 * // Connect PlayerHealthNode output to input B
 * // Output feeds into BranchNode to trigger low-health behavior
 */
const ConditionNode = memo(
    ({ data, isConnectable, selected, dragging }: ConditionNodeProps) => {
        /**
         * Current comparison operator state with type-safe initialization
         *
         * Initializes from node data with validation to ensure only supported
         * operators are accepted. Falls back to equality operator ('==') for
         * invalid or missing values to maintain component stability.
         *
         * @state
         * @type {ComparisonType}
         * @default "==""
         */
        const [comparisonType, setComparisonType] = useState<ComparisonType>(
            typeof data.comparisonType === "string" &&
                ["==", "~=", ">", "<", ">=", "<="].includes(
                    data.comparisonType
                )
                ? (data.comparisonType as ComparisonType)
                : "=="
        );

        /**
         * Determines the appropriate visual icon based on current comparison operator
         *
         * Maps each comparison operator to a semantically meaningful Lucide icon:
         * - Equality operators (==, ~=) → Equal/EqualNot icons
         * - Greater-than operators (>, >=) → ChevronRight icon
         * - Less-than operators (<, <=) → ChevronLeft icon
         *
         * Provides immediate visual feedback about the node's comparison behavior
         * without requiring users to read the operator text.
         *
         * @returns {JSX.Element} Lucide icon component representing the operator semantics
         */
        const getIcon = () => {
            switch (comparisonType) {
                case "==":
                    return Equal;
                case "~=":
                    return EqualNot;
                case ">":
                case ">=":
                    return ChevronRight;
                case "<":
                case "<=":
                    return ChevronLeft;
                default:
                    return Equal;
            }
        };

        const Icon = getIcon();

        return (
            <NodeTemplate
                details={{
                    color: {
                        background: "bg-purple-400/10",
                        border: "border-purple-400/30",
                        text: "text-purple-400",
                        ring: "ring-purple-400/40",
                    },
                    icon: Icon,
                    name: "Condition",
                    description: `Checks if A ${comparisonType} B`,
                    selected,
                }}
                inputs={[
                    {
                        id: "a",
                        label: "A",
                        type: LuauType.Any,
                    },
                    {
                        id: "b",
                        label: "B",
                        type: LuauType.Any,
                    },
                ]}
                outputs={[
                    {
                        id: "result",
                        label: "Result",
                        type: LuauType.Boolean,
                    },
                ]}
            >
                <div className="space-y-2">
                    <Select
                        value={comparisonType}
                        onValueChange={(value: string) =>
                            setComparisonType(value as ComparisonType)
                        }
                    >
                        <SelectTrigger className="w-full">
                            <SelectValue placeholder="Operator" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectGroup>
                                <SelectItem value="==">
                                    Equal (==)
                                </SelectItem>
                                <SelectItem value="~=">
                                    Not Equal (~=)
                                </SelectItem>
                                <SelectItem value=">">
                                    Greater Than (&gt;)
                                </SelectItem>
                                <SelectItem value="<">
                                    Less Than (&lt;)
                                </SelectItem>
                                <SelectItem value=">=">
                                    Greater or Equal (&gt;=)
                                </SelectItem>
                                <SelectItem value="<=">
                                    Less or Equal (&lt;=)
                                </SelectItem>
                            </SelectGroup>
                        </SelectContent>
                    </Select>
                </div>
            </NodeTemplate>
        );
    }
);

ConditionNode.displayName = "ConditionNode";

/**
 * Static method to compute handles for ConditionNode
 *
 * Provides handle configuration for the visual scripting system to render
 * connection points without mounting the full component. Condition nodes
 * expose two polymorphic input handles (A and B) and one boolean output handle.
 *
 * Handle semantics:
 * - Inputs accept any Luau type (LuauType.Any) for maximum flexibility
 * - Output always produces a boolean result (LuauType.Boolean)
 * - No execution flow handles (pure data transformation node)
 *
 * Note: Handle configuration is static and does not vary based on the selected
 * comparison operator. All operators use the same handle structure since they
 * all operate on two inputs and produce one boolean output.
 *
 * @static
 * @param {ConditionNodeData} data - Node configuration data (operator selection)
 * @returns {Object} Handle configuration object
 * @returns {Array} returns.inputs - Two polymorphic input handles (A and B)
 * @returns {Array} returns.outputs - Single boolean output handle
 *
 * @example
 * const handles = ConditionNode.getHandles({ comparisonType: '>=' });
 * // {
 * //   inputs: [
 * //     { id: "a", label: "A", type: LuauType.Any },
 * //     { id: "b", label: "B", type: LuauType.Any }
 * //   ],
 * //   outputs: [
 * //     { id: "result", label: "Result", type: LuauType.Boolean }
 * //   ]
 * // }
 */
interface HandleConfig {
    inputs: Array<{
        id: string;
        label: string;
        type: LuauType;
    }>;
    outputs: Array<{
        id: string;
        label: string;
        type: LuauType;
    }>;
}

interface GetHandlesFunction {
    (data: ConditionNodeData): HandleConfig;
}

(ConditionNode as any).getHandles = (( ConditionNodeData): HandleConfig => ({
    inputs: [
        { id: "a", label: "A", type: LuauType.Any },
        { id: "b", label: "B", type: LuauType.Any },
    ],
    outputs: [{ id: "result", label: "Result", type: LuauType.Boolean }],
})) as GetHandlesFunction;

export default ConditionNode;