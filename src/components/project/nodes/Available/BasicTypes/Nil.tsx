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
export type NilNodeProps = NodeProps & NilNodeData;

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
        <NodeTemplate details={{
            icon: Slash,
            name: "Nil",
            description: "Represents the absence of a value.",
            selected,
        }}>
            <div className="flex justify-center py-2">
                <span className="text-xs bg-muted px-2 py-0.5 rounded text-muted-foreground font-mono">
                    nil
                </span>
            </div>
            <Handle
                type="source"
                id="output"
                position={Position.Right}
                isConnectable={isConnectable}
                style={{
                    background: "none",
                    border: "none",
                    width: 15,
                    height: 15,
                }}
            >
                <div className={cn(
                    "size-full rounded-full bg-primary/20 border-2 border-primary pointer-events-none",
                    "transition-all duration-200",
                    selected && "scale-110 ring-2 ring-primary/50",
                    dragging && "opacity-80"
                )} />
            </Handle>
        </NodeTemplate>
    );
});

NilNode.displayName = 'NilNode';

(NilNode as any).meta = {
    handles: {
        inputs: [],
        outputs: [{ id: 'output', type: LuauType.Nil }],
    },
};

export default NilNode;