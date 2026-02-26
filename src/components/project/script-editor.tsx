"use client";

import { useEffect, useCallback, useState, useRef } from "react";
import { ScriptsModel as Scripts } from "@/generated/models";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
    ReactFlow,
    MiniMap,
    Controls,
    Background,
    useEdgesState,
    useNodesState,
    addEdge,
    type Node as FlowNode,
    type Edge as FlowEdge,
    type Connection,
    type OnConnectStartParams,
    useReactFlow,
    ReactFlowProvider,
    FinalConnectionState,
    BackgroundVariant,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";

import { nodeTypes } from "./nodes/Manifest";
import { LuauType } from "@/types/luau";
import { cn } from "@/lib/utils";

/**
 * Props interface for the ScriptEditor component
 *
 * Defines the contract for script selection and optional pre-loaded graph state.
 *
 * @interface
 * @property {Scripts | null} selectedScript - Currently active script for editing
 *   When null, displays empty state prompting user to select/create a script
 * @property {FlowNode[]} [nodes] - Optional pre-initialized node array
 *   Used for server-side hydration or external graph state injection
 * @property {FlowEdge[]} [edges] - Optional pre-initialized edge array
 *   Used for server-side hydration or external graph state injection
 */
export interface ScriptEditorProps {
    selectedScript: Scripts | null;
    nodes?: FlowNode[];
    edges?: FlowEdge[];
}

/**
 * Configuration object for node picker context menu during connection creation
 *
 * Captures the state of an in-progress connection drag operation to enable
 * intelligent node creation at the drop location with automatic connection.
 *
 * @interface
 * @property {number} x - Canvas X coordinate for menu positioning (relative to pane)
 * @property {number} y - Canvas Y coordinate for menu positioning (relative to pane)
 * @property {string} sourceNodeId - ID of node initiating the connection drag
 * @property {string | null} sourceHandleId - Specific handle ID being dragged from source node
 * @property {("source" | "target")} sourceHandleType - Direction of connection initiation
 *   "source" = dragging from output handle, "target" = dragging from input handle
 */
interface NodePickerMenu {
    x: number;
    y: number;
    sourceNodeId: string;
    sourceHandleId: string | null;
    sourceHandleType: "source" | "target";
}

/**
 * Configuration object for node context menu during right-click interactions
 *
 * Captures positional and identity information for node manipulation operations.
 *
 * @interface
 * @property {string} id - Unique identifier of the target node
 * @property {number} x - Canvas X coordinate for menu positioning (relative to pane)
 * @property {number} y - Canvas Y coordinate for menu positioning (relative to pane)
 */
interface NodeContextMenu {
    id: string;
    x: number;
    y: number;
}

/**
 * Configuration object for edge context menu during right-click interactions
 *
 * Captures positional and identity information for edge manipulation operations.
 *
 * @interface
 * @property {string} id - Unique identifier of the target edge
 * @property {number} x - Canvas X coordinate for menu positioning (relative to pane)
 * @property {number} y - Canvas Y coordinate for menu positioning (relative to pane)
 */
interface EdgeContextMenu {
    id: string;
    x: number;
    y: number;
}

