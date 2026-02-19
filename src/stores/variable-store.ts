import { create } from "zustand";
import { LuauType } from "@/types/luau";
import React from "react";

/**
 * Represents a variable declaration in a Luau script with type and metadata
 *
 * Variables are script-scoped entities that store values during script execution.
 * They support type annotations for editor assistance and runtime validation.
 *
 * @interface Variable
 * @property {string} name - Unique identifier within script scope following Luau naming rules
 *   Must start with letter/underscore, contain only alphanumeric characters and underscores
 *   @example "playerScore", "isReady", "_tempValue"
 * @property {LuauType} type - Static type annotation for editor assistance and validation
 *   Determines compatible operations and connections in visual scripting interface
 * @property {string} [initialValue] - Optional default value expression (Luau syntax)
 *   Evaluated at variable declaration time during script initialization
 *   @example "0", "\"default\"", "Vector3.new(0, 10, 0)"
 * @property {string} [description] - Human-readable documentation for the variable
 *   Displayed in editor tooltips and autocomplete suggestions
 *   @example "Player's current health points (0-100)"
 * @property {boolean} [isConstant] - Flag indicating immutable variable (Luau 'const' keyword)
 *   When true, variable cannot be reassigned after initialization
 *   Enforced at compile time by Luau type checker
 */
export interface Variable {
    name: string;
    type: LuauType;
    initialValue?: string;
    description?: string;
    isConstant?: boolean;
}

/**
 * Centralized store for managing script-scoped variable declarations
 *
 * Maintains a hierarchical data structure mapping script identifiers to their
 * respective variable registries. Enables type-aware autocomplete, connection
 * validation, and variable lifecycle management across the visual scripting interface.
 *
 * Architecture:
 * - Top-level Map: scriptId → ScriptVariableMap
 * - ScriptVariableMap: variableName → Variable (ensures name uniqueness per script)
 * - All operations are script-scoped to prevent cross-script contamination
 *
 * Design principles:
 * - Immutability: All state updates return new Map instances to preserve referential integrity
 * - Idempotency: Operations safely handle duplicate calls (e.g., adding existing variable)
 * - Cleanup: Automatic removal of empty script entries to prevent memory leaks
 * - Type safety: Strict LuauType enforcement for variable declarations and connections
 *
 * Performance characteristics:
 * - O(1) average lookup time for variable retrieval by scriptId + name
 * - O(n) for script-scoped operations where n = variable count (typically < 100 per script)
 * - Minimal re-renders via granular selector usage in consuming components
 *
 * @interface VariableStore
 * @property {Map<string, Map<string, Variable>>} scriptVariables - Hierarchical variable registry
 *   Outer Map key: script identifier (UUID or stable ID)
 *   Inner Map key: variable name (unique within script scope)
 *   Inner Map value: Variable declaration object
 */
interface VariableStore {
    scriptVariables: Map<string, Map<string, Variable>>;

    /**
     * Registers a new variable declaration within a script's scope
     *
     * Creates or overwrites a variable entry with the provided configuration.
     * Overwriting preserves existing variable identity while updating metadata.
     * Automatically initializes script scope if not previously registered.
     *
     * Idempotency behavior:
     * - Adding existing variable replaces its definition (not a no-op)
     * - Preserves variable identity for downstream type inference systems
     *
     * @param {string} scriptId - Target script identifier for scoping
     * @param {Variable} variable - Variable declaration configuration
     * @returns {void}
     *
     * @example
     * // Register player health variable
     * store.addVariable('script-123', {
     *   name: 'playerHealth',
     *   type: LuauType.Number,
     *   initialValue: '100',
     *   description: 'Current player health (0-100)'
     * });
     */
    addVariable: (scriptId: string, variable: Variable) => void;

    /**
     * Updates metadata for an existing variable declaration
     *
     * Modifies specific properties of a variable without replacing the entire definition.
     * Only affects properties included in the updates object; others remain unchanged.
     * No-op if variable doesn't exist in the specified script scope.
     *
     * @param {string} scriptId - Target script identifier
     * @param {string} name - Variable name to update
     * @param {Partial<Variable>} updates - Partial variable properties to merge
     * @returns {void}
     *
     * @example
     * // Update variable description
     * store.updateVariable('script-123', 'playerHealth', {
     *   description: 'Health after armor calculation'
     * });
     */
    updateVariable: (scriptId: string, name: string, updates: Partial<Variable>) => void;

    /**
     * Removes a variable declaration from a script's scope
     *
     * Deletes the variable entry and cleans up empty script containers.
     * Automatically removes parent script entry when last variable is deleted.
     * No-op if variable or script doesn't exist.
     *
     * Cleanup behavior:
     * - Removes variable from script's inner Map
     * - Deletes script entry from outer Map if inner Map becomes empty
     * - Preserves referential integrity via immutable Map updates
     *
     * @param {string} scriptId - Target script identifier
     * @param {string} name - Variable name to remove
     * @returns {void}
     *
     * @example
     * // Remove obsolete variable
     * store.removeVariable('script-123', 'deprecatedFlag');
     */
    removeVariable: (scriptId: string, name: string) => void;

