"use client";

import React, { memo } from 'react';
import { Handle, Position, NodeProps } from '@xyflow/react';
import NodeTemplate from './Template';
import { Play } from 'lucide-react';
import { cn } from '@/lib/utils';

/**
 * Interface defining the data structure for the StartNode
 */
export interface StartNodeData {
    data: Record<string, any>;
}

/**
 * Props interface for the StartNode component
 */
export type StartNodeProps = NodeProps & StartNodeData;

/**
 * StartNode component represents the starting point of a script flow
 *
 * This specialized node:
 * - Only contains an output handle (no input handles)
 * - Has a distinctive visual appearance to indicate it's the entry point
 * - Includes a play icon to reinforce its "starting" nature
 * - Works seamlessly with React Flow's connection system
 *
 * The node is designed to be the mandatory first node in any script flow,
 * visually distinguishing itself from other node types while maintaining
 * the same interaction patterns.
 *
 * @component
 * @param {StartNodeProps} props - Node properties provided by React Flow
 */
const StartNode = memo(({
    data,
    isConnectable,
    selected,
    dragging
}: StartNodeProps) => {
    return (
        <NodeTemplate details={{
            icon: Play,
            name: "Start",
            description: "Starting point of your script.",
        }}>
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

// Set display name for debugging purposes
StartNode.displayName = 'StartNode';

export default StartNode;