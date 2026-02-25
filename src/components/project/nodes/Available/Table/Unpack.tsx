"use client";

import { memo, useCallback } from "react";
import { NodeProps, useNodeId, useReactFlow } from "@xyflow/react";
import NodeTemplate from "../../Template";
import { List } from "lucide-react";
import { Button } from "@/components/ui/button";
import { LuauType } from "@/types/luau";

export interface TableUnpackNodeData {
    mode?: "all" | "range";
    __scriptId?: string;
}

export type TableUnpackNodeProps = NodeProps & { data: TableUnpackNodeData };

/**
 * Unpacks a table into multiple values using `table.unpack()`.
 * All mode returns all elements; range mode exposes first and last index handles.
 * Execution node with Prev and Next flow handles; outputs variadic values.
 */
const TableUnpackNode = memo(({ data, selected }: TableUnpackNodeProps) => {
    const nodeId = useNodeId();
    const { setNodes } = useReactFlow();

    const mode = data.mode ?? "all";

    const updateData = useCallback(
        (partial: Partial<TableUnpackNodeData>) => {
            setNodes((nodes) =>
                nodes.map((n) =>
                    n.id === nodeId ? { ...n, data: { ...n.data, ...partial } } : n
                )
            );
        },
        [nodeId, setNodes]
    );

    const handleModeChange = useCallback(
        (newMode: "all" | "range") => {
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
                icon: List,
                name: "Table Unpack",
                description: "Unpacks table elements into multiple values using table.unpack()",
                selected,
            }}
            inputs={(TableUnpackNode as any).getHandles(data).inputs}
            outputs={(TableUnpackNode as any).getHandles(data).outputs}
        >
            <div className="flex gap-1">
                <Button
                    variant={mode === "all" ? "default" : "outline"}
                    size="xs"
                    className="text-xs h-6 cursor-pointer bg-lime-400/10 hover:bg-lime-400/20"
                    onClick={() => handleModeChange("all")}
                >
                    All
                </Button>
                <Button
                    variant={mode === "range" ? "default" : "outline"}
                    size="xs"
                    className="text-xs h-6 cursor-pointer bg-lime-400/10 hover:bg-lime-400/20"
                    onClick={() => handleModeChange("range")}
                >
                    Range
                </Button>
            </div>
        </NodeTemplate>
    );
});

TableUnpackNode.displayName = "TableUnpackNode";

(TableUnpackNode as any).getHandles = (data: TableUnpackNodeData) => {
    const mode = data?.mode ?? "all";

    const inputs = [
        { id: "prev", label: "Prev", type: LuauType.Flow },
        { id: "table", label: "Table", type: LuauType.Table },
    ];

    if (mode === "range") {
        inputs.push(
            { id: "f", label: "First", type: LuauType.Number },
            { id: "t", label: "Last", type: LuauType.Number }
        );
    }

    return {
        inputs,
        outputs: [
            { id: "next", label: "Next", type: LuauType.Flow },
            { id: "values", label: "Values", type: LuauType.Any },
        ],
    };
};

export default TableUnpackNode;