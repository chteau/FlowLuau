"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ProjectDeleteConfirmationDialog } from "@/components/project/project-delete-confirmation-dialog";
import {
    MoreHorizontal,
    ExternalLink,
    Settings,
    Trash2,
    Calendar,
    Network,
} from "lucide-react";
import { Card, CardFooter, CardHeader, CardTitle } from "../ui/card";
import Link from "next/link";

/**
 * Represents a user project entity in the visual scripting application
 *
 * Projects serve as top-level containers for scripts, variables, and other resources.
 * Each project maintains metadata about its creation, modification history, and ownership.
 * Date fields may be provided as ISO 8601 strings from API responses or Date objects
 * in client-side state, requiring robust handling in display logic.
 *
 * @interface Project
 * @property {string} id - Globally unique identifier (UUID) for project persistence and routing
 * @property {string} name - User-defined display name for the project (e.g., "Player Controller")
 * @property {string | Date} createdAt - Timestamp of project creation (ISO string from API or Date object)
 * @property {string | Date} updatedAt - Timestamp of last modification (ISO string from API or Date object)
 * @property {string} userId - Identifier of the authenticated user who owns this project
 */
export interface Project {
    id: string;
    name: string;
    createdAt: string | Date;
    updatedAt: string | Date;
    userId: string;
}

/**
 * Converts date inputs into human-readable relative time descriptions
 *
 * Transforms both ISO 8601 date strings and Date objects into natural language
 * relative timestamps (e.g., "2 minutes ago", "3 days ago"). Implements robust
 * handling for edge cases including invalid inputs, future dates, and micro-interactions.
 *
 * Algorithm behavior:
 * - Normalizes input to Date object regardless of source format
 * - Calculates millisecond difference from current time
 * - Selects optimal time unit based on magnitude thresholds
 * - Applies correct pluralization rules for time units
 * - Special-cases micro-interactions (<5 seconds → "just now")
 *
 * Edge case handling:
 * - Invalid dates: Returns "invalid date" with console warning
 * - Future dates: Returns "in the future" (prevents negative time displays)
 * - Extreme past: Falls back to "a long time ago" for dates beyond defined intervals
 * - Null/undefined inputs: Caller responsibility (not handled internally)
 *
 * Performance characteristics:
 * - O(1) constant time complexity (fixed interval checks)
 * - Minimal memory allocation (single Date object creation)
 * - No external dependencies or side effects
 *
 * @param {string | Date} dateInput - Source date value (ISO string or Date instance)
 * @returns {string} Localized relative time description for UI display
 *
 * @example
 * formatRelativeTime("2026-02-19T14:30:00Z"); // "just now" (if within 5 seconds of current time)
 * formatRelativeTime(new Date(Date.now() - 7200000)); // "2 hours ago"
 * formatRelativeTime("invalid-date-string"); // "invalid date"
 * formatRelativeTime(new Date(Date.now() + 3600000)); // "in the future"
 */
export function formatRelativeTime(dateInput: string | Date): string {
    const isoString = dateInput instanceof Date ? dateInput.toISOString() : dateInput;
    const date = new Date(isoString);

    if (isNaN(date.getTime())) {
        console.error(`Invalid date format: ${isoString}`);
        return "invalid date";
    }

    const now = new Date();
    const diffMs = now.getTime() - date.getTime();

    if (diffMs < 0) {
        return "in the future";
    }

    if (diffMs < 5000) {
        return "just now";
    }

    const intervals = [
        { unit: "year", ms: 365.25 * 24 * 60 * 60 * 1000, max: Infinity },
        { unit: "month", ms: 30.44 * 24 * 60 * 60 * 1000, max: 12 },
        { unit: "week", ms: 7 * 24 * 60 * 60 * 1000, max: 4.345 },
        { unit: "day", ms: 24 * 60 * 60 * 1000, max: 7 },
        { unit: "hour", ms: 60 * 60 * 1000, max: 24 },
        { unit: "minute", ms: 60 * 1000, max: 60 },
        { unit: "second", ms: 1000, max: 60 }
    ];

    for (const interval of intervals) {
        const count = Math.floor(diffMs / interval.ms);
        if (count >= 1 && count <= interval.max) {
            const unit = count === 1 ? interval.unit : `${interval.unit}s`;
            return `${count} ${unit} ago`;
        }
    }

    return "a long time ago";
}

/**
 * ProjectItem component renders a single project as an interactive card in the dashboard
 *
 * Provides a visual entry point to project management with intuitive navigation and
 * contextual actions. Features a letter-based avatar derived from project name, relative
 * time display for last modification, and node count metrics. Entire card surface is
 * clickable for primary navigation while preserving access to secondary actions via dropdown.
 *
 * Visual design characteristics:
 * - Letter avatar using first character of project name with contextual background
 * - Subtle hover transitions on border and background for tactile feedback
 * - Absolute-positioned overlay link for full-card click navigation
 * - Dropdown menu with contextual actions (open, settings, delete)
 * - Compact footer displaying last modified time and node count metrics
 * - Responsive layout adapting to container constraints
 *
 * Interaction patterns:
 * - Primary action: Click anywhere on card navigates to project editor (/project/{id})
 * - Secondary actions: Dropdown menu provides access to settings and deletion
 * - Delete workflow: Confirmation dialog prevents accidental data loss
 * - Visual feedback: Hover states enhance discoverability of interactive elements
 *
 * Data integration:
 * - Accepts Project interface with robust date handling (string/Date)
 * - Displays relative time using formatRelativeTime utility
 * - Node count currently hardcoded to 0 (pending graph analysis implementation)
 * - Relies on parent component for project list state management
 *
 * Security considerations:
 * - Delete operation requires explicit confirmation dialog
 * - Navigation restricted to authenticated user's own projects (enforced server-side)
 * - No sensitive data exposed in client-side rendering
 *
 * @component
 * @param {Object} props - Component properties
 * @param {Project} props.project - Project data object containing metadata and identifiers
 *
 * @example
 * // Basic usage within project grid layout
 * <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
 *   {userProjects.map(project => (
 *     <ProjectItem key={project.id} project={project} />
 *   ))}
 * </div>
 *
 * @example
 * // Integration with project management context
 * <ProjectItem
 *   project={{
 *     id: "proj_a1b2c3",
 *     name: "Character Controller",
 *     createdAt: "2026-02-15T08:22:17Z",
 *     updatedAt: new Date(),
 *     userId: "user_xyz789"
 *   }}
 * />
 */
