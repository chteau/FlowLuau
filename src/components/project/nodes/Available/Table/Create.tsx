"use client";

import { memo, useCallback } from "react";
import { NodeProps, useNodeId, useReactFlow } from "@xyflow/react";
import NodeTemplate from "../../Template";
import { Package } from "lucide-react";
import { Button } from "@/components/ui/button";
import VariableAutocomplete from "@/components/ui/variable-autocomplete";
import { LuauType } from "@/types/luau";

export interface TableCreateNodeData {
    mode?: "empty" | "filled";
    initialValue?: string;
    __scriptId?: string;
}

export type TableCreateNodeProps = NodeProps & { data: TableCreateNodeData };

/**
 * Creates a pre-sized table using `table.create(size, initialValue)`.
 * Empty mode creates a table with nil values; filled mode uses a specified initial value.
 * Pure data-flow node; outputs a Table-typed result.
 */
const TableCreateNode = memo(({ data, selected }: TableCreateNodeProps) => {
    const nodeId = useNodeId();
    const { setNodes } = useReactFlow();

    const mode = data.mode ?? "empty";
    const initialValue = data.initialValue ?? "";

    const updateData = useCallback(
        (partial: Partial<TableCreateNodeData>) => {
            setNodes((nodes) =>
                nodes.map((n) =>
                    n.id === nodeId ? { ...n, data: { ...n.data, ...partial } } : n
                )
            );
        },
        [nodeId, setNodes]
    );

    const handleModeChange = useCallback(
        (newMode: "empty" | "filled") => {
            updateData({ mode: newMode });
        },
        [updateData]
    );

    const handleInitialValueChange = useCallback(
        (value: string) => {
            updateData({ initialValue: value });
        },
        [updateData]
    );

    return (
        <NodeTemplate
            details={{
                color: {
                    background: "bg-lime-400/10",
                    border: "border-lime-400/30",
                    text: "text-lime-400",
                    ring: "ring-lime-400/40",
                },
                icon: Package,
                name: "Table Create",
                description: "Creates a pre-sized table using table.create()",
                selected,
            }}
            inputs={(TableCreateNode as any).getHandles(data).inputs}
            outputs={(TableCreateNode as any).getHandles(data).outputs}
        >
            <div className="flex gap-1">
                <Button
                    variant={mode === "empty" ? "default" : "outline"}
                    size="xs"
                    className="text-xs h-6 cursor-pointer bg-lime-400/10 hover:bg-lime-400/20"
                    onClick={() => handleModeChange("empty")}
                >
                    Empty
                </Button>
                <Button
                    variant={mode === "filled" ? "default" : "outline"}
                    size="xs"
                    className="text-xs h-6 cursor-pointer bg-lime-400/10 hover:bg-lime-400/20"
                    onClick={() => handleModeChange("filled")}
                >
                    Filled
                </Button>
            </div>

            {mode === "filled" && (
                <div className="space-y-1">
                    <VariableAutocomplete
                        scriptId={data.__scriptId ?? "unknown"}
                        value={initialValue}
                        onChange={(e) => handleInitialValueChange(e.target.value)}
                        placeholder='e.g., 0 or defaultValue'
                        filterVariables={(v) => v.type === LuauType.Any}
                        className="text-xs h-7 font-mono"
                    />
                    <p className="text-[10px] text-muted-foreground italic">
                        Initial value for all elements
                    </p>
                </div>
            )}
        </NodeTemplate>
    );
});

TableCreateNode.displayName = "TableCreateNode";

(TableCreateNode as any).getHandles = (data: TableCreateNodeData) => {
    const mode = data?.mode ?? "empty";

    const inputs = [
        { id: "size", label: "Size", type: LuauType.Number },
    ];

    if (mode === "filled") {
        inputs.push({ id: "value", label: "Initial Value", type: LuauType.Any });
    }

    return {
        inputs,
        outputs: [{ id: "result", label: "Result", type: LuauType.Table }],
    };
};

export default TableCreateNode;