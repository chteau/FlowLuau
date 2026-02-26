"use client";

import { memo, useCallback, useState, useEffect } from "react";
import { NodeProps, useNodeId, useReactFlow, useStore } from "@xyflow/react";
import NodeTemplate from "../../Template";
import { ListOrdered } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { LuauType } from "@/types/luau";
import VariableAutocomplete from "@/components/ui/variable-autocomplete";
import { useIntellisenseStore } from "@/stores/intellisense-store";
import { useScopeManagement } from "@/hooks/use-scope-management";

export interface ForLoopNodeData {
    mode?: "counting" | "generic";
    iteratorType?: "ipairs" | "pairs" | "custom";
    variableName?: string;
    startValue?: string;
    endValue?: string;
    stepValue?: string;
    iterableExpression?: string;
    __scriptId?: string;
}

export type ForLoopNodeProps = NodeProps & { data: ForLoopNodeData };

/**
 * For loop control flow node supporting counting (numeric range) and generic (iterator) modes.
 * Counting mode exposes From/To/Step inputs for `for i = start, end, step do` syntax.
 * Generic mode supports `for _, v in ipairs/pairs/table do` with configurable iterator type.
 */
const ForLoopNode = memo(({ data, selected }: ForLoopNodeProps) => {
    const nodeId = useNodeId();
    const { setNodes } = useReactFlow();
    const scriptId = data.__scriptId;

    const mode = data.mode ?? "counting";
    const iteratorType = data.iteratorType ?? "ipairs";
    const variableName = data.variableName ?? "i";
    const startValue = data.startValue ?? "1";
    const endValue = data.endValue ?? "10";
    const stepValue = data.stepValue ?? "1";
    const iterableExpression = data.iterableExpression ?? "";

    // Use scope management hook for loop scope
    const { scopeId: loopScopeId } = useScopeManagement(
        scriptId,
        nodeId!,
        "loop",
        undefined, // No parent scope for top-level loops
        [{
            name: variableName,
            type: LuauType.Number, // Loop variables are typically numbers
            isConstant: false,
        }]
    );

    const updateData = useCallback(
        (partial: Partial<ForLoopNodeData>) => {
            setNodes((nodes) =>
                nodes.map((node) =>
                    node.id === nodeId ? { ...node, data: { ...node.data, ...partial } } : node
                )
            );
        },
        [nodeId, setNodes]
    );

    const handleModeChange = useCallback(
        (newMode: "counting" | "generic") => {
            updateData({ mode: newMode });
        },
        [updateData]
    );

    const handleIteratorTypeChange = useCallback(
        (newType: "ipairs" | "pairs" | "custom") => {
            updateData({ iteratorType: newType });
        },
        [updateData]
    );

    const handleVariableChange = useCallback(
        (e: React.ChangeEvent<HTMLInputElement>) => {
            updateData({ variableName: e.target.value });
        },
        [updateData]
    );

    const handleStartChange = useCallback(
        (e: React.ChangeEvent<HTMLInputElement>) => {
            updateData({ startValue: e.target.value });
        },
        [updateData]
    );

    const handleEndChange = useCallback(
        (e: React.ChangeEvent<HTMLInputElement>) => {
            updateData({ endValue: e.target.value });
        },
        [updateData]
    );

    const handleStepChange = useCallback(
        (e: React.ChangeEvent<HTMLInputElement>) => {
            updateData({ stepValue: e.target.value });
        },
        [updateData]
    );

    const handleIterableChange = useCallback(
        (e: React.ChangeEvent<HTMLInputElement>) => {
            updateData({ iterableExpression: e.target.value });
        },
        [updateData]
    );

    const connectedEdges = useStore((s) => s.edges.filter((e) => e.target === nodeId));
    const isStartWired = connectedEdges.some((e) => e.targetHandle === "start");
    const isEndWired = connectedEdges.some((e) => e.targetHandle === "end");
    const isStepWired = connectedEdges.some((e) => e.targetHandle === "step");
    const isIterableWired = connectedEdges.some((e) => e.targetHandle === "iterable");

    const getDescription = () => {
        if (mode === "counting") {
            return `for ${variableName} = ${startValue}, ${endValue}${stepValue !== "1" ? `, ${stepValue}` : ""} do`;
        }
        if (iteratorType === "custom") {
            return `for _, v in ${iterableExpression || "iterator"} do`;
        }
        return `for _, v in ${iteratorType}(table) do`;
    };

    return (
        <NodeTemplate
            details={{
                color: {
                    background: "bg-purple-400/10",
                    border: "border-purple-400/30",
                    text: "text-purple-400",
                    ring: "ring-purple-400/40",
                },
                icon: ListOrdered,
                name: "For Loop",
                description: getDescription(),
                selected,
            }}
            inputs={(ForLoopNode as any).getHandles(data).inputs}
            outputs={(ForLoopNode as any).getHandles(data).outputs}
        >
            <div className="space-y-3">
                <div className="flex gap-1">
                    <Button
                        variant={mode === "counting" ? "default" : "outline"}
                        size="xs"
                        className="text-xs h-6 cursor-pointer bg-purple-400/10 hover:bg-purple-400/20"
                        onClick={() => handleModeChange("counting")}
                    >
                        Counting
                    </Button>
                    <Button
                        variant={mode === "generic" ? "default" : "outline"}
                        size="xs"
                        className="text-xs h-6 cursor-pointer bg-purple-400/10 hover:bg-purple-400/20"
                        onClick={() => handleModeChange("generic")}
                    >
                        Generic
                    </Button>
                </div>

                {mode === "counting" && (
                    <div className="space-y-2">
                        <div className="space-y-1">
                            <label className="text-[10px] text-muted-foreground">Iterator Name</label>
                            <Input
                                value={variableName}
                                onChange={handleVariableChange}
                                placeholder="i"
                                className="text-xs h-7 font-mono"
                            />
                        </div>

                        <div className="space-y-1">
                            <label className="text-[10px] text-muted-foreground">
                                From {isStartWired && "(wired)"}
                            </label>
                            <Input
                                type="text"
                                value={isStartWired ? "Wired" : startValue}
                                onChange={handleStartChange}
                                placeholder="1"
                                className="text-xs h-7 font-mono"
                                disabled={isStartWired}
                            />
                        </div>

                        <div className="space-y-1">
                            <label className="text-[10px] text-muted-foreground">
                                To {isEndWired && "(wired)"}
                            </label>
                            <Input
                                type="text"
                                value={isEndWired ? "Wired" : endValue}
                                onChange={handleEndChange}
                                placeholder="10"
                                className="text-xs h-7 font-mono"
                                disabled={isEndWired}
                            />
                        </div>

                        <div className="space-y-1">
                            <label className="text-[10px] text-muted-foreground">
                                Step {isStepWired && "(wired)"}
                            </label>
                            <Input
                                type="text"
                                value={isStepWired ? "Wired" : stepValue}
                                onChange={handleStepChange}
                                placeholder="1"
                                className="text-xs h-7 font-mono"
                                disabled={isStepWired}
                            />
                        </div>
                    </div>
                )}

                {mode === "generic" && (
                    <div className="space-y-2">
                        <div className="flex gap-1">
                            <Button
                                variant={iteratorType === "ipairs" ? "default" : "outline"}
                                size="xs"
                                className="text-xs h-6 cursor-pointer bg-purple-400/10 hover:bg-purple-400/20"
                                onClick={() => handleIteratorTypeChange("ipairs")}
                            >
                                ipairs
                            </Button>
                            <Button
                                variant={iteratorType === "pairs" ? "default" : "outline"}
                                size="xs"
                                className="text-xs h-6 cursor-pointer bg-purple-400/10 hover:bg-purple-400/20"
                                onClick={() => handleIteratorTypeChange("pairs")}
                            >
                                pairs
                            </Button>
                            <Button
                                variant={iteratorType === "custom" ? "default" : "outline"}
                                size="xs"
                                className="text-xs h-6 cursor-pointer bg-purple-400/10 hover:bg-purple-400/20"
                                onClick={() => handleIteratorTypeChange("custom")}
                            >
                                Custom
                            </Button>
                        </div>

                        {iteratorType === "custom" ? (
                            <div className="space-y-1">
                                <label className="text-[10px] text-muted-foreground">
                                    Iterator Expression {isIterableWired && "(wired)"}
                                </label>
                                <VariableAutocomplete
                                    scriptId={data.__scriptId ?? "unknown"}
                                    value={isIterableWired ? "Wired" : iterableExpression}
                                    onChange={handleIterableChange}
                                    placeholder="e.g., myIterator() or table"
                                    disabled={isIterableWired}
                                    className="text-xs h-7 font-mono"
                                    filterVariables={(v) => v.type === LuauType.Any || v.type === LuauType.Function}
                                />
                            </div>
                        ) : (
                            <div className="space-y-1">
                                <label className="text-[10px] text-muted-foreground">
                                    Table Expression
                                </label>
                                <VariableAutocomplete
                                    scriptId={data.__scriptId ?? "unknown"}
                                    value={iterableExpression}
                                    onChange={handleIterableChange}
                                    placeholder="e.g., numbers or myTable"
                                    className="text-xs h-7 font-mono"
                                    filterVariables={(v) => v.type === LuauType.Table || v.type === LuauType.Any}
                                />
                                <p className="text-[10px] text-muted-foreground italic">
                                    Will generate: <code className="font-mono bg-muted px-1 rounded">for _, v in {iteratorType}({iterableExpression || "table"}) do</code>
                                </p>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </NodeTemplate>
    );
});

ForLoopNode.displayName = "ForLoopNode";

(ForLoopNode as any).getHandles = (data: ForLoopNodeData) => {
    const mode = data?.mode ?? "counting";
    const iteratorType = data?.iteratorType ?? "ipairs";

    if (mode === "counting") {
        return {
            inputs: [
                { id: "prev", label: "Prev", type: LuauType.Flow },
                { id: "start", label: "From", type: LuauType.Number },
                { id: "end", label: "To", type: LuauType.Number },
                { id: "step", label: "Step", type: LuauType.Number },
            ],
            outputs: [
                { id: "loop", label: "Loop Body", type: LuauType.Flow },
                { id: "index", label: "Index", type: LuauType.Number },
                { id: "next", label: "Next", type: LuauType.Flow },
            ],
        };
    }

    return {
        inputs: [
            { id: "prev", label: "Prev", type: LuauType.Flow },
            ...(iteratorType === "custom"
                ? [{ id: "iterable", label: "Iterator", type: LuauType.Any }]
                : [{ id: "iterable", label: "Table", type: LuauType.Table }]),
        ],
        outputs: [
            { id: "loop", label: "Loop Body", type: LuauType.Flow },
            { id: "key", label: "Key", type: LuauType.Any },
            { id: "value", label: "Value", type: LuauType.Any },
            { id: "next", label: "Next", type: LuauType.Flow },
        ],
    };
};

export default ForLoopNode;