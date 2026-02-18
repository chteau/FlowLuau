"use client";
import React, { memo, useCallback } from "react";
import {
    NodeProps,
    useReactFlow,
    useNodeId,
    useStore,
} from "@xyflow/react";
import NodeTemplate from "../../Template";
import { Button } from "@/components/ui/button";
import { Plus, Minus, ChevronDown, ChevronUp } from "lucide-react";
import { LuauType } from "@/types/luau";

/**
 * Represents a single else-if branch in the conditional structure
 */
interface ElseIfBranch {
    /** Unique identifier for the branch */
    id: string;
}

/**
 * Data structure for the IfElseNode component
 */
export interface IfElseNodeData {
    /** Array of else-if branches */
    elseIfBranches: ElseIfBranch[];
    /** Whether to show the else branch */
    showElse: boolean;
    /** Tracks which branches are expanded */
    expandedBranches: Record<string, boolean>;
    /** Optional function to get handle configuration */
    getHandles?: any;
}

/**
 * Props interface for the IfElseNode component
 */
export type IfElseNodeProps = NodeProps & Partial<IfElseNodeData>;

/**
 * Generates a unique ID for new branches
 * @returns A random string ID
 */
const generateId = (): string =>
    Math.random().toString(36).substring(2, 9);

/**
 * IfElseNode component represents a conditional flow structure in Luau
 *
 * This node:
 * - Provides a visual representation of if/else conditional logic
 * - Allows dynamic addition and removal of else-if branches
 * - Supports toggling the visibility of the else branch
 * - Shows connection status for each branch
 * - Has expandable/collapsible branch sections
 *
 * The node is designed for implementing conditional execution flows
 * where boolean conditions determine which path to follow.
 *
 * @component
 * @param {IfElseNodeProps} props - Node properties provided by React Flow
 *
 * @example
 * // Register in node types
 * const nodeTypes = useMemo(() => ({
 *   ifElse: IfElseNode
 * }), []);
 *
 * @example
 * // Create an if/else node
 * const ifElseNode = {
 *   id: 'if-else-1',
 *   type: 'ifElse',
 *    {
 *     elseIfBranches: [{ id: 'branch-1' }],
 *     showElse: true,
 *     expandedBranches: { main: true }
 *   },
 *   position: { x: 100, y: 200 }
 * };
 */
