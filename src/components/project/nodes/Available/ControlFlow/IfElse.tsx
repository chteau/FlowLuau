"use client";

import { memo, useCallback } from "react";
import {
    NodeProps,
    useReactFlow,
    useNodeId,
    useStore,
} from "@xyflow/react";
import NodeTemplate from "../../Template";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Minus, ChevronDown, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";
import { LuauType } from "@/types/luau";
import VariableAutocomplete from "@/components/ui/variable-autocomplete";

/**
 * Represents a single conditional branch within an if/else structure
 *
 * Each branch can operate in one of two modes:
 * - "literal": Condition value comes from an external ConditionNode connection
 * - "expression": Condition value comes from an inline Luau boolean expression
 *
 * @interface
 * @property {string} id - Unique identifier for branch management
 * @property {("literal" | "expression")} mode - Source mode for condition evaluation
 * @property {string} [expression] - Inline Luau expression when in expression mode
 */
interface ConditionBranch {
    id: string;
    mode: "literal" | "expression";
    expression?: string;
}

/**
 * Data structure for the IfElseNode component
 *
 * Configures conditional branching logic with dynamic branch management and
 * dual-mode condition evaluation (literal connections or inline expressions).
 *
 * @interface
 * @property {ConditionBranch} mainCondition - Primary IF branch configuration
 * @property {ConditionBranch[]} elseIfBranches - Array of ELSE IF branch configurations
 * @property {boolean} showElse - Toggle for ELSE branch presence
 * @property {Record<string, boolean>} [expressionValidity] - Validation state tracking for expressions by branch ID
 */
export interface IfElseNodeData {
    mainCondition: ConditionBranch;
    elseIfBranches: ConditionBranch[];
    showElse: boolean;
    expressionValidity?: Record<string, boolean>;
}

/**
 * Props type for IfElseNode component
 *
 * Extends React Flow's NodeProps with optional IfElseNodeData properties
 * to support conditional flow control within the visual scripting interface.
 *
 * @typedef {NodeProps & Partial<IfElseNodeData>} IfElseNodeProps
 */
export type IfElseNodeProps = NodeProps & Partial<IfElseNodeData>;

/**
 * Generates a unique identifier for new conditional branches
 *
 * Creates a short random string suitable for client-side branch identification
 * within the visual scripting interface. Not cryptographically secure.
 *
 * @returns {string} Random 7-character alphanumeric string
 *
 * @example
 * const id = generateId(); // "a3x9k2m"
 */
const generateId = (): string =>
    Math.random().toString(36).substring(2, 9);

