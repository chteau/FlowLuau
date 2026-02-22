"use client";

import { memo, useCallback, useEffect, useState } from "react";
import { NodeProps, useNodeId, useReactFlow, useStore } from "@xyflow/react";
import NodeTemplate from "../../Template";
import { Play, SquareFunction, AlertCircle, AlertTriangle } from "lucide-react";
import { LuauType } from "@/types/luau";
import {
    Select,
    SelectContent,
    SelectGroup,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { useIntellisenseStore } from "@/stores/intellisense-store";

export interface FunctionCallNodeData {
    functionName?: string;
    __scriptId?: string;
}

export type FunctionCallNodeProps = NodeProps & { data: FunctionCallNodeData };

/** Type color classes shared across the parameter/return type badges. */
const typeColorClass = (type: LuauType) => {
    switch (type) {
        case LuauType.Boolean: return "bg-blue-400/20 text-blue-400";
        case LuauType.Number:  return "bg-yellow-400/20 text-yellow-400";
        case LuauType.String:  return "bg-green-400/20 text-green-400";
        case LuauType.Nil:     return "bg-gray-400/20 text-gray-400";
        default:               return "bg-purple-400/20 text-purple-400";
    }
};

const typeLabel = (type: LuauType) => (type === LuauType.Nil ? "nil" : type);

/**
 * Function invocation node that calls a previously defined Luau function.
 * Dynamically generates parameter input handles and a result output based on the selected function's signature.
 * Features visual warnings when the target function is deleted and real-time parameter type display.
 */
const FunctionCallNode = memo(({ data, selected }: FunctionCallNodeProps) => {
    const nodeId = useNodeId();
    const { setNodes } = useReactFlow();
    const scriptId = data.__scriptId as string | undefined;

    const [functionName, setFunctionName] = useState(data.functionName ?? "");
    const [availableFunctions, setAvailableFunctions] = useState<
        Array<{ name: string; parameters: Array<{ name: string; type: LuauType }>; returnType: LuauType }>
    >([]);
    const [isFunctionDeleted, setIsFunctionDeleted] = useState(false);

    useEffect(() => {
        if (!scriptId) return;

        const sync = () => {
            const funcs = useIntellisenseStore.getState().getFunctionsForScript(scriptId);
            setAvailableFunctions(funcs.map((f) => ({ name: f.name, parameters: f.parameters, returnType: f.returnType })));
            setIsFunctionDeleted(!!functionName && !funcs.some((f) => f.name === functionName));
        };

        sync();
        return useIntellisenseStore.subscribe(sync);
    }, [scriptId, functionName]);

    useEffect(() => {
        if (data.functionName !== undefined && data.functionName !== functionName) {
            setFunctionName(data.functionName ?? "");
            setIsFunctionDeleted(false);
        }
    }, [data.functionName]);

    const updateNodeData = useCallback(
        (partial: Partial<FunctionCallNodeData>) => {
            if (!nodeId) return;
            setNodes((nodes) =>
                nodes.map((n) => (n.id === nodeId ? { ...n, data: { ...n.data, ...partial } } : n))
            );
        },
        [nodeId, setNodes]
    );

    const handleFunctionSelect = useCallback(
        (value: string) => {
            setFunctionName(value);
            setIsFunctionDeleted(false);
            updateNodeData({ functionName: value });
        },
        [updateNodeData]
    );

    const currentFunction =
        scriptId && functionName
            ? useIntellisenseStore.getState().getFunction(scriptId, functionName)
            : undefined;

    const parameters = currentFunction?.parameters ?? [];
    const returnType = currentFunction?.returnType ?? LuauType.Any;

    const paramEdges = useStore((s) =>
        s.edges.filter((e) => e.target === nodeId && e.targetHandle?.startsWith("param-"))
    );

    return (
        <NodeTemplate
            details={{
                color: {
                    background: "bg-pink-400/10",
                    border: cn("border-pink-400/30", isFunctionDeleted && "border-destructive animate-pulse"),
                    text: "text-pink-400",
                    ring: cn("ring-pink-400/40", isFunctionDeleted && "ring-destructive/50"),
                },
                icon: isFunctionDeleted ? AlertTriangle : Play,
                name: isFunctionDeleted ? "Function Deleted!" : "Call Function",
                description: isFunctionDeleted
                    ? `⚠️ Function "${functionName}" was deleted`
                    : currentFunction
                    ? `${functionName}(${parameters.map((p) => p.name).join(", ")}) → ${typeLabel(returnType)}`
                    : "Select a function to call",
                selected,
            }}
            inputs={[
                { id: "prev", label: "Prev", type: LuauType.Flow },
                ...parameters.map((param, i) => ({ id: `param-${i}`, label: param.name, type: param.type })),
            ]}
            outputs={[
                { id: "next", label: "Next", type: LuauType.Flow },
                { id: "result", label: "Result", type: returnType },
            ]}
        >
            <div className="space-y-3">
                {/* Function selector */}
                <div className="space-y-1">
                    <div className="flex items-center gap-2">
                        <SquareFunction className="h-3 w-3 text-pink-400" />
                        <span className="text-xs font-medium text-pink-400">Function</span>
                    </div>
                    <Select
                        value={typeof functionName === "string" ? functionName : ""}
                        onValueChange={handleFunctionSelect}
                        disabled={isFunctionDeleted}
                    >
                        <SelectTrigger className={cn("text-xs h-7 w-full", isFunctionDeleted && "border-destructive")}>
                            <SelectValue
                                placeholder={
                                    isFunctionDeleted
                                        ? `"${functionName}" deleted - select new function`
                                        : "Select function"
                                }
                            />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectGroup>
                                {availableFunctions.length === 0 ? (
                                    <SelectItem value="#" disabled className="text-muted-foreground italic">
                                        No functions defined yet
                                    </SelectItem>
                                ) : (
                                    availableFunctions.map((func) => (
                                        <SelectItem key={func.name} value={func.name}>
                                            <span className="font-medium text-pink-400">{func.name}</span>
                                        </SelectItem>
                                    ))
                                )}
                            </SelectGroup>
                        </SelectContent>
                    </Select>
                </div>

                {/* Deleted function warning */}
                {isFunctionDeleted && (
                    <div className="border border-destructive/50 bg-destructive/10 rounded-md p-3 space-y-2">
                        <div className="flex items-center gap-2 text-destructive text-xs font-medium">
                            <AlertTriangle className="h-3 w-3" />
                            Function Deleted
                        </div>
                        <p className="text-[10px] text-muted-foreground">
                            <span className="font-mono bg-card px-1 rounded">{functionName}</span> no longer
                            exists. Select a new function above.
                        </p>
                    </div>
                )}

                {/* Parameters */}
                {functionName && !isFunctionDeleted && (
                    <div className="border border-border rounded-md p-3 bg-card/5">
                        <div className="flex items-center gap-1 mb-2">
                            <span className="text-xs font-medium text-pink-400">Parameters</span>
                            <span className="text-[10px] text-muted-foreground">({parameters.length})</span>
                        </div>
                        {parameters.length === 0 ? (
                            <p className="text-xs text-muted-foreground text-center py-1">
                                No parameters required
                            </p>
                        ) : (
                            <div className="space-y-3">
                                {parameters.map((param, index) => {
                                    const edge = paramEdges.find((e) => e.targetHandle === `param-${index}`);
                                    const inferred: LuauType = (edge?.data?.sourceType as LuauType) ?? param.type;
                                    return (
                                        <div key={index} className="space-y-1">
                                            <div className="flex items-center justify-between">
                                                <span className="text-xs font-medium text-pink-400">{param.name}</span>
                                                <span className={cn("text-[10px] px-1.5 py-0.5 rounded font-medium", typeColorClass(inferred))}>
                                                    {typeLabel(inferred)}
                                                </span>
                                            </div>
                                            <div className="text-xs text-muted-foreground italic text-center py-1 bg-card/30 rounded">
                                                Connect value to{" "}
                                                <span className="font-mono bg-card px-1 rounded">{param.name}</span>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                )}

                {/* Empty state */}
                {!functionName && !isFunctionDeleted && (
                    <div className="border border-dashed rounded-md p-3 bg-card/5 text-center">
                        <AlertCircle className="h-4 w-4 text-muted-foreground mx-auto mb-1" />
                        <p className="text-xs text-muted-foreground">
                            Select a function above to configure parameters
                        </p>
                        <p className="text-[10px] text-muted-foreground italic mt-1">
                            First create a Function node with your logic
                        </p>
                    </div>
                )}

                {/* Return type badge */}
                {functionName && !isFunctionDeleted && (
                    <div className="border border-border rounded-md p-2 bg-card/5 text-center">
                        <span className="text-[10px] font-medium text-pink-400">Returns:</span>
                        <span className={cn("ml-1 text-xs font-mono px-1.5 py-0.5 rounded", typeColorClass(returnType))}>
                            {typeLabel(returnType)}
                        </span>
                    </div>
                )}
            </div>
        </NodeTemplate>
    );
});

FunctionCallNode.displayName = "FunctionCallNode";

(FunctionCallNode as any).getHandles = (data: FunctionCallNodeData) => {
    const scriptId = data?.__scriptId;
    const functionName = data?.functionName;

    let parameters: Array<{ name: string; type: LuauType }> = [];
    let returnType: LuauType = LuauType.Any;

    if (scriptId && functionName) {
        const func = useIntellisenseStore.getState().getFunction(scriptId, functionName);
        if (func) {
            parameters = func.parameters;
            returnType = func.returnType;
        }
    }

    return {
        inputs: [
            { id: "prev", label: "Prev", type: LuauType.Flow },
            ...parameters.map((param, i) => ({ id: `param-${i}`, label: param.name, type: param.type })),
        ],
        outputs: [
            { id: "next", label: "Next", type: LuauType.Flow },
            { id: "result", label: "Result", type: returnType },
        ],
    };
};

export default FunctionCallNode;