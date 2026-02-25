"use client";

import { memo, useCallback, useEffect, useState } from "react";
import { NodeProps, useNodeId, useReactFlow } from "@xyflow/react";
import NodeTemplate from "../../Template";
import { SquareFunction } from "lucide-react";
import { LuauType } from "@/types/luau";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
    Select,
    SelectContent,
    SelectGroup,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { useIntellisenseStore } from "@/stores/intellisense-store";

/** Represents a single parameter in a function signature with name and Luau type. */
export interface FunctionParameter {
    name: string;
    type: LuauType;
}

export interface FunctionDefinitionNodeData {
    functionName?: string;
    parameters?: FunctionParameter[];
    returnType?: LuauType;
    __scriptId?: string;
}

export type FunctionDefinitionNodeProps = NodeProps & { data: FunctionDefinitionNodeData };

/**
 * Function definition node that declares a named Luau function with parameters and return type.
 * Registers the function in the intellisense store for use by FunctionCall nodes.
 * Features Prev/Next flow handles to control execution order of function definitions.
 */
const FunctionDefinitionNode = memo(({ data, selected }: FunctionDefinitionNodeProps) => {
    const nodeId = useNodeId();
    const { setNodes } = useReactFlow();
    const scriptId = data.__scriptId;

    const [functionName, setFunctionName] = useState(data.functionName ?? "");
    const [parameters, setParameters] = useState<FunctionParameter[]>(data.parameters ?? []);
    const [returnType, setReturnType] = useState<LuauType>(data.returnType ?? LuauType.Nil);

    const updateData = useCallback(
        (partial: Partial<FunctionDefinitionNodeData>) => {
            setNodes((nodes) =>
                nodes.map((n) =>
                    n.id === nodeId ? { ...n, data: { ...n.data, ...partial } } : n
                )
            );
        },
        [nodeId, setNodes]
    );

    useEffect(() => {
        if (!scriptId || !functionName.trim()) return;
        useIntellisenseStore.getState().addFunction(scriptId, {
            name: functionName.trim(),
            parameters,
            returnType,
            nodeId: nodeId!,
        });
        return () => {
            if (scriptId && functionName.trim()) {
                useIntellisenseStore.getState().removeFunction(scriptId, functionName.trim());
            }
        };
    }, [scriptId, functionName, parameters, returnType, nodeId]);

    const handleNameBlur = useCallback(() => {
        const trimmed = functionName.trim();
        if (!trimmed) {
            setFunctionName("myFunction");
            updateData({ functionName: "myFunction" });
        } else {
            updateData({ functionName: trimmed });
        }
    }, [functionName, updateData]);

    const addParameter = useCallback(() => {
        const newParams = [...parameters, { name: `param${parameters.length + 1}`, type: LuauType.Any }];
        setParameters(newParams);
        updateData({ parameters: newParams });
    }, [parameters, updateData]);

    const removeParameter = useCallback(
        (index: number) => {
            const newParams = parameters.filter((_, i) => i !== index);
            setParameters(newParams);
            updateData({ parameters: newParams });
        },
        [parameters, updateData]
    );

    const updateParameter = useCallback(
        (index: number, partial: Partial<FunctionParameter>) => {
            const newParams = parameters.map((p, i) => (i === index ? { ...p, ...partial } : p));
            setParameters(newParams);
            updateData({ parameters: newParams });
        },
        [parameters, updateData]
    );

    const handleReturnTypeChange = useCallback(
        (value: LuauType) => {
            setReturnType(value);
            updateData({ returnType: value });
        },
        [updateData]
    );

    return (
        <NodeTemplate
            details={{
                color: {
                    background: "bg-pink-400/10",
                    border: "border-pink-400/30",
                    text: "text-pink-400",
                    ring: "ring-pink-400/40",
                },
                icon: SquareFunction,
                name: "Function",
                description: functionName.trim()
                    ? `function ${functionName.trim()}(${parameters.map((p) => p.name).join(", ")})`
                    : "Define a reusable function.",
                selected,
            }}
            inputs={[{ id: "prev", label: "Prev", type: LuauType.Flow }]}
            outputs={[
                { id: "body", label: "Body", type: LuauType.Flow },
                { id: "next", label: "Next", type: LuauType.Flow }
            ]}
        >
            <div className="space-y-3">
                {/* Function name */}
                <div className="flex flex-col gap-1">
                    <label className="text-[10px] text-muted-foreground">Function Name</label>
                    <Input
                        value={functionName}
                        onChange={(e) => setFunctionName(e.target.value)}
                        onBlur={handleNameBlur}
                        className="h-7 text-xs bg-background border-border font-mono"
                        placeholder="myFunction"
                    />
                </div>

                {/* Return type */}
                <div className="flex flex-col gap-1">
                    <label className="text-[10px] text-muted-foreground">Return Type</label>
                    <Select value={returnType} onValueChange={handleReturnTypeChange}>
                        <SelectTrigger className="text-xs h-7 w-full">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectGroup>
                                {Object.values(LuauType).map((t) => (
                                    <SelectItem key={t} value={t}>
                                        {t === LuauType.Nil ? "nil" : t}
                                    </SelectItem>
                                ))}
                            </SelectGroup>
                        </SelectContent>
                    </Select>
                </div>

                {/* Parameters */}
                <div className="flex flex-col gap-2">
                    <div className="flex items-center justify-between">
                        <label className="text-[10px] text-muted-foreground">
                            Parameters ({parameters.length})
                        </label>
                        <Button
                            size="xs"
                            variant="outline"
                            className="h-5 text-[10px] px-2"
                            onClick={addParameter}
                        >
                            + Add
                        </Button>
                    </div>

                    {parameters.map((param, index) => (
                        <div key={index} className="flex gap-1 items-center">
                            <Input
                                value={param.name}
                                onChange={(e) => updateParameter(index, { name: e.target.value })}
                                className="h-6 text-xs bg-background border-border font-mono flex-1"
                                placeholder="name"
                            />
                            <Select
                                value={param.type}
                                onValueChange={(v) => updateParameter(index, { type: v as LuauType })}
                            >
                                <SelectTrigger className="h-6 text-xs w-24">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectGroup>
                                        {Object.values(LuauType).map((t) => (
                                            <SelectItem key={t} value={t}>
                                                {t === LuauType.Nil ? "nil" : t}
                                            </SelectItem>
                                        ))}
                                    </SelectGroup>
                                </SelectContent>
                            </Select>
                            <Button
                                size="xs"
                                variant="ghost"
                                className="h-6 w-6 p-0 text-muted-foreground hover:text-destructive"
                                onClick={() => removeParameter(index)}
                            >
                                ×
                            </Button>
                        </div>
                    ))}
                </div>
            </div>
        </NodeTemplate>
    );
});

FunctionDefinitionNode.displayName = "FunctionDefinitionNode";

(FunctionDefinitionNode as any).getHandles = (_data: FunctionDefinitionNodeData) => ({
    inputs: [{ id: "prev", label: "Prev", type: LuauType.Flow }],
    outputs: [
        { id: "body", label: "Body", type: LuauType.Flow },
        { id: "next", label: "Next", type: LuauType.Flow }
    ],
});

export default FunctionDefinitionNode;