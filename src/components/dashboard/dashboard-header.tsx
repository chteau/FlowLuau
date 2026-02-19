"use client"

import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { CreateProjectDialog } from "@/components/dashboard/create-project-dialog";
import { useRouter } from "next/navigation";

/**
 * DashboardHeader component for the application dashboard
 *
 * This component provides:
 * - Clear title and description for the projects dashboard
 * - Action button for creating new projects
 * - Integration with the project creation flow
 * - Responsive layout for different screen sizes
 *
 * The component automatically:
 * - Displays the main heading and descriptive text
 * - Renders the "New Project" button with proper styling
 * - Handles project creation navigation through router
 * - Integrates seamlessly with the CreateProjectDialog component
 *
 * @component
 *
 * @example
 * // Basic usage in a dashboard layout
 * <div className="flex h-screen">
 *   <SidebarNav />
 *   <div className="flex-1 flex flex-col overflow-hidden">
 *     <DashboardHeader />
 *     <main className="flex-1 overflow-auto p-6">
 *     </main>
 *   </div>
 * </div>
 *
 * @example
 * <div className="min-h-screen bg-background">
 *   <DashboardHeader />
 *   <div className="container mx-auto py-6">
 *     <ProjectsList />
 *   </div>
 * </div>
 */
export function DashboardHeader() {
    const router = useRouter();

    return (
        <header className="flex items-center justify-between border-b border-border bg-background px-6 py-4 z-10">
            <div>
                <h1 className="text-xl font-semibold tracking-tight text-foreground">Projects</h1>
            </div>
            <div className="flex items-center gap-3">
                <CreateProjectDialog
                    trigger={
                        <Button className="gap-2 bg-primary text-primary-foreground hover:bg-primary/90 cursor-pointer">
                            <Plus className="size-4" />
                            New Project
                        </Button>
                    }
                    onSuccess={(project) => router.push(`/project/${project.id}`)}
                />
            </div>
        </header>
    )
}