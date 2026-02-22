"use client";

import { ReactNode } from "react";
import { SquareFunction } from "lucide-react";
import { cn } from "@/lib/utils";
import { LuauType } from "@/types/luau";
import { Handle, Position } from "@xyflow/react";

/**
 * Configuration object defining visual and behavioral properties of a node
 *
 * Encapsulates all metadata required to render a node with consistent styling
 * and interactive behavior within the visual scripting interface.
 *
 * @interface NodeDetails
 * @property {string} name - Display name shown in node header
 *   Must be concise and descriptive of node functionality
 *   @example "Add", "Get Variable", "While Loop"
 * @property {string} description - Brief explanatory text shown in node body
 *   Provides contextual information about node purpose or current configuration
 *   @example "Adds two numbers (A + B)", "Loop while condition is true"
 * @property {React.ComponentType<{ className?: string }>} [icon] - Visual identifier icon
 *   Lucide React icon component or custom SVG representing node category/behavior
 *   Defaults to SquareFunction when unspecified
 * @property {Object} [color] - Theming configuration for node visual styling
 *   Allows per-node type color customization matching Luau type semantics
 *   @property {string} [color.background] - Background color class for icon container
 *   @property {string} [color.border] - Border color class for node container and handles
 *   @property {string} [color.text] - Text/icon color class for primary visual elements
 *   @property {string} [color.ring] - Focus ring color class for selection state
 * @property {boolean} [selected] - Visual selection state indicator
 *   When true, applies focus ring styling to highlight active/selected node
 * @property {boolean} [isConnectable] - Connection permission flag
 *   Controls whether output handles can form new connections (passed to Handle component)
 *   Defaults to true when unspecified
 */
interface NodeDetails {
    name: string;
    description: string;
    icon?: React.ComponentType<{ className?: string }>;
    color?: {
        background?: string;
        border?: string;
        text?: string;
        ring?: string;
    };
    selected?: boolean;
    isConnectable?: boolean;
}

/**
 * Configuration object for input/output connection points on a node
 *
 * Defines the properties required to render and validate data/flow connections
 * between nodes in the visual scripting graph.
 *
 * @interface NodeHandleConfig
 * @property {string} id - Unique identifier for the connection point
 *   Must be unique within the node's handle namespace
 *   Used as reference during edge creation and validation
 * @property {string} [label] - Optional human-readable label displayed adjacent to handle
 *   Provides contextual information about the handle's purpose or data type
 *   @example "Value", "Execute", "Condition"
 * @property {LuauType} type - Semantic type classification for connection validation
 *   Determines compatibility with other handles during edge creation
 *   Supports both data types (Number, String, Boolean) and flow control (Flow)
 */
interface NodeHandleConfig {
    id: string;
    label?: string;
    type: LuauType;
}

/**
 * Props interface for the NodeTemplate component
 *
 * Provides a standardized container for visual scripting nodes with consistent
 * styling, handle rendering, and interactive behavior across all node types.
 *
 * @interface NodeTemplateProps
 * @property {ReactNode} [children] - Node-specific content rendered in body section
 *   Typically contains configuration controls, input fields, or mode selectors
 *   Positioned between description text and connection handles
 * @property {NodeDetails} details - Visual and metadata configuration object
 *   Controls node appearance, labeling, and interactive states
 * @property {NodeHandleConfig[]} [inputs] - Array of input handle configurations
 *   Renders target handles on left side of node (Position.Left)
 *   Each handle accepts incoming connections from compatible output handles
 * @property {NodeHandleConfig[]} [outputs] - Array of output handle configurations
 *   Renders source handles on right side of node (Position.Right)
 *   Each handle initiates outgoing connections to compatible input handles
 */
export interface NodeTemplateProps {
    children?: ReactNode;
    details: NodeDetails;
    inputs?: NodeHandleConfig[];
    outputs?: NodeHandleConfig[];
}

