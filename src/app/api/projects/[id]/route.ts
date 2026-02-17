import { getServerSession } from "@/lib/auth/utils/get-session";
import { prisma } from "@/lib/db";
import { NextResponse } from "next/server";


/**
 * GET handler to retrieve a project by ID for the authenticated user.
 *
 * @param req - Incoming request object (unused but required by Next.js)
 * @param context - Context containing route parameters
 * @param context.params - Promise resolving to route parameters including project ID
 *
 * @returns Project data if found and authorized, otherwise appropriate error response
 *
 * @throws {Error} 401 Unauthorized if no valid session
 * @throws {Error} 404 Not Found if project doesn't exist or doesn't belong to user
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

        const { id } = await context.params;
        console.log("Fetching project with ID:", id, "for user:", session.user.id);

        const project = await prisma.projects.findUnique({
            where: {
                id,
                userId: session.user.id,
            },
        });

        if (!project) {
            return notFoundResponse("Project");
        }

        return NextResponse.json(project);
    } catch (error) {
        return handleDatabaseError(error, "fetching project");
    }
}


/**
 * PUT handler to update a project's name by ID for the authenticated user.
 *
 * @param req - Incoming request with JSON body containing new name
 * @param context - Context containing route parameters
 * @param context.params - Promise resolving to route parameters including project ID
 *
 * @returns Updated project data if successful, otherwise appropriate error response
 *
 * @throws {Error} 400 Bad Request if name is missing
 * @throws {Error} 401 Unauthorized if no valid session
 * @throws {Error} 404 Not Found if project doesn't exist or doesn't belong to user
 * @throws {Error} 500 Internal Server Error for database issues
 */
export async function PUT(
    req: Request,
    context: { params: Promise<{ id: string }> }
) {
    try {
        const session = await getServerSession();
        if (!session) {
            return unauthorizedResponse();
        }

        const { id } = await context.params;
        const { name } = await req.json();

        if (!name) {
            return NextResponse.json(
                { error: "Name is required" },
                { status: 400 }
            );
        }

        const updatedProject = await prisma.projects.update({
            where: {
                id,
                userId: session.user.id,
            },
            data: { name },
        });

        return NextResponse.json(updatedProject);
    } catch (error) {
        if (isPrismaNotFoundError(error)) {
            return notFoundResponse("Project");
        }

        return handleDatabaseError(error, "updating project");
    }
}


/**
 * DELETE handler to remove a project by ID for the authenticated user.
 *
 * This endpoint:
 * 1. Verifies user authentication
 * 2. Confirms project ownership
 * 3. Deletes the project and all associated resources (scripts, graphs)
 * 4. Returns appropriate success or error response
 *
 * @param req - Incoming request object
 * @param context - Context containing route parameters
 * @param context.params - Promise resolving to route parameters including project ID
 *
 * @returns Success message if deletion is successful, otherwise appropriate error response
 *
 * @throws {Error} 401 Unauthorized if no valid session
 * @throws {Error} 403 Forbidden if user doesn't own the project
 * @throws {Error} 404 Not Found if project doesn't exist
 * @throws {Error} 500 Internal Server Error for database issues
 */
export async function DELETE(
    req: Request,
    context: { params: Promise<{ id: string }> }
) {
    try {
        const session = await getServerSession();
        if (!session) {
            return unauthorizedResponse();
        }

        const { id } = await context.params;
        const project = await prisma.projects.findUnique({
            where: {
                id,
                userId: session.user.id,
            },
        });

        if (!project) {
            return notFoundResponse("Project");
        }

        await prisma.projects.delete({
            where: { id },
        });

        return NextResponse.json(
            { message: "Project and all associated resources deleted successfully" },
            { status: 200 }
        );
    } catch (error) {
        // Handle Prisma-specific "record not found" error
        if (isPrismaNotFoundError(error)) {
            return notFoundResponse("Project");
        }

        return handleDatabaseError(error, "deleting project");
    }
}


// === Helper Functions ===
/**
 * Creates a standardized unauthorized response
 * @returns 401 Unauthorized response
 */
function unauthorizedResponse() {
    return NextResponse.json(
        { error: "Unauthorized - Authentication required" },
        { status: 401 }
    );
}

/**
 * Creates a standardized not found response
 * @param entityName - Type of entity not found (e.g., "Project")
 * @returns 404 Not Found response
 */
function notFoundResponse(entityName: string) {
    return NextResponse.json(
        { error: `${entityName} not found or access denied` },
        { status: 404 }
    );
}

/**
 * Handles database errors with appropriate logging and responses
 * @param error - Error object from database operation
 * @param operation - Description of the failed operation
 * @returns 500 Internal Server Error response
 */
function handleDatabaseError(error: unknown, operation: string) {
    console.error(`Database error during ${operation}:`, error);
    return NextResponse.json(
        { error: "Internal server error - Please try again later" },
        { status: 500 }
    );
}

/**
 * Checks if error is a Prisma "RecordNotFound" error
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