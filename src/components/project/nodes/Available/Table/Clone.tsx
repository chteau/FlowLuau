"use client";

import { memo, useCallback } from "react";
import { NodeProps, useNodeId, useReactFlow } from "@xyflow/react";
import NodeTemplate from "../../Template";
import { Copy } from "lucide-react";
import { LuauType } from "@/types/luau";

export interface TableCloneNodeData {
    __scriptId?: string;
}

export type TableCloneNodeProps = NodeProps & { data: TableCloneNodeData };

/**
 * Creates a shallow copy of a table using `table.clone()`.
 * Pure data-flow node with no execution handles.
 * Outputs the cloned table typed as Table.
 */
const TableCloneNode = memo(({ data, selected }: TableCloneNodeProps) => {
    const nodeId = useNodeId();
    const { setNodes } = useReactFlow();

    const updateData = useCallback(
        (partial: Partial<TableCloneNodeData>) => {
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
                icon: Copy,
                name: "Table Clone",
                description: "Creates a shallow copy of a table using table.clone()",
                selected,
            }}
            inputs={[
                { id: "table", label: "Table", type: LuauType.Table },
            ]}
            outputs={[
                { id: "result", label: "Cloned", type: LuauType.Table },
            ]}
        />
    );
});

TableCloneNode.displayName = "TableCloneNode";

(TableCloneNode as any).getHandles = (_data: TableCloneNodeData) => ({
    inputs: [
        { id: "table", label: "Table", type: LuauType.Table },
    ],
    outputs: [
        { id: "result", label: "Cloned", type: LuauType.Table },
    ],
});

export default TableCloneNode;