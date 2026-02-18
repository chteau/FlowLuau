"use client";

import { memo } from 'react';
import { NodeProps } from '@xyflow/react';
import NodeTemplate from './Template';
import { Play, Square } from 'lucide-react';
import { LuauType } from '@/types/luau';

/**
 * Interface defining the data structure for the EndNode
 */
export interface EndNodeData {
    data: Record<string, any>;
}

/**
 * Props interface for the EndNode component
 */
export type EndNodeProps = NodeProps & EndNodeData;

/**
 * EndNode component represents the ending point of a script flow
 *
 * ---
 *
 * @component
 * @param {EndNodeProps} props - Node properties provided by React Flow
 */
const EndNode = memo(({
    data,
    isConnectable,
    selected,
    dragging
}: EndNodeProps) => {
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
                    type: LuauType.Any
                }
            ]}
        >
        </NodeTemplate>
    );
});

// Set display name for debugging purposes
EndNode.displayName = 'EndNode';

(EndNode as any).meta = {
    handles: {
        inputs: [{ id: 'input', type: LuauType.Any }],
        outputs: [],
    },
};

export default EndNode;