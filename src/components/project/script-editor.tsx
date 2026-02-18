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
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";

import { nodeTypes } from "./nodes/Manifest";
import { LuauType } from "@/types/luau";
import { cn } from "@/lib/utils";

/**
 * Properties interface for the ScriptEditor component
 */
export interface ScriptEditorProps {
    /** Currently selected script to edit, or null if none selected */
    selectedScript: Scripts | null;
}

/**
 * Interface for node picker context menu position and state
 */
interface NodePickerMenu {
    /** X coordinate for menu positioning */
    x: number;
    /** Y coordinate for menu positioning */
    y: number;
    /** ID of the source node initiating the connection */
    sourceNodeId: string;
    /** ID of the specific handle being used */
    sourceHandleId: string | null;
    /** Type of handle (source or target) */
    sourceHandleType: "source" | "target";
}

/**
 * Interface for node context menu position and state
 */
interface NodeContextMenu {
    /** ID of the node being right-clicked */
    id: string;
    /** X coordinate for menu positioning */
    x: number;
    /** Y coordinate for menu positioning */
    y: number;
}

/**
 * Interface for edge context menu position and state
 */
interface EdgeContextMenu {
    /** ID of the edge being right-clicked */
    id: string;
    /** X coordinate for menu positioning */
    x: number;
    /** Y coordinate for menu positioning */
    y: number;
}

