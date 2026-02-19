"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
    MoreHorizontal,
    ExternalLink,
    Settings,
    Trash2,
    Calendar,
} from "lucide-react";
import { getRobloxGameThumbnails } from "@/app/actions/roblox";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ProjectDeleteConfirmationDialog } from "@/components/project/project-delete-confirmation-dialog";
import { Card, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";

/**
 * Represents a user project entity in the visual scripting application
 *
 * Projects serve as top-level containers for scripts, variables, and other resources.
 * Each project maintains metadata about its creation, modification history, ownership,
 * and optional Roblox universe integration for game development workflows.
 *
 * @interface Project
 * @property {string} id - Globally unique identifier (UUID) for project persistence and routing
 * @property {string} name - User-defined display name for the project (e.g., "Player Controller")
 * @property {string} description - Optional descriptive text explaining project purpose or scope
 * @property {string | Date} createdAt - Timestamp of project creation (ISO string from API or Date object)
 * @property {string | Date} updatedAt - Timestamp of last modification (ISO string from API or Date object)
 * @property {string} userId - Identifier of the authenticated user who owns this project
 * @property {string | null} robloxUniverseId - Optional Roblox universe identifier for game integration
 *   When present, enables thumbnail fetching and Roblox-specific tooling features
 * @property {Object} color - Visual theming configuration for project representation
 * @property {string} color.text - Tailwind CSS class for text coloring (e.g., "text-blue-400")
 * @property {string} color.background - Tailwind CSS class for background coloring (e.g., "bg-blue-400")
 */
export interface Project {
    id: string;
    name: string;
    description: string;
    createdAt: string | Date;
    updatedAt: string | Date;
    userId: string;
    robloxUniverseId: string | null;
    color: {
        text: string;
        background: string;
    };
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
 * contextual actions. Features a letter-based avatar derived from project name, optional
 * Roblox game thumbnail background, relative time display for last modification, and
 * description preview. Entire card surface is clickable for primary navigation while
 * preserving access to secondary actions via dropdown menu.
 *
 * Visual design characteristics:
 * - Letter avatar using first character of project name with customizable color theming
 * - Optional Roblox game thumbnail as background image (fades in on load)
 * - Subtle hover transitions on border and background for tactile feedback
 * - Absolute-positioned overlay link for full-card click navigation
 * - Dropdown menu with contextual actions (open, settings, delete)
 * - Compact footer displaying last modified time
 * - Description text with line clamping for multi-line preview
 * - Responsive layout adapting to container constraints
 *
 * Roblox integration:
 * - Automatically fetches game thumbnail when robloxUniverseId is present
 * - Thumbnail displayed as background image with letter avatar overlay
 * - Fallback to solid color avatar when thumbnail unavailable or not configured
 * - Optimistic loading with opacity transition for smooth visual experience
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
 * - Color theming applied via project.color.text and project.color.background
 * - Relies on parent component for project list state management
 *
 * Security considerations:
 * - Delete operation requires explicit confirmation dialog
 * - Navigation restricted to authenticated user's own projects (enforced server-side)
 * - No sensitive data exposed in client-side rendering
 * - Thumbnail fetching occurs client-side to avoid server bandwidth usage
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
 * // Integration with Roblox game project
 * <ProjectItem
 *   project={{
 *     id: "proj_roblox123",
 *     name: "Obstacle Course",
 *     description: "Parkour game with checkpoints and leaderboards",
 *     robloxUniverseId: "987654321",
 *     color: { text: "text-blue-400", background: "bg-blue-400" },
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
    const [gameThumbnail, setGameThumbnail] = useState<string | null>(null);

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
     * Roblox integration configuration, and advanced options. Accessed exclusively
     * through dropdown menu to prevent accidental navigation.
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
     * projects they don't own regardless of frontend actions. Backend middleware
     * verifies user identity and project ownership before processing deletion.
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

    /**
     * Fetches Roblox game thumbnail when project has associated universe ID
     *
     * Executes server action to retrieve thumbnail metadata from Roblox API.
     * Updates local state with thumbnail URL for background image display.
     * Handles errors gracefully without disrupting main component functionality.
     *
     * Optimization:
     * - Only executes when robloxUniverseId is present (prevents unnecessary requests)
     * - Uses server action for proper request handling and potential caching
     * - Sets thumbnail URL directly to state for immediate visual feedback
     *
     * @effect
     * @dependency {string | null} project.robloxUniverseId - Roblox universe identifier
     */
    useEffect(() => {
        (async () => {
            if (!project.robloxUniverseId) return;

            try {
                const data = await getRobloxGameThumbnails(project.robloxUniverseId);
                if (data) setGameThumbnail(data.thumbnails[0]?.imageUrl || null);
            } catch (err) {
                console.warn(err);
            }
        })();
    }, [project.robloxUniverseId]);

    return (
        <Card className={cn(
            "flex flex-col justify-between rounded-md border border-border",
            "bg-card/50 backdrop-blur group-hover:bg-accent/50 transition-colors",
            "hover:border-foreground/20 group",
            "z-10 p-0"
        )}>
            <Link
                href={`/project/${project.id}`}
                className="absolute top-0 left-0 size-full z-10 cursor-pointer"
            />
            <div className="size-full min-h-40 bg-muted/30 p-4 relative overflow-hidden flex">
                <img
                    src={gameThumbnail || undefined}
                    className={cn(
                        "absolute top-0 left-0 size-full transition-opacity duration-300 object-cover",
                        gameThumbnail ? "opacity-100" : "opacity-0",
                    )}
                    loading={"eager"}
                    alt=""
                />

                <div className={cn(
                    "w-12 h-12 rounded-lg flex items-center justify-center font-bold text-lg relative z-10 shadow-sm backdrop-blur",
                    project.color.text || "text-secondary-foreground",
                    project.color.background || "bg-secondary",
                )}>
                    {project.name.charAt(0)}
                </div>

                <div className="absolute top-2 right-2 z-15 group-hover:opacity-100 transition-opacity">
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button
                                variant="ghost"
                                size="icon-sm"
                                className="bg-background/50 hover:text-foreground p-4 cursor-pointer transition-all"
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
                <div className="flex flex-col justify-center gap-1">
                    <CardTitle className="text-lg font-semibold truncate max-w-full">
                        {project.name}
                    </CardTitle>
                    {project.description && (
                        <CardDescription className="text-muted-foreground truncate overflow-hidden text-ellipsis max-w-full line-clamp-2">
                            {project.description}
                        </CardDescription>
                    )}
                </div>
            </CardHeader>

            <CardFooter className="p-4 pt-0 flex items-center gap-4 text-[11px] text-muted-foreground">
                <div className="flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    {formatRelativeTime(project.updatedAt)}
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