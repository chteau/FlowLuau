import { create } from "zustand";
import { LuauType } from "@/types/luau";
import React from "react";

/**
 * Represents a variable declaration in a Luau script with type and metadata
 */
export interface Variable {
    name: string;
    type: LuauType;
    initialValue?: string;
    description?: string;
    isConstant?: boolean;
    scopeId?: string; // Unique identifier for the scope this variable belongs to
    scopeType?: "global" | "function" | "block" | "loop"; // Type of scope
}

/**
 * Represents a scope hierarchy for variable visibility
 */
export interface VariableScope {
    id: string; // Unique scope identifier
    parentScopeId?: string; // Parent scope for nested scopes
    scopeType: "global" | "function" | "block" | "loop";
    nodeId?: string; // React Flow node ID that defines this scope
    variableNames: Set<string>; // Variables defined in this scope
    childScopeIds: Set<string>; // Nested scopes within this scope
}

/**
 * Represents a function declaration in a Luau script with parameters and return type
 *
 * Functions are first-class script-scoped entities that encapsulate reusable logic.
 * They support parameter typing, return types, and metadata for editor assistance.
 *
 * @interface FunctionDefinition
 * @property {string} name - Unique identifier within script scope following Luau naming rules
 *   Must start with letter/underscore, contain only alphanumeric characters and underscores
 *   @example "isPrime", "calculateDamage", "_helperFunction"
 * @property {Array<{ name: string; type: LuauType }>} parameters - Ordered list of function parameters
 *   Each parameter has a name and static type annotation for connection validation
 *   @example [{ name: "n", type: LuauType.Number }, { name: "threshold", type: LuauType.Number }]
 * @property {LuauType} returnType - Static return type annotation for downstream connections
 *   Determines compatible operations after function invocation
 * @property {string} nodeId - Reference to the defining FunctionDefinitionNode in React Flow
 *   Enables editor features like "Go to Definition" and node highlighting
 * @property {string} [description] - Human-readable documentation for the function
 *   Displayed in editor tooltips and autocomplete suggestions
 *   @example "Checks if a number is prime using trial division"
 */
export interface FunctionDefinition {
    name: string;
    parameters: Array<{ name: string; type: LuauType }>;
    returnType: LuauType;
    nodeId: string;
    description?: string;
}

/**
 * Centralized store for managing script-scoped declarations (variables AND functions)
 *
 * Maintains parallel hierarchical registries for variables and functions with strict
 * script isolation. Enables type-aware autocomplete, connection validation, and lifecycle
 * management across the visual scripting interface.
 *
 * Architecture:
 * - Variables: scriptId → Map<variableName, Variable>
 * - Functions: scriptId → Map<functionName, FunctionDefinition>
 * - All operations are script-scoped to prevent cross-script contamination
 *
 * Design principles:
 * - Namespaces are separate: variables and functions can share names (Luau allows this)
 * - Immutability: All state updates return new Map instances
 * - Idempotency: Operations safely handle duplicate calls
 * - Cleanup: Automatic removal of empty script entries
 * - Type safety: Strict LuauType enforcement for all declarations
 */
interface IntellisenseStore {
    scriptVariables: Map<string, Map<string, Variable>>;
    scriptFunctions: Map<string, Map<string, FunctionDefinition>>;

    addVariable: (scriptId: string, variable: Variable) => void;
    updateVariable: (scriptId: string, name: string, updates: Partial<Variable>) => void;
    removeVariable: (scriptId: string, name: string) => void;
    getVariable: (scriptId: string, name: string) => Variable | undefined;
    getVariablesForScript: (scriptId: string) => Variable[];
    clearScriptVariables: (scriptId: string) => void;

    // Scope management
    createScope: (scriptId: string, scope: VariableScope) => void;
    destroyScope: (scriptId: string, scopeId: string) => void;
    enterScope: (scriptId: string, scopeId: string) => void;
    exitScope: (scriptId: string, scopeId: string) => void;
    getCurrentScopeId: (scriptId: string) => string | undefined;
    getVariablesInScope: (scriptId: string, scopeId: string) => Variable[];
    getVisibleVariablesForScope: (scriptId: string, scopeId: string) => Variable[];