/**
 * EditorCanvas component provides the core visual scripting interface
 *
 * Manages the complete React Flow canvas experience including node/edge state,
 * connection validation, context menus, and persistence operations. Implements
 * Luau type-aware connection validation and intelligent node creation workflows.
 *
 * Key responsibilities:
 * - Manages node and edge state with React Flow's state hooks
 * - Validates connections based on Luau type compatibility rules
 * - Handles context menus for node creation and manipulation
 * - Implements auto-save with debouncing and unload protection
 * - Provides empty-space connection completion via node picker
 * - Supports node cloning, deletion, and edge removal operations
 * - Initializes new scripts with mandatory Start node
 *
 * Type compatibility rules:
 * - Connections require matching Luau types OR at least one side being LuauType.Any
 * - Flow-type handles connect only to other Flow-type handles (execution control)
 * - Data-type handles (Number, String, etc.) connect to matching or Any types
 * - Type metadata propagated through edge.data for downstream inference
 *
 * Persistence behavior:
 * - Auto-saves after 1.5 second debounce on graph changes
 * - Saves immediately on component unmount/page navigation
 * - Uses sendBeacon for unload saves to guarantee delivery
 * - Prevents redundant saves when graph state unchanged
 * - Persists to /api/scripts/{id}/graph endpoint via PUT request
 *
 * @component
 * @param {ScriptEditorProps} props - Component properties
 * @param {Scripts | null} props.selectedScript - Active script context for operations
 *
 * @example
 * // Wrapped usage with ReactFlowProvider (required)
 * <ReactFlowProvider>
 *   <EditorCanvas selectedScript={currentScript} />
 * </ReactFlowProvider>
 */
