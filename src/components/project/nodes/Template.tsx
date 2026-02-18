"use client";

import { ReactNode } from "react";
import { SquareFunction } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Interface defining the structure of node details
 */
export interface NodeTemplateProps {
    /**
     * Child elements to be rendered inside the node content area
     * Typically contains input/output handles and configuration controls
     */
    children: ReactNode;

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
        selected?: boolean;
    };
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
}: NodeTemplateProps) {
    const Icon = details.icon || SquareFunction;

    return (
        <div className={cn(
            "border border-border bg-card/10 backdrop-blur-sm rounded-md shadow-md min-w-70 transition-all duration-200 hover:shadow-lg hover:border-primary/50",
            details.selected ? "border-primary" : "",
        )}>
            <div className="bg-card/50 p-3 flex items-center gap-2 border-b border-border rounded-t-xl">
                <div className="flex size-6 items-center justify-center rounded bg-primary/10 text-primary">
                    <Icon className="size-4" aria-hidden="true" />
                </div>
                <h3 className="text-sm font-medium text-foreground truncate">
                    {details.name}
                </h3>
            </div>
            <div className="flex flex-col gap-3 p-5">
                <p className="text-xs text-muted-foreground leading-tight line-clamp-2">
                    {details.description}
                </p>
                <div className="flex flex-col gap-2">
                    {children}
                </div>
            </div>
        </div>
    );
}