    addFunction: (scriptId: string, func: FunctionDefinition) => void;
    updateFunction: (scriptId: string, name: string, updates: Partial<FunctionDefinition>) => void;
    removeFunction: (scriptId: string, name: string) => void;
    getFunction: (scriptId: string, name: string) => FunctionDefinition | undefined;
    getFunctionsForScript: (scriptId: string) => FunctionDefinition[];
    clearScriptFunctions: (scriptId: string) => void;

    clearAll: () => void;
}

export const useIntellisenseStore = create<IntellisenseStore>((set, get) => ({
    scriptVariables: new Map(),
    scriptFunctions: new Map(),
    scriptScopes: new Map(),
    activeScopes: new Map(),

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

    // Scope management implementations
    createScope: (scriptId, scope) => {
        set((state) => {
            const scriptScopes = state.scriptScopes.get(scriptId) || new Map();
            scriptScopes.set(scope.id, scope);

            const newScopesState = new Map(state.scriptScopes);
            newScopesState.set(scriptId, scriptScopes);

            return { scriptScopes: newScopesState };
        });
    },

    destroyScope: (scriptId, scopeId) => {
        set((state) => {
            const scriptScopes = state.scriptScopes.get(scriptId);
            if (!scriptScopes) return state;

            const newScriptScopes = new Map(scriptScopes);
            newScriptScopes.delete(scopeId);

            const newScopesState = new Map(state.scriptScopes);
            newScopesState.set(scriptId, newScriptScopes);

            // Also clean up from active scopes if present
            const activeScopeSet = state.activeScopes.get(scriptId);
            if (activeScopeSet?.has(scopeId)) {
                const newActiveSet = new Set(activeScopeSet);
                newActiveSet.delete(scopeId);
                const newActiveState = new Map(state.activeScopes);
                newActiveState.set(scriptId, newActiveSet);
                return { scriptScopes: newScopesState, activeScopes: newActiveState };
            }

            return { scriptScopes: newScopesState };
        });
    },

    enterScope: (scriptId, scopeId) => {
        set((state) => {
            const activeScopeSet = state.activeScopes.get(scriptId) || new Set();
            activeScopeSet.add(scopeId);

            const newActiveState = new Map(state.activeScopes);
            newActiveState.set(scriptId, activeScopeSet);

            return { activeScopes: newActiveState };
        });
    },

    exitScope: (scriptId, scopeId) => {
        set((state) => {
            const activeScopeSet = state.activeScopes.get(scriptId);
            if (!activeScopeSet) return state;

            const newActiveSet = new Set(activeScopeSet);
            newActiveSet.delete(scopeId);

            const newActiveState = new Map(state.activeScopes);
            newActiveState.set(scriptId, newActiveSet);

            return { activeScopes: newActiveState };
        });
    },

    getCurrentScopeId: (scriptId) => {
        const activeScopes = get().activeScopes.get(scriptId);
        if (!activeScopes || activeScopes.size === 0) return undefined;
        
        // Return the most recently entered scope (last one in the set)
        return Array.from(activeScopes).pop();
    },

    getVariablesInScope: (scriptId, scopeId) => {
        const variables = get().scriptVariables.get(scriptId);
        if (!variables) return [];
        
        return Array.from(variables.values()).filter(v => v.scopeId === scopeId);
    },

    getVisibleVariablesForScope: (scriptId, scopeId) => {
        const allVariables = get().scriptVariables.get(scriptId);
        if (!allVariables) return [];
        
        const scopes = get().scriptScopes.get(scriptId);
        if (!scopes) return Array.from(allVariables.values());
        
        const currentScope = scopes.get(scopeId);
        if (!currentScope) return Array.from(allVariables.values());
        
        // Collect all visible variables by walking up the scope chain
        const visibleVariables = new Set<Variable>();
        let current: VariableScope | undefined = currentScope;
        
        while (current) {
            // Add variables from this scope
            const scopeVars = Array.from(allVariables.values()).filter(v => v.scopeId === current.id);
            scopeVars.forEach(v => visibleVariables.add(v));
            
            // Move to parent scope
            if (current.parentScopeId) {
                current = scopes.get(current.parentScopeId);
            } else {
                current = undefined;
            }
        }
        
        // Add global variables (variables with no scopeId or scopeType === "global")
        const globalVars = Array.from(allVariables.values()).filter(v => !v.scopeId || v.scopeType === "global");
        globalVars.forEach(v => visibleVariables.add(v));
        
        return Array.from(visibleVariables);
    },

    addFunction: (scriptId, func) => {
        set((state) => {
            const scriptFuncs = state.scriptFunctions.get(scriptId) || new Map();
            scriptFuncs.set(func.name, func);

            const newState = new Map(state.scriptFunctions);
            newState.set(scriptId, scriptFuncs);

            return { scriptFunctions: newState };
        });
    },

    updateFunction: (scriptId, name, updates) => {
        set((state) => {
            const scriptFuncs = state.scriptFunctions.get(scriptId);
            if (!scriptFuncs) return state;

            const current = scriptFuncs.get(name);
            if (!current) return state;

            const updated = { ...current, ...updates };
            const newScriptFuncs = new Map(scriptFuncs);
            newScriptFuncs.set(name, updated);

            const newState = new Map(state.scriptFunctions);
            newState.set(scriptId, newScriptFuncs);

            return { scriptFunctions: newState };
        });
    },

    removeFunction: (scriptId, name) => {
        set((state) => {
            const scriptFuncs = state.scriptFunctions.get(scriptId);
            if (!scriptFuncs) return state;

            const newScriptFuncs = new Map(scriptFuncs);
            newScriptFuncs.delete(name);

            if (newScriptFuncs.size === 0) {
                const newState = new Map(state.scriptFunctions);
                newState.delete(scriptId);
                return { scriptFunctions: newState };
            }

            const newState = new Map(state.scriptFunctions);
            newState.set(scriptId, newScriptFuncs);

            return { scriptFunctions: newState };
        });
    },

    getFunction: (scriptId, name) => {
        return get().scriptFunctions.get(scriptId)?.get(name);
    },

    getFunctionsForScript: (scriptId) => {
        const funcs = get().scriptFunctions.get(scriptId);
        return funcs ? Array.from(funcs.values()) : [];
    },

    clearScriptFunctions: (scriptId) => {
        set((state) => {
            const newState = new Map(state.scriptFunctions);
            newState.delete(scriptId);
            return { scriptFunctions: newState };
        });
    },

    clearAll: () => {
        set({
            scriptVariables: new Map(),
            scriptFunctions: new Map(),
        });
    },
}));