/**
 * IfElseNode component implements conditional branching logic in Luau visual scripts
 *
 * Provides a complete if/elseif/else control flow structure with flexible condition
 * evaluation strategies. Supports both literal connections from ConditionNode outputs
 * and inline Luau boolean expressions for maximum authoring flexibility.
 *
 * Features:
 * - Dual-mode condition evaluation per branch (literal connections or inline expressions)
 * - Dynamic branch management (add/remove ELSE IF branches at runtime)
 * - Real-time expression validation with visual feedback
 * - ELSE branch toggle for optional fallback execution path
 * - Visual indicators showing literal connection status
 * - Color-coded purple styling for control flow construct identification
 * - ChevronDown icon representing hierarchical branching semantics
 *
 * Branch evaluation semantics:
 * - Conditions evaluated sequentially from top to bottom (IF → ELSE IFs → ELSE)
 * - First true condition triggers its corresponding output flow path
 * - Remaining branches are skipped after first match
 * - ELSE branch executes only if all preceding conditions evaluate false
 * - Empty expressions in expression mode default to false
 * - Unliteral condition inputs in literal mode default to false (visual warning shown)
 *
 * Expression validation:
 * - Basic pattern matching for common boolean expression structures
 * - Validates presence of operators (==, ~=, >, <, >=, <=, and, or, not)
 * - Does NOT perform full Luau semantic analysis (runtime compilation handles this)
 * - Visual feedback via border color and warning icon for invalid syntax
 * - Empty expressions show no validation errors (placeholder state)
 *
 * Handle configuration dynamics:
 * - Condition input handles appear ONLY when branch is in "literal" mode
 * - Condition handles disappear when switching to "expression" mode
 * - Output handles always present regardless of branch configuration
 * - Output count adapts to number of ELSE IF branches and ELSE toggle state
 *
 * Common use cases:
 * - Decision trees and state machines
 * - Input validation and guard clauses
 * - Feature flags and conditional behaviors
 * - Game state transitions (e.g., health checks, win/lose conditions)
 * - UI flow control (dialog branching, menu navigation)
 *
 * Integration patterns:
 * - Wire ConditionNode outputs to "literal" mode branches for complex comparisons
 * - Use expression mode for simple checks without extra nodes (e.g., "isReady")
 * - Chain multiple IfElseNodes for nested conditional logic
 * - Connect ELSE output to error handling or default behavior nodes
 *
 * @component
 * @param {IfElseNodeProps} props - React Flow node properties
 *
 * @example
 * // Register node type in React Flow
 * const nodeTypes = useMemo(() => ({
 *   ifElse: IfElseNode
 * }), []);
 *
 * @example
 * // Basic if/else node with expression mode
 * const healthCheckNode = {
 *   id: 'if-1',
 *   type: 'ifElse',
 *    {
 *     mainCondition: {
 *       id: 'main',
 *       mode: 'expression',
 *       expression: 'playerHealth <= 0'
 *     },
 *     elseIfBranches: [],
 *     showElse: true
 *   },
 *   position: { x: 100, y: 200 }
 * };
 *
 * @example
 * // Complex branching with literal conditions
 * const stateMachineNode = {
 *   id: 'if-2',
 *   type: 'ifElse',
 *    {
 *     mainCondition: { id: 'main', mode: 'literal' }, // Connected to ConditionNode
 *     elseIfBranches: [
 *       { id: 'b1', mode: 'literal' }, // Connected to another ConditionNode
 *       { id: 'b2', mode: 'expression', expression: 'isSpecialEvent' }
 *     ],
 *     showElse: true
 *   },
 *   position: { x: 100, y: 200 }
 * };
 */
