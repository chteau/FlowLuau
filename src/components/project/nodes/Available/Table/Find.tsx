"use client";

import { memo, useCallback } from "react";
import { NodeProps, useNodeId, useReactFlow } from "@xyflow/react";
import NodeTemplate from "../../Template";
import { Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { LuauType } from "@/types/luau";

export interface TableFindNodeData {
    mode?: "default" | "with-index";
}

export type TableFindNodeProps = NodeProps & { data: TableFindNodeData };

/**
 * Searches for a value in a table using `table.find()`, returning the index if found.
 * Default mode searches from the beginning; with-index mode specifies a starting position.
 * Pure data-flow node; outputs the found index as Number or nil if not found.
 */
const TableFindNode = memo(({ data, selected }: TableFindNodeProps) => {
    const nodeId = useNodeId();
    const { setNodes } = useReactFlow();

    const mode = data.mode ?? "default";

    const updateData = useCallback(
        (partial: Partial<TableFindNodeData>) => {
            setNodes((nodes) =>
                nodes.map((n) =>
                    n.id === nodeId ? { ...n, data: { ...n.data, ...partial } } : n
                )
            );
        },
        [nodeId, setNodes]
    );

    const handleModeChange = useCallback(
        (newMode: "default" | "with-index") => {
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
                icon: Search,
                name: "Table Find",
                description: "Finds a value in a table using table.find()",
                selected,
            }}
            inputs={(TableFindNode as any).getHandles(data).inputs}
            outputs={(TableFindNode as any).getHandles(data).outputs}
        >
            <div className="flex gap-1">
                <Button
                    variant={mode === "default" ? "default" : "outline"}
                    size="xs"
                    className="text-xs h-6 cursor-pointer bg-lime-400/10 hover:bg-lime-400/20"
                    onClick={() => handleModeChange("default")}
                >
                    Default
                </Button>
                <Button
                    variant={mode === "with-index" ? "default" : "outline"}
                    size="xs"
                    className="text-xs h-6 cursor-pointer bg-lime-400/10 hover:bg-lime-400/20"
                    onClick={() => handleModeChange("with-index")}
                >
                    With Index
                </Button>
            </div>
        </NodeTemplate>
    );
});

TableFindNode.displayName = "TableFindNode";

(TableFindNode as any).getHandles = (data: TableFindNodeData) => {
    const mode = data?.mode ?? "default";

    const inputs = [
        { id: "table", label: "Table", type: LuauType.Table },
        { id: "value", label: "Value", type: LuauType.Any },
    ];

    if (mode === "with-index") {
        inputs.push({ id: "init", label: "Start Index", type: LuauType.Number });
    }

    return {
        inputs,
        outputs: [{ id: "result", label: "Index", type: LuauType.Number }],
    };
};

export default TableFindNode;