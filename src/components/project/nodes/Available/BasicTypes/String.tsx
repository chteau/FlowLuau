"use client";
import React, { memo, useState } from 'react';
import { NodeProps } from '@xyflow/react';
import NodeTemplate from '../../Template';
import { Type, AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { LuauType } from '@/types/luau';

/**
 * Props interface for the StringNode component
 */
export type StringNodeProps = NodeProps;

/**
 * StringNode component represents a string value in Luau
 *
 * This node provides two ways to define strings:
 * 1. Literal mode: Directly enter a string value
 * 2. Expression mode: Enter a Luau expression that evaluates to a string
 *
 * Key features:
 * - Toggle between literal and expression modes
 * - Visual validation for expression syntax
 * - Real-time preview of string values
 * - Clear visual feedback for valid/invalid states
 * - Consistent styling with other node types
 *
 * The node is designed for handling text data in script flows,
 * with a balance between usability and flexibility for different use cases.
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
 * // Create a literal string node
 * const stringNode = {
 *   id: 'string-1',
 *   type: 'string',
 *    {
 *     mode: 'literal',
 *     value: 'Hello World'
 *   },
 *   position: { x: 100, y: 200 }
 * };
 *
 * @example
 * // Create an expression string node
 * const expressionNode = {
 *   id: 'string-expr-1',
 *   type: 'string',
 *    {
 *     mode: 'expression',
 *     expression: '"Hello " .. playerName'
 *   },
 *   position: { x: 100, y: 200 }
 * };
 */
const StringNode = memo(({
    data,
    isConnectable,
    selected,
    dragging
}: StringNodeProps) => {
    const [mode, setMode] = useState(data.mode || 'literal');
    const [literalValue, setLiteralValue] = useState(data.value as string || '');
    const [expression, setExpression] = useState(data.expression || '');
    const [isValid, setIsValid] = useState(true);
    const [error, setError] = useState('');

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

        const valid =
            expr.trim() === "" ||
            /^\s*(?:"[^"]*"|'[^']*'|[a-zA-Z_]\w*)\s*\.\.\s*(?:"[^"]*"|'[^']*'|[a-zA-Z_]\w*)\s*$/.test(expr);

        setIsValid(valid);
        setError(valid ? "" : 'Invalid string expression (expected: A .. B)');

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
                icon: mode === 'literal' ? Type : (isValid ? Type : AlertTriangle),
                name: "String",
                description: mode === 'literal' ?
                    "Represents a sequence of characters." :
                    "Evaluates a string expression.",
                selected
            }}
            outputs={[
                {
                    id: "output",
                    label: "Value",
                    type: LuauType.String
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
                        <Input
                            type="text"
                            value={literalValue}
                            onChange={(e) => setLiteralValue(e.target.value)}
                            placeholder="Enter string"
                            className="text-xs h-7"
                        />
                        <div className="flex justify-between items-center">
                            <span className="text-xs text-muted-foreground truncate w-full font-mono">
                                Preview: "{literalValue || ''}"
                            </span>
                        </div>
                    </>
                ) : (
                    <div className="space-y-1">
                        <Input
                            type="text"
                            value={typeof expression === 'string' ? expression : ''}
                            onChange={handleExpressionChange}
                            placeholder='e.g., "Hello " .. playerName'
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

StringNode.displayName = 'StringNode';

/**
 * Generates handle configuration for the StringNode
 *
 * @param data - Node data containing configuration
 * @returns Object with inputs and outputs arrays for handle configuration
 */
(StringNode as any).getHandles = (
    ...args: Parameters<typeof StringNode.prototype.getHandles>
) => ({
    outputs: [
        { id: "output", label: "Value", type: LuauType.String }
    ]
});

export default StringNode;