const IfElseNode = memo(
    ({ data, selected }: IfElseNodeProps) => {
        const nodeId = useNodeId();
        const { setNodes, getEdges } = useReactFlow();

        const elseIfBranches: ElseIfBranch[] = Array.isArray(data?.elseIfBranches) ? data.elseIfBranches : [];
        const showElse = data?.showElse ?? true;

        /**
         * Updates node data while preserving existing properties
         *
         * @param partial - Partial data to update
         */
        const updateData = (partial: Partial<IfElseNodeData>) => {
            setNodes((nodes) =>
                nodes.map((n) =>
                    n.id === nodeId
                        ? { ...n, data: { ...n.data, ...partial } }
                        : n
                )
            );
        };

        /**
         * Adds a new else-if branch to the conditional structure
         */
        const addElseIfBranch = useCallback(() => {
            updateData({
                elseIfBranches: [
                    ...elseIfBranches,
                    { id: generateId() },
                ],
            });
        }, [elseIfBranches]);

        /**
         * Removes an else-if branch by ID
         *
         * @param id - ID of the branch to remove
         */
        const removeElseIfBranch = useCallback(
            (id: string) => {
                updateData({
                    elseIfBranches: elseIfBranches.filter(
                        (b) => b.id !== id
                    ),
                });
            },
            [elseIfBranches]
        );

        /**
         * Gets edges connected to this node
         */
        const connectedEdges = useStore((s) =>
            s.edges.filter(
                (e) => e.source === nodeId || e.target === nodeId
            )
        );

        /**
         * Get condition edges to verify if every if / elseif got a linked condition
         */
        const conditionEdges = useStore((s) =>
            s.edges.filter(
                (e) =>
                    e.target === nodeId &&
                    e.targetHandle?.startsWith("condition")
            )
        );

        const mainConditionConnected = conditionEdges.some((e) => e.targetHandle === "condition");
        const elseIfConditionConnected = (index: number) =>
            conditionEdges.some(
                (e) => e.targetHandle === `condition-${index}`
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
                    icon: ChevronDown,
                    name: "If/Else",
                    description:
                        "Conditional execution flow requiring wired boolean conditions",
                    selected,
                }}
                inputs={(IfElseNode as any).getHandles(data).inputs}
                outputs={(IfElseNode as any).getHandles(data).outputs}
            >
                <div className="space-y-3">
                    {/* Main IF Branch */}
                    <div className="border border-border rounded-md p-3 bg-card/5">
                        <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-1 text-xs font-medium">
                                <span className="text-purple-400">IF</span>
                            </div>
                        </div>

                        <div className="w-full">
                            {mainConditionConnected ? (
                                <span className="text-xs text-muted-foreground text-center block">
                                    Connected to a Condition Node.
                                </span>
                            ) : (
                                <span className="text-xs text-destructive text-center block">
                                            Needs a Condition Node.
                                </span>
                            )}
                        </div>
                    </div>

                    {/* ELSE IF Branches */}
                    {elseIfBranches.map((branch: ElseIfBranch, index: number) => {
                        const isConnected = conditionEdges.some(
                            (e) => e.targetHandle === `condition-${index}`
                        );

                        return (
                            <div
                                key={branch.id}
                                className="border border-border rounded-md p-3 bg-card/5"
                            >
                                <div className="flex items-center justify-between mb-2">
                                    <span className="text-xs font-medium text-purple-400">
                                        ELSE IF
                                    </span>
                                    <Button
                                        variant="destructive"
                                        size="icon-xs"
                                        onClick={() =>
                                            removeElseIfBranch(branch.id)
                                        }
                                    >
                                        <Minus className="h-3 w-3" />
                                    </Button>
                                </div>

                                <div className="w-full">
                                    {isConnected ? (
                                        <span className="text-xs text-muted-foreground text-center block">
                                            Connected to a Condition Node.
                                        </span>
                                    ) : (
                                        <span className="text-xs text-destructive text-center block">
                                            Needs a Condition Node.
                                        </span>
                                    )}
                                </div>
                            </div>
                        )
                    })}

                    {/* Add Else If Button */}
                    <Button
                        variant="outline"
                        size="sm"
                        className="w-full h-7 text-xs cursor-pointer"
                        onClick={addElseIfBranch}
                    >
                        <Plus className="h-3 w-3 mr-1" />
                        Add Else If
                    </Button>

                    {/* Else Branch Toggle */}
                    <div className="flex justify-between items-center pt-1">
                        <span className="text-xs text-muted-foreground">
                            Else branch
                        </span>
                        <Button
                            variant={showElse ? "default" : "outline"}
                            size="sm"
                            className="text-xs h-6 px-2 bg-purple-400/10 hover:bg-purple-400/20 cursor-pointer"
                            onClick={() =>
                                updateData({ showElse: !showElse })
                            }
                        >
                            {showElse ? "ON" : "OFF"}
                        </Button>
                    </div>
                </div>
            </NodeTemplate>
        );
    }
);

IfElseNode.displayName = "IfElseNode";

/**
 * Generates dynamic handle configuration based on node data
 *
 * This function determines the input and output handles for the node
 * based on the current configuration (number of else-if branches, etc.)
 *
 * @param data - Node data containing configuration
 * @returns Object with inputs and outputs arrays for handle configuration
 */
(IfElseNode as any).getHandles = (
    data: IfElseNodeData
) => {
    const elseIfBranches = data?.elseIfBranches ?? [];
    const showElse = data?.showElse ?? true;

    return {
        inputs: [
            { id: "execute", label: "Execute", type: LuauType.Flow },
            { id: "condition", label: "Condition", type: LuauType.Boolean },
            ...elseIfBranches.map((_, i) => ({
                id: `condition-${i}`,
                label: `Condition ${i + 1}`,
                type: LuauType.Boolean,
            })),
        ],
        outputs: [
            { id: "then", label: "Then", type: LuauType.Flow },
            ...elseIfBranches.map((_, i) => ({
                id: `elseif-${i}`,
                label: `Else If ${i + 1}`,
                type: LuauType.Flow,
            })),
            ...(showElse
                ? [
                    {
                        id: "else",
                        label: "Else",
                        type: LuauType.Flow,
                    },
                ]
                : []),
        ],
    };
};

export default IfElseNode;