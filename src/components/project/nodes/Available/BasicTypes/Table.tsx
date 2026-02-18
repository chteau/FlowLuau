"use client";

import React, { memo, useState, useEffect } from 'react';
import { Handle, Position, NodeProps } from '@xyflow/react';
import NodeTemplate from '../../Template';
import { Table } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { LuauType } from '@/types/luau';

/**
 * Interface defining a table entry
 */
interface TableEntry {
    key: string;
    value: string | number | boolean;
}

/**
 * Interface defining data for TableNode
 */
export interface TableNodeData {
    /** The table entries */
    entries?: TableEntry[];
}

/**
 * Props interface for TableNode component
 */
export type TableNodeProps = NodeProps & TableNodeData;

/**
 * TableNode component represents a table (dictionary) in Luau
 *
 * This node:
 * - Allows creating and editing key-value pairs
 * - Has input and output handles for connecting to other nodes
 * - Provides a compact interface for table manipulation
 * - Shows a summary of the table contents
 *
 * The node is designed for handling complex data structures in script flows,
 * with a balance between usability and information density.
 *
 * @component
 * @param {TableNodeProps} props - Node properties provided by React Flow
 *
 * @example
 * // Register in node types
 * const nodeTypes = useMemo(() => ({
 *   table: TableNode
 * }), []);
 *
 * @example
 * // Create a table node
 * const tableNode = {
 *   id: 'table-1',
 *   type: 'table',
 *    {
 *     entries: [
 *       { key: 'name', value: 'John' },
 *       { key: 'age', value: 30 }
 *     ]
 *   },
 *   position: { x: 100, y: 200 }
 * };
 */
const TableNode = memo(({
    data,
    isConnectable,
    selected,
    dragging
}: TableNodeProps) => {
    const [entries, setEntries] = useState<TableEntry[]>(data.entries as TableEntry[] || [{ key: '', value: '' }]);

    useEffect(() => {
        if (data.entries) {
            setEntries(data.entries as TableEntry[]);
        }
    }, [data.entries]);

    const addEntry = () => {
        setEntries([...entries, { key: '', value: '' }]);
    };

    const removeEntry = (index: number) => {
        setEntries(entries.filter((_, i) => i !== index));
    };

    const updateEntry = (index: number, field: 'key' | 'value', value: string | number | boolean) => {
        const newEntries = [...entries];
        newEntries[index] = { ...newEntries[index], [field]: value } as TableEntry;
        setEntries(newEntries);

        // Here you would typically update the node data
        console.log('Table updated:', newEntries);
    };

    return (
        <NodeTemplate details={{
            icon: Table,
            name: "Table",
            description: "Represents a key-value dictionary.",
            selected
        }}>
            <div className="space-y-2">
                <div className="overflow-y-auto pr-1 space-y-1">
                    {entries.map((entry, index) => (
                        <div key={index} className="flex gap-1 items-center">
                            <Input
                                type="text"
                                value={entry.key}
                                onChange={(e) => updateEntry(index, 'key', e.target.value)}
                                placeholder="Key"
                                className="text-xs h-6 flex-1"
                            />
                            <span className="text-xs">=</span>
                            <Input
                                type="text"
                                value={entry.value ? entry.value.toString() : ''}
                                onChange={(e) => updateEntry(index, 'value', e.target.value)}
                                placeholder="Value"
                                className="text-xs h-6 flex-1"
                            />
                            {entries.length > 1 && (
                                <Button
                                    variant="destructive"
                                    size="icon-xs"
                                    onClick={() => removeEntry(index)}
                                    className="h-6 w-6"
                                >
                                    ×
                                </Button>
                            )}
                        </div>
                    ))}
                </div>
                <Button
                    variant="outline"
                    size="sm"
                    className="w-full h-7 text-xs"
                    onClick={addEntry}
                >
                    + Add Entry
                </Button>

                <div className="flex justify-between items-center pt-1">
                    <span className="text-xs text-muted-foreground truncate max-w-[70%]">
                        {entries.length} {entries.length === 1 ? 'entry' : 'entries'}
                    </span>
                    <div className="flex gap-1">
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

TableNode.displayName = 'TableNode';

(TableNode as any).meta = {
    handles: {
        inputs: [{ id: 'input', type: LuauType.Table }],
        outputs: [{ id: 'output', type: LuauType.Table }],
    },
};

export default TableNode;