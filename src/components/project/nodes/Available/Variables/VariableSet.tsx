"use client";

import { memo, useCallback, useRef, useEffect } from "react";
import { NodeProps, useNodeId, useReactFlow, useStore } from "@xyflow/react";
import NodeTemplate from "../../Template";
import { FilePenLine } from "lucide-react";
import { LuauType } from "@/types/luau";
import { Input } from "@/components/ui/input";
import { useVariableStore } from "@/stores/variable-store";

/**
 * Data structure for the VariableSetNode component
 *
 * Represents configuration for assigning a value to a variable in script scope.
 * The node registers variables in a centralized registry with type inference from
 * connected value sources.
 *
 * @interface
 * @property {string} [variableName] - Name of the variable to assign a value to
 *   Defaults to auto-generated name if empty or unset
 * @property {string} [__scriptId] - Internal script identifier injected by script editor
 *   Used for variable scoping and registry isolation (not part of public API)
 *   Critical for preventing cross-script variable collisions in multi-script environments
 */
export interface VariableSetNodeData {
    variableName?: string;
    __scriptId?: string;
}

/**
 * Props type for VariableSetNode component
 *
 * Extends React Flow's NodeProps with optional VariableSetNodeData properties
 * to support variable assignment operations within the visual scripting interface.
 *
 * @typedef {NodeProps & Partial<VariableSetNodeData>} VariableSetNodeProps
 */
export type VariableSetNodeProps = NodeProps & Partial<VariableSetNodeData>;

/**
 * VariableSetNode component assigns values to variables in script scope
 *
 * Implements a flow-control node that writes values to the script's variable registry
 * with automatic type inference from connected value sources. Registers variables
 * in a centralized store for consumption by VariableGetNode instances.
 *
 * Key characteristics:
 * - Single Flow-type input handle for execution sequencing ("execute")
 * - Single polymorphic input handle for value assignment ("value" - LuauType.Any)
 * - Single Flow-type output handle to continue execution flow ("next")
 * - Automatic variable registration in script-scoped registry on mount/update
 * - Type inference from connected value source edges (propagated via edge metadata)
 * - Auto-generated variable names when user input is empty
 * - Distinctive red color scheme for variable operation identification
 * - FilePenLine icon representing write/assignment semantics
 *
 * Type inference mechanics:
 * - Extracts source type from edge metadata (edge.data.sourceType) when value handle connected
 * - Falls back to LuauType.Any when no connection exists or type unavailable
 * - Preserves inferred type during variable rename operations
 * - Updates registry immediately on variable name changes or type inference updates
 *
 * Variable lifecycle:
 * - Registers variable in store on mount with current name and inferred type
 * - Updates registry on name/type changes with cleanup of old entries
 * - Removes variable from registry on unmount (cleanup effect)
 * - Auto-generates unique names (e.g., "var3k9m") when user leaves field empty on blur
 * - Trims whitespace from variable names for consistency
 *
 * Edge metadata propagation:
 * - Source nodes must populate edge.data.sourceType during connection creation
 * - Type flows downstream through edges to enable inference at assignment points
 * - Enables VariableGetNode instances to reflect correct types after assignment
 *
 * Integration patterns:
 * - Place after value-producing nodes (NumberNode, StringNode, calculations) in flow sequence
 * - Connect value output to "value" input handle for type inference
 * - Chain multiple VariableSetNodes for sequential variable assignments
 * - Follow with VariableGetNode to read assigned values later in execution flow
 *
 * Luau semantics notes:
 * - Variables persist for script lifetime (not garbage collected mid-execution)
 * - Assigning nil effectively "undefines" the variable in Luau semantics
 * - No type enforcement at runtime (Luau is dynamically typed) - inference is authoring aid only
 * - Variable scope is function-local unless explicitly declared global (handled by compiler)
 *
 * Performance considerations:
 * - Uses direct store access (getState) in effects to avoid selector overhead
 * - Minimal re-renders via useCallback for handlers and useEffect dependency optimization
 * - useRef for tracking previous name state without triggering re-renders
 *
 * @component
 * @param {VariableSetNodeProps} props - React Flow node properties
 *
 * @example
 * // Register node type in React Flow
 * const nodeTypes = useMemo(() => ({
 *   variableSet: VariableSetNode
 * }), []);
 *
 * @example
 * // Basic variable assignment node
 * const scoreSetNode = {
 *   id: 'set-1',
 *   type: 'variableSet',
 *    {
 *     variableName: 'playerScore',
 *     __scriptId: 'main-script-123'
 *   },
 *   position: { x: 100, y: 200 }
 * };
 * // Connect NumberNode output to "value" input handle
 * // Connect previous flow node to "execute" input handle
 * // Connect next flow node to "next" output handle
 *
 * @example
 * // Auto-generated name behavior
 * // User creates node without naming → leaves field empty → blurs field
 * // Result: variableName auto-set to "var3k9m" (unique suffix)
 *
 * @example
 * // Typical usage pattern in script flow:
 * // [NumberNode (value=100)] ────→ [VariableSetNode.value]
 * // [PreviousNode] ──────────────→ [VariableSetNode.execute]
 * //                                [VariableSetNode.next] ─→ [NextNode]
 * // Result: 'playerScore' registered as LuauType.Number in registry
 */
