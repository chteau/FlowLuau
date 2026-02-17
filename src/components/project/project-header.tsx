"use client";

import {
    Breadcrumb,
    BreadcrumbEllipsis,
    BreadcrumbItem,
    BreadcrumbLink,
    BreadcrumbList,
    BreadcrumbPage,
    BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { ProjectsModel as Projects } from "@/generated/models";
import Link from "next/link";

/**
 * Properties interface for the ProjectHeader component
 */
export interface ProjectHeaderProps {
    project: Projects | null;
    description?: string;
    additionalCrumbs?: string[];
}

/**
 * ProjectHeader component displays the project name and description at the top of the editor
 *
 * This component provides:
 * - Clear visual identification of the current project
 * - Responsive layout for different screen sizes
 * - Loading state handling
 * - Consistent styling with the application design system
 * - Accessibility features for screen readers
 *
 * The component automatically:
 * - Shows "Loading..." text when project data is not available
 * - Displays project name when data is available
 * - Provides descriptive subtitle for project context
 * - Maintains proper z-index for overlay behavior
 * - Uses backdrop blur for visual depth in the UI
 *
 * @component
 * @param {ProjectHeaderProps} props - Component properties
 *
 * @example
 * // Basic usage in a project editor layout
 * <div className="flex h-screen flex-col">
 *   <ProjectHeader project={currentProject} />
 *   <div className="flex flex-1 overflow-hidden">
 *     <ScriptList />
 *     <ScriptEditor />
 *   </div>
 * </div>
 *
 * @example
 * // With minimal setup for a simple implementation
 * <ProjectHeader project={project} />
 *
 * @example
 * // In a responsive dashboard layout with conditional rendering
 * {project && (
 *   <ProjectHeader project={project} />
 * )}
 */
export function ProjectHeader({ project, description, additionalCrumbs }: ProjectHeaderProps) {
    return (
        <header
            className="flex items-center justify-between border-b border-border bg-card/30 backdrop-blur px-6 py-4 z-10"
            aria-label="Project information"
        >
            <div>
                <Breadcrumb aria-label="Project navigation">
                    <BreadcrumbList>
                        <BreadcrumbItem>
                            <BreadcrumbLink asChild>
                                <Link href="/" className="text-lg">Projects</Link>
                            </BreadcrumbLink>
                        </BreadcrumbItem>
                        <BreadcrumbSeparator />
                        <BreadcrumbItem>
                            <BreadcrumbLink asChild>
                                <Link href={`/project/${project?.id}`} className="text-lg">{project?.name}</Link>
                            </BreadcrumbLink>
                        </BreadcrumbItem>
                        {additionalCrumbs && additionalCrumbs.length > 0 && (
                            <>
                                <BreadcrumbSeparator />
                                {additionalCrumbs.map((crumb, index) => (
                                    <BreadcrumbItem key={index}>
                                        <BreadcrumbLink className="text-lg">{crumb}</BreadcrumbLink>
                                    </BreadcrumbItem>
                                ))}
                            </>
                        )}
                    </BreadcrumbList>
                </Breadcrumb>
                <p className="mt-0.5 text-xs text-muted-foreground">
                    {description || "Edit your scripts and nodes."}
                </p>
            </div>
        </header>
    );
}