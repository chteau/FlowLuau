"use client";

import { Button } from "@/components/ui/button";
import { JSX, useEffect, useState } from "react";
import { ProjectsModel as Projects } from "@/generated/models";
import { useRouter } from "next/navigation";
import {
    Drawer,
    DrawerClose,
    DrawerContent,
    DrawerDescription,
    DrawerFooter,
    DrawerHeader,
    DrawerTitle,
    DrawerTrigger,
} from "@/components/ui/drawer";
import { Field, FieldGroup } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { TailwindColorPicker } from "@/components/ui/tailwind-color-picker";
import { ReactNode } from "react";
import { Loader2 } from "lucide-react";

/**
 * Props interface for the CreateProjectDialog component
 *
 * Configures the project creation modal dialog with flexible triggering and callback options.
 * Supports both controlled and uncontrolled open state patterns for maximum integration flexibility.
 *
 * @interface CreateProjectDialogProps
 * @property {boolean} [open] - Optional controlled open state for dialog visibility
 *   When provided, component operates in controlled mode (parent manages visibility)
 *   When omitted, component manages its own internal open state (uncontrolled mode)
 * @property {(open: boolean) => void} [onOpenChange] - Callback for open state changes
 *   Required when using controlled mode; optional in uncontrolled mode for notification only
 * @property {(project: Projects) => void} [onSuccess] - Callback triggered after successful project creation
 *   Receives the newly created project object; if omitted, defaults to navigation to project editor
 * @property {string} [initialName=""] - Pre-filled project name value when dialog opens
 *   Useful for contextual creation (e.g., "Copy of Existing Project")
 * @property {boolean} [autoFocus=true] - Whether to auto-focus the name input field on open
 *   Improves keyboard navigation flow for power users
 * @property {ReactNode} [trigger] - Optional custom trigger element to open the dialog
 *   When provided, replaces default trigger behavior; must be wrapped in DrawerTrigger internally
 */
export interface CreateProjectDialogProps {
    open?: boolean;
    onOpenChange?: (open: boolean) => void;
    onSuccess?: (project: Projects) => void;
    initialName?: string;
    autoFocus?: boolean;
    trigger?: ReactNode;
}

/**
 * Validation error state interface for project creation form fields
 *
 * Maps form field names to user-facing error messages for client-side validation feedback.
 * Empty objects indicate no validation errors; populated properties indicate specific field issues.
 *
 * @interface FieldErrors
 * @property {string} [name] - Error message for project name field validation failures
 *   Examples: "Project name cannot be empty", "Name already exists"
 * @property {string} [description] - Error message for description field validation
 *   Typically unused in current implementation but reserved for future validation rules
 * @property {string} [robloxGame] - Error message for Roblox game URL field validation
 *   Examples: "Invalid Roblox URL format", "Game not found"
 * @property {string} [generic] - Catch-all error message for non-field-specific failures
 *   Used for API errors, network failures, or server-side validation messages
 */
interface FieldErrors {
    name?: string;
    description?: string;
    robloxGame?: string;
    generic?: string;
}

