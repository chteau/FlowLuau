"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { ProjectsModel as Projects, ScriptsModel as Scripts } from "@/generated/models";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Label } from "@/components/ui/label";
import { SidebarNav } from "@/components/dashboard/sidebar-nav";
import { ProjectHeader } from "@/components/project/project-header";
import { ScriptList } from "@/components/project/script-list";
import { ScriptEditor } from "@/components/project/script-editor";

/**
 * ProjectPage component renders the script editing interface for a specific project
 *
 * Manages the complete project workspace experience including:
 * - Project and script data fetching/loading states
 * - Script selection and navigation
 * - CRUD operations for scripts (create, rename, delete)
 * - Dialog management for user interactions
 * - Error handling and user feedback
 *
 * Component architecture:
 * - Uses Next.js useParams hook to extract projectId from route
 * - Maintains local state for project data, scripts list, and UI interactions
 * - Implements optimistic UI updates with re-fetching after mutations
 * - Provides confirmation dialogs for destructive operations (delete)
 * - Integrates ScriptList (navigation) and ScriptEditor (canvas) components
 *
 * Data flow:
 * 1. On mount/projectId change: fetch project details and associated scripts
 * 2. User selects script from ScriptList → updates selectedScript state
 * 3. ScriptEditor renders based on selectedScript context
 * 4. CRUD operations trigger API calls followed by re-fetch to update state
 *
 * Security considerations:
 * - All API endpoints require authentication (handled by backend middleware)
 * - Script operations scoped to user's projects (backend authorization)
 * - No client-side data mutation without server validation
 *
 * Performance characteristics:
 * - Single fetch for project + scripts on mount (parallel requests)
 * - Re-fetches entire script list after mutations (simpler state management)
 * - Dialog state managed locally to avoid unnecessary re-renders
 * - useCallback for handlers to prevent child component re-renders
 *
 * @component
 * @returns {JSX.Element} Project workspace interface with script management capabilities
 *
 * @example
 * // Route configuration (app/projects/[id]/page.tsx)
 * import ProjectPage from "@/app/projects/[id]/page";
 *
 * export default function Page() {
 *   return <ProjectPage />;
 * }
 *
 * @example
 * // Navigation to project page
 * router.push(`/projects/${projectId}`);
 */
