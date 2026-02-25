"use client";

import { memo, useCallback } from "react";
import { NodeProps, useNodeId, useReactFlow } from "@xyflow/react";
import NodeTemplate from "../../Template";
import { Snowflake } from "lucide-react";
import { LuauType } from "@/types/luau";

export interface TableIsFrozenNodeData {
    __scriptId?: string;
}

export type TableIsFrozenNodeProps = NodeProps & { data: TableIsFrozenNodeData };

/**
 * Checks if a table is frozen using `table.isfrozen()`, returning a Boolean result.
 * Pure data-flow node with no execution handles.
 * Outputs a Boolean indicating whether the table is immutable.
 */
const TableIsFrozenNode = memo(({ data, selected }: TableIsFrozenNodeProps) => {
    const nodeId = useNodeId();
    const { setNodes } = useReactFlow();

    const updateData = useCallback(
        (partial: Partial<TableIsFrozenNodeData>) => {
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
                name: "Table Is Frozen",
                description: "Checks if a table is frozen using table.isfrozen()",
                selected,
            }}
            inputs={[
                { id: "table", label: "Table", type: LuauType.Table },
            ]}
            outputs={[
                { id: "result", label: "Result", type: LuauType.Boolean },
            ]}
        />
    );
});

TableIsFrozenNode.displayName = "TableIsFrozenNode";

(TableIsFrozenNode as any).getHandles = (_data: TableIsFrozenNodeData) => ({
    inputs: [
        { id: "table", label: "Table", type: LuauType.Table },
    ],
    outputs: [
        { id: "result", label: "Result", type: LuauType.Boolean },
    ],
});

export default TableIsFrozenNode;