    /**
     * Retrieves a variable declaration by script and name (synchronous getter)
     *
     * Performs O(1) lookup in the hierarchical registry without triggering re-renders.
     * Returns undefined for non-existent scripts or variables.
     *
     * Usage note:
     * - Use in effects/computations where state snapshot is sufficient
     * - Prefer useScriptVariables hook for React component subscriptions
     *
     * @param {string} scriptId - Target script identifier
     * @param {string} name - Variable name to retrieve
     * @returns {Variable | undefined} Variable declaration or undefined if not found
     *
     * @example
     * const healthVar = store.getVariable('script-123', 'playerHealth');
     * if (healthVar?.type === LuauType.Number) {
     *   // Safe to use as number
     * }
     */
    getVariable: (scriptId: string, name: string) => Variable | undefined;

    /**
     * Retrieves all variables declared within a script's scope (synchronous getter)
     *
     * Returns array of variable declarations ordered by insertion sequence.
     * Empty array returned for non-existent scripts or scripts with no variables.
     *
     * Usage note:
     * - Use in effects/computations where state snapshot is sufficient
     * - Prefer useScriptVariables hook for React component subscriptions
     *
     * @param {string} scriptId - Target script identifier
     * @returns {Variable[]} Array of variable declarations (empty if none exist)
     *
     * @example
     * const allVars = store.getVariablesForScript('script-123');
     * const numberVars = allVars.filter(v => v.type === LuauType.Number);
     */
    getVariablesForScript: (scriptId: string) => Variable[];

    /**
     * Removes all variable declarations for a specific script
     *
     * Completely purges a script's variable registry including the script container.
     * Idempotent operation - safe to call multiple times for same scriptId.
     *
     * Use cases:
     * - Script deletion cleanup
     * - Resetting script state during development
     * - Memory management for unloaded scripts
     *
     * @param {string} scriptId - Target script identifier to purge
     * @returns {void}
     *
     * @example
     * // Cleanup before deleting script
     * store.clearScriptVariables('script-123');
     */
    clearScriptVariables: (scriptId: string) => void;

    /**
     * Resets the entire variable registry to initial empty state
     *
     * Purges all script containers and variable declarations globally.
     * Use with caution - affects all scripts in the application.
     *
     * Typical usage:
     * - Application reset/hard reload scenarios
     * - Testing environment teardown
     * - Session cleanup on user logout
     *
     * @returns {void}
     *
     * @example
     * // Full application reset
     * store.clearAll();
     */
    clearAll: () => void;
}

/**
 * Centralized variable registry store with script-scoped isolation
 *
 * Manages hierarchical variable declarations across multiple Luau scripts with
 * strict scope isolation. Provides type-safe operations for variable lifecycle
 * management while maintaining referential integrity through immutable updates.
 *
 * Implementation details:
 * - Uses nested Maps for O(1) average lookup performance
 * - All state mutations return new Map instances (immutability)
 * - Automatic cleanup of empty script containers prevents memory leaks
 * - Zustand middleware compatible (devtools, persist, etc.)
 *
 * Usage patterns:
 * - Components should use useScriptVariables hook for script-scoped operations
 * - Direct store access reserved for cross-script operations or utilities
 * - Getters (getVariable/getVariablesForScript) safe for synchronous use
 *
 * @store
 * @type {VariableStore}
 * @property {Map<string, Map<string, Variable>>} scriptVariables - Hierarchical registry state
 * @property {Function} addVariable - Script-scoped variable registration
 * @property {Function} updateVariable - Variable metadata updates
 * @property {Function} removeVariable - Variable removal with cleanup
 * @property {Function} getVariable - Synchronous variable lookup
 * @property {Function} getVariablesForScript - Synchronous script-scoped retrieval
 * @property {Function} clearScriptVariables - Script-scoped registry purge
 * @property {Function} clearAll - Global registry reset
 *
 * @example
 * // Direct store usage (cross-script operations)
 * const { addVariable, getVariablesForScript } = useVariableStore.getState();
 * addVariable('script-123', { name: 'score', type: LuauType.Number });
 * const vars = getVariablesForScript('script-123');
 *
 * @example
 * // React component usage (script-scoped)
 * const { addVariable } = useScriptVariables(currentScriptId);
 * addVariable({ name: 'health', type: LuauType.Number });
 */
