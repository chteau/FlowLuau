"use client";

import { memo, useCallback } from "react";
import { NodeProps, useNodeId, useReactFlow } from "@xyflow/react";
import NodeTemplate from "../../Template";
import { ListOrdered } from "lucide-react";
import { Button } from "@/components/ui/button";
import { LuauType } from "@/types/luau";

export interface TableForeachNodeData {
    hasReturn?: boolean;
    __scriptId?: string;
}

export type TableForeachNodeProps = NodeProps & { data: TableForeachNodeData };

/**
 * Iterates over a table using `table.foreach()`, calling a function for each key-value pair.
 * Optional return output captures the result from the iteration function.
 * Execution node with Prev/Next flow handles and configurable return output.
 */
const TableForeachNode = memo(({ data, selected }: TableForeachNodeProps) => {
    const nodeId = useNodeId();
    const { setNodes } = useReactFlow();

    const hasReturn = data.hasReturn ?? false;

    const updateData = useCallback(
        (partial: Partial<TableForeachNodeData>) => {
            setNodes((nodes) =>
                nodes.map((n) =>
                    n.id === nodeId ? { ...n, data: { ...n.data, ...partial } } : n
                )
            );
        },
        [nodeId, setNodes]
    );

    const toggleHasReturn = useCallback(() => {
        updateData({ hasReturn: !hasReturn });
    }, [hasReturn, updateData]);

    return (
        <NodeTemplate
            details={{
                color: {
                    background: "bg-lime-400/10",
                    border: "border-lime-400/30",
                    text: "text-lime-400",
                    ring: "ring-lime-400/40",
                },
                icon: ListOrdered,
                name: "Table Foreach",
                description: "Iterates over table key-value pairs using table.foreach()",
                selected,
            }}
            inputs={[
                { id: "prev", label: "Prev", type: LuauType.Flow },
                { id: "table", label: "Table", type: LuauType.Table },
                { id: "fn", label: "Function", type: LuauType.Any },
            ]}
            outputs={[
                { id: "next", label: "Next", type: LuauType.Flow },
                ...(hasReturn ? [{ id: "result", label: "Result", type: LuauType.Any }] : []),
            ]}
        >
            <div className="flex justify-between items-center pt-1">
                <span className="text-xs text-muted-foreground">Return result</span>
                <Button
                    variant={hasReturn ? "default" : "outline"}
                    size="sm"
                    className="text-xs h-6 px-2 cursor-pointer bg-lime-400/10 hover:bg-lime-400/20"
                    onClick={toggleHasReturn}
                >
                    {hasReturn ? "ON" : "OFF"}
                </Button>
            </div>
        </NodeTemplate>
    );
});

TableForeachNode.displayName = "TableForeachNode";

(TableForeachNode as any).getHandles = (data: TableForeachNodeData) => ({
    inputs: [
        { id: "prev", label: "Prev", type: LuauType.Flow },
        { id: "table", label: "Table", type: LuauType.Table },
        { id: "fn", label: "Function", type: LuauType.Any },
    ],
    outputs: [
        { id: "next", label: "Next", type: LuauType.Flow },
        ...(data.hasReturn ? [{ id: "result", label: "Result", type: LuauType.Any }] : []),
    ],
});

export default TableForeachNode;