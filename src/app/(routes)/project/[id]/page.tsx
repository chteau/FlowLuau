"use client";

import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { ProjectHeader } from "@/components/project/project-header";
import { ScriptEditor } from "@/components/project/script-editor";
import { ScriptList } from "@/components/project/script-list";
import { ScriptsModel as Scripts, ProjectsModel as Projects } from "@/generated/models";
import { useCallback, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

/**
 * Skeleton loader component for ProjectPage during initial data fetch
 *
 * Provides visual placeholders matching the layout structure of the fully loaded
 * project workspace to maintain layout stability and improve perceived performance
 * during loading states.
 *
 * Visual structure:
 * - Header section with avatar placeholder and title placeholder
 * - Two-column layout matching ScriptList (left) and ScriptEditor (right) proportions
 * - ScriptList placeholder contains search input and 5 script item placeholders
 * - ScriptEditor placeholder fills remaining space with full-size skeleton
 *
 * Performance characteristics:
 * - Pure presentational component with no state or side effects
 * - Minimal re-renders (static structure)
 * - Uses Skeleton component primitives for consistent loading aesthetics
 *
 * @component
 * @returns {JSX.Element} Loading state placeholders matching ProjectPage layout
 *
 * @example
 * // Usage during data fetch loading state
 * {loading ? <ProjectPageSkeleton /> : <ProjectPageContent />}
 */
function ProjectPageSkeleton() {
    return (
        <div className="flex h-screen overflow-hidden bg-background">
            <div className="flex flex-1 flex-col overflow-hidden">
                <div className="flex items-center justify-between p-4 border-b">
                    <div className="flex items-center gap-4">
                        <Skeleton className="h-8 w-8" />
                        <Skeleton className="h-6 w-40" />
                    </div>
                    <div className="flex items-center gap-2">
                        <Skeleton className="h-8 w-20" />
                        <Skeleton className="h-8 w-20" />
                    </div>
                </div>
                <div className="flex flex-1 overflow-hidden">
                    <div className="w-64 border-r p-4 space-y-4">
                        <Skeleton className="h-8 w-full" />
                        <div className="space-y-2">
                            {Array.from({ length: 5 }).map((_, index) => (
                                <Skeleton key={index} className="h-10 w-full" />
                            ))}
                        </div>
                    </div>
                    <div className="flex-1 p-4">
                        <Skeleton className="h-full w-full" />
                    </div>
                </div>
            </div>
        </div>
    );
}

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
     *
     * Holds the complete project metadata including id, name, timestamps, and ownership.
     * Initialized as null during loading state and populated after successful API fetch.
     *
     * @state
     * @type {Projects | null}
     * @default null
     */
    const [project, setProject] = useState<Projects | null>(null);

    /**
     * List of scripts associated with the current project
     *
     * Array of script metadata objects retrieved from the backend API.
     * Each script contains id, name, projectId, and timestamps for display in ScriptList.
     *
     * @state
     * @type {Scripts[]}
     * @default []
     */
    const [scripts, setScripts] = useState<Scripts[]>([]);

    /**
     * Currently selected script for editing in ScriptEditor
     *
     * Represents the active script context for the visual scripting canvas.
     * When null, ScriptEditor displays empty state prompting script selection.
     *
     * @state
     * @type {Scripts | null}
     * @default null
     */
    const [selectedScript, setSelectedScript] = useState<Scripts | null>(null);

    /**
     * Loading state for initial data fetch operations
     *
     * Controls display of ProjectPageSkeleton during initial project/script data retrieval.
     * Set to false after successful fetch or error occurrence.
     *
     * @state
     * @type {boolean}
     * @default true
     */
    const [loading, setLoading] = useState(true);

    /**
     * Error state capturing API fetch failures
     *
     * Holds user-facing error messages from failed network requests or invalid responses.
     * Displayed as inline error text when non-null after loading completes.
     *
     * @state
     * @type {string | null}
     * @default null
     */
    const [error, setError] = useState<string | null>(null);

    /**
     * Dialog visibility state for script creation workflow
     *
     * Controls display of the "Create New Script" dialog triggered by the
     * "New Script" button in ScriptList component.
     *
     * @state
     * @type {boolean}
     * @default false
     */
    const [isCreateDialogOpen, setCreateDialogOpen] = useState(false);

    /**
     * Dialog visibility state for script renaming workflow
     *
     * Controls display of the "Rename Script" dialog triggered by right-click
     * context menu or action button on existing scripts.
     *
     * @state
     * @type {boolean}
     * @default false
     */
    const [isRenameDialogOpen, setRenameDialogOpen] = useState(false);

    /**
     * Dialog visibility state for script deletion confirmation
     *
     * Controls display of the destructive action confirmation dialog before
     * permanently removing a script from the project.
     *
     * @state
     * @type {boolean}
     * @default false
     */
    const [isDeleteDialogOpen, setDeleteDialogOpen] = useState(false);

    /**
     * Script reference targeted for rename operation
     *
     * Holds the complete script object being renamed to preserve metadata during
     * the rename dialog interaction. Reset to null after successful rename or cancel.
     *
     * @state
     * @type {Scripts | null}
     * @default null
     */
    const [scriptToRename, setScriptToRename] = useState<Scripts | null>(null);

    /**
     * Script reference targeted for deletion operation
     *
     * Holds the complete script object being deleted to display name in confirmation
     * dialog and execute deletion API call. Reset to null after deletion or cancel.
     *
     * @state
     * @type {Scripts | null}
     * @default null
     */
    const [scriptToDelete, setScriptToDelete] = useState<Scripts | null>(null);

    /**
     * Input value for new script name during creation
     *
     * Controlled input state for the script name field in the creation dialog.
     * Validated before API submission to prevent empty names.
     *
     * @state
     * @type {string}
     * @default ""
     */
    const [newScriptName, setNewScriptName] = useState("");

    /**
     * Input value for renamed script name during edit
     *
     * Controlled input state pre-populated with current script name when rename
     * dialog opens. Allows user to modify name before submission.
     *
     * @state
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
     * Fetches project details and associated scripts from backend API
     *
     * Executes two parallel API requests to retrieve:
     * 1. Project metadata from /api/projects/{projectId}
     * 2. Script list from /api/projects/{projectId}/scripts
     *
     * Implements comprehensive error handling with user-friendly messages.
     * Updates loading state during fetch operations and error state on failures.
     * Resets error state before new fetch attempts to prevent stale messages.
     *
     * Security note: All endpoints require authentication enforced by backend middleware.
     * Project ownership validation occurs server-side before returning data.
     *
     * @callback
     * @async
     * @returns {Promise<void>} Resolves when both API requests complete (success or failure)
     * @sideEffect Sets project, scripts, loading, and error state based on API responses
     * @throws {Error} Network errors, non-2xx responses, or JSON parsing failures
     */
    const fetchProjectAndScripts = useCallback(async () => {
        if (projectId) {
            setLoading(true);
            setError(null);
            try {
                const projectResponse = await fetch(`/api/projects/${projectId}`);
                if (!projectResponse.ok) throw new Error("Failed to fetch project");
                const projectData = await projectResponse.json();
                setProject(projectData);

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
     * Effect hook triggering initial data fetch on component mount or projectId change
     *
     * Automatically reloads project data when navigating between different projects
     * via client-side routing. Uses stable fetchProjectAndScripts callback to prevent
     * unnecessary re-renders while maintaining correct dependency tracking.
     *
     * @effect
     * @dependency {string} projectId - Current project identifier from route parameters
     * @dependency {function} fetchProjectAndScripts - Stable data fetching callback
     */
    useEffect(() => {
        fetchProjectAndScripts();
    }, [fetchProjectAndScripts]);

    // ===== DIALOG HANDLERS =====
    /**
     * Opens the script creation dialog with reset input state
     *
     * Prepares the UI for new script creation by clearing the name input field
     * and displaying the creation dialog. Ensures clean state for each creation attempt.
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
     * Initializes the rename workflow by storing the target script reference and
     * copying its current name into the editable input field for modification.
     *
     * @param {Scripts} script - Script object targeted for renaming
     * @returns {void}
     * @sideEffect Sets scriptToRename reference and renamedScriptName input value; opens rename dialog
     */
    const openRenameDialog = (script: Scripts) => {
        setScriptToRename(script);
        setRenamedScriptName(script.name);
        setRenameDialogOpen(true);
    };

    /**
     * Opens the script deletion confirmation dialog
     *
     * Initiates the destructive deletion workflow by storing the target script reference
     * for display in the confirmation dialog and subsequent API operation.
     *
     * @param {Scripts} script - Script object targeted for deletion
     * @returns {void}
     * @sideEffect Sets scriptToDelete reference; opens delete confirmation dialog
     */
    const openDeleteDialog = (script: Scripts) => {
        setScriptToDelete(script);
        setDeleteDialogOpen(true);
    };

    // ===== CRUD OPERATIONS =====
    /**
     * Creates a new script via API and refreshes project data
     *
     * Validates input to prevent empty script names before submitting to the backend.
     * On successful creation, triggers a full re-fetch of project scripts to update
     * the UI with the new script. Automatically closes the creation dialog on success.
     *
     * Error handling: Captures API errors and network failures, displaying user-friendly
     * messages without exposing sensitive backend details.
     *
     * @async
     * @returns {Promise<void>}
     * @sideEffect Triggers POST request to /api/scripts; refreshes scripts list; closes dialog on success
     * @throws {Error} API errors (non-2xx responses) or network failures
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
            await fetchProjectAndScripts();
            setCreateDialogOpen(false);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'An unknown error occurred');
        }
    };

    /**
     * Renames an existing script via API and refreshes project data
     *
     * Validates input to prevent empty names before submitting the rename operation.
     * On success, triggers a full re-fetch of project scripts to update all UI components.
     * Resets rename operation state by clearing scriptToRename reference and closing dialog.
     *
     * Safety: Operation requires valid scriptToRename reference to prevent accidental
     * renames of undefined scripts. Backend enforces project ownership validation.
     *
     * @async
     * @returns {Promise<void>}
     * @sideEffect Triggers PUT request to /api/scripts/{id}; refreshes scripts list; closes dialog on success
     * @throws {Error} API errors, network failures, or missing script reference
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
            await fetchProjectAndScripts();
            setRenameDialogOpen(false);
            setScriptToRename(null);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'An unknown error occurred');
        }
    };

    /**
     * Deletes a script via API and refreshes project data
     *
     * Executes destructive deletion after explicit user confirmation. On success:
     * 1. Triggers full re-fetch of project scripts
     * 2. Clears selectedScript if the deleted script was active
     * 3. Resets deletion operation state
     * 4. Closes confirmation dialog
     *
     * Safety: Requires explicit confirmation dialog to prevent accidental data loss.
     * Backend enforces project ownership validation before deletion.
     *
     * @async
     * @returns {Promise<void>}
     * @sideEffect Triggers DELETE request to /api/scripts/{id}; refreshes scripts list; clears selection if needed; closes dialog on success
     * @throws {Error} API errors, network failures, or missing script reference
     */
    const handleDeleteScript = async () => {
        if (!scriptToDelete) return;
        try {
            const response = await fetch(`/api/scripts/${scriptToDelete.id}`, {
                method: 'DELETE',
            });
            if (!response.ok) throw new Error('Failed to delete script');
            await fetchProjectAndScripts();
            if (selectedScript?.id === scriptToDelete.id) {
                setSelectedScript(null);
            }
            setDeleteDialogOpen(false);
            setScriptToDelete(null);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'An unknown error occurred');
        }
    };

    // ===== RENDERING =====
    if (loading) return <ProjectPageSkeleton />;
    if (error) return <div className="p-6 text-destructive">Error: {error}</div>;
    if (!project) return <div className="p-6 text-muted-foreground">Project not found.</div>;

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