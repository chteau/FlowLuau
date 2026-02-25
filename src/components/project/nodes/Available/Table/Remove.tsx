"use client";

import { memo, useCallback } from "react";
import { NodeProps, useNodeId, useReactFlow } from "@xyflow/react";
import NodeTemplate from "../../Template";
import { ListMinus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { LuauType } from "@/types/luau";

export interface TableRemoveNodeData {
    mode?: "last" | "at-index";
}

export type TableRemoveNodeProps = NodeProps & { data: TableRemoveNodeData };

/**
 * Calls `table.remove` to remove the last element or an element at a specific index.
 * Last mode omits the index input; at-index mode exposes a Number index handle.
 * Execution node; outputs the removed value and the Next flow.
 */
const TableRemoveNode = memo(({ data, selected }: TableRemoveNodeProps) => {
    const nodeId = useNodeId();
    const { setNodes } = useReactFlow();

    const mode = data.mode ?? "last";

    const updateData = useCallback(
        (partial: Partial<TableRemoveNodeData>) => {
            setNodes((nodes) =>
                nodes.map((n) =>
                    n.id === nodeId ? { ...n, data: { ...n.data, ...partial } } : n
                )
            );
        },
        [nodeId, setNodes]
    );

    const handleModeChange = useCallback(
        (newMode: "last" | "at-index") => {
            updateData({ mode: newMode });
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
                icon: ListMinus,
                name: "Table Remove",
                description: "Removes an element from a table using table.remove()",
                selected,
            }}
            inputs={(TableRemoveNode as any).getHandles(data).inputs}
            outputs={(TableRemoveNode as any).getHandles(data).outputs}
        >
            <div className="flex gap-1">
                <Button
                    variant={mode === "last" ? "default" : "outline"}
                    size="xs"
                    className="text-xs h-6 cursor-pointer bg-lime-400/10 hover:bg-lime-400/20"
                    onClick={() => handleModeChange("last")}
                >
                    Last
                </Button>
                <Button
                    variant={mode === "at-index" ? "default" : "outline"}
                    size="xs"
                    className="text-xs h-6 cursor-pointer bg-lime-400/10 hover:bg-lime-400/20"
                    onClick={() => handleModeChange("at-index")}
                >
                    At Index
                </Button>
            </div>
        </NodeTemplate>
    );
});

TableRemoveNode.displayName = "TableRemoveNode";

(TableRemoveNode as any).getHandles = (data: TableRemoveNodeData) => {
    const mode = data?.mode ?? "last";

    if (mode === "last") {
        return {
            inputs: [
                { id: "prev", label: "Prev", type: LuauType.Flow },
                { id: "table", label: "Table", type: LuauType.Table },
            ],
            outputs: [
                { id: "next", label: "Next", type: LuauType.Flow },
                { id: "value", label: "Removed", type: LuauType.Any },
            ],
        };
    }

    return {
        inputs: [
            { id: "prev", label: "Prev", type: LuauType.Flow },
            { id: "table", label: "Table", type: LuauType.Table },
            { id: "index", label: "Index", type: LuauType.Number },
        ],
        outputs: [
            { id: "next", label: "Next", type: LuauType.Flow },
            { id: "value", label: "Removed", type: LuauType.Any },
        ],
    };
};

export default TableRemoveNode;