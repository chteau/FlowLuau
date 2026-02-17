"use client";

import { Button } from "@/components/ui/button";
import { JSX, useEffect, useState } from "react";
import { ProjectsModel as Projects } from "@/generated/models";
import { useRouter } from "next/navigation";
import {
    Dialog,
    DialogClose,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Field, FieldGroup } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ReactNode } from "react";

/**
 * Interface defining props for the CreateProjectDialog component
 */
export interface CreateProjectDialogProps {
    /**
     * Controls whether the dialog is open or closed
     * @default false
     */
    open?: boolean;

    /**
     * Callback function called when the dialog's open state changes
     * Required when using controlled mode (providing the `open` prop)
     */
    onOpenChange?: (open: boolean) => void;

    /**
     * Callback function called when a project is successfully created
     * If not provided, the component will automatically navigate to the new project
     */
    onSuccess?: (project: Projects) => void;

    /**
     * Initial value for the project name input field
     * @default ""
     */
    initialName?: string;

    /**
     * Whether to automatically focus the project name input when dialog opens
     * @default true
     */
    autoFocus?: boolean;

    /**
     * Custom trigger element that opens the dialog when clicked
     * If provided, the component will wrap the trigger with Dialog and DialogTrigger
     * When using a custom trigger, you don't need to provide `open` and `onOpenChange` props
     */
    trigger?: ReactNode;
}

/**
 * CreateProjectDialog component for creating new projects
 *
 * This reusable component provides a complete project creation flow with:
 * - Form validation for project names
 * - API integration for project creation
 * - Loading states and error handling
 * - Flexible usage patterns (controlled or uncontrolled)
 *
 * The component can be used in two primary ways:
 * 1. As a controlled component with explicit open state management
 * 2. With a custom trigger element for simplified usage
 *
 * @component
 * @param {CreateProjectDialogProps} props - Component configuration options
 * @returns {JSX.Element} Rendered dialog component
 *
 * @example
 * // Controlled mode with explicit state management
 * const [isDialogOpen, setIsDialogOpen] = useState(false);
 *
 * return (
 *   <>
 *     <Button onClick={() => setIsDialogOpen(true)}>Create Project</Button>
 *     <CreateProjectDialog
 *       open={isDialogOpen}
 *       onOpenChange={setIsDialogOpen}
 *       onSuccess={(project) => router.push(`/project/${project.id}`)}
 *     />
 *   </>
 * );
 *
 * @example
 * // Simplified usage with custom trigger
 * return (
 *   <CreateProjectDialog
 *     trigger={<Button>Create Project</Button>}
 *     onSuccess={(project) => router.push(`/project/${project.id}`)}
 *   />
 * );
 *
 * @example
 * // With initial name and custom behavior
 * return (
 *   <CreateProjectDialog
 *     trigger={<Button variant="outline">New Feature</Button>}
 *     initialName="Feature Implementation"
 *     onSuccess={(project) => {
 *       console.log("Project created:", project);
 *       // Custom logic here
 *     }}
 *   />
 * );
 */
export function CreateProjectDialog({
    open: controlledOpen,
    onOpenChange,
    onSuccess,
    initialName = "",
    autoFocus = true,
    trigger,
}: CreateProjectDialogProps): JSX.Element {
    const [internalOpen, setInternalOpen] = useState(false);
    const isOpen = controlledOpen ?? internalOpen;
    const setOpen = onOpenChange ?? setInternalOpen;

    const [projectName, setProjectName] = useState(initialName);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const router = useRouter();

    useEffect(() => {
        if (isOpen) {
            setProjectName(initialName);
            setError(null);
        }
    }, [isOpen, initialName]);

    /**
     * Handles project creation form submission
     *
     * Validates the project name, makes API call to create the project,
     * and handles success/error states appropriately.
     *
     * @param e - Form submission event
     * @throws {Error} When API request fails or validation fails
     */
    async function handleProjectCreation(e: any) {
        e.preventDefault();

        // Trim whitespace and validate name
        const trimmedName = projectName.trim();
        if (!trimmedName) {
            setError("Project name cannot be empty");
            return;
        }

        setSubmitting(true);
        setError(null);

        try {
            const response = await fetch("/api/projects", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ name: trimmedName }),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || "Failed to create project");
            }

            const newProject = await response.json();

            // Call success callback if provided
            if (onSuccess) {
                onSuccess(newProject);
            } else {
                router.push(`/project/${newProject.id}`);
            }

            // Reset form and close dialog
            setProjectName("");
            setOpen(false);
        } catch (err) {
            setError(err instanceof Error ? err.message : "An unknown error occurred");
        } finally {
            setSubmitting(false);
        }
    }

    const dialogContent = (
        <DialogContent className="sm:max-w-130 p-5">
            <DialogHeader>
                <DialogTitle className="text-lg">Create New Project</DialogTitle>
                <DialogDescription className="text-sm text-muted-foreground">
                    Enter a name for your new project. You can always change it later.
                </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleProjectCreation}>
                <FieldGroup>
                    <Field>
                        <Label htmlFor="project-name">Project Name</Label>
                        <Input
                            id="project-name"
                            value={projectName}
                            onChange={(e) => setProjectName(e.target.value)}
                            placeholder="My Awesome Project"
                            required
                            autoFocus={autoFocus}
                            aria-invalid={!!error}
                            aria-describedby={error ? "project-name-error" : undefined}
                            className="py-4 px-2 mt-1"
                        />
                        {error && (
                            <p id="project-name-error" className="text-destructive text-sm mt-1">
                                {error}
                            </p>
                        )}
                    </Field>
                </FieldGroup>
                <DialogFooter className="mt-6">
                    <DialogClose asChild>
                        <Button variant="outline" type="button" disabled={submitting} className="cursor-pointer">
                            Cancel
                        </Button>
                    </DialogClose>
                    <Button
                        type="submit"
                        disabled={submitting || !projectName.trim()}
                        className="cursor-pointer"
                    >
                        {submitting ? (
                            <span className="flex items-center">
                                <span className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                                Creating...
                            </span>
                        ) : "Create Project"}
                    </Button>
                </DialogFooter>
            </form>
        </DialogContent>
    );

    // If trigger is provided, wrap with Dialog and DialogTrigger
    if (trigger) {
        return (
            <Dialog open={isOpen} onOpenChange={setOpen}>
                <DialogTrigger asChild>{trigger}</DialogTrigger>
                {dialogContent}
            </Dialog>
        );
    }

    // Otherwise, just render the dialog content (to be used with external DialogTrigger)
    return (
        <Dialog open={isOpen} onOpenChange={setOpen}>
            {dialogContent}
        </Dialog>
    );
}