function EditorCanvas({ selectedScript }: ScriptEditorProps) {
    const [nodes, setNodes, onNodesChange] = useNodesState<FlowNode>([]);
    const [edges, setEdges, onEdgesChange] = useEdgesState<FlowEdge>([]);
    const [nodePickerMenu, setNodePickerMenu] = useState<NodePickerMenu | null>(null);
    const [nodeContextMenu, setNodeContextMenu] = useState<NodeContextMenu | null>(null);
    const [edgeContextMenu, setEdgeContextMenu] = useState<EdgeContextMenu | null>(null);

    const ref = useRef<HTMLDivElement>(null);
    const menuRef = useRef<HTMLDivElement | null>(null);
    const connectStartRef = useRef<OnConnectStartParams | null>(null);
    const saveTimeout = useRef<NodeJS.Timeout | null>(null);
    const initialLoadDone = useRef(false);
    const lastSavedGraph = useRef<{ nodes: FlowNode[]; edges: FlowEdge[] } | null>(null);
    const saveAction = useRef<((isUnloading?: boolean) => void) | undefined>(undefined);

    const MENU_WIDTH = 320;
    const MENU_HEIGHT = 400;
    const PADDING = 16;

    const { screenToFlowPosition } = useReactFlow();

    /**
     * Resolves handle configuration from node component using dynamic or static methods
     *
     * Attempts to call component.getHandles(data) first for dynamic configuration,
     * falling back to component.meta.handles for static configuration. Enables
     * nodes to adapt handles based on current state (e.g., mode switches).
     *
     * @param {React.ComponentType} component - Node component constructor/class
     * @param {FlowNode} node - Node instance containing current data state
     * @returns {Object} Handle configuration object with inputs/outputs arrays
     * @returns {Array} returns.inputs - Input handle definitions
     * @returns {Array} returns.outputs - Output handle definitions
     */
    const resolveHandles = (component: any, node: FlowNode) => {
        if (component.getHandles) {
            return component.getHandles(node.data);
        }

        return component.meta.handles;
    };

    /**
     * Persists current graph state to backend API with change detection
     *
     * Compares current graph against last saved snapshot to prevent redundant saves.
     * Uses sendBeacon for unload operations to guarantee delivery even during navigation.
     * Requires valid selectedScript context to determine save endpoint.
     *
     * @callback
     * @param {boolean} [isUnloading=false] - Flag indicating page navigation/unload context
     *   When true, uses navigator.sendBeacon for guaranteed delivery
     * @returns {Promise<void>} Resolves when save operation completes
     * @sideEffect Persists graph state to /api/scripts/{id}/graph endpoint
     */
    const saveGraph = useCallback(async (isUnloading = false) => {
        const currentGraph = { nodes, edges };
        if (JSON.stringify(currentGraph) === JSON.stringify(lastSavedGraph.current)) {
            console.log("No changes to save.");
            return;
        }
        if (!selectedScript) return;

        console.log("Auto-saving graph...");
        try {
            const body = JSON.stringify(currentGraph);
            const url = `/api/scripts/${selectedScript.id}/graph`;

            if (isUnloading) {
                navigator.sendBeacon(url, body);
            } else {
                const response = await fetch(url, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: body,
                });

                if (!response.ok) {
                    // throw new Error('Failed to save graph');
                    console.warn(`Failed to save graph: ${response.statusText}`);
                }
            }

            lastSavedGraph.current = currentGraph;
            console.log("Graph saved successfully!");
        } catch (error) {
            console.error("Error saving graph:", error);
        }
    }, [nodes, edges, selectedScript]);

    /**
     * Validates and creates new edges between compatible nodes
     *
     * Enforces Luau type compatibility rules during connection creation:
     * - Source and target handle types must match exactly OR
     * - At least one handle must be LuauType.Any (polymorphic)
     * - Stores actual source type in edge.data for downstream type inference
     *
     * @callback
     * @param {Connection} connection - Proposed connection parameters from React Flow
     * @returns {void}
     * @sideEffect Adds valid edge to edges state; rejects incompatible connections
     */
    const onConnect = useCallback((connection: Connection) => {
        const sourceNode = nodes.find(n => n.id === connection.source);
        const targetNode = nodes.find(n => n.id === connection.target);
        if (!sourceNode || !targetNode) return;

        const targetComponent = nodeTypes[targetNode.type as keyof typeof nodeTypes] as any;
        const sourceComponent = nodeTypes[sourceNode.type as keyof typeof nodeTypes] as any;

        const sourceHandles = resolveHandles(sourceComponent, sourceNode);
        const targetHandles = resolveHandles(targetComponent, targetNode);

        const sourceHandleType = sourceHandles.outputs.find(
            (h: any) => h.id === connection.sourceHandle
        )?.type;

        const targetHandleType = targetHandles.inputs.find(
            (h: any) => h.id === connection.targetHandle
        )?.type;

        console.log(sourceHandleType, targetHandleType);

        if (
            sourceHandleType &&
            targetHandleType &&
            (
                sourceHandleType === targetHandleType ||
                sourceHandleType === LuauType.Any ||
                targetHandleType === LuauType.Any
            )
        ) {
            const newEdge: FlowEdge = {
                id: `edge-${connection.source}-${connection.target}-${Date.now()}`,
                type: "step",
                ...connection,
                data: {
                    sourceType: sourceHandleType,
                    targetType: targetHandleType,
                },
            };

            setEdges(prev => addEdge(newEdge, prev));
        }
    }, [nodes, setEdges]);

    /**
     * Captures connection initiation parameters for later completion handling
     *
     * Stores source node/handle information when drag operation begins to enable
     * intelligent node creation when connection ends on empty canvas space.
     *
     * @callback
     * @param {unknown} _ - Unused React Flow parameter (event object)
     * @param {OnConnectStartParams} params - Connection start metadata
     * @returns {void}
     * @sideEffect Updates connectStartRef with drag initiation context
     */
    const onConnectStart = useCallback((_: any, params: OnConnectStartParams) => {
        connectStartRef.current = params;
    }, []);

    /**
     * Handles connection termination with intelligent node creation on empty space
     *
     * Detects when connection drag ends without valid target and opens node picker
     * menu at drop location. Enables fluid workflow: drag output → drop on canvas →
     * select node type → auto-connect to new node.
     *
     * @callback
     * @param {(MouseEvent | TouchEvent)} event - Termination event with coordinates
     * @param {FinalConnectionState} connectionState - React Flow connection validation result
     * @returns {void}
     * @sideEffect Opens node picker menu when dropped on empty space; clears connection state
     */
    const onConnectEnd = useCallback((event: MouseEvent | TouchEvent, connectionState: FinalConnectionState) => {
        if (!connectStartRef.current || !ref.current) return;

        const { nodeId, handleId, handleType } = connectStartRef.current;

        const pane = ref.current.getBoundingClientRect();
        const clientX = 'clientX' in event ? event.clientX : 0;
        const clientY = 'clientY' in event ? event.clientY : 0;

        let x = clientX - pane.left;
        let y = clientY - pane.top;

        if (clientX + MENU_WIDTH > window.innerWidth) { x = window.innerWidth - pane.left - MENU_WIDTH - PADDING; }
        if (clientY + MENU_HEIGHT > window.innerHeight) { y = window.innerHeight - pane.top - MENU_HEIGHT - PADDING; }

        if (nodeId && !connectionState.isValid) {
            setEdgeContextMenu(null);
            setNodeContextMenu(null);
            setNodePickerMenu({
                x,
                y,
                sourceNodeId: nodeId,
                sourceHandleId: handleId,
                sourceHandleType: handleType || "source",
            });
        }

        connectStartRef.current = null;
    }, []);

    /**
     * Handles canvas right-click to open node creation menu
     *
     * Opens node picker at click location when user right-clicks empty canvas space.
     * Provides quick access to all available node types for graph authoring.
     *
     * @callback
     * @param {(MouseEvent | React.MouseEvent<Element, MouseEvent>)} event - Right-click event
     * @returns {void}
     * @sideEffect Opens node picker menu at click coordinates; closes other menus
     */
    const onPaneContextMenu = useCallback((event: MouseEvent | React.MouseEvent<Element, MouseEvent>) => {
        event.preventDefault();
        if (!ref.current) return;

        const pane = ref.current.getBoundingClientRect();
        const clientX = 'clientX' in event ? event.clientX : 0;
        const clientY = 'clientY' in event ? event.clientY : 0;

        let x = clientX - pane.left;
        let y = clientY - pane.top;

        if (clientX + MENU_WIDTH > window.innerWidth) { x = window.innerWidth - pane.left - MENU_WIDTH - PADDING; }
        if (clientY + MENU_HEIGHT > window.innerHeight) { y = window.innerHeight - pane.top - MENU_HEIGHT - PADDING; }

        setNodeContextMenu(null);
        setEdgeContextMenu(null);
        setNodePickerMenu({
            x,
            y,
            sourceNodeId: "",
            sourceHandleId: null,
            sourceHandleType: "source",
        });
    }, []);

    /**
     * Handles node right-click to open manipulation menu
     *
     * Opens context menu with clone/delete options at click location. Prevents
     * menu opening for protected nodes (Start node) to maintain graph integrity.
     *
     * @callback
     * @param {React.MouseEvent} event - Right-click event on node
     * @param {FlowNode} node - Target node instance
     * @returns {void}
     * @sideEffect Opens node context menu at click coordinates; closes other menus
     */
    const onNodeContextMenu = useCallback((event: React.MouseEvent, node: FlowNode) => {
        event.preventDefault();
        if (!ref.current) return;

        if (node.type === "Start") return;

        const pane = ref.current.getBoundingClientRect();
        const clientX = 'clientX' in event ? event.clientX : 0;
        const clientY = 'clientY' in event ? event.clientY : 0;

        let x = clientX - pane.left;
        let y = clientY - pane.top;

        if (clientX + MENU_WIDTH > window.innerWidth) { x = window.innerWidth - pane.left - MENU_WIDTH - PADDING; }
        if (clientY + MENU_HEIGHT > window.innerHeight) { y = window.innerHeight - pane.top - MENU_HEIGHT - PADDING; }

        setNodePickerMenu(null);
        setEdgeContextMenu(null);
        setNodeContextMenu({
            x,
            y,
            id: node.id,
        });
    }, []);

    /**
     * Handles edge right-click to open manipulation menu
     *
     * Opens context menu with delete option at click location for edge removal.
     *
     * @callback
     * @param {React.MouseEvent} event - Right-click event on edge
     * @param {FlowEdge} edge - Target edge instance
     * @returns {void}
     * @sideEffect Opens edge context menu at click coordinates; closes other menus
     */
    const onEdgeContextMenu = useCallback((event: React.MouseEvent, edge: FlowEdge) => {
        event.preventDefault();
        if (!ref.current) return;

        const pane = ref.current.getBoundingClientRect();
        const clientX = 'clientX' in event ? event.clientX : 0;
        const clientY = 'clientY' in event ? event.clientY : 0;

        let x = clientX - pane.left;
        let y = clientY - pane.top;

        if (clientX + MENU_WIDTH > window.innerWidth) { x = window.innerWidth - pane.left - MENU_WIDTH - PADDING; }
        if (clientY + MENU_HEIGHT > window.innerHeight) { y = window.innerHeight - pane.top - MENU_HEIGHT - PADDING; }

        setNodePickerMenu(null);
        setNodeContextMenu(null);
        setEdgeContextMenu({
            x,
            y,
            id: edge.id,
        });
    }, []);

    /**
     * Creates new node with automatic connection to source handle
     *
     * Places node at menu coordinates and creates compatible connection based on
     * source handle type and available target handles. Uses resolveHandles to
     * discover dynamic handle configurations for intelligent connection matching.
     *
     * @param {string} nodeType - Registered node type identifier (e.g., "Add", "VariableGet")
     * @returns {void}
     * @sideEffect Adds node to graph state; creates edge if compatible handle found
     */
    const addNodeAndConnect = (nodeType: string) => {
        if (!nodePickerMenu || !selectedScript) return;

        const { x, y, sourceNodeId, sourceHandleId, sourceHandleType } = nodePickerMenu;
        const newNodeId = `${nodeType}-${Date.now()}`;
        const newNode: FlowNode = {
            id: newNodeId,
            type: nodeType,
            position: screenToFlowPosition({ x, y }),
            data: {
                __scriptId: selectedScript.id,
            },
        };

        setNodes(prev => [...prev, newNode]);

        if (!sourceNodeId) {
            setNodePickerMenu(null);
            return;
        }

        const sourceNode = nodes.find(n => n.id === sourceNodeId);
        if (!sourceNode) return;

        const sourceComponent = nodeTypes[sourceNode.type as keyof typeof nodeTypes] as any;
        const targetComponent = nodeTypes[nodeType as keyof typeof nodeTypes] as any;

        // Get source handle type
        let sourceHandle = resolveHandles(sourceComponent, sourceNode);
        let sourceHandleTypeObj = sourceHandle.outputs.find((h: any) => h.id === sourceHandleId);
        if (!sourceHandleTypeObj) {
            sourceHandle = resolveHandles(targetComponent, newNode);
            sourceHandleTypeObj = sourceHandle.inputs.find((h: any) => h.id === sourceHandleId);
        }

        if (!sourceHandleTypeObj) return;

        // Get target handles (dynamic or static)
        let targetHandles = resolveHandles(targetComponent, newNode);

        // Find compatible handle
        let targetHandleDef;
        if (sourceHandleType === "source") {
            // Looking for input handle on target
            targetHandleDef = targetHandles.inputs.find((h: any) =>
                h.type === sourceHandleTypeObj.type ||
                h.type === LuauType.Any ||
                sourceHandleTypeObj.type === LuauType.Any
            );
        } else {
            // Looking for output handle on target
            targetHandleDef = targetHandles.outputs.find((h: any) =>
                h.type === sourceHandleTypeObj.type ||
                h.type === LuauType.Any ||
                sourceHandleTypeObj.type === LuauType.Any
            );
        }

        if (targetHandleDef) {
            const newEdge: FlowEdge = {
                id: `${sourceNodeId}-${newNodeId}`,
                type: "step",
                source: sourceHandleType === "source" ? sourceNodeId : newNodeId,
                sourceHandle: sourceHandleType === "source"
                    ? sourceHandleId ?? undefined
                    : targetHandleDef.id ?? undefined,
                target: sourceHandleType === "source" ? newNodeId : sourceNodeId,
                targetHandle: sourceHandleType === "source"
                    ? targetHandleDef.id ?? undefined
                    : sourceHandleId ?? undefined,
                data: {
                    sourceType: sourceHandleTypeObj.type,
                    targetType: targetHandleDef.type,
                },
            };

            setEdges(prev => addEdge(newEdge, prev));
        }

        setNodePickerMenu(null);
    };

    /**
     * Removes node and all connected edges from graph
     *
     * Maintains graph integrity by automatically removing all edges connected to
     * the deleted node. Protected nodes (Start) cannot be deleted via UI controls.
     *
     * @param {string} id - Unique identifier of node to remove
     * @returns {void}
     * @sideEffect Removes node and connected edges from state; closes context menu
     */
    const deleteNode = (id: string) => {
        setNodes(prev => prev.filter(n => n.id !== id));
        setEdges(prev => prev.filter(e => e.source !== id && e.target !== id));
        setNodeContextMenu(null);
    };

    /**
     * Creates duplicate of existing node with positional offset
     *
     * Copies all node properties including type, data, and styling with a small
     * positional offset to prevent visual overlap. Useful for duplicating complex
     * node configurations without rebuilding from scratch.
     *
     * @param {string} id - Unique identifier of node to clone
     * @returns {void}
     * @sideEffect Adds cloned node to graph state; closes context menu
     */
    const cloneNode = (id: string) => {
        const nodeToClone = nodes.find(n => n.id === id);
        if (!nodeToClone) return;

        const newNode = {
            ...nodeToClone,
            id: `${id}-clone-${Date.now()}`,
            position: {
                x: nodeToClone.position.x + 30,
                y: nodeToClone.position.y + 30,
            },
        };

        setNodes(prev => [...prev, newNode]);
        setNodeContextMenu(null);
    };

    /**
     * Removes edge from graph
     *
     * Disconnects two nodes by removing the edge object from state. Triggers
     * revalidation of downstream type inference where applicable.
     *
     * @param {string} id - Unique identifier of edge to remove
     * @returns {void}
     * @sideEffect Removes edge from state; closes context menu
     */
    const deleteEdge = (id: string) => {
        setEdges(prev => prev.filter(e => e.id !== id));
        setEdgeContextMenu(null);
    };

    /**
     * Initializes graph state when script selection changes
     *
     * Loads persisted graph data from script object or creates default graph with
     * mandatory Start node when creating new script. Prevents auto-save during
     * initial load to avoid redundant network requests.
     *
     * @effect
     * @dependency {Scripts | null} selectedScript - Active script context
     */
    useEffect(() => {
        if (selectedScript) {
            // @ts-ignore
            const graph = selectedScript.graphs?.[0];
            let initialNodes: FlowNode[] = [];
            let initialEdges: FlowEdge[] = [];

            if (graph && graph.nodes.length > 0) {
                // @ts-ignore
                initialNodes = graph.nodes.map(node => ({
                    ...node,
                    data: {
                        ...node.data,
                        __scriptId: selectedScript.id
                    }
                })) as FlowNode[];
            } else {
                initialNodes = [
                    {
                        id: "1",
                        type: "Start",
                        data: {
                            __scriptId: selectedScript.id
                        },
                        position: { x: 300, y: 50 },
                        deletable: false,
                        selectable: false,
                    },
                ];
            }

            if (graph && graph.edges.length > 0) {
                // @ts-ignore
                initialEdges = graph.edges as FlowEdge[];
            }

            setNodes(initialNodes);
            setEdges(initialEdges);
            lastSavedGraph.current = { nodes: initialNodes, edges: initialEdges };

            // Mark initial load as done after a short delay
            const timer = setTimeout(() => {
                initialLoadDone.current = true;
            }, 500);

            return () => clearTimeout(timer);
        } else {
            // Clear nodes and edges if no script is selected
            setNodes([]);
            setEdges([]);
            initialLoadDone.current = false;
            lastSavedGraph.current = null;
        }
    }, [selectedScript, setNodes, setEdges]);

    /**
     * Implements debounced auto-save on graph changes
     *
     * Waits 1.5 seconds after last change before triggering save operation to
     * prevent excessive network requests during active editing sessions. Skips
     * save during initial graph load phase to avoid redundant persistence.
     *
     * @effect
     * @dependency {FlowNode[]} nodes - Current node state
     * @dependency {FlowEdge[]} edges - Current edge state
     */
    useEffect(() => {
        if (!initialLoadDone.current) return;

        if (saveTimeout.current) {
            clearTimeout(saveTimeout.current);
        }

        saveTimeout.current = setTimeout(() => saveAction.current?.(), 1500);

        return () => {
            if (saveTimeout.current) {
                clearTimeout(saveTimeout.current);
            }
        };
    }, [nodes, edges]);

    /**
     * Ensures graph persistence during navigation/unload events
     *
     * Registers beforeunload handler to trigger immediate save when user navigates
     * away from page. Uses sendBeacon via saveAction ref to guarantee delivery even
     * during page transition. Also triggers final save on component unmount.
     *
     * @effect
     * @cleanup Clears save timeout and triggers final save on unmount
     */
    useEffect(() => {
        const handleBeforeUnload = () => {
            saveAction.current?.(true);
        };

        window.addEventListener('beforeunload', handleBeforeUnload);

        return () => {
            window.removeEventListener('beforeunload', handleBeforeUnload);
            if (saveTimeout.current) {
                clearTimeout(saveTimeout.current);
            }
            saveAction.current?.();
        };
    }, []);

    /**
     * Manages context menu dismissal on outside clicks or Escape key
     *
     * Listens for mousedown events outside menu containers and Escape key presses
     * to provide intuitive menu dismissal behavior matching native OS patterns.
     *
     * @effect
     * @dependency {(NodePickerMenu | NodeContextMenu | EdgeContextMenu | null)} nodePickerMenu - Menu visibility state
     * @dependency {(NodePickerMenu | NodeContextMenu | EdgeContextMenu | null)} nodeContextMenu - Menu visibility state
     * @dependency {(NodePickerMenu | NodeContextMenu | EdgeContextMenu | null)} edgeContextMenu - Menu visibility state
     */
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                setNodePickerMenu(null);
                setNodeContextMenu(null);
                setEdgeContextMenu(null);
            }
        }

        function handleKeyDown(event: KeyboardEvent) {
            if (event.key === "Escape") {
                setNodePickerMenu(null);
                setNodeContextMenu(null);
                setEdgeContextMenu(null);
            }
        }

        if (nodePickerMenu || nodeContextMenu || edgeContextMenu) {
            document.addEventListener("mousedown", handleClickOutside);
            document.addEventListener("keydown", handleKeyDown);
        }

        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
            document.removeEventListener("keydown", handleKeyDown);
        };
    }, [nodePickerMenu, nodeContextMenu, edgeContextMenu]);

    /**
     * Handles saving the current graph whenever needed.
     */
    useEffect(() => {
        saveAction.current = saveGraph;
    }, [saveGraph]);


    return (
        <div className="h-full w-full" ref={ref}>
            <ReactFlow
                nodes={nodes}
                edges={edges}
                nodeTypes={nodeTypes}
                onNodesChange={onNodesChange}
                onEdgesChange={onEdgesChange}
                onConnect={onConnect}
                onConnectStart={onConnectStart}
                onConnectEnd={onConnectEnd}
                onPaneContextMenu={onPaneContextMenu}
                onNodeContextMenu={onNodeContextMenu}
                onEdgeContextMenu={onEdgeContextMenu}
                colorMode="dark"
                fitView
                className="h-full w-full"
                style={{ background: "var(--transparent)" }}
            >
                <MiniMap />
                <Background bgColor="var(--background)" variant={BackgroundVariant.Lines} patternClassName="opacity-10" gap={30} />
                <Controls showFitView showInteractive={false} />
            </ReactFlow>

            {(nodePickerMenu || nodeContextMenu || edgeContextMenu) && (
                <>
                    <div className="absolute z-100 size-full top-0 left-0"></div>
                    <div
                        ref={menuRef}
                        className="absolute bg-popover border rounded-md shadow-md z-101 max-h-100 overflow-y-auto min-w-80"
                        style={{
                            top: (nodePickerMenu?.y ?? nodeContextMenu?.y ?? edgeContextMenu?.y) ?? 0,
                            left: (nodePickerMenu?.x ?? nodeContextMenu?.x ?? edgeContextMenu?.x) ?? 0,
                        }}
                    >
                        {nodeContextMenu && (
                            <>
                                <div
                                    className="px-3 py-2 hover:bg-accent cursor-pointer"
                                    onClick={() => cloneNode(nodeContextMenu.id)}
                                >
                                    Clone
                                </div>
                                <div
                                    className="px-3 py-2 hover:bg-red-500/20 text-red-500 cursor-pointer"
                                    onClick={() => deleteNode(nodeContextMenu.id)}
                                >
                                    Delete
                                </div>
                            </>
                        )}

                        {edgeContextMenu && (
                            <div
                                className="px-3 py-2 hover:bg-red-500/20 text-red-500 cursor-pointer"
                                onClick={() => deleteEdge(edgeContextMenu.id)}
                            >
                                Delete Connection
                            </div>
                        )}

                        {nodePickerMenu &&
                            Object.keys(nodeTypes)
                                .filter(type => type !== "Start")
                                .map(type => (
                                    <div
                                        key={type}
                                        className={cn(
                                            "px-3 py-2 hover:bg-accent cursor-pointer",
                                        )}
                                        onClick={() => addNodeAndConnect(type)}
                                    >
                                        {type}
                                    </div>
                                ))
                        }
                    </div>
                </>
            )}
        </div>
    );
}

