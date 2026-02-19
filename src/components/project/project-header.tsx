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
import { Skeleton } from "../ui/skeleton";

/**
 * Props interface for the ProjectHeader component
 *
 * Defines the configuration options for displaying project context information
 * at the top of the script editor interface with breadcrumb navigation.
 *
 * @interface ProjectHeaderProps
 * @property {Projects | null} project - Current project context data
 *   When null, displays placeholder content during loading states
 *   Contains project metadata including id and name for navigation
 * @property {string} [description] - Optional descriptive text for project context
 *   Currently unused in rendering but reserved for future enhancements
 * @property {string[]} [additionalCrumbs] - Optional extended breadcrumb segments
 *   Appended after project name for nested context (e.g., ["Scripts", "Main"])
 *   Each string represents a single breadcrumb segment in the navigation trail
 */
export interface ProjectHeaderProps {
    project: Projects | null;
    description?: string;
    additionalCrumbs?: string[];
}

/**
 * ProjectHeader component displays contextual navigation and project identity in the editor
 *
 * Renders a persistent header bar at the top of the script editor interface with:
 * - Project avatar icon derived from project name initial
 * - Hierarchical breadcrumb navigation showing current location in application flow
 * - Visual separation from main content area with border and background styling
 * - Accessible navigation landmarks for screen readers
 *
 * Navigation structure:
 * 1. Home ("Projects") → Links to project dashboard root
 * 2. Project name → Links to project overview/editor root
 * 3. [Optional] Additional context crumbs → Static text labels for nested views
 *
 * Visual characteristics:
 * - Fixed height (p-4 padding) with horizontal border separation
 * - Background matching application theme with z-index stacking context
 * - Project initial displayed in secondary-colored avatar circle
 * - Breadcrumb text sizing hierarchy (base for primary, lg for current context)
 * - Responsive spacing with gap-3 between avatar and breadcrumb elements
 *
 * Accessibility features:
 * - Semantic <header> element with aria-label for screen reader context
 * - Breadcrumb landmark with aria-label="Project navigation"
 * - Proper link semantics with next/link integration
 * - Visual focus indicators inherited from ButtonLink component styles
 *
 * Loading states:
 * - Project avatar shows first character when project data available
 * - Empty avatar container (no character) when project is null/loading
 * - Breadcrumb segments gracefully handle null project with optional chaining
 *
 * @component
 * @param {ProjectHeaderProps} props - Component configuration properties
 * @param {Projects | null} props.project - Current project context data
 * @param {string} [props.description] - Reserved for future descriptive text
 * @param {string[]} [props.additionalCrumbs] - Extended breadcrumb segments
 *
 * @example
 * // Basic usage in project editor layout
 * <ProjectHeader project={currentProject} />
 *
 * @example
 * // With nested context (e.g., script editor view)
 * <ProjectHeader
 *   project={currentProject}
 *   additionalCrumbs={["Scripts", "PlayerController"]}
 * />
 *
 * @example
 * // Loading state handling (parent component responsibility)
 * {project ? (
 *   <ProjectHeader project={project} />
 * ) : (
 *   <Skeleton className="h-14 w-full" />
 * )}
 */
export function ProjectHeader({ project, description, additionalCrumbs }: ProjectHeaderProps) {
    return (
        <header
            className="flex items-center justify-between border-b border-border bg-background p-4 z-10"
            aria-label="Project information"
        >
            <div className="flex gap-3 align-middle">
                <Link href="/">
                    <div className="h-8 w-8 bg-secondary rounded-md flex items-center justify-center text-secondary-foreground">
                        {project?.name.charAt(0)}
                    </div>
                </Link>
                <Breadcrumb aria-label="Project navigation" className="flex">
                    <BreadcrumbList>
                        <BreadcrumbItem>
                            <BreadcrumbLink asChild>
                                <Link href="/" className="text-base font-bold">Projects</Link>
                            </BreadcrumbLink>
                        </BreadcrumbItem>
                        <BreadcrumbSeparator />
                        <BreadcrumbItem>
                            <BreadcrumbLink asChild>
                                <Link href={`/project/${project?.id}`} className="text-base">{project?.name}</Link>
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
            </div>
        </header>
    );
}