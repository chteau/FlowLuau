"use client";

import { memo, useCallback } from "react";
import { NodeProps, useNodeId, useReactFlow } from "@xyflow/react";
import NodeTemplate from "../../Template";
import { Trash2 } from "lucide-react";
import { LuauType } from "@/types/luau";

export interface TableClearNodeData {}

export type TableClearNodeProps = NodeProps & { data: TableClearNodeData };

/**
 * Clears all elements from a table in place using `table.clear()`.
 * Execution node with Prev and Next flow handles; mutates the table directly.
 * No data outputs since the operation modifies the table reference in place.
 */
const TableClearNode = memo(({ data, selected }: TableClearNodeProps) => {
    const nodeId = useNodeId();
    const { setNodes } = useReactFlow();

    const updateData = useCallback(
        (partial: Partial<TableClearNodeData>) => {
            setNodes((nodes) =>
                nodes.map((n) =>
                    n.id === nodeId ? { ...n, data: { ...n.data, ...partial } } : n
                )
            );
        },
        [nodeId, setNodes]
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
                icon: Trash2,
                name: "Table Clear",
                description: "Clears all elements from a table using table.clear()",
                selected,
            }}
            inputs={[
                { id: "prev", label: "Prev", type: LuauType.Flow },
                { id: "table", label: "Table", type: LuauType.Table },
            ]}
            outputs={[{ id: "next", label: "Next", type: LuauType.Flow }]}
        />
    );
});

TableClearNode.displayName = "TableClearNode";

(TableClearNode as any).getHandles = (_data: TableClearNodeData) => ({
    inputs: [
        { id: "prev", label: "Prev", type: LuauType.Flow },
        { id: "table", label: "Table", type: LuauType.Table },
    ],
    outputs: [{ id: "next", label: "Next", type: LuauType.Flow }],
});

export default TableClearNode;