export function ProjectItem({ project }: { project: Project }) {
    const router = useRouter();
    const [isProjectDeleteDialogOpen, setProjectDeleteDialogOpen] = useState(false);
    const [error, setError] = useState<string | null>(null);

    /**
     * Navigates to the project editor interface for script authoring
     *
     * Transitions to the visual scripting canvas using Next.js App Router navigation.
     * Preserves client-side routing benefits (no full page reload, maintains state).
     * Triggered by clicking the main card surface or "Open" menu item.
     *
     * @returns {void}
     * @sideEffect Updates browser URL and renders ProjectPage component
     */
    const handleOpenProject = () => {
        router.push(`/project/${project.id}`);
    };

    /**
     * Navigates to project configuration settings interface
     *
     * Opens project-specific settings page for metadata management, permissions,
     * and advanced configuration options. Accessed exclusively through dropdown menu.
     *
     * @returns {void}
     * @sideEffect Updates browser URL and renders ProjectSettingsPage component
     */
    const handleOpenSettings = () => {
        router.push(`/project/${project.id}/settings`);
    };

    /**
     * Initiates project deletion workflow with server persistence
     *
     * Executes DELETE request to project API endpoint after user confirmation.
     * On success, triggers full page reload to reflect updated project list.
     * On failure, displays error state and closes confirmation dialog.
     *
     * Security note: Server enforces ownership validation - clients cannot delete
     * projects they don't own regardless of frontend actions.
     *
     * @async
     * @returns {Promise<void>}
     * @sideEffect Sends DELETE request to /api/projects/{id}; reloads page on success
     * @throws {Error} Network errors or non-2xx API responses
     */
    const handleDeleteProject = async () => {
        if (!project.id) return;

        try {
            const response = await fetch(`/api/projects/${project.id}`, {
                method: 'DELETE',
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Failed to delete project');
            }

            window.location.reload();
        } catch (err) {
            setError(err instanceof Error ? err.message : 'An unknown error occurred');
            setProjectDeleteDialogOpen(false);
        }
    };

    return (
        <Card className={cn(
            "flex flex-col justify-between rounded-md border border-border",
            "bg-card/50 backdrop-blur group-hover:bg-accent/50 transition-colors",
            "min-w-md hover:border-foreground/20 group",
            "z-10 p-0"
        )}>
            <Link
                href={`/project/${project.id}`}
                className="absolute top-0 left-0 size-full z-10 cursor-pointer"
            />
            <div className="size-full min-h-30 bg-muted/30 p-4 relative overflow-hidden flex">
                <div className={`w-12 h-12 bg-secondary text-secondary-foreground rounded-lg flex items-center justify-center font-bold text-lg relative z-10 shadow-sm`}>
                    {project.name.charAt(0)}
                </div>

                <div className="absolute top-2 right-2 z-15 group-hover:opacity-100 transition-opacity">
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button
                                variant="ghost"
                                size="icon-sm"
                                className="text-muted-foreground transition-opacity hover:text-foreground p-4 cursor-pointer"
                            >
                                <MoreHorizontal className="size-4" />
                                <span className="sr-only">Project options</span>
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-48">
                            <DropdownMenuItem
                                className="cursor-pointer"
                                onClick={handleOpenProject}
                            >
                                <ExternalLink className="size-4" />
                                Open
                            </DropdownMenuItem>
                            <DropdownMenuItem
                                className="cursor-pointer"
                                onClick={handleOpenSettings}
                            >
                                <Settings className="size-4" />
                                Project settings
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />

                            <DropdownMenuItem
                                variant="destructive"
                                className="cursor-pointer"
                                onClick={() => setProjectDeleteDialogOpen(true)}
                            >
                                <Trash2 className="size-4" />
                                Delete project
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            </div>

            <CardHeader className="space-y-2">
                <div className="flex items-center justify-between">
                    <CardTitle className="text-lg font-semibold truncate max-w-full">
                        {project.name}
                    </CardTitle>
                </div>
            </CardHeader>

            <CardFooter className="p-4 pt-0 flex items-center gap-4 text-[11px] text-muted-foreground">
                <div className="flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    {formatRelativeTime(project.updatedAt)}
                </div>
                <div className="flex items-center gap-1">
                    <Network className="h-3 w-3" />
                    {0} nodes
                </div>
            </CardFooter>

            <ProjectDeleteConfirmationDialog
                open={isProjectDeleteDialogOpen}
                onOpenChange={setProjectDeleteDialogOpen}
                projectName={project.name}
                onConfirm={handleDeleteProject}
            />
        </Card>
    );
}