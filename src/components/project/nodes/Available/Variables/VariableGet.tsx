"use client";

import { memo, useCallback, useMemo } from "react";
import { NodeProps, useNodeId, useReactFlow } from "@xyflow/react";
import NodeTemplate from "../../Template";
import { FileText } from "lucide-react";
import { LuauType } from "@/types/luau";
import { Input } from "@/components/ui/input";
import VariableAutocomplete from "@/components/ui/variable-autocomplete";
import { useVariableStore } from "@/stores/variable-store";
import { useShallow } from "zustand/shallow";

/**
 * Data structure for the VariableGetNode component
 *
 * Represents configuration for reading a variable value from script scope.
 * The node dynamically infers output type based on variable registry state.
 *
 * @interface
 * @property {string} [variableName] - Name of the variable to read from script scope
 *   Defaults to "variable" if not specified or empty
 * @property {string} [__scriptId] - Internal script identifier injected by script editor
 *   Used for variable scoping and autocomplete context (not part of public API)
 *   Critical for connecting variable reads to correct script scope in multi-script environments
 */
export interface VariableGetNodeData {
    variableName?: string;
    __scriptId?: string;
}

/**
 * Props type for VariableGetNode component
 *
 * Extends React Flow's NodeProps with optional VariableGetNodeData properties
 * to support variable reading operations within the visual scripting interface.
 *
 * @typedef {NodeProps & Partial<VariableGetNodeData>} VariableGetNodeProps
 */
export type VariableGetNodeProps = NodeProps & Partial<VariableGetNodeData>;

/**
 * VariableGetNode component reads variable values from script scope in visual scripts
 *
 * Implements a pure data-source node that retrieves values from the script's variable registry.
 * Features dynamic type inference where the output handle type automatically adapts to the
 * variable's declared type in the registry.
 *
 * Key characteristics:
 * - Zero input handles (pure data source - no execution flow required)
 * - Single output handle with dynamically inferred type (LuauType based on registry)
 * - Real-time type inference reflecting VariableSetNode declarations
 * - Context-aware variable autocomplete scoped to current script
 * - Distinctive red color scheme for variable operation identification
 * - FileText icon representing data/value retrieval semantics
 *
 * Type inference behavior:
 * - Reads variable type from centralized variable registry (Zustand store)
 * - Falls back to LuauType.Any when:
 *   - Variable not yet declared in registry
 *   - Script ID context unavailable
 *   - Variable name empty/invalid
 * - Special handling for nil type (displays "nil" instead of enum name)
 * - Type updates automatically when VariableSetNode declares/updates variable type
 *
 * Variable resolution mechanics:
 * - Script scope isolation via __scriptId injection (prevents cross-script variable leakage)
 * - Variables must be declared via VariableSetNode before reliable type inference
 * - Undeclared variables default to LuauType.Any (runtime Luau handles actual resolution)
 * - Autocomplete suggestions filtered to current script's variable registry
 *
 * Integration patterns:
 * - Connect output to any node accepting compatible input types
 * - Use after VariableSetNode in execution flow to ensure variable initialization
 * - Chain multiple VariableGetNodes to read different variables in same script
 * - Combine with ConditionNode for variable-based branching logic
 *
 * Luau semantics notes:
 * - Variables default to nil if never assigned (reflected in registry as LuauType.Nil)
 * - Type inference is compile-time hint only - Luau is dynamically typed
 * - No runtime validation - invalid variable names fail at Luau execution time
 * - Global vs local scope handled by script compiler (not visual node concern)
 *
 * Performance considerations:
 * - Uses useShallow selector to prevent unnecessary re-renders on unrelated store changes
 * - Memoized type inference (inferredType) dependent on scriptId, variableName, and registry state
 * - Static getHandles method uses direct store access (getState) for edge validation efficiency
 *
 * @component
 * @param {VariableGetNodeProps} props - React Flow node properties
 *
 * @example
 * // Register node type in React Flow
 * const nodeTypes = useMemo(() => ({
 *   variableGet: VariableGetNode
 * }), []);
 *
 * @example
 * // Basic variable read node (undeclared variable - defaults to Any type)
 * const scoreReadNode = {
 *   id: 'get-1',
 *   type: 'variableGet',
 *    {
 *     variableName: 'playerScore',
 *     __scriptId: 'main-script-123'
 *   },
 *   position: { x: 100, y: 200 }
 * };
 * // Output handle type: LuauType.Any (until VariableSetNode declares type)
 *
 * @example
 * // Type-inferred variable read after declaration
 * // After VariableSetNode declares 'playerScore' as LuauType.Number:
 * // Output handle type: LuauType.Number
 * // Description: "Reads number value of "playerScore""
 *
 * @example
 * // Typical usage pattern in script flow:
 * // [VariableSetNode] → (execution flow) → [VariableGetNode] → [ConditionNode]
 * //   (declares score)      (ensures init)     (reads score)      (checks value)
 */
