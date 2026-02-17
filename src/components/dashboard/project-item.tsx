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
    Clock,
} from "lucide-react";

/**
 * Project interface representing a user project
 *
 * Note: In practice, API responses will have string dates that need conversion
 */
export interface Project {
    /** Project's unique identifier */
    id: string;
    /** Project's display name */
    name: string;
    /** Timestamp when the project was created (ISO string in practice) */
    createdAt: string | Date;
    /** Timestamp when the project was last updated (ISO string in practice) */
    updatedAt: string | Date;
    /** ID of the user who owns this project */
    userId: string;
}

/**
 * Converts a date input (string or Date object) to a human-readable relative time string
 *
 * This function handles both ISO date strings and Date objects, making it robust
 * against the common issue where API responses provide date strings that TypeScript
 * thinks are Date objects due to interface definitions.
 *
 * @param dateInput - Date string or Date object to format
 * @returns A human-readable relative time string (e.g., "2 minutes ago", "4 months ago")
 *
 * @example
 * formatRelativeTime("2026-02-17T06:03:33.761Z"); // "just now"
 * formatRelativeTime(new Date()); // "just now"
 * formatRelativeTime(project.updatedAt); // Works whether it's string or Date
 */
export function formatRelativeTime(dateInput: string | Date): string {
    // Convert to ISO string if it's a Date object
    const isoString = dateInput instanceof Date ? dateInput.toISOString() : dateInput;

    // Parse the input date
    const date = new Date(isoString);

    // Handle invalid dates
    if (isNaN(date.getTime())) {
        console.error(`Invalid date format: ${isoString}`);
        return "invalid date";
    }

    // Get current time
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();

    // Handle future dates
    if (diffMs < 0) {
        return "in the future";
    }

    // Define time intervals in milliseconds
    const intervals = [
        { unit: "year", ms: 365.25 * 24 * 60 * 60 * 1000, max: Infinity },
        { unit: "month", ms: 30.44 * 24 * 60 * 60 * 1000, max: 12 },
        { unit: "week", ms: 7 * 24 * 60 * 60 * 1000, max: 4.345 },
        { unit: "day", ms: 24 * 60 * 60 * 1000, max: 7 },
        { unit: "hour", ms: 60 * 60 * 1000, max: 24 },
        { unit: "minute", ms: 60 * 1000, max: 60 },
        { unit: "second", ms: 1000, max: 60 }
    ];

    // Special case for "just now" (less than 5 seconds)
    if (diffMs < 5000) {
        return "just now";
    }

    // Find the appropriate time unit
    for (const interval of intervals) {
        const count = Math.floor(diffMs / interval.ms);

        // Check if this unit is applicable
        if (count >= 1 && count <= interval.max) {
            // Handle pluralization
            const unit = count === 1 ? interval.unit : `${interval.unit}s`;
            return `${count} ${unit} ago`;
        }
    }

    // Fallback for very old dates (shouldn't happen with our intervals)
    return "a long time ago";
}

/**
 * ProjectItem component displays a single project in a card format
 *
 * This component provides:
 * - Visual representation of a project with name and icon
 * - Dropdown menu with project actions
 * - Relative time display for last update
 * - Responsive design for different screen sizes
 *
 * The component automatically:
 * - Generates a letter-based icon from the project name
 * - Formats the update time as "X time ago"
 * - Shows dropdown menu on hover
 * - Handles navigation to project details and settings
 *
 * @component
 * @param {Object} props - Component properties
 * @param {Project} props.project - Project data to display
 *
 * @example
 * // Basic usage in a projects grid
 * <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
 *   {projects.map(project => (
 *     <ProjectItem key={project.id} project={project} />
 *   ))}
 * </div>
 */
export function ProjectItem({ project }: { project: Project }) {
    const router = useRouter();
    const [isProjectDeleteDialogOpen, setProjectDeleteDialogOpen] = useState(false);
    const [error, setError] = useState<string | null>(null);

    /**
     * Handles opening the project
     *
     * Navigates to the project detail page
     */
    const handleOpenProject = () => {
        router.push(`/project/${project.id}`);
    };

    /**
     * Handles opening project settings
     *
     * Navigates to the project settings page
     */
    const handleOpenSettings = () => {
        router.push(`/project/${project.id}/settings`);
    };

    /**
     * Handles project deletion
     *
     * Shows confirmation dialog before deletion
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

            window.location.reload(); // Refresh the page to reflect deletion
        } catch (err) {
            setError(err instanceof Error ? err.message : 'An unknown error occurred');
            setProjectDeleteDialogOpen(false);
        }
    };

    return (
        <div className={cn(
            "flex flex-col justify-between rounded-md border border-border",
            "bg-card/50 backdrop-blur group-hover:bg-accent/50 transition-colors",
            "min-w-md hover:border-foreground/20 group",
            "z-10"
        )}>
            <div className="flex items-center gap-4 p-4">
                <div className="flex size-10 items-center justify-center rounded-md bg-primary/20 border-primary/50 border text-sm font-bold text-foreground">
                    {project.name.charAt(0).toUpperCase()}
                </div>

                <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-3">
                        <h3 className="text-sm font-semibold text-foreground truncate">{project.name}</h3>
                    </div>
                </div>

                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button
                            variant="ghost"
                            size="icon-sm"
                            className="text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100 hover:text-foreground p-4 cursor-pointer"
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

            <div className="hidden items-center justify-end gap-6 text-xs text-muted-foreground lg:flex border-t border-border px-4 py-4">
                <div className="flex items-center gap-1.5">
                    <span>{formatRelativeTime(project.updatedAt)}</span>
                    <Clock className="size-3" />
                </div>
            </div>

            <ProjectDeleteConfirmationDialog
                open={isProjectDeleteDialogOpen}
                onOpenChange={setProjectDeleteDialogOpen}
                projectName={project.name}
                onConfirm={handleDeleteProject}
            />
        </div>
    );
}