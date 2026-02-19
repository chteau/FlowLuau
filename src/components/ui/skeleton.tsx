"use client";

import { cn } from "@/lib/utils";
import { HTMLAttributes } from "react";

/**
 * Skeleton component for displaying loading placeholders
 *
 * This component provides a simple, animatd placeholder for content that is loading.
 * It's commonly used to build skeleton screens.
 *
 * @param {HTMLAttributes<HTMLDivElement>} props - The props for the component.
 * @returns {JSX.Element} The skeleton component.
 */
function Skeleton({
    className,
    ...props
}: HTMLAttributes<HTMLDivElement>): JSX.Element {
    return (
        <div
            className={cn("animate-pulse rounded-md bg-muted", className)}
            {...props}
        />
    );
}

export { Skeleton };