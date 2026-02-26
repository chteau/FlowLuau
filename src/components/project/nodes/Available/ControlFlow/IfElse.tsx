"use client";

import { memo, useCallback, useEffect } from "react";
import { NodeProps, useNodeId, useReactFlow, useStore } from "@xyflow/react";
import NodeTemplate from "../../Template";
import { Button } from "@/components/ui/button";
import { Plus, Minus, ChevronDown, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";
import { LuauType } from "@/types/luau";
import VariableAutocomplete from "@/components/ui/variable-autocomplete";
import { useIntellisenseStore } from "@/stores/intellisense-store";
import { useScopeManagement } from "@/hooks/use-scope-management";

/** Represents a single conditional branch within an if/else structure. */
interface ConditionBranch {
    id: string;
    mode: "literal" | "expression";
    expression?: string;
}

export interface IfElseNodeData {
    mainCondition: ConditionBranch;
    elseIfBranches: ConditionBranch[];
    showElse: boolean;
    expressionValidity?: Record<string, boolean>;
    __scriptId?: string;
}

export type IfElseNodeProps = NodeProps & { data: IfElseNodeData };

const generateId = (): string => Math.random().toString(36).substring(2, 9);

const validateExpression = (expr: string): boolean => {
    if (!expr.trim()) return false;
    const pattern =
        /^\s*(?:[a-zA-Z_]\w*(?:\s*(?:\[.*?\]|\.\w+))*|true|false|\d+(?:\.\d+)?|"[^"]*"|'[^']*')\s*(?:[~=<>]=?|and|or|not)\s*.+$/i;
    return pattern.test(expr.trim());
};

/**
 * Conditional branching node implementing if/elseif/else control flow logic.
 * Supports two evaluation modes per branch: literal (connected Condition nodes) or inline expressions.
 * Dynamically generates input/output handles based on branch count and mode configuration.
 */
const IfElseNode = memo(({ data, selected }: IfElseNodeProps) => {
    const nodeId = useNodeId();
    const { setNodes } = useReactFlow();
    const scriptId = data.__scriptId;

    // Create and manage block scope for if/else branches
    useEffect(() => {
        if (!scriptId) return;

        // Create block scope for the if/else structure
        const blockScopeId = `${nodeId}-block-scope`;
        useIntellisenseStore.getState().createScope(scriptId, {
            id: blockScopeId,
            scopeType: "block",
            nodeId: nodeId!,
            variableNames: new Set(),
            childScopeIds: new Set(),
        });

        return () => {
            // Clean up when node is removed
            useIntellisenseStore.getState().destroyScope(scriptId, blockScopeId);
        };
    }, [scriptId, nodeId]);

    const mainCondition: ConditionBranch = data.mainCondition ?? {
        id: "main",
        mode: "literal",
        expression: "",
    };
    const elseIfBranches: ConditionBranch[] = data.elseIfBranches ?? [];
    const showElse = data.showElse ?? true;
    const expressionValidity: Record<string, boolean> = {
        main: true,
        ...(data.expressionValidity ?? {}),
    };

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

    const updateMainExpression = useCallback(
        (expr: string) => {
            updateData({
                mainCondition: { ...mainCondition, expression: expr },
                expressionValidity: { ...expressionValidity, main: validateExpression(expr) },
            });
        },
        [mainCondition, expressionValidity, updateData]
    );

    const addElseIfBranch = useCallback(() => {
        updateData({
            elseIfBranches: [...elseIfBranches, { id: generateId(), mode: "literal", expression: "" }],
        });
    }, [elseIfBranches, updateData]);

    const removeElseIfBranch = useCallback(
        (id: string) => {
            updateData({ elseIfBranches: elseIfBranches.filter((b) => b.id !== id) });
        },
        [elseIfBranches, updateData]
    );

    const updateElseIfMode = useCallback(
        (id: string, mode: "literal" | "expression") => {
            updateData({
                elseIfBranches: elseIfBranches.map((b) =>
                    b.id === id ? { ...b, mode, ...(mode === "literal" && { expression: "" }) } : b
                ),
            });
        },
        [elseIfBranches, updateData]
    );

    const updateElseIfExpression = useCallback(
        (id: string, expr: string) => {
            updateData({
                elseIfBranches: elseIfBranches.map((b) =>
                    b.id === id ? { ...b, expression: expr } : b
                ),
                expressionValidity: { ...expressionValidity, [id]: validateExpression(expr) },
            });
        },
        [elseIfBranches, expressionValidity, updateData]
    );

    const conditionEdges = useStore((s) =>
        s.edges.filter(
            (e) => e.target === nodeId && e.targetHandle?.startsWith("condition")
        )
    );
    const mainConditionConnected = conditionEdges.some((e) => e.targetHandle === "condition");
    const elseIfConditionConnected = (index: number) =>
        conditionEdges.some((e) => e.targetHandle === `condition-${index}`);

    return (
        <NodeTemplate
            details={{
                color: {
                    background: "bg-purple-400/10",
                    border: cn("border-purple-400/30", (!mainConditionConnected) && "border-destructive animate-pulse"),
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
                {/* Main IF branch */}
                <div className="border border-border rounded-md p-3 bg-card/5">
                    <div className="flex items-center justify-between mb-2">
                        <span className="flex items-center gap-1 text-xs font-medium text-purple-400">
                            IF
                        </span>
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
                                scriptId={data.__scriptId ?? "unknown"}
                                value={mainCondition.expression ?? ""}
                                onChange={(e) => updateMainExpression(e.target.value)}
                                placeholder="e.g., score > 10 or health <= 0"
                                className={cn(
                                    "text-xs h-7 font-mono",
                                    !expressionValidity.main &&
                                        mainCondition.expression?.trim() &&
                                        "border-destructive"
                                )}
                            />
                            {!expressionValidity.main && mainCondition.expression?.trim() && (
                                <div className="text-[8px] text-destructive flex items-center gap-1">
                                    <AlertTriangle className="h-3 w-3" />
                                    Invalid boolean expression
                                </div>
                            )}
                            <p className="text-[10px] text-muted-foreground italic">
                                Examples:{" "}
                                <code className="font-mono bg-muted px-1 rounded">myVar == 5</code>,{" "}
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

                {/* ELSE IF branches */}
                {elseIfBranches.map((branch, index) => {
                    const isConnected = elseIfConditionConnected(index);
                    const isValid = expressionValidity[branch.id];

                    return (
                        <div key={branch.id} className="border border-border rounded-md p-3 bg-card/5">
                            <div className="flex items-center justify-between mb-2">
                                <span className="text-xs font-medium text-purple-400">ELSE IF</span>
                                <div className="flex gap-1">
                                    <Button
                                        variant={branch.mode === "literal" ? "default" : "outline"}
                                        size="xs"
                                        className="text-xs h-6 cursor-pointer bg-purple-400/10 hover:bg-purple-400/20"
                                        onClick={() => updateElseIfMode(branch.id, "literal")}
                                    >
                                        Literal
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
                                    <VariableAutocomplete
                                        scriptId={data.__scriptId ?? "unknown"}
                                        value={branch.expression ?? ""}
                                        onChange={(e) =>
                                            updateElseIfExpression(branch.id, e.target.value)
                                        }
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

                {/* Add Else If */}
                <Button
                    variant="outline"
                    size="sm"
                    className="w-full h-7 text-xs cursor-pointer"
                    onClick={addElseIfBranch}
                >
                    <Plus className="h-3 w-3 mr-1" />
                    Add Else If
                </Button>

                {/* Else toggle */}
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

(IfElseNode as any).getHandles = (data: IfElseNodeData) => {
    const mainCondition = data?.mainCondition ?? { id: "main", mode: "literal", expression: "" };
    const elseIfBranches = data?.elseIfBranches ?? [];
    const showElse = data?.showElse ?? true;

    return {
        inputs: [
            { id: "prev", label: "Prev", type: LuauType.Flow },
            ...(mainCondition.mode === "literal"
                ? [{ id: "condition", label: "Condition", type: LuauType.Boolean }]
                : []),
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
            ...(showElse ? [{ id: "else", label: "Else", type: LuauType.Flow }] : []),
            { id: "next", label: "Next", type: LuauType.Flow },
        ],
    };
};

export default IfElseNode;