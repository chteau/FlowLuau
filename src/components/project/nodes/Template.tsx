"use client";

import { ReactNode } from "react";
import { SquareFunction } from "lucide-react";
import { cn } from "@/lib/utils";
import { LuauType } from "@/types/luau";
import { Handle, Position } from "@xyflow/react";

/**
 * Interface defining the structure of node details
 */
export interface NodeTemplateProps {
    /**
     * Child elements to be rendered inside the node content area
     * Typically contains input/output handles and configuration controls
     */
    children?: ReactNode;

    /**
     * Configuration object containing node metadata
     */
    details: {
        /**
         * Display name of the node type
         * @example "Function Call", "Data Processor", "Conditional"
         */
        name: string;

        /**
         * Brief description explaining the node's purpose and functionality
         * @example "Executes a function with provided parameters"
         */
        description: string;

        /**
         * Optional icon component to visually represent the node type
         * Should be an icon from Lucide React or custom SVG component
         * @default SquareFunction (if not provided)
         */
        icon?: React.ComponentType<{ className?: string }>;

        /**
         *
         */
        color?: {
            background?: string;
            border?: string;
            text?: string;
            ring?: string;
        };

        /**
         *
         */
        selected?: boolean;

        /**
         *
         */
        isConnectable?: boolean;
    };

    /**
     *
     */
    inputs?: {
        id: string;
        label?: string;
        type: LuauType;
    }[];

    /**
     *
     */
    outputs?: {
        id: string;
        label?: string;
        type: LuauType;
    }[];
}

/**
 * NodeTemplate component provides a standardized visual container for flow nodes
 *
 * This component creates a consistent, visually appealing container for nodes in a
 * flow-based visual programming interface. It includes:
 * - Clear visual hierarchy with header and content areas
 * - Responsive design that works at various zoom levels
 * - Proper spacing and typography for readability
 * - Visual feedback for interactive elements
 * - Support for custom icons to distinguish node types
 *
 * The component is designed to work with React Flow (or similar flow libraries)
 * and follows modern UI/UX principles for visual programming interfaces.
 *
 * @component
 * @param {NodeTemplateProps} props - Component properties
 *
 * @example
 * // Basic usage with default icon
 * <NodeTemplate details={{
 *   name: "Data Processor",
 *   description: "Processes incoming data streams"
 * }}>
 *   <NodeContent />
 * </NodeTemplate>
 *
 * @example
 * // Usage with custom icon
 * import { Database } from "lucide-react";
 *
 * <NodeTemplate details={{
 *   name: "Database",
 *   description: "Connects to database systems",
 *   icon: Database
 * }}>
 *   <DatabaseControls />
 * </NodeTemplate>
 *
 * @example
 * // In a React Flow node implementation
 * const CustomNode = ({ id, data }: NodeProps) => (
 *   <NodeTemplate details={{
 *     name: data.label,
 *     description: data.description,
 *     icon: data.icon
 *   }}>
 *     <Handle type="target" position={Position.Left} />
 *     <Handle type="source" position={Position.Right} />
 *   </NodeTemplate>
 * );
 */
export default function NodeTemplate({
    children,
    details,
    inputs,
    outputs,
}: NodeTemplateProps) {
    const Icon = details.icon || SquareFunction;

    return (
        <div className={cn(
            "border border-border bg-card/10 backdrop-blur-sm rounded-md shadow-md min-w-70 transition-all duration-200 hover:shadow-lg",
            details.color?.border || "border-primary/30",
            details.color?.ring || "ring-primary/50",
            details.selected ? "ring-1" : "",
        )}>
            <div className="bg-card/50 p-3 flex items-center gap-2 border-b border-border rounded-t-xl">
                {/* Icon */}
                <div className={cn(
                    details.color?.background || "bg-primary/10",
                    details.color?.text || "text-primary",
                    "flex size-6 items-center justify-center rounded"
                )}>
                    <Icon className="size-4" aria-hidden="true" />
                </div>

                {/* Details */}
                <h3 className="text-sm font-medium text-foreground truncate">
                    {details.name}
                </h3>
            </div>
            <div className="flex flex-col gap-3 p-5">
                <p className="text-xs text-muted-foreground mb-2">
                    {details.description}
                </p>

                <div className="flex flex-col gap-2">
                    {children}

                    {/* Create input handles */}
                    {inputs?.map((input) => (
                        <div className="relative" key={`${input.id}_container`}>
                            <Handle
                                type="target"
                                id={input.id}
                                key={input.id}
                                position={Position.Left}
                                style={{
                                    background: "none",
                                    border: "none",
                                    width: 15,
                                    height: 15,
                                    left: -20
                                }}
                            >
                                <div className={cn(
                                    "size-full rounded-full border-2 pointer-events-none",
                                    "transition-all duration-200",
                                    details.color?.background || "bg-primary/20",
                                    details.color?.border || "border-primary/30",
                                    details.selected && "scale-110",
                                )} />
                            </Handle>

                            <span key={`${input.id}_label`} className="text-[10px] text-muted-foreground">{input.label}</span>
                        </div>
                    ))}

                    {/* Create output handles */}
                    {outputs?.map((output) => (
                        <div className="relative" key={`${output.id}_container`}>
                            <Handle
                                type="source"
                                id={output.id}
                                key={output.id}
                                position={Position.Right}
                                isConnectable={details.isConnectable || true}
                                style={{
                                    background: "none",
                                    border: "none",
                                    width: 15,
                                    height: 15,
                                    right: -20,
                                }}
                            >
                                <div className={cn(
                                    "size-full rounded-full border-2 pointer-events-none",
                                    "transition-all duration-200",
                                    details.color?.background || "bg-primary/20",
                                    details.color?.border || "border-primary/30",
                                    details.selected && "scale-110",
                                )} />
                            </Handle>

                            <span className="text-right w-full block text-[10px] text-muted-foreground" key={`${output.id}_label`}>{output.label}</span>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}