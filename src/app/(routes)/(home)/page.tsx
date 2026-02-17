"use client";

import { authClient } from "@/lib/auth/client";
import { Button } from "@/components/ui/button";
import { SidebarNav } from "@/components/dashboard/sidebar-nav";
import { DashboardHeader } from "@/components/dashboard/dashboard-header";
import { ProjectsList } from "@/components/dashboard/projects-list";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { InfoIcon } from "lucide-react";


/**
 * Initiates Roblox OAuth authentication flow
 *
 * This function handles the social sign-in process with Roblox provider.
 * It uses the Better Auth client configured in the application.
 *
 * @returns A promise that resolves when the authentication flow is initiated
 */
async function signInWithRoblox() {
    await authClient.signIn.social({
        provider: "roblox",
        callbackURL: process.env["BETTER_AUTH_URL"] as string,
        disableRedirect: false,
    });
}

/**
 * Home component - Main landing page for authenticated users
 *
 * Handles:
 * - Authentication state management
 * - User greeting and profile display
 * - Projects list rendering
 * - Sign-in/sign-out functionality
 *
 * @returns JSX element containing the home page content
 */
export default function Home() {
    const me = authClient.useSession();

    // Show sign-in screen if not authenticated
    if (!me.data) {
        return (
            <div className="grid min-h-screen place-items-center p-4">
                <div className="text-center max-w-md">
                    <h1 className="text-2xl font-bold mb-4">Welcome to Project Manager</h1>
                    <p className="text-muted-foreground mb-6">
                        Sign in with Roblox to access your projects and start building
                    </p>
                    <Button
                        variant="default"
                        size="lg"
                        onClick={() => signInWithRoblox()}
                        className="px-8"
                    >
                        Sign in with Roblox
                    </Button>
                </div>
            </div>
        );
    }

    // Show main content if authenticated
    return (
        <div className="flex h-screen overflow-hidden bg-background">
            <SidebarNav />
            <div className="flex flex-1 flex-col overflow-hidden">
                <DashboardHeader />

                <main className="flex-1 w-full overflow-y-auto z-10">
                    <div className="flex flex-col flex-1 gap-6 p-6">
                        <div className="w-full items-start gap-4 flex-1">
                            <Alert className="w-full p-5 bg-amber-400/10 backdrop-blur border-amber-400/20">
                                <AlertTitle className="text-lg text-amber-200">Important notice</AlertTitle>
                                <AlertDescription className="text-amber-100 text-sm">
                                    This project is in early development. Expect bugs and missing features. Please report any issues you encounter on the GitHub repository.
                                </AlertDescription>
                            </Alert>
                        </div>

                        <ProjectsList />
                    </div>
                </main>
            </div>

            <div className="fixed inset-0 bg-linear-to-tr from-black via-transparent to-primary/8 pointer-events-none z-0"></div>
            <div className="fixed inset-0 grid-pattern pointer-events-none z-0"></div>
        </div>
    );
}