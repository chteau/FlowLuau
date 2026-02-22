"use client";

import { memo, useCallback, useState } from "react";
import { NodeProps, useNodeId, useReactFlow, useStore } from "@xyflow/react";
import NodeTemplate from "../../Template";
import { ListOrdered } from "lucide-react";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { LuauType } from "@/types/luau";
import { Label } from "@/components/ui/label";
import VariableAutocomplete from "@/components/ui/variable-autocomplete";

export interface ForLoopNodeData {
    mode?: "counting" | "generic";
    variableName?: string;
    startValue?: string;
    endValue?: string;
    stepValue?: string;
    iterableExpression?: string;
    description?: string;
    __scriptId?: string;
}

export type ForLoopNodeProps = NodeProps & { data: ForLoopNodeData };

/**
 * For loop control flow node with two modes: counting (numeric range) and generic (iterator-based).
 * Counting mode exposes From/To/Step numeric inputs and outputs the current index value.
 * Generic mode accepts an iterable expression like pairs() or ipairs() and outputs iteration values.
 */
const ForLoopNode = memo(({ data, selected }: ForLoopNodeProps) => {
    const nodeId = useNodeId();
    const { setNodes } = useReactFlow();

    const [mode, setMode] = useState<"counting" | "generic">(data.mode ?? "counting");

    const variableName = data.variableName ?? "i";
    const startValue = data.startValue ?? "1";
    const endValue = data.endValue ?? "10";
    const stepValue = data.stepValue ?? "1";
    const iterableExpression = data.iterableExpression ?? "pairs(table)";

    const updateData = useCallback(
        (partial: Partial<ForLoopNodeData>) => {
            setNodes((nodes) =>
                nodes.map((node) =>
                    node.id === nodeId
                        ? { ...node, data: { ...node.data, ...partial } }
                        : node
                )
            );
        },
        [nodeId, setNodes]
    );

    const handleModeChange = useCallback(
        (newMode: "counting" | "generic") => {
            setMode(newMode);
            updateData({ mode: newMode });
        },
        [updateData]
    );

    const handleVariableChange = useCallback(
        (e: React.ChangeEvent<HTMLInputElement>) => updateData({ variableName: e.target.value }),
        [updateData]
    );

    const handleStartChange = useCallback(
        (e: React.ChangeEvent<HTMLInputElement>) => updateData({ startValue: e.target.value }),
        [updateData]
    );

    const handleEndChange = useCallback(
        (e: React.ChangeEvent<HTMLInputElement>) => updateData({ endValue: e.target.value }),
        [updateData]
    );

    const handleStepChange = useCallback(
        (e: React.ChangeEvent<HTMLInputElement>) => updateData({ stepValue: e.target.value }),
        [updateData]
    );

    const handleIterableChange = useCallback(
        (e: React.ChangeEvent<HTMLInputElement>) => updateData({ iterableExpression: e.target.value }),
        [updateData]
    );

    const connectedEdges = useStore((s) => s.edges.filter((e) => e.target === nodeId));
    const isStartWired = connectedEdges.some((e) => e.targetHandle === "start");
    const isEndWired = connectedEdges.some((e) => e.targetHandle === "end");
    const isStepWired = connectedEdges.some((e) => e.targetHandle === "step");

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
                description:
                    data.description ??
                    (mode === "counting"
                        ? `Counting loop: ${variableName} from ${startValue} to ${endValue}`
                        : `Generic loop: ${iterableExpression}`),
                selected,
            }}
            inputs={(ForLoopNode as any).getHandles(data).inputs}
            outputs={(ForLoopNode as any).getHandles(data).outputs}
        >
            <div className="space-y-2">
                <div className="flex gap-1 mb-2">
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
                    <div className="space-y-1 mt-5">
                        <div className="flex gap-1 flex-col mb-4">
                            <Label htmlFor="variableName" className="text-xs text-muted-foreground">
                                Iterator name:
                            </Label>
                            <Input
                                id="variableName"
                                value={variableName}
                                onChange={handleVariableChange}
                                placeholder="i"
                                className="text-xs h-7 w-full"
                            />

                            <Label htmlFor="fromNumber" className="text-xs text-muted-foreground mt-4">
                                From:
                            </Label>
                            <Input
                                type={isStartWired ? "text" : "number"}
                                id="fromNumber"
                                value={isStartWired ? "Wired" : startValue}
                                onChange={handleStartChange}
                                placeholder="1"
                                className={cn("text-xs h-7 w-full [appearance:textfield]")}
                                disabled={isStartWired}
                            />

                            <Label htmlFor="toNumber" className="text-xs text-muted-foreground mt-4">
                                To:
                            </Label>
                            <Input
                                type={isEndWired ? "text" : "number"}
                                id="toNumber"
                                value={isEndWired ? "Wired" : endValue}
                                onChange={handleEndChange}
                                placeholder="10"
                                className={cn("text-xs h-7 w-full [appearance:textfield]")}
                                disabled={isEndWired}
                            />

                            <Label htmlFor="step" className="text-xs text-muted-foreground mt-4">
                                Step:
                            </Label>
                            <Input
                                type={isStepWired ? "text" : "number"}
                                id="step"
                                value={isStepWired ? "Wired" : stepValue}
                                onChange={handleStepChange}
                                placeholder="1"
                                className={cn("text-xs h-7 w-full [appearance:textfield]")}
                                disabled={isStepWired}
                            />
                        </div>
                    </div>
                )}

                {mode === "generic" && (
                    <div className="space-y-1">
                        <VariableAutocomplete
                            scriptId={data.__scriptId ?? "unknown"}
                            value={iterableExpression}
                            onChange={handleIterableChange}
                            placeholder="pairs(table)"
                            className={cn("text-xs h-7 font-mono")}
                        />
                        <p className="text-[10px] text-muted-foreground italic">
                            Use pairs(), ipairs(), or custom iterator
                        </p>
                    </div>
                )}
            </div>
        </NodeTemplate>
    );
});

ForLoopNode.displayName = "ForLoopNode";

(ForLoopNode as any).getHandles = (data: ForLoopNodeData) => {
    const mode = data?.mode ?? "counting";

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
        inputs: [{ id: "prev", label: "Prev", type: LuauType.Flow }],
        outputs: [
            { id: "loop", label: "Loop Body", type: LuauType.Flow },
            { id: "index", label: "Index", type: LuauType.Number },
            { id: "next", label: "Next", type: LuauType.Flow },
        ],
    };
};

export default ForLoopNode;