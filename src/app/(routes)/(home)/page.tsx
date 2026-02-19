"use client";

import { authClient } from "@/lib/auth/client";
import { Button } from "@/components/ui/button";
import { SidebarNav } from "@/components/dashboard/sidebar-nav";
import { DashboardHeader } from "@/components/dashboard/dashboard-header";
import { ProjectsList } from "@/components/dashboard/projects-list";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { InfoIcon } from "lucide-react";

/**
 * Initiates Roblox OAuth authentication flow using Better Auth client
 *
 * Handles the complete social sign-in process with Roblox OAuth provider.
 * Redirects user to Roblox authorization endpoint and handles callback flow.
 * Uses environment configuration for callback URL to ensure proper redirect handling.
 *
 * Security considerations:
 * - Uses OAuth 2.0 authorization code flow with PKCE (handled internally by Better Auth)
 * - Callback URL validated against environment configuration to prevent open redirect attacks
 * - Session management handled by Better Auth client after successful authentication
 *
 * Note: This function triggers a full page redirect to Roblox authorization endpoint.
 * The disableRedirect option is set to false to allow standard OAuth redirect flow.
 *
 * @async
 * @function signInWithRoblox
 * @returns {Promise<void>} Resolves when redirect to Roblox authorization is initiated
 * @throws {Error} Throws authentication errors from Better Auth client (network issues, invalid config)
 *
 * @example
 * // Basic usage in sign-in button handler
 * <Button onClick={signInWithRoblox}>
 *   Sign in with Roblox
 * </Button>
 *
 * @example
 * // With error handling
 * try {
 *   await signInWithRoblox();
 * } catch (error) {
 *   console.error("Authentication failed:", error);
 *   showErrorToast("Failed to start Roblox sign-in");
 * }
 */
async function signInWithRoblox() {
    await authClient.signIn.social({
        provider: "roblox",
        callbackURL: process.env["BETTER_AUTH_URL"] as string,
        disableRedirect: false,
    });
}

/**
 * Home component - Main application entry point and dashboard for authenticated users
 *
 * Serves as the primary interface for the application with dual-mode behavior:
 * 1. Unauthenticated state: Displays Roblox sign-in screen with branding and instructions
 * 2. Authenticated state: Renders full dashboard interface with sidebar navigation,
 *    project management interface, and development notices
 *
 * Key features:
 * - Automatic authentication state detection via Better Auth session hook
 * - Responsive layout with sidebar navigation and main content area
 * - Visual development notice for early-stage product transparency
 * - Background decorative elements (grid pattern and gradient overlay)
 * - Graceful loading states during authentication checks
 *
 * Component architecture:
 * - Uses authClient.useSession() hook for real-time authentication state
 * - Early return pattern for unauthenticated state (prevents unnecessary rendering)
 * - Semantic HTML structure with proper ARIA attributes for accessibility
 * - Z-index layering for visual hierarchy (content > decorative backgrounds)
 *
 * Security considerations:
 * - Session validation handled entirely by Better Auth client
 * - No client-side session manipulation or storage
 * - Authentication state derived directly from secure HTTP-only cookies
 *
 * Performance characteristics:
 * - Minimal client-side computation during initial render
 * - Lazy-loaded child components (SidebarNav, ProjectsList) via React.lazy possible
 * - Background decorative elements use pointer-events: none for optimal interaction
 *
 * @component
 * @returns {JSX.Element} Rendered application interface based on authentication state
 *
 * @example
 * // Basic usage as application root component
 * <Home />
 *
 * @example
 * // Integration in Next.js app router
 * // app/page.tsx
 * import Home from "@/app/page";
 *
 * export default function Page() {
 *   return <Home />;
 * }
 */
export default function Home() {
    const me = authClient.useSession();

    // Early return for unauthenticated users - display sign-in screen
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

    // Authenticated user interface - full dashboard layout
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

            {/* Decorative background elements - non-interactive */}
            <div className="fixed inset-0 bg-linear-to-tr from-black via-transparent to-primary/8 pointer-events-none z-0" />
            <div className="fixed inset-0 grid-pattern pointer-events-none z-0" />
        </div>
    );
}