"use client";

import { useEffect } from "react";
import { useIntellisenseStore } from "@/stores/intellisense-store";

/**
 * Hook for managing variable scope lifecycle in visual scripting nodes
 * 
 * Automatically creates/destroys scopes and handles scope entry/exit for nodes
 * that define new variable scopes (functions, loops, conditionals, etc.)
 *
 * @param scriptId - The script ID for scope isolation
 * @param nodeId - The React Flow node ID
 * @param scopeType - Type of scope ("function", "loop", "block")
 * @param parentScopeId - Optional parent scope ID for nested scopes
 * @param initialVariables - Optional initial variables to add to the scope
 * @returns Object with scope ID and management functions
 */
export function useScopeManagement(
    scriptId: string | undefined,
    nodeId: string,
    scopeType: "function" | "loop" | "block",
    parentScopeId?: string,
    initialVariables: Array<{ name: string; type: string; isConstant?: boolean }> = []
) {
    const scopeId = `${nodeId}-${scopeType}-scope`;

    useEffect(() => {
        if (!scriptId) {
            console.warn(`useScopeManagement: scriptId is undefined for node ${nodeId}`);
            return;
        }

        // Create the scope
        useIntellisenseStore.getState().createScope(scriptId, {
            id: scopeId,
            scopeType: scopeType,
            nodeId: nodeId,
            parentScopeId: parentScopeId,
            variableNames: new Set(initialVariables.map(v => v.name)),
            childScopeIds: new Set(),
        });

        // Add initial variables to the scope
        initialVariables.forEach(variable => {
            useIntellisenseStore.getState().addVariable(scriptId, {
                name: variable.name,
                type: variable.type as any,
                scopeId: scopeId,
                scopeType: scopeType,
                isConstant: variable.isConstant ?? false,
            });
        });

        // Enter the scope (make it the active scope)
        useIntellisenseStore.getState().enterScope(scriptId, scopeId);

        return () => {
            // Exit the scope when component unmounts
            useIntellisenseStore.getState().exitScope(scriptId, scopeId);

            // Remove variables from the scope
            initialVariables.forEach(variable => {
                useIntellisenseStore.getState().removeVariable(scriptId, variable.name);
            });

            // Destroy the scope
            useIntellisenseStore.getState().destroyScope(scriptId, scopeId);
        };
    }, [scriptId, nodeId, scopeId, scopeType, parentScopeId, initialVariables]);

    return {
        scopeId,
        enterScope: () => {
            if (scriptId) {
                useIntellisenseStore.getState().enterScope(scriptId, scopeId);
            }
        },
        exitScope: () => {
            if (scriptId) {
                useIntellisenseStore.getState().exitScope(scriptId, scopeId);
            }
        },
    };
}

/**
 * Hook for temporarily entering a scope (e.g., when editing function parameters)
 * 
 * Useful for nodes that need to temporarily switch to a different scope
 * while maintaining their original scope context
 *
 * @param scriptId - The script ID for scope isolation
 * @param targetScopeId - The scope ID to enter
 */
export function useTemporaryScope(scriptId: string | undefined, targetScopeId: string | undefined) {
    useEffect(() => {
        if (!scriptId || !targetScopeId) return;

        // Enter the target scope
        useIntellisenseStore.getState().enterScope(scriptId, targetScopeId);

        return () => {
            // Exit the target scope when component unmounts
            useIntellisenseStore.getState().exitScope(scriptId, targetScopeId);
        };
    }, [scriptId, targetScopeId]);
}

/**
 * Hook for getting variables visible in the current scope
 * 
 * Returns variables that are visible in the current active scope,
 * including variables from parent scopes and global variables
 *
 * @param scriptId - The script ID for scope isolation
 */
export function useScopedVariables(scriptId: string | undefined) {
    const store = useIntellisenseStore();
    
    return store((state) => {
        if (!scriptId) return [];
        
        const currentScopeId = state.getCurrentScopeId(scriptId);
        if (currentScopeId) {
            return state.getVisibleVariablesForScope(scriptId, currentScopeId);
        }
        
        // Fallback to all script variables if no scope is active
        return state.getVariablesForScript(scriptId);
    });
}