/**
 * EditorCanvas component provides the core visual scripting interface
 *
 * This component handles:
 * - Node and edge management for the visual scripting flow
 * - Connection validation based on Luau type compatibility
 * - Context menus for node creation and manipulation
 * - Canvas interactions (pan, zoom, context menus)
 * - Type-safe connections between nodes
 *
 * The component automatically:
 * - Initializes with a Start node when a script is selected
 * - Validates connections based on Luau type compatibility
 * - Provides context menus for node creation and manipulation
 * - Handles node deletion and cloning operations
 * - Manages connection flows from drag operations
 *
 * @component
 * @param {ScriptEditorProps} props - Component properties
 *
 * @example
 * // Basic usage within ScriptEditor
 * <ReactFlowProvider>
 *   <EditorCanvas selectedScript={selectedScript} />
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

    const { screenToFlowPosition } = useReactFlow();

    /**
     * Initializes the editor with a Start node when a script is selected
     */
    useEffect(() => {
        if (selectedScript) {
            setNodes([
                {
                    id: "1",
                    type: "Start",
                    data: {},
                    position: { x: 300, y: 50 },
                    deletable: false,
                    selectable: false,
                },
            ]);
        }
    }, [selectedScript, setNodes]);

    const resolveHandles = (component: any, node: FlowNode) => {
        if (component.getHandles) {
            return component.getHandles(node.data);
        }

        return component.meta.handles;
    };

    /**
     * Handles connection validation and creation between nodes
     *
     * Now supports dynamic handle validation via node's validateConnection method
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
            setEdges(prev => addEdge(connection, prev));
        }
    }, [nodes, setEdges]);

    /**
     * Handles the start of a connection drag operation
     *
     * Stores connection start parameters for later use when the connection ends
     *
     * @param _ - Unused parameter (required by React Flow)
     * @param params - Connection start parameters
     */
    const onConnectStart = useCallback((_: any, params: OnConnectStartParams) => {
        connectStartRef.current = params;
    }, []);

    /**
     * Handles the end of a connection drag operation
     *
     * Determines if the connection ended on empty space (triggering node picker)
     * or on a valid target (completing the connection)
     *
     * @param event - Mouse or touch event ending the connection
     */
    const onConnectEnd = useCallback((event: MouseEvent | TouchEvent, connectionState: FinalConnectionState) => {
        if (!connectStartRef.current || !ref.current) return;

        const pane = ref.current.getBoundingClientRect();
        const { nodeId, handleId, handleType } = connectStartRef.current;

        let clientX = 0;
        let clientY = 0;

        if (event instanceof MouseEvent) {
            clientX = event.clientX;
            clientY = event.clientY;
        }

        if (nodeId && !connectionState.isValid) {
            setEdgeContextMenu(null);
            setNodeContextMenu(null);
            setNodePickerMenu({
                x: clientX - pane.left,
                y: clientY - pane.top,
                sourceNodeId: nodeId,
                sourceHandleId: handleId,
                sourceHandleType: handleType || "source",
            });
        }

        connectStartRef.current = null;
    }, []);

    /**
     * Handles right-click on the canvas (empty space)
     *
     * Opens the node picker menu at the clicked position
     *
     * @param event - Mouse event containing click coordinates
     */
    const onPaneContextMenu = useCallback((event: MouseEvent | React.MouseEvent<Element, MouseEvent>) => {
        event.preventDefault();
        if (!ref.current) return;

        const pane = ref.current.getBoundingClientRect();

        // Support both React and native events for clientX/clientY
        const clientX = 'clientX' in event ? event.clientX : 0;
        const clientY = 'clientY' in event ? event.clientY : 0;

        setNodeContextMenu(null);
        setEdgeContextMenu(null);
        setNodePickerMenu({
            x: clientX - pane.left,
            y: clientY - pane.top,
            sourceNodeId: "",
            sourceHandleId: null,
            sourceHandleType: "source",
        });
    }, []);

    /**
     * Handles right-click on a node
     *
     * Opens the context menu for node manipulation (clone, delete)
     * Prevents opening menu for Start node
     *
     * @param event - Mouse event containing click coordinates
     * @param node - Node that was right-clicked
     */
    const onNodeContextMenu = useCallback((event: React.MouseEvent, node: FlowNode) => {
        event.preventDefault();
        if (!ref.current) return;

        if (node.type === "Start") return;

        const pane = ref.current.getBoundingClientRect();

        setNodePickerMenu(null);
        setEdgeContextMenu(null);
        setNodeContextMenu({
            id: node.id,
            x: event.clientX - pane.left,
            y: event.clientY - pane.top,
        });
    }, []);

    /**
     * Handles right-click on an edge
     *
     * Opens the context menu for edge manipulation (delete)
     *
     * @param event - Mouse event containing click coordinates
     * @param edge - Edge that was right-clicked
     */
    const onEdgeContextMenu = useCallback((event: React.MouseEvent, edge: FlowEdge) => {
        event.preventDefault();
        if (!ref.current) return;

        const pane = ref.current.getBoundingClientRect();

        setNodePickerMenu(null);
        setNodeContextMenu(null);
        setEdgeContextMenu({
            id: edge.id,
            x: event.clientX - pane.left,
            y: event.clientY - pane.top,
        });
    }, []);

    /**
     * Adds a new node and optionally connects it to an existing node
     *
     * Now supports dynamic handle discovery via node's getHandles method
     */
    const addNodeAndConnect = (nodeType: string) => {
        if (!nodePickerMenu) return;

        const { x, y, sourceNodeId, sourceHandleId, sourceHandleType } = nodePickerMenu;

        const newNodeId = `${nodeType}-${Date.now()}`;
        const newNode: FlowNode = {
            id: newNodeId,
            type: nodeType,
            position: screenToFlowPosition({ x, y }),
            data: {},
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
                source: sourceHandleType === "source" ? sourceNodeId : newNodeId,
                sourceHandle: sourceHandleType === "source"
                    ? sourceHandleId ?? undefined
                    : targetHandleDef.id ?? undefined,
                target: sourceHandleType === "source" ? newNodeId : sourceNodeId,
                targetHandle: sourceHandleType === "source"
                    ? targetHandleDef.id ?? undefined
                    : sourceHandleId ?? undefined,
            };

            setEdges(prev => addEdge(newEdge, prev));
        }

        setNodePickerMenu(null);
    };

    /**
     * Deletes a node and all connected edges
     *
     * @param id - ID of the node to delete
     */
    const deleteNode = (id: string) => {
        setNodes(prev => prev.filter(n => n.id !== id));
        setEdges(prev => prev.filter(e => e.source !== id && e.target !== id));
        setNodeContextMenu(null);
    };

    /**
     * Creates a clone of a node with offset position
     *
     * @param id - ID of the node to clone
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
     * Deletes an edge
     *
     * @param id - ID of the edge to delete
     */
    const deleteEdge = (id: string) => {
        setEdges(prev => prev.filter(e => e.id !== id));
        setEdgeContextMenu(null);
    };

    /**
     * Handles closing context menus when clicking outside or pressing Escape
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
                <Background />
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
 * ScriptEditor component provides a visual interface for editing scripts
 *
 * This component provides:
 * - Visual canvas for script node editing using React Flow
 * - Interactive node-based editing environment
 * - Navigation controls and visual aids (minimap, grid background)
 * - Responsive layout that adapts to different screen sizes
 * - Clear empty state when no script is selected
 * - Card-based UI consistent with the application design system
 *
 * The component automatically:
 * - Displays the selected script's name in the header
 * - Renders the React Flow editor when a script is selected
 * - Shows a helpful empty state message when no script is selected
 * - Provides navigation controls (zoom, pan) through React Flow
 * - Includes a minimap for easier navigation of large node graphs
 * - Displays a background grid for better node positioning
 *
 * @component
 * @param {ScriptEditorProps} props - Component properties
 *
 * @example
 * // Basic usage in a project editor layout
 * <div className="flex h-screen">
 *   <ScriptList
 *     scripts={scripts}
 *     selectedScript={selectedScript}
 *     onSelectScript={setSelectedScript}
 *     onCreateScript={handleCreateScript}
 *     onRenameScript={handleRenameScript}
 *     onDeleteScript={handleDeleteScript}
 *   />
 *   <ScriptEditor selectedScript={selectedScript} />
 * </div>
 *
 * @example
 * // With minimal setup for a simple implementation
 * <ScriptEditor selectedScript={currentScript} />
 *
 * @example
 * // In a responsive dashboard layout
 * <div className="min-h-screen bg-background">
 *   <DashboardHeader />
 *   <div className="flex h-[calc(100vh-64px)]">
 *     <ScriptList scripts={scripts} ... />
 *     <ScriptEditor selectedScript={selectedScript} />
 *   </div>
 * </div>
 */
export function ScriptEditor({ selectedScript }: ScriptEditorProps) {
    return (
        <main className="flex-1 w-full overflow-y-auto z-10">
            <Card className="h-full bg-transparent rounded-none border-0 shadow-none p-0 gap-0">
                <CardHeader className="flex items-center justify-between border-b border-border bg-card/30 backdrop-blur px-6 py-4">
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