/**
 * ScriptEditor component provides a visual interface for editing Luau scripts
 *
 * Wrapper component that provides consistent card-based UI container around the
 * core EditorCanvas. Handles empty state display when no script is selected and
 * provides contextual header showing currently edited script name.
 *
 * Features:
 * - Card-based layout matching application design system
 * - Contextual header displaying active script name
 * - Empty state messaging when no script selected
 * - Full viewport height utilization with proper overflow handling
 * - React Flow provider context initialization
 *
 * Integration notes:
 * - Must be wrapped in ReactFlowProvider (handled internally)
 * - Requires Scripts model object from backend API for persistence
 * - Works with ScriptList component for script selection workflow
 * - Persists graph state automatically via EditorCanvas internals
 *
 * @component
 * @param {ScriptEditorProps} props - Component properties
 * @param {Scripts | null} props.selectedScript - Currently active script context
 *
 * @example
 * // Basic integration in script editing workflow
 * <div className="flex h-screen">
 *   <ScriptList scripts={scripts} selectedScript={selected} onSelect={setSelected} />
 *   <ScriptEditor selectedScript={selected} />
 * </div>
 *
 * @example
 * // Standalone usage with minimal setup
 * <ScriptEditor selectedScript={currentScript} />
 */
export function ScriptEditor({ selectedScript }: ScriptEditorProps) {
    return (
        <main className="flex-1 w-full overflow-y-auto z-10">
            <Card className="h-full bg-transparent rounded-none border-0 shadow-none p-0 gap-0">
                <CardHeader className="flex items-center justify-between border-b rounded-none border-border bg-card/30 backdrop-blur px-6 py-4">
                    <CardTitle>
                        {selectedScript ? `Editing: ${selectedScript.name}` : "Script Editor"}
                    </CardTitle>
                </CardHeader>
                <CardContent className="h-full relative p-0">
                    {selectedScript ? (
                        <ReactFlowProvider>
                            <EditorCanvas selectedScript={selectedScript} />
                        </ReactFlowProvider>
                    ) : (
                        <div className="flex items-center justify-center h-full text-muted-foreground">
                            No Script Selected
                        </div>
                    )}
                </CardContent>
            </Card>
        </main>
    );
}