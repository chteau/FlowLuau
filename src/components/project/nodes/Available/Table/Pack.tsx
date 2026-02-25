"use client";

import { memo, useCallback } from "react";
import { NodeProps, useNodeId, useReactFlow } from "@xyflow/react";
import NodeTemplate from "../../Template";
import { Package } from "lucide-react";
import { Button } from "@/components/ui/button";
import { LuauType } from "@/types/luau";

export interface TablePackNodeData {
    argCount?: number;
}

export type TablePackNodeProps = NodeProps & { data: TablePackNodeData };

/**
 * Packs variadic arguments into a table using `table.pack()`, including an `n` field with the count.
 * Argument count is adjustable to match the number of values to pack.
 * Execution node with Prev and Next flow handles; outputs the packed table.
 */
const TablePackNode = memo(({ data, selected }: TablePackNodeProps) => {
    const nodeId = useNodeId();
    const { setNodes } = useReactFlow();

    const argCount = data.argCount ?? 1;

    const updateData = useCallback(
        (partial: Partial<TablePackNodeData>) => {
            setNodes((nodes) =>
                nodes.map((n) =>
                    n.id === nodeId ? { ...n, data: { ...n.data, ...partial } } : n
                )
            );
        },
        [nodeId, setNodes]
    );

    const handleIncrement = useCallback(() => {
        updateData({ argCount: argCount + 1 });
    }, [argCount, updateData]);

    const handleDecrement = useCallback(() => {
        if (argCount > 1) {
            updateData({ argCount: argCount - 1 });
        }
    }, [argCount, updateData]);

    return (
        <NodeTemplate
            details={{
                color: {
                    background: "bg-lime-400/10",
                    border: "border-lime-400/30",
                    text: "text-lime-400",
                    ring: "ring-lime-400/40",
                },
                icon: Package,
                name: "Table Pack",
                description: "Packs values into a table using table.pack()",
                selected,
            }}
            inputs={(TablePackNode as any).getHandles(data).inputs}
            outputs={(TablePackNode as any).getHandles(data).outputs}
        >
            <div className="flex items-center gap-2">
                <Button
                    variant="outline"
                    size="icon-xs"
                    className="h-6 w-6 cursor-pointer bg-lime-400/10 hover:bg-lime-400/20"
                    onClick={handleDecrement}
                    disabled={argCount <= 1}
                >
                    −
                </Button>
                <span className="text-xs text-muted-foreground">
                    {argCount} {argCount === 1 ? "argument" : "arguments"}
                </span>
                <Button
                    variant="outline"
                    size="icon-xs"
                    className="h-6 w-6 cursor-pointer bg-lime-400/10 hover:bg-lime-400/20"
                    onClick={handleIncrement}
                >
                    +
                </Button>
            </div>
        </NodeTemplate>
    );
});

TablePackNode.displayName = "TablePackNode";

(TablePackNode as any).getHandles = (data: TablePackNodeData) => {
    const argCount = data?.argCount ?? 1;

    const inputs = [
        { id: "prev", label: "Prev", type: LuauType.Flow },
        ...Array.from({ length: argCount }, (_, i) => ({
            id: `arg-${i}`,
            label: `Arg ${i + 1}`,
            type: LuauType.Any,
        })),
    ];

    return {
        inputs,
        outputs: [
            { id: "next", label: "Next", type: LuauType.Flow },
            { id: "packed", label: "Packed", type: LuauType.Table },
        ],
    };
};

export default TablePackNode;