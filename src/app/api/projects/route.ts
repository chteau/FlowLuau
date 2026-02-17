import { getServerSession } from "@/lib/auth/utils/get-session";
import { prisma } from "@/lib/db";
import { NextResponse } from "next/server";

/**
 * GET handler to retrieve all projects for the authenticated user.
 *
 * @returns Array of user's projects if authorized, otherwise appropriate error response
 *
 * @throws {Error} 401 Unauthorized if no valid session
 * @throws {Error} 500 Internal Server Error for database issues
 */
export async function GET() {
    try {
        const session = await getServerSession();
        if (!session) {
            return unauthorizedResponse();
        }

        const projects = await prisma.projects.findMany({
            where: { userId: session.user.id },
            orderBy: { createdAt: "desc" }
        });

        return NextResponse.json(projects);
    } catch (error) {
        return handleDatabaseError(error, "retrieving user projects");
    }
}


/**
 * POST handler to create a new project for the authenticated user.
 *
 * @param req - Incoming request with JSON body containing optional project name
 * @returns Created project data if successful, otherwise appropriate error response
 *
 * @throws {Error} 400 Bad Request if name is invalid
 * @throws {Error} 401 Unauthorized if no valid session
 * @throws {Error} 500 Internal Server Error for database issues
 */
export async function POST(req: Request) {
    try {
        const session = await getServerSession();
        if (!session) {
            return unauthorizedResponse();
        }

        const { name } = await validateProjectCreationRequest(req);

        const project = await prisma.projects.create({
            data: {
                id: crypto.randomUUID(),
                name,
                userId: session.user.id,
            },
        });

        return NextResponse.json(project, { status: 201 });
    } catch (error) {
        if (error instanceof InputValidationError) {
            return NextResponse.json(
                { error: error.message },
                { status: 400 }
            );
        }
        return handleDatabaseError(error, "creating new project");
    }
}


// === Helper Functions ===
/**
 * Custom error class for input validation failures
 */
class InputValidationError extends Error {
    constructor(message: string) {
        super(message);
        this.name = "InputValidationError";
    }
}

/**
 * Validates and processes the project creation request body
 * @param req - Incoming request object
 * @returns Validated project name
 * @throws {InputValidationError} If name is invalid
 */
async function validateProjectCreationRequest(req: Request) {
    const body = await req.json();

    // Handle empty body case
    if (typeof body !== "object" || body === null) {
        throw new InputValidationError("Request body must be a JSON object");
    }

    // Validate name if provided
    if ("name" in body) {
        if (typeof body.name !== "string") {
            throw new InputValidationError("Project name must be a string");
        }

        if (body.name.trim() === "") {
            throw new InputValidationError("Project name cannot be empty");
        }
    }

    return { name: body.name || "New Project" };
}

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
 * Handles database errors with appropriate logging and responses
 * @param error - Error object from database operation
 * @param operation - Description of the failed operation
 * @returns 500 Internal Server Error response
 */
function handleDatabaseError(error: unknown, operation: string) {
    console.error(`Database error during ${operation}:`,
        error instanceof Error ? error.message : error
    );

    return NextResponse.json(
        { error: "Internal server error - Please try again later" },
        { status: 500 }
    );
}