const IfElseNode = memo(({ data, selected }: IfElseNodeProps) => {
    const nodeId = useNodeId();
    const { setNodes } = useReactFlow();
    const scriptId = data?.__scriptId as string | undefined;

    // Initialize branch configurations with safe defaults
    const mainCondition: ConditionBranch = {
        id: "main",
        mode: (data?.mainCondition && typeof data.mainCondition === 'object' && 'mode' in data.mainCondition
            ? data.mainCondition.mode as "literal" | "expression"
            : undefined) ?? "literal",
        expression: data?.mainCondition && typeof data.mainCondition === 'object' && 'expression' in data.mainCondition
            ? data.mainCondition.expression as string
            : "",
    };

    const elseIfBranches: ConditionBranch[] =
        Array.isArray(data?.elseIfBranches) ? data.elseIfBranches : [];

    const showElse = data?.showElse ?? true;
    const expressionValidity: Record<string, boolean> = {
        main: true,
        ...(data?.expressionValidity || {})
    };


    /**
     * Updates node data in React Flow's state management system
     *
     * Merges partial data updates into the node's existing data while preserving
     * all other node properties. Ensures persistent state synchronization across
     * the visual scripting interface.
     *
     * @param {Partial<IfElseNodeData>} partial - Partial data object to merge into node data
     * @returns {void}
     */
    const updateData = useCallback(
        (partial: Partial<IfElseNodeData>) => {
            setNodes((nodes) =>
                nodes.map((n) =>
                    n.id === nodeId ? { ...n, data: { ...n.data, ...partial } } : n
                )
            );
        },
        [nodeId, setNodes]
    );

    /**
     * Validates boolean expression syntax using pattern matching
     *
     * Performs basic structural validation to catch obvious syntax errors
     * during authoring. Does NOT validate semantic correctness or identifier
     * existence (handled by Luau compiler at runtime).
     *
     * Validation rules:
     * - Non-empty strings only (empty = invalid)
     * - Must contain at least one boolean operator or logical keyword
     *   (==, ~=, >, <, >=, <=, and, or, not)
     * - Supports common value types: identifiers, literals (true/false/numbers), strings
     * - Allows property access (obj.prop) and indexing (obj[key])
     *
     * @param {string} expr - Expression string to validate
     * @returns {boolean} True if expression passes basic syntax checks
     *
     * @example
     * validateExpression("score > 10"); // true
     * validateExpression("isReady and count > 0"); // true
     * validateExpression("myVar"); // false (no operator)
     */
    const validateExpression = useCallback((expr: string): boolean => {
        if (!expr.trim()) return false;

        // Allow common Luau boolean expressions
        const pattern =
            /^\s*(?:[a-zA-Z_]\w*(?:\s*(?:\[.*?\]|\.\w+))*|true|false|\d+(?:\.\d+)?|"[^"]*"|'[^']*')\s*(?:[~=<>]=?|and|or|not)\s*.+$/i;

        return pattern.test(expr.trim());
    }, []);

    /**
     * Updates main condition branch evaluation mode
     *
     * Switches between "literal" (external connection) and "expression" (inline) modes.
     * Clears expression value when switching to literal mode to avoid stale data.
     *
     * @param {("literal" | "expression")} mode - Target evaluation mode
     * @returns {void}
     */
    const updateMainMode = useCallback(
        (mode: "literal" | "expression") => {
            updateData({
                mainCondition: {
                    ...mainCondition,
                    mode,
                    ...(mode === "literal" && { expression: "" }),
                },
            });
        },
        [mainCondition, updateData]
    );

    /**
     * Updates main condition branch inline expression value
     *
     * Validates expression on change and updates both the expression value and
     * its validation state in node data for persistent storage and visual feedback.
     *
     * @param {string} expr - New expression value
     * @returns {void}
     */
    const updateMainExpression = useCallback(
        (expr: string) => {
            const isValid = validateExpression(expr);

            updateData({
                mainCondition: {
                    ...mainCondition,
                    expression: expr,
                },
                expressionValidity: {
                    ...expressionValidity,
                    main: isValid,
                },
            });
        },
        [mainCondition, expressionValidity, updateData, validateExpression]
    );

    /**
     * Adds a new ELSE IF branch to the conditional structure
     *
     * Appends a new branch configuration with default "literal" mode and generates
     * a unique identifier for branch management. Preserves existing branch configurations.
     *
     * @returns {void}
     */
    const addElseIfBranch = useCallback(() => {
        updateData({
            elseIfBranches: [
                ...elseIfBranches,
                {
                    id: generateId(),
                    mode: "literal",
                    expression: "",
                },
            ],
        });
    }, [elseIfBranches, updateData]);

    /**
     * Removes an ELSE IF branch by unique identifier
     *
     * Filters out the branch matching the provided ID while preserving order
     * and configuration of remaining branches. Prevents removal of main IF branch.
     *
     * @param {string} id - Unique identifier of branch to remove
     * @returns {void}
     */
    const removeElseIfBranch = useCallback(
        (id: string) => {
            updateData({
                elseIfBranches: elseIfBranches.filter((b) => b.id !== id),
            });
        },
        [elseIfBranches, updateData]
    );

    /**
     * Updates ELSE IF branch evaluation mode
     *
     * Switches the specified branch between "literal" and "expression" modes.
     * Clears expression value when switching to literal mode to avoid conflicts.
     *
     * @param {string} id - Unique identifier of branch to update
     * @param {("literal" | "expression")} mode - Target evaluation mode
     * @returns {void}
     */
    const updateElseIfMode = useCallback(
        (id: string, mode: "literal" | "expression") => {
            updateData({
                elseIfBranches: elseIfBranches.map((b) =>
                    b.id === id
                        ? {
                            ...b,
                            mode,
                            ...(mode === "literal" && { expression: "" }),
                        }
                        : b
                ),
            });
        },
        [elseIfBranches, updateData]
    );

    /**
     * Updates ELSE IF branch inline expression value
     *
     * Validates expression on change and updates both the expression value and
     * its validation state in node data for persistent storage and visual feedback.
     *
     * @param {string} id - Unique identifier of branch to update
     * @param {string} expr - New expression value
     * @returns {void}
     */
    const updateElseIfExpression = useCallback(
        (id: string, expr: string) => {
            const isValid = validateExpression(expr);

            updateData({
                elseIfBranches: elseIfBranches.map((b) =>
                    b.id === id ? { ...b, expression: expr } : b
                ),
                expressionValidity: {
                    ...expressionValidity,
                    [id]: isValid,
                },
            });
        },
        [elseIfBranches, expressionValidity, updateData, validateExpression]
    );

    // Retrieve condition edges to determine literal connection status
    const conditionEdges = useStore((s) =>
        s.edges.filter(
            (e) => e.target === nodeId && e.targetHandle?.startsWith("condition")
        )
    );

    const mainConditionConnected = conditionEdges.some(
        (e) => e.targetHandle === "condition"
    );
    const elseIfConditionConnected = (index: number) =>
        conditionEdges.some((e) => e.targetHandle === `condition-${index}`);

    return (
        <NodeTemplate
            details={{
                color: {
                    background: "bg-purple-400/10",
                    border: "border-purple-400/30",
                    text: "text-purple-400",
                    ring: "ring-purple-400/40",
                },
                icon: ChevronDown,
                name: "If/Else",
                description: "Conditional execution with inline expressions or literal conditions",
                selected,
            }}
            inputs={(IfElseNode as any).getHandles(data).inputs}
            outputs={(IfElseNode as any).getHandles(data).outputs}
        >
            <div className="space-y-3">
                {/* Main IF Branch */}
                <div className="border border-border rounded-md p-3 bg-card/5">
                    <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-1 text-xs font-medium">
                            <span className="text-purple-400">IF</span>
                        </div>
                        <div className="flex gap-1">
                            <Button
                                variant={mainCondition.mode === "literal" ? "default" : "outline"}
                                size="xs"
                                className="text-xs h-6 cursor-pointer bg-purple-400/10 hover:bg-purple-400/20"
                                onClick={() => updateMainMode("literal")}
                            >
                                Literal
                            </Button>
                            <Button
                                variant={mainCondition.mode === "expression" ? "default" : "outline"}
                                size="xs"
                                className="text-xs h-6 cursor-pointer bg-purple-400/10 hover:bg-purple-400/20"
                                onClick={() => updateMainMode("expression")}
                            >
                                Expression
                            </Button>
                        </div>
                    </div>

                    {mainCondition.mode === "expression" ? (
                        <div className="space-y-1">
                            <VariableAutocomplete
                                scriptId={scriptId || "unknown"}
                                value={mainCondition.expression || ""}
                                onChange={(e) => updateMainExpression(e.target.value)}
                                placeholder="e.g., score > 10 or health <= 0"
                                className={cn(
                                    "text-xs h-7 font-mono",
                                    !expressionValidity.main &&
                                    mainCondition.expression?.trim() &&
                                    "border-destructive"
                                )}
                            />
                            {!expressionValidity.main &&
                                mainCondition.expression?.trim() && (
                                    <div className="text-[8px] text-destructive flex items-center gap-1">
                                        <AlertTriangle className="h-3 w-3" />
                                        Invalid boolean expression
                                    </div>
                                )}
                            <p className="text-[10px] text-muted-foreground italic">
                                Examples: <code className="font-mono bg-muted px-1 rounded">myVar == 5</code>,{" "}
                                <code className="font-mono bg-muted px-1 rounded">name ~= "admin"</code>,{" "}
                                <code className="font-mono bg-muted px-1 rounded">isReady and count &gt; 0</code>
                            </p>
                        </div>
                    ) : (
                        <div className="w-full">
                            {mainConditionConnected ? (
                                <span className="text-xs text-muted-foreground text-center block">
                                    Connected to Condition Node.
                                </span>
                            ) : (
                                <span className="text-xs text-destructive text-center block">
                                    Condition Node Input missing.
                                </span>
                            )}
                        </div>
                    )}
                </div>

                {/* ELSE IF Branches */}
                {elseIfBranches.map((branch, index) => {
                    const isConnected = elseIfConditionConnected(index);
                    const isValid = expressionValidity[branch.id];

                    return (
                        <div
                            key={branch.id}
                            className="border border-border rounded-md p-3 bg-card/5"
                        >
                            <div className="flex items-center justify-between mb-2">
                                <span className="text-xs font-medium text-purple-400">
                                    ELSE IF
                                </span>
                                <div className="flex gap-1">
                                    <Button
                                        variant={branch.mode === "literal" ? "default" : "outline"}
                                        size="xs"
                                        className="text-xs h-6 cursor-pointer bg-purple-400/10 hover:bg-purple-400/20"
                                        onClick={() => updateElseIfMode(branch.id, "literal")}
                                    >
                                        literal
                                    </Button>
                                    <Button
                                        variant={branch.mode === "expression" ? "default" : "outline"}
                                        size="xs"
                                        className="text-xs h-6 cursor-pointer bg-purple-400/10 hover:bg-purple-400/20"
                                        onClick={() => updateElseIfMode(branch.id, "expression")}
                                    >
                                        Expression
                                    </Button>
                                    <Button
                                        variant="destructive"
                                        size="icon-xs"
                                        onClick={() => removeElseIfBranch(branch.id)}
                                    >
                                        <Minus className="h-3 w-3" />
                                    </Button>
                                </div>
                            </div>

                            {branch.mode === "expression" ? (
                                <div className="space-y-1">
                                    <Input
                                        value={branch.expression || ""}
                                        onChange={(e) => updateElseIfExpression(branch.id, e.target.value)}
                                        placeholder={`e.g., level == ${index + 2}`}
                                        className={cn(
                                            "text-xs h-7 font-mono",
                                            !isValid && branch.expression?.trim() && "border-destructive"
                                        )}
                                    />
                                    {!isValid && branch.expression?.trim() && (
                                        <div className="text-[8px] text-destructive flex items-center gap-1">
                                            <AlertTriangle className="h-3 w-3" />
                                            Invalid boolean expression
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <div className="w-full">
                                    {isConnected ? (
                                        <span className="text-xs text-muted-foreground text-center block">
                                            Connected to Condition Node.
                                        </span>
                                    ) : (
                                        <span className="text-xs text-destructive text-center block">
                                            Condition Node Input missing.
                                        </span>
                                    )}
                                </div>
                            )}
                        </div>
                    );
                })}

                {/* Add Else If Button */}
                <Button
                    variant="outline"
                    size="sm"
                    className="w-full h-7 text-xs cursor-pointer"
                    onClick={addElseIfBranch}
                >
                    <Plus className="h-3 w-3 mr-1" />
                    Add Else If
                </Button>

                {/* Else Branch Toggle */}
                <div className="flex justify-between items-center pt-1">
                    <span className="text-xs text-muted-foreground">Else branch</span>
                    <Button
                        variant={showElse ? "default" : "outline"}
                        size="sm"
                        className="text-xs h-6 px-2 bg-purple-400/10 hover:bg-purple-400/20 cursor-pointer"
                        onClick={() => updateData({ showElse: !showElse })}
                    >
                        {showElse ? "ON" : "OFF"}
                    </Button>
                </div>
            </div>
        </NodeTemplate>
    );
});

IfElseNode.displayName = "IfElseNode";

/**
 * Static method to compute dynamic handles based on node configuration
 *
 * Generates input and output handles that adapt to the current branch configuration:
 * - Input handles appear ONLY for branches in "literal" mode
 * - Output handles always present with labels matching branch structure
 * - Handle count dynamically adjusts to ELSE IF branch count and ELSE toggle state
 *
 * Input handle semantics:
 * - "execute": Required flow entry point to trigger condition evaluation
 * - "condition": Main IF branch condition (appears only in literal mode)
 * - "condition-{n}": ELSE IF branch conditions (appear only in literal mode)
 *
 * Output handle semantics:
 * - "then": Executes when main IF condition evaluates true
 * - "elseif-{n}": Executes when corresponding ELSE IF condition evaluates true
 * - "else": Executes when all preceding conditions evaluate false (if enabled)
 *
 * Note: Handle configuration is computed dynamically based on node data state.
 * Changing branch modes or counts immediately affects available connection points.
 *
 * @static
 * @param {IfElseNodeData} data - Current node configuration data
 * @returns {Object} Handle configuration object
 * @returns {Array} returns.inputs - Dynamic input handles based on literal branches
 * @returns {Array} returns.outputs - Output handles matching branch structure
 *
 * @example
 * // Basic if/else with expression mode (no condition inputs)
 * const handles1 = IfElseNode.getHandles({
 *   mainCondition: { id: 'main', mode: 'expression' },
 *   elseIfBranches: [],
 *   showElse: true
 * });
 * // {
 * //   inputs: [{ id: "execute", label: "Execute", type: LuauType.Flow }],
 * //   outputs: [
 * //     { id: "then", label: "Then", type: LuauType.Flow },
 * //     { id: "else", label: "Else", type: LuauType.Flow }
 * //   ]
 * // }
 *
 * @example
 * // Complex branching with literal conditions
 * const handles2 = IfElseNode.getHandles({
 *   mainCondition: { id: 'main', mode: 'literal' },
 *   elseIfBranches: [
 *     { id: 'b1', mode: 'literal' },
 *     { id: 'b2', mode: 'expression' }
 *   ],
 *   showElse: true
 * });
 * // {
 * //   inputs: [
 * //     { id: "execute", label: "Execute", type: LuauType.Flow },
 * //     { id: "condition", label: "Condition", type: LuauType.Boolean },
 * //     { id: "condition-0", label: "Condition 0", type: LuauType.Boolean }
 * //   ],
 * //   outputs: [
 * //     { id: "then", label: "Then", type: LuauType.Flow },
 * //     { id: "elseif-0", label: "Else If 1", type: LuauType.Flow },
 * //     { id: "elseif-1", label: "Else If 2", type: LuauType.Flow },
 * //     { id: "else", label: "Else", type: LuauType.Flow }
 * //   ]
 * // }
 */
(IfElseNode as any).getHandles = (data: IfElseNodeData) => {
    const mainCondition = data?.mainCondition || {
        id: "main",
        mode: "literal",
        expression: "",
    };

    const elseIfBranches = data?.elseIfBranches || [];
    const showElse = data?.showElse ?? true;

    return {
        inputs: [
            { id: "execute", label: "Execute", type: LuauType.Flow },
            // Condition pin only shown in literal mode
            ...(mainCondition.mode === "literal"
                ? [{ id: "condition", label: "Condition", type: LuauType.Boolean }]
                : []),
            // Else-if condition pins only shown in literal mode
            ...elseIfBranches
                .filter((b) => b.mode === "literal")
                .map((_, i) => ({
                    id: `condition-${i}`,
                    label: `Condition ${i + 1}`,
                    type: LuauType.Boolean,
                })),
        ],
        outputs: [
            { id: "then", label: "Then", type: LuauType.Flow },
            ...elseIfBranches.map((_, i) => ({
                id: `elseif-${i}`,
                label: `Else If ${i + 1}`,
                type: LuauType.Flow,
            })),
            ...(showElse
                ? [
                    {
                        id: "else",
                        label: "Else",
                        type: LuauType.Flow,
                    },
                ]
                : []),
        ],
    };
};

export default IfElseNode;