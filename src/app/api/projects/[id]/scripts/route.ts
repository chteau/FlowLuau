import { getServerSession } from "@/lib/auth/utils/get-session";
import { prisma } from "@/lib/db";
import { NextResponse } from "next/server";

/**
 * GET handler to retrieve all scripts for a specific project.
 *
 * This endpoint returns a list of scripts associated with a project, but only if:
 * 1. The user is authenticated
 * 2. The project exists
 * 3. The project belongs to the authenticated user
 *
 * @param req - Incoming request object (unused but required by Next.js)
 * @param context - Context containing route parameters
 * @param context.params - Promise resolving to route parameters including project ID
 *
 * @returns Array of scripts for the project if authorized, otherwise appropriate error response
 *
 * @throws {Error} 400 Bad Request if project ID format is invalid
 * @throws {Error} 401 Unauthorized if no valid session
 * @throws {Error} 403 Forbidden if user doesn't own the project
 * @throws {Error} 404 Not Found if project doesn't exist
 * @throws {Error} 500 Internal Server Error for database issues
 */
export async function GET(
    req: Request,
    context: { params: Promise<{ id: string }> }
) {
    try {
        const session = await getServerSession();
        if (!session) {
            return unauthorizedResponse();
        }

        const { id: projectId } = await context.params;
        validateProjectId(projectId);

        const project = await verifyProjectOwnership(session.user.id, projectId);
        if (!project) {
            return notFoundResponse("Project");
        }

        const scripts = await fetchProjectScripts(projectId);

        return NextResponse.json(scripts);
    } catch (error) {
        if (error instanceof ProjectIdValidationError) {
            return NextResponse.json(
                { error: error.message },
                { status: 400 }
            );
        }

        if (isPrismaNotFoundError(error)) {
            return notFoundResponse("Project");
        }

        return handleDatabaseError(error, "fetching project scripts");
    }
}


// === Helper Functions ===
/**
 * Custom error class for project ID validation failures
 */
class ProjectIdValidationError extends Error {
    constructor(message: string) {
        super(message);
        this.name = "ProjectIdValidationError";
    }
}

/**
 * Validates the project ID format
 *
 * @param projectId - Project ID to validate
 * @throws {ProjectIdValidationError} If validation fails
 */
function validateProjectId(projectId: string) {
    // Basic UUID validation (simplified pattern)
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

    if (!projectId) {
        throw new ProjectIdValidationError("Project ID is required");
    }

    if (typeof projectId !== "string") {
        throw new ProjectIdValidationError("Project ID must be a string");
    }

    if (!uuidRegex.test(projectId)) {
        throw new ProjectIdValidationError("Invalid project ID format");
    }
}

/**
 * Verifies that a project exists and belongs to the current user
 *
 * @param userId - ID of the authenticated user
 * @param projectId - ID of the project to verify
 * @returns Project object if found and owned by user, otherwise null
 */
async function verifyProjectOwnership(userId: string, projectId: string) {
    return prisma.projects.findUnique({
        where: {
            id: projectId,
            userId,
        },
    });
}

/**
 * Fetches all scripts for a project with proper ordering
 *
 * @param projectId - ID of the project to fetch scripts for
 * @returns Array of scripts ordered by most recently updated
 */
async function fetchProjectScripts(projectId: string) {
    return prisma.scripts.findMany({
        where: { projectId },
        orderBy: { updatedAt: "desc" },
    });
}

/**
 * Creates a standardized unauthorized response
 *
 * @returns 401 Unauthorized response with descriptive message
 */
function unauthorizedResponse() {
    return NextResponse.json(
        { error: "Unauthorized - Authentication required" },
        { status: 401 }
    );
}

/**
 * Creates a standardized not found response
 *
 * @param entityName - Type of entity not found (e.g., "Project")
 * @returns 404 Not Found response with descriptive message
 */
function notFoundResponse(entityName: string) {
    return NextResponse.json(
        { error: `${entityName} not found or you don't have permission to access it` },
        { status: 404 }
    );
}

/**
 * Checks if error is a Prisma "RecordNotFound" error
 *
 * @param error - Error object to check
 * @returns True if error is Prisma record not found error
 */
function isPrismaNotFoundError(error: unknown): boolean {
    return (
        typeof error === "object" &&
        error !== null &&
        "code" in error &&
        (error as { code: string }).code === "P2025"
    );
}

/**
 * Handles database errors with appropriate logging and responses
 *
 * @param error - Error object from database operation
 * @param operation - Description of the failed operation
 * @returns 500 Internal Server Error response
 */
function handleDatabaseError(error: unknown, operation: string) {
    // Log detailed error for server-side debugging
    console.error(
        `Database error during ${operation}:`,
        error instanceof Error ? {
            message: error.message,
            stack: error.stack
        } : error
    );

    return NextResponse.json(
        { error: "Internal server error - Please try again later" },
        { status: 500 }
    );
}