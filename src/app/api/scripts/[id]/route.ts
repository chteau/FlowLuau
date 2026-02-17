import { getServerSession } from "@/lib/auth/utils/get-session";
import { prisma } from "@/lib/db";
import { NextResponse } from "next/server";

/**
 * PUT handler to update a script's name.
 *
 * @param req - Incoming request with JSON body containing the new name
 * @param context - Context containing route parameters including script ID
 * @param context.params - Route parameters with script ID
 *
 * @returns Updated script data if successful, otherwise appropriate error response
 *
 * @throws {Error} 400 Bad Request if name is missing or invalid
 * @throws {Error} 401 Unauthorized if no valid session
 * @throws {Error} 403 Forbidden if user doesn't own the script
 * @throws {Error} 404 Not Found if script doesn't exist
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
        const { name } = await validateScriptNameUpdate(req);

        const script = await authorizeScriptAccess(session.user.id, id);
        if (!script) {
            return notFoundResponse("Script");
        }

        const updatedScript = await prisma.scripts.update({
            where: { id },
            data: { name },
        });

        return NextResponse.json(updatedScript);
    } catch (error) {
        if (error instanceof ScriptNameValidationError) {
            return NextResponse.json(
                { error: error.message },
                { status: 400 }
            );
        }

        if (isPrismaNotFoundError(error)) {
            return notFoundResponse("Script");
        }

        return handleDatabaseError(error, "updating script");
    }
}


/**
 * DELETE handler to remove a script.
 *
 * @param req - Incoming request object
 * @param context - Context containing route parameters
 * @param context.params - Route parameters with script ID
 *
 * @returns Success message if deletion is successful, otherwise appropriate error response
 *
 * @throws {Error} 401 Unauthorized if no valid session
 * @throws {Error} 403 Forbidden if user doesn't own the script
 * @throws {Error} 404 Not Found if script doesn't exist
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

        const script = await authorizeScriptAccess(session.user.id, id);
        if (!script) {
            return notFoundResponse("Script");
        }

        await prisma.scripts.delete({
            where: { id },
        });

        return NextResponse.json(
            { message: "Script deleted successfully" },
            { status: 200 }
        );
    } catch (error) {
        if (isPrismaNotFoundError(error)) {
            return notFoundResponse("Script");
        }

        return handleDatabaseError(error, "deleting script");
    }
}


// === Helper Functions ===
/**
 * Custom error class for script name validation failures
 */
class ScriptNameValidationError extends Error {
    constructor(message: string) {
        super(message);
        this.name = "ScriptNameValidationError";
    }
}

/**
 * Validates and processes the script name update request
 * @param req - Incoming request object
 * @returns Validated script name
 * @throws {ScriptNameValidationError} If name validation fails
 */
async function validateScriptNameUpdate(req: Request) {
    const body = await req.json();

    // Check for empty body
    if (typeof body !== "object" || body === null) {
        throw new ScriptNameValidationError("Request body must be a JSON object");
    }

    // Check if name is provided
    if (!("name" in body)) {
        throw new ScriptNameValidationError("Name is required");
    }

    // Validate name type and content
    if (typeof body.name !== "string") {
        throw new ScriptNameValidationError("Script name must be a string");
    }

    const trimmedName = body.name.trim();
    if (trimmedName.length === 0) {
        throw new ScriptNameValidationError("Script name cannot be empty");
    }

    // Optional: Add length validation
    if (trimmedName.length > 100) {
        throw new ScriptNameValidationError("Script name cannot exceed 100 characters");
    }

    return { name: trimmedName };
}

/**
 * Creates a standardized unauthorized response
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
 * @param entityName - Type of entity not found (e.g., "Script")
 * @returns 404 Not Found response with descriptive message
 */
function notFoundResponse(entityName: string) {
    return NextResponse.json(
        { error: `${entityName} not found or you don't have permission to access it` },
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

/**
 * Ensures the user has permission to access a script.
 *
 * This function:
 * 1. Fetches the script with its associated project
 * 2. Verifies the script exists
 * 3. Checks if the project belongs to the current user
 *
 * @param userId - The ID of the authenticated user
 * @param scriptId - The ID of the script being accessed
 * @returns The script object if permission is granted, otherwise null
 *
 * @throws {Error} Database errors during query execution
 */
async function authorizeScriptAccess(userId: string, scriptId: string) {
    const script = await prisma.scripts.findUnique({
        where: { id: scriptId },
        include: {
            project: {
                select: {
                    userId: true
                }
            }
        },
    });

    // Return null if script doesn't exist or user doesn't own the project
    if (!script || script.project.userId !== userId) {
        return null;
    }

    return script;
}