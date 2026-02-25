"use client";

import { memo, useCallback } from "react";
import { NodeProps, useNodeId, useReactFlow } from "@xyflow/react";
import NodeTemplate from "../../Template";
import { Snowflake } from "lucide-react";
import { LuauType } from "@/types/luau";

export interface TableFreezeNodeData {
    __scriptId?: string;
}

export type TableFreezeNodeProps = NodeProps & { data: TableFreezeNodeData };

/**
 * Makes a table immutable using `table.freeze()`, preventing any further modifications.
 * Execution node with Prev and Next flow handles; outputs the frozen table reference.
 * Any attempts to modify the frozen table after this will raise a runtime error.
 */
const TableFreezeNode = memo(({ data, selected }: TableFreezeNodeProps) => {
    const nodeId = useNodeId();
    const { setNodes } = useReactFlow();

    const updateData = useCallback(
        (partial: Partial<TableFreezeNodeData>) => {
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
                icon: Snowflake,
                name: "Table Freeze",
                description: "Makes a table immutable using table.freeze()",
                selected,
            }}
            inputs={[
                { id: "prev", label: "Prev", type: LuauType.Flow },
                { id: "table", label: "Table", type: LuauType.Table },
            ]}
            outputs={[
                { id: "next", label: "Next", type: LuauType.Flow },
                { id: "frozen", label: "Frozen", type: LuauType.Table },
            ]}
        />
    );
});

TableFreezeNode.displayName = "TableFreezeNode";

(TableFreezeNode as any).getHandles = (_data: TableFreezeNodeData) => ({
    inputs: [
        { id: "prev", label: "Prev", type: LuauType.Flow },
        { id: "table", label: "Table", type: LuauType.Table },
    ],
    outputs: [
        { id: "next", label: "Next", type: LuauType.Flow },
        { id: "frozen", label: "Frozen", type: LuauType.Table },
    ],
});

export default TableFreezeNode;