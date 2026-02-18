"use client";

import React, { memo } from 'react';
import { Handle, Position, NodeProps } from '@xyflow/react';
import NodeTemplate from '../../Template';
import { Slash } from 'lucide-react';
import { cn } from '@/lib/utils';
import { LuauType } from '@/types/luau';

/**
 * Interface defining data for NilNode
 */
export interface NilNodeData {
    /** Optional custom value (always nil, but can be used for metadata) */
    value?: null;
}

/**
 * Props interface for NilNode component
 */
export type NilNodeProps = NodeProps & Partial<NilNodeData>;

/**
 * NilNode component represents the nil value in Luau
 *
 * This node:
 * - Outputs the nil value (Luau's equivalent of null/undefined)
 * - Has a distinctive visual appearance with slash icon
 * - Provides a single output handle for connecting to other nodes
 * - Works seamlessly with React Flow's connection system
 *
 * The node is designed to be used when explicitly needing a nil value
 * in script flows, such as default values or intentional absence of data.
 *
 * @component
 * @param {NilNodeProps} props - Node properties provided by React Flow
 *
 * @example
 * // Register in node types
 * const nodeTypes = useMemo(() => ({
 *   nil: NilNode
 * }), []);
 *
 * @example
 * // Create a nil node
 * const nilNode = {
 *   id: 'nil-1',
 *   type: 'nil',
 *    { value: null },
 *   position: { x: 100, y: 200 }
 * };
 */
const NilNode = memo(({
    data,
    isConnectable,
    selected,
    dragging
}: NilNodeProps) => {
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
                }
            ]}
        >
            <div className="flex justify-center py-2">
                <span className="text-xs bg-muted px-2 py-0.5 rounded text-muted-foreground font-mono">
                    nil
                </span>
            </div>
        </NodeTemplate>
    );
});

NilNode.displayName = 'NilNode';

/**
 * Generates handle configuration for the NilNode
 *
 * @param data - Node data containing configuration
 * @returns Object with inputs and outputs arrays for handle configuration
 */
(NilNode as any).getHandles = (
    ...args: Parameters<typeof NilNode.prototype.getHandles>
) => ({
    outputs: [
        { id: "output", label: "Value", type: LuauType.Nil }
    ]
});

export default NilNode;