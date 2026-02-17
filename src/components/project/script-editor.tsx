"use client";

import { ScriptsModel as Scripts } from "@/generated/models";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
    ReactFlow,
    MiniMap,
    Controls,
    Background,
    useEdgesState,
    useNodesState,
    type Node,
    type Edge,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";

// Nodes
import StartNode from "./nodes/Start";
import { useEffect } from "react";

/**
 * Properties interface for the ScriptEditor component
 */
export interface ScriptEditorProps {
    /** Currently selected script to edit, or null if none selected */
    selectedScript: Scripts | null;
}

const nodeTypes = {
    Start: StartNode,
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
    const [nodes, setNodes, onNodesChange] = useNodesState([] as Node[]);
    const [edges, setEdges, onEdgesChange] = useEdgesState([] as Edge[]);

    useEffect(() => {
        if (selectedScript) {
            setNodes([
                {
                    id: "1",
                    type: "Start",
                    data: {},
                    position: { x: 300, y: 50 },
                }
            ]);
        }
    }, [selectedScript]);

    return (
        <main className="flex-1 w-full overflow-y-auto z-10" aria-label="Script editor">
            <Card className="h-full bg-transparent rounded-none border-0 shadow-none p-0 gap-0">
                <CardHeader className="flex items-center justify-between border-b border-border bg-card/30 backdrop-blur px-6 py-4">
                    <CardTitle>
                        {selectedScript ? (
                            <span className="flex items-center gap-2">
                                Editing: {selectedScript.name}
                            </span>
                        ) : (
                            "Script Editor"
                        )}
                    </CardTitle>
                </CardHeader>
                <CardContent className="h-full relative p-0">
                    {selectedScript ? (
                        <ReactFlow
                            nodes={nodes}
                            edges={edges}
                            nodeTypes={nodeTypes}
                            onNodesChange={onNodesChange}
                            onEdgesChange={onEdgesChange}
                            colorMode="dark"
                            fitView
                            className="h-full w-full"
                            style={{ background: "var(--transparent)" }}
                        >
                            <MiniMap />
                            <Background />
                            <Controls
                                showFitView={true}
                                showInteractive={false}
                            />
                        </ReactFlow>
                    ) : (
                        <div
                            className="flex flex-col items-center justify-center h-full text-muted-foreground p-6 text-center"
                            role="alert"
                            aria-live="polite"
                        >
                            <h3 className="text-lg font-semibold mb-2">No Script Selected</h3>
                            <p className="max-w-md">
                                Please create a new script or select one from the list on the left
                                to begin editing your visual scripting workflow.
                            </p>
                        </div>
                    )}
                </CardContent>
            </Card>
        </main>
    );
}