"use client";
import React, { memo, useState } from 'react';
import { Handle, Position, NodeProps } from '@xyflow/react';
import NodeTemplate from '../../Template';
import { ToggleLeft, ToggleRight, Type, AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { LuauType } from '@/types/luau';
import { Input } from '@/components/ui/input';

/**
 * Props interface for the BooleanNode component
 */
export type BooleanNodeProps = NodeProps;

/**
 * BooleanNode component represents a boolean value in Luau
 *
 * This node provides two ways to define boolean values:
 * 1. Literal mode: Toggle between true and false values directly
 * 2. Expression mode: Enter a Luau expression that evaluates to a boolean
 *
 * Key features:
 * - Toggle between literal and expression modes
 * - Visual toggle button for direct manipulation in literal mode
 * - Expression validation with visual feedback
 * - Clear representation of current boolean state
 * - Consistent styling with other node types
 *
 * The node is designed for handling true/false conditions in script flows,
 * with intuitive visual representation of the current state and validation.
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
 * // Create a literal boolean node
 * const booleanNode = {
 *   id: 'boolean-1',
 *   type: 'boolean',
 *    {
 *     mode: 'literal',
 *     value: true
 *   },
 *   position: { x: 100, y: 200 }
 * };
 *
 * @example
 * // Create an expression boolean node
 * const expressionNode = {
 *   id: 'boolean-expr-1',
 *   type: 'boolean',
 *    {
 *     mode: 'expression',
 *     expression: 'x > 5 and y < 10'
 *   },
 *   position: { x: 100, y: 200 }
 * };
 */
const BooleanNode = memo(({
    data,
    isConnectable,
    selected,
    dragging
}: BooleanNodeProps) => {
    const [mode, setMode] = useState(data.mode || 'literal');
    const [literalValue, setLiteralValue] = useState(data.value ?? true);
    const [expression, setExpression] = useState<string>(String(data.expression ?? ''));
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
     * Toggles the boolean value in literal mode
     */
    const handleLiteralToggle = () => {
        const newValue = !literalValue;
        setLiteralValue(newValue);
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
            /^\s*(?:[a-zA-Z_]\w*|\d+(?:\.\d+)?)\s*(==|~=|>=|<=|>|<)\s*(?:[a-zA-Z_]\w*|\d+(?:\.\d+)?)\s*$/.test(expr);

        setIsValid(valid);
        setError(valid ? "" : "Invalid boolean expression (expected: A <op> B)");
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
                icon: ToggleRight,
                name: "Boolean",
                description: mode === 'literal' ?
                    "Represents a true/false value." :
                    "Evaluates a boolean expression.",
                selected
            }}
            outputs={[
                {
                    id: "output",
                    label: "Value",
                    type: LuauType.Boolean
                }
            ]}
        >
            <div className="space-y-2 mb-4">
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
                    <Button
                        variant={literalValue ? "default" : "outline"}
                        size="sm"
                        className={cn(
                            "w-full h-7 text-xs cursor-pointer",
                            literalValue ? "bg-amber-400/40 hover:bg-amber-400/50" : "text-muted-foreground"
                        )}
                        onClick={handleLiteralToggle}
                    >
                        {literalValue ? "TRUE" : "FALSE"}
                    </Button>
                ) : (
                    <div className="space-y-1">
                        <Input
                            type="text"
                            value={expression}
                            onChange={handleExpressionChange}
                            placeholder='e.g., "x > 5 and y < 10"'
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

BooleanNode.displayName = 'BooleanNode';

/**
 * Generates handle configuration for the BooleanNode
 *
 * @param data - Node data containing configuration
 * @returns Object with inputs and outputs arrays for handle configuration
 */
(BooleanNode as any).getHandles = (
    ...args: Parameters<typeof BooleanNode.prototype.getHandles>
) => ({
    outputs: [
        { id: "output", label: "Value", type: LuauType.Boolean }
    ]
});

export default BooleanNode;