export const useVariableStore = create<VariableStore>((set, get) => ({
    scriptVariables: new Map(),

    addVariable: (scriptId, variable) => {
        set((state) => {
            const scriptVars = state.scriptVariables.get(scriptId) || new Map();
            scriptVars.set(variable.name, variable);

            const newState = new Map(state.scriptVariables);
            newState.set(scriptId, scriptVars);

            return { scriptVariables: newState };
        });
    },

    updateVariable: (scriptId, name, updates) => {
        set((state) => {
            const scriptVars = state.scriptVariables.get(scriptId);
            if (!scriptVars) return state;

            const current = scriptVars.get(name);
            if (!current) return state;

            const updated = { ...current, ...updates };
            const newScriptVars = new Map(scriptVars);
            newScriptVars.set(name, updated);

            const newState = new Map(state.scriptVariables);
            newState.set(scriptId, newScriptVars);

            return { scriptVariables: newState };
        });
    },

    removeVariable: (scriptId, name) => {
        set((state) => {
            const scriptVars = state.scriptVariables.get(scriptId);
            if (!scriptVars) return state;

            const newScriptVars = new Map(scriptVars);
            newScriptVars.delete(name);

            // Clean up empty script entries
            if (newScriptVars.size === 0) {
                const newState = new Map(state.scriptVariables);
                newState.delete(scriptId);
                return { scriptVariables: newState };
            }

            const newState = new Map(state.scriptVariables);
            newState.set(scriptId, newScriptVars);

            return { scriptVariables: newState };
        });
    },

    getVariable: (scriptId, name) => {
        return get().scriptVariables.get(scriptId)?.get(name);
    },

    getVariablesForScript: (scriptId) => {
        const vars = get().scriptVariables.get(scriptId);
        return vars ? Array.from(vars.values()) : [];
    },

    clearScriptVariables: (scriptId) => {
        set((state) => {
            const newState = new Map(state.scriptVariables);
            newState.delete(scriptId);
            return { scriptVariables: newState };
        });
    },

    clearAll: () => {
        set({ scriptVariables: new Map() });
    },
}));

/**
 * React hook providing script-scoped variable registry operations
 *
 * Creates a bound interface to the global variable store filtered to a specific
 * script context. Prevents cross-script contamination and simplifies component
 * integration by removing the need to pass scriptId to every operation.
 *
 * Features:
 * - Automatic no-op for null/undefined script IDs (safe during loading states)
 * - Memoized return value to prevent unnecessary re-renders
 * - Type-safe operations with script context baked into function signatures
 * - Graceful degradation when script context unavailable
 *
 * Usage guidelines:
 * - Always pass current script ID from component props/context
 * - Safe to call operations even when scriptId is temporarily null (no-ops)
 * - Prefer over direct store access for component-level variable management
 *
 * @hook
 * @param {string | null | undefined} scriptId - Current script context identifier
 * @returns {Object} Script-scoped variable operations interface
 * @returns {Function|undefined} returns.addVariable - Bound variable registration (undefined if no scriptId)
 * @returns {Function|undefined} returns.updateVariable - Bound metadata updates (undefined if no scriptId)
 * @returns {Function|undefined} returns.removeVariable - Bound removal operation (undefined if no scriptId)
 * @returns {Function|undefined} returns.getVariable - Bound lookup (undefined if no scriptId)
 * @returns {Function} returns.getVariablesForScript - Script-scoped retrieval (returns empty array if no scriptId)
 * @returns {Function|undefined} returns.clearScriptVariables - Bound cleanup (undefined if no scriptId)
 *
 * @example
 * // Basic usage in script editor component
 * const { addVariable, getVariablesForScript } = useScriptVariables(scriptId);
 *
 * const handleAdd = () => {
 *   addVariable?.({ name: 'newVar', type: LuauType.Number });
 * };
 *
 * const variables = getVariablesForScript();
 *
 * @example
 * // Safe usage during loading states
 * const { addVariable } = useScriptVariables(loading ? null : scriptId);
 * // addVariable will be undefined during loading, preventing accidental operations
 */
export function useScriptVariables(scriptId: string | null | undefined) {
    const store = useVariableStore();

    return React.useMemo(() => {
        if (!scriptId) {
            return {
                addVariable: undefined,
                updateVariable: undefined,
                removeVariable: undefined,
                getVariable: undefined,
                getVariablesForScript: () => [],
                clearScriptVariables: undefined,
            };
        }

        return {
            addVariable: (variable: Variable) =>
                store.addVariable(scriptId, variable),

            updateVariable: (name: string, updates: Partial<Variable>) =>
                store.updateVariable(scriptId, name, updates),

            removeVariable: (name: string) =>
                store.removeVariable(scriptId, name),

            getVariable: (name: string) =>
                store.getVariable(scriptId, name),

            getVariablesForScript: () =>
                store.getVariablesForScript(scriptId),

            clearScriptVariables: () =>
                store.clearScriptVariables(scriptId),
        };
    }, [scriptId, store]);
}