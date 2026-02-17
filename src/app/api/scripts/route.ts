import { getServerSession } from "@/lib/auth/utils/get-session";
import { prisma } from "@/lib/db";
import { NextResponse } from "next/server";

/**
 * POST handler to create a new script for a project.
 *
 * This endpoint creates a new script within a user's project, along with an initial
 * graph structure. The user must own the target project to create a script within it.
 *
 * @param req - Incoming request with JSON body containing name and projectId
 * @returns The created script data if successful, otherwise appropriate error response
 *
 * @throws {Error} 400 Bad Request if required fields are missing or invalid
 * @throws {Error} 401 Unauthorized if no valid session
 * @throws {Error} 403 Forbidden if user doesn't own the project
 * @throws {Error} 404 Not Found if project doesn't exist
 * @throws {Error} 500 Internal Server Error for database issues
 */
export async function POST(req: Request) {
    try {
        const session = await getServerSession();
        if (!session) {
            return unauthorizedResponse();
        }

        const { name, projectId } = await validateScriptCreationRequest(req);

        const project = await verifyProjectOwnership(session.user.id, projectId);
        if (!project) {
            return notFoundResponse("Project");
        }

        const newScript = await createScriptWithInitialGraph(name, projectId);

        return NextResponse.json(newScript, { status: 201 });
    } catch (error) {
        if (error instanceof ScriptCreationValidationError) {
            return NextResponse.json(
                { error: error.message },
                { status: 400 }
            );
        }

        if (isPrismaNotFoundError(error)) {
            return notFoundResponse("Project");
        }

        return handleDatabaseError(error, "creating script");
    }
}


// === Helper Functions ===
/**
 * Custom error class for script creation validation failures
 */
class ScriptCreationValidationError extends Error {
    constructor(message: string) {
        super(message);
        this.name = "ScriptCreationValidationError";
    }
}

/**
 * Validates and processes the script creation request body
 *
 * @param req - Incoming request object
 * @returns Validated name and projectId
 * @throws {ScriptCreationValidationError} If validation fails
 */
async function validateScriptCreationRequest(req: Request) {
    const body = await req.json();

    // Check for empty body
    if (typeof body !== "object" || body === null) {
        throw new ScriptCreationValidationError(
            "Request body must be a JSON object"
        );
    }

    // Validate required fields
    if (!("name" in body)) {
        throw new ScriptCreationValidationError("Name is required");
    }

    if (!("projectId" in body)) {
        throw new ScriptCreationValidationError("Project ID is required");
    }

    // Validate name
    if (typeof body.name !== "string") {
        throw new ScriptCreationValidationError(
            "Script name must be a string"
        );
    }

    const trimmedName = body.name.trim();
    if (trimmedName.length === 0) {
        throw new ScriptCreationValidationError(
            "Script name cannot be empty"
        );
    }

    if (trimmedName.length > 100) {
        throw new ScriptCreationValidationError(
            "Script name cannot exceed 100 characters"
        );
    }

    // Validate projectId
    if (typeof body.projectId !== "string") {
        throw new ScriptCreationValidationError(
            "Project ID must be a string"
        );
    }

    if (body.projectId.trim().length === 0) {
        throw new ScriptCreationValidationError(
            "Project ID cannot be empty"
        );
    }

    return {
        name: trimmedName,
        projectId: body.projectId
    };
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
 * Creates a new script with an initial graph structure
 *
 * @param name - Name for the new script
 * @param projectId - ID of the parent project
 * @returns The created script with included graph data
 */
async function createScriptWithInitialGraph(name: string, projectId: string) {
    return prisma.scripts.create({
        data:{
            id: crypto.randomUUID(),
            name,
            projectId,
            graphs: {
                create: {
                    id: crypto.randomUUID(),
                    name: "Initial Graph",
                    nodes: [],
                    edges: [],
                },
            },
        },
        include: {
            graphs: true,
        },
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