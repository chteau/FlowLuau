"use client";

import { ScriptsModel as Scripts } from "@/generated/models";
import { Button } from "@/components/ui/button";
import { Pen, Plus, ScrollText, Trash } from "lucide-react";

/**
 * Properties interface for the ScriptList component
 */
export interface ScriptListProps {
    /** Array of scripts to display in the list */
    scripts: Scripts[];
    /** Currently selected script, if any */
    selectedScript: Scripts | null;
    /** Callback function when a script is selected */
    onSelectScript: (script: Scripts) => void;
    /** Callback function when user wants to create a new script */
    onCreateScript: () => void;
    /** Callback function when user wants to rename a script */
    onRenameScript: (script: Scripts) => void;
    /** Callback function when user wants to delete a script */
    onDeleteScript: (script: Scripts) => void;
}

/**
 * ScriptList component displays a sidebar list of scripts for a project
 *
 * This component provides:
 * - Visual listing of all scripts in a project
 * - Selection state for the currently active script
 * - Action buttons for script management (rename, delete)
 * - New script creation button
 * - Responsive layout with hover effects
 *
 * The component automatically:
 * - Highlights the currently selected script
 * - Shows action buttons on hover
 * - Handles click events for script selection
 * - Prevents event propagation for action buttons
 * - Provides a clean, organized sidebar interface
 *
 * @component
 * @param {ScriptListProps} props - Component properties
 *
 * @example
 * // Basic usage in a project editor layout
 * <div className="flex h-screen">
 *   <ScriptList
 *     scripts={scripts}
 *     selectedScript={selectedScript}
 *     onSelectScript={handleSelectScript}
 *     onCreateScript={handleCreateScript}
 *     onRenameScript={handleRenameScript}
 *     onDeleteScript={handleDeleteScript}
 *   />
 *   <div className="flex-1">
 *     {selectedScript && <ScriptEditor script={selectedScript} />}
 *   </div>
 * </div>
 *
 * @example
 * // With minimal setup for a simple project
 * <ScriptList
 *   scripts={projectScripts}
 *   selectedScript={currentScript}
 *   onSelectScript={setSelectedScript}
 *   onCreateScript={() => { }}
 *   onRenameScript={renameScript}
 *   onDeleteScript={deleteScript}
 * />
 */
export function ScriptList({
    scripts,
    selectedScript,
    onSelectScript,
    onCreateScript,
    onRenameScript,
    onDeleteScript
}: ScriptListProps) {
    return (
        <aside className="w-64 border-r border-border overflow-y-auto p-4 flex-col bg-background z-10">
            {/* Header section with title and create button */}
            <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold">Scripts</h2>
                <Button
                    onClick={onCreateScript}
                    aria-label="Create new script"
                    className="p-4 bg-primary text-primary-foreground hover:bg-primary/90 cursor-pointer"
                >
                    <Plus className="size-5" />
                </Button>
            </div>

            {/* Scripts list */}
            <div className="space-y-2">
                {scripts.map((script) => (
                    <div
                        key={script.id}
                        className={`
                            pl-4 pr-2 py-2 rounded-md cursor-pointer group
                            ${selectedScript?.id === script.id
                                ? 'bg-primary/10 text-primary-foreground'
                                : 'hover:bg-muted/50'}
                            transition-colors
                        `}
                        onClick={() => onSelectScript(script)}
                        aria-selected={selectedScript?.id === script.id}
                    >
                        <div className="flex justify-between items-center">
                            <span className="font-medium truncate max-w-[70%]">
                                <ScrollText className="size-5 inline-block mr-4 opacity-50" />
                                {script.name}
                            </span>
                            <div className="flex items-center space-x opacity-0 group-hover:opacity-100 transition-opacity">
                                <Button
                                    variant="ghost"
                                    size="lg"
                                    className="cursor-pointer"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        onRenameScript(script);
                                    }}
                                    aria-label={`Rename ${script.name}`}
                                >
                                    <Pen className="size-4" />
                                </Button>
                                <Button
                                    variant="ghost"
                                    size="lg"
                                    className="text-destructive hover:text-destructive/70 cursor-pointer"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        onDeleteScript(script);
                                    }}
                                    aria-label={`Delete ${script.name}`}
                                >
                                    <Trash className="size-4" />
                                </Button>
                            </div>
                        </div>
                    </div>
                ))}

                {/* Empty state handling */}
                {scripts.length === 0 && (
                    <div className="text-center py-8 text-muted-foreground">
                        No scripts yet
                    </div>
                )}
            </div>
        </aside>
    );
}