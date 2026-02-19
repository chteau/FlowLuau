"use client";

import { cn } from "@/lib/utils";
import { LayoutDashboard, LogOut, Settings, ChevronsUpDown } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { authClient } from "@/lib/auth/client";
import { usePathname } from "next/navigation";
import Link from "next/link";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { buttonVariants } from "../ui/button";

/**
 * Navigation item interface for sidebar menu items
 */
interface NavItem {
    label: string;
    icon: React.ComponentType<{ className?: string; size?: number }>;
    href: string;
}

/**
 * Navigation section interface for grouping related navigation items
 */
interface NavSection {
    title?: string;
    items: NavItem[];
}

const NAV_SECTIONS: NavSection[] = [
    {
        title: "Dashboard",
        items: [
            { label: "Projects", icon: LayoutDashboard, href: "/" },
        ],
    },
];

/**
 * Sidebar navigation component for the application
 *
 * This component provides:
 * - Organization/workspace switching functionality
 * - Main navigation menu
 * - User profile information at the bottom
 *
 * @component
 */
export function SidebarNav() {
    const me = authClient.useSession();
    const pathname = usePathname();

    /**
     * Gets a fallback avatar text based on user's name
     *
     * @returns Two-letter initials from user's name
     */
    const getUserInitials = (): string => {
        if (!me.data?.user.name) return "US";

        const nameParts = me.data.user.name.split(" ");
        if (nameParts.length === 1) {
            return nameParts[0]!.slice(0, 2).toUpperCase();
        }

        return (
            nameParts[0]![0]! +
            nameParts[nameParts.length - 1]![0]!
        ).toUpperCase();
    };

    // Handle loading and error states
    if (me.isPending) {
        return (
            <aside className="flex h-screen w-64 flex-col border-r border-border bg-sidebar z-10">
                <div className="p-3 border-b border-sidebar-border">
                    <div className="flex items-center gap-3 px-2 py-2">
                        <div className="w-7 h-7 rounded-md bg-muted animate-pulse" />
                        <div className="h-4 w-24 bg-muted rounded animate-pulse" />
                    </div>
                </div>
                <nav className="flex-1 px-3 py-4">
                    <div className="space-y-2">
                        <div className="h-8 w-full rounded bg-muted animate-pulse" />
                        <div className="h-8 w-full rounded bg-muted animate-pulse" />
                    </div>
                </nav>
                <div className="p-3 border-t border-sidebar-border">
                    <div className="flex items-center gap-3 px-2 py-2">
                        <div className="w-7 h-7 rounded-full bg-muted animate-pulse" />
                        <div className="space-y-1">
                            <div className="h-4 w-20 bg-muted rounded animate-pulse" />
                            <div className="h-3 w-24 bg-muted rounded animate-pulse" />
                        </div>
                    </div>
                </div>
            </aside>
        );
    }

    if (me.error || !me.data) {
        return (
            <aside className="flex h-screen w-64 flex-col border-r border-border bg-background z-10">
                <div className="p-3 border-b border-sidebar-border">
                    <div className="text-destructive text-sm p-2">
                        Error loading sidebar
                    </div>
                </div>
                <nav className="flex-1 px-3 py-4" />
                <div className="p-3 border-t border-sidebar-border" />
            </aside>
        );
    }

    return (
        <aside className="flex h-screen w-64 flex-col border-r border-border bg-background z-10">
            {/* User section */}
            <div className="border-b border-sidebar-border" aria-label="User profile">
                <DropdownMenu>
                    <DropdownMenuTrigger asChild className="outline-none">
                        <button
                            className="flex w-full cursor-pointer items-center gap-3 p-5 py-5.5 text-sm text-sidebar-foreground transition-colors hover:bg-sidebar-accent"
                        >
                            <Avatar className="size-10">
                                {me.data.user.image ? (
                                    <AvatarImage
                                        src={me.data.user.image}
                                        alt={`${me.data.user.name}'s profile`}
                                    />
                                ) : null}
                                <AvatarFallback className="bg-primary/20 text-primary text-xs font-semibold">
                                    {getUserInitials()}
                                </AvatarFallback>
                            </Avatar>
                            <div className="flex-1 text-left overflow-hidden">
                                <p className="text-sm font-medium leading-none truncate">
                                    {me.data.user.name}
                                </p>
                                <p className="mt-0.5 text-xs text-muted-foreground truncate">
                                    {me.data.user.email}
                                </p>
                            </div>
                            <ChevronsUpDown className="size-4 text-muted-foreground" />
                        </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent className="w-56 absolute left-3" align="end">
                        <DropdownMenuLabel className="font-normal">
                            <div className="flex flex-col space-y-1 p-2">
                                <p className="text-sm font-medium leading-none">
                                    {me.data.user.name}
                                </p>
                                <p className="text-xs leading-none text-muted-foreground">
                                    {me.data.user.email}
                                </p>
                            </div>
                        </DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem asChild className="cursor-pointer">
                            <Link href="/settings">
                                <Settings className="mr-2 h-4 w-4" />
                                <span>Settings</span>
                            </Link>
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={() => authClient.signOut()}  className="cursor-pointer">
                            <LogOut className="mr-2 h-4 w-4" />
                            <span>Log out</span>
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>

            {/* Navigation */}
            <nav className="flex-1 overflow-y-auto px-3 py-4" aria-label="Main navigation">
                {NAV_SECTIONS.map((section, sectionIndex) => (
                    <div
                        key={`section-${sectionIndex}`}
                        className={cn(sectionIndex > 0 && "mt-6")}
                    >
                        {section.title && (
                            <p
                                className="mb-2 px-2 text-xs font-medium tracking-wider text-muted-foreground uppercase"
                                id={`section-${sectionIndex}-title`}
                            >
                                {section.title}
                            </p>
                        )}
                        <div
                            className="flex flex-col gap-0.5"
                            role="group"
                            aria-labelledby={section.title ? `section-${sectionIndex}-title` : undefined}
                        >
                            {section.items.map((item) => {
                                const isActive = pathname === item.href;
                                return (
                                    <Link
                                        key={item.label}
                                        href={item.href}
                                        className={cn(
                                            buttonVariants({ variant: 'ghost', size: 'sm' }),
                                            "flex items-center gap-3 py-5 px-3 text-sm justify-start",
                                            isActive
                                                ? "bg-sidebar-accent text-sidebar-foreground font-medium"
                                                : "text-muted-foreground hover:bg-sidebar-accent hover:text-sidebar-foreground"
                                        )}
                                        aria-current={isActive ? "page" : undefined}
                                    >
                                        <item.icon className="size-4" aria-hidden="true" />
                                        <span>{item.label}</span>
                                    </Link>
                                );
                            })}
                        </div>
                    </div>
                ))}
            </nav>
        </aside>
    );
}