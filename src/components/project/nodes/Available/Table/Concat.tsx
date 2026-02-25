"use client";
import { memo, useState, useCallback } from "react";
import { NodeProps, useNodeId, useReactFlow } from "@xyflow/react";
import NodeTemplate from "../../Template";
import { Rows } from "lucide-react";
import { Button } from "@/components/ui/button";
import VariableAutocomplete from "@/components/ui/variable-autocomplete";
import { LuauType } from "@/types/luau";

export interface TableConcatNodeData {
    showOptionalParams?: boolean;
    __scriptId?: string;
    sep?: string;
    f?: string;
    t?: string;
}

export type TableConcatNodeProps = NodeProps & { data: TableConcatNodeData };

/**
 * Concatenates table elements into a string using Luau's `table.concat()` function.
 *
 * This node:
 * - Takes a table of strings and optional parameters for concatenation
 * - Has a toggle to show/hide optional parameters for cleaner UI
 * - Pure data-flow node with no execution handles
 * - Outputs the concatenated string result
 *
 * @component
 */
const TableConcatNode = memo(({ data, selected }: TableConcatNodeProps) => {
    const [showOptionalParams, setShowOptionalParams] = useState<boolean>(
        typeof data.showOptionalParams === "boolean" ? data.showOptionalParams : false
    );

    const nodeId = useNodeId();
    const { setNodes } = useReactFlow();

    const updateData = useCallback((updates: Partial<TableConcatNodeData>) => {
        setNodes((nds) =>
            nds.map((node) => {
                if (node.id === nodeId) {
                    return {
                        ...node,
                        data: {
                            ...node.data,
                            ...updates,
                        },
                    };
                }
                return node;
            })
        );
    }, [nodeId, setNodes]);

    const toggleOptionalParams = useCallback(() => {
        const newValue = !showOptionalParams;
        setShowOptionalParams(newValue);
        updateData({ showOptionalParams: newValue });
    }, [showOptionalParams, updateData]);

    const getInputs = () => {
        const inputs = [
            {
                id: "table",
                label: "Table",
                type: LuauType.Table
            }
        ];

        if (showOptionalParams) {
            inputs.push(
                {
                    id: "sep",
                    label: "Separator",
                    type: LuauType.String
                },
                {
                    id: "f",
                    label: "First Index",
                    type: LuauType.Number
                },
                {
                    id: "t",
                    label: "Last Index",
                    type: LuauType.Number
                }
            );
        }

        return inputs;
    };

    return (
        <NodeTemplate
            details={{
                color: {
                    background: "bg-lime-400/10",
                    border: "border-lime-400/30",
                    text: "text-lime-400",
                    ring: "ring-lime-400/40",
                },
                icon: Rows,
                name: "Table Concat",
                description: "Concatenates table elements into a string using table.concat()",
                selected
            }}
            inputs={getInputs()}
            outputs={[
                { id: "result", label: "Result", type: LuauType.String }
            ]}
        >
            <div className="space-y-3 mb-2">
                <div className="flex justify-between items-center">
                    <span className="text-xs text-muted-foreground">Optional Parameters</span>
                    <Button
                        variant={showOptionalParams ? "default" : "outline"}
                        size="sm"
                        className="text-xs h-6 px-2 bg-lime-800 hover:bg-lime-900 cursor-pointer"
                        onClick={toggleOptionalParams}
                    >
                        {showOptionalParams ? "ON" : "OFF"}
                    </Button>
                </div>

                {showOptionalParams && (
                    <div className="space-y-2">
                        <div>
                            <VariableAutocomplete
                                scriptId={data.__scriptId ?? "unknown"}
                                value={data.sep ?? ""}
                                onChange={(e) => updateData({ sep: e.target.value })}
                                placeholder='e.g., ", " or separatorVar'
                                filterVariables={(v) => v.type === LuauType.String || v.type === LuauType.Any}
                                className="text-xs h-7"
                            />
                            <div className="text-[10px] text-muted-foreground mt-1">
                                Separator between elements (default: "")
                            </div>
                        </div>

                        <div>
                            <VariableAutocomplete
                                scriptId={data.__scriptId ?? "unknown"}
                                value={data.f ?? ""}
                                onChange={(e) => updateData({ f: e.target.value })}
                                placeholder='e.g., 1 or startIndex'
                                filterVariables={(v) => v.type === LuauType.Number || v.type === LuauType.Any}
                                className="text-xs h-7"
                            />
                            <div className="text-[10px] text-muted-foreground mt-1">
                                First index to concatenate (default: 1)
                            </div>
                        </div>

                        <div>
                            <VariableAutocomplete
                                scriptId={data.__scriptId ?? "unknown"}
                                value={data.t ?? ""}
                                onChange={(e) => updateData({ t: e.target.value })}
                                placeholder='e.g., #table or endIndex'
                                filterVariables={(v) => v.type === LuauType.Number || v.type === LuauType.Any}
                                className="text-xs h-7"
                            />
                            <div className="text-[10px] text-muted-foreground mt-1">
                                Last index to concatenate (default: #table)
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </NodeTemplate>
    );
});

TableConcatNode.displayName = "TableConcatNode";

(TableConcatNode as any).getHandles = (data: TableConcatNodeData) => {
    const inputs = [
        { id: "table", label: "Table", type: LuauType.Table }
    ];

    if (data.showOptionalParams) {
        inputs.push(
            { id: "sep", label: "Separator", type: LuauType.String },
            { id: "f", label: "First Index", type: LuauType.Number },
            { id: "t", label: "Last Index", type: LuauType.Number }
        );
    }

    return {
        inputs,
        outputs: [
            { id: "result", label: "Result", type: LuauType.String }
        ]
    };
};

export default TableConcatNode;