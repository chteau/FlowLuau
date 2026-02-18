"use client";

import React, { memo, useState } from 'react';
import { Handle, Position, NodeProps } from '@xyflow/react';
import NodeTemplate from '../../Template';
import { ToggleLeft, ToggleRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { LuauType } from '@/types/luau';

/**
 * Props interface for BooleanNode component
 */
export type BooleanNodeProps = NodeProps;

/**
 * BooleanNode component represents a boolean value in Luau
 *
 * This node:
 * - Allows toggling between true and false values
 * - Has input and output handles for connecting to other nodes
 * - Provides a visual toggle button for direct manipulation
 * - Shows the current boolean state clearly
 *
 * The node is designed for handling true/false conditions in script flows,
 * with intuitive visual representation of the current state.
 *
 * @component
 * @param {BooleanNodeProps} props - Node properties provided by React Flow
 *
 * @example
 * // Register in node types
 * const nodeTypes = useMemo(() => ({
 *   boolean: BooleanNode
 * }), []);
 *
 * @example
 * // Create a boolean node
 * const booleanNode = {
 *   id: 'boolean-1',
 *   type: 'boolean',
 *    { value: true },
 *   position: { x: 100, y: 200 }
 * };
 */
const BooleanNode = memo(({
    data,
    isConnectable,
    selected,
    dragging
}: BooleanNodeProps) => {
    const [value, setValue] = useState(data.value ?? true);

    const toggleValue = () => {
        const newValue = !value;
        setValue(newValue);
        // Here you would typically update the node data
        console.log('Boolean value toggled:', newValue);
    };

    return (
        <NodeTemplate details={{
            icon: value ? ToggleRight : ToggleLeft,
            name: "Boolean",
            description: "Represents a true/false value.",
            selected
        }}>
            <div className="space-y-2">
                <Button
                    variant={value ? "default" : "outline"}
                    size="sm"
                    className={cn(
                        "w-full h-7 text-xs",
                        value ? "bg-primary hover:bg-primary/90" : "text-muted-foreground"
                    )}
                    onClick={toggleValue}
                >
                    {value ? "TRUE" : "FALSE"}
                </Button>
                <div className="flex justify-between items-center">
                    <div className="flex items-center gap-1.5">
                        {value ? (
                            <ToggleRight className="size-3 text-primary" />
                        ) : (
                            <ToggleLeft className="size-3 text-muted-foreground" />
                        )}
                        <span className="text-xs text-muted-foreground font-mono">
                            {value ? "true" : "false"}
                        </span>
                    </div>
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

BooleanNode.displayName = 'BooleanNode';

(BooleanNode as any).meta = {
    handles: {
        inputs: [{ id: 'input', type: LuauType.Boolean }],
        outputs: [{ id: 'output', type: LuauType.Boolean }],
    },
};

export default BooleanNode;