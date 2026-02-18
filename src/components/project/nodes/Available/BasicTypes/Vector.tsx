"use client";

import React, { memo, useState, useEffect } from 'react';
import { Handle, Position, NodeProps } from '@xyflow/react';
import NodeTemplate from '../../Template';
import { Move3d, SquareFunction } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Input } from '@/components/ui/input';
import { LuauType } from '@/types/luau';

/**
 * Interface defining data for VectorNode
 * Typically represents Vector3 in Roblox (X, Y, Z)
 */
export interface VectorNodeData {
    /** X coordinate */
    x?: number;
    /** Y coordinate */
    y?: number;
    /** Z coordinate */
    z?: number;
}

/**
 * Props interface for VectorNode component
 */
export type VectorNodeProps = NodeProps & VectorNodeData;

/**
 * VectorNode component represents a Vector3 value in Luau (Roblox)
 *
 * This node:
 * - Allows setting X, Y, and Z coordinates
 * - Has individual input handles for each coordinate
 * - Has a combined output handle for the complete vector
 * - Provides visual feedback for coordinate values
 *
 * The node is specifically designed for Roblox development where Vector3
 * is a common data type for positions, directions, and velocities.
 *
 * @component
 * @param {VectorNodeProps} props - Node properties provided by React Flow
 *
 * @example
 * // Register in node types
 * const nodeTypes = useMemo(() => ({
 *   vector: VectorNode
 * }), []);
 *
 * @example
 * // Create a vector node
 * const vectorNode = {
 *   id: 'vector-1',
 *   type: 'vector',
 *    { x: 0, y: 10, z: 0 },
 *   position: { x: 100, y: 200 }
 * };
 */
const VectorNode = memo(({
    data,
    isConnectable,
    selected,
    dragging
}: VectorNodeProps) => {
    const [x, setX] = useState<string>(data.x?.toString() || '0');
    const [y, setY] = useState<string>(data.y?.toString() || '0');
    const [z, setZ] = useState<string>(data.z?.toString() || '0');

    useEffect(() => {
        if (data.x !== undefined) setX(data.x!.toString());
        if (data.y !== undefined) setY(data.y!.toString());
        if (data.z !== undefined) setZ(data.z!.toString());
    }, [data.x, data.y, data.z]);

    const formatValue = (value: string) => {
        const num = parseFloat(value);
        return isNaN(num) ? '0' : num.toFixed(2);
    };

    return (
        <NodeTemplate details={{
            icon: Move3d,
            name: "Vector",
            description: "Represents a 3D vector (X, Y, Z).",
            selected
        }}>
            <div className="space-y-2">
                <div className="grid grid-cols-3 gap-1">
                    {['x', 'y', 'z'].map((axis, index) => (
                        <div key={axis} className="space-y-1">
                            <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                <div className={cn(
                                    "size-2 rounded-full",
                                    axis === 'x' && "bg-red-500",
                                    axis === 'y' && "bg-green-500",
                                    axis === 'z' && "bg-blue-500"
                                )} />
                                {axis.toUpperCase()}
                            </div>
                            <Input
                                type="text"
                                value={axis === 'x' ? x : axis === 'y' ? y : z}
                                onChange={(e) => {
                                    const val = e.target.value;
                                    if (axis === 'x') setX(val);
                                    if (axis === 'y') setY(val);
                                    if (axis === 'z') setZ(val);
                                }}
                                onBlur={() => {
                                    // Format on blur
                                    const formattedX = formatValue(x);
                                    const formattedY = formatValue(y);
                                    const formattedZ = formatValue(z);

                                    setX(formattedX);
                                    setY(formattedY);
                                    setZ(formattedZ);

                                    // Here you would typically update the node data
                                    console.log('Vector updated:', {
                                        x: parseFloat(formattedX),
                                        y: parseFloat(formattedY),
                                        z: parseFloat(formattedZ)
                                    });
                                }}
                                placeholder="0"
                                className="text-xs h-7"
                            />
                        </div>
                    ))}
                </div>

                <div className="flex justify-between items-center pt-1">
                    <span className="text-xs text-muted-foreground font-mono">
                        Preview: {`[${formatValue(x)}, ${formatValue(y)}, ${formatValue(z)}]`}
                    </span>
                    <div className="flex gap-1">
                        <Handle
                            type="target"
                            id="x-input"
                            position={Position.Left}
                            isConnectable={isConnectable}
                            style={{
                                background: "none",
                                border: "none",
                                width: 15,
                                height: 15,
                                top: '25%',
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
                            type="target"
                            id="y-input"
                            position={Position.Left}
                            isConnectable={isConnectable}
                            style={{
                                background: "none",
                                border: "none",
                                width: 15,
                                height: 15,
                                top: '50%',
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
                            type="target"
                            id="z-input"
                            position={Position.Left}
                            isConnectable={isConnectable}
                            style={{
                                background: "none",
                                border: "none",
                                width: 15,
                                height: 15,
                                top: '75%',
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

VectorNode.displayName = 'VectorNode';

(VectorNode as any).meta = {
    handles: {
        inputs: [
            { id: 'x-input', type: LuauType.Number },
            { id: 'y-input', type: LuauType.Number },
            { id: 'z-input', type: LuauType.Number },
        ],
        outputs: [{ id: 'output', type: LuauType.Vector }],
    },
};

export default VectorNode;