/**
 * NodeTemplate component provides a standardized visual container for flow-based nodes
 *
 * Implements a consistent, accessible UI foundation for all node types in the
 * visual scripting interface with the following characteristics:
 *
 * Visual structure:
 * - Header section with icon and node name (visually distinct with background tint)
 * - Body section containing description text and node-specific controls
 * - Input handles rendered on left edge with labels below each handle
 * - Output handles rendered on right edge with labels above each handle
 * - Subtle backdrop blur and layered shadows for depth perception
 * - Selection state highlighted with animated focus ring
 *
 * Interaction features:
 * - Hover states with enhanced shadow for depth feedback
 * - Scale animation on handle elements during selection for tactile feedback
 * - Pointer events disabled on handle visuals (delegated to React Flow's Handle component)
 * - Truncated text handling for long node names to prevent layout overflow
 *
 * Theming system:
 * - Color customization via details.color configuration object
 * - Default primary color scheme (blue) when no custom colors provided
 * - Semantic color mapping: amber (primitives), green (math), purple (control flow), red (variables)
 * - Consistent border/background relationships for visual harmony
 *
 * Accessibility:
 * - Semantic HTML structure with appropriate heading levels
 * - ARIA attributes on interactive elements (aria-hidden on decorative icons)
 * - Sufficient color contrast for text readability
 * - Focus-visible ring for keyboard navigation support
 *
 * Performance considerations:
 * - Minimal re-renders via cn() utility for conditional class composition
 * - Direct style objects for handle positioning (avoids extra DOM nodes)
 * - Efficient React.memo usage at node component level (not this template)
 *
 * @component
 * @param {NodeTemplateProps} props - Component properties
 * @param {ReactNode} [props.children] - Node-specific content for body section
 * @param {NodeDetails} props.details - Visual configuration and metadata
 * @param {NodeHandleConfig[]} [props.inputs] - Input handle definitions
 * @param {NodeHandleConfig[]} [props.outputs] - Output handle definitions
 *
 * @example
 * // Basic node with minimal configuration
 * <NodeTemplate
 *   details={{
 *     name: "Debug Print",
 *     description: "Outputs value to console",
 *     icon: MonitorSmartphone
 *   }}
 *   inputs={[{ id: "value", label: "Value", type: LuauType.Any }]}
 *   outputs={[{ id: "next", label: "Next", type: LuauType.Flow }]}
 * />
 *
 * @example
 * // Node with custom theming and configuration controls
 * <NodeTemplate
 *   details={{
 *     name: "Add",
 *     description: "Adds two numbers (A + B)",
 *     icon: Plus,
 *     color: {
 *       background: "bg-green-400/10",
 *       border: "border-green-400/30",
 *       text: "text-green-400",
 *       ring: "ring-green-400/40"
 *     },
 *     selected: true
 *   }}
 *   inputs={[
 *     { id: "a", label: "A", type: LuauType.Number },
 *     { id: "b", label: "B", type: LuauType.Number }
 *   ]}
 *   outputs={[{ id: "result", label: "Result", type: LuauType.Number }]}
 * >
 *   <div className="space-y-2">
 *     <Button size="xs" onClick={toggleMode}>Toggle Mode</Button>
 *     <Input placeholder="Expression" />
 *   </div>
 * </NodeTemplate>
 *
 * @example
 * // Integration within React Flow custom node implementation
 * const AddNode = memo(({ data, selected }: NodeProps<AddNodeData>) => (
 *   <NodeTemplate
 *     details={{
 *       name: "Add",
 *       description: data.mode === "linear" ? "Adds two numbers" : `Evaluates: ${data.expression}`,
 *       icon: Plus,
 *       color: { * theming * },
 *       selected
 *     }}
 *     inputs={ * dynamic based on mode * }
 *     outputs={ * static output config * }
 *   >
 *     { * mode toggle controls * }
 *   </NodeTemplate>
 * ));
 */
export default function NodeTemplate({
    children,
    details,
    inputs,
    outputs,
}: NodeTemplateProps) {
    // Determine icon component with fallback to default SquareFunction icon
    const Icon = details.icon || SquareFunction;

    return (
        <div
            className={cn(
                "border border-border bg-card/10 backdrop-blur-sm rounded-md shadow-md min-w-70 transition-all duration-200 hover:shadow-lg",
                details.color?.border || "border-primary/30",
                details.color?.ring || "ring-primary/50",
                details.selected ? "ring-1" : ""
            )}
        >
            {/* Node header with icon and name */}
            <div
                className="bg-card/50 p-3 flex items-center gap-2 border-b border-border rounded-t"
            >
                <div
                    className={cn(
                        details.color?.background || "bg-primary/10",
                        details.color?.text || "text-primary",
                        "flex size-6 items-center justify-center rounded"
                    )}
                >
                    <Icon className="size-4" aria-hidden="true" />
                </div>
                <h3 className="text-sm font-medium text-foreground truncate">
                    {details.name}
                </h3>
            </div>

            {/* Node body with description, content, and handles */}
            <div className="flex flex-col gap-3 p-5">
                <p className="text-xs text-muted-foreground mb-2">
                    {details.description}
                </p>

                <div className="flex flex-col gap-2">
                    {children}

                    {/* Render input handles on left side */}
                    {inputs?.map((input) => (
                        <div className="relative" key={`${input.id}_container`}>
                            <Handle
                                type="target"
                                id={input.id}
                                position={Position.Left}
                                style={{
                                    background: "none",
                                    border: "none",
                                    width: 15,
                                    height: 15,
                                    left: -20,
                                }}
                            >
                                <div
                                    className={cn(
                                        "size-full rounded-full border-2 pointer-events-none",
                                        "transition-all duration-200",
                                        details.color?.background || "bg-primary/20",
                                        details.color?.border || "border-primary/30",
                                        details.selected && "scale-110"
                                    )}
                                />
                            </Handle>
                            <span className="text-[10px] text-muted-foreground">
                                {input.label}
                            </span>
                        </div>
                    ))}

                    {/* Render output handles on right side */}
                    {outputs?.map((output) => (
                        <div className="relative" key={`${output.id}_container`}>
                            <Handle
                                type="source"
                                id={output.id}
                                position={Position.Right}
                                isConnectable={details.isConnectable ?? true}
                                style={{
                                    background: "none",
                                    border: "none",
                                    width: 15,
                                    height: 15,
                                    right: -20,
                                }}
                            >
                                <div
                                    className={cn(
                                        "size-full rounded-full border-2 pointer-events-none",
                                        "transition-all duration-200",
                                        details.color?.background || "bg-primary/20",
                                        details.color?.border || "border-primary/30",
                                        details.selected && "scale-110"
                                    )}
                                />
                            </Handle>
                            <span className="text-right w-full block text-[10px] text-muted-foreground">
                                {output.label}
                            </span>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}