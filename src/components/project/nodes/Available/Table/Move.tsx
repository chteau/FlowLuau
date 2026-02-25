"use client";

import { memo, useCallback } from "react";
import { NodeProps, useNodeId, useReactFlow } from "@xyflow/react";
import NodeTemplate from "../../Template";
import { ArrowRightLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { LuauType } from "@/types/luau";

export interface TableMoveNodeData {
    mode?: "same-table" | "different-table";
}

export type TableMoveNodeProps = NodeProps & { data: TableMoveNodeData };

/**
 * Moves elements within or between tables using `table.move()`.
 * Same-table mode omits the target table input; different-table mode exposes it.
 * Execution node with Prev and Next flow handles; mutates table(s) in place.
 */
const TableMoveNode = memo(({ data, selected }: TableMoveNodeProps) => {
    const nodeId = useNodeId();
    const { setNodes } = useReactFlow();

    const mode = data.mode ?? "same-table";

    const updateData = useCallback(
        (partial: Partial<TableMoveNodeData>) => {
            setNodes((nodes) =>
                nodes.map((n) =>
                    n.id === nodeId ? { ...n, data: { ...n.data, ...partial } } : n
                )
            );
        },
        [nodeId, setNodes]
    );

    const handleModeChange = useCallback(
        (newMode: "same-table" | "different-table") => {
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
                icon: ArrowRightLeft,
                name: "Table Move",
                description: "Moves elements within or between tables using table.move()",
                selected,
            }}
            inputs={(TableMoveNode as any).getHandles(data).inputs}
            outputs={(TableMoveNode as any).getHandles(data).outputs}
        >
            <div className="flex gap-1">
                <Button
                    variant={mode === "same-table" ? "default" : "outline"}
                    size="xs"
                    className="text-xs h-6 cursor-pointer bg-lime-400/10 hover:bg-lime-400/20"
                    onClick={() => handleModeChange("same-table")}
                >
                    Same Table
                </Button>
                <Button
                    variant={mode === "different-table" ? "default" : "outline"}
                    size="xs"
                    className="text-xs h-6 cursor-pointer bg-lime-400/10 hover:bg-lime-400/20"
                    onClick={() => handleModeChange("different-table")}
                >
                    Different Table
                </Button>
            </div>
        </NodeTemplate>
    );
});

TableMoveNode.displayName = "TableMoveNode";

(TableMoveNode as any).getHandles = (data: TableMoveNodeData) => {
    const mode = data?.mode ?? "same-table";

    const inputs = [
        { id: "prev", label: "Prev", type: LuauType.Flow },
        { id: "source", label: "Source", type: LuauType.Table },
        { id: "first", label: "First Index", type: LuauType.Number },
        { id: "last", label: "Last Index", type: LuauType.Number },
        { id: "dest", label: "Dest Index", type: LuauType.Number },
    ];

    if (mode === "different-table") {
        inputs.push({ id: "target", label: "Target", type: LuauType.Table });
    }

    return {
        inputs,
        outputs: [{ id: "next", label: "Next", type: LuauType.Flow }],
    };
};

export default TableMoveNode;