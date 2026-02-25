"use client";

import { memo, useCallback } from "react";
import { NodeProps, useNodeId, useReactFlow } from "@xyflow/react";
import NodeTemplate from "../../Template";
import { ArrowUpDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import VariableAutocomplete from "@/components/ui/variable-autocomplete";
import { LuauType } from "@/types/luau";

export interface TableSortNodeData {
    sortMode?: "default" | "custom";
    compareFunction?: string;
    __scriptId?: string;
}

export type TableSortNodeProps = NodeProps & { data: TableSortNodeData };

/**
 * Sorts a table in place using Luau's `table.sort()` function.
 * Default mode uses natural ordering; custom mode accepts a comparison function.
 * Execution node with Prev and Next flow handles.
 */
const TableSortNode = memo(({ data, selected }: TableSortNodeProps) => {
    const nodeId = useNodeId();
    const { setNodes } = useReactFlow();

    const sortMode = data.sortMode ?? "default";
    const compareFunction = data.compareFunction ?? "";

    const updateData = useCallback(
        (partial: Partial<TableSortNodeData>) => {
            setNodes((nodes) =>
                nodes.map((n) =>
                    n.id === nodeId ? { ...n, data: { ...n.data, ...partial } } : n
                )
            );
        },
        [nodeId, setNodes]
    );

    const handleModeChange = useCallback(
        (newMode: "default" | "custom") => {
            updateData({ sortMode: newMode });
        },
        [updateData]
    );

    const handleCompareFunctionChange = useCallback(
        (value: string) => {
            updateData({ compareFunction: value });
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
                icon: ArrowUpDown,
                name: "Table Sort",
                description: "Sorts a table in place using table.sort()",
                selected,
            }}
            inputs={(TableSortNode as any).getHandles(data).inputs}
            outputs={(TableSortNode as any).getHandles(data).outputs}
        >
            <div className="flex gap-1">
                <Button
                    variant={sortMode === "default" ? "default" : "outline"}
                    size="xs"
                    className="text-xs h-6 cursor-pointer bg-lime-400/10 hover:bg-lime-400/20"
                    onClick={() => handleModeChange("default")}
                >
                    Default
                </Button>
                <Button
                    variant={sortMode === "custom" ? "default" : "outline"}
                    size="xs"
                    className="text-xs h-6 cursor-pointer bg-lime-400/10 hover:bg-lime-400/20"
                    onClick={() => handleModeChange("custom")}
                >
                    Custom
                </Button>
            </div>

            {sortMode === "custom" && (
                <div className="space-y-1">
                    <VariableAutocomplete
                        scriptId={data.__scriptId ?? "unknown"}
                        value={compareFunction}
                        onChange={(e) => handleCompareFunctionChange(e.target.value)}
                        placeholder='e.g., function(a, b) return a < b end'
                        filterVariables={(v) => v.type === LuauType.Any || v.type === LuauType.Function}
                        className="text-xs h-7 font-mono"
                    />
                    <p className="text-[10px] text-muted-foreground italic">
                        Comparison function: <code className="font-mono bg-muted px-1 rounded">(a, b) → boolean</code>
                    </p>
                </div>
            )}
        </NodeTemplate>
    );
});

TableSortNode.displayName = "TableSortNode";

(TableSortNode as any).getHandles = (data: TableSortNodeData) => {
    const sortMode = data?.sortMode ?? "default";

    const inputs = [
        { id: "prev", label: "Prev", type: LuauType.Flow },
        { id: "table", label: "Table", type: LuauType.Table },
    ];

    if (sortMode === "custom") {
        inputs.push({ id: "compare", label: "Compare Fn", type: LuauType.Any });
    }

    return {
        inputs,
        outputs: [{ id: "next", label: "Next", type: LuauType.Flow }],
    };
};

export default TableSortNode;