const VariableSetNode = memo(({ data, selected }: VariableSetNodeProps) => {
    const nodeId = useNodeId();
    const { setNodes } = useReactFlow();
    const scriptId = data?.__scriptId as string | undefined;
    const previousNameRef = useRef<string | undefined>(data?.variableName as string | undefined);

    const variableName = data?.variableName || "";

    // Retrieve all edges to locate value connection for type inference
    const allEdges = useStore((s) => s.edges);

    // Find edge connected to our value input handle to extract source type
    const valueEdge = allEdges.find(
        (e) => e.target === nodeId && e.targetHandle === "value"
    );

    // Infer type from edge metadata with LuauType.Any fallback
    const inferredType: LuauType = (valueEdge?.data?.sourceType as LuauType | undefined) ?? LuauType.Any;

    /**
     * Updates variable name in node data without normalization
     *
     * Persists raw user input to React Flow's node state management.
     * Normalization (trimming, empty handling) occurs on blur event.
     *
     * @param {string} newName - Raw user input for variable name
     * @returns {void}
     * @sideEffect Updates node data in React Flow store
     */
    const updateVariableName = useCallback(
        (newName: string) => {
            setNodes((nodes) =>
                nodes.map((node) =>
                    node.id === nodeId
                        ? {
                            ...node,
                            data: {
                                ...node.data,
                                variableName: newName || "",
                            },
                        }
                        : node
                )
            );
        },
        [nodeId, setNodes]
    );

    /**
     * Handles input blur event with validation and auto-generation logic
     *
     * Normalizes variable name by trimming whitespace and auto-generating
     * unique names when field is empty. Updates registry with final name
     * and preserves inferred type during rename operations.
     *
     * Rename behavior:
     * - Removes old variable entry when name changes
     * - Registers new entry with current inferred type
     * - Skips update when no actual name change detected
     *
     * Auto-generation format: "var" + 4-character base36 timestamp suffix
     * Example: "var3k9m"
     *
     * @returns {void}
     * @sideEffect Updates node data and variable registry
     */
    const handleBlur = useCallback(() => {
        if (!scriptId) return;

        let newName = (typeof data?.variableName === 'string' ? data.variableName : "").trim();

        // Auto-generate name if empty after trimming
        if (!newName) {
            const defaultName = `var${Date.now().toString(36).slice(-4)}`;
            newName = defaultName;
            updateVariableName(defaultName);
        }

        const oldName = previousNameRef.current?.trim();

        // Skip registry update if no actual change
        if (newName === oldName) return;

        // Clean up old registry entry on rename
        if (oldName && oldName !== newName) {
            useVariableStore.getState().removeVariable(scriptId, oldName);
        }

        // Register new/updated variable with current inferred type
        useVariableStore.getState().addVariable(scriptId, {
            name: newName,
            type: inferredType,
        });

        previousNameRef.current = newName;
    }, [scriptId, data?.variableName, inferredType, updateVariableName]);

    /**
     * Registers/updates variable in centralized store with lifecycle management
     *
     * Synchronizes variable declaration state with the global variable registry:
     * - Adds new entry on mount with current name and inferred type
     * - Updates existing entry on name/type changes
     * - Removes entry on unmount for cleanup
     *
     * Type update strategy:
     * - Updates type when variable name changes (new declaration)
     * - Updates type when inference changes from Any to specific type
     * - Preserves existing type when inference remains Any (avoids downgrading)
     *
     * @effect
     * @dependency {string | undefined} scriptId - Script context for registry scoping
     * @dependency {string} variableName - Current variable name (normalized on blur)
     * @dependency {LuauType} inferredType - Current inferred type from edge connections
     */
    useEffect(() => {
        const trimmedName = typeof variableName === 'string' ? variableName.trim() : '';

        if (scriptId && trimmedName) {
            const shouldUpdateType =
                trimmedName !== previousNameRef.current ||
                (previousNameRef.current && inferredType !== LuauType.Any);

            if (shouldUpdateType) {
                useVariableStore.getState().addVariable(scriptId, {
                    name: trimmedName,
                    type: inferredType,
                });
                previousNameRef.current = trimmedName;
            }
        }

        return () => {
            if (scriptId && previousNameRef.current) {
                useVariableStore.getState().removeVariable(scriptId, previousNameRef.current);
            }
        };
    }, [scriptId, variableName, inferredType]);

    return (
        <NodeTemplate
            details={{
                color: {
                    background: "bg-red-400/10",
                    border: "border-red-400/30",
                    text: "text-red-400",
                    ring: "ring-red-400/40",
                },
                icon: FilePenLine,
                name: "Set Variable",
                description: inferredType !== LuauType.Any
                    ? `Assigns ${inferredType} to "${variableName || 'variable'}"`
                    : `Assigns value to "${variableName || 'variable'}"`,
                selected,
            }}
            inputs={[
                { id: "execute", label: "Execute", type: LuauType.Flow },
                { id: "value", label: "Value", type: LuauType.Any },
            ]}
            outputs={[{ id: "next", label: "Next", type: LuauType.Flow }]}
        >
            <div className="space-y-2">
                <div className="flex flex-col gap-1">
                    <label className="text-[10px] text-muted-foreground">
                        Variable Name {inferredType !== LuauType.Any && (
                            <span className="text-[9px] text-red-400/80 ml-1">
                                (Type: {inferredType === LuauType.Nil ? "nil" : inferredType})
                            </span>
                        )}
                    </label>
                    <Input
                        value={variableName as string}
                        onChange={(e) => updateVariableName(e.target.value)}
                        onBlur={handleBlur}
                        className="h-7 text-xs bg-background border-border font-mono"
                        placeholder={inferredType !== LuauType.Any
                            ? `e.g., playerScore (${inferredType === LuauType.Nil ? "nil" : inferredType})`
                            : "variable"}
                    />
                </div>
            </div>
        </NodeTemplate>
    );
});

