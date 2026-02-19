"use client";

import { useEffect, useState } from "react";
import { ProjectsModel as Projects } from "@/generated/models";
import { useRouter } from "next/navigation";

import {
    Empty,
    EmptyContent,
    EmptyDescription,
    EmptyHeader,
    EmptyMedia,
    EmptyTitle,
} from "@/components/ui/empty";
import { FolderCode } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CreateProjectDialog } from "@/components/dashboard/create-project-dialog";
import { ProjectItem } from "@/components/dashboard/project-item";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardFooter, CardHeader, CardTitle } from "../ui/card";
import { cn } from "@/lib/utils";

/**
 * ProjectsListSkeleton component for displaying loading placeholders
 *
 * @returns {JSX.Element} The skeleton component.
 */
function ProjectsListSkeleton() {
    return (
        <div className="w-full">
            <div className="grid gap-4 w-full grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
                {Array.from({ length: 8 }).map((_, index) => (
                    <Card
                        key={index}
                        className={cn(
                            "flex flex-col justify-between rounded-md border border-border",
                            "bg-card/50 backdrop-blur group-hover:bg-accent/50 transition-colors",
                            "min-w-md hover:border-foreground/20 group",
                            "z-10 p-0"
                        )}
                    >
                        <div className="size-full min-h-30 bg-muted/30 p-4 relative overflow-hidden flex">
                            <Skeleton className="w-12 h-12 rounded-lg" />
                        </div>

                        <CardHeader className="space-y-2">
                            <div className="flex items-center justify-between">
                                <CardTitle className="text-lg font-semibold truncate max-w-full">
                                    <Skeleton className="h-6 w-3/4" />
                                </CardTitle>
                            </div>
                        </CardHeader>

                        <CardFooter className="p-4 pt-0 flex items-center gap-4 text-[11px] text-muted-foreground">
                            <div className="flex items-center gap-1">
                                <Skeleton className="h-3 w-3" />
                                <Skeleton className="h-3 w-16" />
                            </div>
                            <div className="flex items-center gap-1">
                                <Skeleton className="h-3 w-3" />
                                <Skeleton className="h-3 w-10" />
                            </div>
                        </CardFooter>
                    </Card>
                ))}
            </div>
        </div>
    );
}

/**
 * ProjectsList component displays and manages user's projects
 *
 * This component provides:
 * - Loading state while fetching projects
 * - Error handling with retry functionality
 * - Responsive grid layout for project display
 * - Empty state handling for new users
 * - Integration with project creation flow
 *
 * The component automatically:
 * - Fetches user projects from the API on mount
 * - Handles authentication errors by refreshing the page
 * - Displays projects using the ProjectItem component
 * - Shows appropriate empty state when no projects exist
 * - Provides error recovery with retry button
 *
 * @component
 *
 * @example
 * <div className="container mx-auto py-6">
 *   <ProjectsList />
 * </div>
 *
 * @example
 * <div className="min-h-screen bg-background">
 *   <DashboardHeader />
 *   <main className="container mx-auto py-6">
 *     <ProjectsList />
 *   </main>
 * </div>
 */
export function ProjectsList() {
    const [projects, setProjects] = useState<Projects[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const router = useRouter();

    useEffect(() => {
        /**
         * Fetches user projects from API endpoint
         *
         * This function:
         * - Makes a GET request to /api/projects
         * - Handles 401 unauthorized responses by refreshing the page
         * - Updates state with fetched projects on success
         * - Sets error state on failure
         * - Always sets loading to false when complete
         */
        async function fetchProjects() {
            try {
                const response = await fetch("/api/projects");
                if (!response.ok) {
                    if (response.status === 401) {
                        // Session might have expired, refresh to handle auth
                        window.location.reload();
                        return;
                    }
                    throw new Error("Failed to fetch projects");
                }
                const data = await response.json();
                setProjects(data);
            } catch (err) {
                setError(err instanceof Error ? err.message : "An unknown error occurred");
            } finally {
                setLoading(false);
            }
        }

        fetchProjects();
    }, []);

    if (loading) {
        return <ProjectsListSkeleton />;
    }

    if (error) {
        return (
            <div className="text-center py-8 text-destructive">
                <p>Error: {error}</p>
                <Button
                    variant="outline"
                    className="mt-4"
                    onClick={() => {
                        setError(null);
                        setLoading(true);
                        // Re-fetch projects after error
                        fetch("/api/projects")
                            .then(res => {
                                if (res.ok) return res.json();
                                throw new Error("Failed to fetch projects");
                            })
                            .then(data => {
                                setProjects(data);
                                setLoading(false);
                            })
                            .catch(err => {
                                setError(err.message);
                                setLoading(false);
                            });
                    }}
                >
                    Retry
                </Button>
            </div>
        );
    }

    return (
        <div className="w-full">
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-6">
                {/* Projects Grid */}
                {projects.length > 0 && (
                    <div className="grid gap-4 w-full grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
                        {projects.map((project) => (
                            <ProjectItem key={project.id} project={project} />
                        ))}
                    </div>
                )}

                {/* Empty State */}
                {projects.length === 0 && (
                    <Empty className="w-full h-full flex flex-col items-center justify-center gap-4 py-16 z-10">
                        <EmptyHeader className="max-w-lg">
                            <EmptyMedia variant="icon" className="h-15 w-15 bg-card/80 backdrop-blur z-10">
                                <FolderCode className="size-8 text-muted-foreground" />
                            </EmptyMedia>

                            <EmptyTitle className="text-xl">No Projects Yet.</EmptyTitle>
                            <EmptyDescription className="text-md">
                                You haven&apos;t created any projects yet. Get started by creating
                                your first project.
                            </EmptyDescription>
                        </EmptyHeader>

                        <EmptyContent className="flex flex-col sm:flex-row justify-center gap-2 mt-4">
                            <CreateProjectDialog
                                trigger={
                                    <Button
                                        type="submit"
                                        size={"lg"}
                                        className="cursor-pointer"
                                    >
                                        Create Project
                                    </Button>
                                }
                                onSuccess={(project) => router.push(`/project/${project.id}`)}
                            />

                            <Button variant="outline" disabled size={"lg"}>Import Project</Button>
                        </EmptyContent>
                    </Empty>
                )}
            </div>
        </div>
    );
}