const VariableGetNode = memo(({ data, selected }: VariableGetNodeProps) => {
    const nodeId = useNodeId();
    const { setNodes } = useReactFlow();
    const scriptId = data?.__scriptId as string | undefined;
    const variableName = (data?.variableName as string) || "";

    /**
     * Retrieves script-scoped variables from centralized registry
     *
     * Uses useShallow selector to prevent unnecessary re-renders when unrelated
     * variables change. Returns empty array when script context unavailable.
     *
     * @hook
     * @returns {Array} Array of variable definitions for current script scope
     * @dependency {string | undefined} scriptId - Current script identifier for scoping
     */
    const variables = useVariableStore(
        useShallow((s) => (scriptId ? s.getVariablesForScript(scriptId) : []))
    );

    /**
     * Infers output type from variable registry with fallback behavior
     *
     * Dynamically determines the Luau type based on registry state. Memoized
     * to prevent unnecessary re-renders when unrelated state changes.
     *
     * Type resolution priority:
     * 1. Exact match in registry for current script + variable name
     * 2. Fallback to LuauType.Any when variable undeclared or context missing
     *
     * @hook
     * @returns {LuauType} Inferred type for output handle
     * @dependency {string | undefined} scriptId - Script context for registry lookup
     * @dependency {string} variableName - Variable name to resolve type for
     * @dependency {Array} variables - Current script's variable registry snapshot
     */
    const inferredType = useMemo(() => {
        if (!scriptId || !variableName.trim()) return LuauType.Any;

        const variable = variables.find(v => v.name === variableName.trim());
        return variable?.type || LuauType.Any;
    }, [scriptId, variableName, variables]);

    /**
     * Updates variable name in node data with normalization
     *
     * Persists variable name changes to React Flow's node state management.
     * Normalizes input by trimming whitespace and enforcing non-empty fallback.
     *
     * @callback
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
                                  variableName: newName.trim() || "variable",
                              },
                          }
                        : node
                )
            );
        },
        [nodeId, setNodes]
    );

    return (
        <NodeTemplate
            details={{
                color: {
                    background: "bg-red-400/10",
                    border: "border-red-400/30",
                    text: "text-red-400",
                    ring: "ring-red-400/40",
                },
                icon: FileText,
                name: "Get Variable",
                description:
                    inferredType !== LuauType.Any
                        ? `Reads ${inferredType === LuauType.Nil ? "nil" : inferredType} value of "${variableName || 'variable'}"`
                        : `Reads value of "${variableName || 'variable'}"`,
                selected: !!selected,
            }}
            inputs={[]}
            outputs={[
                {
                    id: "value",
                    label:
                        inferredType !== LuauType.Any
                            ? `Value (${inferredType === LuauType.Nil ? "nil" : inferredType})`
                            : "Value",
                    type: inferredType,
                },
            ]}
        >
            <div className="space-y-2">
                <div className="flex flex-col gap-1">
                    <label className="text-[10px] text-muted-foreground">
                        Variable Name
                        {inferredType !== LuauType.Any && (
                            <span className="text-[9px] text-red-400/80 ml-1">
                                (Type: {inferredType === LuauType.Nil ? "nil" : inferredType})
                            </span>
                        )}
                    </label>
                    <VariableAutocomplete
                        scriptId={scriptId || "unknown"}
                        value={variableName as string}
                        onChange={(e) => updateVariableName(e.target.value)}
                        className="h-7 text-xs bg-background border-border font-mono"
                        placeholder={
                            inferredType !== LuauType.Any
                                ? `e.g., playerScore (${inferredType === LuauType.Nil ? "nil" : inferredType})`
                                : "variable"
                        }
                        onBlur={(e) => {
                            if (!e.target.value.trim()) {
                                updateVariableName("variable");
                            }
                        }}
                        filterVariables={(v) =>
                            inferredType === LuauType.Any ||
                            v.type === inferredType ||
                            v.type === LuauType.Any
                        }
                    />
                </div>
            </div>
        </NodeTemplate>
    );
});

VariableGetNode.displayName = "VariableGetNode";

/**
 * Static method to compute handles with dynamic type inference
 *
 * Provides handle configuration for edge validation and rendering without mounting
 * the component. Uses direct store access (getState) since called outside React lifecycle.
 *
 * Critical implementation notes:
 * - MUST use getState() instead of hooks (called during edge validation outside components)
 * - Type inference mirrors component behavior but without React dependencies
 * - Falls back to LuauType.Any when context insufficient for resolution
 * - Output handle label remains generic ("Value") since detailed labels require UI context
 *
 * Performance optimization:
 * - Direct store access avoids unnecessary React re-renders during edge validation
 * - Minimal computation path for frequent edge validation operations
 *
 * @static
 * @param {VariableGetNodeData} data - Node configuration data containing variable name and script context
 * @returns {Object} Handle configuration object
 * @returns {Array} returns.inputs - Empty array (pure data source node)
 * @returns {Array} returns.outputs - Single output handle with dynamically inferred type
 *
 * @example
 * // Undeclared variable (fallback to Any)
 * const handles1 = VariableGetNode.getHandles({
 *   variableName: 'undeclaredVar',
 *   __scriptId: 'script-123'
 * });
 * // {
 * //   inputs: [],
 * //   outputs: [{ id: "value", label: "Value", type: LuauType.Any }]
 * // }
 *
 * @example
 * // Declared number variable (type inferred)
 * // Assuming registry contains: { name: 'score', type: LuauType.Number }
 * const handles2 = VariableGetNode.getHandles({
 *   variableName: 'score',
 *   __scriptId: 'script-123'
 * });
 * // {
 * //   inputs: [],
 * //   outputs: [{ id: "value", label: "Value", type: LuauType.Number }]
 * // }
 */
(VariableGetNode as any).getHandles = ( data: VariableGetNodeData ) => {
    const scriptId = data?.__scriptId as string | undefined;
    const variableName = data?.variableName?.trim() || "";

    // Direct store access without hooks (required for edge validation lifecycle)
    let inferredType = LuauType.Any;

    if (scriptId && variableName) {
        const variable = useVariableStore.getState().getVariable(scriptId, variableName);
        inferredType = variable?.type || LuauType.Any;
    }

    return {
        inputs: [],
        outputs: [
            {
                id: "value",
                label: "Value",
                type: inferredType,
            },
        ],
    };
};

export default VariableGetNode;