/**
 * React hook providing script-scoped intellisense operations (variables + functions)
 *
 * Creates a bound interface to the global store filtered to a specific script context.
 * Prevents cross-script contamination and simplifies component integration.
 *
 * Features:
 * - Automatic no-op for null/undefined script IDs (safe during loading states)
 * - Memoized return value to prevent unnecessary re-renders
 * - Complete CRUD operations for both variables AND functions
 * - Graceful degradation when script context unavailable
 *
 * @hook
 * @param {string | null | undefined} scriptId - Current script context identifier
 * @returns {Object} Script-scoped intellisense operations interface
 */
export function useScriptIntellisense(scriptId: string | null | undefined) {
    const store = useIntellisenseStore();

    return React.useMemo(() => {
        if (!scriptId) {
            return {
                addVariable: undefined,
                updateVariable: undefined,
                removeVariable: undefined,
                getVariable: undefined,
                getVariablesForScript: () => [],
                clearScriptVariables: undefined,

                addFunction: undefined,
                updateFunction: undefined,
                removeFunction: undefined,
                getFunction: undefined,
                getFunctionsForScript: () => [],
                clearScriptFunctions: undefined,
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

            addFunction: (func: FunctionDefinition) =>
                store.addFunction(scriptId, func),

            updateFunction: (name: string, updates: Partial<FunctionDefinition>) =>
                store.updateFunction(scriptId, name, updates),

            removeFunction: (name: string) =>
                store.removeFunction(scriptId, name),

            getFunction: (name: string) =>
                store.getFunction(scriptId, name),

            getFunctionsForScript: () =>
                store.getFunctionsForScript(scriptId),

            clearScriptFunctions: () =>
                store.clearScriptFunctions(scriptId),
        };
    }, [scriptId, store]);
}

/**
 * Legacy hook for backward compatibility (DEPRECATED - use useScriptIntellisense instead)
 * @deprecated Use useScriptIntellisense which includes both variables and functions
 */
export const useScriptVariables = useScriptIntellisense;