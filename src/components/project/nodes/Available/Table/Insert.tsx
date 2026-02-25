"use client";

import { memo, useCallback } from "react";
import { NodeProps, useNodeId, useReactFlow } from "@xyflow/react";
import NodeTemplate from "../../Template";
import { ListPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { LuauType } from "@/types/luau";

export interface TableInsertNodeData {
    mode?: "append" | "at-index";
    __scriptId?: string;
}

export type TableInsertNodeProps = NodeProps & { data: TableInsertNodeData };

/**
 * Calls `table.insert` to append a value or insert at a specific index.
 * Append mode omits the index input; at-index mode exposes a Number index handle.
 * Execution node with Prev and Next flow handles.
 */
const TableInsertNode = memo(({ data, selected }: TableInsertNodeProps) => {
    const nodeId = useNodeId();
    const { setNodes } = useReactFlow();

    const mode = data.mode ?? "append";

    const updateData = useCallback(
        (partial: Partial<TableInsertNodeData>) => {
            setNodes((nodes) =>
                nodes.map((n) =>
                    n.id === nodeId ? { ...n, data: { ...n.data, ...partial } } : n
                )
            );
        },
        [nodeId, setNodes]
    );

    const handleModeChange = useCallback(
        (newMode: "append" | "at-index") => {
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
                icon: ListPlus,
                name: "Table Insert",
                description: "Inserts a value into a table using table.insert()",
                selected,
            }}
            inputs={(TableInsertNode as any).getHandles(data).inputs}
            outputs={(TableInsertNode as any).getHandles(data).outputs}
        >
            <div className="flex gap-1">
                <Button
                    variant={mode === "append" ? "default" : "outline"}
                    size="xs"
                    className="text-xs h-6 cursor-pointer bg-lime-400/10 hover:bg-lime-400/20"
                    onClick={() => handleModeChange("append")}
                >
                    Append
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

TableInsertNode.displayName = "TableInsertNode";

(TableInsertNode as any).getHandles = (data: TableInsertNodeData) => {
    const mode = data?.mode ?? "append";

    if (mode === "append") {
        return {
            inputs: [
                { id: "prev", label: "Prev", type: LuauType.Flow },
                { id: "table", label: "Table", type: LuauType.Table },
                { id: "value", label: "Value", type: LuauType.Any },
            ],
            outputs: [
                { id: "next", label: "Next", type: LuauType.Flow },
            ],
        };
    }

    return {
        inputs: [
            { id: "prev", label: "Prev", type: LuauType.Flow },
            { id: "table", label: "Table", type: LuauType.Table },
            { id: "index", label: "Index", type: LuauType.Number },
            { id: "value", label: "Value", type: LuauType.Any },
        ],
        outputs: [
            { id: "next", label: "Next", type: LuauType.Flow },
        ],
    };
};

export default TableInsertNode;