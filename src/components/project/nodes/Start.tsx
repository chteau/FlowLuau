"use client";

import { memo } from 'react';
import { NodeProps } from '@xyflow/react';
import NodeTemplate from './Template';
import { Play } from 'lucide-react';
import { LuauType } from '@/types/luau';

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
                    type: LuauType.Any
                }
            ]}
        >
        </NodeTemplate>
    );
});

// Set display name for debugging purposes
StartNode.displayName = 'StartNode';

(StartNode as any).meta = {
    handles: {
        inputs: [],
        outputs: [{ id: 'output', type: LuauType.Flow }],
    },
};

export default StartNode;