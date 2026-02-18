"use client";

import React, { memo, useState } from 'react';
import { Handle, Position, NodeProps } from '@xyflow/react';
import NodeTemplate from '../../Template';
import { Hash } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Input } from '@/components/ui/input';
import { LuauType } from '@/types/luau';

/**
 * Props interface for NumberNode component
 */
export type NumberNodeProps = NodeProps;

/**
 * NumberNode component represents a numeric value in Luau
 *
 * This node:
 * - Allows setting and outputting numeric values
 * - Has input and output handles for connecting to other nodes
 * - Includes an inline number editor with validation
 * - Provides visual feedback for valid/invalid inputs
 *
 * The node is designed for handling numeric data in script flows,
 * with proper validation to ensure only valid numbers are processed.
 *
 * @component
 * @param {NumberNodeProps} props - Node properties provided by React Flow
 *
 * @example
 * // Register in node types
 * const nodeTypes = useMemo(() => ({
 *   number: NumberNode
 * }), []);
 *
 * @example
 * // Create a number node
 * const numberNode = {
 *   id: 'number-1',
 *   type: 'number',
 *    { value: 42 },
 *   position: { x: 100, y: 200 }
 * };
 */
const NumberNode = memo(({
    data,
    isConnectable,
    selected,
    dragging
}: NumberNodeProps) => {
    const [value, setValue] = useState<string>(data.value?.toString() || '0');
    const [isValid, setIsValid] = useState(true);

    const handleBlur = () => {
        const num = parseFloat(value);
        if (!isNaN(num)) {
            // Here you would typically update the node data
            console.log('Number value updated:', num);
        } else {
            setValue(data.value?.toString() || '0');
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newValue = e.target.value;
        setValue(newValue);

        if (newValue === '' || /^-?\d*\.?\d*$/.test(newValue)) {
            setIsValid(true);
        } else {
            setIsValid(false);
        }
    };

    return (
        <NodeTemplate details={{
            icon: Hash,
            name: "Number",
            description: "Represents a numeric value.",
            selected
        }}>
            <div className="space-y-2">
                <div className="relative">
                    <Input
                        type="text"
                        value={value}
                        onChange={handleChange}
                        onBlur={handleBlur}
                        placeholder="0"
                        className={cn(
                            "text-xs h-7",
                            !isValid && "border-destructive"
                        )}
                    />
                    {!isValid && (
                        <div className="-bottom-5 left-0 text-[8px] text-destructive">
                            Invalid number format
                        </div>
                    )}
                </div>
                <div className="flex justify-between items-center">
                    <span className="text-xs text-muted-foreground truncate max-w-[70%] font-mono">
                        Preview: {value}
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

NumberNode.displayName = 'NumberNode';

(NumberNode as any).meta = {
    handles: {
        inputs: [{ id: 'input', type: LuauType.Number }],
        outputs: [{ id: 'output', type: LuauType.Number }],
    },
};

export default NumberNode;