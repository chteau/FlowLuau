"use client";

import { memo, useCallback, useMemo } from "react";
import { NodeProps, useNodeId, useReactFlow } from "@xyflow/react";
import NodeTemplate from "../../Template";
import { FileText } from "lucide-react";
import { LuauType } from "@/types/luau";
import VariableAutocomplete from "@/components/ui/variable-autocomplete";
import { useIntellisenseStore } from "@/stores/intellisense-store";
import { useShallow } from "zustand/shallow";

export interface VariableGetNodeData {
    variableName?: string;
    __scriptId?: string;
}

export type VariableGetNodeProps = NodeProps & { data: VariableGetNodeData };

/**
 * Variable read node that retrieves a named variable's value from script scope.
 * Output type is dynamically inferred from the variable registry at runtime.
 * Features a single Value output handle with type matching the resolved variable.
 */
const VariableGetNode = memo(({ data, selected }: VariableGetNodeProps) => {
    const nodeId = useNodeId();
    const { setNodes } = useReactFlow();
    const scriptId = data.__scriptId;
    const variableName = data.variableName ?? "";

    const variables = useIntellisenseStore(
        useShallow((s) => (scriptId ? s.getVariablesForScript(scriptId) : []))
    );

    const inferredType = useMemo(() => {
        if (!scriptId || !variableName.trim()) return LuauType.Any;
        return variables.find((v) => v.name === variableName.trim())?.type ?? LuauType.Any;
    }, [scriptId, variableName, variables]);

    const updateVariableName = useCallback(
        (newName: string) => {
            setNodes((nodes) =>
                nodes.map((n) =>
                    n.id === nodeId
                        ? { ...n, data: { ...n.data, variableName: newName.trim() || "variable" } }
                        : n
                )
            );
        },
        [nodeId, setNodes]
    );

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
                icon: FileText,
                name: "Get Variable",
                description: typeLabel
                    ? `Reads ${typeLabel} value of "${variableName || "variable"}"`
                    : `Reads value of "${variableName || "variable"}"`,
                selected: !!selected,
            }}
            outputs={[
                {
                    id: "value",
                    label: typeLabel ? `Value (${typeLabel})` : "Value",
                    type: inferredType,
                },
            ]}
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
                    <VariableAutocomplete
                        scriptId={scriptId ?? "unknown"}
                        value={variableName}
                        onChange={(e) => updateVariableName(e.target.value)}
                        onBlur={(e) => {
                            if (!e.target.value.trim()) updateVariableName("variable");
                        }}
                        className="h-7 text-xs bg-background border-border font-mono"
                        placeholder={typeLabel ? `e.g., playerScore (${typeLabel})` : "variable"}
                        filterVariables={(v) =>
                            inferredType === LuauType.Any ||
                            v.type === inferredType ||
                            v.type === LuauType.Any
                        }
                    />
                </div>
            </div>
        </NodeTemplate>
    );
});

VariableGetNode.displayName = "VariableGetNode";

(VariableGetNode as any).getHandles = (data: VariableGetNodeData) => {
    const scriptId = data?.__scriptId;
    const variableName = data?.variableName?.trim() ?? "";

    let inferredType = LuauType.Any;
    if (scriptId && variableName) {
        inferredType =
            useIntellisenseStore.getState().getVariable(scriptId, variableName)?.type ??
            LuauType.Any;
    }

    return {
        inputs: [],
        outputs: [{ id: "value", label: "Value", type: inferredType }],
    };
};

export default VariableGetNode;