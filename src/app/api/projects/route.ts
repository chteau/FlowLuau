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
            orderBy: { createdAt: "desc" },
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

        const {
            name,
            description,
            universeId,
            color,
        } = await validateProjectCreationRequest(req);

        const project = await prisma.projects.create({
            data: {
                id: crypto.randomUUID(),
                name,
                description,
                robloxUniverseId: universeId,
                color,
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
    let gameUniverseId: string | null = null;

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

    // Validate description if provided
    if ("description" in body && body.description.trim()) {
        if (typeof body.description !== "string") {
            throw new InputValidationError("Project description must be a string");
        }
    }

    // Validate roblox game link
    if ("robloxGameURL" in body && body.robloxGameURL.trim()) {
        if (typeof body.robloxGameURL !== "string") {
            throw new InputValidationError("Roblox game URL must be a string");
        }

        const extractRobloxGameId = (url: string): number | null => {
            const match = url.match(/\/games\/(\d+)/);
            return match ? Number(match[1]) : null;
        };

        const gameId = extractRobloxGameId(body.robloxGameURL);
        if (!gameId) {
            throw new InputValidationError("Invalid Roblox game URL");
        }

        try {
            const gameResponse = await fetch(
                `https://apis.roblox.com/universes/v1/places/${gameId}/universe`
            );

            if (!gameResponse.ok) {
                "Roblox game not found";
            } else {
                const gameData = await gameResponse.json();
                if (!gameData.universeId) {
                    throw new InputValidationError("Roblox game not found");
                }

                gameUniverseId = gameData.universeId.toString();
            }
        } catch {
            throw new InputValidationError("Couldn't fetch Roblox game data");
        }
    }

    // Validate color if provided
    if ("color" in body) {
        if (typeof body.color !== "object") {
            throw new InputValidationError("Project color must be an object");
        }

        if (!body.color.background || !body.color.text) {
            throw new InputValidationError("Project color must have background and text properties");
        }
    }

    return {
        name: body.name || "New Project",
        description: body.description || "",
        universeId: gameUniverseId || "",
        color: body.color || {
            text: "text-secondary-foreground",
            background: "bg-secondary",
        },
    };
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