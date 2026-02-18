"use client";
import React, { memo, useState, useEffect } from 'react';
import { NodeProps } from '@xyflow/react';
import NodeTemplate from '../../Template';
import { Table, AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { LuauType } from '@/types/luau';

/**
 * Interface representing a single key-value entry in a table
 */
interface TableEntry {
    /** Key for the table entry */
    key: string;
    /** Value for the table entry (can be string, number, or boolean) */
    value: string | number | boolean;
}

/**
 * Data structure for the TableNode component
 *
 * The node supports two modes:
 * - 'literal': Manually defined key-value pairs
 * - 'expression': Table defined by a Luau expression
 */
export interface TableNodeData {
    /** Current mode of the table node */
    mode?: 'literal' | 'expression';
    /** Expression string when in expression mode */
    expression?: string;
    /** Array of key-value entries when in literal mode */
    entries?: TableEntry[];
}

/**
 * Props interface for the TableNode component
 */
export type TableNodeProps = NodeProps & Partial<TableNodeData>;

/**
 * TableNode component represents a table (dictionary) in Luau
 *
 * This node provides two ways to define tables:
 * 1. Literal mode: Manually enter key-value pairs in a structured format
 * 2. Expression mode: Enter a Luau expression that evaluates to a table
 *
 * Key features:
 * - Toggle between literal and expression modes
 * - Visual validation for expression syntax
 * - Dynamic entry management in literal mode
 * - Clear visual feedback for valid/invalid states
 * - Consistent styling with other node types
 *
 * The node is designed for handling complex data structures in script flows,
 * with a balance between usability and information density for different use cases.
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
 * // Create a literal table node
 * const tableNode = {
 *   id: 'table-1',
 *   type: 'table',
 *    {
 *     mode: 'literal',
 *     entries: [
 *       { key: 'name', value: 'John' },
 *       { key: 'age', value: 30 }
 *     ]
 *   },
 *   position: { x: 100, y: 200 }
 * };
 *
 * @example
 * // Create an expression table node
 * const expressionNode = {
 *   id: 'table-expr-1',
 *   type: 'table',
 *    {
 *     mode: 'expression',
 *     expression: '{name = playerName, score = 0}'
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
    const [mode, setMode] = useState(data.mode || 'literal');
    const [entries, setEntries] = useState<TableEntry[]>(data.entries as TableEntry[] || [{ key: '', value: '' }]);
    const [expression, setExpression] = useState(data.expression || '');
    const [isValid, setIsValid] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        if (data.entries && mode === 'literal') {
            setEntries(data.entries as TableEntry[]);
        }
        if (data.expression && mode === 'expression') {
            setExpression(data.expression);
        }
    }, [data.entries, data.expression, mode]);

    /**
     * Handles changing between literal and expression modes
     *
     * @param newMode - The new mode to switch to ('literal' or 'expression')
     */
    const handleModeChange = (newMode: string) => {
        setMode(newMode);
    };

    /**
     * Handles changes to the expression input field
     *
     * Validates the expression against a basic pattern
     *
     * @param e - Change event from the input field
     */
    const handleExpressionChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const expr = e.target.value;
        setExpression(expr);

        // In real implementation, this would validate against Luau grammar
        setIsValid(expr.trim() === '' || /^[a-zA-Z0-9_\-+\/*%()={}:,.'"\[\] ]*$/.test(expr));
        setError(isValid ? '' : 'Invalid table expression');
    };

    /**
     * Adds a new entry to the table in literal mode
     */
    const addEntry = () => {
        setEntries([...entries, { key: '', value: '' }]);
    };

    /**
     * Removes an entry from the table in literal mode
     *
     * @param index - Index of the entry to remove
     */
    const removeEntry = (index: number) => {
        setEntries(entries.filter((_, i) => i !== index));
    };

    /**
     * Updates a specific field of a table entry
     *
     * @param index - Index of the entry to update
     * @param field - Field to update ('key' or 'value')
     * @param value - New value for the field
     */
    const updateEntry = (index: number, field: 'key' | 'value', value: string | number | boolean) => {
        const newEntries = [...entries];
        newEntries[index] = { ...newEntries[index], [field]: value } as TableEntry;
        setEntries(newEntries);
    };

    return (
        <NodeTemplate
            details={{
                color: {
                    background: "bg-amber-400/10",
                    border: "border-amber-400/30",
                    text: "text-amber-400",
                    ring: "ring-amber-400/40",
                },
                icon: mode === 'literal' ? Table : (isValid ? Table : AlertTriangle),
                name: "Table",
                description: mode === 'literal' ?
                    "Represents a key-value dictionary." :
                    "Evaluates a table expression.",
                selected
            }}
            outputs={[
                {
                    id: "output",
                    label: "Value",
                    type: LuauType.Table
                }
            ]}
        >
            <div className="space-y-2">
                <div className="flex gap-1 mb-2">
                    <Button
                        variant={mode === 'literal' ? "default" : "outline"}
                        size="xs"
                        className="text-xs h-6 cursor-pointer bg-amber-300/10 hover:bg-amber-300/20"
                        onClick={() => handleModeChange('literal')}
                    >
                        Literal
                    </Button>
                    <Button
                        variant={mode === 'expression' ? "default" : "outline"}
                        size="xs"
                        className="text-xs h-6 cursor-pointer bg-amber-300/10 hover:bg-amber-300/20"
                        onClick={() => handleModeChange('expression')}
                    >
                        Expression
                    </Button>
                </div>

                {mode === 'literal' ? (
                    <>
                        {entries.map((entry, index) => (
                            <div key={index} className="flex gap-1 items-center">
                                <Input
                                    type="text"
                                    value={entry.key}
                                    onChange={(e) => updateEntry(index, 'key', e.target.value)}
                                    placeholder="Key"
                                    className="text-xs h-6 flex-1"
                                />
                                <span>=</span>
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
                        <Button
                            variant="outline"
                            size="sm"
                            className="w-full h-7 text-xs cursor-pointer"
                            onClick={addEntry}
                        >
                            + Add Entry
                        </Button>
                        <div className="flex justify-between items-center pt-1">
                            <span className="text-xs text-muted-foreground truncate max-w-[70%]">
                                {entries.length} {entries.length === 1 ? 'entry' : 'entries'}
                            </span>
                        </div>
                    </>
                ) : (
                    <div className="space-y-1">
                        <Input
                            type="text"
                            value={typeof expression === 'string' ? expression : ''}
                            onChange={handleExpressionChange}
                            placeholder='e.g., "{name = playerName, score = 0}"'
                            className={cn(
                                "text-xs h-7",
                                !isValid && "border-destructive"
                            )}
                        />
                        {!isValid && (
                            <div className="text-[8px] text-destructive">
                                {error}
                            </div>
                        )}
                    </div>
                )}
            </div>
        </NodeTemplate>
    );
});

TableNode.displayName = 'TableNode';

/**
 * Generates handle configuration for the TableNode
 *
 * @param data - Node data containing configuration
 * @returns Object with inputs and outputs arrays for handle configuration
 */
interface HandleConfig {
    outputs: Array<{
        id: string;
        label: string;
        type: LuauType;
    }>;
}

interface GetHandlesFunction {
    (data: TableNodeData): HandleConfig;
}

(TableNode as any).getHandles = ((data: TableNodeData): HandleConfig => ({
    outputs: [
        { id: "output", label: "Value", type: LuauType.Table }
    ]
})) as GetHandlesFunction;

export default TableNode;