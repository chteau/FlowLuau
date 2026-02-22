"use client";

import { memo, useCallback, useEffect, useRef } from "react";
import { NodeProps, useNodeId, useReactFlow, useStore } from "@xyflow/react";
import NodeTemplate from "../../Template";
import { FilePenLine } from "lucide-react";
import { LuauType } from "@/types/luau";
import { Input } from "@/components/ui/input";
import { useIntellisenseStore } from "@/stores/intellisense-store";

export interface VariableSetNodeData {
    variableName?: string;
    __scriptId?: string;
}

export type VariableSetNodeProps = NodeProps & { data: VariableSetNodeData };

/**
 * Variable assignment node that stores an incoming value into a named variable.
 * Infers the variable's Luau type from the connected input edge at runtime.
 * Features Prev/Next flow handles and a polymorphic Value input of type Any.
 */
const VariableSetNode = memo(({ data, selected }: VariableSetNodeProps) => {
    const nodeId = useNodeId();
    const { setNodes } = useReactFlow();
    const scriptId = data.__scriptId;
    const variableName = data.variableName ?? "";
    const previousNameRef = useRef<string | undefined>(variableName);

    const inferredType = useStore((s) => {
        const edge = s.edges.find((e) => e.target === nodeId && e.targetHandle === "value");
        return (edge?.data?.sourceType as LuauType | undefined) ?? LuauType.Any;
    });

    const updateVariableName = useCallback(
        (newName: string) => {
            setNodes((nodes) =>
                nodes.map((n) =>
                    n.id === nodeId ? { ...n, data: { ...n.data, variableName: newName } } : n
                )
            );
        },
        [nodeId, setNodes]
    );

    const handleBlur = useCallback(() => {
        if (!scriptId) return;

        let newName = (data.variableName ?? "").trim();
        if (!newName) {
            newName = `var${Date.now().toString(36).slice(-4)}`;
            updateVariableName(newName);
        }

        const oldName = previousNameRef.current?.trim();
        if (newName === oldName) return;

        if (oldName) useIntellisenseStore.getState().removeVariable(scriptId, oldName);
        useIntellisenseStore.getState().addVariable(scriptId, { name: newName, type: inferredType });
        previousNameRef.current = newName;
    }, [scriptId, data.variableName, inferredType, updateVariableName]);

    // Keep the variable registry in sync whenever name or inferred type changes.
    useEffect(() => {
        const trimmed = variableName.trim();
        if (!scriptId || !trimmed) return;

        const shouldUpdate =
            trimmed !== previousNameRef.current || inferredType !== LuauType.Any;

        if (shouldUpdate) {
            useIntellisenseStore.getState().addVariable(scriptId, { name: trimmed, type: inferredType });
            previousNameRef.current = trimmed;
        }

        return () => {
            if (scriptId && previousNameRef.current) {
                useIntellisenseStore.getState().removeVariable(scriptId, previousNameRef.current);
            }
        };
    }, [scriptId, variableName, inferredType]);

    const typeLabel = inferredType !== LuauType.Any
        ? inferredType === LuauType.Nil ? "nil" : inferredType
        : null;

    return (
        <NodeTemplate
            details={{
                color: {
                    background: "bg-red-400/10",
                    border: "border-red-400/30",
                    text: "text-red-400",
                    ring: "ring-red-400/40",
                },
                icon: FilePenLine,
                name: "Set Variable",
                description: typeLabel
                    ? `Assigns ${typeLabel} to "${variableName || "variable"}"`
                    : `Assigns value to "${variableName || "variable"}"`,
                selected,
            }}
            inputs={[
                { id: "prev", label: "Prev", type: LuauType.Flow },
                { id: "value", label: "Value", type: LuauType.Any },
            ]}
            outputs={[{ id: "next", label: "Next", type: LuauType.Flow }]}
        >
            <div className="space-y-2">
                <div className="flex flex-col gap-1">
                    <label className="text-[10px] text-muted-foreground">
                        Variable Name
                        {typeLabel && (
                            <span className="text-[9px] text-red-400/80 ml-1">
                                (Type: {typeLabel})
                            </span>
                        )}
                    </label>
                    <Input
                        value={variableName}
                        onChange={(e) => updateVariableName(e.target.value)}
                        onBlur={handleBlur}
                        className="h-7 text-xs bg-background border-border font-mono"
                        placeholder={typeLabel ? `e.g., playerScore (${typeLabel})` : "variable"}
                    />
                </div>
            </div>
        </NodeTemplate>
    );
});

VariableSetNode.displayName = "VariableSetNode";

(VariableSetNode as any).getHandles = (_data: VariableSetNodeData) => ({
    inputs: [
        { id: "prev", label: "Prev", type: LuauType.Flow },
        { id: "value", label: "Value", type: LuauType.Any },
    ],
    outputs: [{ id: "next", label: "Next", type: LuauType.Flow }],
});

export default VariableSetNode;