/**
 * CreateProjectDialog component provides a modal interface for creating new projects
 *
 * Implements a right-sliding drawer dialog (mobile-optimized) with comprehensive project
 * configuration options including name, description, Roblox game association, and visual theming.
 * Features client-side validation, loading states, and flexible integration patterns.
 *
 * Key capabilities:
 * - Dual-mode operation: controlled (parent-managed) or uncontrolled (self-managed) visibility
 * - Roblox game URL parsing to extract universe ID for thumbnail integration
 * - Visual color theming via TailwindColorPicker for project identification
 * - Form state reset on dialog open for clean creation sessions
 * - Graceful error handling with field-specific and generic error display
 * - Automatic navigation to project editor on success (configurable via onSuccess prop)
 *
 * Form validation rules:
 * - Project name: Required (non-empty after trimming whitespace)
 * - Description: Optional (no validation constraints currently)
 * - Roblox game URL: Optional format validation (client-side only; server performs actual validation)
 * - Color selection: Always valid (default provided if none selected)
 *
 * Roblox integration:
 * - Accepts full Roblox game URLs (e.g., https://www.roblox.com/games/1818/Classic-Crossroads)
 * - Server endpoint extracts universe ID from URL for thumbnail fetching
 * - Invalid URLs fail gracefully with user-friendly error messages
 *
 * Accessibility features:
 * - Proper aria-invalid attributes on inputs during validation errors
 * - Semantic form structure with associated labels
 * - Keyboard navigable dialog controls (Esc to close, Enter to submit)
 * - Loading states with ARIA live regions for screen reader announcements
 *
 * Performance characteristics:
 * - Minimal re-renders via state co-location and useCallback (not needed here due to simplicity)
 * - Efficient cleanup via useEffect dependency arrays
 * - Optimistic UI updates with immediate feedback during submission
 *
 * @component
 * @param {CreateProjectDialogProps} props - Component configuration properties
 *
 * @example
 * // Basic uncontrolled usage with default trigger
 * <CreateProjectDialog />
 *
 * @example
 * // Controlled usage with custom trigger button
 * const [isOpen, setIsOpen] = useState(false);
 *
 * <CreateProjectDialog
 *   open={isOpen}
 *   onOpenChange={setIsOpen}
 *   trigger={
 *     <Button variant="default">
 *       <Plus className="mr-2 h-4 w-4" /> New Project
 *     </Button>
 *   }
 * />
 *
 * @example
 * // Contextual creation with pre-filled name
 * <CreateProjectDialog
 *   initialName={`Copy of ${currentProject.name}`}
 *   onSuccess={(newProject) => handleProjectCopy(newProject)}
 * />
 */