export default function ProjectPage() {
    // ===== STATE MANAGEMENT =====
    /**
     * Current project data fetched from API
     * @type {Projects | null}
     * @default null (loading state)
     */
    const [project, setProject] = useState<Projects | null>(null);

    /**
     * List of scripts associated with the current project
     * @type {Scripts[]}
     * @default [] (empty array during loading)
     */
    const [scripts, setScripts] = useState<Scripts[]>([]);

    /**
     * Currently selected script for editing in ScriptEditor
     * @type {Scripts | null}
     * @default null (no script selected)
     */
    const [selectedScript, setSelectedScript] = useState<Scripts | null>(null);

    /**
     * Loading state for initial data fetch
     * @type {boolean}
     * @default true (prevents rendering before data available)
     */
    const [loading, setLoading] = useState(true);

    /**
     * Error state for API failures
     * @type {string | null}
     * @default null (no error)
     */
    const [error, setError] = useState<string | null>(null);

    /**
     * Dialog visibility state for script creation
     * @type {boolean}
     * @default false (hidden)
     */
    const [isCreateDialogOpen, setCreateDialogOpen] = useState(false);

    /**
     * Dialog visibility state for script renaming
     * @type {boolean}
     * @default false (hidden)
     */
    const [isRenameDialogOpen, setRenameDialogOpen] = useState(false);

    /**
     * Dialog visibility state for script deletion confirmation
     * @type {boolean}
     * @default false (hidden)
     */
    const [isDeleteDialogOpen, setDeleteDialogOpen] = useState(false);

    /**
     * Script targeted for rename operation (holds original data during edit)
     * @type {Scripts | null}
     * @default null (no active rename operation)
     */
    const [scriptToRename, setScriptToRename] = useState<Scripts | null>(null);

    /**
     * Script targeted for deletion (holds data for confirmation dialog)
     * @type {Scripts | null}
     * @default null (no active delete operation)
     */
    const [scriptToDelete, setScriptToDelete] = useState<Scripts | null>(null);

    /**
     * Input value for new script name during creation
     * @type {string}
     * @default "" (empty)
     */
    const [newScriptName, setNewScriptName] = useState("");

    /**
     * Input value for renamed script name during edit
     * @type {string}
     * @default "" (populated from scriptToRename.name when dialog opens)
     */
    const [renamedScriptName, setRenamedScriptName] = useState("");

    // ===== ROUTING & NAVIGATION =====
    const params = useParams();
    const router = useRouter();
    const { id: projectId } = params;

    // ===== DATA FETCHING =====
    /**
     * Fetches project details and associated scripts from API
     *
     * Performs two parallel requests:
     * 1. GET /api/projects/{projectId} - retrieves project metadata
     * 2. GET /api/projects/{projectId}/scripts - retrieves script list
     *
     * Implements comprehensive error handling with user-friendly messages.
     * Updates loading state during fetch and error state on failure.
     *
     * @callback
     * @async
     * @returns {Promise<void>} Resolves when data fetch completes (success or failure)
     * @sideEffect Sets project, scripts, loading, and error state
     * @throws {Error} Network errors or non-2xx API responses
     */
    const fetchProjectAndScripts = useCallback(async () => {
        if (projectId) {
            setLoading(true);
            try {
                // Fetch project details
                const projectResponse = await fetch(`/api/projects/${projectId}`);
                if (!projectResponse.ok) throw new Error("Failed to fetch project");
                const projectData = await projectResponse.json();
                setProject(projectData);

                // Fetch scripts for the project
                const scriptsResponse = await fetch(`/api/projects/${projectId}/scripts`);
                if (!scriptsResponse.ok) throw new Error("Failed to fetch scripts");
                const scriptsData = await scriptsResponse.json();

                setScripts(scriptsData);
            } catch (err) {
                setError(err instanceof Error ? err.message : "An unknown error occurred");
            } finally {
                setLoading(false);
            }
        }
    }, [projectId]);

    /**
     * Effect hook to fetch project data on component mount or projectId change
     *
     * Triggers initial data load when component mounts or when navigating between projects.
     * Dependencies limited to fetchProjectAndScripts callback (stable via useCallback).
     *
     * @effect
     * @dependency {function} fetchProjectAndScripts - Stable data fetching callback
     */
    useEffect(() => {
        fetchProjectAndScripts();
    }, [fetchProjectAndScripts]);

    // ===== DIALOG HANDLERS =====
    /**
     * Opens the script creation dialog with reset input state
     *
     * Prepares UI for new script creation by clearing input field and showing dialog.
     *
     * @returns {void}
     * @sideEffect Sets newScriptName to empty string and opens create dialog
     */
    const openCreateDialog = () => {
        setNewScriptName("");
        setCreateDialogOpen(true);
    };

    /**
     * Opens the script rename dialog pre-populated with current script name
     *
     * Initializes rename operation by storing target script reference and current name.
     *
     * @param {Scripts} script - Script to be renamed
     * @returns {void}
     * @sideEffect Sets scriptToRename and renamedScriptName state; opens rename dialog
     */
    const openRenameDialog = (script: Scripts) => {
        setScriptToRename(script);
        setRenamedScriptName(script.name);
        setRenameDialogOpen(true);
    };

    /**
     * Opens the script deletion confirmation dialog
     *
     * Prepares destructive operation confirmation by storing target script reference.
     *
     * @param {Scripts} script - Script to be deleted
     * @returns {void}
     * @sideEffect Sets scriptToDelete state; opens delete confirmation dialog
     */
    const openDeleteDialog = (script: Scripts) => {
        setScriptToDelete(script);
        setDeleteDialogOpen(true);
    };

    // ===== CRUD OPERATIONS =====
    /**
     * Creates a new script via API and refreshes project data
     *
     * Validates input before API call to prevent empty names. On success, re-fetches
     * project scripts to update UI. Handles errors with user feedback.
     *
     * @async
     * @returns {Promise<void>}
     * @sideEffect Triggers API POST request; updates scripts state via re-fetch; closes dialog on success
     * @throws {Error} API errors or network failures
     */
    const handleCreateScript = async () => {
        if (!newScriptName.trim() || !projectId) return;
        try {
            const response = await fetch('/api/scripts', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name: newScriptName, projectId }),
            });
            if (!response.ok) throw new Error('Failed to create script');
            await fetchProjectAndScripts(); // Re-fetch
            setCreateDialogOpen(false);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'An unknown error occurred');
        }
    };

    /**
     * Renames an existing script via API and refreshes project data
     *
     * Validates input before API call. On success, re-fetches project scripts to update UI
     * and clears rename operation state. Handles errors with user feedback.
     *
     * @async
     * @returns {Promise<void>}
     * @sideEffect Triggers API PUT request; updates scripts state via re-fetch; closes dialog on success
     * @throws {Error} API errors, network failures, or missing scriptToRename reference
     */
    const handleRenameScript = async () => {
        if (!renamedScriptName.trim() || !scriptToRename) return;
        try {
            const response = await fetch(`/api/scripts/${scriptToRename.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name: renamedScriptName }),
            });
            if (!response.ok) throw new Error('Failed to rename script');
            await fetchProjectAndScripts(); // Re-fetch
            setRenameDialogOpen(false);
            setScriptToRename(null);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'An unknown error occurred');
        }
    };

    /**
     * Deletes a script via API and refreshes project data
     *
     * Performs destructive operation with confirmation. On success, re-fetches scripts,
     * clears selection if deleted script was active, and resets operation state.
     * Handles errors with user feedback.
     *
     * @async
     * @returns {Promise<void>}
     * @sideEffect Triggers API DELETE request; updates scripts state via re-fetch; clears selection if needed; closes dialog on success
     * @throws {Error} API errors, network failures, or missing scriptToDelete reference
     */
    const handleDeleteScript = async () => {
        if (!scriptToDelete) return;
        try {
            const response = await fetch(`/api/scripts/${scriptToDelete.id}`, {
                method: 'DELETE',
            });
            if (!response.ok) throw new Error('Failed to delete script');
            await fetchProjectAndScripts(); // Re-fetch
            if (selectedScript?.id === scriptToDelete.id) {
                setSelectedScript(null); // Clear selection if deleted
            }
            setDeleteDialogOpen(false);
            setScriptToDelete(null);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'An unknown error occurred');
        }
    };

    // ===== RENDERING =====
    // Loading and error states
    if (loading) return <div>Loading project...</div>;
    if (error) return <div>Error: {error}</div>;
    if (!project) return <div>Project not found.</div>;

    return (
        <div className="flex h-screen overflow-hidden bg-background">
            <div className="flex flex-1 flex-col overflow-hidden">
                <ProjectHeader project={project} />
                <div className="flex flex-1 overflow-hidden">
                    <ScriptList
                        scripts={scripts}
                        selectedScript={selectedScript}
                        onSelectScript={setSelectedScript}
                        onCreateScript={openCreateDialog}
                        onRenameScript={openRenameDialog}
                        onDeleteScript={openDeleteDialog}
                    />
                    <ScriptEditor selectedScript={selectedScript} />
                </div>
            </div>

            {/* Create Script Dialog */}
            <Dialog open={isCreateDialogOpen} onOpenChange={setCreateDialogOpen}>
                <DialogContent className="sm:max-w-130 p-5">
                    <DialogHeader>
                        <DialogTitle className="text-lg">Create New Script</DialogTitle>
                        <DialogDescription className="text-sm text-muted-foreground">
                            Let's give your new script a name. You can always change it later.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="py-4">
                        <Label htmlFor="new-script-name">Script Name</Label>
                        <Input
                            id="new-script-name"
                            className="mt-4 py-4 px-2"
                            placeholder="MySuperScript"
                            value={newScriptName}
                            onChange={(e) => setNewScriptName(e.target.value)}
                        />
                    </div>
                    <DialogFooter>
                        <Button
                            variant="outline"
                            size={"lg"}
                            className="cursor-pointer"
                            onClick={() => setCreateDialogOpen(false)}
                        >
                            Cancel
                        </Button>
                        <Button
                            onClick={handleCreateScript}
                            size={"lg"}
                            className="cursor-pointer"
                        >
                            Create
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Rename Script Dialog */}
            <Dialog open={isRenameDialogOpen} onOpenChange={setRenameDialogOpen}>
                <DialogContent className="sm:max-w-130 p-5">
                    <DialogHeader>
                        <DialogTitle className="text-lg">Rename Script</DialogTitle>
                        <DialogDescription className="text-sm text-muted-foreground">
                            Enter a new name for the script "{scriptToRename?.name}".
                        </DialogDescription>
                    </DialogHeader>
                    <div className="py-4">
                        <Label htmlFor="rename-script-name">New Script Name</Label>
                        <Input
                            id="rename-script-name"
                            className="mt-4 py-4 px-2"
                            placeholder="MySuperScript"
                            value={renamedScriptName}
                            onChange={(e) => setRenamedScriptName(e.target.value)}
                        />
                    </div>
                    <DialogFooter>
                        <Button
                            variant="outline"
                            size={"lg"}
                            className="cursor-pointer"
                            onClick={() => setRenameDialogOpen(false)}
                        >
                            Cancel
                        </Button>
                        <Button
                            onClick={handleRenameScript}
                            size={"lg"}
                            className="cursor-pointer"
                        >
                            Save
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Delete Script Confirmation Dialog */}
            <AlertDialog open={isDeleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
                <AlertDialogContent className="sm:max-w-130 max-w-150 p-5">
                    <AlertDialogHeader>
                        <AlertDialogTitle className="text-lg text-destructive">Are you sure?</AlertDialogTitle>
                        <AlertDialogDescription className="text-sm text-muted-foreground">
                            This will permanently delete the script "{scriptToDelete?.name}". This action cannot be undone.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel
                            size={"lg"}
                            className="cursor-pointer"
                            onClick={() => setDeleteDialogOpen(false)}
                        >
                            Cancel
                        </AlertDialogCancel>
                        <AlertDialogAction
                            variant={"destructive"}
                            size={"lg"}
                            className="cursor-pointer"
                            onClick={handleDeleteScript}
                        >
                            Delete
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            {/* Decorative background elements - non-interactive */}
            <div className="fixed inset-0 bg-linear-to-tr from-black via-transparent to-primary/8 pointer-events-none z-0" />
            <div className="fixed inset-0 grid-pattern pointer-events-none z-0" />
        </div>
    );
}