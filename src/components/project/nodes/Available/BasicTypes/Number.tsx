"use client";
import React, { memo, useState } from 'react';
import { Handle, Position, NodeProps } from '@xyflow/react';
import NodeTemplate from '../../Template';
import { Hash, AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { LuauType } from '@/types/luau';

/**
 * Props interface for the NumberNode component
 */
export type NumberNodeProps = NodeProps;

/**
 * NumberNode component represents a numeric value in Luau
 *
 * This node provides two ways to define numbers:
 * 1. Literal mode: Directly enter a numeric value
 * 2. Expression mode: Enter a Luau expression that evaluates to a number
 *
 * Key features:
 * - Toggle between literal and expression modes
 * - Real-time validation for numeric input
 * - Visual feedback for valid/invalid states
 * - Expression syntax validation for numeric expressions
 * - Consistent styling with other node types
 *
 * The node is designed for handling numeric data in script flows,
 * with proper validation to ensure only valid numbers or expressions are processed.
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
 * // Create a literal number node
 * const numberNode = {
 *   id: 'number-1',
 *   type: 'number',
 *    {
 *     mode: 'literal',
 *     value: 42
 *   },
 *   position: { x: 100, y: 200 }
 * };
 *
 * @example
 * // Create an expression number node
 * const expressionNode = {
 *   id: 'number-expr-1',
 *   type: 'number',
 *    {
 *     mode: 'expression',
 *     expression: '5 + 3 * 2'
 *   },
 *   position: { x: 100, y: 200 }
 * };
 */
const NumberNode = memo(({
    data,
    isConnectable,
    selected,
    dragging
}: NumberNodeProps) => {
    const [mode, setMode] = useState(data.mode || 'literal');
    const [literalValue, setLiteralValue] = useState(data.value?.toString() || '0');
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
     * Handles changes to the literal number input field
     *
     * Validates the input against a numeric pattern
     *
     * @param e - Change event from the input field
     */
    const handleLiteralChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newValue = e.target.value;
        setLiteralValue(newValue);

        const valid =
            newValue === "" ||
            /^\s*(?:[a-zA-Z_]\w*|\d+(?:\.\d+)?)\s*([+\-*/%])\s*(?:[a-zA-Z_]\w*|\d+(?:\.\d+)?)\s*$/.test(newValue);

        setIsValid(valid);
        setError(valid ? "" : "Invalid numeric expression (expected: A <op> B)");
    };

    /**
     * Handles changes to the expression input field
     *
     * Validates the expression against a basic numeric pattern
     *
     * @param e - Change event from the input field
     */
    const handleExpressionChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const expr = e.target.value;
        setExpression(expr);

        // In real implementation, this would validate against Luau grammar
        setIsValid(expr.trim() === '' || /^[0-9+\-*/%(). ]*$/.test(expr));
        setError(isValid ? '' : 'Invalid numeric expression');
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
                icon: mode === 'literal' ? Hash : (isValid ? Hash : AlertTriangle),
                name: "Number",
                description: mode === 'literal' ?
                    "Represents a numeric value." :
                    "Evaluates a numeric expression.",
                selected
            }}
            outputs={[
                {
                    id: "output",
                    label: "Value",
                    type: LuauType.Number
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
                    <div className="space-y-1">
                        <div className="relative">
                            <Input
                                type="text"
                                value={literalValue}
                                onChange={handleLiteralChange}
                                placeholder="0"
                                className={cn(
                                    "text-xs h-7",
                                    !isValid && "border-destructive"
                                )}
                            />
                        </div>
                        <div className="flex justify-between items-center">
                            <span className="text-xs text-muted-foreground truncate font-mono w-full">
                                Preview: {literalValue}
                            </span>
                        </div>
                    </div>
                ) : (
                    <div className="space-y-1">
                        <Input
                            type="text"
                            value={typeof expression === 'string' ? expression : ''}
                            onChange={handleExpressionChange}
                            placeholder='e.g., "5 + 3 * 2"'
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

NumberNode.displayName = 'NumberNode';

/**
 * Generates handle configuration for the NumberNode
 *
 * @param data - Node data containing configuration
 * @returns Object with inputs and outputs arrays for handle configuration
 */
(NumberNode as any).getHandles = (
    ...args: Parameters<typeof NumberNode.prototype.getHandles>
) => ({
    outputs: [
        { id: "output", label: "Value", type: LuauType.Number }
    ]
});

export default NumberNode;