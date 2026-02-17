"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { ProjectsModel as Projects } from "@/generated/models";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ProjectHeader } from "@/components/project/project-header";
import { ProjectDeleteConfirmationDialog, ProjectDeleteConfirmationDialogProps } from "@/components/project/project-delete-confirmation-dialog";


/**
 * ProjectSettingsPage component provides a dedicated interface for managing project settings
 *
 * This component handles:
 * - Project name editing
 * - Project deletion
 * - Loading and error states
 * - API communication for settings changes
 *
 * The component follows the same patterns as the main project editor but focuses solely
 * on project-level settings rather than script editing.
 *
 * @component
 *
 * @example
 * // Route configuration in Next.js
 * // app/project/[id]/settings/page.tsx
 *
 * @example
 * // Basic usage
 * export default function Page() {
 *   return <ProjectSettingsPage />;
 * }
 */
export default function ProjectSettingsPage() {
    const [project, setProject] = useState<Projects | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const params = useParams();
    const router = useRouter();
    const { id: projectId } = params;

    const [isProjectDeleteDialogOpen, setProjectDeleteDialogOpen] = useState(false);
    const [isUpdatingProject, setIsUpdatingProject] = useState(false);
    const [projectName, setProjectName] = useState("");

    const fetchProject = useCallback(async () => {
        if (!projectId) return;

        setLoading(true);
        try {
            const response = await fetch(`/api/projects/${projectId}`);
            if (!response.ok) {
                if (response.status === 404) {
                    throw new Error("Project not found");
                }
                throw new Error("Failed to fetch project");
            }
            const projectData = await response.json();
            setProject(projectData);
            setProjectName(projectData.name);
        } catch (err) {
            setError(err instanceof Error ? err.message : "An unknown error occurred");
        } finally {
            setLoading(false);
        }
    }, [projectId]);

    useEffect(() => {
        fetchProject();
    }, [fetchProject]);

    /**
     * Handles project name update
     *
     * Calls the PUT /api/projects/[id] endpoint to update the project name
     */
    const handleUpdateProjectName = async () => {
        if (!projectName.trim() || !projectId || !project) return;

        setIsUpdatingProject(true);
        try {
            const response = await fetch(`/api/projects/${projectId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name: projectName }),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Failed to update project name');
            }

            const updatedProject = await response.json();
            setProject(updatedProject);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'An unknown error occurred');
        } finally {
            setIsUpdatingProject(false);
        }
    };

    /**
     * Handles project deletion
     *
     * Calls the DELETE /api/projects/[id] endpoint to delete the entire project
     * and redirects to projects list on success
     */
    const handleDeleteProject = async () => {
        if (!projectId) return;

        try {
            const response = await fetch(`/api/projects/${projectId}`, {
                method: 'DELETE',
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Failed to delete project');
            }

            router.push('/');
        } catch (err) {
            setError(err instanceof Error ? err.message : 'An unknown error occurred');
            setProjectDeleteDialogOpen(false);
        }
    };

    if (loading) return (
        <div className="flex h-screen">
            <div className="flex-1 flex items-center justify-center">
                <div className="text-lg">Loading project settings...</div>
            </div>
        </div>
    );

    if (error) return (
        <div className="flex h-screen">
            <div className="flex-1 flex flex-col items-center justify-center p-4">
                <div className="text-destructive mb-4">Error: {error}</div>
                <div className="flex gap-4">
                    <Button
                        variant="outline"
                        onClick={() => {
                            setError(null);
                            fetchProject();
                        }}
                    >
                        Retry
                    </Button>
                    <Button
                        variant="default"
                        onClick={() => router.push('/dashboard')}
                    >
                        Back to Projects
                    </Button>
                </div>
            </div>
        </div>
    );

    if (!project) return (
        <div className="flex h-screen">
            <div className="flex-1 flex flex-col items-center justify-center p-4">
                <div className="mb-4">Project not found.</div>
                <Button
                    variant="default"
                    onClick={() => router.push('/dashboard')}
                >
                    Back to Projects
                </Button>
            </div>
        </div>
    );

    return (
        <div className="flex h-screen overflow-hidden bg-background">
            <div className="flex flex-1 flex-col overflow-hidden">
                <ProjectHeader project={project} description="Manage your project settings and configuration." additionalCrumbs={["Settings"]} />

                <main className="flex-1 overflow-y-auto p-6 py-10">
                    <div className="max-w-2xl mx-auto">
                        <div className="mb-8">
                            <h2 className="text-2xl font-bold mb-2">Project Details</h2>
                            <p className="text-muted-foreground">
                                Manage your project settings and configuration.
                            </p>
                        </div>

                        <div className="space-y-6">

                            {/* Project Name Section */}
                            <div className="bg-card rounded-lg border p-6">
                                <h3 className="text-lg font-semibold mb-4">Project Name</h3>
                                <div className="space-y-4 w-full">
                                    <div>
                                        <Label htmlFor="project-name">Name</Label>
                                        <Input
                                            id="project-name"
                                            value={projectName}
                                            onChange={(e) => setProjectName(e.target.value)}
                                            placeholder="Enter project name"
                                            className="mt-2 py-4 px-4"
                                        />
                                    </div>
                                    <div className="flex justify-end">
                                        <Button
                                            size={"lg"}
                                            onClick={handleUpdateProjectName}
                                            disabled={isUpdatingProject || projectName.trim() === project.name || !projectName.trim()}
                                        >
                                            {isUpdatingProject ? (
                                                <span className="flex items-center">
                                                    <span className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                                                    Saving...
                                                </span>
                                            ) : "Save Changes"}
                                        </Button>
                                    </div>
                                </div>
                            </div>

                            {/* Danger Zone Section */}
                            <div className="bg-card rounded-lg border p-6">
                                <h3 className="text-lg font-semibold mb-2 text-destructive">Danger Zone</h3>
                                <p className="text-muted-foreground mb-4 text-sm">
                                    These actions cannot be undone. Please proceed with caution.
                                </p>

                                <div className="border-t pt-4">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <h4 className="font-medium">Delete Project</h4>
                                            <p className="text-muted-foreground text-xs mt-1">
                                                Permanently delete this project and all associated data
                                            </p>
                                        </div>
                                        <Button
                                            variant="destructive"
                                            size={"lg"}
                                            className="cursor-pointer"
                                            onClick={() => setProjectDeleteDialogOpen(true)}
                                        >
                                            Delete Project
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </main>
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