VariableSetNode.displayName = "VariableSetNode";

/**
 * Static method to compute handles for VariableSetNode
 *
 * Provides fixed handle configuration for edge validation and rendering.
 * Unlike VariableGetNode, this node has static handle types since:
 * - Input "value" handle always accepts LuauType.Any (polymorphic assignment)
 * - Type inference affects registry state but not handle compatibility
 * - Flow handles maintain consistent LuauType.Flow typing
 *
 * Note: Type inference occurs at connection time via edge metadata propagation,
 * not through handle type constraints. This allows flexible assignment while
 * still enabling downstream type awareness.
 *
 * @static
 * @param {VariableSetNodeData} data - Node configuration data (unused - handles are static)
 * @returns {Object} Handle configuration object
 * @returns {Array} returns.inputs - Execution flow and polymorphic value input handles
 * @returns {Array} returns.outputs - Single execution flow output handle
 *
 * @example
 * const handles = VariableSetNode.getHandles();
 * // {
 * //   inputs: [
 * //     { id: "execute", label: "Execute", type: LuauType.Flow },
 * //     { id: "value", label: "Value", type: LuauType.Any }
 * //   ],
 * //   outputs: [
 * //     { id: "next", label: "Next", type: LuauType.Flow }
 * //   ]
 * // }
 */
(VariableSetNode as any).getHandles = (data: VariableSetNodeData) => ({
    inputs: [
        { id: "execute", label: "Execute", type: LuauType.Flow },
        { id: "value", label: "Value", type: LuauType.Any },
    ],
    outputs: [{ id: "next", label: "Next", type: LuauType.Flow }],
});

export default VariableSetNode;