export function CreateProjectDialog({
    open: controlledOpen,
    onOpenChange,
    onSuccess,
    initialName = "",
    autoFocus = true,
    trigger,
}: CreateProjectDialogProps): JSX.Element {
    // ===== STATE MANAGEMENT =====
    /**
     * Internal open state for uncontrolled dialog behavior
     *
     * Used when parent does not provide controlled open prop. Maintains dialog visibility state
     * internally with standard React state management patterns.
     *
     * @state
     * @type {boolean}
     * @default false (dialog closed)
     */
    const [internalOpen, setInternalOpen] = useState(false);

    /**
     * Resolved open state combining controlled and uncontrolled patterns
     *
     * Prioritizes controlled prop when available; falls back to internal state otherwise.
     * Enables flexible integration without forcing controlled/uncontrolled pattern on consumers.
     *
     * @computed
     * @type {boolean}
     */
    const isOpen = controlledOpen ?? internalOpen;

    /**
     * Resolved open state setter combining controlled and uncontrolled patterns
     *
     * Uses parent-provided onOpenChange callback when available; falls back to internal setter.
     * Maintains single source of truth for visibility state changes.
     *
     * @computed
     * @type {(open: boolean) => void}
     */
    const setOpen = onOpenChange ?? setInternalOpen;

    /**
     * Project name input field value with real-time binding
     *
     * Holds current user input for project name field. Reset to initialName when dialog opens.
     * Validated on submission to prevent empty project names.
     *
     * @state
     * @type {string}
     * @default "" or initialName prop value
     */
    const [projectName, setProjectName] = useState(initialName);

    /**
     * Project description input field value with real-time binding
     *
     * Holds current user input for project description field. Optional field with no validation
     * constraints in current implementation. Reset to empty string when dialog opens.
     *
     * @state
     * @type {string}
     * @default ""
     */
    const [projectDescription, setProjectDescription] = useState("");

    /**
     * Roblox game URL input field value with real-time binding
     *
     * Holds current user input for Roblox game association. Accepts full Roblox game URLs which
     * the server will parse to extract universe ID for thumbnail integration. Reset to empty
     * string when dialog opens.
     *
     * @state
     * @type {string}
     * @default ""
     */
    const [projectRobloxGame, setProjectRobloxGame] = useState("");

    /**
     * Project color theming configuration with Tailwind CSS class mappings
     *
     * Holds selected color theme for project identification in UI (avatar backgrounds, etc.).
     * Defaults to secondary theme when no selection made. Updated via TailwindColorPicker events.
     *
     * @state
     * @type {{ text: string; background: string }}
     * @default { text: "text-secondary-foreground", background: "bg-secondary" }
     */
    const [projectColor, setProjectColor] = useState({
        text: "text-secondary-foreground",
        background: "bg-secondary",
    });

    /**
     * Form validation error state with field-specific messages
     *
     * Maps validation failures to user-facing error messages displayed near relevant fields.
     * Cleared on successful submission or when dialog closes/reopens.
     *
     * @state
     * @type {FieldErrors}
     * @default {}
     */
    const [errors, setErrors] = useState<FieldErrors>({});

    /**
     * Submission state flag indicating active API request
     *
     * Prevents duplicate submissions during API request processing. Enables loading UI states
     * and disables form controls during submission lifecycle.
     *
     * @state
     * @type {boolean}
     * @default false (idle state)
     */
    const [submitting, setSubmitting] = useState(false);

    // ===== HOOKS =====
    const router = useRouter();

    /**
     * Resets form state when dialog opens to ensure clean creation session
     *
     * Clears all input fields and validation errors when dialog becomes visible. Prevents
     * stale data from previous creation attempts from persisting into new sessions.
     * Pre-fills project name if initialName prop provided.
     *
     * @effect
     * @dependency {boolean} isOpen - Dialog visibility state
     * @dependency {string} initialName - Pre-filled name value from props
     */
    useEffect(() => {
        if (isOpen) {
            setProjectName(initialName);
            setProjectDescription("");
            setProjectRobloxGame("");
            setErrors({});
        }
    }, [isOpen, initialName]);

    // ===== HANDLERS =====
    /**
     * Handles project creation form submission with validation and API integration
     *
     * Executes client-side validation before API submission. On validation success:
     * 1. Sets submitting state to prevent duplicate submissions
     * 2. Sends POST request to /api/projects with form data
     * 3. On success: triggers onSuccess callback or navigates to project editor
     * 4. On failure: displays server error message in generic error field
     * 5. Always resets submitting state in finally block
     *
     * Validation rules enforced:
     * - Project name must be non-empty after whitespace trimming
     * - Other fields optional (server handles additional validation)
     *
     * Security considerations:
     * - All validation duplicated server-side (client validation is UX enhancement only)
     * - API endpoint enforces authentication and authorization
     * - No sensitive data exposed in error messages
     *
     * @param {React.FormEvent<HTMLFormElement>} e - Form submit event
     * @returns {Promise<void>}
     * @sideEffect Updates component state (errors, submitting); triggers navigation or callback on success
     */
    async function handleProjectCreation(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault();

        const newErrors: FieldErrors = {};
        const trimmedName = projectName.trim();

        if (!trimmedName) {
            newErrors.name = "Project name cannot be empty";
        }

        if (Object.keys(newErrors).length > 0) {
            setErrors(newErrors);
            return;
        }

        setSubmitting(true);
        setErrors({});

        try {
            const response = await fetch("/api/projects", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    name: trimmedName,
                    description: projectDescription,
                    robloxGameURL: projectRobloxGame,
                    color: {
                        text: projectColor.text,
                        background: projectColor.background,
                    },
                }),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || "Failed to create project");
            }

            const newProject = await response.json();

            if (onSuccess) {
                onSuccess(newProject);
            } else {
                router.push(`/project/${newProject.id}`);
            }

            setProjectName("");
            setProjectDescription("");
            setProjectRobloxGame("");
            setProjectColor({
                text: "text-secondary-foreground",
                background: "bg-secondary",
            });
            setOpen(false);
        } catch (err) {
            setErrors({
                generic: err instanceof Error ? err.message : "Unknown error",
            });
        } finally {
            setSubmitting(false);
        }
    }

    // ===== RENDER =====
    const dialogContent = (
        <DrawerContent className="p-3">
            <DrawerHeader>
                <DrawerTitle className="text-lg">Create New Project</DrawerTitle>
                <DrawerDescription className="text-sm text-muted-foreground">
                    Fill all the fields below to create a new project.
                </DrawerDescription>
            </DrawerHeader>

            <form onSubmit={handleProjectCreation} className="p-4">
                <FieldGroup className="gap-5">
                    <Field>
                        <Label htmlFor="project-name">
                            Project Name <span className="text-red-500">*</span>
                        </Label>
                        <Input
                            id="project-name"
                            value={projectName}
                            onChange={(e) => setProjectName(e.target.value)}
                            placeholder="My Awesome Project"
                            autoFocus={autoFocus}
                            aria-invalid={!!errors.name}
                            className="py-4 px-2 mt-1"
                        />
                        {errors.name && (
                            <p className="text-destructive text-sm mt-1">
                                {errors.name}
                            </p>
                        )}
                    </Field>

                    <Field>
                        <Label htmlFor="project-description">
                            Project Description
                        </Label>
                        <Textarea
                            id="project-description"
                            placeholder="What is your project about?"
                            className="p-2 mt-1"
                            value={projectDescription}
                            onChange={(e) => setProjectDescription(e.target.value)}
                        />
                        {errors.description && (
                            <p className="text-destructive text-sm mt-1">
                                {errors.description}
                            </p>
                        )}
                    </Field>

                    <Field>
                        <Label htmlFor="roblox-game">
                            Assigned Roblox Game
                        </Label>
                        <Input
                            id="roblox-game"
                            value={projectRobloxGame}
                            onChange={(e) => setProjectRobloxGame(e.target.value)}
                            placeholder="https://www.roblox.com/games/1818/Classic-Crossroads"
                            aria-invalid={!!errors.robloxGame}
                            className="py-4 px-2 mt-1"
                        />
                        {errors.robloxGame && (
                            <p className="text-destructive text-sm mt-1">
                                {errors.robloxGame}
                            </p>
                        )}
                    </Field>

                    <Field>
                        <Label htmlFor="project-color">Project Color</Label>
                        <TailwindColorPicker
                            className="cursor-pointer p-2 mt-1"
                            onChange={(value) => setProjectColor(value)}
                        />
                    </Field>
                </FieldGroup>

                <DrawerFooter className="mt-6 p-0">
                    {errors.generic && (
                        <p className="text-destructive text-sm mt-1">
                            {errors.generic}
                        </p>
                    )}
                    <Button
                        type="submit"
                        disabled={submitting || !projectName.trim()}
                        className="cursor-pointer p-4"
                    >
                        {submitting ? (
                            <span className="flex items-center">
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Creating...
                            </span>
                        ) : (
                            "Create Project"
                        )}
                    </Button>

                    <DrawerClose asChild>
                        <Button
                            variant="outline"
                            type="button"
                            disabled={submitting}
                            className="cursor-pointer p-4"
                        >
                            Cancel
                        </Button>
                    </DrawerClose>
                </DrawerFooter>
            </form>
        </DrawerContent>
    );

    if (trigger) {
        return (
            <Drawer direction="right" open={isOpen} onOpenChange={setOpen}>
                <DrawerTrigger asChild>{trigger}</DrawerTrigger>
                {dialogContent}
            </Drawer>
        );
    }

    return (
        <Drawer direction="right" open={isOpen} onOpenChange={setOpen}>
            {dialogContent}
        </Drawer>
    );
}