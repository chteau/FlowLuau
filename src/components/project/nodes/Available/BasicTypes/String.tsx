"use client";

import React, { memo, useState } from 'react';
import { Handle, Position, NodeProps } from '@xyflow/react';
import NodeTemplate from '../../Template';
import { Type } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Input } from '@/components/ui/input';
import { LuauType } from '@/types/luau';


/**
 * Props interface for StringNode component
 */
export type StringNodeProps = NodeProps;

/**
 * StringNode component represents a string value in Luau
 *
 * This node:
 * - Allows setting and outputting string values
 * - Has an input handle to receive string values from other nodes
 * - Has an output handle to pass the string value to other nodes
 * - Includes an inline editor for direct value manipulation
 *
 * The node is designed for handling text data in script flows,
 * with visual feedback when connected to other nodes.
 *
 * @component
 * @param {StringNodeProps} props - Node properties provided by React Flow
 *
 * @example
 * // Register in node types
 * const nodeTypes = useMemo(() => ({
 *   string: StringNode
 * }), []);
 *
 * @example
 * // Create a string node
 * const stringNode = {
 *   id: 'string-1',
 *   type: 'string',
 *    { value: "Hello World" },
 *   position: { x: 100, y: 200 }
 * };
 */
const StringNode = memo(({
    data,
    isConnectable,
    selected,
    dragging
}: StringNodeProps) => {
    const [nodeValue, setNodeValue] = useState(data.value as string || '');

    return (
        <NodeTemplate details={{
            icon: Type,
            name: "String",
            description: "Represents a sequence of characters.",
            selected
        }}>
            <div className="space-y-2">
                <Input
                    type="text"
                    value={nodeValue}
                    onChange={(e) => setNodeValue(e.target.value)}
                    placeholder="Enter string"
                    className="text-xs h-7"
                    onBlur={() => {
                        // Here you would typically update the node data
                        console.log('String value updated:', nodeValue);
                    }}
                />
                <div className="flex justify-between items-center">
                    <span className="text-xs text-muted-foreground truncate max-w-[70%] font-mono">
                        Preview: {`"${nodeValue}"` || '""'}
                    </span>
                    <div className="flex justify-between items-center w-full">
                        <Handle
                            type="target"
                            id="input"
                            position={Position.Left}
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
                    </div>
                </div>
            </div>
        </NodeTemplate>
    );
});

StringNode.displayName = 'StringNode';

(StringNode as any).meta = {
    handles: {
        inputs: [{ id: 'input', type: LuauType.String }],
        outputs: [{ id: 'output', type: LuauType.String }],
    },
};

export default StringNode;